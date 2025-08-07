import { Router } from "express";
import { storage } from "../storage";
import { AuthUtils } from "../auth-utils";
import { z } from "zod";

const router = Router();

// Login endpoint with temporary password support
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    // Find user by email
    const user = await storage.getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Verify password (either temporary or permanent)
    let passwordValid = false;
    let isTemporaryPassword = false;

    // Check if using temporary password
    if (user.temporaryPassword) {
      passwordValid = await AuthUtils.verifyPassword(password, user.temporaryPassword);
      isTemporaryPassword = passwordValid;
    }

    // If not temporary password or temporary password failed, check regular password
    if (!passwordValid && user.passwordHash) {
      passwordValid = await AuthUtils.verifyPassword(password, user.passwordHash);
    }

    if (!passwordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Update last login
    await storage.updateUserLastLogin(user.id);

    // Prepare response
    const response: any = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        subscriptionTier: user.subscriptionTier,
        isFirstLogin: user.isFirstLogin,
        hasSetPassword: user.hasSetPassword,
        passwordSet: user.passwordSet,
        migrated: user.migrated
      },
      requiresPasswordReset: false
    };

    // Check if user needs to set permanent password
    if (isTemporaryPassword || user.isFirstLogin || user.passwordSet === 'no') {
      response.requiresPasswordReset = true;
      response.tempPassword = password;
    }

    res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

// Set permanent password endpoint
router.post("/set-permanent-password", async (req, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authenticated" 
      });
    }

    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "New password is required" 
      });
    }

    // Validate password strength
    const passwordValidation = AuthUtils.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: "Password does not meet requirements",
        errors: passwordValidation.errors
      });
    }

    // Hash the new password
    const hashedPassword = await AuthUtils.hashPassword(newPassword);

    // Update user in database
    await storage.updateUserProfile(userId, {
      passwordHash: hashedPassword,
      temporaryPassword: null,
      isFirstLogin: false,
      hasSetPassword: true,
      passwordSet: 'yes',
      lastPasswordChange: new Date(),
      updatedAt: new Date()
    });

    res.json({ 
      success: true, 
      message: "Password updated successfully" 
    });
  } catch (error) {
    console.error("Set permanent password error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

// Check password reset requirement
router.get("/check-password-reset", async (req, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authenticated" 
      });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const requiresPasswordReset = user.isFirstLogin || 
                                  user.passwordSet === 'no' || 
                                  (user.temporaryPassword && !user.hasSetPassword);

    res.json({ 
      success: true, 
      requiresPasswordReset,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        isFirstLogin: user.isFirstLogin,
        hasSetPassword: user.hasSetPassword,
        passwordSet: user.passwordSet
      }
    });
  } catch (error) {
    console.error("Check password reset error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

export { router as authRoutes };