import type { Express, RequestHandler } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { regionalPricingService } from "./regional-pricing";
import { z } from "zod";
import Stripe from "stripe";
import {
  insertCourseSchema,
  insertUserCourseProgressSchema,
  insertPartnerDiscountSchema,
  insertBillingHistorySchema,
  insertBlogPostSchema,
  insertCoursePurchaseSchema,
  insertStripeProductSchema,
} from "@shared/schema";
import { AuthUtils } from "./auth-utils";
import { stripeDataSyncService } from "./stripe-sync";
import { klaviyoService } from "./klaviyo";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

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

// Admin middleware
const isAdmin: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const userId = req.user?.claims?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const isUserAdmin = await storage.isUserAdmin(userId);
  if (!isUserAdmin) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Sync user login to Klaviyo with all custom properties
      if (user) {
        const children = await storage.getUserChildren(userId);
        
        // Update sign-in count and last login timestamp
        await storage.updateUserProfile(userId, {
          signInCount: (user.signInCount || 0) + 1,
          lastSignIn: new Date(),
          lastLoginAt: new Date()
        });

        // Get updated user data
        const updatedUser = await storage.getUser(userId);
        if (updatedUser) {
          // Async sync to avoid blocking the login response
          setImmediate(async () => {
            try {
              // Fetch latest Stripe data for user (only if they have a customer ID)
              let stripeData = null;
              if (updatedUser.stripeCustomerId) {
                stripeData = await stripeDataSyncService.getStripeDataForUser(updatedUser);
              }

              // Sync to Klaviyo with comprehensive data including children and Stripe data
              await klaviyoService.syncLoginToKlaviyo(updatedUser, children, stripeData);
            } catch (error) {
              console.error("Background sync failed:", error);
            }
          });
        }
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Personalization routes
  app.post('/api/personalization', isAuthenticated, async (req: any, res) => {
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
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving personalization:", error);
      res.status(500).json({ message: "Failed to save personalization" });
    }
  });

  app.get('/api/personalization', isAuthenticated, async (req: any, res) => {
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
  app.post('/api/user/personalization', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/user/personalization', isAuthenticated, async (req: any, res) => {
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
        phone: user.phoneNumber,
        profileImageUrl: user.profileImageUrl,
        subscriptionTier: user.subscriptionTier || 'free',
        subscriptionStatus: user.subscriptionTier ? 'active' : 'inactive',
        subscriptionEndDate: user.subscriptionEndDate,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, email, phone, profileImageUrl } = req.body;
      
      await storage.updateUserProfile(userId, {
        firstName,
        lastName,
        email,
        phoneNumber: phone,
        profileImageUrl,
      });
      
      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/profile/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/profile/payment-methods', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.patch('/api/profile/payment-methods', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.post('/api/profile/payment-methods/setup-intent', isAuthenticated, async (req: any, res) => {
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
      
      // Verify payment intent was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not completed" });
      }
      
      // Generate temporary user ID and hash provided password
      const tempUserId = AuthUtils.generateUserId();
      const hashedPassword = await AuthUtils.hashPassword(password);
      
      // Create user account
      const user = await storage.upsertUser({
        id: tempUserId,
        email: customerDetails.email,
        firstName: customerDetails.firstName,
        lastName: customerDetails.lastName || '',
        phone: customerDetails.phone || '',
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        interests: interests.join(','),
        role: customerDetails.role || 'Parent',
        dueDate: customerDetails.dueDate || null,
        hasSetPassword: true,
        isFirstLogin: false,
        passwordHash: hashedPassword,
        signupSource: 'public_checkout',
        country: 'US',
        profileImageUrl: '',
      });
      
      // Skip temporary password creation since user set permanent password
      
      // Create Stripe customer
      const stripeCustomer = await stripe.customers.create({
        email: customerDetails.email,
        name: `${customerDetails.firstName} ${customerDetails.lastName || ''}`.trim(),
        metadata: {
          userId: tempUserId,
          signupSource: 'public_checkout',
        },
      });
      
      // Update user with Stripe customer ID
      await storage.updateUserStripeCustomerId(tempUserId, stripeCustomer.id);
      
      // Create course purchase record
      const courseId = parseInt(paymentIntent.metadata.courseId);
      await storage.createCoursePurchase({
        userId: tempUserId,
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
      
      // Send welcome email with temporary login credentials
      await klaviyoService.syncBigBabySignupToKlaviyo(user, customerDetails);
      
      res.json({ 
        message: "Account created successfully",
        userId: tempUserId,
        loginUrl: "/login",
      });
    } catch (error) {
      console.error("Error creating account with purchase:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Course routes
  app.get('/api/courses', async (req, res) => {
    try {
      const { category, tier } = req.query;
      const courses = await storage.getCourses(
        category as string | undefined,
        tier as string | undefined
      );
      
      // Enhance courses with dynamic pricing from Stripe products
      const coursesWithPricing = await Promise.all(
        courses.map(async (course) => {
          const price = await storage.getCoursePricing(course.id);
          return {
            ...course,
            price: price || 12000 // Default to $120 (in cents) if no Stripe product found
          };
        })
      );
      
      res.json(coursesWithPricing);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get('/api/courses/:id', async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
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

  // User progress routes
  app.get('/api/user/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId);
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

  app.post('/api/user/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.get('/api/children', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const children = await storage.getUserChildren(userId);
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
      const bookingData = { 
        ...req.body, 
        userId,
        preferredDate: new Date(req.body.preferredDate)
      };
      const booking = await storage.createConsultationBooking(bookingData);
      res.json(booking);
    } catch (error) {
      console.error("Error creating consultation booking:", error);
      res.status(500).json({ message: "Failed to create consultation booking" });
    }
  });

  // Course module routes
  app.get('/api/courses/:courseId/modules', isAuthenticated, async (req, res) => {
    try {
      const { courseId } = req.params;
      const modules = await storage.getCourseModules(parseInt(courseId));
      res.json(modules);
    } catch (error) {
      console.error("Error fetching course modules:", error);
      res.status(500).json({ message: "Failed to fetch course modules" });
    }
  });

  app.get('/api/modules/:moduleId/submodules', isAuthenticated, async (req, res) => {
    try {
      const { moduleId } = req.params;
      const submodules = await storage.getCourseSubmodules(parseInt(moduleId));
      res.json(submodules);
    } catch (error) {
      console.error("Error fetching submodules:", error);
      res.status(500).json({ message: "Failed to fetch submodules" });
    }
  });

  app.post('/api/submodules/:submoduleId/progress', isAuthenticated, async (req, res) => {
    try {
      const { submoduleId } = req.params;
      const userId = req.user?.claims?.sub;
      
      const progressData = {
        userId,
        submoduleId: parseInt(submoduleId),
        completed: req.body.completed || false,
        watchTime: req.body.watchTime || 0,
        completedAt: req.body.completed ? new Date() : null,
      };

      const progress = await storage.updateUserSubmoduleProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating submodule progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  app.get('/api/submodules/:submoduleId/progress', isAuthenticated, async (req, res) => {
    try {
      const { submoduleId } = req.params;
      const userId = req.user?.claims?.sub;
      
      const progress = await storage.getUserSubmoduleProgress(userId, parseInt(submoduleId));
      res.json(progress || null);
    } catch (error) {
      console.error("Error fetching submodule progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Blog post routes
  app.get('/api/blog-posts', async (req, res) => {
    try {
      const { category } = req.query;
      const blogPosts = await storage.getBlogPosts(category as string | undefined);
      res.json(blogPosts);
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
      const blogPost = await storage.getBlogPostBySlug(slug);
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

  // Course purchase routes
  app.post('/api/create-course-payment', isAuthenticated, async (req: any, res) => {
    try {
      const { courseId, customerDetails } = req.body;
      const userId = req.user.claims.sub;
      
      // Get course details
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Get user details
      const user = await storage.getUser(userId);
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
        
        // Update user with stripe customer ID
        await storage.updateUserStripeCustomerId(userId, stripeCustomerId);
      }

      // Get regional pricing based on user's IP
      const userIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
      const regionalPricing = await regionalPricingService.getPricingForIP(userIP);
      const coursePrice = regionalPricing.coursePrice;

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
        },
        description: `Course Purchase: ${course.title}`,
        receipt_email: user.email,
      });

      // Create course purchase record with regional pricing
      await storage.createCoursePurchase({
        userId: userId,
        courseId: courseId,
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: stripeCustomerId,
        amount: Math.round(coursePrice * 100),
        currency: regionalPricing.currency.toLowerCase(),
        status: 'pending',
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
      });
    } catch (error) {
      console.error("Error creating course payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Big Baby public checkout payment creation (for anonymous users)
  app.post('/api/create-big-baby-payment', async (req, res) => {
    try {
      const { customerDetails } = req.body;
      
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
        amount: 12000, // $120 in cents
        currency: 'usd',
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
        },
        description: 'Course Purchase: Big Baby Sleep Program',
        receipt_email: customerDetails.email,
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
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
            }
          } else {
            // Handle regular course purchase
            const purchase = await storage.getCoursePurchaseByPaymentIntent(paymentIntent.id);
            if (purchase) {
              await storage.updateCoursePurchaseStatus(purchase.id, 'completed');
              console.log(`Course purchase completed: ${paymentIntent.id} for user ${purchase.userId}`);
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

  app.get('/api/user/course-purchases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const purchases = await storage.getUserCoursePurchases(userId);
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
  app.get('/api/admin/check', isAdmin, async (req, res) => {
    res.json({ isAdmin: true });
  });

  app.get('/api/admin/metrics', isAdmin, async (req, res) => {
    try {
      const metrics = await storage.getUserMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching admin metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user's purchased courses (User endpoint)
  app.get('/api/user/course-purchases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const purchases = await storage.getUserCoursePurchases(userId);
      
      // Get course details for each purchase
      const coursesWithDetails = await Promise.all(
        purchases.map(async (purchase) => {
          const course = await storage.getCourse(purchase.courseId);
          return {
            ...purchase,
            course: course
          };
        })
      );
      
      res.json(coursesWithDetails);
    } catch (error) {
      console.error("Error fetching user courses:", error);
      res.status(500).json({ message: "Failed to fetch user courses" });
    }
  });

  // Get user's purchased courses (Admin only)
  app.get('/api/admin/users/:userId/courses', isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const purchases = await storage.getUserCoursePurchases(userId);
      
      // Get course details for each purchase
      const coursesWithDetails = await Promise.all(
        purchases.map(async (purchase) => {
          const course = await storage.getCourse(purchase.courseId);
          return {
            ...purchase,
            course: course
          };
        })
      );
      
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
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if user already has this course
      const existingPurchases = await storage.getUserCoursePurchases(userId);
      const alreadyPurchased = existingPurchases.some(p => p.courseId === courseId && p.status === 'completed');
      
      if (alreadyPurchased) {
        return res.status(400).json({ message: "User already has this course" });
      }
      
      // Add course purchase record
      const purchase = await storage.createCoursePurchase({
        userId: userId,
        courseId: courseId,
        stripePaymentIntentId: `admin_grant_${Date.now()}`,
        stripeCustomerId: null,
        amount: 0, // Free admin grant
        currency: 'usd',
        status: 'completed',
      });
      
      res.json({ success: true, purchase });
    } catch (error) {
      console.error("Error adding course to user:", error);
      res.status(500).json({ message: "Failed to add course to user" });
    }
  });

  // Remove course from user (Admin only)
  app.delete('/api/admin/users/:userId/courses/:purchaseId', isAdmin, async (req, res) => {
    try {
      const { userId, purchaseId } = req.params;
      
      // Verify the purchase belongs to the user
      const purchase = await storage.getCoursePurchase(parseInt(purchaseId));
      if (!purchase || purchase.userId !== userId) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      
      // Remove the course purchase
      await storage.deleteCoursePurchase(parseInt(purchaseId));
      
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

  // Bulk user import system for 20,000 users
  app.post('/api/admin/bulk-import', isAdmin, async (req, res) => {
    try {
      const { users } = req.body;
      
      if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({ message: 'Users array is required' });
      }

      // Generate temporary passwords for all users
      const usersWithTempPasswords = users.map(user => ({
        ...user,
        id: user.id || AuthUtils.generateUserId(),
        temporaryPassword: AuthUtils.generateTemporaryPassword(),
        isFirstLogin: true,
        hasSetPassword: false,
      }));

      // Create users in bulk (optimized for 20,000 users)
      const createdUsers = await storage.createBulkUsers(usersWithTempPasswords);
      
      // Create temporary password records in parallel
      await Promise.all(
        createdUsers.map(user => 
          storage.createTemporaryPassword(user.id, user.temporaryPassword!)
        )
      );

      res.json({ 
        message: `Successfully imported ${createdUsers.length} users`,
        usersCreated: createdUsers.length,
        sampleCredentials: createdUsers.slice(0, 5).map(u => ({
          email: u.email,
          temporaryPassword: u.temporaryPassword
        }))
      });
    } catch (error) {
      console.error('Error in bulk user import:', error);
      res.status(500).json({ message: 'Failed to import users' });
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

      res.json({ message: 'Password set successfully' });
    } catch (error) {
      console.error('Error setting password:', error);
      res.status(500).json({ message: 'Failed to set password' });
    }
  });

  // Seed sample orders for testing (Admin only)
  app.post('/api/admin/seed-orders', isAdmin, async (req, res) => {
    try {
      const sampleOrders = [
        {
          userId: '44434757', // Admin user
          courseId: 1,
          amount: 12000, // $120 in cents
          status: 'completed',
          stripePaymentIntentId: 'pi_test_189349',
          purchasedAt: new Date('2025-07-09T08:34:00Z')
        },
        {
          userId: '44434757',
          courseId: 2,
          amount: 25000, // $250 in cents
          status: 'completed',
          stripePaymentIntentId: 'pi_test_189348',
          purchasedAt: new Date('2025-07-09T08:30:00Z')
        },
        {
          userId: '44434757',
          courseId: 3,
          amount: 11000, // $110 in cents
          status: 'completed',
          stripePaymentIntentId: 'pi_test_189347',
          purchasedAt: new Date('2025-07-09T08:25:00Z')
        },
        {
          userId: '44434757',
          courseId: 4,
          amount: 12000, // $120 in cents
          status: 'completed',
          stripePaymentIntentId: 'pi_test_189346',
          purchasedAt: new Date('2025-07-09T08:20:00Z')
        },
        {
          userId: '44434757',
          courseId: 5,
          amount: 12000, // $120 in cents
          status: 'completed',
          stripePaymentIntentId: 'pi_test_189345',
          purchasedAt: new Date('2025-07-09T08:15:00Z')
        },
        // Yesterday's orders
        {
          userId: '44434757',
          courseId: 1,
          amount: 12000,
          status: 'completed',
          stripePaymentIntentId: 'pi_test_189344',
          purchasedAt: new Date('2025-07-08T14:30:00Z')
        },
        {
          userId: '44434757',
          courseId: 2,
          amount: 12000,
          status: 'completed',
          stripePaymentIntentId: 'pi_test_189343',
          purchasedAt: new Date('2025-07-08T12:15:00Z')
        }
      ];

      for (const order of sampleOrders) {
        await storage.createCoursePurchase(order);
      }

      res.json({ message: 'Sample orders created successfully', count: sampleOrders.length });
    } catch (error) {
      console.error("Error seeding orders:", error);
      res.status(500).json({ message: "Failed to seed orders" });
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

  const httpServer = createServer(app);
  return httpServer;
}
