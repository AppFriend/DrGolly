import {
  users,
  courses,
  courseChapters,
  courseModules,
  courseSubmodules,
  userChapterProgress,
  userModuleProgress,
  userSubmoduleProgress,
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
  familyMembers,
  familyInvites,
  stripeProducts,
  regionalPricing,
  type User,
  type UpsertUser,
  type FeatureFlag,
  type InsertFeatureFlag,
  type Course,
  type CourseChapter,
  type CourseModule,
  type CourseSubmodule,
  type UserChapterProgress,
  type UserModuleProgress,
  type UserSubmoduleProgress,
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
  type InsertCourseModule,
  type InsertCourseSubmodule,
  type InsertUserChapterProgress,
  type InsertUserModuleProgress,
  type InsertUserSubmoduleProgress,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, gte, or, ilike, sql, isNotNull } from "drizzle-orm";
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
  
  // Course operations
  getCourses(category?: string, tier?: string): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourseStats(courseId: number, likes?: number, views?: number): Promise<void>;
  
  // Chapter operations
  getCourseChapters(courseId: number): Promise<CourseChapter[]>;
  createCourseChapter(chapter: InsertCourseChapter): Promise<CourseChapter>;
  
  // Module operations
  getCourseModules(courseId: number): Promise<CourseModule[]>;
  getChapterModules(chapterId: number): Promise<CourseModule[]>;
  createCourseModule(module: InsertCourseModule): Promise<CourseModule>;
  getCourseSubmodules(moduleId: number): Promise<CourseSubmodule[]>;
  createCourseSubmodule(submodule: InsertCourseSubmodule): Promise<CourseSubmodule>;
  
  // User progress operations
  getUserChapterProgress(userId: string, chapterId: number): Promise<UserChapterProgress | undefined>;
  updateUserChapterProgress(progress: InsertUserChapterProgress): Promise<UserChapterProgress>;
  getUserModuleProgress(userId: string, moduleId: number): Promise<UserModuleProgress | undefined>;
  getAllUserModuleProgress(userId: string): Promise<UserModuleProgress[]>;
  updateUserModuleProgress(progress: InsertUserModuleProgress): Promise<UserModuleProgress>;
  getUserSubmoduleProgress(userId: string, submoduleId: number): Promise<UserSubmoduleProgress | undefined>;
  updateUserSubmoduleProgress(progress: InsertUserSubmoduleProgress): Promise<UserSubmoduleProgress>;
  
  // User course progress operations
  getUserCourseProgress(userId: string, courseId: number): Promise<UserCourseProgress | undefined>;
  getUserProgress(userId: string): Promise<UserCourseProgress[]>;
  updateUserProgress(progress: InsertUserCourseProgress): Promise<UserCourseProgress>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
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
    const [user] = await db
      .update(users)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
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
    
    return await db.select().from(courses)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(courses.createdAt);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
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
    return await db.select().from(children).where(eq(children.userId, userId));
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
  async getCourseModules(courseId: number): Promise<CourseModule[]> {
    return await db.select().from(courseModules).where(eq(courseModules.courseId, courseId)).orderBy(courseModules.orderIndex);
  }

  async getChapterModules(chapterId: number): Promise<CourseModule[]> {
    return await db.select().from(courseModules).where(eq(courseModules.chapterId, chapterId)).orderBy(courseModules.orderIndex);
  }

  async createCourseModule(module: InsertCourseModule): Promise<CourseModule> {
    const [newModule] = await db
      .insert(courseModules)
      .values(module)
      .returning();
    return newModule;
  }

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

  async getUserModuleProgress(userId: string, moduleId: number): Promise<UserModuleProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userModuleProgress)
      .where(and(eq(userModuleProgress.userId, userId), eq(userModuleProgress.moduleId, moduleId)));
    return progress;
  }

  async getAllUserModuleProgress(userId: string): Promise<UserModuleProgress[]> {
    return await db
      .select()
      .from(userModuleProgress)
      .where(eq(userModuleProgress.userId, userId));
  }

  async updateUserModuleProgress(progress: InsertUserModuleProgress): Promise<UserModuleProgress> {
    const [updatedProgress] = await db
      .insert(userModuleProgress)
      .values(progress)
      .onConflictDoUpdate({
        target: [userModuleProgress.userId, userModuleProgress.moduleId],
        set: {
          completed: progress.completed,
          watchTime: progress.watchTime,
          completedAt: progress.completedAt || new Date(),
        },
      })
      .returning();
    
    // Update course progress percentage after module completion
    if (progress.completed) {
      await this.updateCourseProgressPercentage(progress.userId, progress.moduleId);
    }
    
    return updatedProgress;
  }

  async updateCourseProgressPercentage(userId: string, moduleId: number): Promise<void> {
    // Get the course ID for this module
    const [module] = await db
      .select({ courseId: courseModules.courseId })
      .from(courseModules)
      .where(eq(courseModules.id, moduleId));
    
    if (!module) return;
    
    // Count total modules in the course
    const totalModulesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(courseModules)
      .where(eq(courseModules.courseId, module.courseId));
    
    const totalModules = totalModulesResult[0]?.count || 0;
    
    // Count completed modules for this user
    const completedModulesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userModuleProgress)
      .innerJoin(courseModules, eq(userModuleProgress.moduleId, courseModules.id))
      .where(and(
        eq(userModuleProgress.userId, userId),
        eq(courseModules.courseId, module.courseId),
        eq(userModuleProgress.completed, true)
      ));
    
    const completedModules = completedModulesResult[0]?.count || 0;
    
    // Calculate percentage
    const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    
    // Update or insert course progress
    await db
      .insert(userCourseProgress)
      .values({
        userId,
        courseId: module.courseId,
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

  async getCourseSubmodules(moduleId: number): Promise<CourseSubmodule[]> {
    return await db.select().from(courseSubmodules).where(eq(courseSubmodules.moduleId, moduleId)).orderBy(courseSubmodules.orderIndex);
  }

  async createCourseSubmodule(submodule: InsertCourseSubmodule): Promise<CourseSubmodule> {
    const [newSubmodule] = await db
      .insert(courseSubmodules)
      .values(submodule)
      .returning();
    return newSubmodule;
  }

  // User submodule progress
  async getUserSubmoduleProgress(userId: string, submoduleId: number): Promise<UserSubmoduleProgress | undefined> {
    const [progress] = await db.select().from(userSubmoduleProgress)
      .where(and(eq(userSubmoduleProgress.userId, userId), eq(userSubmoduleProgress.submoduleId, submoduleId)));
    return progress;
  }

  async updateUserSubmoduleProgress(progress: InsertUserSubmoduleProgress): Promise<UserSubmoduleProgress> {
    const [updatedProgress] = await db
      .insert(userSubmoduleProgress)
      .values(progress)
      .onConflictDoUpdate({
        target: [userSubmoduleProgress.userId, userSubmoduleProgress.submoduleId],
        set: {
          completed: progress.completed,
          watchTime: progress.watchTime,
          completedAt: progress.completedAt,
        },
      })
      .returning();
    return updatedProgress;
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
      .orderBy(desc(blogPosts.publishedAt));
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
    const [updatedPost] = await db
      .update(blogPosts)
      .set({ ...postData, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedPost;
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
    // Only return completed purchases to show in "Purchases" tab
    return await db.select().from(coursePurchases)
      .where(and(eq(coursePurchases.userId, userId), eq(coursePurchases.status, 'completed')))
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

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
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

  async getUserMetrics(): Promise<{
    totalUsers: number;
    freeUsers: number;
    goldUsers: number;
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
    
    // Process in batches of 100 to prevent memory issues
    const batchSize = 100;
    for (let i = 0; i < userList.length; i += batchSize) {
      const batch = userList.slice(i, i + batchSize);
      const batchResults = await db.insert(users).values(batch).returning();
      results.push(...batchResults);
    }
    
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

  async createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember> {
    const [result] = await db
      .insert(familyMembers)
      .values(member)
      .returning();
    return result;
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
}

export const storage = new DatabaseStorage();
