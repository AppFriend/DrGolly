import {
  users,
  courses,
  courseChapters,
  courseLessons,
  lessonContent,
  userChapterProgress,
  userLessonProgress,
  userLessonContentProgress,
  userCourseProgress,
  partnerDiscounts,
  billingHistory,
  children,
  growthEntries,
  developmentMilestones,
  developmentTracking,
  feedEntries,
  sleepEntries,
  consultationBookings,
  blogPosts,
  coursePurchases,
  featureFlags,
  adminNotifications,
  notifications,
  userNotifications,
  familyMembers,
  familyInvites,
  stripeProducts,
  regionalPricing,
  services,
  serviceBookings,
  shoppingProducts,
  cartItems,
  type User,
  type UpsertUser,
  type FeatureFlag,
  type InsertFeatureFlag,
  type Service,
  type InsertService,
  type ServiceBooking,
  type InsertServiceBooking,
  type ShoppingProduct,
  type InsertShoppingProduct,
  type CartItem,
  type InsertCartItem,
  type RegionalPricing,
  type Course,
  type CourseChapter,
  type CourseLesson,
  type LessonContent,
  type UserChapterProgress,
  type UserLessonProgress,
  type UserLessonContentProgress,
  type UserCourseProgress,
  type PartnerDiscount,
  type BillingHistory,
  type Child,
  type GrowthEntry,
  type DevelopmentMilestone,
  type DevelopmentTracking,
  type FeedEntry,
  type SleepEntry,
  type ConsultationBooking,
  type BlogPost,
  type CoursePurchase,
  type InsertCourse,
  type InsertCourseChapter,
  type InsertCourseLesson,
  type InsertLessonContent,
  type InsertUserChapterProgress,
  type InsertUserLessonProgress,
  type InsertUserLessonContentProgress,
  type InsertUserCourseProgress,
  type InsertPartnerDiscount,
  type InsertBillingHistory,
  type InsertChild,
  type InsertGrowthEntry,
  type InsertDevelopmentMilestone,
  type InsertDevelopmentTracking,
  type InsertFeedEntry,
  type InsertSleepEntry,
  type InsertConsultationBooking,
  type InsertBlogPost,
  type InsertCoursePurchase,
  type AdminNotification,
  type InsertAdminNotification,
  type Notification,
  type InsertNotification,
  type UserNotification,
  type InsertUserNotification,
  temporaryPasswords,
  type TemporaryPassword,
  type InsertTemporaryPassword,
  type FamilyMember,
  type FamilyInvite,
  type InsertFamilyMember,
  type InsertFamilyInvite,
  type StripeProduct,
  type InsertStripeProduct,
  type RegionalPricing,
  type InsertRegionalPricing,
  leadCaptures,
  type LeadCapture,
  type InsertLeadCapture,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, gte, or, ilike, sql, isNotNull, isNull, gt } from "drizzle-orm";
import { AuthUtils } from "./auth-utils";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSubscription(userId: string, tier: string, billingPeriod: string, nextBillingDate: Date): Promise<User>;
  updateUserPersonalization(userId: string, personalizationData: any): Promise<User>;
  updateUserProfile(userId: string, profileData: Partial<User>): Promise<User>;
  updateUserLastLogin(userId: string): Promise<User>;
  
  // Course operations
  getCourses(category?: string, tier?: string): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourseStats(courseId: number, likes?: number, views?: number): Promise<void>;
  
  // Chapter operations
  getCourseChapters(courseId: number): Promise<CourseChapter[]>;
  createCourseChapter(chapter: InsertCourseChapter): Promise<CourseChapter>;
  getAllChapters(): Promise<CourseChapter[]>;
  createChapter(chapter: InsertCourseChapter): Promise<CourseChapter>;
  updateChapter(id: number, updates: Partial<CourseChapter>): Promise<CourseChapter>;
  
  // Lesson operations
  getCourseLessons(courseId: number): Promise<CourseLesson[]>;
  getChapterLessons(chapterId: number): Promise<CourseLesson[]>;
  createCourseLesson(lesson: InsertCourseLesson): Promise<CourseLesson>;
  updateLessonContent(lessonId: number, content: string): Promise<CourseLesson>;
  getAllLessons(): Promise<CourseLesson[]>;
  createLesson(lesson: InsertCourseLesson): Promise<CourseLesson>;
  updateLesson(id: number, updates: Partial<CourseLesson>): Promise<CourseLesson>;
  getLessonContent(lessonId: number): Promise<LessonContent[]>;
  getLessonContentByCourse(courseId: number): Promise<LessonContent[]>;
  createLessonContent(lessonContent: InsertLessonContent): Promise<LessonContent>;
  
  // Sublesson operations (lesson content)
  getAllSublessons(): Promise<LessonContent[]>;
  createSublesson(sublesson: InsertLessonContent): Promise<LessonContent>;
  updateSublesson(id: number, updates: Partial<LessonContent>): Promise<LessonContent>;
  
  // User progress operations
  getUserChapterProgress(userId: string, chapterId: number): Promise<UserChapterProgress | undefined>;
  updateUserChapterProgress(progress: InsertUserChapterProgress): Promise<UserChapterProgress>;
  getUserLessonProgress(userId: string, lessonId: number): Promise<UserLessonProgress | undefined>;
  getAllUserLessonProgress(userId: string): Promise<UserLessonProgress[]>;
  updateUserLessonProgress(progress: InsertUserLessonProgress): Promise<UserLessonProgress>;
  getUserLessonContentProgress(userId: string, lessonContentId: number): Promise<UserLessonContentProgress | undefined>;
  updateUserLessonContentProgress(progress: InsertUserLessonContentProgress): Promise<UserLessonContentProgress>;
  
  // User course progress operations
  getUserCourseProgress(userId: string, courseId: number): Promise<UserCourseProgress | undefined>;
  getUserProgress(userId: string): Promise<UserCourseProgress[]>;
  updateUserProgress(progress: InsertUserCourseProgress): Promise<UserCourseProgress>;
  getNextLesson(courseId: number, currentChapterId: number, currentOrderIndex: number): Promise<CourseLesson | null>;
  isChapterCompleted(courseId: number, chapterIndex: number, userId: string): Promise<boolean>;
  
  // Partner discount operations
  getPartnerDiscounts(requiredTier?: string): Promise<PartnerDiscount[]>;
  getPartnerDiscount(id: number): Promise<PartnerDiscount | undefined>;
  createPartnerDiscount(discount: InsertPartnerDiscount): Promise<PartnerDiscount>;
  
  // Billing operations
  getUserBillingHistory(userId: string): Promise<BillingHistory[]>;
  createBillingRecord(billing: InsertBillingHistory): Promise<BillingHistory>;
  
  // Children operations
  getUserChildren(userId: string): Promise<Child[]>;
  getChild(id: number): Promise<Child | undefined>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: number, child: Partial<InsertChild>): Promise<Child>;
  deleteChild(id: number): Promise<void>;
  getUserWithChildren(userId: string): Promise<{ user: User; children: Child[] } | undefined>;
  
  // Growth tracking operations
  getChildGrowthEntries(childId: number): Promise<GrowthEntry[]>;
  createGrowthEntry(entry: InsertGrowthEntry): Promise<GrowthEntry>;
  
  // Development milestone operations
  getDevelopmentMilestones(): Promise<DevelopmentMilestone[]>;
  createDevelopmentMilestone(milestone: InsertDevelopmentMilestone): Promise<DevelopmentMilestone>;
  clearDevelopmentMilestones(): Promise<void>;
  getChildDevelopmentTracking(childId: number): Promise<DevelopmentTracking[]>;
  createDevelopmentTracking(tracking: InsertDevelopmentTracking): Promise<DevelopmentTracking>;
  updateDevelopmentTracking(id: number, tracking: Partial<InsertDevelopmentTracking>): Promise<DevelopmentTracking>;
  
  // Feed tracking operations
  getChildFeedEntries(childId: number): Promise<FeedEntry[]>;
  createFeedEntry(entry: InsertFeedEntry): Promise<FeedEntry>;
  
  // Sleep tracking operations
  getChildSleepEntries(childId: number): Promise<SleepEntry[]>;
  createSleepEntry(entry: InsertSleepEntry): Promise<SleepEntry>;
  updateSleepEntry(id: number, entry: Partial<InsertSleepEntry>): Promise<SleepEntry>;
  
  // Consultation booking operations
  getUserConsultationBookings(userId: string): Promise<ConsultationBooking[]>;
  createConsultationBooking(booking: InsertConsultationBooking): Promise<ConsultationBooking>;
  
  // Blog post operations
  getBlogPosts(category?: string): Promise<BlogPost[]>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPostStats(postId: number, views?: number, likes?: number): Promise<void>;
  clearBlogPosts(): Promise<void>;
  
  // Course purchase operations
  getUserCoursePurchases(userId: string): Promise<CoursePurchase[]>;
  getCoursePurchase(id: number): Promise<CoursePurchase | undefined>;
  getCoursePurchaseByPaymentIntent(paymentIntentId: string): Promise<CoursePurchase | undefined>;
  createCoursePurchase(purchase: InsertCoursePurchase): Promise<CoursePurchase>;
  updateCoursePurchaseStatus(id: number, status: string): Promise<CoursePurchase>;
  deleteCoursePurchase(id: number): Promise<void>;
  getOrderAnalytics(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    todayRevenue: number;
    todayOrders: number;
    yesterdayRevenue: number;
    yesterdayOrders: number;
    lastWeekRevenue: number;
    lastWeekOrders: number;
    lastMonthRevenue: number;
    lastMonthOrders: number;
    dailyRevenueData: Array<{ date: string; revenue: number; orders: number }>;
    dayOnDayChange: number;
    weekOnWeekChange: number;
    monthOnMonthChange: number;
  }>;
  getDailyOrders(page: number, limit: number): Promise<{
    orders: Array<{
      id: number;
      orderNumber: string;
      customerName: string;
      courseTitle: string;
      amount: number;
      status: string;
      purchasedAt: string;
      stripePaymentIntentId: string;
    }>;
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }>;
  updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User>;
  updateUserStripeSubscriptionId(userId: string, stripeSubscriptionId: string): Promise<User>;
  
  // Feature flag operations
  getFeatureFlags(): Promise<FeatureFlag[]>;
  getFeatureFlag(featureName: string): Promise<FeatureFlag | undefined>;
  createFeatureFlag(flag: InsertFeatureFlag): Promise<FeatureFlag>;
  updateFeatureFlag(id: number, flag: Partial<InsertFeatureFlag>): Promise<FeatureFlag>;
  hasFeatureAccess(userId: string, featureName: string): Promise<boolean>;
  getUserFeatureAccess(userId: string): Promise<{ [featureName: string]: boolean }>;
  
  // Admin operations
  isUserAdmin(userId: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  searchUsers(query: string): Promise<User[]>;
  updateUser(userId: string, updates: Partial<UpsertUser>): Promise<User>;
  getUserMetrics(): Promise<{
    totalUsers: number;
    freeUsers: number;
    goldUsers: number;
    monthlyActiveUsers: number;
    totalCoursesSold: number;
    totalSubscriptionUpgrades: number;
    monthlyGoldRevenue: number;
    annualGoldRevenue: number;
    totalChurn: number;
  }>;
  
  // Admin notifications
  getAdminNotifications(): Promise<AdminNotification[]>;
  createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification>;
  updateAdminNotification(id: number, updates: Partial<InsertAdminNotification>): Promise<AdminNotification>;
  deleteAdminNotification(id: number): Promise<void>;

  // Temporary password system for bulk imports
  createTemporaryPassword(userId: string, tempPassword: string): Promise<TemporaryPassword>;
  verifyTemporaryPassword(userId: string, tempPassword: string): Promise<boolean>;
  markTemporaryPasswordAsUsed(userId: string): Promise<void>;
  createBulkUsers(users: UpsertUser[]): Promise<User[]>;
  createBulkCoursePurchases(purchases: InsertCoursePurchase[]): Promise<CoursePurchase[]>;
  setUserPassword(userId: string, passwordHash: string): Promise<void>;
  authenticateWithTemporaryPassword(email: string, tempPassword: string): Promise<User | null>;

  // Family invite operations
  getFamilyMembers(familyOwnerId: string): Promise<FamilyMember[]>;
  createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;
  getFamilyInvites(familyOwnerId: string): Promise<FamilyInvite[]>;
  createFamilyInvite(invite: InsertFamilyInvite): Promise<FamilyInvite>;
  getFamilyInviteByEmail(email: string): Promise<FamilyInvite | undefined>;
  acceptFamilyInvite(inviteId: number, memberId: string): Promise<void>;
  expireFamilyInvite(inviteId: number): Promise<void>;
  deleteFamilyMember(memberId: string): Promise<void>;
  
  // Stripe product operations
  getStripeProducts(): Promise<StripeProduct[]>;
  getStripeProductById(productId: string): Promise<StripeProduct | undefined>;
  getStripeProductByCourseId(courseId: number): Promise<StripeProduct | undefined>;
  getStripeProduct(planTier: string, billingPeriod: string): Promise<StripeProduct | undefined>;
  createStripeProduct(product: InsertStripeProduct): Promise<StripeProduct>;
  updateStripeProduct(productId: string, updates: Partial<StripeProduct>): Promise<StripeProduct>;
  
  // Regional pricing operations
  getRegionalPricing(): Promise<RegionalPricing[]>;
  getRegionalPricingByRegion(region: string): Promise<RegionalPricing | undefined>;
  createRegionalPricing(pricing: InsertRegionalPricing): Promise<RegionalPricing>;
  updateRegionalPricing(id: number, updates: Partial<RegionalPricing>): Promise<RegionalPricing>;
  getCoursePricing(courseId: number): Promise<number | null>;
  getSubscriptionPricing(): Promise<{ monthly: number | null; yearly: number | null; }>;

  // Notification operations
  getUserNotifications(userId: string): Promise<Array<Notification & { isRead: boolean; readAt: Date | null }>>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(userId: string, notificationId: number): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  createUserNotification(userNotification: InsertUserNotification): Promise<UserNotification>;
  seedLoyaltyNotification(): Promise<void>;
  
  // Service operations
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  getServiceByType(serviceType: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service>;
  
  // Service booking operations
  getServiceBookings(): Promise<ServiceBooking[]>;
  getUserServiceBookings(userId: string): Promise<ServiceBooking[]>;
  getServiceBooking(id: number): Promise<ServiceBooking | undefined>;
  createServiceBooking(booking: InsertServiceBooking): Promise<ServiceBooking>;
  updateServiceBookingStatus(id: number, status: string): Promise<ServiceBooking>;
  
  // User service activation tracking
  addUserActivatedService(userId: string, serviceId: string): Promise<User>;
  getUserActivatedServices(userId: string): Promise<string[]>;
  
  // Enhanced user data for Klaviyo sync
  getUserWithChildren(userId: string): Promise<{ user: User, children: any[], coursePurchases: any[] }>;
  
  // Shopping product operations
  getShoppingProducts(): Promise<ShoppingProduct[]>;
  getShoppingProduct(id: number): Promise<ShoppingProduct | undefined>;
  getShoppingProductByStripeProductId(stripeProductId: string): Promise<ShoppingProduct | undefined>;
  createShoppingProduct(product: InsertShoppingProduct): Promise<ShoppingProduct>;
  updateShoppingProduct(id: number, updates: Partial<InsertShoppingProduct>): Promise<ShoppingProduct>;
  deleteShoppingProduct(id: number): Promise<void>;

  // Cart operations
  getUserCart(userId: string): Promise<CartItem[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  clearUserCart(userId: string): Promise<void>;
  getCartItemCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Database error in getUser:', error);
      // Fallback to raw SQL query
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
        return result[0] as User;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw error;
      }
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error('Database error in getUserByEmail:', error);
      // Fallback to raw SQL query
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
        return result[0] as User;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw error;
      }
    }
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error) {
      console.error('Database error in upsertUser:', error);
      // Fallback to raw SQL query
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`
          INSERT INTO users (id, email, first_name, last_name, profile_image_url, subscription_tier, subscription_status, signup_source, account_activated, onboarding_completed, sign_in_count, last_sign_in, last_login_at, created_at, updated_at)
          VALUES (${userData.id}, ${userData.email}, ${userData.firstName}, ${userData.lastName}, ${userData.profileImageUrl}, ${userData.subscriptionTier || 'free'}, ${userData.subscriptionStatus || 'active'}, ${userData.signupSource || 'web'}, ${userData.accountActivated || true}, ${userData.onboardingCompleted || false}, ${userData.signInCount || 1}, ${userData.lastSignIn || new Date()}, ${userData.lastLoginAt || new Date()}, ${new Date()}, ${new Date()})
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            profile_image_url = EXCLUDED.profile_image_url,
            subscription_tier = EXCLUDED.subscription_tier,
            subscription_status = EXCLUDED.subscription_status,
            signup_source = EXCLUDED.signup_source,
            account_activated = EXCLUDED.account_activated,
            onboarding_completed = EXCLUDED.onboarding_completed,
            sign_in_count = EXCLUDED.sign_in_count,
            last_sign_in = EXCLUDED.last_sign_in,
            last_login_at = EXCLUDED.last_login_at,
            updated_at = EXCLUDED.updated_at
          RETURNING *
        `;
        return result[0] as User;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw error;
      }
    }
  }



  async updateUserPersonalization(userId: string, personalizationData: {
    primaryConcerns?: string;
    phoneNumber?: string;
    profilePictureUrl?: string;
    userRole?: string;
    acceptedTerms?: boolean;
    marketingOptIn?: boolean;
    newMemberOfferShown?: boolean;
    newMemberOfferAccepted?: boolean;
    onboardingCompleted?: boolean;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...personalizationData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserProfile(userId: string, profileData: Partial<User>): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({
          ...profileData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      return user;
    } catch (error) {
      console.error('Database error in updateUserProfile:', error);
      // Fallback to raw SQL query
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        
        // Simple fallback for common fields
        if (profileData.signInCount !== undefined) {
          await sql`UPDATE users SET sign_in_count = ${profileData.signInCount}, last_sign_in = ${profileData.lastSignIn}, last_login_at = ${profileData.lastLoginAt}, updated_at = ${new Date()} WHERE id = ${userId}`;
        }
        
        // Handle profile image updates
        if (profileData.profileImageUrl !== undefined) {
          await sql`UPDATE users SET profile_picture_url = ${profileData.profileImageUrl}, updated_at = ${new Date()} WHERE id = ${userId}`;
        }
        
        // Return updated user
        const result = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
        return result[0] as User;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        // Return user data with updated fields as fallback
        const user = await this.getUser(userId);
        return { ...user, ...profileData } as User;
      }
    }
  }

  async updateUserLastLogin(userId: string): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      return user;
    } catch (error) {
      console.error('Database error in updateUserLastLogin:', error);
      // Fallback to raw SQL query
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        await sql`UPDATE users SET last_login_at = ${new Date()}, updated_at = ${new Date()} WHERE id = ${userId}`;
        const result = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
        return result[0] as User;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw error;
      }
    }
  }

  async getUserWithChildren(userId: string): Promise<{ user: User, children: any[], coursePurchases: any[] }> {
    try {
      // Get user
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get children
      let children: any[] = [];
      try {
        const childrenResult = await db.select().from(familyMembers).where(eq(familyMembers.userId, userId));
        children = childrenResult || [];
      } catch (error) {
        console.error('Failed to get children:', error);
        // Fallback to raw SQL
        try {
          const { neon } = await import('@neondatabase/serverless');
          const sql = neon(process.env.DATABASE_URL!);
          const result = await sql`SELECT * FROM family_members WHERE user_id = ${userId}`;
          children = result || [];
        } catch (fallbackError) {
          console.error('Fallback children query failed:', fallbackError);
          children = [];
        }
      }

      // Get course purchases
      let coursePurchases: any[] = [];
      try {
        const purchasesResult = await db.select().from(userCourseProgress).where(eq(userCourseProgress.userId, userId));
        coursePurchases = purchasesResult || [];
      } catch (error) {
        console.error('Failed to get course purchases:', error);
        // Fallback to raw SQL
        try {
          const { neon } = await import('@neondatabase/serverless');
          const sql = neon(process.env.DATABASE_URL!);
          const result = await sql`SELECT * FROM user_course_progress WHERE user_id = ${userId}`;
          coursePurchases = result || [];
        } catch (fallbackError) {
          console.error('Fallback course purchases query failed:', fallbackError);
          coursePurchases = [];
        }
      }

      return { user, children, coursePurchases };
    } catch (error) {
      console.error('Error getting user with children:', error);
      const user = await this.getUser(userId);
      if (!user) throw error;
      return { user, children: [], coursePurchases: [] };
    }
  }

  async getMonthlyActiveUsers(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(
        isNotNull(users.lastLoginAt),
        gte(users.lastLoginAt, thirtyDaysAgo)
      ));
    
    return result[0]?.count || 0;
  }

  async updateUserSubscription(userId: string, tier: string, billingPeriod: string, nextBillingDate: Date): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionTier: tier,
        billingPeriod,
        nextBillingDate,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }



  // Course operations
  async getCourses(category?: string, tier?: string, includeUnpublished?: boolean): Promise<Course[]> {
    try {
      let conditions = [];
      
      if (!includeUnpublished) {
        conditions.push(eq(courses.isPublished, true));
      }
      
      if (category) {
        conditions.push(eq(courses.category, category));
      }
      
      if (tier) {
        conditions.push(eq(courses.tier, tier));
      }
      
      const result = await db.select().from(courses)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(courses.createdAt);
      
      // Convert price from string to number if needed
      return result.map(course => ({
        ...course,
        price: typeof course.price === 'string' ? parseFloat(course.price) : course.price,
        discountedPrice: typeof course.discountedPrice === 'string' ? parseFloat(course.discountedPrice) : course.discountedPrice
      }));
    } catch (error) {
      console.error('Drizzle ORM failed for courses, using raw SQL fallback');
      // Use raw SQL as fallback
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      let query = `SELECT id, title, description, category, thumbnail_url, video_url, 
                          duration, age_range, is_published, likes, views, created_at, updated_at,
                          price, discounted_price, skill_level, stripe_product_id, unique_id,
                          status, detailed_description, website_content, key_features, whats_covered,
                          rating, review_count, overview_description, learning_objectives,
                          completion_criteria, course_structure_notes
                   FROM courses`;
      
      let whereConditions = [];
      
      if (!includeUnpublished) {
        whereConditions.push("is_published = true");
      }
      
      if (category) {
        whereConditions.push(`category = '${category}'`);
      }
      
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY created_at`;
      
      const result = await sql([query]);
      
      // Convert price from string to number if needed
      return result.map((course: any) => ({
        ...course,
        price: typeof course.price === 'string' ? parseFloat(course.price) : course.price,
        discountedPrice: typeof course.discounted_price === 'string' ? parseFloat(course.discounted_price) : course.discounted_price
      }));
    }
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    if (!course) return undefined;
    
    // Convert price from string to number if needed
    return {
      ...course,
      price: typeof course.price === 'string' ? parseFloat(course.price) : course.price,
      discountedPrice: typeof course.discountedPrice === 'string' ? parseFloat(course.discountedPrice) : course.discountedPrice
    };
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course> {
    const [updatedCourse] = await db
      .update(courses)
      .set({ ...courseData, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async updateCourseStats(courseId: number, likes?: number, views?: number): Promise<void> {
    const updates: any = { updatedAt: new Date() };
    if (likes !== undefined) updates.likes = likes;
    if (views !== undefined) updates.views = views;
    
    await db.update(courses).set(updates).where(eq(courses.id, courseId));
  }

  // User progress operations
  async getUserCourseProgress(userId: string, courseId: number): Promise<UserCourseProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userCourseProgress)
      .where(and(eq(userCourseProgress.userId, userId), eq(userCourseProgress.courseId, courseId)));
    return progress;
  }

  async getUserProgress(userId: string): Promise<UserCourseProgress[]> {
    return await db
      .select()
      .from(userCourseProgress)
      .where(eq(userCourseProgress.userId, userId))
      .orderBy(desc(userCourseProgress.lastWatched));
  }

  async updateUserProgress(progress: InsertUserCourseProgress): Promise<UserCourseProgress> {
    const [updatedProgress] = await db
      .insert(userCourseProgress)
      .values(progress)
      .onConflictDoUpdate({
        target: [userCourseProgress.userId, userCourseProgress.courseId],
        set: {
          progress: progress.progress,
          isCompleted: progress.isCompleted,
          lastWatched: new Date(),
        },
      })
      .returning();
    return updatedProgress;
  }

  // Partner discount operations
  async getPartnerDiscounts(requiredTier?: string): Promise<PartnerDiscount[]> {
    let conditions = [eq(partnerDiscounts.isActive, true)];
    
    if (requiredTier) {
      conditions.push(eq(partnerDiscounts.requiredTier, requiredTier));
    }
    
    return await db.select().from(partnerDiscounts)
      .where(and(...conditions))
      .orderBy(desc(partnerDiscounts.createdAt));
  }

  async getPartnerDiscount(id: number): Promise<PartnerDiscount | undefined> {
    const [discount] = await db.select().from(partnerDiscounts).where(eq(partnerDiscounts.id, id));
    return discount;
  }

  async createPartnerDiscount(discount: InsertPartnerDiscount): Promise<PartnerDiscount> {
    const [newDiscount] = await db.insert(partnerDiscounts).values(discount).returning();
    return newDiscount;
  }

  // Billing operations
  async getUserBillingHistory(userId: string): Promise<BillingHistory[]> {
    return await db
      .select()
      .from(billingHistory)
      .where(eq(billingHistory.userId, userId))
      .orderBy(desc(billingHistory.billingDate));
  }

  async createBillingRecord(billing: InsertBillingHistory): Promise<BillingHistory> {
    const [newBilling] = await db.insert(billingHistory).values(billing).returning();
    return newBilling;
  }

  // Children operations
  async getUserChildren(userId: string): Promise<Child[]> {
    console.log('Fetching children for user ID:', userId);
    try {
      const userChildren = await db.select().from(children).where(eq(children.userId, userId));
      console.log('Children found:', userChildren.length);
      return userChildren;
    } catch (error) {
      console.error('Database error in getUserChildren:', error);
      // Fallback to raw SQL
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        const result = await sql`SELECT id, user_id, name, date_of_birth, gender, profile_picture, created_at, updated_at FROM children WHERE user_id = ${userId}`;
        console.log('Children found via raw SQL:', result.length);
        return result.map((child: any) => ({
          id: child.id,
          userId: child.user_id,
          name: child.name,
          dateOfBirth: child.date_of_birth,
          gender: child.gender,
          profilePicture: child.profile_picture,
          createdAt: child.created_at,
          updatedAt: child.updated_at
        }));
      } catch (fallbackError) {
        console.error('Fallback children query failed:', fallbackError);
        return [];
      }
    }
  }

  async createChild(child: InsertChild): Promise<Child> {
    const [newChild] = await db
      .insert(children)
      .values(child)
      .returning();
    return newChild;
  }

  async getChild(childId: number, userId: string): Promise<Child | undefined> {
    const [child] = await db
      .select()
      .from(children)
      .where(and(eq(children.id, childId), eq(children.userId, userId)));
    return child;
  }

  async updateChild(childId: number, childData: Partial<InsertChild>): Promise<Child> {
    const [updatedChild] = await db
      .update(children)
      .set(childData)
      .where(eq(children.id, childId))
      .returning();
    return updatedChild;
  }

  async deleteChild(childId: number): Promise<void> {
    // Delete all related data first to avoid foreign key constraint violations
    await db.delete(growthEntries).where(eq(growthEntries.childId, childId));
    await db.delete(developmentTracking).where(eq(developmentTracking.childId, childId));
    await db.delete(feedEntries).where(eq(feedEntries.childId, childId));
    await db.delete(sleepEntries).where(eq(sleepEntries.childId, childId));
    
    // Now delete the child
    await db.delete(children).where(eq(children.id, childId));
  }

  async getUserWithChildren(userId: string): Promise<{ user: User; children: Child[] } | undefined> {
    const user = await this.getUser(userId);
    if (!user) {
      return undefined;
    }
    
    const userChildren = await this.getUserChildren(userId);
    return {
      user,
      children: userChildren
    };
  }



  // Growth tracking operations
  async getChildGrowthEntries(childId: number): Promise<any[]> {
    const entries = await db.select().from(growthEntries).where(eq(growthEntries.childId, childId)).orderBy(desc(growthEntries.logDate));
    
    // Group entries by date to show combined measurements
    const groupedEntries = entries.reduce((acc: any, entry) => {
      const dateKey = entry.logDate ? entry.logDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          id: entry.id,
          date: entry.logDate || new Date(),
          weight: null,
          height: null,
          headCircumference: null
        };
      }
      
      if (entry.measurementType === 'weight') {
        acc[dateKey].weight = entry.value;
      } else if (entry.measurementType === 'height') {
        acc[dateKey].height = entry.value;
      } else if (entry.measurementType === 'head_circumference') {
        acc[dateKey].headCircumference = entry.value;
      }
      
      return acc;
    }, {});
    
    return Object.values(groupedEntries).sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
  }

  async createGrowthEntry(entry: InsertGrowthEntry): Promise<GrowthEntry> {
    const [newEntry] = await db
      .insert(growthEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  // Development milestone operations
  async getDevelopmentMilestones(): Promise<DevelopmentMilestone[]> {
    return await db.select().from(developmentMilestones).orderBy(developmentMilestones.ageRangeStart);
  }

  async createDevelopmentMilestone(milestone: InsertDevelopmentMilestone): Promise<DevelopmentMilestone> {
    const [newMilestone] = await db
      .insert(developmentMilestones)
      .values(milestone)
      .returning();
    return newMilestone;
  }

  async clearDevelopmentMilestones(): Promise<void> {
    await db.delete(developmentMilestones);
  }

  async getChildDevelopmentTracking(childId: number): Promise<DevelopmentTracking[]> {
    return await db.select().from(developmentTracking).where(eq(developmentTracking.childId, childId)).orderBy(desc(developmentTracking.logDate));
  }

  async createDevelopmentTracking(tracking: InsertDevelopmentTracking): Promise<DevelopmentTracking> {
    // Check if tracking already exists for this child and milestone
    const existingTracking = await db
      .select()
      .from(developmentTracking)
      .where(
        and(
          eq(developmentTracking.childId, tracking.childId),
          eq(developmentTracking.milestoneId, tracking.milestoneId)
        )
      )
      .limit(1);

    if (existingTracking.length > 0) {
      // Update existing tracking
      const [updatedTracking] = await db
        .update(developmentTracking)
        .set({
          status: tracking.status,
          achievedDate: tracking.achievedDate,
          logDate: new Date(),
        })
        .where(eq(developmentTracking.id, existingTracking[0].id))
        .returning();
      return updatedTracking;
    } else {
      // Create new tracking
      const [newTracking] = await db
        .insert(developmentTracking)
        .values(tracking)
        .returning();
      return newTracking;
    }
  }

  async updateDevelopmentTracking(id: number, tracking: Partial<InsertDevelopmentTracking>): Promise<DevelopmentTracking> {
    const [updatedTracking] = await db
      .update(developmentTracking)
      .set(tracking)
      .where(eq(developmentTracking.id, id))
      .returning();
    return updatedTracking;
  }

  // Feed tracking operations
  async getChildFeedEntries(childId: number): Promise<FeedEntry[]> {
    return await db.select().from(feedEntries).where(eq(feedEntries.childId, childId)).orderBy(desc(feedEntries.feedDate));
  }

  async createFeedEntry(entry: InsertFeedEntry): Promise<FeedEntry> {
    const [newEntry] = await db
      .insert(feedEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  // Sleep tracking operations
  async getChildSleepEntries(childId: number): Promise<SleepEntry[]> {
    return await db.select().from(sleepEntries).where(eq(sleepEntries.childId, childId)).orderBy(desc(sleepEntries.sleepDate));
  }

  async createSleepEntry(entry: InsertSleepEntry): Promise<SleepEntry> {
    const [newEntry] = await db
      .insert(sleepEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async updateSleepEntry(id: number, entry: Partial<InsertSleepEntry>): Promise<SleepEntry> {
    const [updatedEntry] = await db
      .update(sleepEntries)
      .set(entry)
      .where(eq(sleepEntries.id, id))
      .returning();
    return updatedEntry;
  }

  // Consultation booking operations
  async getUserConsultationBookings(userId: string): Promise<ConsultationBooking[]> {
    return await db.select().from(consultationBookings).where(eq(consultationBookings.userId, userId)).orderBy(desc(consultationBookings.createdAt));
  }

  async createConsultationBooking(booking: InsertConsultationBooking): Promise<ConsultationBooking> {
    const [newBooking] = await db
      .insert(consultationBookings)
      .values(booking)
      .returning();
    return newBooking;
  }

  // Chapter operations
  async getCourseChapters(courseId: number): Promise<CourseChapter[]> {
    return await db.select().from(courseChapters).where(eq(courseChapters.courseId, courseId)).orderBy(courseChapters.orderIndex);
  }

  async createCourseChapter(chapter: InsertCourseChapter): Promise<CourseChapter> {
    const [newChapter] = await db
      .insert(courseChapters)
      .values(chapter)
      .returning();
    return newChapter;
  }

  // Module operations
  async getCourseLessons(courseId: number): Promise<CourseLesson[]> {
    return await db.select().from(courseLessons).where(eq(courseLessons.courseId, courseId)).orderBy(courseLessons.orderIndex);
  }

  async getChapterLessons(chapterId: number): Promise<CourseLesson[]> {
    return await db.select().from(courseLessons).where(eq(courseLessons.chapterId, chapterId)).orderBy(courseLessons.orderIndex);
  }

  async createCourseLesson(lesson: InsertCourseLesson): Promise<CourseLesson> {
    const [newLesson] = await db
      .insert(courseLessons)
      .values(lesson)
      .returning();
    return newLesson;
  }

  async updateLessonContent(lessonId: number, content: string): Promise<CourseLesson> {
    const [updatedLesson] = await db
      .update(courseLessons)
      .set({ content })
      .where(eq(courseLessons.id, lessonId))
      .returning();
    return updatedLesson;
  }

  async getCourseStructureReport(): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT 
        c.id as course_id,
        c.title as course_title,
        COUNT(DISTINCT cl.chapter_id) as total_chapters,
        COUNT(cl.id) as total_lessons,
        COUNT(CASE WHEN cl.content IS NOT NULL AND cl.content != '' THEN 1 END) as populated_lessons,
        ROUND(
          (COUNT(CASE WHEN cl.content IS NOT NULL AND cl.content != '' THEN 1 END) * 100.0 / COUNT(cl.id)), 
          1
        ) as population_percentage
      FROM courses c
      LEFT JOIN course_lessons cl ON c.id = cl.course_id
      WHERE c.id BETWEEN 5 AND 14
      GROUP BY c.id, c.title
      ORDER BY c.id
    `);
    
    return result.rows.map(row => ({
      course_id: row.course_id,
      course_title: row.course_title,
      total_chapters: Number(row.total_chapters),
      total_lessons: Number(row.total_lessons),
      populated_lessons: Number(row.populated_lessons),
      population_percentage: Number(row.population_percentage)
    }));
  }

  async getAllChapters(): Promise<CourseChapter[]> {
    return await db.select().from(courseChapters).orderBy(courseChapters.courseId, courseChapters.orderIndex);
  }

  async createChapter(chapter: InsertCourseChapter): Promise<CourseChapter> {
    const [newChapter] = await db
      .insert(courseChapters)
      .values(chapter)
      .returning();
    return newChapter;
  }

  async updateChapter(id: number, updates: Partial<CourseChapter>): Promise<CourseChapter> {
    const [updatedChapter] = await db
      .update(courseChapters)
      .set(updates)
      .where(eq(courseChapters.id, id))
      .returning();
    return updatedChapter;
  }

  async getAllLessons(): Promise<CourseLesson[]> {
    return await db.select().from(courseLessons).orderBy(courseLessons.courseId, courseLessons.orderIndex);
  }

  async createLesson(lesson: InsertCourseLesson): Promise<CourseLesson> {
    const [newLesson] = await db
      .insert(courseLessons)
      .values(lesson)
      .returning();
    return newLesson;
  }

  async updateLesson(id: number, updates: Partial<CourseLesson>): Promise<CourseLesson> {
    const [updatedLesson] = await db
      .update(courseLessons)
      .set(updates)
      .where(eq(courseLessons.id, id))
      .returning();
    return updatedLesson;
  }

  async getAllSublessons(): Promise<LessonContent[]> {
    return await db.select().from(lessonContent).orderBy(lessonContent.lessonId, lessonContent.orderIndex);
  }

  async createSublesson(sublesson: InsertLessonContent): Promise<LessonContent> {
    const [newSublesson] = await db
      .insert(lessonContent)
      .values(sublesson)
      .returning();
    return newSublesson;
  }

  async updateSublesson(id: number, updates: Partial<LessonContent>): Promise<LessonContent> {
    const [updatedSublesson] = await db
      .update(lessonContent)
      .set(updates)
      .where(eq(lessonContent.id, id))
      .returning();
    return updatedSublesson;
  }

  // User progress implementations
  async getUserChapterProgress(userId: string, chapterId: number): Promise<UserChapterProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userChapterProgress)
      .where(and(eq(userChapterProgress.userId, userId), eq(userChapterProgress.chapterId, chapterId)));
    return progress;
  }

  async getAllUserChapterProgress(userId: string): Promise<UserChapterProgress[]> {
    return await db
      .select()
      .from(userChapterProgress)
      .where(eq(userChapterProgress.userId, userId));
  }

  async updateUserChapterProgress(progress: InsertUserChapterProgress): Promise<UserChapterProgress> {
    const [updatedProgress] = await db
      .insert(userChapterProgress)
      .values(progress)
      .onConflictDoUpdate({
        target: [userChapterProgress.userId, userChapterProgress.chapterId],
        set: {
          completed: progress.completed,
          completedAt: progress.completedAt || new Date(),
        },
      })
      .returning();
    return updatedProgress;
  }

  async getUserLessonProgress(userId: string, lessonId: number): Promise<UserLessonProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userLessonProgress)
      .where(and(eq(userLessonProgress.userId, userId), eq(userLessonProgress.lessonId, lessonId)));
    return progress;
  }

  async getAllUserLessonProgress(userId: string): Promise<UserLessonProgress[]> {
    return await db
      .select()
      .from(userLessonProgress)
      .where(eq(userLessonProgress.userId, userId));
  }

  async updateUserLessonProgress(progress: InsertUserLessonProgress): Promise<UserLessonProgress> {
    const [updatedProgress] = await db
      .insert(userLessonProgress)
      .values(progress)
      .onConflictDoUpdate({
        target: [userLessonProgress.userId, userLessonProgress.lessonId],
        set: {
          completed: progress.completed,
          watchTime: progress.watchTime,
          completedAt: progress.completedAt || new Date(),
        },
      })
      .returning();
    
    // Update course progress percentage after lesson completion
    if (progress.completed) {
      await this.updateCourseProgressPercentage(progress.userId, progress.lessonId);
    }
    
    return updatedProgress;
  }

  async updateCourseProgressPercentage(userId: string, lessonId: number): Promise<void> {
    // Get the course ID for this lesson
    const [lesson] = await db
      .select({ courseId: courseLessons.courseId })
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId));
    
    if (!lesson) return;
    
    // Count total lessons in the course
    const totalLessonsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(courseLessons)
      .where(eq(courseLessons.courseId, lesson.courseId));
    
    const totalLessons = totalLessonsResult[0]?.count || 0;
    
    // Count completed lessons for this user
    const completedLessonsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userLessonProgress)
      .innerJoin(courseLessons, eq(userLessonProgress.lessonId, courseLessons.id))
      .where(and(
        eq(userLessonProgress.userId, userId),
        eq(courseLessons.courseId, lesson.courseId),
        eq(userLessonProgress.completed, true)
      ));
    
    const completedLessons = completedLessonsResult[0]?.count || 0;
    
    // Calculate percentage
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    // Update or insert course progress
    await db
      .insert(userCourseProgress)
      .values({
        userId,
        courseId: lesson.courseId,
        progress: progressPercentage,
        isCompleted: progressPercentage === 100,
        lastWatched: new Date(),
      })
      .onConflictDoUpdate({
        target: [userCourseProgress.userId, userCourseProgress.courseId],
        set: {
          progress: progressPercentage,
          isCompleted: progressPercentage === 100,
          lastWatched: new Date(),
        },
      });
  }

  async getLessonContent(lessonId: number): Promise<LessonContent[]> {
    return await db.select().from(lessonContent).where(eq(lessonContent.lessonId, lessonId)).orderBy(lessonContent.orderIndex);
  }

  async getLessonContentByCourse(courseId: number): Promise<LessonContent[]> {
    const results = await db.select({
      id: lessonContent.id,
      lessonId: lessonContent.lessonId,
      title: lessonContent.title,
      content: lessonContent.content,
      videoUrl: lessonContent.videoUrl,
      orderIndex: lessonContent.orderIndex,
      createdAt: lessonContent.createdAt,
      description: lessonContent.description
    })
      .from(lessonContent)
      .innerJoin(courseLessons, eq(lessonContent.lessonId, courseLessons.id))
      .where(eq(courseLessons.courseId, courseId))
      .orderBy(courseLessons.orderIndex, lessonContent.orderIndex);
    
    return results;
  }

  async createLessonContent(lessonContentData: InsertLessonContent): Promise<LessonContent> {
    const [newLessonContent] = await db
      .insert(lessonContent)
      .values(lessonContentData)
      .returning();
    return newLessonContent;
  }

  // User lesson content progress
  async getUserLessonContentProgress(userId: string, lessonContentId: number): Promise<UserLessonContentProgress | undefined> {
    const [progress] = await db.select().from(userLessonContentProgress)
      .where(and(eq(userLessonContentProgress.userId, userId), eq(userLessonContentProgress.lessonContentId, lessonContentId)));
    return progress;
  }

  async updateUserLessonContentProgress(progress: InsertUserLessonContentProgress): Promise<UserLessonContentProgress> {
    const [updatedProgress] = await db
      .insert(userLessonContentProgress)
      .values(progress)
      .onConflictDoUpdate({
        target: [userLessonContentProgress.userId, userLessonContentProgress.lessonContentId],
        set: {
          completed: progress.completed,
          watchTime: progress.watchTime,
          completedAt: progress.completedAt,
        },
      })
      .returning();
    return updatedProgress;
  }

  // Get next lesson in course
  async getNextLesson(courseId: number, currentChapterId: number, currentOrderIndex: number): Promise<CourseLesson | null> {
    // Handle null/undefined values by getting the first lesson in the course
    if (currentChapterId === undefined || currentChapterId === null || 
        currentOrderIndex === undefined || currentOrderIndex === null) {
      const firstLesson = await db
        .select()
        .from(courseLessons)
        .where(eq(courseLessons.courseId, courseId))
        .orderBy(courseLessons.chapterId, courseLessons.orderIndex)
        .limit(1);
      
      return firstLesson.length > 0 ? firstLesson[0] : null;
    }

    // First try to find next lesson in the same chapter
    const nextInChapter = await db
      .select()
      .from(courseLessons)
      .where(
        and(
          eq(courseLessons.courseId, courseId),
          eq(courseLessons.chapterId, currentChapterId),
          gt(courseLessons.orderIndex, currentOrderIndex)
        )
      )
      .orderBy(courseLessons.orderIndex)
      .limit(1);

    if (nextInChapter.length > 0) {
      return nextInChapter[0];
    }

    // If no next lesson in current chapter, find first lesson in next chapter
    const nextChapter = await db
      .select()
      .from(courseLessons)
      .where(
        and(
          eq(courseLessons.courseId, courseId),
          gt(courseLessons.chapterId, currentChapterId)
        )
      )
      .orderBy(courseLessons.chapterId, courseLessons.orderIndex)
      .limit(1);

    return nextChapter.length > 0 ? nextChapter[0] : null;
  }

  async isChapterCompleted(courseId: number, chapterIndex: number, userId: string): Promise<boolean> {
    // Get all lessons in the chapter
    const lessonsInChapter = await db
      .select()
      .from(courseLessons)
      .where(
        and(
          eq(courseLessons.courseId, courseId),
          eq(courseLessons.chapterIndex, chapterIndex)
        )
      );
    
    if (lessonsInChapter.length === 0) {
      return false;
    }
    
    // Check if all lessons in the chapter are completed
    const lessonIds = lessonsInChapter.map(lesson => lesson.id);
    const completedLessons = await db
      .select()
      .from(userChapterProgress)
      .where(
        and(
          eq(userChapterProgress.userId, userId),
          inArray(userChapterProgress.chapterId, lessonIds),
          eq(userChapterProgress.completed, true)
        )
      );
    
    return completedLessons.length === lessonsInChapter.length;
  }

  // Check if all lessons in a chapter are completed
  async checkChapterCompletion(userId: string, courseId: number, chapterIndex: number): Promise<boolean> {
    // Get all lessons in this chapter
    const chapterLessons = await db
      .select()
      .from(courseLessons)
      .where(
        and(
          eq(courseLessons.courseId, courseId),
          eq(courseLessons.chapterIndex, chapterIndex)
        )
      );

    if (chapterLessons.length === 0) {
      return false;
    }

    // Check if all lessons are completed
    const completedLessons = await db
      .select()
      .from(userLessonProgress)
      .where(
        and(
          eq(userLessonProgress.userId, userId),
          eq(userLessonProgress.completed, true)
        )
      );

    const completedLessonIds = completedLessons.map(p => p.lessonId);
    const chapterLessonIds = chapterLessons.map(l => l.id);

    return chapterLessonIds.every(id => completedLessonIds.includes(id));
  }

  // Blog post operations
  async getBlogPosts(category?: string, includeUnpublished?: boolean): Promise<BlogPost[]> {
    let conditions = [];
    
    if (!includeUnpublished) {
      conditions.push(eq(blogPosts.isPublished, true));
    }
    
    if (category && category !== 'all') {
      conditions.push(eq(blogPosts.category, category));
    }
    
    return await db.select().from(blogPosts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        desc(blogPosts.isPinned), // Pinned posts first
        desc(blogPosts.pinnedAt), // Then by pinned date
        desc(blogPosts.publishedAt) // Then by published date
      );
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [blogPost] = await db.insert(blogPosts).values(post).returning();
    return blogPost;
  }

  async updateBlogPost(id: number, postData: Partial<BlogPost>): Promise<BlogPost> {
    const updateData = { ...postData, updatedAt: new Date() };
    
    // If pinning the post, set pinnedAt timestamp
    if (postData.isPinned === true) {
      updateData.pinnedAt = new Date();
    }
    
    // If unpinning the post, clear pinnedAt timestamp
    if (postData.isPinned === false) {
      updateData.pinnedAt = null;
    }
    
    const [updatedPost] = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedPost;
  }

  async deleteBlogPost(id: number): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  // Course chapter operations
  async getCourseChapters(courseId: number): Promise<CourseChapter[]> {
    return await db.select().from(courseChapters)
      .where(eq(courseChapters.courseId, courseId))
      .orderBy(courseChapters.orderIndex);
  }

  async createCourseChapter(courseId: number, chapterData: any): Promise<CourseChapter> {
    const [chapter] = await db.insert(courseChapters).values({
      ...chapterData,
      courseId,
      orderIndex: 0 // Will be updated in reorder
    }).returning();
    return chapter;
  }

  async reorderCourseChapters(courseId: number, chapters: CourseChapter[]): Promise<void> {
    for (const chapter of chapters) {
      await db.update(courseChapters)
        .set({ orderIndex: chapter.orderIndex })
        .where(eq(courseChapters.id, chapter.id));
    }
  }

  // Course module operations
  async getChapterModules(chapterId: number): Promise<CourseModule[]> {
    return await db.select().from(courseModules)
      .where(eq(courseModules.chapterId, chapterId))
      .orderBy(courseModules.orderIndex);
  }

  async createCourseModule(chapterId: number, moduleData: any): Promise<CourseModule> {
    const [module] = await db.insert(courseModules).values({
      ...moduleData,
      chapterId,
      courseId: 0, // Will be set properly
      orderIndex: 0 // Will be updated in reorder
    }).returning();
    return module;
  }

  async updateCourseModule(id: number, moduleData: Partial<CourseModule>): Promise<CourseModule> {
    const [updatedModule] = await db
      .update(courseModules)
      .set({ ...moduleData, updatedAt: new Date() })
      .where(eq(courseModules.id, id))
      .returning();
    return updatedModule;
  }

  async reorderCourseModules(chapterId: number, modules: CourseModule[]): Promise<void> {
    for (const module of modules) {
      await db.update(courseModules)
        .set({ orderIndex: module.orderIndex })
        .where(eq(courseModules.id, module.id));
    }
  }

  async updateBlogPostStats(postId: number, views?: number, likes?: number): Promise<void> {
    const updateData: any = {};
    if (views !== undefined) updateData.views = views;
    if (likes !== undefined) updateData.likes = likes;
    
    if (Object.keys(updateData).length > 0) {
      await db.update(blogPosts).set(updateData).where(eq(blogPosts.id, postId));
    }
  }

  async clearBlogPosts(): Promise<void> {
    await db.delete(blogPosts);
  }

  // Course purchase operations
  async getUserCoursePurchases(userId: string): Promise<CoursePurchase[]> {
    // Return all purchases (not just completed) so frontend can filter appropriately
    return await db.select().from(coursePurchases)
      .where(eq(coursePurchases.userId, userId))
      .orderBy(desc(coursePurchases.purchasedAt));
  }

  async getCoursePurchase(id: number): Promise<CoursePurchase | undefined> {
    const [purchase] = await db.select().from(coursePurchases).where(eq(coursePurchases.id, id));
    return purchase;
  }

  async getCoursePurchaseByPaymentIntent(paymentIntentId: string): Promise<CoursePurchase | undefined> {
    const [purchase] = await db.select().from(coursePurchases).where(eq(coursePurchases.stripePaymentIntentId, paymentIntentId));
    return purchase;
  }

  async createCoursePurchase(purchase: InsertCoursePurchase): Promise<CoursePurchase> {
    const [coursePurchase] = await db.insert(coursePurchases).values(purchase).returning();
    return coursePurchase;
  }

  async updateCoursePurchaseStatus(id: number, status: string): Promise<CoursePurchase> {
    const [purchase] = await db.update(coursePurchases).set({ status }).where(eq(coursePurchases.id, id)).returning();
    return purchase;
  }

  async deleteCoursePurchase(id: number): Promise<void> {
    await db.delete(coursePurchases).where(eq(coursePurchases.id, id));
  }

  async getOrderAnalytics(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    todayRevenue: number;
    todayOrders: number;
    yesterdayRevenue: number;
    yesterdayOrders: number;
    lastWeekRevenue: number;
    lastWeekOrders: number;
    lastMonthRevenue: number;
    lastMonthOrders: number;
    dailyRevenueData: Array<{ date: string; revenue: number; orders: number }>;
    dayOnDayChange: number;
    weekOnWeekChange: number;
    monthOnMonthChange: number;
  }> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const lastMonthStart = new Date(today);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // Start of day boundaries
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const yesterdayEnd = new Date(todayStart.getTime() - 1);

    // Get completed purchases only
    const completedPurchases = await db
      .select()
      .from(coursePurchases)
      .where(eq(coursePurchases.status, 'completed'));

    const totalRevenue = completedPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100; // Convert from cents
    const totalOrders = completedPurchases.length;

    // Today's data
    const todayPurchases = completedPurchases.filter(p => 
      new Date(p.purchasedAt) >= todayStart
    );
    const todayRevenue = todayPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
    const todayOrders = todayPurchases.length;

    // Yesterday's data
    const yesterdayPurchases = completedPurchases.filter(p => {
      const purchaseDate = new Date(p.purchasedAt);
      return purchaseDate >= yesterdayStart && purchaseDate <= yesterdayEnd;
    });
    const yesterdayRevenue = yesterdayPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
    const yesterdayOrders = yesterdayPurchases.length;

    // Last week's data
    const lastWeekPurchases = completedPurchases.filter(p => 
      new Date(p.purchasedAt) >= lastWeekStart
    );
    const lastWeekRevenue = lastWeekPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
    const lastWeekOrders = lastWeekPurchases.length;

    // Previous week's data (for comparison)
    const prevWeekPurchases = completedPurchases.filter(p => {
      const purchaseDate = new Date(p.purchasedAt);
      return purchaseDate >= twoWeeksAgo && purchaseDate < lastWeekStart;
    });
    const prevWeekRevenue = prevWeekPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

    // Last month's data
    const lastMonthPurchases = completedPurchases.filter(p => 
      new Date(p.purchasedAt) >= lastMonthStart
    );
    const lastMonthRevenue = lastMonthPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
    const lastMonthOrders = lastMonthPurchases.length;

    // Previous month's data (for comparison)
    const prevMonthPurchases = completedPurchases.filter(p => {
      const purchaseDate = new Date(p.purchasedAt);
      return purchaseDate >= twoMonthsAgo && purchaseDate < lastMonthStart;
    });
    const prevMonthRevenue = prevMonthPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

    // Daily revenue data for the last 7 days
    const dailyRevenueData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dateEnd = new Date(dateStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      const dayPurchases = completedPurchases.filter(p => {
        const purchaseDate = new Date(p.purchasedAt);
        return purchaseDate >= dateStart && purchaseDate <= dateEnd;
      });
      
      dailyRevenueData.push({
        date: date.toISOString().split('T')[0],
        revenue: dayPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100,
        orders: dayPurchases.length
      });
    }

    // Calculate percentage changes
    const dayOnDayChange = yesterdayRevenue > 0 ? 
      ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;
    
    const weekOnWeekChange = prevWeekRevenue > 0 ? 
      ((lastWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100 : 0;
    
    const monthOnMonthChange = prevMonthRevenue > 0 ? 
      ((lastMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      todayRevenue,
      todayOrders,
      yesterdayRevenue,
      yesterdayOrders,
      lastWeekRevenue,
      lastWeekOrders,
      lastMonthRevenue,
      lastMonthOrders,
      dailyRevenueData,
      dayOnDayChange,
      weekOnWeekChange,
      monthOnMonthChange
    };
  }

  async getDailyOrders(page: number = 1, limit: number = 20): Promise<{
    orders: Array<{
      id: number;
      orderNumber: string;
      customerName: string;
      courseTitle: string;
      amount: number;
      status: string;
      purchasedAt: string;
      stripePaymentIntentId: string;
    }>;
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    const offset = (page - 1) * limit;
    
    // Get orders with course and user details
    const ordersQuery = db
      .select({
        id: coursePurchases.id,
        orderNumber: coursePurchases.stripePaymentIntentId,
        userId: coursePurchases.userId,
        courseId: coursePurchases.courseId,
        amount: coursePurchases.amount,
        status: coursePurchases.status,
        purchasedAt: coursePurchases.purchasedAt,
        stripePaymentIntentId: coursePurchases.stripePaymentIntentId,
        courseTitle: courses.title,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email
      })
      .from(coursePurchases)
      .leftJoin(courses, eq(coursePurchases.courseId, courses.id))
      .leftJoin(users, eq(coursePurchases.userId, users.id))
      .where(eq(coursePurchases.status, 'completed'))
      .orderBy(desc(coursePurchases.purchasedAt))
      .limit(limit)
      .offset(offset);

    const orders = await ordersQuery;
    
    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(coursePurchases)
      .where(eq(coursePurchases.status, 'completed'));
    
    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Format orders
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber || `#${order.id}`,
      customerName: `${order.userFirstName || ''} ${order.userLastName || ''}`.trim() || order.userEmail || 'Unknown',
      courseTitle: order.courseTitle || 'Unknown Course',
      amount: (order.amount || 0) / 100, // Convert from cents
      status: order.status,
      purchasedAt: order.purchasedAt,
      stripePaymentIntentId: order.stripePaymentIntentId || ''
    }));

    return {
      orders: formattedOrders,
      totalCount,
      totalPages,
      currentPage: page
    };
  }

  async updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User> {
    const [user] = await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId)).returning();
    return user;
  }

  async updateUserStripeSubscriptionId(userId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db.update(users).set({ stripeSubscriptionId }).where(eq(users.id, userId)).returning();
    return user;
  }

  // Feature flag operations
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    return await db.select().from(featureFlags).where(eq(featureFlags.isActive, true));
  }

  async getFeatureFlag(featureName: string): Promise<FeatureFlag | undefined> {
    const [flag] = await db
      .select()
      .from(featureFlags)
      .where(and(eq(featureFlags.featureName, featureName), eq(featureFlags.isActive, true)));
    return flag;
  }

  async createFeatureFlag(flag: InsertFeatureFlag): Promise<FeatureFlag> {
    const [created] = await db.insert(featureFlags).values(flag).returning();
    return created;
  }

  async updateFeatureFlag(id: number, flag: Partial<InsertFeatureFlag>): Promise<FeatureFlag> {
    const [updated] = await db
      .update(featureFlags)
      .set({ ...flag, updatedAt: new Date() })
      .where(eq(featureFlags.id, id))
      .returning();
    return updated;
  }

  async hasFeatureAccess(userId: string, featureName: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const flag = await this.getFeatureFlag(featureName);
    if (!flag) return false;

    const tier = user.subscriptionTier || "free";
    switch (tier) {
      case "free":
        return flag.freeAccess;
      case "gold":
        return flag.goldAccess;
      case "platinum":
        return flag.platinumAccess;
      default:
        return false;
    }
  }

  async getUserFeatureAccess(userId: string): Promise<{ [featureName: string]: boolean }> {
    const user = await this.getUser(userId);
    if (!user) return {};

    const flags = await this.getFeatureFlags();
    const tier = user.subscriptionTier || "free";
    const access: { [featureName: string]: boolean } = {};

    for (const flag of flags) {
      switch (tier) {
        case "free":
          access[flag.featureName] = flag.freeAccess;
          break;
        case "gold":
          access[flag.featureName] = flag.goldAccess;
          break;
        case "platinum":
          access[flag.featureName] = flag.platinumAccess;
          break;
        default:
          access[flag.featureName] = false;
      }
    }

    return access;
  }

  // Admin operations
  async isUserAdmin(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    return user?.isAdmin || false;
  }

  async getAllUsers(page: number = 1, limit: number = 20): Promise<User[]> {
    const offset = (page - 1) * limit;
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
    return allUsers;
  }

  async searchUsers(query: string): Promise<User[]> {
    const searchResults = await db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.email, `%${query}%`),
          ilike(users.firstName, `%${query}%`),
          ilike(users.lastName, `%${query}%`),
          ilike(users.id, `%${query}%`)
        )
      )
      .orderBy(desc(users.createdAt));
    return searchResults;
  }

  async updateUser(userId: string, updates: Partial<UpsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async createOrUpdateAdminUser(email: string, firstName: string, lastName: string): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      
      if (existingUser) {
        // Update existing user to admin with Gold access
        const [updatedUser] = await db
          .update(users)
          .set({
            isAdmin: true,
            subscriptionTier: 'gold',
            subscriptionStatus: 'active',
            firstName: firstName,
            lastName: lastName,
            updatedAt: new Date(),
          })
          .where(eq(users.email, email))
          .returning();
        return updatedUser;
      } else {
        // Create new admin user
        const [newUser] = await db
          .insert(users)
          .values({
            id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email: email,
            firstName: firstName,
            lastName: lastName,
            isAdmin: true,
            subscriptionTier: 'gold',
            subscriptionStatus: 'active',
            migrated: false,
            signupSource: 'admin_created',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        return newUser;
      }
    } catch (error) {
      console.error('Error creating/updating admin user:', error);
      throw error;
    }
  }

  async getAllAdminUsers(): Promise<User[]> {
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.isAdmin, true))
      .orderBy(desc(users.createdAt));
    return adminUsers;
  }

  async getTotalUserCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(users);
    return result[0]?.count || 0;
  }



  async getUserMetrics(): Promise<{
    totalUsers: number;
    freeUsers: number;
    goldUsers: number;
    platinumUsers: number;
    monthlyActiveUsers: number;
    totalCoursesSold: number;
    totalSubscriptionUpgrades: number;
    dailyRevenue: number;
    monthlyRevenue: number;
    annualRevenue: number;
    totalChurn: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalUsers = await db.select({ count: count() }).from(users);
    const freeUsers = await db.select({ count: count() }).from(users).where(eq(users.subscriptionTier, "free"));
    const goldUsers = await db.select({ count: count() }).from(users).where(eq(users.subscriptionTier, "gold"));
    const platinumUsers = await db.select({ count: count() }).from(users).where(eq(users.subscriptionTier, "platinum"));
    const monthlyActiveUsers = await db
      .select({ count: count() })
      .from(users)
      .where(and(
        isNotNull(users.lastLoginAt),
        gte(users.lastLoginAt, thirtyDaysAgo)
      ));
    
    const totalCoursesSold = await db.select({ count: count() }).from(coursePurchases);
    const totalSubscriptionUpgrades = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.subscriptionTier, "gold"), eq(users.migrated, false)));
    
    const goldUserCount = goldUsers[0]?.count || 0;
    
    // Get real Stripe revenue data
    let dailyRevenue = 0;
    let monthlyRevenue = 0;
    let annualRevenue = 0;
    
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      
      // Get daily revenue from Stripe
      const dailyCharges = await stripe.charges.list({
        created: {
          gte: Math.floor(startOfDay.getTime() / 1000),
        },
        limit: 100,
      });
      
      dailyRevenue = dailyCharges.data
        .filter(charge => charge.status === 'succeeded')
        .reduce((sum, charge) => sum + charge.amount, 0) / 100; // Convert from cents
      
      // Get monthly revenue from Stripe
      const monthlyCharges = await stripe.charges.list({
        created: {
          gte: Math.floor(startOfMonth.getTime() / 1000),
        },
        limit: 100,
      });
      
      monthlyRevenue = monthlyCharges.data
        .filter(charge => charge.status === 'succeeded')
        .reduce((sum, charge) => sum + charge.amount, 0) / 100; // Convert from cents
      
      // Get annual revenue from Stripe
      const annualCharges = await stripe.charges.list({
        created: {
          gte: Math.floor(startOfYear.getTime() / 1000),
        },
        limit: 100,
      });
      
      annualRevenue = annualCharges.data
        .filter(charge => charge.status === 'succeeded')
        .reduce((sum, charge) => sum + charge.amount, 0) / 100; // Convert from cents
        
    } catch (error) {
      console.error('Error fetching Stripe revenue:', error);
      // Fallback to calculated revenue if Stripe fails
      monthlyRevenue = goldUserCount * 199;
      annualRevenue = goldUserCount * 199 * 12;
    }
    
    const totalChurn = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.subscriptionStatus, "cancelled"));

    return {
      totalUsers: totalUsers[0]?.count || 0,
      freeUsers: freeUsers[0]?.count || 0,
      goldUsers: goldUserCount,
      platinumUsers: platinumUsers[0]?.count || 0,
      monthlyActiveUsers: monthlyActiveUsers[0]?.count || 0,
      totalCoursesSold: totalCoursesSold[0]?.count || 0,
      totalSubscriptionUpgrades: totalSubscriptionUpgrades[0]?.count || 0,
      dailyRevenue,
      monthlyRevenue,
      annualRevenue,
      totalChurn: totalChurn[0]?.count || 0,
    };
  }

  // Admin notifications
  async getAdminNotifications(): Promise<AdminNotification[]> {
    const notifications = await db
      .select()
      .from(adminNotifications)
      .where(eq(adminNotifications.isActive, true))
      .orderBy(desc(adminNotifications.createdAt));
    return notifications;
  }

  async createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification> {
    const [newNotification] = await db
      .insert(adminNotifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async updateAdminNotification(id: number, updates: Partial<InsertAdminNotification>): Promise<AdminNotification> {
    const [updatedNotification] = await db
      .update(adminNotifications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adminNotifications.id, id))
      .returning();
    return updatedNotification;
  }

  async deleteAdminNotification(id: number): Promise<void> {
    await db
      .update(adminNotifications)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(adminNotifications.id, id));
  }

  // USER NOTIFICATION METHODS
  async getUserNotifications(userId: string): Promise<Array<Notification & { isRead: boolean; readAt: Date | null }>> {
    const userNotifs = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        category: notifications.category,
        priority: notifications.priority,
        actionText: notifications.actionText,
        actionUrl: notifications.actionUrl,
        createdAt: notifications.createdAt,
        isRead: userNotifications.isRead ?? false,
        readAt: userNotifications.readAt,
        // Include all other notification fields
        targetType: notifications.targetType,
        targetUsers: notifications.targetUsers,
        targetTiers: notifications.targetTiers,
        isScheduled: notifications.isScheduled,
        scheduledFor: notifications.scheduledFor,
        isAutomated: notifications.isAutomated,
        automationTrigger: notifications.automationTrigger,
        isActive: notifications.isActive,
        isPublished: notifications.isPublished,
        publishedAt: notifications.publishedAt,
        expiresAt: notifications.expiresAt,
        totalSent: notifications.totalSent,
        totalRead: notifications.totalRead,
        createdBy: notifications.createdBy,
        updatedAt: notifications.updatedAt,
      })
      .from(notifications)
      .leftJoin(userNotifications, and(
        eq(notifications.id, userNotifications.notificationId),
        eq(userNotifications.userId, userId)
      ))
      .where(
        or(
          eq(notifications.targetType, 'global'),
          and(
            eq(notifications.targetType, 'user'),
            sql`${notifications.targetUsers} @> ARRAY[${userId}]`
          )
        )
      )
      .orderBy(desc(notifications.createdAt));
    
    return userNotifs;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .leftJoin(userNotifications, and(
        eq(notifications.id, userNotifications.notificationId),
        eq(userNotifications.userId, userId)
      ))
      .where(and(
        or(
          eq(notifications.targetType, 'global'),
          and(
            eq(notifications.targetType, 'user'),
            sql`${notifications.targetUsers} @> ARRAY[${userId}]`
          )
        ),
        or(
          eq(userNotifications.isRead, false),
          isNull(userNotifications.isRead)
        )
      ));
    
    return result.count;
  }

  async markNotificationAsRead(userId: string, notificationId: number): Promise<void> {
    await db
      .insert(userNotifications)
      .values({
        userId,
        notificationId,
        isRead: true,
        readAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userNotifications.userId, userNotifications.notificationId],
        set: {
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date(),
        }
      });
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    // Get all notifications for this user
    const notifs = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        or(
          eq(notifications.targetType, 'global'),
          and(
            eq(notifications.targetType, 'user'),
            sql`${notifications.targetUsers} @> ARRAY[${userId}]`
          )
        )
      );

    // Mark all as read
    for (const notif of notifs) {
      await db
        .insert(userNotifications)
        .values({
          userId,
          notificationId: notif.id,
          isRead: true,
          readAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [userNotifications.userId, userNotifications.notificationId],
          set: {
            isRead: true,
            readAt: new Date(),
            updatedAt: new Date(),
          }
        });
    }
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async seedLoyaltyNotification(): Promise<void> {
    // Check if loyalty notification already exists
    const existingNotification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.type, 'loyalty'))
      .limit(1);
    
    if (existingNotification.length === 0) {
      await db.insert(notifications).values({
        title: 'Gold Member Loyalty Reward',
        message: "Thanks for your first month as a gold member, you've unlocked a free sleep review valued at $250 - book now",
        type: 'loyalty',
        category: 'reward',
        priority: 'high',
        actionText: 'Book Now',
        actionUrl: '/track?section=review',
        targetType: 'tier',
        targetTiers: ['Gold', 'Platinum'],
        isActive: true,
        isPublished: true,
        publishedAt: new Date(),
        createdBy: 'system',
      });
      console.log('Loyalty notification seeded successfully');
    }
  }

  async createUserNotification(userNotification: InsertUserNotification): Promise<UserNotification> {
    const [newUserNotification] = await db
      .insert(userNotifications)
      .values(userNotification)
      .returning();
    return newUserNotification;
  }

  // Temporary password system for bulk imports
  async createTemporaryPassword(userId: string, tempPassword: string): Promise<TemporaryPassword> {
    const [result] = await db
      .insert(temporaryPasswords)
      .values({
        userId,
        tempPassword,
        expiresAt: AuthUtils.createTempPasswordExpiry(),
      })
      .returning();
    return result;
  }

  async verifyTemporaryPassword(userId: string, tempPassword: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(temporaryPasswords)
      .where(
        and(
          eq(temporaryPasswords.userId, userId),
          eq(temporaryPasswords.tempPassword, tempPassword),
          eq(temporaryPasswords.isUsed, false),
          gte(temporaryPasswords.expiresAt, new Date())
        )
      );
    return !!result;
  }

  async markTemporaryPasswordAsUsed(userId: string): Promise<void> {
    await db
      .update(temporaryPasswords)
      .set({ isUsed: true })
      .where(eq(temporaryPasswords.userId, userId));
  }

  async createBulkUsers(userList: UpsertUser[]): Promise<User[]> {
    const results: User[] = [];
    
    // Optimized batch size for 20,000 users - larger batches for better performance
    const batchSize = 500;
    console.log(`Processing ${userList.length} users in batches of ${batchSize}...`);
    
    for (let i = 0; i < userList.length; i += batchSize) {
      const batch = userList.slice(i, i + batchSize);
      const startTime = Date.now();
      
      try {
        // Use onConflictDoUpdate for upsert behavior in case of duplicates
        const batchResults = await db.insert(users)
          .values(batch)
          .onConflictDoUpdate({
            target: users.email,
            set: {
              firstName: sql`EXCLUDED.first_name`,
              lastName: sql`EXCLUDED.last_name`,
              country: sql`EXCLUDED.country`,
              phone: sql`EXCLUDED.phone`,
              subscriptionTier: sql`EXCLUDED.subscription_tier`,
              migrated: sql`EXCLUDED.migrated`,
              firstChildDob: sql`EXCLUDED.first_child_dob`,
              accountActivated: sql`EXCLUDED.account_activated`,
              updatedAt: new Date(),
            },
          })
          .returning();
        
        results.push(...batchResults);
        
        const processingTime = Date.now() - startTime;
        console.log(`Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(userList.length/batchSize)} (${batch.length} users) in ${processingTime}ms`);
        
        // Small delay between batches to prevent overwhelming the database
        if (i + batchSize < userList.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.error(`Error processing batch ${Math.floor(i/batchSize) + 1}:`, error);
        throw error;
      }
    }
    
    console.log(`Successfully processed ${results.length} users`);
    return results;
  }

  async createBulkCoursePurchases(purchases: InsertCoursePurchase[]): Promise<CoursePurchase[]> {
    const results: CoursePurchase[] = [];
    
    // Process in batches to prevent memory issues
    const batchSize = 200;
    console.log(`Processing ${purchases.length} course purchases in batches of ${batchSize}...`);
    
    for (let i = 0; i < purchases.length; i += batchSize) {
      const batch = purchases.slice(i, i + batchSize);
      const startTime = Date.now();
      
      try {
        const batchResults = await db.insert(coursePurchases)
          .values(batch)
          .returning();
        
        results.push(...batchResults);
        
        const processingTime = Date.now() - startTime;
        console.log(`Processed course purchase batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(purchases.length/batchSize)} (${batch.length} purchases) in ${processingTime}ms`);
        
        // Small delay between batches
        if (i + batchSize < purchases.length) {
          await new Promise(resolve => setTimeout(resolve, 25));
        }
      } catch (error) {
        console.error(`Error processing course purchase batch ${Math.floor(i/batchSize) + 1}:`, error);
        throw error;
      }
    }
    
    console.log(`Successfully processed ${results.length} course purchases`);
    return results;
  }

  async setUserPassword(userId: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({
        passwordHash,
        hasSetPassword: true,
        isFirstLogin: false,
        lastPasswordChange: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async authenticateWithTemporaryPassword(email: string, tempPassword: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    if (!user) return null;

    // Check if temporary password is valid
    const isValidTemp = await this.verifyTemporaryPassword(user.id, tempPassword);
    if (!isValidTemp) return null;

    return user;
  }

  // Family invite operations
  async getFamilyMembers(familyOwnerId: string): Promise<FamilyMember[]> {
    return await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.familyOwnerId, familyOwnerId));
  }

  async createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember> {
    const [result] = await db
      .insert(familyMembers)
      .values(member)
      .returning();
    return result;
  }

  async getFamilyInvites(familyOwnerId: string): Promise<FamilyInvite[]> {
    return await db
      .select()
      .from(familyInvites)
      .where(eq(familyInvites.familyOwnerId, familyOwnerId));
  }

  async createFamilyInvite(invite: InsertFamilyInvite): Promise<FamilyInvite> {
    const [result] = await db
      .insert(familyInvites)
      .values(invite)
      .returning();
    return result;
  }

  async getFamilyInviteByEmail(email: string): Promise<FamilyInvite | undefined> {
    const [result] = await db
      .select()
      .from(familyInvites)
      .where(eq(familyInvites.inviteeEmail, email));
    return result;
  }

  async updateFamilyInviteStatus(inviteId: number, status: string): Promise<void> {
    await db
      .update(familyInvites)
      .set({ status })
      .where(eq(familyInvites.id, inviteId));
  }

  async acceptFamilyInvite(inviteId: number, memberId: string): Promise<void> {
    // Update invite status to accepted
    await db
      .update(familyInvites)
      .set({ status: "accepted" })
      .where(eq(familyInvites.id, inviteId));
    
    // Find the invite to get details
    const [invite] = await db
      .select()
      .from(familyInvites)
      .where(eq(familyInvites.id, inviteId));
    
    if (invite) {
      // Create family member record
      await db.insert(familyMembers).values({
        familyOwnerId: invite.familyOwnerId,
        memberId,
        memberEmail: invite.inviteeEmail,
        memberName: invite.inviteeName,
        memberRole: invite.inviteeRole,
        status: "active",
        joinedAt: new Date(),
      });
    }
  }

  async expireFamilyInvite(inviteId: number): Promise<void> {
    await db
      .update(familyInvites)
      .set({ status: "expired" })
      .where(eq(familyInvites.id, inviteId));
  }

  async getFamilyMember(memberId: number, familyOwnerId: string): Promise<FamilyMember | undefined> {
    const [member] = await db
      .select()
      .from(familyMembers)
      .where(and(eq(familyMembers.id, memberId), eq(familyMembers.familyOwnerId, familyOwnerId)));
    return member;
  }

  async deleteFamilyMember(memberId: number): Promise<void> {
    await db
      .delete(familyMembers)
      .where(eq(familyMembers.id, memberId));
  }

  // Stripe product operations
  async getStripeProducts(): Promise<StripeProduct[]> {
    return await db
      .select()
      .from(stripeProducts)
      .where(eq(stripeProducts.isActive, true))
      .orderBy(stripeProducts.name);
  }

  async getStripeProductById(productId: string): Promise<StripeProduct | undefined> {
    const [product] = await db
      .select()
      .from(stripeProducts)
      .where(eq(stripeProducts.stripeProductId, productId));
    return product;
  }

  async getStripeProductByCourseId(courseId: number): Promise<StripeProduct | undefined> {
    const [product] = await db
      .select()
      .from(stripeProducts)
      .where(and(
        eq(stripeProducts.courseId, courseId),
        eq(stripeProducts.type, "course"),
        eq(stripeProducts.isActive, true)
      ));
    return product;
  }

  async getStripeProduct(planTier: string, billingPeriod: string): Promise<StripeProduct | undefined> {
    const [product] = await db
      .select()
      .from(stripeProducts)
      .where(and(
        eq(stripeProducts.purchaseCategory, `${planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan`),
        eq(stripeProducts.billingInterval, billingPeriod === 'yearly' ? 'yearly' : 'monthly'),
        eq(stripeProducts.type, "subscription"),
        eq(stripeProducts.isActive, true)
      ));
    return product;
  }

  async createStripeProduct(product: InsertStripeProduct): Promise<StripeProduct> {
    const [result] = await db
      .insert(stripeProducts)
      .values(product)
      .returning();
    return result;
  }

  async updateStripeProduct(productId: string, updates: Partial<StripeProduct>): Promise<StripeProduct> {
    const [result] = await db
      .update(stripeProducts)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(stripeProducts.stripeProductId, productId))
      .returning();
    return result;
  }

  async getCoursePricing(courseId: number): Promise<number | null> {
    const product = await this.getStripeProductByCourseId(courseId);
    return product ? product.amount : null;
  }

  async getSubscriptionPricing(): Promise<{ monthly: number | null; yearly: number | null; }> {
    const subscriptionProducts = await db
      .select()
      .from(stripeProducts)
      .where(and(
        eq(stripeProducts.type, "subscription"),
        eq(stripeProducts.isActive, true)
      ));

    const result = { monthly: null as number | null, yearly: null as number | null };
    
    for (const product of subscriptionProducts) {
      if (product.billingInterval === "month") {
        result.monthly = product.amount;
      } else if (product.billingInterval === "year") {
        result.yearly = product.amount;
      }
    }
    
    return result;
  }

  // Regional pricing operations
  async getRegionalPricing(): Promise<RegionalPricing[]> {
    return await db
      .select()
      .from(regionalPricing)
      .where(eq(regionalPricing.isActive, true))
      .orderBy(regionalPricing.region);
  }

  async getRegionalPricingByRegion(region: string): Promise<RegionalPricing | undefined> {
    const [pricing] = await db
      .select()
      .from(regionalPricing)
      .where(and(
        eq(regionalPricing.region, region),
        eq(regionalPricing.isActive, true)
      ));
    return pricing;
  }

  async createRegionalPricing(pricing: InsertRegionalPricing): Promise<RegionalPricing> {
    const [result] = await db
      .insert(regionalPricing)
      .values(pricing)
      .returning();
    return result;
  }

  async updateRegionalPricing(id: number, updates: Partial<RegionalPricing>): Promise<RegionalPricing> {
    const [result] = await db
      .update(regionalPricing)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(regionalPricing.id, id))
      .returning();
    return result;
  }

  // Lead capture operations
  async createLeadCapture(leadData: InsertLeadCapture): Promise<LeadCapture> {
    const [leadCapture] = await db.insert(leadCaptures)
      .values(leadData)
      .returning();
    return leadCapture;
  }

  async getLeadCaptureByEmail(email: string): Promise<LeadCapture | undefined> {
    const [leadCapture] = await db.select().from(leadCaptures).where(eq(leadCaptures.email, email));
    return leadCapture;
  }

  async getLeadCapturesByFreebieId(freebieId: number): Promise<LeadCapture[]> {
    return await db.select().from(leadCaptures).where(eq(leadCaptures.freebieId, freebieId));
  }

  async getAllLeadCaptures(): Promise<LeadCapture[]> {
    return await db.select().from(leadCaptures).orderBy(desc(leadCaptures.createdAt));
  }

  // Service operations
  async getServices(): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.isActive, true))
      .orderBy(services.serviceType);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, id));
    return service;
  }

  async getServiceByType(serviceType: string): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(and(
        eq(services.serviceType, serviceType),
        eq(services.isActive, true)
      ));
  }

  async createService(service: InsertService): Promise<Service> {
    const [result] = await db
      .insert(services)
      .values(service)
      .returning();
    return result;
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service> {
    const [result] = await db
      .update(services)
      .set({
        ...service,
        updatedAt: new Date()
      })
      .where(eq(services.id, id))
      .returning();
    return result;
  }

  // Service booking operations
  async getServiceBookings(): Promise<ServiceBooking[]> {
    return await db
      .select()
      .from(serviceBookings)
      .orderBy(desc(serviceBookings.createdAt));
  }

  async getUserServiceBookings(userId: string): Promise<ServiceBooking[]> {
    return await db
      .select()
      .from(serviceBookings)
      .where(eq(serviceBookings.userId, userId))
      .orderBy(desc(serviceBookings.createdAt));
  }

  async getServiceBooking(id: number): Promise<ServiceBooking | undefined> {
    const [booking] = await db
      .select()
      .from(serviceBookings)
      .where(eq(serviceBookings.id, id));
    return booking;
  }

  async createServiceBooking(booking: InsertServiceBooking): Promise<ServiceBooking> {
    const [result] = await db
      .insert(serviceBookings)
      .values(booking)
      .returning();
    
    // Add service to user's activated services
    await this.addUserActivatedService(booking.userId, booking.serviceId.toString());
    
    return result;
  }

  async addUserActivatedService(userId: string, serviceId: string): Promise<User> {
    // Get current user
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get current activated services array
    const currentServices = user.activatedServices || [];
    
    // Add service if not already present
    if (!currentServices.includes(serviceId)) {
      const updatedServices = [...currentServices, serviceId];
      
      const [updatedUser] = await db
        .update(users)
        .set({
          activatedServices: updatedServices,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser;
    }
    
    return user;
  }

  async getUserActivatedServices(userId: string): Promise<string[]> {
    const user = await this.getUser(userId);
    return user?.activatedServices || [];
  }

  async updateServiceBookingStatus(id: number, status: string): Promise<ServiceBooking> {
    const [result] = await db
      .update(serviceBookings)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(serviceBookings.id, id))
      .returning();
    return result;
  }

  // Shopping product operations
  async getShoppingProducts(): Promise<ShoppingProduct[]> {
    return await db
      .select()
      .from(shoppingProducts)
      .where(eq(shoppingProducts.inStock, true))
      .orderBy(shoppingProducts.title);
  }

  async getShoppingProduct(id: number): Promise<ShoppingProduct | undefined> {
    const [product] = await db
      .select()
      .from(shoppingProducts)
      .where(eq(shoppingProducts.id, id));
    return product;
  }

  async getShoppingProductByStripeProductId(stripeProductId: string): Promise<ShoppingProduct | undefined> {
    const [product] = await db
      .select()
      .from(shoppingProducts)
      .where(eq(shoppingProducts.stripeProductId, stripeProductId));
    return product;
  }

  async createShoppingProduct(product: InsertShoppingProduct): Promise<ShoppingProduct> {
    const [result] = await db
      .insert(shoppingProducts)
      .values(product)
      .returning();
    return result;
  }

  async updateShoppingProduct(id: number, updates: Partial<InsertShoppingProduct>): Promise<ShoppingProduct> {
    const [result] = await db
      .update(shoppingProducts)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(shoppingProducts.id, id))
      .returning();
    return result;
  }

  async deleteShoppingProduct(id: number): Promise<void> {
    await db
      .delete(shoppingProducts)
      .where(eq(shoppingProducts.id, id));
  }

  // Cart operations
  async getUserCart(userId: string): Promise<CartItem[]> {
    return await db.select().from(cartItems).where(eq(cartItems.userId, userId));
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = await db.select().from(cartItems)
      .where(eq(cartItems.userId, cartItem.userId))
      .where(eq(cartItems.itemType, cartItem.itemType))
      .where(eq(cartItems.itemId, cartItem.itemId));

    if (existingItem.length > 0) {
      // Update quantity if item exists
      const [updatedItem] = await db.update(cartItems)
        .set({ quantity: existingItem[0].quantity + (cartItem.quantity || 1) })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();
      return updatedItem;
    } else {
      // Add new item
      const [newItem] = await db.insert(cartItems).values(cartItem).returning();
      return newItem;
    }
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem> {
    const [updatedItem] = await db.update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearUserCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  async getCartItemCount(userId: string): Promise<number> {
    const result = await db.select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId));
    return result.reduce((total, item) => total + item.quantity, 0);
  }
}

export const storage = new DatabaseStorage();
