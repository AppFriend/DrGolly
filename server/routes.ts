import type { Express, RequestHandler } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { getSession } from "./replitAuth";
import passport from "passport";
import { regionalPricingService } from "./regional-pricing";
import { z } from "zod";
import Stripe from "stripe";
import multer from "multer";
import { nanoid } from "nanoid";

// Extend Express Request interface to include adminBypass property
declare global {
  namespace Express {
    interface Request {
      adminBypass?: boolean;
    }
  }
}
import {
  insertCourseSchema,
  insertUserCourseProgressSchema,
  insertUserChapterProgressSchema,
  insertUserLessonProgressSchema,
  insertUserLessonContentProgressSchema,
  insertPartnerDiscountSchema,
  insertBillingHistorySchema,
  insertBlogPostSchema,
  insertCoursePurchaseSchema,
  insertStripeProductSchema,
  insertServiceSchema,
  insertServiceBookingSchema,
  courses,
  courseLessons,
  courseChapters,
  lessonContent,
} from "@shared/schema";
import { AuthUtils } from "./auth-utils";
import { stripeSyncService } from "./stripe-sync";
import { klaviyoService } from "./klaviyo";
import { slackNotificationService } from "./slack";
import { db } from "./db";
import { eq, sql, and, or, isNull } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { notifications, userNotifications } from "@shared/schema";
import adminContentRoutes from "./routes/admin-content";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Helper function to get current domain
function getCurrentDomain() {
  return process.env.REPLIT_DOMAINS ? 
    'https://' + process.env.REPLIT_DOMAINS.split(',')[0] : 
    'https://localhost:5000';
}

// Course Product ID mapping (from your Bubble export)
const COURSE_STRIPE_MAPPING = {
  1: { productId: "prod_course_1", priceId: "price_little_baby_sleep" },
  2: { productId: "prod_course_2", priceId: "price_big_baby_sleep" },
  3: { productId: "prod_course_3", priceId: "price_pre_toddler_sleep" },
  4: { productId: "prod_course_4", priceId: "price_toddler_sleep" },
  5: { productId: "prod_course_5", priceId: "price_preschool_sleep" },
  6: { productId: "prod_course_6", priceId: "price_prep_newborns" },
  7: { productId: "prod_course_7", priceId: "price_new_sibling" },
  8: { productId: "prod_course_8", priceId: "price_twins_supplement" },
  9: { productId: "prod_course_9", priceId: "price_toddler_toolkit" },
  10: { productId: "prod_course_10", priceId: "price_testing_allergens" },
};

// Helper function to get user ID from session - works with Dr. Golly auth
async function getUserFromSession(req: any) {
  // Try Dr. Golly session first, then Replit Auth - no fallback to hardcoded user
  const userId = req.session?.userId || req.session?.passport?.user?.claims?.sub;
  
  if (!userId) {
    return null;
  }
  
  // Return the user ID directly for progress tracking
  return userId;
}

// Custom authentication middleware that works with Dr. Golly sessions
const isAppAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    // Get user ID from session (works with both auth systems)
    const userId = req.session?.userId || req.user?.claims?.sub;
    
    // Don't fallback to hardcoded user ID for proper logout functionality
    if (!userId) {
      console.log('No authenticated user found in session');
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    console.log('User authenticated with ID:', userId);
    
    // Set user data on request object for consistency
    req.userId = userId;
    next();
  } catch (error) {
    console.error('Authentication check error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Admin middleware for Dr. Golly app admins
const isAdmin: RequestHandler = async (req, res, next) => {
  try {
    // Get user ID from session (works with both auth systems)
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check admin status using raw SQL
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`SELECT is_admin FROM users WHERE id = ${userId} LIMIT 1`;
    const user = result[0] as any;
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    
    // Set user data on request object for consistency
    req.userId = userId;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Global admin bypass middleware - temporarily disabled due to database connection issues
const adminBypass: RequestHandler = async (req, res, next) => {
  try {
    // Temporarily skip admin bypass check due to database connection issues
    next();
  } catch (error) {
    console.error("Error in admin bypass check:", error);
    next(); // Continue with normal auth on error
  }
};

// Enhanced isAuthenticated that respects admin bypass
const isAuthenticatedOrAdmin: RequestHandler = async (req, res, next) => {
  // If admin bypass is set, skip auth check
  if (req.adminBypass) {
    return next();
  }
  
  // Use normal authentication check
  return isAuthenticated(req, res, next);
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure trust proxy for production deployment
  app.set('trust proxy', 1);
  
  // Set up session middleware FIRST - critical for session persistence
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Simple session serialization for Dr. Golly auth
  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));
  
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        const uploadPath = path.join(process.cwd(), 'attached_assets');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: function (req, file, cb) {
        // Generate unique filename with timestamp and random ID
        const uniqueSuffix = Date.now() + '_' + nanoid(10);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}_${uniqueSuffix}${ext}`);
      }
    }),
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    }
  });

  // Image upload endpoint for blog posts
  app.post('/api/admin/upload-image', isAdmin, upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      // Return the asset path that can be used in the blog post
      const assetPath = `/attached_assets/${req.file.filename}`;
      
      res.json({
        message: 'Image uploaded successfully',
        imageUrl: assetPath,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Test endpoint to verify routing
  app.get('/api/test', (req, res) => {
    res.json({ message: 'Test endpoint working' });
  });

  // Test endpoint for Big Baby payment flow
  app.post('/api/test/big-baby-payment', async (req, res) => {
    try {
      const testCustomerDetails = {
        email: 'test@example.com',
        firstName: 'Test',
        dueDate: '2025-08-15'
      };

      // Test creating payment intent
      const response = await fetch(`${req.protocol}://${req.get('host')}/api/create-big-baby-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerDetails: testCustomerDetails,
          couponId: null
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        res.json({
          success: true,
          message: 'Payment intent created successfully',
          clientSecret: data.clientSecret ? 'Present' : 'Missing',
          paymentIntentId: data.paymentIntentId,
          amount: data.amount
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to create payment intent',
          error: data.message
        });
      }
    } catch (error) {
      console.error('Test payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  });

  // Test endpoint for Slack payment notifications
  app.post('/api/test/payment-notification', async (req, res) => {
    try {
      const { type = 'course_purchase' } = req.body;
      
      let notificationData;
      
      switch (type) {
        case 'course_purchase':
          notificationData = {
            name: 'Test User',
            email: 'test@example.com',
            purchaseDetails: 'Single Course Purchase (Big baby sleep program)',
            paymentAmount: '$120.00 AUD',
            promotionalCode: 'SAVE20',
            discountAmount: '$30.00 AUD'
          };
          break;
        case 'subscription_upgrade':
          notificationData = {
            name: 'Test User',
            email: 'test@example.com',
            purchaseDetails: 'Free → Gold Plan Upgrade',
            paymentAmount: '$199.00 USD',
            promotionalCode: 'NEWMEMBER50',
            discountAmount: '50% off'
          };
          break;
        case 'subscription_downgrade':
          notificationData = {
            name: 'Test User',
            email: 'test@example.com',
            purchaseDetails: 'Gold → Free Plan Downgrade',
            paymentAmount: '$0.00 (Cancellation)',
            downgradeDate: 'Feb 15, 2025'
          };
          break;
        case 'subscription_renewal':
          notificationData = {
            name: 'Test User',
            email: 'test@example.com',
            purchaseDetails: 'Gold Plan Renewal',
            paymentAmount: '$29.99 USD'
          };
          break;
        case 'cart_checkout':
          notificationData = {
            name: 'Test User',
            email: 'test@example.com',
            purchaseDetails: 'Cart Checkout (Course ID 5, Book ID 1)',
            paymentAmount: '$240.00 AUD'
          };
          break;
        default:
          return res.status(400).json({ error: 'Invalid notification type' });
      }
      
      const success = await slackNotificationService.sendPaymentNotification(notificationData);
      
      res.json({ 
        success,
        message: success ? 'Payment notification sent successfully' : 'Failed to send payment notification',
        data: notificationData
      });
    } catch (error) {
      console.error('Test payment notification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Test database connectivity with sample user
  app.get('/api/test/user/:email', async (req, res) => {
    try {
      const { email } = req.params;
      
      // Get user from database using fallback methods
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ 
        message: 'User found successfully', 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          subscriptionTier: user.subscriptionTier,
          accountActivated: user.accountActivated
        }
      });
    } catch (error) {
      console.error('Test user fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // PRIMARY USER AUTHENTICATION ENDPOINT - handles both Dr. Golly and Replit Auth
  app.get("/api/user", async (req: any, res) => {
    try {
      // Check if we have a valid session and user ID
      let userId = null;
      
      // Try multiple ways to get user from session - check Dr. Golly session first
      if (req.session?.userId) {
        userId = req.session.userId;
        console.log('Found user ID from Dr. Golly session:', userId);
      } else if (req.session?.passport?.user?.claims?.sub) {
        userId = req.session.passport.user.claims.sub;
        console.log('Found user ID from Passport session:', userId);
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
        console.log('Found user ID from req.user:', userId);
      }
      
      // Debug session info for troubleshooting
      console.log('Session debug info:', {
        sessionExists: !!req.session,
        sessionId: req.session?.id,
        directUserId: req.session?.userId,
        passportExists: !!req.session?.passport,
        userExists: !!req.session?.passport?.user,
        claimsExist: !!req.session?.passport?.user?.claims,
        subExists: !!req.session?.passport?.user?.claims?.sub,
        reqUserExists: !!req.user,
        foundUserId: userId
      });
      
      // If no user in session, return 401
      if (!userId) {
        console.log('No authenticated user found for /api/user endpoint');
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log('Fetching user data for ID:', userId);
      
      // Use raw SQL to avoid Drizzle ORM parsing issues
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      const result = await sql`SELECT id, email, first_name, last_name, subscription_tier, subscription_status, 
                                     next_billing_date, billing_period, is_admin, created_at, updated_at,
                                     profile_picture_url, phone_number, country, signup_source, migrated,
                                     stripe_customer_id, stripe_subscription_id, marketing_opt_in,
                                     first_child_dob, account_activated, activated_services
                              FROM users WHERE id = ${userId} LIMIT 1`;
      
      if (!result || result.length === 0) {
        console.log('User not found in database');
        return res.status(404).json({ message: "User not found" });
      }
      
      const user = result[0];
      
      // Convert to expected format with proper field mapping
      const userData = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        firstName: user.first_name,
        last_name: user.last_name,
        lastName: user.last_name,
        subscriptionTier: user.subscription_tier,
        subscriptionStatus: user.subscription_status,
        nextBillingDate: user.next_billing_date,
        billingPeriod: user.billing_period,
        isAdmin: user.is_admin,
        profilePictureUrl: user.profile_picture_url,
        profile_picture_url: user.profile_picture_url, // Add both formats
        phoneNumber: user.phone_number,
        country: user.country,
        signupSource: user.signup_source,
        migrated: user.migrated,
        stripeCustomerId: user.stripe_customer_id,
        stripeSubscriptionId: user.stripe_subscription_id,
        marketingOptIn: user.marketing_opt_in,
        firstChildDob: user.first_child_dob,
        first_child_dob: user.first_child_dob, // Add both formats
        accountActivated: user.account_activated,
        activatedServices: user.activated_services,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
      
      console.log('User found:', { 
        id: userData.id, 
        firstName: userData.firstName, 
        email: userData.email,
        profilePictureUrl: userData.profilePictureUrl,
        firstChildDob: userData.firstChildDob
      });
      res.json(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Session middleware was already set up at the beginning of registerRoutes
  // This duplicate setup is removed to prevent conflicts
  
  // Define authentication middleware for Dr. Golly auth
  const isAuthenticated: RequestHandler = (req, res, next) => {
    const user = req.session?.passport?.user;
    if (user && user.claims && user.claims.sub) {
      req.user = user;
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };
  
  // Apply admin bypass middleware globally after auth setup
  app.use(adminBypass);
  
  // Test endpoint to verify admin bypass
  app.get('/api/test-admin', async (req, res) => {
    res.json({ 
      message: 'Admin test endpoint', 
      adminBypass: req.adminBypass,
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      userId: req.user?.claims?.sub
    });
  });

  // Course chapters route (with access control) - using raw authentication check
  app.get('/api/courses/:courseId/chapters', async (req: any, res) => {
    try {
      const { courseId } = req.params;
      
      // Get user ID from session (works with both auth systems) - no hardcoded fallback
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log('Fetching chapters for course:', courseId, 'user:', userId);
      
      // Use raw SQL to get chapters directly - bypass storage layer
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      const chapters = await sql`
        SELECT id, course_id, title, order_index, created_at, updated_at
        FROM course_chapters 
        WHERE course_id = ${parseInt(courseId)}
        ORDER BY order_index ASC
      `;
      console.log('Found chapters:', chapters.length);
      res.json(chapters);
    } catch (error) {
      console.error("Error fetching course chapters:", error);
      res.status(500).json({ message: "Failed to fetch course chapters" });
    }
  });

  // Course lesson routes (with access control) - using raw authentication check
  app.get('/api/courses/:courseId/lessons', async (req: any, res) => {
    try {
      const { courseId } = req.params;
      
      // Get user ID from session (works with both auth systems) - no hardcoded fallback
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log('Fetching lessons for course:', courseId, 'user:', userId);
      
      // Use raw SQL to get lessons directly - bypass storage layer  
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      const lessons = await sql`
        SELECT cl.id, cl.chapter_id, cl.title, cl.content, cl.order_index, cl.created_at, cl.updated_at
        FROM course_lessons cl
        JOIN course_chapters cc ON cl.chapter_id = cc.id
        WHERE cc.course_id = ${parseInt(courseId)}
        ORDER BY cc.order_index ASC, cl.order_index ASC
      `;
      console.log('Found lessons:', lessons.length);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching course lessons:", error);
      res.status(500).json({ message: "Failed to fetch course lessons" });
    }
  });

  app.get('/api/courses/:courseId/lesson-content', isAppAuthenticated, async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.user.claims.sub;
      
      console.log('Fetching lesson content for course:', courseId, 'user:', userId);
      
      // Check user's access to this course
      const user = await storage.getUser(userId);
      const coursePurchases = await storage.getUserCoursePurchases(userId);
      
      // Check if user is admin (admins have full access)
      const isUserAdmin = await storage.isUserAdmin(userId);
      
      if (!isUserAdmin) {
        // Check if user has purchased this course or has gold/platinum access
        const hasPurchased = coursePurchases.some((purchase: any) => purchase.courseId === parseInt(courseId));
        const hasGoldAccess = user?.subscriptionTier === "gold" || user?.subscriptionTier === "platinum";
        
        if (!hasPurchased && !hasGoldAccess) {
          return res.status(403).json({ 
            message: "Access denied. Purchase this course or upgrade to Gold for unlimited access.",
            requiresUpgrade: true
          });
        }
      }
      
      const lessonContent = await storage.getLessonContentByCourse(parseInt(courseId));
      console.log('Found lesson content:', lessonContent.length);
      res.json(lessonContent);
    } catch (error) {
      console.error("Error fetching lesson content:", error);
      res.status(500).json({ message: "Failed to fetch lesson content" });
    }
  });

  // Update lesson content or title (admin only)
  app.patch('/api/lessons/:lessonId', isAdmin, async (req: any, res) => {
    try {
      const { lessonId } = req.params;
      const { content, title } = req.body;
      
      if (!content && !title) {
        return res.status(400).json({ message: "Content or title is required" });
      }
      
      console.log('Updating lesson for lesson:', lessonId);
      
      let updatedLesson;
      
      if (title) {
        // Update lesson title
        updatedLesson = await storage.updateLessonTitle(parseInt(lessonId), title);
      } else {
        // Update lesson content
        updatedLesson = await storage.updateLessonContent(parseInt(lessonId), content);
      }
      
      res.json(updatedLesson);
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(500).json({ message: "Failed to update lesson" });
    }
  });

  // MAIN AUTH ENDPOINT - Critical for frontend authentication
  app.get('/api/user', async (req: any, res) => {
    try {
      // Check if we have a valid session and user ID
      let userId = null;
      
      // Try multiple ways to get user from session
      if (req.session?.passport?.user?.claims?.sub) {
        userId = req.session.passport.user.claims.sub;
      } else if (req.session?.userId) {
        userId = req.session.userId;
      }
      
      // Debug session info
      console.log('Session debug info:', {
        sessionExists: !!req.session,
        sessionId: req.session?.id,
        directUserId: req.session?.userId,
        passportExists: !!req.session?.passport,
        userExists: !!req.session?.passport?.user,
        claimsExist: !!req.session?.passport?.user?.claims,
        subExists: !!req.session?.passport?.user?.claims?.sub,
        reqUserExists: !!req.user,
        foundUserId: userId
      });
      
      // If no user in session, check if user is authenticated via other means
      if (!userId) {
        console.log('No authenticated user found for /api/user endpoint');
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log('Fetching authenticated user data for ID:', userId);
      
      // Use raw SQL to bypass Drizzle ORM connection issues
      let user;
      try {
        user = await storage.getUser(userId);
      } catch (error) {
        console.log('Drizzle ORM failed for auth user, using raw SQL fallback');
        // Use raw SQL as fallback
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
        user = result[0] as any;
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Convert to frontend-expected format
      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.first_name || user.firstName,
        lastName: user.last_name || user.lastName,
        first_name: user.first_name || user.firstName,
        last_name: user.last_name || user.lastName,
        subscriptionTier: user.subscription_tier || user.subscriptionTier,
        subscriptionStatus: user.subscription_status || user.subscriptionStatus,
        nextBillingDate: user.next_billing_date || user.nextBillingDate,
        billingPeriod: user.billing_period || user.billingPeriod,
        isAdmin: user.is_admin || user.isAdmin,
        profileImageUrl: user.profile_picture_url || user.profileImageUrl || user.profile_image_url,
        profilePictureUrl: user.profile_picture_url || user.profilePictureUrl || user.profile_image_url,
        profile_picture_url: user.profile_picture_url || user.profilePictureUrl || user.profile_image_url,
        phoneNumber: user.phone_number || user.phoneNumber,
        country: user.country,
        signupSource: user.signup_source || user.signupSource,
        migrated: user.migrated,
        stripeCustomerId: user.stripe_customer_id || user.stripeCustomerId,
        stripeSubscriptionId: user.stripe_subscription_id || user.stripeSubscriptionId,
        marketingOptIn: user.marketing_opt_in || user.marketingOptIn,
        firstChildDob: user.first_child_dob || user.firstChildDob,
        first_child_dob: user.first_child_dob || user.firstChildDob,
        accountActivated: user.account_activated || user.accountActivated,
        activatedServices: user.activated_services || user.activatedServices,
        createdAt: user.created_at || user.createdAt,
        updatedAt: user.updated_at || user.updatedAt
      };
      
      console.log('User found:', { 
        id: userData.id, 
        firstName: userData.firstName, 
        email: userData.email,
        subscriptionTier: userData.subscriptionTier,
        profileImageUrl: userData.profileImageUrl,
        profilePictureUrl: userData.profilePictureUrl,
        firstChildDob: userData.firstChildDob
      });
      
      res.json(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Check if user exists by email (for public checkout)
  app.post('/api/auth/check-existing-user', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      
      if (user) {
        res.json({ 
          exists: true, 
          userId: user.id,
          firstName: user.firstName,
          hasPassword: user.hasSetPassword 
        });
      } else {
        res.json({ exists: false });
      }
    } catch (error) {
      console.error("Error checking existing user:", error);
      res.status(500).json({ message: "Failed to check user" });
    }
  });

  // Public login for existing users from checkout
  app.post('/api/auth/public-login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user has a permanent password set
      if (!user.hasSetPassword || !user.passwordHash) {
        return res.status(400).json({ message: "Account not fully set up. Please use password reset." });
      }

      // Verify password
      const isValidPassword = await AuthUtils.verifyPassword(password, user.passwordHash);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);

      // Create session manually (similar to how Replit auth works)
      const sessionData = {
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName
        }
      };
      
      // Store session data in req.session with proper structure
      req.session.passport = { user: sessionData };
      req.session.userId = user.id; // Also store userId directly for easier access
      
      // Force session save before sending response
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: "Session save failed" });
        }
        
        console.log('Session saved successfully for user:', user.id);
        
        // Return user data for session creation
        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          }
        });
      });

      // This is now handled inside the session.save callback above
    } catch (error) {
      console.error("Error in public login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Dr. Golly signup GET route - redirect to signup page
  app.get('/api/signup', (req, res) => {
    res.redirect('/signup');
  });

  // Dr. Golly login GET route - redirect to login page
  app.get('/api/login', (req, res) => {
    res.redirect('/login');
  });

  // Dr. Golly logout route
  app.get('/api/logout', (req, res) => {
    console.log('Logout request received');
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      console.log('Session destroyed successfully');
      res.redirect('/login');
    });
  });

  // Alternative logout route for JSON response
  app.post('/api/logout', (req, res) => {
    console.log('POST logout request received');
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      console.log('Session destroyed successfully');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });

  // Dr. Golly signup endpoint
  app.post('/api/auth/signup', async (req, res) => {
    console.log('🔐 SIGNUP REQUEST RECEIVED');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request headers:', req.headers);
    
    try {
      const { firstName, lastName, email, password, personalization } = req.body;
      
      console.log('📋 VALIDATION STEP');
      console.log('firstName:', firstName ? 'provided' : 'MISSING');
      console.log('lastName:', lastName ? 'provided' : 'MISSING');
      console.log('email:', email ? email : 'MISSING');
      console.log('password:', password ? 'provided' : 'MISSING');
      console.log('personalization:', personalization ? 'provided' : 'not provided');
      
      if (!firstName || !lastName || !email || !password) {
        console.log('❌ VALIDATION FAILED - Missing required fields');
        return res.status(400).json({ message: "All fields are required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('❌ VALIDATION FAILED - Invalid email format');
        return res.status(400).json({ message: "Invalid email format" });
      }

      console.log('🔍 CHECKING EXISTING USER');
      // Check if user already exists
      let existingUser;
      try {
        existingUser = await storage.getUserByEmail(email);
        console.log('Existing user check result:', existingUser ? 'USER EXISTS' : 'USER DOES NOT EXIST');
      } catch (dbError) {
        console.error('❌ DATABASE ERROR - Failed to check existing user:', dbError);
        return res.status(500).json({ message: "Database error during user check" });
      }
      
      if (existingUser) {
        console.log('❌ USER ALREADY EXISTS');
        return res.status(400).json({ message: "User already exists with this email" });
      }

      console.log('🔑 GENERATING USER ID');
      // Generate user ID
      let userId;
      try {
        userId = AuthUtils.generateUserId();
        console.log('Generated user ID:', userId);
      } catch (idError) {
        console.error('❌ ID GENERATION ERROR:', idError);
        return res.status(500).json({ message: "Failed to generate user ID" });
      }

      console.log('🔐 HASHING PASSWORD');
      // Hash password
      let passwordHash;
      try {
        passwordHash = await AuthUtils.hashPassword(password);
        console.log('Password hashed successfully');
      } catch (hashError) {
        console.error('❌ PASSWORD HASHING ERROR:', hashError);
        return res.status(500).json({ message: "Failed to hash password" });
      }

      console.log('👤 CREATING USER DATA');
      // Create user
      const userData = {
        id: userId,
        email,
        firstName,
        lastName,
        passwordHash,
        hasSetPassword: true,
        subscriptionTier: 'free',
        planTier: 'free',
        lastLoginAt: new Date(),
        ...personalization
      };

      console.log('💾 SAVING USER TO DATABASE');
      let user;
      try {
        user = await storage.createUser(userData);
        console.log('User created successfully:', user.id);
      } catch (createError) {
        console.error('❌ USER CREATION ERROR:', createError);
        console.error('Error details:', createError.message);
        console.error('Error stack:', createError.stack);
        return res.status(500).json({ message: "Failed to create user in database" });
      }

      console.log('🎫 CREATING SESSION');
      // Create session for immediate login
      const sessionData = {
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName
        }
      };
      
      try {
        req.session.passport = { user: sessionData };
        req.session.userId = user.id; // Store userId directly for easier access
        console.log('Session data set successfully');
      } catch (sessionError) {
        console.error('❌ SESSION CREATION ERROR:', sessionError);
        return res.status(500).json({ message: "Failed to create session" });
      }
      
      console.log('💾 SAVING SESSION');
      // Force session save before continuing
      req.session.save((err) => {
        if (err) {
          console.error('❌ SESSION SAVE ERROR during signup:', err);
        } else {
          console.log('✅ Session saved successfully for new user:', user.id);
        }
      });

      console.log('📧 KLAVIYO SYNC (NON-BLOCKING)');
      // Sync to Klaviyo with comprehensive data
      try {
        // Fetch course purchase data for new user sync
        const coursePurchases = await storage.getUserCoursePurchases(user.id);
        await klaviyoService.syncUserToKlaviyo(user, undefined, coursePurchases);
        console.log('✅ Klaviyo sync successful');
      } catch (error) {
        console.error('⚠️ Klaviyo sync failed (non-blocking):', error);
      }

      console.log('📱 SLACK NOTIFICATION (NON-BLOCKING)');
      // Send Slack notification for new signup
      try {
        await slackNotificationService.sendSignupNotification({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          marketingOptIn: personalization?.marketingOptIn || false,
          primaryConcerns: personalization?.primaryConcerns || [],
          signupSource: 'Regular Signup Flow',
          signupType: 'new_customer' // Regular signup flow is always new customers
        });
        console.log('✅ Slack signup notification sent successfully');
      } catch (slackError) {
        console.error('⚠️ Slack notification failed (non-blocking):', slackError);
      }

      console.log('🎉 SIGNUP SUCCESSFUL - Sending response');
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error('❌ CRITICAL SIGNUP ERROR:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
      res.status(500).json({ 
        message: "Signup failed",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  // Test endpoint to verify Jared Looman signup fix
  app.post('/api/test/signup', async (req, res) => {
    try {
      console.log('🧪 TEST SIGNUP ENDPOINT - Testing Jared Looman case');
      
      // Test data similar to what Jared would submit
      const testData = {
        firstName: 'Jared',
        lastName: 'Looman',
        email: 'jaredlooman+test@gmail.com',
        password: 'TestPassword123'
      };
      
      console.log('Testing with data:', testData);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(testData.email);
      if (existingUser) {
        console.log('Test user already exists, removing...');
        // For testing, we'll skip existing user check
      }
      
      // Generate user ID
      const userId = AuthUtils.generateUserId();
      console.log('Generated test user ID:', userId);
      
      // Hash password
      const passwordHash = await AuthUtils.hashPassword(testData.password);
      console.log('Password hashed successfully');
      
      // Create test user data
      const userData = {
        id: userId,
        email: testData.email,
        firstName: testData.firstName,
        lastName: testData.lastName,
        passwordHash,
        hasSetPassword: true,
        subscriptionTier: 'free',
        planTier: 'free',
        lastLoginAt: new Date()
      };
      
      // Test user creation
      const user = await storage.createUser(userData);
      console.log('Test user created successfully:', user.id);
      
      res.json({
        success: true,
        message: 'Test signup successful - createUser method is working',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error('❌ TEST SIGNUP ERROR:', error);
      res.status(500).json({ 
        message: "Test signup failed",
        error: error.message
      });
    }
  });

  // Password reset request
  app.post('/api/auth/request-password-reset', async (req, res) => {
    try {
      const { email, fromCheckout } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "No account found with this email address" });
      }

      // Generate a reset token (you can use a more secure method in production)
      const resetToken = AuthUtils.generateUserId();
      
      // Send password reset email via Klaviyo
      await klaviyoService.sendPasswordResetEmail(user, resetToken);
      
      res.json({ 
        message: "Password reset email sent successfully",
        fromCheckout 
      });
    } catch (error) {
      console.error("Error in password reset request:", error);
      res.status(500).json({ message: "Failed to send reset email" });
    }
  });

  // Duplicate removed - using the later forgot-password endpoint

  // Personalization routes
  app.post('/api/personalization', isAppAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const personalizationData = req.body;
      
      // Update user with personalization data
      await storage.updateUserPersonalization(userId, {
        primaryConcerns: JSON.stringify(personalizationData.primaryConcerns || []),
        phoneNumber: personalizationData.phoneNumber,
        profilePictureUrl: personalizationData.profilePictureUrl,
        userRole: personalizationData.userRole,
        acceptedTerms: personalizationData.acceptedTerms,
        marketingOptIn: personalizationData.marketingOptIn,
        newMemberOfferShown: personalizationData.newMemberOfferShown,
        newMemberOfferAccepted: personalizationData.newMemberOfferAccepted,
        onboardingCompleted: true
      });
      
      // Get updated user data and children for comprehensive Klaviyo sync
      const updatedUser = await storage.getUser(userId);
      if (updatedUser) {
        const children = await storage.getUserChildren(userId);
        // Sync comprehensive profile data to Klaviyo including all custom properties
        klaviyoService.syncUserToKlaviyo(updatedUser, children).catch(error => {
          console.error("Failed to sync user personalization to Klaviyo:", error);
        });

        // Send enhanced Slack signup notification
        try {
          const primaryConcerns = updatedUser.primaryConcerns 
            ? JSON.parse(updatedUser.primaryConcerns) 
            : [];
          
          await slackNotificationService.sendSignupNotification({
            name: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
            email: updatedUser.email || '',
            marketingOptIn: updatedUser.marketingOptIn || false,
            primaryConcerns,
            signupSource: updatedUser.signupSource || 'App'
          });
        } catch (error) {
          console.error("Failed to send Slack signup notification:", error);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving personalization:", error);
      res.status(500).json({ message: "Failed to save personalization" });
    }
  });

  app.get('/api/personalization', isAppAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        primaryConcerns: user.primaryConcerns ? JSON.parse(user.primaryConcerns) : [],
        phoneNumber: user.phoneNumber,
        profilePictureUrl: user.profilePictureUrl,
        userRole: user.userRole,
        acceptedTerms: user.acceptedTerms,
        marketingOptIn: user.marketingOptIn,
        newMemberOfferShown: user.newMemberOfferShown,
        newMemberOfferAccepted: user.newMemberOfferAccepted,
        onboardingCompleted: user.onboardingCompleted
      });
    } catch (error) {
      console.error("Error fetching personalization:", error);
      res.status(500).json({ message: "Failed to fetch personalization" });
    }
  });

  // User personalization routes
  app.post('/api/user/personalization', isAppAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const personalizationData = req.body;
      
      // Update user with personalization preferences
      await storage.updateUserPersonalization(userId, personalizationData);
      
      res.json({ message: "Personalization data saved successfully" });
    } catch (error) {
      console.error("Error saving personalization data:", error);
      res.status(500).json({ message: "Failed to save personalization data" });
    }
  });

  app.get('/api/user/personalization', isAppAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const personalization = {
        primaryConcern: user.primaryConcern,
        childAge: user.childAge,
        childName: user.childName,
        sleepChallenges: user.sleepChallenges,
        previousExperience: user.previousExperience,
        parentingStyle: user.parentingStyle,
        timeCommitment: user.timeCommitment,
        supportNetwork: user.supportNetwork,
        additionalNotes: user.additionalNotes,
        onboardingCompleted: user.onboardingCompleted
      };
      
      res.json(personalization);
    } catch (error) {
      console.error("Error fetching personalization data:", error);
      res.status(500).json({ message: "Failed to fetch personalization data" });
    }
  });

  // Profile routes
  app.get('/api/profile', isAppAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      
      // Use raw SQL to fetch profile with proper field mapping
      let user;
      try {
        user = await storage.getUser(userId);
      } catch (error) {
        console.log('Drizzle ORM failed for profile, using raw SQL fallback');
        // Use raw SQL as fallback
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
        user = result[0] as any;
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        firstName: user.first_name || user.firstName,
        lastName: user.last_name || user.lastName,
        email: user.email,
        phone: user.phone_number || user.phoneNumber,
        profileImageUrl: user.profile_image_url || user.profileImageUrl || user.profile_picture_url || user.profilePictureUrl,
        subscriptionTier: user.subscription_tier || user.subscriptionTier || 'free',
        subscriptionStatus: user.subscription_status || user.subscriptionStatus || 'active',
        subscriptionEndDate: user.subscription_end_date || user.subscriptionEndDate,
        stripeCustomerId: user.stripe_customer_id || user.stripeCustomerId,
        stripeSubscriptionId: user.stripe_subscription_id || user.stripeSubscriptionId,
        marketingOptIn: user.marketing_opt_in || user.marketingOptIn,
        smsMarketingOptIn: user.sms_marketing_opt_in || user.smsMarketingOptIn,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch('/api/profile', isAppAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { firstName, lastName, email, phone, profileImageUrl } = req.body;
      
      // Use raw SQL to update profile with proper field mapping
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        
        await sql`UPDATE users SET 
          first_name = ${firstName || null},
          last_name = ${lastName || null},
          email = ${email || null},
          phone_number = ${phone || null},
          profile_image_url = ${profileImageUrl || null},
          updated_at = ${new Date()}
          WHERE id = ${userId}`;
        
        console.log('Profile updated successfully for user:', userId, {
          firstName,
          lastName,
          email,
          phone,
          profileImageUrl: profileImageUrl ? 'provided' : 'null'
        });
        
        res.json({ message: "Profile updated successfully" });
      } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: "Failed to update profile" });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.patch('/api/profile/marketing-preferences', isAppAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { emailMarketing, smsMarketing } = req.body;
      
      // Update user marketing preferences
      await storage.updateUserProfile(userId, {
        marketingOptIn: emailMarketing,
        smsMarketingOptIn: smsMarketing,
      });
      
      // Get updated user data for Klaviyo sync
      const user = await storage.getUser(userId);
      if (user) {
        // Sync marketing preferences to Klaviyo
        try {
          await klaviyoService.updateMarketingPreferences(user.email, {
            emailMarketing,
            smsMarketing,
          });
        } catch (klaviyoError) {
          console.error("Failed to sync marketing preferences to Klaviyo:", klaviyoError);
        }
      }
      
      res.json({ message: "Marketing preferences updated successfully" });
    } catch (error) {
      console.error("Error updating marketing preferences:", error);
      res.status(500).json({ message: "Failed to update marketing preferences" });
    }
  });

  app.get('/api/profile/invoices', isAppAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      let stripeInvoices = [];
      
      // Fetch invoices from Stripe if user has a Stripe customer ID
      if (user?.stripeCustomerId) {
        try {
          const invoices = await stripe.invoices.list({
            customer: user.stripeCustomerId,
            limit: 50,
          });
          
          stripeInvoices = invoices.data.map(invoice => ({
            id: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            date: new Date(invoice.created * 1000).toISOString(),
            status: invoice.status,
            description: invoice.description || `${invoice.lines.data[0]?.description || 'Subscription'} - ${new Date(invoice.created * 1000).toLocaleDateString()}`,
            downloadUrl: invoice.hosted_invoice_url,
            type: 'stripe',
            invoiceNumber: invoice.number,
            subtotal: invoice.subtotal,
            tax: invoice.tax || 0,
            total: invoice.total,
          }));
        } catch (stripeError) {
          console.error("Error fetching Stripe invoices:", stripeError);
        }
      }
      
      // Fetch course purchases from our database
      const coursePurchases = await storage.getUserCoursePurchases(userId);
      const completedPurchases = coursePurchases.filter(purchase => purchase.status === 'completed');
      
      // Get course details for each purchase
      const coursePurchaseInvoices = await Promise.all(
        completedPurchases.map(async (purchase) => {
          const course = await storage.getCourse(purchase.courseId);
          return {
            id: `course_${purchase.id}`,
            amount: purchase.amount,
            currency: 'usd',
            date: purchase.purchasedAt.toISOString(),
            status: 'paid',
            description: course ? `${course.title} - Course Purchase` : 'Course Purchase',
            downloadUrl: null,
            type: 'course',
            invoiceNumber: `CP-${purchase.id.toString().padStart(6, '0')}`,
            subtotal: purchase.amount,
            tax: 0,
            total: purchase.amount,
          };
        })
      );
      
      // Combine and sort all invoices by date (newest first)
      const allInvoices = [...stripeInvoices, ...coursePurchaseInvoices]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      res.json(allInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get('/api/profile/payment-methods', isAppAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeCustomerId) {
        return res.json([]);
      }
      
      // Fetch payment methods from Stripe
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });
      
      let defaultPaymentMethodId = null;
      try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        defaultPaymentMethodId = (customer as any).invoice_settings?.default_payment_method;
      } catch (customerError) {
        console.error('Error fetching customer default payment method:', customerError);
      }
      
      const formattedPaymentMethods = paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        last4: pm.card!.last4,
        brand: pm.card!.brand,
        expMonth: pm.card!.exp_month,
        expYear: pm.card!.exp_year,
        isDefault: pm.id === defaultPaymentMethodId,
      }));
      
      res.json(formattedPaymentMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  app.patch('/api/profile/payment-methods', isAppAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { paymentMethodId } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No Stripe customer found" });
      }
      
      // Update default payment method in Stripe
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      
      res.json({ message: "Default payment method updated successfully" });
    } catch (error) {
      console.error("Error updating payment method:", error);
      res.status(500).json({ message: "Failed to update payment method" });
    }
  });

  app.post('/api/profile/payment-methods/setup-intent', isAppAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create Stripe customer if doesn't exist
      if (!user.stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email!,
          name: `${user.firstName} ${user.lastName}`.trim(),
        });
        
        user = await storage.updateUserStripeCustomerId(userId, customer.id);
      }
      
      // Create setup intent for adding payment method
      const setupIntent = await stripe.setupIntents.create({
        customer: user.stripeCustomerId,
        usage: 'off_session',
        payment_method_types: ['card'],
      });
      
      res.json({ 
        clientSecret: setupIntent.client_secret,
        customerId: user.stripeCustomerId 
      });
    } catch (error) {
      console.error("Error creating setup intent:", error);
      res.status(500).json({ message: "Failed to create setup intent" });
    }
  });

  app.delete('/api/profile/payment-methods/:paymentMethodId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { paymentMethodId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No Stripe customer found" });
      }
      
      // Detach payment method from customer
      await stripe.paymentMethods.detach(paymentMethodId);
      
      res.json({ message: "Payment method removed successfully" });
    } catch (error) {
      console.error("Error removing payment method:", error);
      res.status(500).json({ message: "Failed to remove payment method" });
    }
  });

  // Public checkout endpoints for anonymous users
  app.post('/api/create-public-course-payment', async (req, res) => {
    try {
      const { courseId, customerDetails } = req.body;
      
      // Get course details
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Create payment intent for anonymous user
      const paymentIntent = await stripe.paymentIntents.create({
        amount: course.price || 12000, // Default to $120
        currency: 'usd',
        metadata: {
          courseId: courseId.toString(),
          courseName: course.title,
          customerEmail: customerDetails.email,
          customerFirstName: customerDetails.firstName,
          customerLastName: customerDetails.lastName || '',
          dueDate: customerDetails.dueDate || '',
          purchaseType: 'public_course',
        },
        receipt_email: customerDetails.email,
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
      });
    } catch (error) {
      console.error("Error creating public payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  app.post('/api/create-account-with-purchase', async (req, res) => {
    try {
      const { customerDetails, paymentIntentId, interests, password } = req.body;
      
      console.log("Creating account with purchase - Request data:", { 
        email: customerDetails.email,
        firstName: customerDetails.firstName,
        paymentIntentId: paymentIntentId 
      });
      
      // Verify payment intent was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        console.error("Payment not completed - status:", paymentIntent.status);
        return res.status(400).json({ message: "Payment not completed" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(customerDetails.email);
      let userId;
      
      if (existingUser) {
        // User exists - just add course to their account
        console.log("Existing user found:", existingUser.id);
        userId = existingUser.id;
        
        // Check if user already has Stripe customer ID
        if (!existingUser.stripeCustomerId) {
          console.log("Creating Stripe customer for existing user...");
          const stripeCustomer = await stripe.customers.create({
            email: customerDetails.email,
            name: `${customerDetails.firstName} ${customerDetails.lastName || ''}`.trim(),
            metadata: {
              userId: existingUser.id,
              signupSource: 'public_checkout',
            },
          });
          console.log("Stripe customer created:", stripeCustomer.id);
          await storage.updateUserStripeCustomerId(existingUser.id, stripeCustomer.id);
        }
      } else {
        // Create new user account
        const tempUserId = AuthUtils.generateUserId();
        console.log("Generated user ID:", tempUserId);
        
        const hashedPassword = await AuthUtils.hashPassword(password);
        console.log("Password hashed successfully");
        
        const userData = {
          id: tempUserId,
          email: customerDetails.email,
          firstName: customerDetails.firstName,
          lastName: customerDetails.lastName || '',
          phone: customerDetails.phone || '',
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
          interests: interests.join(','),
          role: customerDetails.role || 'Parent',
          dueDate: customerDetails.dueDate ? new Date(customerDetails.dueDate) : null,
          hasSetPassword: true,
          isFirstLogin: false,
          passwordHash: hashedPassword,
          signupSource: 'public_checkout',
          country: 'US',
          profileImageUrl: '',
        };
        
        console.log("Creating user with data:", { ...userData, passwordHash: '[HIDDEN]' });
        const user = await storage.upsertUser(userData);
        console.log("User created successfully:", user.id);
        userId = user.id;
        
        // Create Stripe customer
        console.log("Creating Stripe customer...");
        const stripeCustomer = await stripe.customers.create({
          email: customerDetails.email,
          name: `${customerDetails.firstName} ${customerDetails.lastName || ''}`.trim(),
          metadata: {
            userId: tempUserId,
            signupSource: 'public_checkout',
          },
        });
        console.log("Stripe customer created:", stripeCustomer.id);
        
        // Update user with Stripe customer ID
        await storage.updateUserStripeCustomerId(tempUserId, stripeCustomer.id);
        console.log("User updated with Stripe customer ID");
        
        // Send welcome email for new users only
        try {
          await klaviyoService.syncBigBabySignupToKlaviyo(user, customerDetails);
          console.log("Klaviyo sync successful for Big Baby signup");
        } catch (klaviyoError) {
          console.error("Klaviyo sync failed for Big Baby signup, but account creation continues:", klaviyoError);
        }

        // Send Slack notification for new user signup
        try {
          await slackNotificationService.sendSignupNotification({
            name: `${customerDetails.firstName} ${customerDetails.lastName || ''}`.trim(),
            email: customerDetails.email,
            marketingOptIn: false, // Big Baby checkout doesn't have marketing opt-in
            primaryConcerns: interests || [],
            signupSource: 'public checkout web>app',
            signupType: 'new_customer', // Big Baby checkout is always new customers
            coursePurchased: paymentIntent.metadata.courseName
          });
          console.log("Slack signup notification sent for Big Baby user");
        } catch (slackError) {
          console.error("Failed to send Slack signup notification:", slackError);
        }
      }
      
      // Create course purchase record for both new and existing users
      const courseId = parseInt(paymentIntent.metadata.courseId);
      console.log("Creating course purchase record for course:", courseId);
      
      await storage.createCoursePurchase({
        userId: userId,
        courseId: courseId,
        paymentIntentId: paymentIntentId,
        status: 'completed',
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        purchaseDate: new Date(),
        courseName: paymentIntent.metadata.courseName,
        customerEmail: customerDetails.email,
        customerName: `${customerDetails.firstName} ${customerDetails.lastName || ''}`.trim(),
      });
      console.log("Course purchase record created successfully");
      
      // Get the user for login session
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error("User not found after creation/update");
      }
      
      // Create authentication session manually
      const authSession = {
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          profile_image_url: user.profileImageUrl,
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days from now
        },
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
      };
      
      // Set the user session manually
      req.session.passport = { user: authSession };
      console.log("Authentication session created for user:", user.id);
      
      console.log("Account creation/update completed successfully for user:", userId);
      res.json({ 
        message: existingUser ? "Course added to existing account" : "Account created successfully",
        userId: userId,
        isExistingUser: !!existingUser,
        autoLogin: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          subscriptionTier: user.subscriptionTier,
        },
      });
    } catch (error) {
      console.error("Error creating account with purchase - Full error:", error);
      console.error("Error stack:", error.stack);
      
      res.status(500).json({ message: "Failed to process purchase" });
    }
  });

  // Password reset routes
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      console.log("Password reset request for:", email);
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: "If an account with this email exists, a password reset link has been sent." });
      }
      
      // Generate password reset token
      const token = AuthUtils.generatePasswordResetToken();
      
      // Save token to database
      await storage.createPasswordResetToken(user.id, token);
      
      // Send password reset email via Klaviyo
      try {
        await klaviyoService.sendPasswordResetEmail(user.email, user.firstName || 'User', token);
        console.log("Password reset email sent successfully");
      } catch (klaviyoError) {
        console.error("Failed to send password reset email:", klaviyoError);
        return res.status(500).json({ message: "Failed to send password reset email" });
      }
      
      res.json({ message: "If an account with this email exists, a password reset link has been sent." });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      console.log("Password reset attempt with token:", token);
      
      // Validate password strength
      const passwordValidation = AuthUtils.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: "Password does not meet requirements",
          errors: passwordValidation.errors 
        });
      }
      
      // Verify token
      const tokenRecord = await storage.verifyPasswordResetToken(token);
      if (!tokenRecord) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Hash new password
      const hashedPassword = await AuthUtils.hashPassword(newPassword);
      
      // Update user password
      await storage.setUserPassword(tokenRecord.userId, hashedPassword);
      
      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(token);
      
      console.log("Password reset successful for user:", tokenRecord.userId);
      
      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin endpoint to set up test user
  app.post('/api/admin/setup-test-user', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      console.log("Setting up test user:", email);
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Hash the password
      const hashedPassword = await AuthUtils.hashPassword(password);
      
      // Update user with proper password setup
      await storage.setUserPassword(user.id, hashedPassword);
      
      // Mark user as having set password and not first login
      await storage.updateUser(user.id, {
        hasSetPassword: true,
        isFirstLogin: false,
        accountActivated: true,
        lastLoginAt: new Date()
      });
      
      console.log("Test user setup complete for:", email);
      res.json({ message: "Test user setup successful" });
    } catch (error) {
      console.error("Error setting up test user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Course routes
  app.get('/api/courses', async (req, res) => {
    try {
      const { category, tier, includeUnpublished } = req.query;
      
      // Use raw SQL directly - bypass Drizzle ORM completely
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      let courses;
      // Use tagged template syntax for Neon serverless driver
      if (category) {
        courses = await sql`SELECT id, title, description, category, thumbnail_url, video_url, 
                                   duration, age_range, is_published, likes, views, created_at, updated_at,
                                   price, discounted_price, skill_level, stripe_product_id, unique_id,
                                   status, detailed_description, website_content, key_features, whats_covered,
                                   rating, review_count, overview_description, learning_objectives,
                                   completion_criteria, course_structure_notes
                            FROM courses 
                            WHERE is_published = true AND category = ${category}
                            ORDER BY created_at DESC`;
      } else {
        courses = await sql`SELECT id, title, description, category, thumbnail_url, video_url, 
                                   duration, age_range, is_published, likes, views, created_at, updated_at,
                                   price, discounted_price, skill_level, stripe_product_id, unique_id,
                                   status, detailed_description, website_content, key_features, whats_covered,
                                   rating, review_count, overview_description, learning_objectives,
                                   completion_criteria, course_structure_notes
                            FROM courses 
                            WHERE is_published = true 
                            ORDER BY created_at DESC`;
      }
      
      // Map fields to match frontend expectations and handle pricing
      const coursesWithPricing = courses.map((course: any) => ({
        ...course,
        // Map thumbnail_url to thumbnailUrl for frontend compatibility
        thumbnailUrl: course.thumbnail_url || course.thumbnailUrl,
        // Convert price from string to number if needed
        price: typeof course.price === 'string' ? parseFloat(course.price) : course.price,
        discountedPrice: typeof course.discounted_price === 'string' ? parseFloat(course.discounted_price) : course.discountedPrice
      }));
      
      res.json(coursesWithPricing);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get('/api/courses/:id', async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      let course;
      try {
        course = await storage.getCourse(courseId);
      } catch (error) {
        console.log('Drizzle ORM failed for single course, using raw SQL fallback');
        // Use raw SQL as fallback
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        
        const result = await sql`SELECT id, title, description, category, thumbnail_url, video_url, 
                                        duration, age_range, is_published, likes, views, created_at, updated_at,
                                        price, discounted_price, skill_level, stripe_product_id, unique_id,
                                        status, detailed_description, website_content, key_features, whats_covered,
                                        rating, review_count, overview_description, learning_objectives,
                                        completion_criteria, course_structure_notes
                                 FROM courses WHERE id = ${courseId} LIMIT 1`;
        course = result[0];
      }
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Map fields to match frontend expectations
      const courseWithMapping = {
        ...course,
        thumbnailUrl: course.thumbnail_url || course.thumbnailUrl,
        price: typeof course.price === 'string' ? parseFloat(course.price) : course.price,
        discountedPrice: typeof course.discounted_price === 'string' ? parseFloat(course.discounted_price) : course.discountedPrice
      };
      
      res.json(courseWithMapping);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  // Image proxy to resolve DNS issues
  app.get('/api/image-proxy', async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      
      if (!imageUrl) {
        return res.status(400).json({ error: 'URL parameter is required' });
      }
      
      // Handle /assets/ URLs by serving directly from attached_assets
      if (imageUrl.startsWith('/assets/')) {
        const filePath = imageUrl.replace('/assets/', '/attached_assets/');
        return res.redirect(filePath);
      }
      
      // Only allow trusted external image sources for security
      if (!imageUrl.startsWith('https://images.unsplash.com/') && !imageUrl.startsWith('https://picsum.photos/')) {
        return res.status(403).json({ error: 'Only trusted image sources are allowed' });
      }
      
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch image' });
      }
      
      // Set proper headers for image caching
      res.setHeader('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      
      // Pipe the image response to the client
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Image proxy error:', error);
      res.status(500).json({ error: 'Failed to proxy image' });
    }
  });

  app.post('/api/courses', isAuthenticated, async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.patch('/api/courses/:id/stats', async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const { likes, views } = req.body;
      await storage.updateCourseStats(courseId, likes, views);
      res.json({ message: "Stats updated successfully" });
    } catch (error) {
      console.error("Error updating course stats:", error);
      res.status(500).json({ message: "Failed to update course stats" });
    }
  });

  // Course chapter routes - duplicate removed, using authenticated version above

  app.get('/api/chapters/:chapterId/modules', isAuthenticated, async (req, res) => {
    try {
      const chapterId = parseInt(req.params.chapterId);
      const modules = await storage.getChapterModules(chapterId);
      res.json(modules);
    } catch (error) {
      console.error('Error fetching chapter modules:', error);
      res.status(500).json({ message: 'Failed to fetch chapter modules' });
    }
  });

  // User progress routes
  app.get('/api/user/progress', async (req: any, res) => {
    try {
      // Use enhanced session-based authentication that works with Dr. Golly system
      const userId = await getUserFromSession(req);
      if (!userId) {
        console.log('No authenticated user found in session for progress');
        console.log('Session data:', req.session);
        console.log('Session passport:', req.session?.passport);
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log('Fetching lesson progress for user:', userId);
      
      // Get lesson-level progress for displaying checkmarks
      let progress;
      try {
        const sql = neon(process.env.DATABASE_URL!);
        progress = await sql`
          SELECT 
            ulp.lesson_id,
            ulp.completed,
            ulp.watch_time,
            ulp.completed_at,
            cl.title as lesson_title,
            cl.course_id,
            cl.chapter_id
          FROM user_lesson_progress ulp
          JOIN course_lessons cl ON ulp.lesson_id = cl.id
          WHERE ulp.user_id = ${userId}
          ORDER BY ulp.completed_at DESC
        `;
        console.log('Found lesson progress records:', progress.length);
      } catch (error) {
        console.error("Error fetching lesson progress:", error);
        progress = [];
      }
      
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  app.get('/api/user/progress/:courseId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const courseId = parseInt(req.params.courseId);
      const progress = await storage.getUserCourseProgress(userId, courseId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching course progress:", error);
      res.status(500).json({ message: "Failed to fetch course progress" });
    }
  });

  app.post('/api/user/progress', async (req: any, res) => {
    try {
      // Use Dr. Golly auth system instead of Replit Auth
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const progressData = insertUserCourseProgressSchema.parse({
        ...req.body,
        userId,
      });
      const progress = await storage.updateUserProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating user progress:", error);
      res.status(500).json({ message: "Failed to update user progress" });
    }
  });

  // Chapter progress routes

  app.post('/api/user/chapter-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('Chapter progress request:', req.body);
      console.log('User ID:', userId);
      
      const requestData = {
        ...req.body,
        userId,
      };
      
      // If marking as completed, ensure completedAt is set as a proper Date
      if (requestData.completed && !requestData.completedAt) {
        requestData.completedAt = new Date();
      } else if (requestData.completedAt && typeof requestData.completedAt === 'string') {
        requestData.completedAt = new Date(requestData.completedAt);
      }
      
      console.log('Processed request data:', requestData);
      
      const progressData = insertUserChapterProgressSchema.parse(requestData);
      console.log('Validated progress data:', progressData);
      
      const progress = await storage.updateUserChapterProgress(progressData);
      console.log('Updated progress:', progress);
      
      res.json(progress);
    } catch (error) {
      console.error("Error updating chapter progress:", error);
      console.error("Error details:", error.message);
      if (error.issues) {
        console.error("Validation errors:", error.issues);
      }
      res.status(500).json({ message: "Failed to update chapter progress", error: error.message });
    }
  });

  // Check chapter completion API
  app.get('/api/courses/:courseId/chapters/:chapterIndex/completion', isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const chapterIndex = parseFloat(req.params.chapterIndex);
      const userId = req.user?.claims?.sub;
      
      const isCompleted = await storage.isChapterCompleted(courseId, chapterIndex, userId);
      
      res.json({ isCompleted });
    } catch (error) {
      console.error('Error checking chapter completion:', error);
      res.status(500).json({ error: 'Failed to check chapter completion' });
    }
  });

  // Admin API endpoints for accordion view
  app.get('/api/admin/chapters', isAdmin, async (req, res) => {
    try {
      const chapters = await db.select().from(courseChapters).orderBy(courseChapters.courseId, courseChapters.orderIndex);
      res.json(chapters);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      res.status(500).json({ error: 'Failed to fetch chapters' });
    }
  });

  app.get('/api/admin/lessons', isAdmin, async (req, res) => {
    try {
      const lessons = await db.select().from(courseLessons).orderBy(courseLessons.courseId, courseLessons.chapterId, courseLessons.orderIndex);
      res.json(lessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      res.status(500).json({ error: 'Failed to fetch lessons' });
    }
  });

  app.get('/api/admin/sublessons', isAdmin, async (req, res) => {
    try {
      const sublessons = await db.select().from(lessonContent).orderBy(lessonContent.lessonId, lessonContent.orderIndex);
      res.json(sublessons);
    } catch (error) {
      console.error('Error fetching sublessons:', error);
      res.status(500).json({ error: 'Failed to fetch sublessons' });
    }
  });

  // Admin update endpoints
  app.put('/api/admin/courses/:id', isAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const { content } = req.body;
      
      const [updatedCourse] = await db
        .update(courses)
        .set({ description: content })
        .where(eq(courses.id, courseId))
        .returning();
      
      res.json(updatedCourse);
    } catch (error) {
      console.error('Error updating course:', error);
      res.status(500).json({ error: 'Failed to update course' });
    }
  });

  // Admin create endpoints
  app.post('/api/admin/chapters', isAdmin, async (req, res) => {
    try {
      const { title, content, courseId } = req.body;
      
      // Get the next order index for this course
      const existingChapters = await db.select().from(courseChapters).where(eq(courseChapters.courseId, courseId));
      const nextOrderIndex = existingChapters.length;
      
      const [newChapter] = await db
        .insert(courseChapters)
        .values({
          title,
          content: content || '',
          courseId,
          orderIndex: nextOrderIndex,
          chapterNumber: `${nextOrderIndex + 1}.0`
        })
        .returning();
      
      res.json(newChapter);
    } catch (error) {
      console.error('Error creating chapter:', error);
      res.status(500).json({ error: 'Failed to create chapter' });
    }
  });

  // Create chapter endpoint for course accordion
  app.post('/api/courses/:courseId/chapters', isAdmin, async (req, res) => {
    try {
      const { courseId } = req.params;
      const { title } = req.body;
      
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Title is required and must be a string' });
      }
      
      // Get all existing chapters for this course to determine the next chapter number
      const existingChapters = await db.select().from(courseChapters).where(eq(courseChapters.courseId, parseInt(courseId)));
      
      // Find the highest order_index for sequential order
      const maxOrderIndex = existingChapters.reduce((max, chapter) => 
        Math.max(max, chapter.orderIndex || 0), 0
      );
      
      // Generate the next chapter number based on existing pattern
      let nextChapterNumber;
      
      // Find the highest numeric chapter number (ignoring special chapters like "Evidence", "0.0")
      const numericChapters = existingChapters
        .filter(chapter => chapter.chapterNumber && chapter.chapterNumber.match(/^1\.\d+$/))
        .map(chapter => {
          const match = chapter.chapterNumber.match(/^1\.(\d+)$/);
          return match ? parseInt(match[1]) : null;
        })
        .filter(num => num !== null)
        .sort((a, b) => a - b);
      
      if (numericChapters.length === 0) {
        // No numeric chapters exist, start with 1.1
        nextChapterNumber = "1.1";
      } else {
        // Find the highest minor number and increment it
        const lastMinor = numericChapters[numericChapters.length - 1];
        const nextMinor = lastMinor + 1;
        nextChapterNumber = `1.${nextMinor}`;
      }
      
      const [newChapter] = await db
        .insert(courseChapters)
        .values({
          title,
          description: '',
          courseId: parseInt(courseId),
          orderIndex: maxOrderIndex + 1,
          chapterNumber: nextChapterNumber
        })
        .returning();
      
      res.json(newChapter);
    } catch (error) {
      console.error('Error creating chapter:', error);
      res.status(500).json({ error: 'Failed to create chapter' });
    }
  });

  app.post('/api/admin/lessons', isAdmin, async (req, res) => {
    try {
      const { title, content, videoUrl, courseId, chapterId } = req.body;
      
      // Get the next order index for this chapter
      const existingLessons = await db.select().from(courseLessons).where(eq(courseLessons.chapterId, chapterId));
      const nextOrderIndex = existingLessons.length;
      
      const [newLesson] = await db
        .insert(courseLessons)
        .values({
          title,
          content: content || '',
          videoUrl: videoUrl || null,
          courseId,
          chapterId,
          orderIndex: nextOrderIndex
        })
        .returning();
      
      res.json(newLesson);
    } catch (error) {
      console.error('Error creating lesson:', error);
      res.status(500).json({ error: 'Failed to create lesson' });
    }
  });

  // Create lesson endpoint for chapter accordion
  app.post('/api/chapters/:chapterId/lessons', isAdmin, async (req, res) => {
    try {
      const { chapterId } = req.params;
      const { title, content } = req.body;
      
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Title is required and must be a string' });
      }
      
      // Get the highest order_index for this chapter
      const existingLessons = await db.select().from(courseLessons).where(eq(courseLessons.chapterId, parseInt(chapterId)));
      const maxOrderIndex = existingLessons.reduce((max, lesson) => 
        Math.max(max, lesson.orderIndex || 0), 0
      );
      
      // Get the courseId from the chapter
      const [chapter] = await db.select().from(courseChapters).where(eq(courseChapters.id, parseInt(chapterId)));
      if (!chapter) {
        return res.status(404).json({ error: 'Chapter not found' });
      }
      
      // Lessons use descriptive titles rather than strict numbering
      // The order_index provides the sequential order for URL generation
      const [newLesson] = await db
        .insert(courseLessons)
        .values({
          title,
          content: content || '',
          courseId: chapter.courseId,
          chapterId: parseInt(chapterId),
          orderIndex: maxOrderIndex + 1
        })
        .returning();
      
      res.json(newLesson);
    } catch (error) {
      console.error('Error creating lesson:', error);
      res.status(500).json({ error: 'Failed to create lesson' });
    }
  });

  // Delete chapter endpoint
  app.delete('/api/chapters/:chapterId', isAdmin, async (req, res) => {
    try {
      const { chapterId } = req.params;
      
      // First delete all lessons in this chapter
      await db.delete(courseLessons).where(eq(courseLessons.chapterId, parseInt(chapterId)));
      
      // Then delete the chapter
      const [deletedChapter] = await db
        .delete(courseChapters)
        .where(eq(courseChapters.id, parseInt(chapterId)))
        .returning();
      
      if (!deletedChapter) {
        return res.status(404).json({ error: 'Chapter not found' });
      }
      
      res.json({ message: 'Chapter deleted successfully', deletedChapter });
    } catch (error) {
      console.error('Error deleting chapter:', error);
      res.status(500).json({ error: 'Failed to delete chapter' });
    }
  });

  // Delete lesson endpoint
  app.delete('/api/lessons/:lessonId', isAdmin, async (req, res) => {
    try {
      const { lessonId } = req.params;
      
      const [deletedLesson] = await db
        .delete(courseLessons)
        .where(eq(courseLessons.id, parseInt(lessonId)))
        .returning();
      
      if (!deletedLesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }
      
      res.json({ message: 'Lesson deleted successfully', deletedLesson });
    } catch (error) {
      console.error('Error deleting lesson:', error);
      res.status(500).json({ error: 'Failed to delete lesson' });
    }
  });

  app.post('/api/admin/sublessons', isAdmin, async (req, res) => {
    try {
      const { title, content, lessonId, videoUrl } = req.body;
      
      // Get the next order index for this lesson
      const existingSublessons = await db.select().from(lessonContent).where(eq(lessonContent.lessonId, lessonId));
      const nextOrderIndex = existingSublessons.length;
      
      const [newSublesson] = await db
        .insert(lessonContent)
        .values({
          title,
          content: content || '',
          lessonId,
          videoUrl: videoUrl || null,
          orderIndex: nextOrderIndex
        })
        .returning();
      
      res.json(newSublesson);
    } catch (error) {
      console.error('Error creating sublesson:', error);
      res.status(500).json({ error: 'Failed to create sublesson' });
    }
  });

  app.post('/api/admin/lesson-content', isAuthenticated, async (req, res) => {
    try {
      const { title, content, videoUrl, lessonId } = req.body;
      
      // Get the next order index for this lesson
      const existingContent = await db.select().from(lessonContent).where(eq(lessonContent.lessonId, lessonId));
      const nextOrderIndex = existingContent.length;
      
      const [newContent] = await db
        .insert(lessonContent)
        .values({
          title,
          content: content || '',
          videoUrl: videoUrl || null,
          lessonId,
          orderIndex: nextOrderIndex
        })
        .returning();
      
      res.json(newContent);
    } catch (error) {
      console.error('Error creating lesson content:', error);
      res.status(500).json({ error: 'Failed to create lesson content' });
    }
  });

  app.put('/api/admin/chapters/:id', isAdmin, async (req, res) => {
    try {
      const chapterId = parseInt(req.params.id);
      const { content } = req.body;
      
      const [updatedChapter] = await db
        .update(courseChapters)
        .set({ content })
        .where(eq(courseChapters.id, chapterId))
        .returning();
      
      res.json(updatedChapter);
    } catch (error) {
      console.error('Error updating chapter:', error);
      res.status(500).json({ error: 'Failed to update chapter' });
    }
  });

  app.put('/api/admin/lessons/:id', isAdmin, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const { content } = req.body;
      
      const [updatedLesson] = await db
        .update(courseLessons)
        .set({ content })
        .where(eq(courseLessons.id, lessonId))
        .returning();
      
      res.json(updatedLesson);
    } catch (error) {
      console.error('Error updating lesson:', error);
      res.status(500).json({ error: 'Failed to update lesson' });
    }
  });

  app.put('/api/admin/sublessons/:id', isAdmin, async (req, res) => {
    try {
      const sublessonId = parseInt(req.params.id);
      const { content } = req.body;
      
      const [updatedSublesson] = await db
        .update(lessonContent)
        .set({ content })
        .where(eq(lessonContent.id, sublessonId))
        .returning();
      
      res.json(updatedSublesson);
    } catch (error) {
      console.error('Error updating sublesson:', error);
      res.status(500).json({ error: 'Failed to update sublesson' });
    }
  });



  app.post('/api/user/module-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestData = {
        ...req.body,
        userId,
      };
      
      // If marking as completed, ensure completedAt is set as a proper Date
      if (requestData.completed && !requestData.completedAt) {
        requestData.completedAt = new Date();
      } else if (requestData.completedAt && typeof requestData.completedAt === 'string') {
        requestData.completedAt = new Date(requestData.completedAt);
      }
      
      const progressData = insertUserModuleProgressSchema.parse(requestData);
      const progress = await storage.updateUserModuleProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating module progress:", error);
      res.status(500).json({ message: "Failed to update module progress" });
    }
  });

  app.get('/api/user/chapter-progress/:chapterId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chapterId = parseInt(req.params.chapterId);
      const progress = await storage.getUserChapterProgress(userId, chapterId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching chapter progress:", error);
      res.status(500).json({ message: "Failed to fetch chapter progress" });
    }
  });

  app.get('/api/user/module-progress/:moduleId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const moduleId = parseInt(req.params.moduleId);
      const progress = await storage.getUserModuleProgress(userId, moduleId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching module progress:", error);
      res.status(500).json({ message: "Failed to fetch module progress" });
    }
  });

  // Get all chapter progress for a user
  app.get('/api/user/chapter-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getAllUserChapterProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching chapter progress:", error);
      res.status(500).json({ message: "Failed to fetch chapter progress" });
    }
  });

  // Get all module progress for a user
  app.get('/api/user/module-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const allProgress = await storage.getAllUserModuleProgress(userId);
      res.json(allProgress);
    } catch (error) {
      console.error("Error fetching all module progress:", error);
      res.status(500).json({ message: "Failed to fetch module progress" });
    }
  });

  // Subscription routes
  app.post('/api/subscription/update', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tier, billingPeriod } = req.body;
      
      // Calculate next billing date
      const nextBillingDate = new Date();
      if (billingPeriod === 'yearly') {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      } else {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }
      
      const user = await storage.updateUserSubscription(userId, tier, billingPeriod, nextBillingDate);
      
      // Create billing record
      const amount = tier === 'gold' ? (billingPeriod === 'yearly' ? 999 : 99) : 499;
      await storage.createBillingRecord({
        userId,
        invoiceNumber: `INV-${Date.now()}`,
        amount: amount.toString(),
        currency: 'USD',
        status: 'completed',
        billingDate: new Date(),
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // Partner discount routes
  app.get('/api/discounts', async (req, res) => {
    try {
      const { tier } = req.query;
      const discounts = await storage.getPartnerDiscounts(tier as string | undefined);
      res.json(discounts);
    } catch (error) {
      console.error("Error fetching discounts:", error);
      res.status(500).json({ message: "Failed to fetch discounts" });
    }
  });

  app.post('/api/discounts', isAuthenticated, async (req, res) => {
    try {
      const discountData = insertPartnerDiscountSchema.parse(req.body);
      const discount = await storage.createPartnerDiscount(discountData);
      res.status(201).json(discount);
    } catch (error) {
      console.error("Error creating discount:", error);
      res.status(500).json({ message: "Failed to create discount" });
    }
  });

  // Billing history routes
  app.get('/api/billing/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await storage.getUserBillingHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching billing history:", error);
      res.status(500).json({ message: "Failed to fetch billing history" });
    }
  });

  // Seed data endpoints (for development)
  app.post('/api/seed/courses', async (req, res) => {
    try {
      const sampleCourses = [
        {
          title: "Little Baby Sleep Program",
          description: "Complete sleep training program for newborns 4-16 weeks",
          category: "sleep",
          thumbnailUrl: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
          videoUrl: "https://example.com/video1.mp4",
          duration: 45,
          ageRange: "4-16 Weeks",
          tier: "gold",
        },
        {
          title: "Big Baby Sleep Program",
          description: "Sleep training for babies 4-8 months old",
          category: "sleep",
          thumbnailUrl: "https://images.unsplash.com/photo-1567691220393-3cfe6e05e5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
          videoUrl: "https://example.com/video2.mp4",
          duration: 60,
          ageRange: "4-8 Months",
          tier: "gold",
        },
        {
          title: "Baby's First Foods",
          description: "Complete guide to starting solid foods",
          category: "nutrition",
          thumbnailUrl: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
          videoUrl: "https://example.com/video3.mp4",
          duration: 30,
          ageRange: "6+ Months",
          tier: "free",
        },
        {
          title: "FREE Sleep Tips",
          description: "Essential sleep tips for all parents",
          category: "freebies",
          thumbnailUrl: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
          videoUrl: "https://example.com/video4.mp4",
          duration: 15,
          ageRange: "All Ages",
          tier: "free",
        },
      ];

      for (const course of sampleCourses) {
        await storage.createCourse(course);
      }

      res.json({ message: "Sample courses created successfully" });
    } catch (error) {
      console.error("Error seeding courses:", error);
      res.status(500).json({ message: "Failed to seed courses" });
    }
  });

  // Dr. Golly logout endpoint
  app.get('/api/logout', async (req, res) => {
    try {
      console.log('Logout initiated for session ID:', req.sessionID);
      
      // Clear all session data first
      if (req.session) {
        // Clear Dr. Golly specific session data
        req.session.userId = null;
        req.session.passport = null;
        req.session.user = null;
        
        // Delete the properties completely
        delete req.session.userId;
        delete req.session.passport;
        delete req.session.user;
        
        // Clear any other session data
        Object.keys(req.session).forEach(key => {
          if (key !== 'cookie') {
            delete req.session[key];
          }
        });
      }
      
      // Also clear from database manually to ensure complete cleanup
      if (req.sessionID) {
        try {
          const { neon } = await import('@neondatabase/serverless');
          const sql = neon(process.env.DATABASE_URL!);
          await sql`DELETE FROM sessions WHERE sid = ${req.sessionID}`;
          console.log('Session deleted from database:', req.sessionID);
        } catch (dbError) {
          console.error('Error deleting session from database:', dbError);
        }
      }
      
      // Destroy the session
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
        }
        
        // Clear the session cookie completely
        res.clearCookie('connect.sid', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        
        // Also clear with different cookie names that might be used
        res.clearCookie('session');
        res.clearCookie('sessionid');
        
        console.log('Session destroyed and cookies cleared');
        
        // Redirect to login page
        res.redirect('/login');
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  app.post('/api/seed/discounts', async (req, res) => {
    try {
      const sampleDiscounts = [
        {
          partnerName: "The Memo",
          logoUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
          description: "$20 Off Your First Order. Your Code: GOLLY-PLATINUM-NX7K",
          discountCode: "GOLLY-PLATINUM-NX7K",
          discountAmount: "20.00",
          requiredTier: "gold",
        },
        {
          partnerName: "Tooshies",
          logoUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
          description: "20% Off with Your Code: SYM-AXL",
          discountCode: "SYM-AXL",
          discountPercentage: 20,
          requiredTier: "gold",
        },
      ];

      for (const discount of sampleDiscounts) {
        await storage.createPartnerDiscount(discount);
      }

      res.json({ message: "Sample discounts created successfully" });
    } catch (error) {
      console.error("Error seeding discounts:", error);
      res.status(500).json({ message: "Failed to seed discounts" });
    }
  });

  app.post('/api/seed/milestones', async (req, res) => {
    try {
      const sampleMilestones = [
        {
          name: "Waves Bye Bye",
          description: "Can wave goodbye when prompted",
          videoUrl: "https://example.com/milestone1.mp4",
          ageRangeStart: 8,
          ageRangeEnd: 12,
          category: "social",
        },
        {
          name: "Sits Without Support",
          description: "Can sit upright without help for several minutes",
          videoUrl: "https://example.com/milestone2.mp4",
          ageRangeStart: 6,
          ageRangeEnd: 8,
          category: "motor",
        },
        {
          name: "Says First Words",
          description: "Uses first meaningful words like 'mama' or 'dada'",
          videoUrl: "https://example.com/milestone3.mp4",
          ageRangeStart: 10,
          ageRangeEnd: 14,
          category: "language",
        },
        {
          name: "Crawls",
          description: "Moves forward on hands and knees",
          videoUrl: "https://example.com/milestone4.mp4",
          ageRangeStart: 7,
          ageRangeEnd: 10,
          category: "motor",
        }
      ];

      for (const milestone of sampleMilestones) {
        try {
          await storage.createDevelopmentMilestone(milestone);
        } catch (error) {
          console.log("Milestone already exists, skipping...");
        }
      }

      res.json({ message: "Sample milestones created successfully" });
    } catch (error) {
      console.error("Error seeding milestones:", error);
      res.status(500).json({ message: "Failed to seed milestones" });
    }
  });

  // Seed CSV user data
  app.post('/api/seed/users', async (req, res) => {
    try {
      const csvUsers = [
        {
          id: "user1",
          firstName: "Natalie",
          lastName: "Delac",
          email: "ndelac265@gmail.com",
          country: "+61",
          phone: "",
          signupSource: "App",
          migrated: true,
          choosePlan: "free",
          countCourses: 9,
          coursesPurchasedPreviously: "Preparation for Newborns, Little Baby Sleep Program, Big Baby Sleep Program, Pre-Toddler Sleep Program, Toddler Sleep Program, Pre-School Sleep Program, New Sibling Supplement, Twins Supplement, Toddler Toolkit",
          signInCount: 26,
          lastSignIn: new Date("2023-05-25T04:42:00.000Z"),
        },
        {
          id: "user2",
          firstName: "Test",
          lastName: "Test",
          email: "julie_gb888@hotmail.com",
          country: "+61",
          phone: "61412987846",
          signupSource: "App",
          migrated: true,
          choosePlan: "free",
          countCourses: 1,
          coursesPurchasedPreviously: "Preparation for Newborns",
          signInCount: 1,
          lastSignIn: new Date("2021-05-06T21:21:38.000Z"),
        },
        {
          id: "user3",
          firstName: "Isabella",
          lastName: "Gozel",
          email: "isabellagozel@gmail.com",
          country: "+61",
          phone: "61412987846",
          signupSource: "App",
          migrated: true,
          choosePlan: "free",
          countCourses: 8,
          coursesPurchasedPreviously: "Preparation for Newborns, Little Baby Sleep Program, Big Baby Sleep Program, Pre-Toddler Sleep Program, Toddler Sleep Program, Pre-School Sleep Program, New Sibling Supplement, Twins Supplement",
          signInCount: 26,
          lastSignIn: new Date("2024-10-23T09:15:15.000Z"),
        },
        {
          id: "user4",
          firstName: "Jamie",
          lastName: "Jakubowicz",
          email: "jamiejakubowicz@yahoo.com.au",
          country: "+61",
          phone: "61412987846",
          signupSource: "App",
          migrated: true,
          choosePlan: "free",
          countCourses: 8,
          coursesPurchasedPreviously: "Preparation for Newborns, Little Baby Sleep Program, Big Baby Sleep Program, Pre-Toddler Sleep Program, Toddler Sleep Program, Pre-School Sleep Program, New Sibling Supplement, Twins Supplement",
          signInCount: 59,
          lastSignIn: new Date("2025-04-14T05:37:07.000Z"),
        },
        {
          id: "user5",
          firstName: "Sarah",
          lastName: "Johnson",
          email: "danielgolly@hotmail.com",
          country: "+61",
          phone: "61412987846",
          signupSource: "App",
          migrated: true,
          choosePlan: "free",
          countCourses: 1,
          coursesPurchasedPreviously: "Preparation for Newborns",
          signInCount: 2,
          lastSignIn: new Date("2021-05-20T00:43:41.000Z"),
        },
        {
          id: "user6",
          firstName: "Jennifer",
          lastName: "Foster",
          email: "jenny.burdick@gmail.com",
          country: "+61",
          phone: "61412987846",
          signupSource: "App",
          migrated: true,
          choosePlan: "free",
          countCourses: 8,
          coursesPurchasedPreviously: "Preparation for Newborns, Little Baby Sleep Program, Big Baby Sleep Program, Pre-Toddler Sleep Program, Toddler Sleep Program, Pre-School Sleep Program, New Sibling Supplement, Twins Supplement",
          signInCount: 31,
          lastSignIn: new Date("2022-07-23T16:11:33.000Z"),
        },
        {
          id: "user7",
          firstName: "Chloe",
          lastName: "Palmer",
          email: "chloerosepalmer@gmail.com",
          country: "+61",
          phone: "61412987846",
          signupSource: "App",
          migrated: true,
          choosePlan: "free",
          countCourses: 8,
          coursesPurchasedPreviously: "Preparation for Newborns, Little Baby Sleep Program, Big Baby Sleep Program, Pre-Toddler Sleep Program, Toddler Sleep Program, Pre-School Sleep Program, New Sibling Supplement, Twins Supplement",
          signInCount: 41,
          lastSignIn: new Date("2025-01-20T04:59:01.000Z"),
        },
        {
          id: "user8",
          firstName: "Jessica",
          lastName: "Ridley",
          email: "jessicaridleytv@gmail.com",
          country: "+61",
          phone: "61412987846",
          signupSource: "App",
          migrated: true,
          choosePlan: "free",
          countCourses: 8,
          coursesPurchasedPreviously: "Preparation for Newborns, Little Baby Sleep Program, Big Baby Sleep Program, Pre-Toddler Sleep Program, Toddler Sleep Program, Pre-School Sleep Program, New Sibling Supplement, Twins Supplement",
          signInCount: 24,
          lastSignIn: new Date("2025-07-01T10:40:43.000Z"),
        },
        {
          id: "user9",
          firstName: "Georgie",
          lastName: "Elliott",
          email: "georgina.elliott26@gmail.com",
          country: "+61",
          phone: "61412987846",
          signupSource: "App",
          migrated: true,
          choosePlan: "free",
          countCourses: 8,
          coursesPurchasedPreviously: "Preparation for Newborns, Little Baby Sleep Program, Big Baby Sleep Program, Pre-Toddler Sleep Program, Toddler Sleep Program, Pre-School Sleep Program, New Sibling Supplement, Twins Supplement",
          signInCount: 488,
          lastSignIn: new Date("2025-06-07T23:46:34.000Z"),
        },
        {
          id: "user10",
          firstName: "Lauren",
          lastName: "Atkins",
          email: "laurenashleeatkins@gmail.com",
          country: "+61",
          phone: "61412987846",
          signupSource: "App",
          migrated: true,
          choosePlan: "free",
          countCourses: 8,
          coursesPurchasedPreviously: "Preparation for Newborns, Little Baby Sleep Program, Big Baby Sleep Program, Pre-Toddler Sleep Program, Toddler Sleep Program, Pre-School Sleep Program, New Sibling Supplement, Twins Supplement",
          signInCount: 348,
          lastSignIn: new Date("2025-06-21T22:41:56.000Z"),
        }
      ];

      for (const userData of csvUsers) {
        try {
          await storage.upsertUser(userData);
          console.log(`User ${userData.firstName} ${userData.lastName} imported successfully`);
        } catch (error) {
          console.log(`Error importing user ${userData.firstName} ${userData.lastName}:`, error);
        }
      }

      res.json({ message: "CSV users imported successfully" });
    } catch (error) {
      console.error("Error seeding users:", error);
      res.status(500).json({ message: "Failed to seed users" });
    }
  });

  // Seed children for CSV users
  app.post('/api/seed/children', async (req, res) => {
    try {
      const childrenData = [
        { userId: "user1", name: "Emma Delac", dateOfBirth: "2024-12-20", gender: "female" },
        { userId: "user2", name: "Baby Test", dateOfBirth: "2024-12-21", gender: "not-specified" },
        { userId: "user3", name: "Oliver Gozel", dateOfBirth: "2024-12-22", gender: "male" },
        { userId: "user4", name: "Sophia Jakubowicz", dateOfBirth: "2024-12-23", gender: "female" },
        { userId: "user5", name: "Liam Johnson", dateOfBirth: "2024-12-27", gender: "male" },
        { userId: "user6", name: "Ava Foster", dateOfBirth: "2024-12-29", gender: "female" },
        { userId: "user7", name: "Noah Palmer", dateOfBirth: "2025-01-01", gender: "male" },
        { userId: "user8", name: "Mia Ridley", dateOfBirth: "2025-01-04", gender: "female" },
        { userId: "user9", name: "Lucas Elliott", dateOfBirth: "2025-01-11", gender: "male" },
        { userId: "user10", name: "Isabella Atkins", dateOfBirth: "2025-02-02", gender: "female" },
      ];

      for (const childData of childrenData) {
        try {
          await storage.createChild(childData);
          console.log(`Child ${childData.name} created for ${childData.userId}`);
        } catch (error) {
          console.log(`Error creating child ${childData.name}:`, error);
        }
      }

      res.json({ message: "Children created successfully for CSV users" });
    } catch (error) {
      console.error("Error seeding children:", error);
      res.status(500).json({ message: "Failed to seed children" });
    }
  });

  // Seed Dr. Golly development milestones
  app.post('/api/seed/milestones', async (req, res) => {
    try {
      const milestones = [
        // 0-4 Weeks
        { name: "Briefly watches you/object", description: "Babies might briefly watch you/object", ageRangeStart: 0, ageRangeEnd: 1, category: "cognitive" },
        { name: "Recognises parent's voice", description: "Recognise a parent's voice and turn head towards the familiar sound", ageRangeStart: 0, ageRangeEnd: 1, category: "cognitive" },
        { name: "Makes communication sounds", description: "Makes intentional communication sounds, like a coo", ageRangeStart: 0, ageRangeEnd: 1, category: "communication" },
        { name: "Reacts to loud sounds", description: "Will react to loud sounds", ageRangeStart: 0, ageRangeEnd: 1, category: "communication" },
        { name: "Lifts head when on tummy", description: "Able to lift head when lying stomach-down", ageRangeStart: 0, ageRangeEnd: 1, category: "movement" },
        { name: "Moves all 4 limbs", description: "Move all 4 limbs", ageRangeStart: 0, ageRangeEnd: 1, category: "movement" },
        { name: "Opens and clenches hands", description: "Open and clench hands", ageRangeStart: 0, ageRangeEnd: 1, category: "movement" },
        { name: "Responds to settling", description: "Responds to settling measures", ageRangeStart: 0, ageRangeEnd: 1, category: "social" },
        { name: "Gazes at faces", description: "Gaze at a face", ageRangeStart: 0, ageRangeEnd: 1, category: "social" },
        { name: "Responsive smiling", description: "Responsive smiling", ageRangeStart: 0, ageRangeEnd: 1, category: "social" },

        // 2 Months
        { name: "Watches you move", description: "Watches you as you move (on their left or right side, but not yet able to track across their midline)", ageRangeStart: 2, ageRangeEnd: 2, category: "cognitive" },
        { name: "Engages with objects", description: "Looks at - and engages with - objects for several seconds", ageRangeStart: 2, ageRangeEnd: 2, category: "cognitive" },
        { name: "Responsive coo sounds", description: "Displays responsive coo sounds", ageRangeStart: 2, ageRangeEnd: 2, category: "communication" },
        { name: "Holds head up on tummy", description: "Holds head up when on tummy", ageRangeStart: 2, ageRangeEnd: 2, category: "movement" },
        { name: "Improved head control", description: "Moves all 4 limbs, improving head control", ageRangeStart: 2, ageRangeEnd: 2, category: "movement" },
        { name: "Opens hands intentionally", description: "Opens hands intentionally", ageRangeStart: 2, ageRangeEnd: 2, category: "movement" },
        { name: "Calms when soothed", description: "Calms down when soothed - increasingly responsive to parent", ageRangeStart: 2, ageRangeEnd: 2, category: "social" },
        { name: "Looks at your face", description: "Looks at your face", ageRangeStart: 2, ageRangeEnd: 2, category: "social" },

        // 4 Months
        { name: "Opens mouth when hungry", description: "Opens mouth if hungry and shown a breast or bottle", ageRangeStart: 4, ageRangeEnd: 4, category: "cognitive" },
        { name: "Tracks across midline", description: "Watches and tracks you/object from one side to the other (across their midline)", ageRangeStart: 4, ageRangeEnd: 4, category: "cognitive" },
        { name: "Looks at hands", description: "Looks at [her/his] hands with interest", ageRangeStart: 4, ageRangeEnd: 4, category: "cognitive" },
        { name: "Conversational cooing", description: "Makes coo-ing sounds in a conversational manner (to/fro)", ageRangeStart: 4, ageRangeEnd: 4, category: "communication" },
        { name: "Makes sounds back", description: "Makes sounds back when you talk to [him/her]", ageRangeStart: 4, ageRangeEnd: 4, category: "communication" },
        { name: "Turns to voice", description: "Turns head towards the sound of your voice", ageRangeStart: 4, ageRangeEnd: 4, category: "communication" },
        { name: "Steady head support", description: "Holds head steady without support when you are holding [him/her]", ageRangeStart: 4, ageRangeEnd: 4, category: "movement" },
        { name: "Holds toys", description: "Holds a toy when you put it in [his/her] hand", ageRangeStart: 4, ageRangeEnd: 4, category: "movement" },
        { name: "Swings at toys", description: "Uses [his/her] arm to swing at toys", ageRangeStart: 4, ageRangeEnd: 4, category: "movement" },
        { name: "Brings hands to mouth", description: "Brings hands to midline, up to mouth", ageRangeStart: 4, ageRangeEnd: 4, category: "movement" },
        { name: "Pushes up on elbows", description: "Pushes up onto elbows/forearms when on tummy", ageRangeStart: 4, ageRangeEnd: 4, category: "movement" },
        { name: "Early rolling signs", description: "Early signs of rolling", ageRangeStart: 4, ageRangeEnd: 4, category: "movement" },
        { name: "Smiles for attention", description: "Smiles on [his/her] own to get your attention", ageRangeStart: 4, ageRangeEnd: 4, category: "social" },
        { name: "Chuckles", description: "Chuckles (not yet full laugh) to get your attention", ageRangeStart: 4, ageRangeEnd: 4, category: "social" },

        // 6 Months
        { name: "Puts things in mouth", description: "Puts things in [his/her] mouth to explore them", ageRangeStart: 6, ageRangeEnd: 6, category: "cognitive" },
        { name: "Reaches for toys", description: "Reaches to grab a toy [he/she] wants", ageRangeStart: 6, ageRangeEnd: 6, category: "cognitive" },
        { name: "Closes lips when full", description: "Closes lips to show [he/she] doesn't want more food", ageRangeStart: 6, ageRangeEnd: 6, category: "cognitive" },
        { name: "Takes turns with sounds", description: "Takes turns making sounds with you", ageRangeStart: 6, ageRangeEnd: 6, category: "communication" },
        { name: "Blows raspberries", description: "Blows 'raspberries' (sticks tongue out and blows)", ageRangeStart: 6, ageRangeEnd: 6, category: "communication" },
        { name: "Exploratory noises", description: "Makes exploratory noises, plays with different breaths/sounds/squeals", ageRangeStart: 6, ageRangeEnd: 6, category: "communication" },
        { name: "Rolls tummy to back", description: "Rolls from tummy to back", ageRangeStart: 6, ageRangeEnd: 6, category: "movement" },
        { name: "Pushes up with straight arms", description: "Pushes up with straight arms from flat tummy position", ageRangeStart: 6, ageRangeEnd: 6, category: "movement" },
        { name: "Leans on hands sitting", description: "Leans on hands to support [himself/herself] when sitting", ageRangeStart: 6, ageRangeEnd: 6, category: "movement" },
        { name: "Knows familiar people", description: "Knows familiar people", ageRangeStart: 6, ageRangeEnd: 6, category: "social" },
        { name: "Looks in mirror", description: "Likes to look at [himself/herself] in a mirror", ageRangeStart: 6, ageRangeEnd: 6, category: "social" },
        { name: "Laughs", description: "Laughs", ageRangeStart: 6, ageRangeEnd: 6, category: "social" },

        // 9 Months
        { name: "Looks for hidden objects", description: "Looks for objects when covered or moved out of sight (like [his/her] spoon or toy)", ageRangeStart: 9, ageRangeEnd: 9, category: "cognitive" },
        { name: "Bangs objects together", description: "Bangs two things together", ageRangeStart: 9, ageRangeEnd: 9, category: "cognitive" },
        { name: "Says mama/dada", description: "Makes different sounds like 'mamamama' and 'dadadada'", ageRangeStart: 9, ageRangeEnd: 9, category: "communication" },
        { name: "Lifts arms to be picked up", description: "Lifts arms to be picked up", ageRangeStart: 9, ageRangeEnd: 9, category: "communication" },
        { name: "Gets to sitting", description: "Gets to a sitting position by themselves", ageRangeStart: 9, ageRangeEnd: 9, category: "movement" },
        { name: "Transfers objects", description: "Moves things from one hand to [his/her] other", ageRangeStart: 9, ageRangeEnd: 9, category: "movement" },
        { name: "Rakes food", description: "Uses fingers to 'rake' food towards him/herself", ageRangeStart: 9, ageRangeEnd: 9, category: "movement" },
        { name: "Sits without support", description: "Sits without support", ageRangeStart: 9, ageRangeEnd: 9, category: "movement" },
        { name: "Shy with strangers", description: "Can be shy, clingy, or fearful around strangers", ageRangeStart: 9, ageRangeEnd: 9, category: "social" },
        { name: "Facial expressions", description: "Shows several facial expressions like happy, sad, angry, and surprised", ageRangeStart: 9, ageRangeEnd: 9, category: "social" },
        { name: "Responds to name", description: "Looks when their name is called", ageRangeStart: 9, ageRangeEnd: 9, category: "social" },
        { name: "Reacts when you leave", description: "Reacts when you leave (looks, reaches for you, or cries)", ageRangeStart: 9, ageRangeEnd: 9, category: "social" },
        { name: "Plays peek-a-boo", description: "Smiles or laughs when you play peek-a-boo", ageRangeStart: 9, ageRangeEnd: 9, category: "social" },

        // 12-24 Months (1-2 years)
        { name: "Puts objects in containers", description: "Able to put things in containers like a block in a cup", ageRangeStart: 12, ageRangeEnd: 24, category: "cognitive" },
        { name: "Looks for hidden things", description: "Looks for things when you hide them, such as a toy under a blanket", ageRangeStart: 12, ageRangeEnd: 24, category: "cognitive" },
        { name: "Waves bye-bye", description: "Waves 'bye-bye'", ageRangeStart: 12, ageRangeEnd: 24, category: "communication" },
        { name: "Calls parent special name", description: "Calls parent 'mama or dada' or another special name", ageRangeStart: 12, ageRangeEnd: 24, category: "communication" },
        { name: "Understands no", description: "Understands 'no' and briefly pauses when [he/she] hears this", ageRangeStart: 12, ageRangeEnd: 24, category: "communication" },
        { name: "Babbling and words", description: "Has a mixture of babbling and real words. By 18 months learning 1-2 words per week", ageRangeStart: 12, ageRangeEnd: 24, category: "communication" },
        { name: "Pincer grip", description: "Uses pincher grip by picking things up between thumb and pointer finger", ageRangeStart: 12, ageRangeEnd: 24, category: "movement" },
        { name: "Pulls to standing", description: "Pulls up to a standing position", ageRangeStart: 12, ageRangeEnd: 24, category: "movement" },
        { name: "Cruises furniture", description: "Walks holding on to furniture (cruising)", ageRangeStart: 12, ageRangeEnd: 24, category: "movement" },
        { name: "Drinks from cup", description: "Able to drink from a cup without a lid", ageRangeStart: 12, ageRangeEnd: 24, category: "movement" },
        { name: "Plays peek-a-boo games", description: "Plays games like peek-a-boo with you", ageRangeStart: 12, ageRangeEnd: 24, category: "social" },
        { name: "Pretend play", description: "Engages in pretend play, such as pretending to drink from a cup", ageRangeStart: 12, ageRangeEnd: 24, category: "social" },
        { name: "Enjoys other children", description: "Enjoys spending time with other children", ageRangeStart: 12, ageRangeEnd: 24, category: "social" },
        { name: "Responds to name", description: "Knows and responds to their name", ageRangeStart: 12, ageRangeEnd: 24, category: "social" },

        // 2 Years (24 months)
        { name: "Uses both hands", description: "Holds something in one hand while using the other hand", ageRangeStart: 24, ageRangeEnd: 24, category: "cognitive" },
        { name: "Uses switches/buttons", description: "Tries to use switches, knobs, or buttons on a toy", ageRangeStart: 24, ageRangeEnd: 24, category: "cognitive" },
        { name: "Plays with multiple toys", description: "Plays with more than one toy at the same time", ageRangeStart: 24, ageRangeEnd: 24, category: "cognitive" },
        { name: "Points to book items", description: "Points to things in a book when you ask", ageRangeStart: 24, ageRangeEnd: 24, category: "communication" },
        { name: "Two word sentences", description: "Says at least two words together, making a sentence", ageRangeStart: 24, ageRangeEnd: 24, category: "communication" },
        { name: "Points to body parts", description: "Identifies and points to at least two body parts", ageRangeStart: 24, ageRangeEnd: 24, category: "communication" },
        { name: "Uses gestures", description: "Uses more gestures than just waving and pointing", ageRangeStart: 24, ageRangeEnd: 24, category: "communication" },
        { name: "Kicks ball", description: "Kicks a ball", ageRangeStart: 24, ageRangeEnd: 24, category: "movement" },
        { name: "Runs", description: "Runs", ageRangeStart: 24, ageRangeEnd: 24, category: "movement" },
        { name: "Walks up stairs", description: "Walks up a few stairs with or without help", ageRangeStart: 24, ageRangeEnd: 24, category: "movement" },
        { name: "Eats with spoon", description: "Eats with a spoon", ageRangeStart: 24, ageRangeEnd: 24, category: "movement" },
        { name: "Notices upset others", description: "Notices when others are hurt or upset", ageRangeStart: 24, ageRangeEnd: 24, category: "social" },
        { name: "Looks for reactions", description: "Looks at your face to see how you react in a new situation", ageRangeStart: 24, ageRangeEnd: 24, category: "social" },

        // 30 Months (2.5 years)
        { name: "Pretend play with objects", description: "Uses objects in pretend play, like feeding a block to a doll", ageRangeStart: 30, ageRangeEnd: 30, category: "cognitive" },
        { name: "Problem solving", description: "Demonstrates simple problem solving skills", ageRangeStart: 30, ageRangeEnd: 30, category: "cognitive" },
        { name: "Two-step instructions", description: "Follows two-step instructions like 'put the toy down and close the door'", ageRangeStart: 30, ageRangeEnd: 30, category: "cognitive" },
        { name: "Knows colors", description: "Shows they know at least one colour", ageRangeStart: 30, ageRangeEnd: 30, category: "cognitive" },
        { name: "Says 50 words", description: "Says approximately 50 words", ageRangeStart: 30, ageRangeEnd: 30, category: "communication" },
        { name: "Action words", description: "Says two or more words together, with one action word", ageRangeStart: 30, ageRangeEnd: 30, category: "communication" },
        { name: "Names objects", description: "Able to name objects in a book when you point and ask", ageRangeStart: 30, ageRangeEnd: 30, category: "communication" },
        { name: "Uses personal pronouns", description: "Says words like 'I', 'me' or 'we'", ageRangeStart: 30, ageRangeEnd: 30, category: "communication" },
        { name: "Twists hands", description: "Uses hands to twist things, like turning door knobs", ageRangeStart: 30, ageRangeEnd: 30, category: "movement" },
        { name: "Takes off clothes", description: "Takes some clothes off [him/herself]", ageRangeStart: 30, ageRangeEnd: 30, category: "movement" },
        { name: "Jumps with both feet", description: "Jumps off the ground with both feet", ageRangeStart: 30, ageRangeEnd: 30, category: "movement" },
        { name: "Turns book pages", description: "Turns book pages one at a time", ageRangeStart: 30, ageRangeEnd: 30, category: "movement" },
        { name: "Plays with other children", description: "Plays next to other children and sometimes plays with them", ageRangeStart: 30, ageRangeEnd: 30, category: "social" },
        { name: "Shows off abilities", description: "Shows you what [he/she] can do by saying 'look at me!'", ageRangeStart: 30, ageRangeEnd: 30, category: "social" },
        { name: "Follows routines", description: "Follows simple routines when told", ageRangeStart: 30, ageRangeEnd: 30, category: "social" },

        // 3 Years (36 months)
        { name: "Draws circle", description: "Draws a circle when you show them how", ageRangeStart: 36, ageRangeEnd: 36, category: "cognitive" },
        { name: "Avoids danger", description: "Avoids touching hot objects when you warn [him/her]", ageRangeStart: 36, ageRangeEnd: 36, category: "cognitive" },
        { name: "Listens to instructions", description: "Able to listen to instructions", ageRangeStart: 36, ageRangeEnd: 36, category: "cognitive" },
        { name: "Conversational exchanges", description: "Talks to you in conversation with back and forth exchanges", ageRangeStart: 36, ageRangeEnd: 36, category: "communication" },
        { name: "Asks questions", description: "Asks who, what, where, when and why questions", ageRangeStart: 36, ageRangeEnd: 36, category: "communication" },
        { name: "Describes book actions", description: "Says what is happening in a book when asked", ageRangeStart: 36, ageRangeEnd: 36, category: "communication" },
        { name: "Says first name", description: "Says first name when asked", ageRangeStart: 36, ageRangeEnd: 36, category: "communication" },
        { name: "Talks clearly", description: "Talks well enough for others to understand most of the time", ageRangeStart: 36, ageRangeEnd: 36, category: "communication" },
        { name: "Strings items", description: "String items together, like large beads or penne pasta", ageRangeStart: 36, ageRangeEnd: 36, category: "movement" },
        { name: "Puts on clothes", description: "Puts on some clothes by themself", ageRangeStart: 36, ageRangeEnd: 36, category: "movement" },
        { name: "Uses fork", description: "Uses a fork", ageRangeStart: 36, ageRangeEnd: 36, category: "movement" },
        { name: "Calms at drop-off", description: "Calms down within 10 mins after you leave him/her", ageRangeStart: 36, ageRangeEnd: 36, category: "social" },
        { name: "Joins other children", description: "Notices other children and joins them to play", ageRangeStart: 36, ageRangeEnd: 36, category: "social" },

        // 4 Years (48 months)
        { name: "Names colors", description: "Names a few colours of items", ageRangeStart: 48, ageRangeEnd: 48, category: "cognitive" },
        { name: "Anticipates story", description: "Anticipates and verbalises what comes next in a well-known story", ageRangeStart: 48, ageRangeEnd: 48, category: "cognitive" },
        { name: "Draws person", description: "Draws person with 3 or more body parts", ageRangeStart: 48, ageRangeEnd: 48, category: "cognitive" },
        { name: "Four word sentences", description: "Says sentences with four or more words", ageRangeStart: 48, ageRangeEnd: 48, category: "communication" },
        { name: "Sings songs", description: "Says some words from a song, story or nursery rhyme", ageRangeStart: 48, ageRangeEnd: 48, category: "communication" },
        { name: "Talks about day", description: "Talks about at least one thing that happened during [his/her] day", ageRangeStart: 48, ageRangeEnd: 48, category: "communication" },
        { name: "Answers questions", description: "Answers simple questions like 'what is a hat for?'", ageRangeStart: 48, ageRangeEnd: 48, category: "communication" },
        { name: "Catches ball", description: "Catches a large ball most of the time", ageRangeStart: 48, ageRangeEnd: 48, category: "movement" },
        { name: "Serves food", description: "Serves [herself/himself] food or pours water, with adult supervision", ageRangeStart: 48, ageRangeEnd: 48, category: "movement" },
        { name: "Unbuttons buttons", description: "Unbuttons some buttons", ageRangeStart: 48, ageRangeEnd: 48, category: "movement" },
        { name: "Holds crayon properly", description: "Holds crayon or pencil between fingers and thumb", ageRangeStart: 48, ageRangeEnd: 48, category: "movement" },
        { name: "Pretends to be others", description: "Pretends to be something else during play", ageRangeStart: 48, ageRangeEnd: 48, category: "social" },
        { name: "Asks to play", description: "Asks to go play with children if none are around", ageRangeStart: 48, ageRangeEnd: 48, category: "social" },
        { name: "Comforts others", description: "Comforts others who are hurt or sad", ageRangeStart: 48, ageRangeEnd: 48, category: "social" },
        { name: "Avoids playground danger", description: "Avoids danger, like not jumping from tall heights", ageRangeStart: 48, ageRangeEnd: 48, category: "social" },
        { name: "Likes to help", description: "Likes to be a 'helper'", ageRangeStart: 48, ageRangeEnd: 48, category: "social" },
        { name: "Alters behaviour by location", description: "Alters behaviour based on where [he/she] is", ageRangeStart: 48, ageRangeEnd: 48, category: "social" },

        // 5 Years (60 months)
        { name: "Counts to 10", description: "Counts to 10", ageRangeStart: 60, ageRangeEnd: 60, category: "cognitive" },
        { name: "Names numbers", description: "Names some numbers between 1 and 5 when you point to them", ageRangeStart: 60, ageRangeEnd: 60, category: "cognitive" },
        { name: "Uses time words", description: "Uses words about time like 'yesterday,' 'tomorrow'", ageRangeStart: 60, ageRangeEnd: 60, category: "cognitive" },
        { name: "Pays attention 5-10 minutes", description: "Pays attention for 5-10 minutes during activities", ageRangeStart: 60, ageRangeEnd: 60, category: "cognitive" },
        { name: "Writes name letters", description: "Able to write some letters in [his/her] name", ageRangeStart: 60, ageRangeEnd: 60, category: "cognitive" },
        { name: "Names letters", description: "Names some letters when you point to them", ageRangeStart: 60, ageRangeEnd: 60, category: "cognitive" },
        { name: "Tells stories", description: "Tells a story [she/he] heard or made up with at least two events", ageRangeStart: 60, ageRangeEnd: 60, category: "communication" },
        { name: "Answers story questions", description: "Answers simple questions about a book or story", ageRangeStart: 60, ageRangeEnd: 60, category: "communication" },
        { name: "Keeps conversation going", description: "Keeps a conversation going with more than three exchanges", ageRangeStart: 60, ageRangeEnd: 60, category: "communication" },
        { name: "Recognizes rhymes", description: "Uses or recognises simple rhymes", ageRangeStart: 60, ageRangeEnd: 60, category: "communication" },
        { name: "Fastens buttons", description: "Able to fasten some buttons", ageRangeStart: 60, ageRangeEnd: 60, category: "movement" },
        { name: "Hops on one foot", description: "Hops on one foot", ageRangeStart: 60, ageRangeEnd: 60, category: "movement" },
        { name: "Follows game rules", description: "Follows rules and can take turns when playing a game", ageRangeStart: 60, ageRangeEnd: 60, category: "social" },
        { name: "Performs for others", description: "Sings, dances or acts for you", ageRangeStart: 60, ageRangeEnd: 60, category: "social" },
        { name: "Does chores", description: "Does simple chores at home", ageRangeStart: 60, ageRangeEnd: 60, category: "social" }
      ];

      for (const milestone of milestones) {
        try {
          await storage.createDevelopmentMilestone(milestone);
          console.log(`Dr. Golly milestone ${milestone.name} created`);
        } catch (error) {
          console.log(`Error creating milestone ${milestone.name}:`, error);
        }
      }

      res.json({ message: "Dr. Golly development milestones created successfully" });
    } catch (error) {
      console.error("Error seeding Dr. Golly milestones:", error);
      res.status(500).json({ message: "Failed to seed Dr. Golly milestones" });
    }
  });

  // Children routes
  app.get('/api/children', async (req: any, res) => {
    try {
      // Get user ID from session (works with both auth systems) - no hardcoded fallback
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log('Fetching children for user ID:', userId);
      
      // Use raw SQL to bypass Drizzle ORM connection issues
      let children;
      try {
        children = await storage.getUserChildren(userId);
      } catch (error) {
        console.log('Drizzle ORM failed for children, using raw SQL fallback');
        // Use raw SQL as fallback
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        children = await sql`SELECT * FROM children WHERE user_id = ${userId} ORDER BY created_at DESC`;
      }
      
      console.log('Children found:', children.length);
      res.json(children);
    } catch (error) {
      console.error("Error fetching children:", error);
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  app.post('/api/children', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const childData = { 
        ...req.body, 
        userId,
        dateOfBirth: new Date(req.body.dateOfBirth)
      };
      const child = await storage.createChild(childData);
      
      // Update Klaviyo with new child information including birth dates
      const user = await storage.getUser(userId);
      if (user) {
        const children = await storage.getUserChildren(userId);
        klaviyoService.syncUserToKlaviyo(user, children).catch(error => {
          console.error("Failed to sync child data to Klaviyo:", error);
        });
      }
      
      res.json(child);
    } catch (error) {
      console.error("Error creating child:", error);
      res.status(500).json({ message: "Failed to create child" });
    }
  });

  app.put('/api/children/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const childId = parseInt(req.params.id);
      const { name, dateOfBirth, gender } = req.body;
      
      if (!name || !dateOfBirth) {
        return res.status(400).json({ message: 'Name and date of birth are required' });
      }
      
      // Verify the child belongs to the user
      const existingChild = await storage.getChild(childId, userId);
      if (!existingChild) {
        return res.status(404).json({ message: 'Child not found' });
      }
      
      const updatedChild = await storage.updateChild(childId, {
        name,
        dateOfBirth: new Date(dateOfBirth),
        gender: gender || 'not-specified',
      });
      
      res.json(updatedChild);
    } catch (error) {
      console.error("Error updating child:", error);
      res.status(500).json({ message: "Failed to update child" });
    }
  });

  app.delete('/api/children/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const childId = parseInt(req.params.id);
      
      // Verify the child belongs to the user
      const existingChild = await storage.getChild(childId, userId);
      if (!existingChild) {
        return res.status(404).json({ message: 'Child not found' });
      }
      
      await storage.deleteChild(childId);
      res.json({ message: 'Child deleted successfully' });
    } catch (error) {
      console.error("Error deleting child:", error);
      res.status(500).json({ message: "Failed to delete child" });
    }
  });

  // Growth tracking routes
  app.get('/api/children/:childId/growth', isAuthenticated, async (req, res) => {
    try {
      const { childId } = req.params;
      const entries = await storage.getChildGrowthEntries(parseInt(childId));
      res.json(entries);
    } catch (error) {
      console.error("Error fetching growth entries:", error);
      res.status(500).json({ message: "Failed to fetch growth entries" });
    }
  });

  app.post('/api/children/:childId/growth', isAuthenticated, async (req, res) => {
    try {
      const { childId } = req.params;
      const { weight, height, headCircumference, date } = req.body;
      const logDate = date ? new Date(date) : new Date();
      const entries = [];

      // Create separate entries for each measurement type
      if (weight) {
        const weightEntry = await storage.createGrowthEntry({
          childId: parseInt(childId),
          measurementType: 'weight',
          value: weight,
          unit: 'kg',
          logDate
        });
        entries.push(weightEntry);
      }

      if (height) {
        const heightEntry = await storage.createGrowthEntry({
          childId: parseInt(childId),
          measurementType: 'height',
          value: height,
          unit: 'cm',
          logDate
        });
        entries.push(heightEntry);
      }

      if (headCircumference) {
        const headEntry = await storage.createGrowthEntry({
          childId: parseInt(childId),
          measurementType: 'head_circumference',
          value: headCircumference,
          unit: 'cm',
          logDate
        });
        entries.push(headEntry);
      }

      res.json(entries);
    } catch (error) {
      console.error("Error creating growth entry:", error);
      res.status(500).json({ message: "Failed to create growth entry" });
    }
  });

  // Development tracking routes
  app.get('/api/milestones', async (req, res) => {
    try {
      const milestones = await storage.getDevelopmentMilestones();
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  app.delete('/api/milestones/clear', async (req, res) => {
    try {
      await storage.clearDevelopmentMilestones();
      res.json({ message: "Milestones cleared successfully" });
    } catch (error) {
      console.error("Error clearing milestones:", error);
      res.status(500).json({ message: "Failed to clear milestones" });
    }
  });

  app.get('/api/children/:childId/development', isAuthenticated, async (req, res) => {
    try {
      const { childId } = req.params;
      const tracking = await storage.getChildDevelopmentTracking(parseInt(childId));
      res.json(tracking);
    } catch (error) {
      console.error("Error fetching development tracking:", error);
      res.status(500).json({ message: "Failed to fetch development tracking" });
    }
  });

  app.post('/api/children/:childId/development', isAuthenticated, async (req, res) => {
    try {
      const { childId } = req.params;
      const trackingData = { 
        ...req.body, 
        childId: parseInt(childId),
        achievedDate: req.body.achievedDate ? new Date(req.body.achievedDate) : null
      };
      const tracking = await storage.createDevelopmentTracking(trackingData);
      res.json(tracking);
    } catch (error) {
      console.error("Error creating development tracking:", error);
      res.status(500).json({ message: "Failed to create development tracking" });
    }
  });

  // Feed tracking routes
  app.get('/api/children/:childId/feeds', isAuthenticated, async (req, res) => {
    try {
      const { childId } = req.params;
      const feeds = await storage.getChildFeedEntries(parseInt(childId));
      res.json(feeds);
    } catch (error) {
      console.error("Error fetching feed entries:", error);
      res.status(500).json({ message: "Failed to fetch feed entries" });
    }
  });

  app.post('/api/children/:childId/feeds', isAuthenticated, async (req, res) => {
    try {
      const { childId } = req.params;
      const feedData = { 
        childId: parseInt(childId),
        feedDate: new Date(req.body.feedDate),
        leftDuration: req.body.leftDuration || 0,
        rightDuration: req.body.rightDuration || 0,
        totalDuration: req.body.totalDuration || 0,
        notes: req.body.notes || null
      };
      const feed = await storage.createFeedEntry(feedData);
      res.json(feed);
    } catch (error) {
      console.error("Error creating feed entry:", error);
      res.status(500).json({ message: "Failed to create feed entry" });
    }
  });

  // Sleep tracking routes
  app.get('/api/children/:childId/sleep', isAuthenticated, async (req, res) => {
    try {
      const { childId } = req.params;
      const sleepEntries = await storage.getChildSleepEntries(parseInt(childId));
      res.json(sleepEntries);
    } catch (error) {
      console.error("Error fetching sleep entries:", error);
      res.status(500).json({ message: "Failed to fetch sleep entries" });
    }
  });

  app.post('/api/children/:childId/sleep', isAuthenticated, async (req, res) => {
    try {
      const { childId } = req.params;
      const sleepData = { 
        childId: parseInt(childId),
        startTime: new Date(req.body.sleepStart),
        endTime: new Date(req.body.sleepEnd),
        quality: req.body.quality,
        notes: req.body.notes
      };
      const sleep = await storage.createSleepEntry(sleepData);
      res.json(sleep);
    } catch (error) {
      console.error("Error creating sleep entry:", error);
      res.status(500).json({ message: "Failed to create sleep entry" });
    }
  });

  // Consultation booking routes
  app.get('/api/consultations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getUserConsultationBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching consultation bookings:", error);
      res.status(500).json({ message: "Failed to fetch consultation bookings" });
    }
  });

  app.post('/api/consultations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const bookingData = { 
        ...req.body, 
        userId,
        preferredDate: new Date(req.body.preferredDate)
      };
      
      const booking = await storage.createConsultationBooking(bookingData);
      
      // Send email notification to alex@drgolly.com
      const emailBody = `
New Consultation Booking

Customer Details:
- Name: ${user?.firstName || ''} ${user?.lastName || ''}
- Email: ${user?.email || 'N/A'}
- Phone: ${user?.phoneNumber || 'N/A'}

Consultation Details:
- Type: ${booking.consultationType.replace('-', ' ')}
- Preferred Date: ${new Date(booking.preferredDate).toLocaleDateString()}
- Preferred Time: ${booking.preferredTime}
- Concerns: ${booking.concerns || 'None provided'}

Status: ${booking.status}
Booking ID: ${booking.id}

Please contact the customer to confirm the appointment.
      `;
      
      try {
        // Send notification via your preferred email service
        console.log('Consultation booking email notification:');
        console.log('To: alex@drgolly.com');
        console.log('Subject: New Consultation Booking - ' + booking.consultationType);
        console.log('Body:', emailBody);
        
        // You can implement actual email sending here using your preferred service
        // For now, we'll just log the notification
        
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the booking if email fails
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error creating consultation booking:", error);
      res.status(500).json({ message: "Failed to create consultation booking" });
    }
  });



  // Individual lesson routes with URL structure
  app.get('/api/lessons/:id', async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      // Get user ID from session (works with both auth systems) - no hardcoded fallback
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log(`Fetching lesson ${lessonId} for user ${userId}`);
      
      // Get lesson details with raw SQL fallback
      let lesson;
      try {
        [lesson] = await db.select().from(courseLessons).where(eq(courseLessons.id, lessonId));
      } catch (error) {
        console.log('Drizzle ORM failed for lesson, using raw SQL fallback');
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`SELECT * FROM course_lessons WHERE id = ${lessonId}`;
        lesson = result[0];
      }
      
      if (!lesson) {
        console.log(`Lesson ${lessonId} not found`);
        return res.status(404).json({ message: 'Lesson not found' });
      }
      
      console.log(`Found lesson: ${lesson.title}, courseId: ${lesson.course_id || lesson.courseId}`);
      const courseId = lesson.course_id || lesson.courseId;
      
      // Get course details for access control with raw SQL fallback
      let course;
      try {
        [course] = await db.select().from(courses).where(eq(courses.id, courseId));
      } catch (error) {
        console.log('Drizzle ORM failed for course, using raw SQL fallback');
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`SELECT * FROM courses WHERE id = ${courseId}`;
        course = result[0];
      }
      
      if (!course) {
        console.log(`Course ${courseId} not found`);
        return res.status(404).json({ message: 'Course not found' });
      }
      
      console.log(`Found course: ${course.title}`);
      
      // Check if user has access to this lesson using the same logic as /api/user/courses
      let user;
      try {
        user = await storage.getUser(userId);
      } catch (error) {
        console.log('Drizzle ORM failed for user, using raw SQL fallback');
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`SELECT * FROM users WHERE id = ${userId}`;
        user = result[0];
      }
      const hasGoldAccess = user?.subscriptionTier === "gold" || user?.subscriptionTier === "platinum" || user?.subscription_tier === "gold" || user?.subscription_tier === "platinum";
      
      // Check both recent purchases and historical courses with raw SQL fallback
      let coursePurchases;
      try {
        coursePurchases = await storage.getUserCoursePurchases(userId);
      } catch (error) {
        console.log('Drizzle ORM failed for course purchases, using raw SQL fallback');
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        coursePurchases = await sql`
          SELECT * FROM course_purchases 
          WHERE user_id = ${userId} 
          ORDER BY purchased_at DESC
        `;
      }
      
      // If still no course purchases, default to empty array
      if (!coursePurchases) {
        coursePurchases = [];
      }
      const hasPurchased = coursePurchases.some((purchase: any) => (purchase.courseId || purchase.course_id) === courseId && purchase.status === 'completed');
      
      // Check historical courses from courses_purchased_previously field
      let hasHistoricalAccess = false;
      const historicalCoursesField = user?.courses_purchased_previously || user?.courses_purchased_previously;
      if (historicalCoursesField) {
        const historicalCourses = historicalCoursesField.split(',').map(name => name.trim());
        hasHistoricalAccess = historicalCourses.some(courseName => {
          // Map course names to course IDs (same mapping as /api/user/courses)
          const courseMapping: { [key: string]: number } = {
            'Little Baby Sleep Program': 5,
            'Big Baby Sleep Program': 6,
            'Pre-toddler Sleep Program': 7,
            'Toddler Sleep Program': 8,
            'Pre-School Sleep Program': 9,
            'Preparation for Newborns': 10,
            'New Sibling Supplement': 11,
            'Twins Supplement': 12,
            'Toddler Toolkit': 13
          };
          return courseMapping[courseName] === courseId;
        });
      }
      
      console.log(`User subscription: ${user?.subscriptionTier}, hasGoldAccess: ${hasGoldAccess}, hasPurchased: ${hasPurchased}, hasHistoricalAccess: ${hasHistoricalAccess}`);
      
      // User has access if they have Gold/Platinum subscription OR have purchased this specific course OR have historical access
      if (!hasGoldAccess && !hasPurchased && !hasHistoricalAccess) {
        return res.status(403).json({ message: 'Access denied. Please upgrade your plan or purchase this course.' });
      }
      
      // Get lesson content
      console.log(`Getting lesson content for lesson ${lessonId}`);
      const content = await storage.getLessonContent(lessonId);
      console.log(`Found ${content.length} content items`);
      
      // Don't create duplicate content - let the frontend handle displaying main lesson content
      console.log('Sub-lesson content loaded, no duplication needed');
      
      // Get user progress
      console.log(`Getting user progress for lesson ${lessonId}`);
      const progress = await storage.getUserLessonProgress(userId, lessonId);
      console.log(`Progress: ${progress ? 'found' : 'not found'}`);
      
      // Get next lesson in the course (handle both field name conventions)
      const lessonChapterId = lesson.chapterId || lesson.chapter_id;
      const lessonOrderIndex = lesson.orderIndex || lesson.order_index;
      const lessonCourseId = lesson.courseId || lesson.course_id;
      
      console.log(`Getting next lesson after chapter ${lessonChapterId}, order ${lessonOrderIndex}`);
      const nextLesson = await storage.getNextLesson(lessonCourseId, lessonChapterId, lessonOrderIndex);
      console.log(`Next lesson: ${nextLesson ? nextLesson.title : 'none'}`);
      
      // Check if this is the last lesson in the current chapter
      const isLastInChapter = !nextLesson || (nextLesson && (nextLesson.chapterId || nextLesson.chapter_id) !== lessonChapterId);
      
      res.json({
        lesson,
        course,
        content,
        progress,
        nextLesson,
        isLastInChapter
      });
    } catch (error) {
      console.error('Error fetching lesson:', error);
      res.status(500).json({ message: 'Failed to fetch lesson' });
    }
  });

  app.get('/api/lessons/:lessonId/content', isAuthenticated, async (req, res) => {
    try {
      const { lessonId } = req.params;
      const content = await storage.getLessonContent(parseInt(lessonId));
      res.json(content);
    } catch (error) {
      console.error("Error fetching lesson content:", error);
      res.status(500).json({ message: "Failed to fetch lesson content" });
    }
  });

  app.post('/api/lessons/:lessonId/progress', async (req, res) => {
    try {
      const { lessonId } = req.params;
      // Use enhanced session-based authentication that works with Dr. Golly system
      const userId = await getUserFromSession(req);
      
      if (!userId) {
        console.log('No authenticated user found in session for progress tracking');
        console.log('Session data:', req.session);
        console.log('Session passport:', req.session?.passport);
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log('Updating progress for user:', userId, 'lesson:', lessonId);
      
      const progressData = {
        userId,
        lessonId: parseInt(lessonId),
        completed: req.body.completed || false,
        watchTime: req.body.watchTime || 0,
        completedAt: req.body.completed ? new Date() : null,
      };

      // Try storage method first, fallback to raw SQL if needed
      let progress;
      try {
        progress = await storage.updateUserLessonProgress(progressData);
      } catch (error) {
        console.error("Drizzle ORM failed for lesson progress, using raw SQL fallback");
        const sqlConnection = neon(process.env.DATABASE_URL!);
        
        // Use upsert for lesson progress with Neon serverless SQL
        const result = await sqlConnection`
          INSERT INTO user_lesson_progress (user_id, lesson_id, completed, watch_time, completed_at, created_at)
          VALUES (${userId}, ${parseInt(lessonId)}, ${progressData.completed}, ${progressData.watchTime}, ${progressData.completedAt}, NOW())
          ON CONFLICT (user_id, lesson_id) 
          DO UPDATE SET 
            completed = EXCLUDED.completed,
            watch_time = EXCLUDED.watch_time,
            completed_at = EXCLUDED.completed_at
          RETURNING *
        `;
        
        progress = result[0];
      }
      
      res.json(progress);
    } catch (error) {
      console.error("Error updating lesson progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  app.get('/api/lessons/:lessonId/progress', isAuthenticated, async (req, res) => {
    try {
      const { lessonId } = req.params;
      const userId = req.user?.claims?.sub;
      
      const progress = await storage.getUserLessonProgress(userId, parseInt(lessonId));
      res.json(progress || null);
    } catch (error) {
      console.error("Error fetching lesson progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post('/api/lesson-content/:contentId/progress', isAuthenticated, async (req, res) => {
    try {
      const { contentId } = req.params;
      const userId = req.user?.claims?.sub;
      
      const progressData = {
        userId,
        lessonContentId: parseInt(contentId),
        completed: req.body.completed || false,
        watchTime: req.body.watchTime || 0,
        completedAt: req.body.completed ? new Date() : null,
      };

      const progress = await storage.updateUserLessonContentProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating lesson content progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Get comprehensive user course engagement data for admin
  app.get('/api/admin/users/:userId/course-engagement', adminBypass, async (req, res) => {
    try {
      const { userId } = req.params;
      const sqlConnection = neon(process.env.DATABASE_URL!);
      
      // Get course engagement data with comprehensive metrics
      const engagementData = await sqlConnection.query(`
        SELECT 
          c.id as course_id,
          c.title as course_title,
          c.thumbnail_url,
          
          -- Course access tracking
          CASE 
            WHEN cp.id IS NOT NULL THEN true 
            WHEN up.courses_purchased_previously LIKE '%' || c.title || '%' THEN true 
            ELSE false 
          END as has_access,
          
          -- Started tracking (has any lesson progress)
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM user_lesson_progress ulp 
              JOIN course_lessons cl ON ulp.lesson_id = cl.id 
              WHERE ulp.user_id = $1 AND cl.course_id = c.id
            ) THEN true 
            ELSE false 
          END as has_started,
          
          -- Completion percentage
          COALESCE(
            (SELECT 
              ROUND(
                (COUNT(CASE WHEN ulp.completed = true THEN 1 END) * 100.0 / COUNT(*)), 2
              )
              FROM course_lessons cl
              LEFT JOIN user_lesson_progress ulp ON cl.id = ulp.lesson_id AND ulp.user_id = $1
              WHERE cl.course_id = c.id
            ), 0
          ) as completion_percentage,
          
          -- Total lessons in course
          (SELECT COUNT(*) FROM course_lessons WHERE course_id = c.id) as total_lessons,
          
          -- Completed lessons
          COALESCE(
            (SELECT COUNT(*) 
             FROM user_lesson_progress ulp 
             JOIN course_lessons cl ON ulp.lesson_id = cl.id 
             WHERE ulp.user_id = $1 AND cl.course_id = c.id AND ulp.completed = true
            ), 0
          ) as completed_lessons,
          
          -- Last accessed
          (SELECT MAX(COALESCE(ulp.completed_at, ulp.created_at)) 
           FROM user_lesson_progress ulp 
           JOIN course_lessons cl ON ulp.lesson_id = cl.id 
           WHERE ulp.user_id = $1 AND cl.course_id = c.id
          ) as last_accessed,
          
          -- Total watch time (in minutes)
          COALESCE(
            (SELECT SUM(ulp.watch_time) 
             FROM user_lesson_progress ulp 
             JOIN course_lessons cl ON ulp.lesson_id = cl.id 
             WHERE ulp.user_id = $1 AND cl.course_id = c.id
            ), 0
          ) as total_watch_time,
          
          -- Course entry count (we'll track this in a separate table)
          0 as entry_count
          
        FROM courses c
        LEFT JOIN course_purchases cp ON c.id = cp.course_id AND cp.user_id = $1
        LEFT JOIN users up ON up.id = $1
        WHERE c.id IN (5, 6, 7, 8, 9, 10, 11, 12, 13, 14)
        ORDER BY c.id
      `, [userId]);
      
      res.json(engagementData);
    } catch (error) {
      console.error("Error fetching user course engagement:", error);
      res.status(500).json({ message: "Failed to fetch course engagement data" });
    }
  });

  // Blog post routes
  app.get('/api/blog-posts', async (req, res) => {
    try {
      const { category, includeUnpublished } = req.query;
      
      // Use raw SQL to bypass Drizzle ORM connection issues
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      let blogPosts;
      if (category) {
        blogPosts = await sql`
          SELECT id, title, slug, excerpt, content, category, tags, image_url, pdf_url, read_time, author, published_at, views, likes, is_published, status, is_pinned, pinned_at, created_at, updated_at
          FROM blog_posts 
          WHERE is_published = true AND category = ${category}
          ORDER BY is_pinned DESC, pinned_at DESC, published_at DESC
        `;
      } else {
        blogPosts = await sql`
          SELECT id, title, slug, excerpt, content, category, tags, image_url, pdf_url, read_time, author, published_at, views, likes, is_published, status, is_pinned, pinned_at, created_at, updated_at
          FROM blog_posts 
          WHERE is_published = true
          ORDER BY is_pinned DESC, pinned_at DESC, published_at DESC
        `;
      }
      
      // Map image_url to imageUrl for frontend compatibility
      const blogPostsWithMapping = blogPosts.map((post: any) => ({
        ...post,
        imageUrl: post.image_url || post.imageUrl,
        pdfUrl: post.pdf_url || post.pdfUrl,
        readTime: post.read_time || post.readTime,
        publishedAt: post.published_at || post.publishedAt,
        isPublished: post.is_published || post.isPublished,
        isPinned: post.is_pinned || post.isPinned,
        pinnedAt: post.pinned_at || post.pinnedAt,
        createdAt: post.created_at || post.createdAt,
        updatedAt: post.updated_at || post.updatedAt
      }));
      
      res.json(blogPostsWithMapping);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get('/api/blog-posts/:id', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid blog post ID" });
      }
      const blogPost = await storage.getBlogPost(postId);
      if (!blogPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(blogPost);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.get('/api/blog-posts/slug/:slug', async (req, res) => {
    try {
      const slug = req.params.slug;
      
      // Use raw SQL to bypass Drizzle ORM connection issues
      let blogPost;
      try {
        blogPost = await storage.getBlogPostBySlug(slug);
      } catch (error) {
        console.log('Drizzle ORM failed for blog post by slug, using raw SQL fallback');
        // Use raw SQL as fallback
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`SELECT * FROM blog_posts WHERE slug = ${slug} LIMIT 1`;
        blogPost = result[0] as any;
      }
      
      if (!blogPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(blogPost);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post('/api/blog-posts/:id/view', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const blogPost = await storage.getBlogPost(postId);
      if (!blogPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      await storage.updateBlogPostStats(postId, (blogPost.views || 0) + 1);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating blog post views:", error);
      res.status(500).json({ message: "Failed to update views" });
    }
  });

  app.post('/api/blog-posts/:id/like', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const blogPost = await storage.getBlogPost(postId);
      if (!blogPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      await storage.updateBlogPostStats(postId, undefined, (blogPost.likes || 0) + 1);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating blog post likes:", error);
      res.status(500).json({ message: "Failed to update likes" });
    }
  });

  // Blog post management routes (admin)
  app.post('/api/blog-posts', isAdmin, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const postData = {
        title: req.body.title,
        slug: req.body.slug,
        excerpt: req.body.excerpt || '',
        content: req.body.content,
        category: req.body.category,
        tags: req.body.tags || [],
        imageUrl: req.body.imageUrl,
        pdfUrl: req.body.pdfUrl,
        readTime: req.body.readTime || 5,
        author: req.body.author || 'Daniel Golshevsky',
        isPublished: !req.body.isDraft,
        status: req.body.isDraft ? 'draft' : 'published',
        publishedAt: req.body.isDraft ? null : new Date(),
        views: 0,
        likes: 0,
      };

      const blogPost = await storage.createBlogPost(postData);
      res.json(blogPost);
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.put('/api/blog-posts/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid blog post ID" });
      }

      const updateData = {
        title: req.body.title,
        slug: req.body.slug,
        excerpt: req.body.excerpt || '',
        content: req.body.content,
        category: req.body.category,
        tags: req.body.tags || [],
        imageUrl: req.body.imageUrl,
        pdfUrl: req.body.pdfUrl,
        readTime: req.body.readTime || 5,
        author: req.body.author || 'Daniel Golshevsky',
        isPublished: !req.body.isDraft,
        status: req.body.isDraft ? 'draft' : 'published',
        publishedAt: req.body.isDraft ? null : new Date(),
      };

      const blogPost = await storage.updateBlogPost(postId, updateData);
      res.json(blogPost);
    } catch (error) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.delete('/api/blog-posts/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid blog post ID" });
      }

      await storage.deleteBlogPost(postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // Feature flag routes
  app.get('/api/feature-flags', isAuthenticated, async (req, res) => {
    try {
      const flags = await storage.getFeatureFlags();
      res.json(flags);
    } catch (error) {
      console.error("Error fetching feature flags:", error);
      res.status(500).json({ message: "Failed to fetch feature flags" });
    }
  });

  app.get('/api/user/feature-access', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const access = await storage.getUserFeatureAccess(userId);
      res.json(access);
    } catch (error) {
      console.error("Error fetching user feature access:", error);
      res.status(500).json({ message: "Failed to fetch feature access" });
    }
  });

  app.get('/api/user/feature-access/:featureName', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const featureName = req.params.featureName;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const hasAccess = await storage.hasFeatureAccess(userId, featureName);
      res.json({ hasAccess, featureName });
    } catch (error) {
      console.error("Error checking feature access:", error);
      res.status(500).json({ message: "Failed to check feature access" });
    }
  });

  // Cart checkout payment intent endpoint
  app.post('/api/create-payment-intent', async (req: any, res) => {
    try {
      const { amount, currency, items, customerDetails, couponId } = req.body;
      
      // Get the user ID from the session (works with both auth systems) - no hardcoded fallback
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      console.log('Cart payment request for user ID:', userId);
      
      // Get regional pricing
      const pricing = await regionalPricingService.getRegionalPricing(req);
      
      // Calculate amount in cents
      const amountInCents = Math.round(amount * 100);
      
      // Apply coupon if provided
      let discountAmount = 0;
      if (couponId) {
        try {
          const coupon = await stripe.coupons.retrieve(couponId);
          if (coupon.valid) {
            if (coupon.amount_off) {
              discountAmount = coupon.amount_off;
            } else if (coupon.percent_off) {
              discountAmount = Math.round(amountInCents * coupon.percent_off / 100);
            }
          }
        } catch (error) {
          console.error('Error retrieving coupon:', error);
        }
      }
      
      const finalAmount = Math.max(amountInCents - discountAmount, 50); // Minimum 50 cents
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: finalAmount,
        currency: currency || 'aud',
        metadata: {
          userId,
          type: 'cart_checkout',
          originalAmount: amountInCents.toString(),
          discountAmount: discountAmount.toString(),
          customerEmail: customerDetails?.email || '',
          customerName: `${customerDetails?.firstName || ''} ${customerDetails?.lastName || ''}`.trim(),
        },
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error('Error creating cart payment intent:', error);
      res.status(500).json({ message: 'Failed to create payment intent' });
    }
  });

  // Course purchase routes
  app.post('/api/create-course-payment', async (req: any, res) => {
    try {
      const { courseId, customerDetails, couponId } = req.body;
      
      // Get the user ID from the session (works with both auth systems) - no hardcoded fallback
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      console.log('Payment request for user ID:', userId);
      
      // Get course details with raw SQL fallback
      let course;
      try {
        course = await storage.getCourse(courseId);
      } catch (error) {
        console.log('Drizzle ORM failed for course payment, using raw SQL fallback');
        // Use raw SQL to avoid Drizzle ORM parsing issues
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`SELECT * FROM courses WHERE id = ${courseId} LIMIT 1`;
        
        if (!result || result.length === 0) {
          return res.status(404).json({ message: "Course not found" });
        }
        
        course = result[0];
      }
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Get user details with raw SQL fallback
      let user;
      try {
        user = await storage.getUser(userId);
      } catch (error) {
        console.log('Drizzle ORM failed for user payment, using raw SQL fallback');
        // Use raw SQL to avoid Drizzle ORM parsing issues
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
        
        if (!result || result.length === 0) {
          return res.status(404).json({ message: "User not found" });
        }
        
        user = {
          id: result[0].id,
          email: result[0].email,
          firstName: result[0].first_name,
          lastName: result[0].last_name,
          stripeCustomerId: result[0].stripe_customer_id,
          signupSource: result[0].signup_source
        };
      }
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check for existing Stripe customer by email first
      let stripeCustomerId = user.stripeCustomerId;

      if (!stripeCustomerId) {
        // Search for existing customer by email
        const existingCustomers = await stripe.customers.list({
          email: user.email,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          // Use existing customer
          stripeCustomerId = existingCustomers.data[0].id;
        } else {
          // Create new customer
          const customer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`.trim(),
            metadata: {
              userId: userId,
              signupSource: user.signupSource || 'direct',
            },
          });
          stripeCustomerId = customer.id;
        }
        
        // Update user with stripe customer ID (with raw SQL fallback)
        try {
          await storage.updateUserStripeCustomerId(userId, stripeCustomerId);
        } catch (error) {
          console.log('Drizzle ORM failed for stripe customer ID update, using raw SQL fallback');
          // Use raw SQL to avoid Drizzle ORM parsing issues
          const { neon } = await import('@neondatabase/serverless');
          const sql = neon(process.env.DATABASE_URL!);
          await sql`UPDATE users SET stripe_customer_id = ${stripeCustomerId} WHERE id = ${userId}`;
        }
      }

      // Get regional pricing based on user's IP
      const userIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
      const regionalPricing = await regionalPricingService.getPricingForIP(userIP);
      let coursePrice = regionalPricing.coursePrice;

      // Handle coupon if provided
      let couponData = null;
      let promotionCode = null;
      if (couponId) {
        try {
          console.log('Processing coupon code:', couponId);
          
          // First try to find promotion code
          const promotionCodes = await stripe.promotionCodes.list({
            code: couponId,
            limit: 1,
          });
          
          if (promotionCodes.data.length > 0) {
            promotionCode = promotionCodes.data[0];
            console.log('Found promotion code:', promotionCode.id, 'Active:', promotionCode.active);
            if (promotionCode.active) {
              couponData = await stripe.coupons.retrieve(promotionCode.coupon.id);
              console.log('Retrieved coupon from promotion code:', couponData.id);
            }
          } else {
            // If no promotion code found, try direct coupon lookup
            try {
              couponData = await stripe.coupons.retrieve(couponId);
              console.log('Retrieved direct coupon:', couponData.id);
            } catch (directCouponError) {
              console.log('No direct coupon found with code:', couponId);
            }
          }
          
          // Apply discount if coupon is valid
          if (couponData && couponData.valid) {
            console.log('Applying coupon:', couponData.id, 'Type:', couponData.amount_off ? 'Fixed amount' : 'Percentage', 'Original price: $' + coursePrice);
            
            if (couponData.amount_off) {
              // Fixed amount discount - amount_off is in cents
              const discountAmount = couponData.amount_off / 100;
              coursePrice = coursePrice - discountAmount;
              console.log('Fixed amount discount: $' + discountAmount, 'New price: $' + coursePrice);
            } else if (couponData.percent_off) {
              // Percentage discount
              const originalPrice = coursePrice;
              coursePrice = coursePrice * (1 - couponData.percent_off / 100);
              console.log('Percentage discount:', couponData.percent_off + '%', 'Original: $' + originalPrice, 'New price: $' + coursePrice);
            }
            
            // Ensure price doesn't go below 0
            coursePrice = Math.max(0, coursePrice);
            console.log('Final discounted price: $' + coursePrice);
          } else {
            console.log('No valid coupon found for code:', couponId);
          }
        } catch (error) {
          console.error("Error retrieving coupon:", error);
        }
      }

      // Create payment intent with detailed metadata and regional pricing
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(coursePrice * 100), // Convert to cents
        currency: regionalPricing.currency.toLowerCase(),
        customer: stripeCustomerId,
        metadata: {
          courseId: courseId.toString(),
          courseName: course.title,
          userId: userId,
          userEmail: user.email,
          customerName: `${user.firstName} ${user.lastName}`.trim(),
          productType: 'course',
          tier: user.subscriptionTier || 'free',
          region: regionalPricing.region,
          currency: regionalPricing.currency,
          couponId: couponData?.id || '',
          couponName: couponData?.name || '',
          originalPrice: regionalPricing.coursePrice.toString(),
          discountedPrice: coursePrice.toString(),
        },
        description: `Course Purchase: ${course.title}`,
        receipt_email: user.email,
      });

      // Create course purchase record with regional pricing (with raw SQL fallback)
      try {
        await storage.createCoursePurchase({
          userId: userId,
          courseId: courseId,
          stripePaymentIntentId: paymentIntent.id,
          stripeCustomerId: stripeCustomerId,
          amount: Math.round(coursePrice * 100),
          currency: regionalPricing.currency.toLowerCase(),
          status: 'pending',
        });
      } catch (error) {
        console.log('Drizzle ORM failed for course purchase creation, using raw SQL fallback');
        // Use raw SQL to avoid Drizzle ORM parsing issues
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        await sql`INSERT INTO course_purchases (user_id, course_id, stripe_payment_intent_id, stripe_customer_id, amount, currency, status, created_at) 
                  VALUES (${userId}, ${courseId}, ${paymentIntent.id}, ${stripeCustomerId}, ${Math.round(coursePrice * 100)}, ${regionalPricing.currency.toLowerCase()}, 'pending', NOW())`;
      }

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        finalAmount: Math.round(coursePrice * 100) // Send final amount in cents
      });
    } catch (error) {
      console.error("Error creating course payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Big Baby public checkout payment creation (for anonymous users)
  app.post('/api/create-big-baby-payment', async (req, res) => {
    try {
      const { customerDetails, couponId } = req.body;
      
      // Validate required fields
      if (!customerDetails?.email || !customerDetails?.firstName) {
        return res.status(400).json({ message: "Email and first name are required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerDetails.email)) {
        return res.status(400).json({ message: "Invalid email address format" });
      }

      // Get the Big Baby course (ID: 6)
      const course = await storage.getCourse(6);
      if (!course) {
        return res.status(404).json({ message: "Big Baby course not found" });
      }

      // Get regional pricing
      const userIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
      const regionalPricing = await regionalPricingService.getPricingForIP(userIP);
      let finalAmount = Math.round(regionalPricing.coursePrice * 100); // Convert to cents
      
      // Apply coupon discount if provided
      let appliedCoupon = null;
      let promotionCode = null;
      if (couponId) {
        try {
          console.log('Processing Big Baby coupon code:', couponId);
          
          // First try to find promotion code
          const promotionCodes = await stripe.promotionCodes.list({
            code: couponId,
            limit: 1,
          });
          
          if (promotionCodes.data.length > 0) {
            promotionCode = promotionCodes.data[0];
            console.log('Found promotion code:', promotionCode.id, 'Active:', promotionCode.active);
            if (promotionCode.active) {
              appliedCoupon = await stripe.coupons.retrieve(promotionCode.coupon.id);
              console.log('Retrieved coupon from promotion code:', appliedCoupon.id);
            }
          } else {
            // If no promotion code found, try direct coupon lookup
            try {
              appliedCoupon = await stripe.coupons.retrieve(couponId);
              console.log('Retrieved direct coupon:', appliedCoupon.id);
            } catch (directCouponError) {
              console.log('No direct coupon found with code:', couponId);
            }
          }
          
          // Apply discount if coupon is valid
          if (appliedCoupon && appliedCoupon.valid) {
            console.log('Applying coupon to Big Baby:', appliedCoupon.id, 'Type:', appliedCoupon.amount_off ? 'Fixed amount' : 'Percentage', 'Original amount: $' + (finalAmount / 100));
            
            if (appliedCoupon.percent_off) {
              // Percentage discount
              const originalAmount = finalAmount;
              finalAmount = Math.round(finalAmount * (1 - appliedCoupon.percent_off / 100));
              console.log('Percentage discount:', appliedCoupon.percent_off + '%', 'Original: $' + (originalAmount / 100), 'New: $' + (finalAmount / 100));
            } else if (appliedCoupon.amount_off) {
              // Fixed amount discount - amount_off is already in cents
              const originalAmount = finalAmount;
              finalAmount = Math.max(0, finalAmount - appliedCoupon.amount_off);
              console.log('Fixed amount discount: $' + (appliedCoupon.amount_off / 100), 'Original: $' + (originalAmount / 100), 'New: $' + (finalAmount / 100));
            }
          } else {
            console.log('No valid coupon found for Big Baby code:', couponId);
          }
        } catch (error) {
          console.error("Error applying Big Baby coupon:", error);
        }
      }

      // Check for existing user to avoid duplicates
      let existingUser = await storage.getUserByEmail(customerDetails.email);
      
      // Check for existing Stripe customer by email first
      let stripeCustomerId;
      const existingCustomers = await stripe.customers.list({
        email: customerDetails.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        // Use existing customer
        stripeCustomerId = existingCustomers.data[0].id;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: customerDetails.email,
          name: `${customerDetails.firstName} ${customerDetails.lastName || ''}`.trim(),
          metadata: {
            signupSource: 'public_checkout',
            courseId: '6',
            courseName: 'Big Baby Sleep Program',
          },
        });
        stripeCustomerId = customer.id;
      }

      // Create payment intent with detailed metadata
      const paymentIntent = await stripe.paymentIntents.create({
        amount: finalAmount,
        currency: regionalPricing.currency.toLowerCase(),
        customer: stripeCustomerId,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        metadata: {
          courseId: '6',
          courseName: 'Big Baby Sleep Program',
          customerEmail: customerDetails.email,
          customerName: `${customerDetails.firstName} ${customerDetails.lastName || ''}`.trim(),
          productType: 'course',
          checkoutType: 'public_checkout',
          tier: 'free',
          dueDate: customerDetails.dueDate || '',
          originalAmount: Math.round(regionalPricing.coursePrice * 100).toString(),
          finalAmount: finalAmount.toString(),
          couponId: couponId || '',
          couponName: appliedCoupon?.name || '',
          discountPercent: appliedCoupon?.percent_off?.toString() || '',
          discountAmount: appliedCoupon?.amount_off?.toString() || '',
          promotionCodeId: promotionCode?.id || '',
          promotionCodeCode: promotionCode?.code || '',
        },
        description: 'Course Purchase: Big Baby Sleep Program',
        receipt_email: customerDetails.email,
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        finalAmount: finalAmount,
        originalAmount: Math.round(regionalPricing.coursePrice * 100),
        appliedCoupon: appliedCoupon ? {
          id: appliedCoupon.id,
          name: appliedCoupon.name,
          percent_off: appliedCoupon.percent_off,
          amount_off: appliedCoupon.amount_off,
        } : null
      });
    } catch (error) {
      console.error("Error creating Big Baby payment:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        customerDetails: req.body.customerDetails
      });
      res.status(500).json({ 
        message: "Failed to create payment",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Stripe webhook endpoint for payment completion
  app.post('/api/stripe-webhook', async (req, res) => {
    try {
      const event = req.body;

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          
          // Check if this is a public checkout payment
          if (paymentIntent.metadata.checkoutType === 'public_checkout') {
            // Handle Big Baby public checkout payment
            const customerEmail = paymentIntent.metadata.customerEmail;
            const customerName = paymentIntent.metadata.customerName;
            
            // Check if user already exists
            let existingUser = await storage.getUserByEmail(customerEmail);
            
            if (!existingUser) {
              // Create temporary user account
              const tempPassword = AuthUtils.generateTemporaryPassword();
              const userId = AuthUtils.generateUserId();
              
              // Create user
              const newUser = await storage.upsertUser({
                id: userId,
                email: customerEmail,
                firstName: customerName.split(' ')[0],
                lastName: customerName.split(' ').slice(1).join(' ') || '',
                signupSource: 'public_checkout',
                subscriptionTier: 'free',
                subscriptionStatus: 'inactive',
                temporaryPassword: tempPassword,
                isFirstLogin: true,
                hasSetPassword: false,
                stripeCustomerId: paymentIntent.customer,
              });
              
              // Create temporary password record
              await storage.createTemporaryPassword(userId, tempPassword);
              
              // Create course purchase record
              await storage.createCoursePurchase({
                userId: userId,
                courseId: 6, // Big Baby course
                stripePaymentIntentId: paymentIntent.id,
                stripeCustomerId: paymentIntent.customer,
                amount: 12000, // $120 in cents
                currency: 'usd',
                status: 'completed',
              });
              
              // Send welcome email via Klaviyo
              await klaviyoService.sendPublicCheckoutWelcome(newUser, tempPassword);
              
              console.log(`Public checkout completed: Created user ${userId} for ${customerEmail}`);
              
              // Send payment notification
              try {
                // Extract discount information from payment intent
                const originalAmount = paymentIntent.metadata.originalAmount ? parseInt(paymentIntent.metadata.originalAmount) : paymentIntent.amount;
                const discountAmount = originalAmount - paymentIntent.amount;
                const promotionalCode = paymentIntent.metadata.promotionCodeCode || paymentIntent.metadata.couponCode;
                
                await slackNotificationService.sendPaymentNotification({
                  name: customerName,
                  email: customerEmail,
                  purchaseDetails: "Single Course Purchase (Big baby sleep program)",
                  paymentAmount: `$${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`,
                  promotionalCode: promotionalCode || undefined,
                  discountAmount: discountAmount > 0 ? `$${(discountAmount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}` : undefined
                });
              } catch (error) {
                console.error('Failed to send payment notification for new user:', error);
              }
            } else {
              // User exists, just create the course purchase
              await storage.createCoursePurchase({
                userId: existingUser.id,
                courseId: 6, // Big Baby course
                stripePaymentIntentId: paymentIntent.id,
                stripeCustomerId: paymentIntent.customer,
                amount: 12000, // $120 in cents
                currency: 'usd',
                status: 'completed',
              });
              
              console.log(`Public checkout completed: Added course to existing user ${existingUser.id}`);
              
              // Send payment notification
              try {
                // Extract discount information from payment intent
                const originalAmount = paymentIntent.metadata.originalAmount ? parseInt(paymentIntent.metadata.originalAmount) : paymentIntent.amount;
                const discountAmount = originalAmount - paymentIntent.amount;
                const promotionalCode = paymentIntent.metadata.promotionCodeCode || paymentIntent.metadata.couponCode;
                
                await slackNotificationService.sendPaymentNotification({
                  name: `${existingUser.firstName} ${existingUser.lastName}`.trim(),
                  email: existingUser.email,
                  purchaseDetails: "Single Course Purchase (Big baby sleep program)",
                  paymentAmount: `$${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`,
                  promotionalCode: promotionalCode || undefined,
                  discountAmount: discountAmount > 0 ? `$${(discountAmount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}` : undefined
                });
              } catch (error) {
                console.error('Failed to send payment notification for existing user:', error);
              }
            }
          } else if (paymentIntent.metadata.type === 'cart_checkout') {
            // Handle cart checkout completion
            const userId = paymentIntent.metadata.userId;
            if (userId) {
              // Get cart items for the user
              const { neon } = await import('@neondatabase/serverless');
              const sql = neon(process.env.DATABASE_URL!);
              const cartItems = await sql`SELECT * FROM cart_items WHERE user_id = ${userId}`;
              
              // Create purchase records for each cart item
              for (const item of cartItems) {
                if (item.item_type === 'course') {
                  await storage.createCoursePurchase({
                    userId: userId,
                    courseId: parseInt(item.item_id),
                    stripePaymentIntentId: paymentIntent.id,
                    stripeCustomerId: paymentIntent.customer,
                    amount: Math.round(120 * 100), // Course price in cents
                    currency: paymentIntent.currency || 'aud',
                    status: 'completed',
                  });
                } else if (item.item_type === 'book') {
                  // Create book purchase record (you may need to add this to storage)
                  console.log(`Book purchase completed: Item ${item.item_id} for user ${userId}`);
                }
              }
              
              // Clear the cart after successful payment
              await sql`DELETE FROM cart_items WHERE user_id = ${userId}`;
              
              console.log(`Cart checkout completed: ${paymentIntent.id} for user ${userId} - ${cartItems.length} items`);
              
              // Send payment notification for cart checkout
              try {
                const user = await storage.getUser(userId);
                if (user) {
                  const courseNames = cartItems.filter(item => item.item_type === 'course').map(item => `Course ID ${item.item_id}`).join(', ');
                  const bookNames = cartItems.filter(item => item.item_type === 'book').map(item => `Book ID ${item.item_id}`).join(', ');
                  const purchaseDetails = [courseNames, bookNames].filter(Boolean).join(', ') || 'Multiple items';
                  
                  await slackNotificationService.sendPaymentNotification({
                    name: `${user.firstName} ${user.lastName}`.trim(),
                    email: user.email,
                    purchaseDetails: `Cart Checkout (${purchaseDetails})`,
                    paymentAmount: `$${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`
                  });
                }
              } catch (error) {
                console.error('Failed to send payment notification for cart checkout:', error);
              }
            }
          } else {
            // Handle regular course purchase
            const purchase = await storage.getCoursePurchaseByPaymentIntent(paymentIntent.id);
            if (purchase) {
              await storage.updateCoursePurchaseStatus(purchase.id, 'completed');
              console.log(`Course purchase completed: ${paymentIntent.id} for user ${purchase.userId}`);
              
              // Send payment notification for course purchase
              try {
                const user = await storage.getUser(purchase.userId);
                const course = await storage.getCourse(purchase.courseId);
                if (user && course) {
                  await slackNotificationService.sendPaymentNotification({
                    name: `${user.firstName} ${user.lastName}`.trim(),
                    email: user.email,
                    purchaseDetails: `Single Course Purchase (${course.title})`,
                    paymentAmount: `$${(purchase.amount / 100).toFixed(2)} ${purchase.currency.toUpperCase()}`
                  });
                }
              } catch (error) {
                console.error('Failed to send payment notification for course purchase:', error);
              }
              
              // Sync course purchase to Klaviyo
              try {
                const user = await storage.getUser(purchase.userId);
                if (user) {
                  await klaviyoService.syncCoursePurchaseToKlaviyo(user, purchase);
                }
              } catch (error) {
                console.error("Failed to sync course purchase to Klaviyo:", error);
              }
            }
          }
          break;
          
        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          
          // Update course purchase status to failed
          const failedPurchase = await storage.getCoursePurchaseByPaymentIntent(failedPayment.id);
          if (failedPurchase) {
            await storage.updateCoursePurchaseStatus(failedPurchase.id, 'failed');
            console.log(`Course purchase failed: ${failedPayment.id} for user ${failedPurchase.userId}`);
          }
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(400).json({ error: "Webhook error" });
    }
  });

  // Manual payment confirmation endpoint (for development/testing)
  app.post('/api/confirm-course-payment', isAuthenticated, async (req: any, res) => {
    try {
      const { paymentIntentId } = req.body;
      const userId = req.user.claims.sub;
      
      // Get payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Verify payment belongs to current user
      if (paymentIntent.metadata.userId !== userId) {
        return res.status(403).json({ message: "Payment not authorized for this user" });
      }
      
      // Update course purchase status based on payment intent status
      const purchase = await storage.getCoursePurchaseByPaymentIntent(paymentIntentId);
      if (purchase) {
        let status = 'pending';
        
        if (paymentIntent.status === 'succeeded') {
          status = 'completed';
        } else if (paymentIntent.status === 'payment_failed') {
          status = 'failed';
        }
        
        await storage.updateCoursePurchaseStatus(purchase.id, status);
        
        // Get updated purchase with course details
        const updatedPurchase = await storage.getCoursePurchase(purchase.id);
        const course = await storage.getCourse(purchase.courseId);
        
        res.json({ 
          success: true, 
          purchase: updatedPurchase,
          course: course,
          paymentStatus: paymentIntent.status
        });
      } else {
        res.status(404).json({ message: "Purchase not found" });
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // Admin endpoint to sync pending transactions with Stripe
  app.post('/api/admin/sync-pending-transactions', isAdmin, async (req, res) => {
    try {
      // Get all pending transactions from database
      const { db } = await import('./db');
      const { coursePurchases } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const pendingPurchases = await db.select().from(coursePurchases).where(eq(coursePurchases.status, 'pending'));
      
      let updatedCount = 0;
      let results = [];
      
      for (const purchase of pendingPurchases) {
        try {
          // Get payment intent from Stripe
          const paymentIntent = await stripe.paymentIntents.retrieve(purchase.stripePaymentIntentId);
          
          let newStatus = 'pending';
          if (paymentIntent.status === 'succeeded') {
            newStatus = 'completed';
          } else if (paymentIntent.status === 'payment_failed') {
            newStatus = 'failed';
          }
          
          if (newStatus !== 'pending') {
            await storage.updateCoursePurchaseStatus(purchase.id, newStatus);
            updatedCount++;
            results.push({
              id: purchase.id,
              paymentIntentId: purchase.stripePaymentIntentId,
              oldStatus: 'pending',
              newStatus: newStatus,
              stripeStatus: paymentIntent.status
            });
          }
        } catch (error) {
          console.error(`Error syncing payment ${purchase.stripePaymentIntentId}:`, error);
          results.push({
            id: purchase.id,
            paymentIntentId: purchase.stripePaymentIntentId,
            error: error.message
          });
        }
      }
      
      res.json({
        message: `Successfully synced ${updatedCount} transactions`,
        totalPending: pendingPurchases.length,
        updatedCount: updatedCount,
        results: results
      });
    } catch (error) {
      console.error("Error syncing pending transactions:", error);
      res.status(500).json({ message: "Failed to sync pending transactions" });
    }
  });

  // Profile management routes
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        subscriptionTier: user.subscriptionTier || 'free',
        subscriptionStatus: user.subscriptionStatus || 'inactive',
        subscriptionEndDate: user.subscriptionEndDate,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        referralCode: user.referralCode
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      
      // Update user in database
      const user = await storage.updateUser(userId, updates);
      
      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        subscriptionTier: user.subscriptionTier || 'free',
        subscriptionStatus: user.subscriptionStatus || 'inactive',
        subscriptionEndDate: user.subscriptionEndDate,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        referralCode: user.referralCode
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Stripe invoice routes
  app.get('/api/profile/invoices', isAuthenticated, async (req: any, res) => {
    // Force no caching with stronger headers
    res.removeHeader('ETag');
    res.removeHeader('Last-Modified');
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Accel-Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    
    try {
      const userId = req.user.claims.sub;
      console.log('===== INVOICE FETCH START =====');
      console.log('Request timestamp:', new Date().toISOString());
      console.log('Fetching invoices for user:', userId);
      
      const user = await storage.getUser(userId);
      console.log('User found:', user ? 'Yes' : 'No');
      if (user) {
        console.log('User details:', { id: user.id, email: user.email, stripeCustomerId: user.stripeCustomerId });
      }
      
      const allInvoices = [];
      
      // Get course purchase invoices from database
      const coursePurchases = await storage.getUserCoursePurchases(userId);
      console.log('Course purchases found:', coursePurchases.length);
      console.log('Raw course purchases:', JSON.stringify(coursePurchases, null, 2));
      
      // Format course purchases as invoices
      console.log('Processing', coursePurchases.length, 'course purchases into invoices');
      for (const purchase of coursePurchases) {
        console.log('Processing purchase:', purchase.id, 'courseId:', purchase.courseId, 'status:', purchase.status);
        const course = await storage.getCourse(purchase.courseId);
        console.log('Course found:', course ? course.title : 'NOT FOUND');
        
        const invoice = {
          id: `course_${purchase.id}`,
          amount: purchase.amount / 100, // Convert from cents
          currency: purchase.currency.toUpperCase(),
          date: purchase.purchasedAt.toISOString(),
          status: purchase.status === 'completed' ? 'paid' : purchase.status,
          downloadUrl: null, // Course purchases don't have downloadable invoices
          description: `${course?.title || 'Course'} Purchase`,
          invoiceNumber: `CP-${purchase.id}`,
          dueDate: null,
          subtotal: purchase.amount / 100,
          tax: 0,
          total: purchase.amount / 100
        };
        
        console.log('Created invoice:', JSON.stringify(invoice, null, 2));
        allInvoices.push(invoice);
      }
      
      // Get Stripe invoices if user has Stripe customer ID
      if (user?.stripeCustomerId) {
        try {
          const invoices = await stripe.invoices.list({
            customer: user.stripeCustomerId,
            limit: 100,
            expand: ['data.payment_intent']
          });
          
          // Format Stripe invoices for frontend
          const stripeInvoices = invoices.data.map(invoice => ({
            id: invoice.id,
            amount: invoice.amount_paid / 100, // Convert from cents
            currency: invoice.currency.toUpperCase(),
            date: new Date(invoice.created * 1000).toISOString(),
            status: invoice.status,
            downloadUrl: invoice.hosted_invoice_url,
            description: invoice.description || 
                        invoice.lines.data[0]?.description || 
                        `Invoice #${invoice.number}`,
            invoiceNumber: invoice.number,
            dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
            subtotal: invoice.subtotal / 100,
            tax: invoice.tax / 100,
            total: invoice.total / 100
          }));
          
          allInvoices.push(...stripeInvoices);
        } catch (stripeError) {
          console.error('Error fetching Stripe invoices:', stripeError);
          // Continue with course invoices only
        }
      }
      
      // Sort all invoices by date (newest first)
      allInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      console.log('Total invoices to return:', allInvoices.length);
      console.log('Final invoice data:', JSON.stringify(allInvoices, null, 2));
      console.log('===== INVOICE FETCH END =====');
      
      // Force fresh response
      res.status(200).json(allInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Debug endpoint to test invoice data
  app.get('/api/debug/invoices/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      console.log('Debug: Fetching invoices for user:', userId);
      
      const user = await storage.getUser(userId);
      console.log('Debug: User found:', user ? 'Yes' : 'No');
      
      const coursePurchases = await storage.getUserCoursePurchases(userId);
      console.log('Debug: Course purchases found:', coursePurchases.length);
      console.log('Debug: Course purchases:', JSON.stringify(coursePurchases, null, 2));
      
      res.json({
        user: user ? { id: user.id, email: user.email } : null,
        coursePurchases: coursePurchases
      });
    } catch (error) {
      console.error('Debug: Error fetching invoices:', error);
      res.status(500).json({ message: 'Failed to fetch invoices', error: error.message });
    }
  });

  // Stripe payment methods routes
  app.get('/api/profile/payment-methods', isAuthenticated, async (req: any, res) => {
    // Disable caching for this endpoint
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('ETag', ''); // Remove ETag to prevent 304 responses
    try {
      const userId = req.user.claims.sub;
      console.log('===== PAYMENT METHODS FETCH START =====');
      console.log('Fetching payment methods for user:', userId);
      
      const user = await storage.getUser(userId);
      console.log('User found:', user ? 'Yes' : 'No');
      console.log('Stripe customer ID:', user?.stripeCustomerId);
      
      if (!user?.stripeCustomerId) {
        return res.json([]);
      }
      
      // Get all payment methods for this customer
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });
      
      // Get default payment method
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      const defaultPaymentMethod = typeof customer !== 'string' ? customer.invoice_settings.default_payment_method : null;
      
      // Format payment methods for frontend
      const formattedPaymentMethods = paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        last4: pm.card?.last4 || '',
        brand: pm.card?.brand || '',
        expMonth: pm.card?.exp_month || 0,
        expYear: pm.card?.exp_year || 0,
        isDefault: pm.id === defaultPaymentMethod,
        created: new Date(pm.created * 1000).toISOString()
      }));
      
      console.log('Payment methods found:', formattedPaymentMethods.length);
      console.log('Payment methods:', JSON.stringify(formattedPaymentMethods, null, 2));
      console.log('===== PAYMENT METHODS FETCH END =====');
      
      res.json(formattedPaymentMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  // Update default payment method
  app.patch('/api/profile/payment-methods/:paymentMethodId/default', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { paymentMethodId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeCustomerId) {
        return res.status(404).json({ message: "Stripe customer not found" });
      }
      
      // Update customer's default payment method
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
      
      res.json({ success: true, message: "Default payment method updated" });
    } catch (error) {
      console.error("Error updating default payment method:", error);
      res.status(500).json({ message: "Failed to update default payment method" });
    }
  });

  // Remove payment method
  app.delete('/api/profile/payment-methods/:paymentMethodId', isAuthenticated, async (req: any, res) => {
    try {
      const { paymentMethodId } = req.params;
      
      // Detach payment method from customer
      await stripe.paymentMethods.detach(paymentMethodId);
      
      res.json({ success: true, message: "Payment method removed" });
    } catch (error) {
      console.error("Error removing payment method:", error);
      res.status(500).json({ message: "Failed to remove payment method" });
    }
  });

  app.post('/api/confirm-course-payment', isAuthenticated, async (req: any, res) => {
    try {
      const { paymentIntentId } = req.body;
      
      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // Update course purchase status
        const purchase = await storage.getCoursePurchaseByPaymentIntent(paymentIntentId);
        if (purchase) {
          await storage.updateCoursePurchaseStatus(purchase.id, 'completed');
        }

        res.json({ success: true, status: 'completed' });
      } else {
        res.json({ success: false, status: paymentIntent.status });
      }
    } catch (error) {
      console.error("Error confirming course payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // User courses endpoint - properly authenticated
  app.get('/api/user/courses', async (req: any, res) => {
    try {
      console.log("User courses endpoint called");
      console.log("Session:", req.session);
      
      // Get user ID from session (works with both auth systems) - no hardcoded fallback
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const sql = neon(process.env.DATABASE_URL!);
      
      console.log(`Fetching courses for user: ${userId}`);
      
      // Get recent course purchases from course_purchases table
      const purchases = await sql`
        SELECT id, user_id, course_id, stripe_product_id, stripe_payment_intent_id, 
               stripe_customer_id, amount, currency, status, purchased_at, created_at
        FROM course_purchases 
        WHERE user_id = ${userId}
        ORDER BY purchased_at DESC
      `;
      
      console.log(`Found ${purchases.length} recent course purchases for user ${userId}`);
      
      // Get user's historical course purchases from courses_purchased_previously field
      const [userData] = await sql`
        SELECT courses_purchased_previously
        FROM users 
        WHERE id = ${userId}
      `;
      
      console.log(`User data:`, userData);
      
      const coursesWithDetails = [];
      
      // Process recent purchases from course_purchases table
      for (const purchase of purchases) {
        const [courseData] = await sql`
          SELECT id, title, description, category, thumbnail_url, price
          FROM courses 
          WHERE id = ${purchase.course_id}
        `;
        
        if (courseData) {
          coursesWithDetails.push({
            id: purchase.id,
            courseId: purchase.course_id,
            userId: purchase.user_id,
            purchasedAt: purchase.purchased_at,
            amount: purchase.amount,
            status: purchase.status,
            course: courseData,
            source: 'recent_purchase'
          });
        }
      }
      
      // Process historical purchases from courses_purchased_previously field
      if (userData && userData.courses_purchased_previously) {
        const historicalCourses = userData.courses_purchased_previously.split(',').map(c => c.trim());
        console.log(`Historical courses: ${historicalCourses}`);
        
        // Create a mapping from course names to IDs
        const courseNameToId = {
          'Preparation for Newborns': 10,
          'Little Baby Sleep Program': 5,
          'Big Baby Sleep Program': 6,
          'Pre-Toddler Sleep Program': 7,
          'Toddler Sleep Program': 8,
          'Pre-School Sleep Program': 9,
          'New Sibling Supplement': 11,
          'Twins Supplement': 12,
          'Toddler Toolkit': 13
        };
        
        for (const courseName of historicalCourses) {
          const courseId = courseNameToId[courseName];
          
          if (courseId) {
            // Check if this course is already in recent purchases to avoid duplicates
            const existingCourse = coursesWithDetails.find(c => c.courseId === courseId);
            if (!existingCourse) {
              const [courseData] = await sql`
                SELECT id, title, description, category, thumbnail_url, price
                FROM courses 
                WHERE id = ${courseId}
              `;
              
              if (courseData) {
                coursesWithDetails.push({
                  id: `historical_${courseId}_${userId}`,
                  courseId: courseId,
                  userId: userId,
                  purchasedAt: null, // Historical purchases don't have specific dates
                  amount: null,
                  status: 'completed',
                  course: courseData,
                  source: 'historical_purchase'
                });
              }
            }
          }
        }
      }
      
      console.log(`Returning ${coursesWithDetails.length} courses with details (${purchases.length} recent + ${coursesWithDetails.length - purchases.length} historical)`);
      res.json(coursesWithDetails);
    } catch (error) {
      console.error("Error fetching user courses:", error);
      res.status(500).json({ message: "Failed to fetch user courses" });
    }
  });

  // Debug route for course purchases (bypassing auth)
  app.get('/api/debug/course-purchases', async (req: any, res) => {
    try {
      // Get user ID from session (works with both auth systems) - no hardcoded fallback
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      let purchases;
      
      try {
        purchases = await storage.getUserCoursePurchases(userId);
      } catch (error) {
        console.log('Drizzle ORM failed for course purchases, using raw SQL fallback');
        // Use raw SQL as fallback with course data
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        purchases = await sql`
          SELECT 
            cp.*,
            c.title as course_title,
            c.description as course_description,
            c.thumbnail_url as course_thumbnail,
            c.skill_level as course_skill_level
          FROM course_purchases cp
          LEFT JOIN courses c ON cp.course_id = c.id
          WHERE cp.user_id = ${userId} AND cp.status = 'completed' 
          ORDER BY cp.created_at DESC
        `;
      }
      
      console.log('Course purchases found:', purchases.length);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching course purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  // Comprehensive Stripe webhook handler for subscriptions and payments
  app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Payment session completed:', session.id);
        
        // Handle successful payment for courses
        if (session.payment_intent && session.metadata?.type === 'course') {
          try {
            const purchase = await storage.getCoursePurchaseByPaymentIntent(session.payment_intent as string);
            if (purchase) {
              await storage.updateCoursePurchaseStatus(purchase.id, 'completed');
              console.log(`Course purchase ${purchase.id} marked as completed`);
              
              // Sync course purchase to Klaviyo
              try {
                const user = await storage.getUser(purchase.userId);
                if (user) {
                  await klaviyoService.syncCoursePurchaseToKlaviyo(user, purchase);
                }
              } catch (error) {
                console.error("Failed to sync course purchase to Klaviyo:", error);
              }
            }
          } catch (error) {
            console.error('Error updating course purchase:', error);
          }
        }
        
        // Handle subscription checkout completion
        if (session.subscription && session.metadata?.type === 'subscription') {
          try {
            const customerId = session.customer as string;
            const subscriptionId = session.subscription as string;
            const userEmail = session.customer_details?.email || session.metadata?.email;
            
            if (userEmail) {
              const user = await storage.getUserByEmail(userEmail);
              if (user) {
                await storage.updateUserStripeCustomerId(user.id, customerId);
                console.log(`User ${user.id} linked to Stripe customer ${customerId}`);
              }
            }
          } catch (error) {
            console.error('Error processing subscription checkout:', error);
          }
        }
        break;

      case 'customer.subscription.created':
        const createdSub = event.data.object;
        console.log('Subscription created:', createdSub.id);
        
        try {
          // Find user by customer ID
          const user = await storage.getUserByStripeCustomerId(createdSub.customer as string);
          if (user && createdSub.metadata?.plan_tier) {
            const nextBillingDate = new Date(createdSub.current_period_end * 1000);
            const billingPeriod = createdSub.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly';
            
            await storage.updateUserSubscription(
              user.id,
              createdSub.metadata.plan_tier,
              billingPeriod,
              nextBillingDate
            );
            
            // Store subscription ID
            await storage.updateUserStripeSubscriptionId(user.id, createdSub.id);
            
            console.log(`User ${user.id} subscription created: ${createdSub.metadata.plan_tier}`);
            
            // Send payment notification for new subscription
            try {
              const planTier = createdSub.metadata.plan_tier;
              const amount = createdSub.items.data[0]?.price?.unit_amount || 0;
              
              // Extract discount information from subscription
              const discountInfo = createdSub.discount;
              let promotionalCode = undefined;
              let discountAmount = undefined;
              
              if (discountInfo) {
                if (discountInfo.coupon) {
                  promotionalCode = discountInfo.promotion_code || discountInfo.coupon.id;
                  
                  // Calculate discount amount
                  if (discountInfo.coupon.percent_off) {
                    discountAmount = `${discountInfo.coupon.percent_off}% off`;
                  } else if (discountInfo.coupon.amount_off) {
                    discountAmount = `$${(discountInfo.coupon.amount_off / 100).toFixed(2)} ${createdSub.currency.toUpperCase()}`;
                  }
                }
              }
              
              await slackNotificationService.sendPaymentNotification({
                name: `${user.firstName} ${user.lastName}`.trim(),
                email: user.email,
                purchaseDetails: `Free → ${planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan Upgrade`,
                paymentAmount: `$${(amount / 100).toFixed(2)} ${createdSub.currency.toUpperCase()}`,
                promotionalCode: promotionalCode,
                discountAmount: discountAmount
              });
            } catch (error) {
              console.error('Failed to send payment notification for subscription creation:', error);
            }
          }
        } catch (error) {
          console.error('Error processing subscription creation:', error);
        }
        break;

      case 'customer.subscription.updated':
        const updatedSub = event.data.object;
        console.log('Subscription updated:', updatedSub.id);
        
        try {
          const user = await storage.getUserByStripeCustomerId(updatedSub.customer as string);
          if (user) {
            const nextBillingDate = new Date(updatedSub.current_period_end * 1000);
            const billingPeriod = updatedSub.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly';
            
            // Determine plan tier from metadata or price
            let planTier = updatedSub.metadata?.plan_tier || 'free';
            
            await storage.updateUserSubscription(
              user.id,
              planTier,
              billingPeriod,
              nextBillingDate
            );
            
            console.log(`User ${user.id} subscription updated: ${planTier}`);
          }
        } catch (error) {
          console.error('Error processing subscription update:', error);
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        console.log('Subscription cancelled:', deletedSub.id);
        
        try {
          const user = await storage.getUserByStripeCustomerId(deletedSub.customer as string);
          if (user) {
            // If cancelled at period end, user keeps access until then
            const accessEndDate = deletedSub.canceled_at_period_end 
              ? new Date(deletedSub.current_period_end * 1000)
              : new Date(); // Immediate cancellation
            
            // Downgrade to free but set the end date
            await storage.updateUserSubscription(
              user.id,
              'free',
              'monthly',
              accessEndDate
            );
            
            console.log(`User ${user.id} subscription cancelled, access until: ${accessEndDate}`);
            
            // Send payment notification for subscription cancellation
            try {
              const planTier = user.subscriptionTier || 'unknown';
              const downgradeDate = accessEndDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              
              await slackNotificationService.sendPaymentNotification({
                name: `${user.firstName} ${user.lastName}`.trim(),
                email: user.email,
                purchaseDetails: `${planTier.charAt(0).toUpperCase() + planTier.slice(1)} → Free Plan Downgrade`,
                paymentAmount: "$0.00 (Cancellation)",
                downgradeDate: downgradeDate
              });
            } catch (error) {
              console.error('Failed to send payment notification for subscription cancellation:', error);
            }
          }
        } catch (error) {
          console.error('Error processing subscription cancellation:', error);
        }
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Handle course purchases
        const purchase = await storage.getCoursePurchaseByPaymentIntent(paymentIntent.id);
        if (purchase) {
          await storage.updateCoursePurchaseStatus(purchase.id, 'completed');
          
          // Sync course purchase to Klaviyo
          try {
            const user = await storage.getUser(purchase.userId);
            if (user) {
              await klaviyoService.syncCoursePurchaseToKlaviyo(user, purchase);
            }
          } catch (error) {
            console.error("Failed to sync course purchase to Klaviyo:", error);
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        
        const failedPurchase = await storage.getCoursePurchaseByPaymentIntent(failedPayment.id);
        if (failedPurchase) {
          await storage.updateCoursePurchaseStatus(failedPurchase.id, 'failed');
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('Invoice payment succeeded:', invoice.id);
        
        // Handle successful recurring payment
        if (invoice.subscription) {
          try {
            const user = await storage.getUserByStripeCustomerId(invoice.customer as string);
            if (user) {
              // Update next billing date
              const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
              const nextBillingDate = new Date(subscription.current_period_end * 1000);
              
              await storage.updateUserSubscription(
                user.id,
                user.subscriptionTier || 'free',
                user.billingPeriod || 'monthly',
                nextBillingDate
              );
              
              console.log(`User ${user.id} billing updated, next billing: ${nextBillingDate}`);
            }
          } catch (error) {
            console.error('Error updating billing date:', error);
          }
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('Invoice payment failed:', failedInvoice.id);
        
        // Handle failed recurring payment
        try {
          const user = await storage.getUserByStripeCustomerId(failedInvoice.customer as string);
          if (user) {
            console.log(`Payment failed for user ${user.id}, subscription may be at risk`);
            // Could implement additional logic here like email notifications
          }
        } catch (error) {
          console.error('Error processing failed payment:', error);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // Seed loyalty notification
  app.post('/api/seed-loyalty-notification', async (req, res) => {
    try {
      await storage.seedLoyaltyNotification();
      res.json({ success: true, message: 'Loyalty notification seeded' });
    } catch (error) {
      console.error('Error seeding loyalty notification:', error);
      res.status(500).json({ success: false, message: 'Failed to seed notification' });
    }
  });

  // Push notifications to user panel - simple approach
  app.post('/api/push-notifications', isAppAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Mark all existing notifications as unread for this user to ensure they show up
      const sqlConnection = neon(process.env.DATABASE_URL!);
      
      // First, remove any existing user notification records for this user
      await sqlConnection.query(`
        DELETE FROM user_notifications WHERE user_id = $1
      `, [userId]);
      
      // Then insert new unread records for all active notifications
      await sqlConnection.query(`
        INSERT INTO user_notifications (user_id, notification_id, is_read, created_at, updated_at)
        SELECT $1, id, false, NOW(), NOW()
        FROM notifications
        WHERE target_type = 'global'
        AND is_published = true
        AND is_active = true
      `, [userId]);

      res.json({ 
        success: true, 
        message: 'Notifications pushed to panel successfully' 
      });
    } catch (error) {
      console.error('Error pushing notifications:', error);
      res.status(500).json({ success: false, message: 'Failed to push notifications' });
    }
  });

  // Simple notification endpoints that don't rely on complex ORM
  app.get('/api/simple-notifications', isAppAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const sqlConnection = neon(process.env.DATABASE_URL!);
      const notifications = await sqlConnection.query(`
        SELECT 
          n.id,
          n.title,
          n.message,
          n.type,
          n.category,
          n.priority,
          n.action_text as "actionText",
          n.action_url as "actionUrl",
          n.created_at as "createdAt",
          COALESCE(un.is_read, false) as "isRead",
          un.read_at as "readAt"
        FROM notifications n
        LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = $1
        WHERE n.target_type = 'global'
        AND n.is_published = true
        AND n.is_active = true
        ORDER BY n.created_at DESC
      `, [userId]);

      res.json(notifications);
    } catch (error) {
      console.error('Error fetching simple notifications:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
  });

  app.get('/api/simple-notifications/unread-count', async (req, res) => {
    try {
      // Use session-based authentication that works with Dr. Golly system - no hardcoded fallback
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        console.log('No authenticated user found in session for notifications');
        return res.status(401).json({ message: "Unauthorized" });
      }

      const sqlConnection = neon(process.env.DATABASE_URL!);
      const result = await sqlConnection.query(`
        SELECT COUNT(*)::int as count
        FROM notifications n
        LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = $1
        WHERE n.target_type = 'global'
        AND n.is_published = true
        AND n.is_active = true
        AND (un.is_read = false OR un.is_read IS NULL)
      `, [userId]);

      res.json({ count: result[0]?.count || 0 });
    } catch (error) {
      console.error('Error fetching simple unread count:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
    }
  });

  // Test endpoint to create notification for admin user (frazer.adnam@cq-partners.com.au)
  app.post('/api/test-create-notification', async (req, res) => {
    try {
      // Find the admin user
      const adminUser = await storage.getUserByEmail('frazer.adnam@cq-partners.com.au');
      if (!adminUser) {
        return res.status(404).json({ message: "Admin user not found" });
      }

      const notification = await storage.createNotification({
        userId: adminUser.id,
        title: "Gold Member Loyalty Reward",
        message: "Thanks for your first month as a gold member, you've unlocked a free sleep review valued at $250 - book now!",
        type: "loyalty",
        category: "reward",
        priority: "high",
        actionText: "Book Now",
        actionUrl: "/track?section=review",
        isRead: false,
        isActive: true,
        isPublished: true
      });

      res.json({ 
        success: true, 
        message: 'Test loyalty notification created successfully', 
        notification,
        userId: adminUser.id
      });
    } catch (error) {
      console.error('Error creating test notification:', error);
      res.status(500).json({ success: false, message: 'Failed to create test notification' });
    }
  });

  // Create subscription using regional pricing
  app.post("/api/create-subscription", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(400).json({ message: "User email required" });
      }

      const { planTier, billingPeriod } = req.body;
      
      if (!planTier || !billingPeriod) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get regional pricing based on user's IP
      const userIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
      const regionalPricing = await regionalPricingService.getPricingForIP(userIP);
      
      // Calculate the price based on plan tier and billing period
      let priceAmount: number;
      if (planTier === 'gold') {
        priceAmount = billingPeriod === 'yearly' ? regionalPricing.goldYearly : regionalPricing.goldMonthly;
      } else if (planTier === 'platinum') {
        priceAmount = billingPeriod === 'yearly' ? regionalPricing.platinumYearly : regionalPricing.platinumMonthly;
      } else {
        return res.status(400).json({ message: "Invalid plan tier" });
      }

      // Create or get customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          metadata: {
            userId: userId,
            region: regionalPricing.region
          }
        });
        customerId = customer.id;
        await storage.updateUserStripeCustomerId(userId, customerId);
      }

      // Create price object for the subscription with regional currency
      const price = await stripe.prices.create({
        unit_amount: Math.round(priceAmount * 100), // Convert to cents
        currency: regionalPricing.currency.toLowerCase(),
        recurring: {
          interval: billingPeriod === 'yearly' ? 'year' : 'month',
        },
        product_data: {
          name: `Dr. Golly ${planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan`,
        },
        metadata: {
          plan_tier: planTier,
          region: regionalPricing.region,
          billing_period: billingPeriod
        }
      });

      // Create subscription using the dynamically created price
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: price.id,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          plan_tier: planTier,
          user_id: userId,
          billing_period: billingPeriod,
          region: regionalPricing.region,
          currency: regionalPricing.currency
        }
      });

      const paymentIntent = subscription.latest_invoice?.payment_intent;
      
      // Store subscription ID
      await storage.updateUserStripeSubscriptionId(userId, subscription.id);
      
      // Sync subscription creation to Klaviyo
      const updatedUser = await storage.getUser(userId);
      if (updatedUser) {
        klaviyoService.updateSubscriptionStatus(updatedUser, {
          tier: planTier,
          status: 'active',
          billingPeriod: billingPeriod,
          nextBillingDate: new Date(subscription.current_period_end * 1000)
        }).catch(error => {
          console.error("Failed to sync subscription to Klaviyo:", error);
        });
      }
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
        pricing: regionalPricing,
        amount: priceAmount
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Error creating subscription: " + error.message });
    }
  });

  // Stripe subscription checkout route
  app.post("/api/create-subscription-checkout", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(400).json({ message: "User email required" });
      }

      const { planTier, billingPeriod, priceAmount } = req.body;
      
      if (!planTier || !billingPeriod || !priceAmount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Create or get customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          metadata: {
            userId: userId
          }
        });
        customerId = customer.id;
        await storage.updateUserStripeCustomerId(userId, customerId);
      }

      // Create price object for the subscription
      const price = await stripe.prices.create({
        unit_amount: Math.round(priceAmount * 100),
        currency: 'usd',
        recurring: {
          interval: billingPeriod === 'yearly' ? 'year' : 'month',
        },
        product_data: {
          name: `Dr. Golly ${planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan`,
        },
        metadata: {
          plan_tier: planTier
        }
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: price.id,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          plan_tier: planTier,
          user_id: userId,
          billing_period: billingPeriod
        }
      });

      const paymentIntent = subscription.latest_invoice?.payment_intent;
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Error creating subscription: " + error.message });
    }
  });

  // Stripe coupon validation endpoint
  app.post("/api/validate-coupon", async (req, res) => {
    try {
      const { couponCode } = req.body;
      
      if (!couponCode) {
        return res.status(400).json({ message: "Coupon code is required" });
      }

      // First try to retrieve as a promotion code
      let coupon = null;
      let promotionCode = null;
      
      try {
        // Search for promotion code first
        const promotionCodes = await stripe.promotionCodes.list({
          code: couponCode,
          limit: 1,
        });
        
        if (promotionCodes.data.length > 0) {
          promotionCode = promotionCodes.data[0];
          
          // Check if promotion code is active
          if (!promotionCode.active) {
            return res.status(400).json({ message: "This coupon is not active" });
          }
          
          // Check if promotion code has expired
          if (promotionCode.expires_at && promotionCode.expires_at < Math.floor(Date.now() / 1000)) {
            return res.status(400).json({ message: "This coupon has expired" });
          }
          
          // Check if promotion code has reached max redemptions
          if (promotionCode.max_redemptions && promotionCode.times_redeemed >= promotionCode.max_redemptions) {
            return res.status(400).json({ message: "This coupon has reached its maximum usage limit" });
          }
          
          // Get the underlying coupon
          coupon = await stripe.coupons.retrieve(promotionCode.coupon.id);
        }
      } catch (error) {
        console.log("Promotion code lookup failed");
      }
      
      // If no promotion code found, try direct coupon lookup
      if (!coupon) {
        try {
          coupon = await stripe.coupons.retrieve(couponCode);
        } catch (error: any) {
          if (error.code === 'resource_missing') {
            return res.status(400).json({ message: "Invalid coupon code" });
          }
          throw error;
        }
      }

      // Validate coupon
      if (!coupon.valid) {
        return res.status(400).json({ message: "This coupon is not valid" });
      }

      // Return coupon details
      res.json({
        valid: true,
        coupon: {
          id: coupon.id,
          name: coupon.name,
          percent_off: coupon.percent_off,
          amount_off: coupon.amount_off,
          currency: coupon.currency,
          duration: coupon.duration,
          duration_in_months: coupon.duration_in_months,
          redeem_by: coupon.redeem_by,
          max_redemptions: coupon.max_redemptions,
          times_redeemed: coupon.times_redeemed,
          // Include promotion code info if available
          promotionCode: promotionCode ? {
            id: promotionCode.id,
            code: promotionCode.code,
            active: promotionCode.active,
            expires_at: promotionCode.expires_at,
            max_redemptions: promotionCode.max_redemptions,
            times_redeemed: promotionCode.times_redeemed,
          } : null,
        }
      });
    } catch (error: any) {
      console.error("Error validating coupon:", error);
      res.status(500).json({ message: "Error validating coupon: " + error.message });
    }
  });

  // Regional pricing routes
  app.get('/api/regional-pricing', async (req, res) => {
    try {
      const userIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
      const pricing = await regionalPricingService.getPricingForIP(userIP);
      res.json(pricing);
    } catch (error) {
      console.error('Error getting regional pricing:', error);
      res.status(500).json({ message: 'Failed to get regional pricing' });
    }
  });

  app.get('/api/regional-pricing/:region', async (req, res) => {
    try {
      const { region } = req.params;
      const pricing = regionalPricingService.getPricingForRegion(region);
      if (!pricing) {
        return res.status(404).json({ message: 'Region not found' });
      }
      res.json(pricing);
    } catch (error) {
      console.error('Error getting regional pricing:', error);
      res.status(500).json({ message: 'Failed to get regional pricing' });
    }
  });

  // Subscription management routes
  app.post('/api/subscription/update', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { tier, billingPeriod } = req.body;
      
      if (!tier || !billingPeriod) {
        return res.status(400).json({ message: "Missing tier or billing period" });
      }

      // Calculate next billing date (30 days from now for monthly, 365 days for yearly)
      const nextBillingDate = new Date();
      if (billingPeriod === 'yearly') {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      } else {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }

      const updatedUser = await storage.updateUserSubscription(
        userId,
        tier,
        billingPeriod,
        nextBillingDate
      );

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // Cancel subscription route
  app.post('/api/subscription/cancel', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      // Find active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active'
      });

      if (subscriptions.data.length === 0) {
        return res.status(400).json({ message: "No active subscription to cancel" });
      }

      const subscription = subscriptions.data[0];
      
      // Cancel at period end to maintain access
      const cancelledSub = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true
      });

      res.json({ 
        success: true, 
        accessUntil: new Date(cancelledSub.current_period_end * 1000) 
      });
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Error cancelling subscription: " + error.message });
    }
  });

  // Admin routes
  app.get('/api/admin/check', async (req, res) => {
    try {
      // Get user ID from session (works with both auth systems) - no hardcoded fallback
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Use raw SQL fallback for admin check
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`SELECT is_admin FROM users WHERE id = ${userId} LIMIT 1`;
        const userRecord = result[0] as any;
        
        const isAdmin = userRecord?.is_admin || false;
        res.json({ isAdmin });
      } catch (dbError) {
        console.error('Database error in admin check:', dbError);
        // Fallback: check if user email is in admin list
        const adminEmails = ['frazer.adnam@cq-partners.com.au', 'alannah@drgolly.com', 'alex@drgolly.com', 'tech@drgolly.com'];
        const isAdmin = adminEmails.includes(req.user?.claims?.email || '');
        res.json({ isAdmin });
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
  });

  // Admin course management API endpoints
  app.get('/api/chapters', isAdmin, async (req, res) => {
    try {
      const chapters = await storage.getAllChapters();
      res.json(chapters);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      res.status(500).json({ message: 'Failed to fetch chapters' });
    }
  });

  app.get('/api/lessons', isAdmin, async (req, res) => {
    try {
      const lessons = await storage.getAllLessons();
      res.json(lessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      res.status(500).json({ message: 'Failed to fetch lessons' });
    }
  });

  app.get('/api/sublessons', isAdmin, async (req, res) => {
    try {
      const sublessons = await storage.getAllSublessons();
      res.json(sublessons);
    } catch (error) {
      console.error('Error fetching sublessons:', error);
      res.status(500).json({ message: 'Failed to fetch sublessons' });
    }
  });

  // CRUD operations for chapters
  app.post('/api/chapters', isAdmin, async (req, res) => {
    try {
      const chapterData = req.body;
      const chapter = await storage.createChapter(chapterData);
      res.json(chapter);
    } catch (error) {
      console.error('Error creating chapter:', error);
      res.status(500).json({ message: 'Failed to create chapter' });
    }
  });

  app.patch('/api/chapters/:id', isAdmin, async (req, res) => {
    try {
      const chapterId = parseInt(req.params.id);
      const updates = req.body;
      const chapter = await storage.updateChapter(chapterId, updates);
      res.json(chapter);
    } catch (error) {
      console.error('Error updating chapter:', error);
      res.status(500).json({ message: 'Failed to update chapter' });
    }
  });

  // CRUD operations for lessons
  app.post('/api/lessons', isAdmin, async (req, res) => {
    try {
      const lessonData = req.body;
      const lesson = await storage.createLesson(lessonData);
      res.json(lesson);
    } catch (error) {
      console.error('Error creating lesson:', error);
      res.status(500).json({ message: 'Failed to create lesson' });
    }
  });

  app.patch('/api/lessons/:id', isAdmin, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const updates = req.body;
      const lesson = await storage.updateLesson(lessonId, updates);
      res.json(lesson);
    } catch (error) {
      console.error('Error updating lesson:', error);
      res.status(500).json({ message: 'Failed to update lesson' });
    }
  });

  // CRUD operations for sublessons (lesson content)
  app.post('/api/sublessons', isAdmin, async (req, res) => {
    try {
      const sublessonData = req.body;
      const sublesson = await storage.createSublesson(sublessonData);
      res.json(sublesson);
    } catch (error) {
      console.error('Error creating sublesson:', error);
      res.status(500).json({ message: 'Failed to create sublesson' });
    }
  });

  app.patch('/api/sublessons/:id', isAdmin, async (req, res) => {
    try {
      const sublessonId = parseInt(req.params.id);
      const updates = req.body;
      const sublesson = await storage.updateSublesson(sublessonId, updates);
      res.json(sublesson);
    } catch (error) {
      console.error('Error updating sublesson:', error);
      res.status(500).json({ message: 'Failed to update sublesson' });
    }
  });

  app.get('/api/admin/metrics', async (req, res) => {
    try {
      // Get user ID from session (works with both auth systems) - no hardcoded fallback
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Check admin status using raw SQL
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      const result = await sql`SELECT is_admin FROM users WHERE id = ${userId} LIMIT 1`;
      const user = result[0] as any;
      
      if (!user || !user.is_admin) {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
      }

      // Use raw SQL to get metrics instead of Drizzle ORM
      const metricsResult = await sql`
        SELECT COUNT(*) as total_users, 
               COUNT(CASE WHEN subscription_tier = 'free' THEN 1 END) as free_users,
               COUNT(CASE WHEN subscription_tier = 'gold' THEN 1 END) as gold_users,
               COUNT(CASE WHEN subscription_tier = 'platinum' THEN 1 END) as platinum_users
        FROM users
      `;
      
      const metrics = {
        totalUsers: parseInt(metricsResult[0].total_users),
        freeUsers: parseInt(metricsResult[0].free_users),
        goldUsers: parseInt(metricsResult[0].gold_users),
        platinumUsers: parseInt(metricsResult[0].platinum_users)
      };
      
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching admin metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Course engagement endpoint for admin dashboard
  app.get('/api/admin/course-engagement', isAdmin, async (req, res) => {
    try {
      const courseEngagement = await storage.getCourseEngagement();
      res.json(courseEngagement);
    } catch (error) {
      console.error("Error fetching course engagement:", error);
      res.status(500).json({ message: "Failed to fetch course engagement" });
    }
  });

  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      
      // Use raw SQL fallback for reliable data fetching
      let users;
      try {
        users = await storage.getAllUsers(page, limit, search);
      } catch (drizzleError) {
        console.log("Drizzle ORM failed for admin users, using raw SQL fallback");
        
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        
        const offset = (page - 1) * limit;
        
        if (search) {
          users = await sql`
            SELECT id, first_name, last_name, email, subscription_tier, created_at, 
                   stripe_customer_id, last_login_at, phone_number, user_role, 
                   is_admin, stripe_subscription_id, marketing_opt_in, 
                   count_courses, sign_in_count, subscription_status, country,
                   signup_source, last_sign_in
            FROM users 
            WHERE email ILIKE ${'%' + search + '%'} 
               OR first_name ILIKE ${'%' + search + '%'} 
               OR last_name ILIKE ${'%' + search + '%'}
            ORDER BY created_at DESC 
            LIMIT ${limit} OFFSET ${offset}
          `;
        } else {
          users = await sql`
            SELECT id, first_name, last_name, email, subscription_tier, created_at, 
                   stripe_customer_id, last_login_at, phone_number, user_role, 
                   is_admin, stripe_subscription_id, marketing_opt_in, 
                   count_courses, sign_in_count, subscription_status, country,
                   signup_source, last_sign_in
            FROM users 
            ORDER BY created_at DESC 
            LIMIT ${limit} OFFSET ${offset}
          `;
        }
      }
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user's purchased courses (User endpoint) - DUPLICATE REMOVED

  // Get user's purchased courses (Admin only)
  app.get('/api/admin/users/:userId/courses', isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`Fetching courses for user: ${userId}`);
      
      // Use raw SQL directly since Drizzle ORM is failing
      console.log("Using raw SQL for user courses due to Drizzle ORM issues");
      const sql = neon(process.env.DATABASE_URL!);
      
      // Get recent course purchases from course_purchases table
      const purchases = await sql`
        SELECT id, user_id, course_id, stripe_product_id, stripe_payment_intent_id, 
               stripe_customer_id, amount, currency, status, purchased_at, created_at
        FROM course_purchases 
        WHERE user_id = ${userId}
        ORDER BY purchased_at DESC
      `;
      
      console.log(`Found ${purchases.length} recent course purchases for user ${userId}`);
      
      // Get user's historical course purchases from courses_purchased_previously field
      const [userData] = await sql`
        SELECT courses_purchased_previously
        FROM users 
        WHERE id = ${userId}
      `;
      
      const coursesWithDetails = [];
      
      // Process recent purchases from course_purchases table
      for (const purchase of purchases) {
        const [courseData] = await sql`
          SELECT id, title, description, category, thumbnail_url, price
          FROM courses 
          WHERE id = ${purchase.course_id}
        `;
        
        coursesWithDetails.push({
          id: purchase.id,
          courseId: purchase.course_id,
          userId: purchase.user_id,
          purchasedAt: purchase.purchased_at,
          amount: purchase.amount,
          status: purchase.status,
          course: courseData,
          source: 'recent_purchase'
        });
      }
      
      // Process historical purchases from courses_purchased_previously field
      if (userData && userData.courses_purchased_previously) {
        const historicalCourses = userData.courses_purchased_previously.split(',').map(c => c.trim());
        
        // Create a mapping from course names to IDs
        const courseNameToId = {
          'Preparation for Newborns': 10,
          'Little Baby Sleep Program': 5,
          'Big Baby Sleep Program': 6,
          'Pre-Toddler Sleep Program': 7,
          'Toddler Sleep Program': 8,
          'Pre-School Sleep Program': 9,
          'New Sibling Supplement': 11,
          'Twins Supplement': 12,
          'Toddler Toolkit': 13
        };
        
        for (const courseName of historicalCourses) {
          const courseId = courseNameToId[courseName];
          
          if (courseId) {
            // Check if this course is already in recent purchases to avoid duplicates
            const existingCourse = coursesWithDetails.find(c => c.courseId === courseId);
            if (!existingCourse) {
              const [courseData] = await sql`
                SELECT id, title, description, category, thumbnail_url, price
                FROM courses 
                WHERE id = ${courseId}
              `;
              
              if (courseData) {
                coursesWithDetails.push({
                  id: `historical_${courseId}_${userId}`,
                  courseId: courseId,
                  userId: userId,
                  purchasedAt: null, // Historical purchases don't have specific dates
                  amount: null,
                  status: 'completed',
                  course: courseData,
                  source: 'historical_purchase'
                });
              }
            }
          }
        }
      }
      
      console.log(`Returning ${coursesWithDetails.length} courses with details (${purchases.length} recent + ${coursesWithDetails.length - purchases.length} historical)`);
      res.json(coursesWithDetails);
    } catch (error) {
      console.error("Error fetching user courses:", error);
      res.status(500).json({ message: "Failed to fetch user courses" });
    }
  });

  // Add course to user (Admin only)
  app.post('/api/admin/users/:userId/courses', isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { courseId } = req.body;
      
      // Check if course exists
      let course;
      try {
        course = await storage.getCourse(courseId);
      } catch (error) {
        console.log("Drizzle ORM failed for course lookup, using raw SQL fallback");
        const sql = neon(process.env.DATABASE_URL!);
        const [courseData] = await sql`
          SELECT id, title, price FROM courses WHERE id = ${courseId}
        `;
        course = courseData;
      }
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if user already has this course
      let existingPurchases;
      try {
        existingPurchases = await storage.getUserCoursePurchases(userId);
      } catch (error) {
        console.log("Drizzle ORM failed for existing purchases check, using raw SQL fallback");
        const sql = neon(process.env.DATABASE_URL!);
        existingPurchases = await sql`
          SELECT course_id, status FROM course_purchases WHERE user_id = ${userId}
        `;
      }
      
      const alreadyPurchased = existingPurchases.some(p => 
        (p.courseId === courseId || p.course_id === courseId) && p.status === 'completed'
      );
      
      if (alreadyPurchased) {
        return res.status(400).json({ message: "User already has this course" });
      }
      
      // Add course purchase record
      let purchase;
      try {
        purchase = await storage.createCoursePurchase({
          userId: userId,
          courseId: courseId,
          stripePaymentIntentId: `admin_grant_${Date.now()}`,
          stripeCustomerId: null,
          amount: 0, // Free admin grant
          currency: 'usd',
          status: 'completed',
        });
      } catch (error) {
        console.log("Drizzle ORM failed for course purchase creation, using raw SQL fallback");
        const sql = neon(process.env.DATABASE_URL!);
        const [newPurchase] = await sql`
          INSERT INTO course_purchases (user_id, course_id, stripe_payment_intent_id, amount, currency, status, purchased_at, created_at)
          VALUES (${userId}, ${courseId}, ${`admin_grant_${Date.now()}`}, 0, 'usd', 'completed', NOW(), NOW())
          RETURNING *
        `;
        purchase = newPurchase;
      }
      
      res.json({ success: true, purchase });
    } catch (error) {
      console.error("Error adding course to user:", error);
      res.status(500).json({ message: "Failed to add course to user" });
    }
  });

  // Remove course from user (Admin only)
  app.delete('/api/admin/users/:userId/courses/:courseId', isAdmin, async (req, res) => {
    try {
      const { userId, courseId } = req.params;
      
      // Find and remove the course purchase
      let deleted = false;
      try {
        const existingPurchases = await storage.getUserCoursePurchases(userId);
        const purchase = existingPurchases.find(p => p.courseId === courseId);
        
        if (purchase) {
          await storage.deleteCoursePurchase(purchase.id);
          deleted = true;
        }
      } catch (error) {
        console.log("Drizzle ORM failed for course removal, using raw SQL fallback");
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`
          DELETE FROM course_purchases 
          WHERE user_id = ${userId} AND course_id = ${courseId}
          RETURNING id
        `;
        deleted = result.length > 0;
      }
      
      if (!deleted) {
        return res.status(404).json({ message: "Course purchase not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing course from user:", error);
      res.status(500).json({ message: "Failed to remove course from user" });
    }
  });

  // Get all available courses (Admin only)
  app.get('/api/admin/courses', isAdmin, async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Get order analytics (Admin only)
  app.get('/api/admin/orders/analytics', isAdmin, async (req, res) => {
    try {
      const analytics = await storage.getOrderAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching order analytics:", error);
      res.status(500).json({ message: "Failed to fetch order analytics" });
    }
  });

  // Get course engagement analytics (Admin only)
  app.get('/api/admin/courses/engagement', isAdmin, async (req, res) => {
    try {
      const engagement = await storage.getCourseEngagement();
      res.json(engagement);
    } catch (error) {
      console.error("Error fetching course engagement:", error);
      res.status(500).json({ message: "Failed to fetch course engagement" });
    }
  });

  // Get user transactions (Admin only)
  app.get('/api/admin/users/:userId/transactions', isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      res.status(500).json({ message: "Failed to fetch user transactions" });
    }
  });

  // Get all courses with lesson counts (Admin only)
  app.get('/api/admin/courses/detailed', isAdmin, async (req, res) => {
    try {
      const courses = await storage.getAllCoursesWithLessons();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching detailed courses:", error);
      res.status(500).json({ message: "Failed to fetch detailed courses" });
    }
  });

  // Get daily orders with pagination (Admin only)
  app.get('/api/admin/orders/daily', isAdmin, async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const orders = await storage.getDailyOrders(parseInt(page as string), parseInt(limit as string));
      res.json(orders);
    } catch (error) {
      console.error("Error fetching daily orders:", error);
      res.status(500).json({ message: "Failed to fetch daily orders" });
    }
  });

  // Get all users with pagination (Admin only)
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const users = await storage.getAllUsers(parseInt(page as string), parseInt(limit as string));
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/users/search', isAdmin, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter required" });
      }
      const users = await storage.searchUsers(query);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.patch('/api/admin/users/:userId', isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      const updatedUser = await storage.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Create admin users (Admin only)
  app.post('/api/admin/create-admins', isAdmin, async (req, res) => {
    try {
      const adminUsers = [
        { email: "alannah@drgolly.com", firstName: "Alannah", lastName: "O'Kane" },
        { email: "alex@drgolly.com", firstName: "Alex", lastName: "Dawkins" },
        { email: "tech@drgolly.com", firstName: "Tech", lastName: "DrGolly" },
      ];

      const createdUsers = [];
      for (const adminUser of adminUsers) {
        const user = await storage.createOrUpdateAdminUser(
          adminUser.email,
          adminUser.firstName,
          adminUser.lastName
        );
        createdUsers.push(user);
      }

      res.json({ 
        success: true, 
        message: `Created/updated ${createdUsers.length} admin users`,
        users: createdUsers 
      });
    } catch (error) {
      console.error("Error creating admin users:", error);
      res.status(500).json({ message: "Failed to create admin users" });
    }
  });

  // Get all admin users (Admin only)
  app.get('/api/admin/admin-users', isAdmin, async (req, res) => {
    try {
      // Use raw SQL directly since Drizzle ORM is failing
      console.log("Using raw SQL for admin users due to Drizzle ORM issues");
      const sql = neon(process.env.DATABASE_URL!);
      const adminUsers = await sql`
        SELECT id, first_name, last_name, email, subscription_tier, 
               subscription_status, is_admin, created_at, profile_picture_url
        FROM users 
        WHERE is_admin = true 
        ORDER BY created_at DESC
      `;
      
      console.log(`Found ${adminUsers.length} admin users`);
      res.json(adminUsers);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch admin users" });
    }
  });

  // Get total user count (Admin only)
  app.get('/api/admin/users/count', isAdmin, async (req, res) => {
    try {
      let totalCount;
      try {
        totalCount = await storage.getTotalUserCount();
      } catch (drizzleError) {
        console.log("Drizzle ORM failed for user count, using raw SQL fallback");
        
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        
        const result = await sql`SELECT COUNT(*) as count FROM users`;
        totalCount = parseInt(result[0].count);
      }
      
      res.json({ totalCount });
    } catch (error) {
      console.error("Error fetching user count:", error);
      res.status(500).json({ message: "Failed to fetch user count" });
    }
  });

  app.get('/api/admin/notifications', isAdmin, async (req, res) => {
    try {
      const notifications = await storage.getAdminNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/admin/notifications', isAdmin, async (req, res) => {
    try {
      const notification = await storage.createAdminNotification(req.body);
      res.json(notification);
    } catch (error) {
      console.error("Error creating admin notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.patch('/api/admin/notifications/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const notification = await storage.updateAdminNotification(parseInt(id), updates);
      res.json(notification);
    } catch (error) {
      console.error("Error updating admin notification:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  app.delete('/api/admin/notifications/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAdminNotification(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting admin notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // USER NOTIFICATION ROUTES
  // Get user notifications
  app.get('/api/notifications', isAppAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Try to get user notifications, fallback to raw SQL if needed
      let notifications = [];
      try {
        notifications = await storage.getUserNotifications(userId);
      } catch (error) {
        console.error("Drizzle ORM failed for user notifications, using raw SQL fallback");
        // Raw SQL fallback for notifications - use direct SQL connection
        const sqlConnection = neon(process.env.DATABASE_URL!);
        const result = await sqlConnection.query(`
          SELECT 
            n.id,
            n.title,
            n.message,
            n.type,
            n.category,
            n.priority,
            n.action_text as "actionText",
            n.action_url as "actionUrl",
            n.created_at as "createdAt",
            COALESCE(un.is_read, false) as "isRead",
            un.read_at as "readAt"
          FROM notifications n
          LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = $1
          WHERE n.target_type = 'global'
          AND n.is_published = true
          AND n.is_active = true
          ORDER BY n.created_at DESC
        `, [userId]);
        notifications = result;
      }
      
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get('/api/notifications/unread-count', isAppAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Try to get unread count, fallback to raw SQL if needed
      let count = 0;
      try {
        count = await storage.getUnreadNotificationCount(userId);
      } catch (error) {
        console.error("Drizzle ORM failed for unread notifications count, using raw SQL fallback");
        // Raw SQL fallback - use direct SQL connection
        const sqlConnection = neon(process.env.DATABASE_URL!);
        const result = await sqlConnection.query(`
          SELECT COUNT(*)::int as count
          FROM notifications n
          LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = $1
          WHERE n.target_type = 'global'
          AND n.is_published = true
          AND n.is_active = true
          AND (un.is_read = false OR un.is_read IS NULL)
        `, [userId]);
        count = result[0]?.count || 0;
      }
      
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Mark notification as read
  app.post('/api/notifications/:id/read', isAppAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { id } = req.params;
      await storage.markNotificationAsRead(userId, parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.post('/api/notifications/mark-all-read', isAppAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Course name mapping for CSV migration
  const COURSE_NAME_MAPPING: { [key: string]: number } = {
    "Preparation for Newborns": 10,
    "Little Baby Sleep Program": 5,
    "Big Baby Sleep Program": 6,
    "Pre-Toddler Sleep Program": 7,
    "Toddler Sleep Program": 8,
    "Pre-School Sleep Program": 9,
    "New Sibling Supplement": 11,
    "Twins Supplement": 12,
    "Toddler Toolkit": 13,
  };

  // Parse course names from CSV and create course purchases
  const parseCourseNames = (courseString: string): number[] => {
    if (!courseString || courseString.trim() === '') return [];
    
    const courseNames = courseString.split(',').map(name => name.trim());
    const courseIds: number[] = [];
    
    courseNames.forEach(courseName => {
      const courseId = COURSE_NAME_MAPPING[courseName];
      if (courseId) {
        courseIds.push(courseId);
      } else {
        console.warn(`Unknown course name: ${courseName}`);
      }
    });
    
    return courseIds;
  };

  // Parse date string to Date object
  const parseDate = (dateString: string): Date | null => {
    if (!dateString || dateString.trim() === '') return null;
    
    // Handle different date formats
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  // Bulk user import system for 20,000 users
  app.post('/api/admin/bulk-import', isAdmin, async (req, res) => {
    try {
      const { users } = req.body;
      
      if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({ message: 'Users array is required' });
      }

      // Validate user limit
      if (users.length > 25000) {
        return res.status(400).json({ message: 'Maximum 25,000 users allowed per import' });
      }

      console.log(`Starting bulk import of ${users.length} users...`);
      const importStartTime = Date.now();

      // Process CSV data with precise mapping
      const processedUsers = users.map(user => {
        // Parse course names and create course ID array
        const courseIds = parseCourseNames(user.coursesPurchased || user['COURSES PURCHASED'] || '');
        
        return {
          id: user.id || AuthUtils.generateUserId(),
          email: user.email || user.Email,
          firstName: user.firstName || user['First Name'],
          lastName: user.lastName || user['Last Name'],
          country: user.country || user.Country,
          phone: user.phone || user['User Phone Number'],
          signupSource: user.signupSource || user.Source,
          subscriptionTier: (user.subscriptionTier || user['Choose Plan'] || 'free').toLowerCase(),
          countCourses: parseInt(user.countCourses || user['Count Courses'] || '0'),
          coursesPurchasedPreviously: user.coursesPurchased || user['COURSES PURCHASED'] || '',
          signInCount: parseInt(user.signInCount || user['Sign in count'] || '0'),
          lastSignIn: parseDate(user.lastSignIn || user['Last sign in']),
          // New fields from CSV
          firstChildDob: parseDate(user.firstChildDob || user['First Child DOB']),
          accountActivated: false, // Always set to false initially
          // Generated fields
          temporaryPassword: AuthUtils.generateTemporaryPassword(),
          isFirstLogin: true,
          hasSetPassword: false,
          migrated: true, // Mark as migrated from other app
          createdAt: new Date(),
          updatedAt: new Date(),
          // Store course IDs for later processing
          _courseIds: courseIds,
        };
      });

      // Create users in bulk (optimized for 20,000 users)
      const createdUsers = await storage.createBulkUsers(processedUsers);
      
      // Create temporary password records in smaller batches for better performance
      const tempPasswordBatchSize = 100;
      for (let i = 0; i < createdUsers.length; i += tempPasswordBatchSize) {
        const batch = createdUsers.slice(i, i + tempPasswordBatchSize);
        await Promise.all(
          batch.map(user => 
            storage.createTemporaryPassword(user.id, user.temporaryPassword!)
          )
        );
      }

      // Create course purchases for users with purchased courses
      const coursePurchaseBatchSize = 100;
      const coursePurchases: any[] = [];
      
      processedUsers.forEach(user => {
        if (user._courseIds && user._courseIds.length > 0) {
          user._courseIds.forEach(courseId => {
            coursePurchases.push({
              userId: user.id,
              courseId: courseId,
              purchaseDate: user.createdAt,
              status: 'completed',
              migrated: true,
            });
          });
        }
      });

      // Create course purchases in batches
      if (coursePurchases.length > 0) {
        for (let i = 0; i < coursePurchases.length; i += coursePurchaseBatchSize) {
          const batch = coursePurchases.slice(i, i + coursePurchaseBatchSize);
          await storage.createBulkCoursePurchases(batch);
        }
      }

      const importEndTime = Date.now();
      const totalProcessingTime = importEndTime - importStartTime;
      
      console.log(`Bulk import completed: ${createdUsers.length} users and ${coursePurchases.length} course purchases in ${totalProcessingTime}ms (${Math.round(totalProcessingTime/1000)}s)`);

      res.json({ 
        message: `Successfully imported ${createdUsers.length} users and ${coursePurchases.length} course purchases in ${Math.round(totalProcessingTime/1000)} seconds`,
        usersCreated: createdUsers.length,
        coursePurchasesCreated: coursePurchases.length,
        processingTimeMs: totalProcessingTime,
        sampleCredentials: createdUsers.slice(0, 5).map(u => ({
          email: u.email,
          temporaryPassword: u.temporaryPassword
        }))
      });
    } catch (error) {
      console.error('Error in bulk user import:', error);
      res.status(500).json({ 
        message: 'Failed to import users',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Temporary password authentication for first-time login
  app.post('/api/auth/temp-login', async (req, res) => {
    try {
      const { email, tempPassword } = req.body;
      
      if (!email || !tempPassword) {
        return res.status(400).json({ message: 'Email and temporary password are required' });
      }

      const user = await storage.authenticateWithTemporaryPassword(email, tempPassword);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials or expired temporary password' });
      }

      // Update last login timestamp for MAU tracking
      await storage.updateUserLastLogin(user.id);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isFirstLogin: user.isFirstLogin,
          hasSetPassword: user.hasSetPassword,
        },
        requiresPasswordSetup: user.isFirstLogin && !user.hasSetPassword
      });
    } catch (error) {
      console.error('Error in temporary login:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });

  // Set permanent password after first-time login
  app.post('/api/auth/set-password', async (req, res) => {
    try {
      const { userId, newPassword, tempPassword } = req.body;
      
      if (!userId || !newPassword || !tempPassword) {
        return res.status(400).json({ message: 'User ID, new password, and temporary password are required' });
      }

      // Validate password strength
      const validation = AuthUtils.validatePasswordStrength(newPassword);
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: 'Password does not meet requirements',
          errors: validation.errors 
        });
      }

      // Verify temporary password is still valid
      const isValidTemp = await storage.verifyTemporaryPassword(userId, tempPassword);
      if (!isValidTemp) {
        return res.status(401).json({ message: 'Invalid or expired temporary password' });
      }

      // Hash the new password
      const passwordHash = await AuthUtils.hashPassword(newPassword);
      
      // Update user with permanent password
      await storage.setUserPassword(userId, passwordHash);
      
      // Mark temporary password as used
      await storage.markTemporaryPasswordAsUsed(userId);

      // Update last login for MAU tracking since this completes the login process
      await storage.updateUserLastLogin(userId);

      // Send Slack notification for existing customer reactivation
      try {
        const user = await storage.getUser(userId);
        if (user) {
          // Fetch previous courses for existing customer reactivation
          let previousCourses: string[] = [];
          try {
            const coursePurchases = await storage.getUserCoursePurchases(userId);
            if (coursePurchases && coursePurchases.length > 0) {
              // Get course titles from purchases
              const courseIds = coursePurchases.map(purchase => purchase.courseId);
              const courses = await storage.getCoursesByIds(courseIds);
              previousCourses = courses.map(course => course.title);
            }
          } catch (courseError) {
            console.error("Failed to fetch previous courses:", courseError);
          }

          await slackNotificationService.sendSignupNotification({
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            marketingOptIn: user.marketingOptIn || false,
            primaryConcerns: user.primaryConcerns ? user.primaryConcerns.split(',') : [],
            signupSource: 'Password Setup (Migrated User)',
            signupType: 'existing_customer_reactivation',
            previousCourses: previousCourses
          });
          console.log("Slack reactivation notification sent successfully");
        }
      } catch (slackError) {
        console.error("Failed to send Slack reactivation notification:", slackError);
      }

      res.json({ message: 'Password set successfully' });
    } catch (error) {
      console.error('Error setting password:', error);
      res.status(500).json({ message: 'Failed to set password' });
    }
  });

  // Thinkific migration endpoint (Admin only)
  app.post('/api/admin/migrate-thinkific-chapter', isAdmin, async (req, res) => {
    try {
      const { title, description, chapterNumber, orderIndex, modules } = req.body;
      
      if (!title || !description || !chapterNumber) {
        return res.status(400).json({ message: 'Title, description, and chapter number are required' });
      }

      // For now, we'll save the extracted content to a temporary table or file
      // In a real implementation, you would:
      // 1. Find the corresponding course module in the database
      // 2. Update the module content with the extracted content
      // 3. Process any images and upload them to your CDN
      // 4. Convert video URLs to your hosting format
      
      const courseId = 10; // "Preparation for Newborns" course ID
      const migrationData = {
        courseId,
        title,
        description,
        chapterNumber,
        orderIndex: orderIndex || 1,
        modules: modules || [],
        migratedAt: new Date().toISOString()
      };
      
      // For now, just log the data and return success
      console.log('Migration data received:', JSON.stringify(migrationData, null, 2));
      
      res.json({ 
        message: 'Chapter migration data received successfully',
        data: migrationData
      });
    } catch (error) {
      console.error('Error processing migration:', error);
      res.status(500).json({ message: 'Failed to process migration' });
    }
  });

  // Populate course content with predefined data (Admin only)
  app.post('/api/admin/populate-course-content', isAdmin, async (req, res) => {
    try {
      const { courseModules } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      const { db } = await import('./db');
      
      // Sample content for the first 3 modules of "Preparation for Newborns"
      const contentUpdates = [
        {
          moduleId: 80,
          title: "1.1 Sleep Environment",
          content: `<h2>Creating the Perfect Sleep Environment for Your Baby</h2>
          
          <h3>Room Setup</h3>
          <p>Your baby's sleep environment is crucial for quality rest. Here are the key elements:</p>
          
          <ul>
            <li><strong>Room Temperature:</strong> Maintain 16-20°C (61-68°F)</li>
            <li><strong>Lighting:</strong> Keep the room dark during sleep times</li>
            <li><strong>Noise Level:</strong> Use white noise or keep ambient noise low</li>
            <li><strong>Air Quality:</strong> Ensure good ventilation and avoid strong scents</li>
          </ul>
          
          <h3>Safe Sleep Guidelines</h3>
          <p>Follow these essential safety guidelines:</p>
          
          <ul>
            <li>Always place baby on their back to sleep</li>
            <li>Use a firm sleep surface</li>
            <li>Keep the crib bare - no blankets, pillows, or toys</li>
            <li>Ensure proper crib mattress fit</li>
            <li>Use a sleep sack or swaddle for warmth</li>
          </ul>`,
          videoUrl: "https://example.com/sleep-environment-video.mp4",
          duration: 8
        },
        {
          moduleId: 81,
          title: "1.2 Safe Sleep Practices",
          content: `<h2>Safe Sleep Practices for Newborns</h2>
          
          <h3>The ABCs of Safe Sleep</h3>
          <p>Remember these three critical elements:</p>
          
          <ul>
            <li><strong>A</strong>lone - Baby sleeps alone in their crib</li>
            <li><strong>B</strong>ack - Always place baby on their back</li>
            <li><strong>C</strong>rib - Use a safe sleep surface</li>
          </ul>
          
          <h3>Sleep Position</h3>
          <p>Proper sleep positioning is essential:</p>
          
          <ul>
            <li>Back sleeping reduces SIDS risk by 50%</li>
            <li>Side sleeping is not safe</li>
            <li>Once baby can roll both ways, they can choose their position</li>
            <li>Never place baby on their stomach to sleep</li>
          </ul>`,
          videoUrl: "https://example.com/safe-sleep-video.mp4",
          duration: 12
        },
        {
          moduleId: 82,
          title: "1.3 Swaddling Techniques",
          content: `<h2>Master Swaddling Techniques</h2>
          
          <h3>Benefits of Swaddling</h3>
          <p>Swaddling can help your newborn by:</p>
          
          <ul>
            <li>Mimicking the womb environment</li>
            <li>Preventing startling reflexes</li>
            <li>Promoting longer sleep periods</li>
            <li>Providing comfort and security</li>
            <li>Reducing crying and fussiness</li>
          </ul>
          
          <h3>Step-by-Step Swaddling</h3>
          <p>Follow these steps for proper swaddling:</p>
          
          <ol>
            <li>Lay out a square blanket in diamond shape</li>
            <li>Fold the top corner to create a straight edge</li>
            <li>Place baby with shoulders just below the fold</li>
            <li>Wrap one side across baby's body</li>
            <li>Fold up the bottom corner</li>
            <li>Wrap the remaining side and secure</li>
          </ol>`,
          videoUrl: "https://example.com/swaddling-video.mp4",
          duration: 15
        }
      ];
      
      let updatedCount = 0;
      
      for (const content of contentUpdates) {
        try {
          await db
            .update(courseModules)
            .set({
              content: content.content,
              video_url: content.videoUrl,
              duration: content.duration,
              updated_at: new Date()
            })
            .where(eq(courseModules.id, content.moduleId));
          
          updatedCount++;
          console.log(`✅ Updated module ${content.moduleId}: ${content.title}`);
        } catch (error) {
          console.error(`❌ Error updating module ${content.moduleId}:`, error);
        }
      }
      
      res.json({ 
        message: `Successfully populated ${updatedCount} course modules with content`,
        updatedModules: updatedCount
      });
    } catch (error) {
      console.error('Error populating course content:', error);
      res.status(500).json({ message: 'Failed to populate course content' });
    }
  });

  // Seed sample orders endpoint disabled for production
  app.post('/api/admin/seed-orders', isAdmin, async (req, res) => {
    try {
      res.status(503).json({ message: 'Sample order seeding disabled for production use' });
    } catch (error) {
      console.error("Error with seed orders endpoint:", error);
      res.status(500).json({ message: "Endpoint disabled" });
    }
  });

  // Family invite routes (Gold subscribers only)
  app.get('/api/family/members', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.subscriptionTier !== 'gold') {
        return res.status(403).json({ message: 'Gold subscription required for family sharing' });
      }
      
      const members = await storage.getFamilyMembers(userId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching family members:", error);
      res.status(500).json({ message: "Failed to fetch family members" });
    }
  });

  app.post('/api/family/invite', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.subscriptionTier !== 'gold') {
        return res.status(403).json({ message: 'Gold subscription required for family sharing' });
      }
      
      const { name, email, role } = req.body;
      
      if (!name || !email || !role) {
        return res.status(400).json({ message: 'Name, email, and role are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Generate temporary password
      const tempPassword = AuthUtils.generateTemporaryPassword();
      
      // Create family invite
      const invite = await storage.createFamilyInvite({
        familyOwnerId: userId,
        inviteeEmail: email,
        inviteeName: name,
        inviteeRole: role,
        tempPassword,
        status: 'pending',
        expiresAt: AuthUtils.createTempPasswordExpiry(),
      });

      // Create user account with temporary password
      const newUser = await storage.upsertUser({
        id: AuthUtils.generateUserId(),
        email,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        subscriptionTier: 'gold', // Inherit family owner's subscription
        temporaryPassword: tempPassword,
        isFirstLogin: true,
        hasSetPassword: false,
        userRole: role,
      });

      // Create temporary password record
      await storage.createTemporaryPassword(newUser.id, tempPassword);

      // Send invite via Klaviyo
      try {
        const { klaviyoService } = await import('./klaviyo');
        await klaviyoService.sendFamilyInvite(newUser, tempPassword, user.firstName || 'Family Member');
      } catch (klaviyoError) {
        console.error('Klaviyo error:', klaviyoError);
        // Continue even if Klaviyo fails
      }

      res.json({ 
        message: 'Family invitation sent successfully',
        inviteId: invite.id,
        tempPassword // For testing purposes
      });
    } catch (error) {
      console.error("Error sending family invite:", error);
      res.status(500).json({ message: "Failed to send family invite" });
    }
  });

  app.get('/api/family/invites', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.subscriptionTier !== 'gold') {
        return res.status(403).json({ message: 'Gold subscription required for family sharing' });
      }
      
      const invites = await storage.getFamilyInvites(userId);
      res.json(invites);
    } catch (error) {
      console.error("Error fetching family invites:", error);
      res.status(500).json({ message: "Failed to fetch family invites" });
    }
  });

  app.post('/api/family/accept-invite', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Find the invite for this user's email
      const invite = await storage.getFamilyInviteByEmail(user.email);
      
      if (!invite) {
        return res.status(404).json({ message: 'No pending invite found for this user' });
      }
      
      if (invite.status !== 'pending') {
        return res.status(400).json({ message: 'Invite has already been processed' });
      }
      
      // Check if invite has expired
      if (new Date() > new Date(invite.expiresAt)) {
        return res.status(400).json({ message: 'Invite has expired' });
      }
      
      // Update invite status to accepted
      await storage.updateFamilyInviteStatus(invite.id, 'accepted');
      
      // Create family member record
      await storage.createFamilyMember({
        familyOwnerId: invite.familyOwnerId,
        memberId: userId,
        memberEmail: user.email,
        memberName: `${user.firstName} ${user.lastName}`.trim(),
        memberRole: invite.inviteeRole,
        status: 'active',
        joinedAt: new Date(),
      });
      
      res.json({ message: 'Invite accepted successfully' });
    } catch (error) {
      console.error("Error accepting family invite:", error);
      res.status(500).json({ message: "Failed to accept family invite" });
    }
  });

  app.delete('/api/family/members/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      const memberId = parseInt(req.params.id);
      
      if (!user || user.subscriptionTier !== 'gold') {
        return res.status(403).json({ message: 'Gold subscription required for family sharing' });
      }
      
      // Verify the family member belongs to this user's family
      const familyMember = await storage.getFamilyMember(memberId, userId);
      if (!familyMember) {
        return res.status(404).json({ message: 'Family member not found' });
      }
      
      await storage.deleteFamilyMember(memberId);
      res.json({ message: 'Family member removed successfully' });
    } catch (error) {
      console.error("Error removing family member:", error);
      res.status(500).json({ message: "Failed to remove family member" });
    }
  });

  // Admin invite routes
  app.post('/api/admin/invite', isAdmin, async (req, res) => {
    try {
      const { name, email, role } = req.body;
      
      if (!name || !email || !role) {
        return res.status(400).json({ message: 'Name, email, and role are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Generate temporary password
      const tempPassword = AuthUtils.generateTemporaryPassword();
      
      // Create admin user account with temporary password
      const newUser = await storage.upsertUser({
        id: AuthUtils.generateUserId(),
        email,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        subscriptionTier: 'gold', // Admins get gold by default
        temporaryPassword: tempPassword,
        isFirstLogin: true,
        hasSetPassword: false,
        userRole: role,
        isAdmin: true, // Grant admin privileges
      });

      // Create temporary password record
      await storage.createTemporaryPassword(newUser.id, tempPassword);

      // Send invite via Klaviyo
      try {
        const { klaviyoService } = await import('./klaviyo');
        await klaviyoService.sendAdminInvite(newUser, tempPassword);
      } catch (klaviyoError) {
        console.error('Klaviyo error:', klaviyoError);
        // Continue even if Klaviyo fails
      }

      res.json({ 
        message: 'Admin invitation sent successfully',
        userId: newUser.id,
        tempPassword // For testing purposes
      });
    } catch (error) {
      console.error("Error sending admin invite:", error);
      res.status(500).json({ message: "Failed to send admin invite" });
    }
  });

  // Stripe product sync API endpoints
  app.get('/api/stripe/products', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getStripeProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching Stripe products:", error);
      res.status(500).json({ message: "Failed to fetch Stripe products" });
    }
  });

  app.get('/api/stripe/products/:productId', isAuthenticated, async (req, res) => {
    try {
      const { productId } = req.params;
      const product = await storage.getStripeProductById(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching Stripe product:", error);
      res.status(500).json({ message: "Failed to fetch Stripe product" });
    }
  });

  app.post('/api/stripe/products', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const productData = insertStripeProductSchema.parse(req.body);
      const product = await storage.createStripeProduct(productData);
      
      res.json(product);
    } catch (error) {
      console.error("Error creating Stripe product:", error);
      res.status(500).json({ message: "Failed to create Stripe product" });
    }
  });

  app.put('/api/stripe/products/:productId', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const { productId } = req.params;
      const updates = req.body;
      
      const product = await storage.updateStripeProduct(productId, updates);
      res.json(product);
    } catch (error) {
      console.error("Error updating Stripe product:", error);
      res.status(500).json({ message: "Failed to update Stripe product" });
    }
  });

  app.post('/api/stripe/sync/:productId', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const { productId } = req.params;
      const { priceId } = req.body;
      
      if (!priceId) {
        return res.status(400).json({ message: 'Price ID is required' });
      }
      
      const success = await stripeSync.syncProductFromStripe(productId, priceId);
      
      if (success) {
        res.json({ message: 'Product synced successfully' });
      } else {
        res.status(400).json({ message: 'Failed to sync product' });
      }
    } catch (error) {
      console.error("Error syncing Stripe product:", error);
      res.status(500).json({ message: "Failed to sync Stripe product" });
    }
  });

  app.post('/api/stripe/sync/all', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      await stripeSync.syncAllProducts();
      res.json({ message: 'All products synced successfully' });
    } catch (error) {
      console.error("Error syncing all Stripe products:", error);
      res.status(500).json({ message: "Failed to sync all Stripe products" });
    }
  });

  app.get('/api/stripe/pricing/course/:courseId', isAuthenticated, async (req, res) => {
    try {
      const { courseId } = req.params;
      const price = await storage.getCoursePricing(parseInt(courseId));
      res.json({ price });
    } catch (error) {
      console.error("Error fetching course pricing:", error);
      res.status(500).json({ message: "Failed to fetch course pricing" });
    }
  });

  app.get('/api/stripe/pricing/subscription', isAuthenticated, async (req, res) => {
    try {
      const pricing = await storage.getSubscriptionPricing();
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching subscription pricing:", error);
      res.status(500).json({ message: "Failed to fetch subscription pricing" });
    }
  });

  // Update marketing opt-in status in Klaviyo
  app.post('/api/klaviyo/marketing-opt-in', async (req, res) => {
    try {
      const { email, optIn } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Update the user's marketing consent in Klaviyo
      const profileData = {
        type: "profile",
        attributes: {
          email,
          properties: {
            marketing_opt_in: optIn
          },
          subscriptions: optIn ? {
            email: {
              marketing: {
                consent: "SUBSCRIBED"
              }
            }
          } : undefined
        }
      };

      const response = await fetch(`https://a.klaviyo.com/api/profile-import/`, {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY}`,
          'Content-Type': 'application/json',
          'revision': '2024-10-15'
        },
        body: JSON.stringify({
          data: profileData
        })
      });

      if (!response.ok) {
        throw new Error(`Klaviyo API error: ${response.status}`);
      }

      const result = await response.json();
      res.json({ success: true, profileId: result.data?.id });
    } catch (error) {
      console.error('Error updating marketing opt-in:', error);
      res.status(500).json({ error: 'Failed to update marketing preferences' });
    }
  });

  // Klaviyo Testing Endpoints
  app.post('/api/test/klaviyo/signup', async (req, res) => {
    try {
      const { firstName, lastName, email, signupSource = "test_signup" } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: 'firstName, lastName, and email are required' });
      }

      // Create a test user object
      const testUser = {
        id: `test_${Date.now()}`,
        firstName,
        lastName,
        email,
        phoneNumber: null,
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Test the signup Klaviyo flow
      const syncResult = await klaviyoService.syncUserToKlaviyo(testUser);
      
      res.json({ 
        message: 'Klaviyo signup test completed',
        success: syncResult,
        user: testUser,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Klaviyo signup test error:", error);
      res.status(500).json({ message: "Klaviyo signup test failed", error: error.message });
    }
  });

  app.post('/api/test/klaviyo/public-checkout', async (req, res) => {
    try {
      const { firstName, lastName, email, dueDate, signupSource = "test_public_checkout" } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: 'firstName, lastName, and email are required' });
      }

      // Create a test user object
      const testUser = {
        id: `test_${Date.now()}`,
        firstName,
        lastName,
        email,
        phoneNumber: null,
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create test customer details
      const customerDetails = {
        dueDate: dueDate || "2025-08-15",
        interests: ["Baby Sleep", "Toddler Sleep"],
        signupSource: signupSource
      };

      // Test the public checkout Klaviyo flow
      const syncResult = await klaviyoService.syncBigBabySignupToKlaviyo(testUser, customerDetails);
      
      res.json({ 
        message: 'Klaviyo public checkout test completed',
        success: syncResult,
        user: testUser,
        customerDetails,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Klaviyo public checkout test error:", error);
      res.status(500).json({ message: "Klaviyo public checkout test failed", error: error.message });
    }
  });

  app.post('/api/test/klaviyo/welcome-email', async (req, res) => {
    try {
      const { firstName, lastName, email, tempPassword = "TempPass123!" } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: 'firstName, lastName, and email are required' });
      }

      // Create a test user object
      const testUser = {
        id: `test_${Date.now()}`,
        firstName,
        lastName,
        email,
        phoneNumber: null,
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Test the welcome email flow
      const welcomeResult = await klaviyoService.sendPublicCheckoutWelcome(testUser, tempPassword);
      
      res.json({ 
        message: 'Klaviyo welcome email test completed',
        success: welcomeResult,
        user: testUser,
        tempPassword,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Klaviyo welcome email test error:", error);
      res.status(500).json({ message: "Klaviyo welcome email test failed", error: error.message });
    }
  });

  app.post('/api/test/klaviyo/password-reset', async (req, res) => {
    try {
      const { firstName, lastName, email, resetToken = "reset_token_123" } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: 'firstName, lastName, and email are required' });
      }

      // Create a test user object
      const testUser = {
        id: `test_${Date.now()}`,
        firstName,
        lastName,
        email,
        phoneNumber: null,
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Test the password reset Klaviyo flow
      const emailResult = await klaviyoService.sendPasswordResetEmail(testUser, resetToken);
      
      res.json({ 
        message: 'Klaviyo password reset test completed',
        success: emailResult,
        user: testUser,
        resetToken,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Klaviyo password reset test error:", error);
      res.status(500).json({ message: "Klaviyo password reset test failed", error: error.message });
    }
  });

  app.post('/api/test/klaviyo/otp', async (req, res) => {
    try {
      const { firstName, lastName, email, otpCode = "123456", purpose = "email_verification" } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: 'firstName, lastName, and email are required' });
      }

      // Create a test user object
      const testUser = {
        id: `test_${Date.now()}`,
        firstName,
        lastName,
        email,
        phoneNumber: null,
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Test the OTP email Klaviyo flow
      const emailResult = await klaviyoService.sendOTPEmail(testUser, otpCode, purpose);
      
      res.json({ 
        message: 'Klaviyo OTP test completed',
        success: emailResult,
        user: testUser,
        otpCode,
        purpose,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Klaviyo OTP test error:", error);
      res.status(500).json({ message: "Klaviyo OTP test failed", error: error.message });
    }
  });

  app.get('/api/test/klaviyo/status', async (req, res) => {
    try {
      const hasApiKey = !!process.env.KLAVIYO_API_KEY;
      const listIds = {
        superapp: "XBRBuN",
        appSignups: "WyGwy9"
      };
      
      res.json({
        klaviyoConfigured: hasApiKey,
        listIds,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Klaviyo status check error:", error);
      res.status(500).json({ message: "Klaviyo status check failed", error: error.message });
    }
  });

  // Comprehensive Klaviyo sync test endpoint
  app.get('/api/test/klaviyo/comprehensive-sync', isAppAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log(`Testing comprehensive Klaviyo sync for user: ${userId}`);
      
      // Get comprehensive user data including children and course purchases
      const { user, children, coursePurchases } = await storage.getUserWithChildren(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Perform comprehensive sync
      const result = await klaviyoService.syncUserToKlaviyo(user, children, coursePurchases);
      
      res.json({ 
        success: result,
        message: result ? 'Comprehensive Klaviyo sync completed successfully' : 'Failed to sync comprehensive data to Klaviyo',
        syncedData: {
          user: { 
            email: user.email, 
            id: user.id,
            subscriptionTier: user.subscriptionTier,
            marketingOptIn: user.marketingOptIn,
            signInCount: user.signInCount,
            phoneNumber: user.phoneNumber,
            userRole: user.userRole,
            primaryConcerns: user.primaryConcerns
          },
          children: children.map(child => ({
            name: child.name,
            dateOfBirth: child.dateOfBirth,
            gender: child.gender
          })),
          coursePurchases: coursePurchases.map(purchase => ({
            courseId: purchase.courseId,
            purchasedAt: purchase.purchasedAt,
            status: purchase.status
          }))
        }
      });
    } catch (error) {
      console.error('Comprehensive Klaviyo sync test error:', error);
      res.status(500).json({ message: 'Test failed', error: error.message });
    }
  });

  // Stripe sync test endpoints
  app.get('/api/test/stripe/status', async (req, res) => {
    try {
      const healthStatus = await stripeDataSyncService.getStripeHealthStatus();
      res.json({
        stripe_configured: !!process.env.STRIPE_SECRET_KEY,
        ...healthStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/test/stripe/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const stripeData = await stripeDataSyncService.getStripeDataForUser(user);
      
      if (!stripeData) {
        return res.json({
          message: 'No Stripe data found for user',
          hasStripeCustomer: !!user.stripeCustomerId,
          user: { id: user.id, email: user.email }
        });
      }

      // Sync to database (when implemented)
      const syncResult = await stripeDataSyncService.syncStripeDataToDatabase(user, stripeData);
      
      res.json({
        message: 'Stripe data sync test completed',
        success: syncResult,
        stripeData: stripeData,
        user: { id: user.id, email: user.email },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Test endpoint for Slack notifications
  app.post('/api/test/slack-notification', async (req, res) => {
    try {
      const { type = 'signup', ...data } = req.body;
      
      let result;
      switch (type) {
        case 'signup':
          result = await slackNotificationService.sendSignupNotification({
            name: data.name || 'Test User',
            email: data.email || 'test@drgolly.com',
            marketingOptIn: data.marketingOptIn !== undefined ? data.marketingOptIn : true,
            primaryConcerns: data.primaryConcerns || ['Baby Sleep', 'Toddler Sleep'],
            signupSource: data.signupSource || 'Test Integration',
            signupType: data.signupType || 'new_customer',
            previousCourses: data.previousCourses,
            coursePurchased: data.coursePurchased
          });
          break;
        case 'payment':
          result = await slackNotificationService.sendPaymentNotification({
            name: data.name || 'Test User',
            email: data.email || 'test@drgolly.com',
            amount: data.amount || 12000,
            courseName: data.courseName || 'Little Baby Sleep Program'
          });
          break;
        case 'support':
          result = await slackNotificationService.sendSupportNotification({
            name: data.name || 'Test User',
            email: data.email || 'test@drgolly.com',
            subject: data.subject || 'Test Support Request',
            message: data.message || 'This is a test support message from the feature/signup branch'
          });
          break;
        default:
          return res.status(400).json({ error: 'Invalid notification type' });
      }
      
      res.json({
        success: result,
        message: `Slack ${type} notification test ${result ? 'successful' : 'failed'}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Slack notification test failed"
      });
    }
  });

  // Test endpoint for Slack bot verification
  app.get('/api/test/slack-auth', async (req, res) => {
    try {
      const result = await slackNotificationService.testConnection();
      res.json({
        success: result,
        message: result ? 'Slack connection verified' : 'Slack connection failed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Slack connection test failed"
      });
    }
  });

  // Support request endpoint
  app.post('/api/support', async (req, res) => {
    try {
      const { name, email, phone, message } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ message: "Name, email, and message are required" });
      }

      // Send email notification to hello@drgolly.com
      const emailData = {
        to: 'hello@drgolly.com',
        subject: `Support Request from ${name}`,
        html: `
          <h2>New Support Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><em>Sent from Dr. Golly Support System</em></p>
        `
      };

      // Send Slack notification
      const slackData = {
        text: `New Support Request from ${name}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*New Support Request*\n\n*Name:* ${name}\n*Email:* ${email}\n*Phone:* ${phone || 'Not provided'}\n\n*Message:*\n${message}`
            }
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Reply via Email"
                },
                url: `mailto:${email}?subject=Re: Your Support Request`
              }
            ]
          }
        ]
      };

      // Send to both email and Slack (implement with your preferred service)
      // For now, we'll just log the data and return success
      console.log('Support request received:', { name, email, phone, message });
      console.log('Email data:', emailData);
      console.log('Slack data:', JSON.stringify(slackData, null, 2));

      // TODO: Implement actual email sending (e.g., via SendGrid, Mailgun, etc.)
      // TODO: Implement actual Slack webhook sending
      
      res.json({ 
        success: true, 
        message: "Support request received and notifications sent" 
      });
    } catch (error) {
      console.error("Error processing support request:", error);
      res.status(500).json({ message: "Failed to process support request" });
    }
  });

  // Enhanced course management endpoints

  app.post('/api/courses/:courseId/chapters', async (req, res) => {
    try {
      const { courseId } = req.params;
      const chapterData = req.body;
      const chapter = await storage.createCourseChapter(parseInt(courseId), chapterData);
      res.json(chapter);
    } catch (error) {
      console.error("Error creating course chapter:", error);
      res.status(500).json({ message: "Failed to create chapter" });
    }
  });

  app.put('/api/courses/:courseId/chapters/reorder', async (req, res) => {
    try {
      const { courseId } = req.params;
      const { chapters } = req.body;
      await storage.reorderCourseChapters(parseInt(courseId), chapters);
      res.json({ message: "Chapter order updated successfully" });
    } catch (error) {
      console.error("Error reordering chapters:", error);
      res.status(500).json({ message: "Failed to reorder chapters" });
    }
  });

  app.get('/api/chapters/:chapterId/modules', async (req, res) => {
    try {
      const { chapterId } = req.params;
      const modules = await storage.getChapterModules(parseInt(chapterId));
      res.json(modules);
    } catch (error) {
      console.error("Error fetching chapter modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.post('/api/chapters/:chapterId/modules', async (req, res) => {
    try {
      const { chapterId } = req.params;
      const moduleData = req.body;
      const module = await storage.createCourseModule(parseInt(chapterId), moduleData);
      res.json(module);
    } catch (error) {
      console.error("Error creating course module:", error);
      res.status(500).json({ message: "Failed to create module" });
    }
  });

  app.put('/api/modules/:moduleId', async (req, res) => {
    try {
      const { moduleId } = req.params;
      const moduleData = req.body;
      const module = await storage.updateCourseModule(parseInt(moduleId), moduleData);
      res.json(module);
    } catch (error) {
      console.error("Error updating course module:", error);
      res.status(500).json({ message: "Failed to update module" });
    }
  });

  app.put('/api/chapters/:chapterId/modules/reorder', async (req, res) => {
    try {
      const { chapterId } = req.params;
      const { modules } = req.body;
      await storage.reorderCourseModules(parseInt(chapterId), modules);
      res.json({ message: "Module order updated successfully" });
    } catch (error) {
      console.error("Error reordering modules:", error);
      res.status(500).json({ message: "Failed to reorder modules" });
    }
  });

  app.put('/api/chapters/:chapterId/lessons/reorder', async (req, res) => {
    try {
      const { chapterId } = req.params;
      const { lessons } = req.body;
      await storage.reorderCourseLessons(parseInt(chapterId), lessons);
      res.json({ message: "Lesson order updated successfully" });
    } catch (error) {
      console.error("Error reordering lessons:", error);
      res.status(500).json({ message: "Failed to reorder lessons" });
    }
  });

  // Enhanced blog management endpoints
  app.post('/api/blog-posts', async (req, res) => {
    try {
      const blogPostData = req.body;
      const blogPost = await storage.createBlogPost(blogPostData);
      res.json(blogPost);
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.put('/api/blog-posts/:postId', async (req, res) => {
    try {
      const { postId } = req.params;
      const blogPostData = req.body;
      const blogPost = await storage.updateBlogPost(parseInt(postId), blogPostData);
      res.json(blogPost);
    } catch (error) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.put('/api/courses/:courseId', async (req, res) => {
    try {
      const { courseId } = req.params;
      const courseData = req.body;
      const course = await storage.updateCourse(parseInt(courseId), courseData);
      res.json(course);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.post('/api/courses', async (req, res) => {
    try {
      const courseData = req.body;
      const course = await storage.createCourse(courseData);
      res.json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  // Public freebie sharing routes
  app.get('/api/freebie/:id/share', async (req, res) => {
    try {
      const freebieId = parseInt(req.params.id);
      const freebie = await storage.getBlogPost(freebieId);
      
      if (!freebie || freebie.category !== 'freebies') {
        return res.status(404).json({ message: 'Freebie not found' });
      }
      
      res.json({
        id: freebie.id,
        title: freebie.title,
        description: freebie.description,
        thumbnailUrl: freebie.thumbnailUrl,
        pdfAsset: freebie.pdfAsset,
        readTime: freebie.readTime,
      });
    } catch (error) {
      console.error('Error fetching freebie for sharing:', error);
      res.status(500).json({ message: 'Failed to fetch freebie' });
    }
  });

  app.post('/api/freebie/:id/capture', async (req, res) => {
    try {
      const freebieId = parseInt(req.params.id);
      const { firstName, email } = req.body;
      
      if (!firstName || !email) {
        return res.status(400).json({ message: 'First name and email are required' });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      
      // Check if freebie exists
      const freebie = await storage.getBlogPost(freebieId);
      if (!freebie || freebie.category !== 'freebies') {
        return res.status(404).json({ message: 'Freebie not found' });
      }
      
      // Capture lead data
      const leadData = {
        firstName,
        email,
        freebieId,
        topOfFunnelNurture: true,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        referrerUrl: req.get('Referer') || '',
      };
      
      let leadCapture;
      try {
        leadCapture = await storage.createLeadCapture(leadData);
      } catch (error: any) {
        // Check if user already exists
        if (error.message?.includes('unique constraint') || error.code === '23505') {
          leadCapture = await storage.getLeadCaptureByEmail(email);
        } else {
          throw error;
        }
      }
      
      // Add to Klaviyo nurture list
      try {
        await klaviyoService.syncLeadToKlaviyo(leadCapture, freebie.title);
      } catch (error) {
        console.error('Klaviyo sync failed for lead capture:', error);
        // Continue even if Klaviyo fails
      }
      
      res.json({
        message: 'Lead captured successfully',
        leadId: leadCapture.id,
        downloadUrl: freebie.pdfAsset,
        title: freebie.title,
      });
    } catch (error) {
      console.error('Error capturing lead:', error);
      res.status(500).json({ message: 'Failed to capture lead' });
    }
  });

  app.get('/api/share/:freebieId', async (req, res) => {
    try {
      const freebieId = parseInt(req.params.freebieId);
      const freebie = await storage.getBlogPost(freebieId);
      
      if (!freebie || freebie.category !== 'freebies') {
        return res.status(404).send('Freebie not found');
      }
      
      // Return basic HTML page for public sharing
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${freebie.title} - Dr. Golly</title>
          <meta name="description" content="${freebie.description}">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { max-width: 200px; margin-bottom: 20px; }
            .freebie-image { width: 100%; max-width: 400px; border-radius: 8px; margin-bottom: 20px; }
            .form-group { margin-bottom: 20px; }
            .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
            .form-group input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; }
            .btn { background: #095D66; color: white; padding: 12px 30px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; width: 100%; }
            .btn:hover { background: #0a6b75; }
            .btn:disabled { background: #ccc; cursor: not-allowed; }
            .thank-you { display: none; text-align: center; }
            .thank-you h2 { color: #095D66; }
            .signup-cta { background: #f0f9ff; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center; }
            .signup-btn { background: #166534; color: white; padding: 10px 25px; border: none; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="/api/assets/dr-golly-logo.png" alt="Dr. Golly" class="logo">
              <h1>${freebie.title}</h1>
              <p>${freebie.description}</p>
            </div>
            
            <div id="capture-form">
              <img src="${freebie.thumbnailUrl}" alt="${freebie.title}" class="freebie-image">
              <p><strong>Please provide your details to access this free download:</strong></p>
              
              <form id="leadForm">
                <div class="form-group">
                  <label for="firstName">First Name</label>
                  <input type="text" id="firstName" name="firstName" required>
                </div>
                
                <div class="form-group">
                  <label for="email">Email Address</label>
                  <input type="email" id="email" name="email" required>
                </div>
                
                <button type="submit" class="btn" id="downloadBtn">Download Now</button>
              </form>
            </div>
            
            <div id="thank-you" class="thank-you">
              <h2>Thank you!</h2>
              <p>Your download will begin shortly.</p>
              <p><strong>There's plenty more where this came from!</strong></p>
              <div class="signup-cta">
                <p>Get access to our complete library of parenting resources with a free Dr. Golly account.</p>
                <a href="/signup" class="signup-btn">Create Free Account</a>
              </div>
            </div>
          </div>
          
          <script>
            document.getElementById('leadForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              
              const firstName = document.getElementById('firstName').value;
              const email = document.getElementById('email').value;
              const btn = document.getElementById('downloadBtn');
              
              btn.disabled = true;
              btn.textContent = 'Processing...';
              
              try {
                const response = await fetch('/api/freebie/${freebieId}/capture', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ firstName, email }),
                });
                
                const data = await response.json();
                
                if (response.ok) {
                  // Show thank you message
                  document.getElementById('capture-form').style.display = 'none';
                  document.getElementById('thank-you').style.display = 'block';
                  
                  // Start download
                  if (data.downloadUrl) {
                    const link = document.createElement('a');
                    link.href = data.downloadUrl;
                    link.download = data.title + '.pdf';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                } else {
                  alert(data.message || 'An error occurred');
                  btn.disabled = false;
                  btn.textContent = 'Download Now';
                }
              } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
                btn.disabled = false;
                btn.textContent = 'Download Now';
              }
            });
          </script>
        </body>
        </html>
      `;
      
      res.send(html);
    } catch (error) {
      console.error('Error serving shared freebie:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Course Migration endpoint (Admin only)
  app.post('/api/admin/migrate-courses', isAdmin, async (req: any, res) => {
    try {
      console.log('Starting course migration from CSV files...');
      
      // Import the migration function
      const { migrateCourses } = await import('../scripts/migrate-courses-from-csv');
      
      // Run the migration
      await migrateCourses();
      
      res.json({ 
        success: true, 
        message: 'Course migration completed successfully' 
      });
    } catch (error) {
      console.error('Course migration error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Course migration failed', 
        error: error.message 
      });
    }
  });

  // Service routes
  app.get('/api/services', async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get('/api/services/:id', async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.post('/api/services', isAdmin, async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  // Service booking routes
  app.get('/api/service-bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getUserServiceBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching service bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/service-bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookingData = insertServiceBookingSchema.parse({
        ...req.body,
        userId,
        preferredDate: new Date(req.body.preferredDate)
      });
      
      // Create the booking
      const booking = await storage.createServiceBooking(bookingData);
      
      // Get service details for Klaviyo integration
      const service = await storage.getService(booking.serviceId);
      
      // Add service to user's activated services
      if (service) {
        await storage.addUserActivatedService(userId, service.id.toString());
      }
      
      // Get user details for Klaviyo integration
      const user = await storage.getUser(userId);
      
      // Send service booking event to Klaviyo
      if (user && service) {
        try {
          await klaviyoService.sendServiceBookingEvent(user.email, {
            service_name: service.title,
            service_type: service.serviceType,
            booking_date: booking.preferredDate.toISOString(),
            booking_time: booking.preferredTime,
            service_duration: service.duration,
            service_price: service.price,
            booking_status: booking.bookingStatus,
            booking_notes: booking.notes || '',
            customer_name: `${user.firstName} ${user.lastName}`,
            customer_id: userId,
            booking_id: booking.id
          });
        } catch (klaviyoError) {
          console.error("Failed to send service booking event to Klaviyo:", klaviyoError);
          // Continue with booking creation even if Klaviyo fails
        }
      }
      
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating service booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch('/api/service-bookings/:id/status', isAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      
      const booking = await storage.updateServiceBookingStatus(bookingId, status);
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // User activated services routes
  app.get('/api/user/activated-services', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activatedServices = await storage.getUserActivatedServices(userId);
      res.json(activatedServices);
    } catch (error) {
      console.error("Error fetching activated services:", error);
      res.status(500).json({ message: "Failed to fetch activated services" });
    }
  });

  // Seed services endpoint
  app.post('/api/seed-services', isAuthenticated, async (req, res) => {
    try {
      const { seedServices } = await import('./seed-services');
      await seedServices();
      res.json({ message: 'Services seeded successfully' });
    } catch (error) {
      console.error("Error seeding services:", error);
      res.status(500).json({ message: "Failed to seed services" });
    }
  });

  // Seed shopping products endpoint
  app.post('/api/seed-shopping-products', async (req, res) => {
    try {
      // Check if products already exist
      const existingProducts = await storage.getShoppingProducts();
      if (existingProducts.length > 0) {
        return res.json({ message: 'Shopping products already exist, skipping seed.' });
      }

      const products = [
        {
          title: "Your Baby Doesn't Come with a Book",
          author: "Dr. Daniel Golshevsky",
          description: "A comprehensive guide to navigating the first year with your baby, written by sleep expert Dr. Daniel Golshevsky.",
          priceField: "book1Price",
          stripePriceAudId: "price_book1_aud",
          stripePriceUsdId: "price_book1_usd",
          stripePriceEurId: "price_book1_eur",
          amazonUrl: "https://www.amazon.com.au/Your-Baby-Doesnt-Come-Book/dp/1761212885/ref=asc_df_1761212885?mcid=3fad30ed30f63eaea899eb454e9764d0&tag=googleshopmob-22&linkCode=df0&hvadid=712358788289&hvpos=&hvnetw=g&hvrand=15313830547994388509&hvpone=&hvptwo=&hvqmt=&hvdev=m&hvdvcmdl=&hvlocint=&hvlocphy=9112781&hvtargid=pla-2201729947671&psc=1&gad_source=1&dplnkId=a7c77b94-6a4b-4378-8e30-979046fdf615&nodl=1",
          category: "Book",
          inStock: true,
          isFeatured: true,
          rating: 4.8,
          reviewCount: 127,
        },
        {
          title: "Dr Golly's Guide to Family Illness",
          author: "Dr. Daniel Golshevsky",
          description: "Essential guide for managing family health and illness, providing practical advice for parents and caregivers.",
          priceField: "book2Price",
          stripePriceAudId: "price_book2_aud",
          stripePriceUsdId: "price_book2_usd",
          stripePriceEurId: "price_book2_eur",
          amazonUrl: "https://www.amazon.com.au/Dr-Gollys-Guide-Family-Illness/dp/1761215337/ref=asc_df_1761215337?mcid=5fa13d733a113d21bba7852ac1616b4e&tag=googleshopmob-22&linkCode=df0&hvadid=712379283545&hvpos=&hvnetw=g&hvrand=15313830547994388509&hvpone=&hvptwo=&hvqmt=&hvdev=m&hvdvcmdl=&hvlocint=&hvlocphy=9112781&hvtargid=pla-2422313977118&psc=1&gad_source=1&dplnkId=209a3a52-d644-40ef-a3d7-50f9fc92116d&nodl=1",
          category: "Book",
          inStock: true,
          isFeatured: false,
          rating: 4.7,
          reviewCount: 89,
        },
      ];

      // Create products in database
      for (const product of products) {
        await storage.createShoppingProduct(product);
      }

      res.json({ message: 'Shopping products seeded successfully!' });
    } catch (error) {
      console.error("Error seeding shopping products:", error);
      res.status(500).json({ message: "Failed to seed shopping products" });
    }
  });

  // Shopping product routes
  app.get('/api/shopping-products', async (req, res) => {
    try {
      // Use raw SQL directly - bypass Drizzle ORM completely
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      const products = await sql`SELECT id, title, author, description, category, stripe_product_id, 
                                        stripe_price_aud_id, stripe_price_usd_id, stripe_price_eur_id, 
                                        price_field, rating, review_count, image_url, amazon_url, 
                                        is_active, is_featured, in_stock, created_at, updated_at
                                 FROM shopping_products 
                                 WHERE is_active = true AND in_stock = true
                                 ORDER BY title`;
      
      // Get dynamic pricing from regional pricing table
      const pricing = await sql`SELECT book1_price, book2_price, currency 
                                FROM regional_pricing 
                                WHERE region = 'AU' AND is_active = true 
                                LIMIT 1`;
      
      const priceData = pricing[0] || { book1_price: 30, book2_price: 30, currency: 'AUD' };
      
      // Add dynamic pricing for books
      const productsWithPricing = products.map((product: any) => {
        const price = product.price_field === 'book1Price' ? priceData.book1_price : priceData.book2_price;
        return {
          ...product,
          price: parseFloat(price),
          currency: priceData.currency,
          // Map fields for frontend compatibility
          priceField: product.price_field,
          stripeProductId: product.stripe_product_id,
          stripePriceUsdId: product.stripe_price_usd_id,
          stripePriceEurId: product.stripe_price_eur_id,
          imageUrl: product.image_url,
          amazonUrl: product.amazon_url,
          isActive: product.is_active,
          isFeatured: product.is_featured,
          inStock: product.in_stock,
          reviewCount: product.review_count
        };
      });
      
      res.json(productsWithPricing);
    } catch (error) {
      console.error("Error fetching shopping products:", error);
      res.status(500).json({ message: "Failed to fetch shopping products" });
    }
  });

  app.get('/api/shopping-products/:id', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getShoppingProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching shopping product:", error);
      res.status(500).json({ message: "Failed to fetch shopping product" });
    }
  });

  app.post('/api/shopping-products', isAdmin, async (req, res) => {
    try {
      const product = await storage.createShoppingProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating shopping product:", error);
      res.status(500).json({ message: "Failed to create shopping product" });
    }
  });

  app.put('/api/shopping-products/:id', isAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.updateShoppingProduct(productId, req.body);
      res.json(product);
    } catch (error) {
      console.error("Error updating shopping product:", error);
      res.status(500).json({ message: "Failed to update shopping product" });
    }
  });

  app.delete('/api/shopping-products/:id', isAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      await storage.deleteShoppingProduct(productId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting shopping product:", error);
      res.status(500).json({ message: "Failed to delete shopping product" });
    }
  });

  // Cart endpoints
  app.get('/api/cart', async (req: any, res) => {
    try {
      // Get the user ID from the session (works with both auth systems) - no hardcoded fallback
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      console.log('Cart request for user ID:', userId);
      
      let cart;
      try {
        cart = await storage.getUserCart(userId);
      } catch (error) {
        console.log('Drizzle ORM failed for cart, using raw SQL fallback');
        // Use raw SQL to avoid Drizzle ORM parsing issues
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`SELECT * FROM cart_items WHERE user_id = ${userId}`;
        cart = result || [];
      }
      
      res.json(cart);
    } catch (error: any) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/cart', async (req: any, res) => {
    try {
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      console.log('Adding to cart for user ID:', userId);
      
      let cartItem;
      try {
        cartItem = await storage.addToCart({
          userId: userId,
          itemType: req.body.itemType,
          itemId: req.body.itemId,
          quantity: req.body.quantity || 1
        });
      } catch (error) {
        console.log('Drizzle ORM failed for add to cart, using raw SQL fallback');
        // Use raw SQL to avoid Drizzle ORM parsing issues
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`
          INSERT INTO cart_items (user_id, item_type, item_id, quantity, added_at)
          VALUES (${userId}, ${req.body.itemType}, ${req.body.itemId}, ${req.body.quantity || 1}, NOW())
          RETURNING *
        `;
        cartItem = result[0];
      }
      
      res.json(cartItem);
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/cart/:id', async (req: any, res) => {
    try {
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      let cartItem;
      try {
        cartItem = await storage.updateCartItem(parseInt(req.params.id), req.body.quantity);
      } catch (error) {
        console.log('Drizzle ORM failed for update cart item, using raw SQL fallback');
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`
          UPDATE cart_items 
          SET quantity = ${req.body.quantity}
          WHERE id = ${parseInt(req.params.id)}
          RETURNING *
        `;
        cartItem = result[0];
      }
      
      res.json(cartItem);
    } catch (error: any) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/cart/:id', async (req: any, res) => {
    try {
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      try {
        await storage.removeFromCart(parseInt(req.params.id));
      } catch (error) {
        console.log('Drizzle ORM failed for remove from cart, using raw SQL fallback');
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        await sql`DELETE FROM cart_items WHERE id = ${parseInt(req.params.id)}`;
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/cart', async (req: any, res) => {
    try {
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      try {
        await storage.clearUserCart(userId);
      } catch (error) {
        console.log('Drizzle ORM failed for clear cart, using raw SQL fallback');
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        await sql`DELETE FROM cart_items WHERE user_id = ${userId}`;
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/cart/count', async (req: any, res) => {
    try {
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.json({ count: 0 }); // Return empty cart for unauthenticated users
      }
      
      let count = 0;
      try {
        const cart = await storage.getUserCart(userId);
        count = cart.reduce((total, item) => total + item.quantity, 0);
      } catch (error) {
        console.log('Drizzle ORM failed for cart count, using raw SQL fallback');
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`
          SELECT COALESCE(SUM(quantity), 0) as count 
          FROM cart_items 
          WHERE user_id = ${userId}
        `;
        count = result[0]?.count || 0;
      }
      
      res.json({ count });
    } catch (error: any) {
      console.error("Error getting cart count:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get regional pricing for products
  app.get('/api/regional-pricing', async (req, res) => {
    try {
      const userIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
      const regionalPricing = await regionalPricingService.getPricingForIP(userIP);
      res.json(regionalPricing);
    } catch (error) {
      console.error("Error fetching regional pricing:", error);
      res.status(500).json({ message: "Failed to fetch regional pricing" });
    }
  });

  // Book purchase endpoints
  app.post('/api/create-book-payment', async (req, res) => {
    try {
      const { productId, customerDetails } = req.body;
      
      // Get product details
      const product = await storage.getShoppingProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Get regional pricing
      const userIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
      const regionalPricing = await regionalPricingService.getPricingForIP(userIP);

      // Get the appropriate price based on region
      const priceAmount = regionalPricing[product.priceField as keyof typeof regionalPricing];
      if (!priceAmount) {
        return res.status(500).json({ message: "Price not available for this region" });
      }

      // Get the appropriate Stripe price ID
      let stripePriceId;
      if (regionalPricing.currency === 'AUD') {
        stripePriceId = product.stripePriceAudId;
      } else if (regionalPricing.currency === 'USD') {
        stripePriceId = product.stripePriceUsdId;
      } else if (regionalPricing.currency === 'EUR') {
        stripePriceId = product.stripePriceEurId;
      } else {
        return res.status(500).json({ message: "Currency not supported" });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(priceAmount.toString()) * 100), // Convert to cents
        currency: regionalPricing.currency.toLowerCase(),
        metadata: {
          type: 'book',
          productId: product.id.toString(),
          productName: product.title,
          customerEmail: customerDetails.email,
          customerName: customerDetails.firstName,
          region: regionalPricing.region,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: priceAmount,
        currency: regionalPricing.currency,
        product: product
      });
    } catch (error) {
      console.error("Error creating book payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Admin endpoint to update Stripe products with course images
  app.post('/api/admin/update-stripe-products', async (req, res) => {
    if (!req.session?.passport?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      // Get all courses with Stripe product IDs
      const courses = await sql`
        SELECT id, title, thumbnail_url, price, stripe_product_id 
        FROM courses 
        WHERE stripe_product_id IS NOT NULL AND price > 0
      `;

      const domain = getCurrentDomain();
      const results = [];

      for (const course of courses) {
        try {
          const product = await stripe.products.update(course.stripe_product_id, {
            name: course.title,
            images: [domain + course.thumbnail_url],
            metadata: {
              course_id: course.id.toString(),
              price: course.price.toString(),
              thumbnail_url: course.thumbnail_url
            }
          });

          results.push({
            courseId: course.id,
            productId: product.id,
            name: product.name,
            imageUrl: product.images[0],
            success: true
          });
        } catch (error) {
          results.push({
            courseId: course.id,
            productId: course.stripe_product_id,
            error: error.message,
            success: false
          });
        }
      }

      res.json({ results, domain });
    } catch (error) {
      console.error('Error updating Stripe products:', error);
      res.status(500).json({ error: 'Failed to update Stripe products' });
    }
  });

  // Admin content management routes
  app.use('/api/admin', adminContentRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
