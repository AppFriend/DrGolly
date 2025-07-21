import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { klaviyoService } from "./klaviyo";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: true, // Force session save even if not modified
    saveUninitialized: true, // Save uninitialized sessions
    rolling: true, // Reset expiration on each request
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: 'lax', // Help with CSRF protection
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  const userData = {
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    subscriptionTier: "free",
    subscriptionStatus: "active",
    signupSource: "replit_auth",
    accountActivated: true,
    onboardingCompleted: false,
    signInCount: 1,
    lastSignIn: new Date(),
    lastLoginAt: new Date(),
  };

  try {
    const user = await storage.upsertUser(userData);
    
    // Comprehensive Klaviyo sync with all user data during signup/login
    if (user) {
      // Use background sync to avoid blocking the login process
      setImmediate(async () => {
        try {
          console.log(`Starting comprehensive Klaviyo sync for user: ${user.email}`);
          
          // Get comprehensive user data including children and course purchases
          const { user: fullUser, children, coursePurchases } = await storage.getUserWithChildren(user.id);
          
          // Sync with comprehensive data to Klaviyo
          await klaviyoService.syncUserToKlaviyo(fullUser, children, coursePurchases);
          
          console.log(`Klaviyo sync completed for user: ${user.email}`);
        } catch (error) {
          console.error("Failed to sync user to Klaviyo:", error);
          // Don't fail the signup process if Klaviyo sync fails
        }
      });
    }
    
    return user;
  } catch (error) {
    console.error("Failed to upsert user:", error);
    throw error;
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/signup", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  console.log('Auth middleware called for:', req.path);
  console.log('req.isAuthenticated():', req.isAuthenticated());
  console.log('user exists:', !!user);
  console.log('user.expires_at:', user?.expires_at);

  if (!req.isAuthenticated() || !user?.expires_at) {
    console.log('Authentication failed - missing auth or expires_at');
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  console.log('Current time:', now, 'Token expires at:', user.expires_at);
  
  if (now <= user.expires_at) {
    console.log('Token is still valid, proceeding');
    return next();
  }

  console.log('Token expired, attempting refresh');
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    console.log('No refresh token available');
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    console.log('Attempting to refresh token');
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    console.log('Token refreshed successfully');
    return next();
  } catch (error) {
    console.log('Token refresh failed:', error);
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
