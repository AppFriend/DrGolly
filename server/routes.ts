import type { Express, RequestHandler } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import Stripe from "stripe";
import {
  insertCourseSchema,
  insertUserCourseProgressSchema,
  insertPartnerDiscountSchema,
  insertBillingHistorySchema,
  insertBlogPostSchema,
  insertCoursePurchaseSchema,
} from "@shared/schema";
import { AuthUtils } from "./auth-utils";

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

  // Course routes
  app.get('/api/courses', async (req, res) => {
    try {
      const { category, tier } = req.query;
      const courses = await storage.getCourses(
        category as string | undefined,
        tier as string | undefined
      );
      res.json(courses);
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
      res.json(child);
    } catch (error) {
      console.error("Error creating child:", error);
      res.status(500).json({ message: "Failed to create child" });
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

      // Get or create Stripe customer
      const user = await storage.getUser(userId);
      let stripeCustomerId = user?.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: customerDetails.email,
          name: customerDetails.firstName,
          metadata: {
            userId: userId,
            dueDate: customerDetails.dueDate || '',
          },
        });
        stripeCustomerId = customer.id;
        await storage.updateUserStripeCustomerId(userId, stripeCustomerId);
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: (course.price || 120) * 100, // Convert to cents
        currency: 'usd',
        customer: stripeCustomerId,
        metadata: {
          courseId: courseId.toString(),
          courseName: course.title,
          userId: userId,
          customerName: customerDetails.firstName,
        },
        description: `Course Purchase: ${course.title}`,
      });

      // Create course purchase record
      await storage.createCoursePurchase({
        userId: userId,
        courseId: courseId,
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: stripeCustomerId,
        amount: (course.price || 120) * 100,
        currency: 'usd',
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

  const httpServer = createServer(app);
  return httpServer;
}
