import {
  users,
  courses,
  courseModules,
  courseSubmodules,
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
  type User,
  type UpsertUser,
  type FeatureFlag,
  type InsertFeatureFlag,
  type Course,
  type CourseModule,
  type CourseSubmodule,
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
  type InsertCourseModule,
  type InsertCourseSubmodule,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, gte, or, ilike } from "drizzle-orm";
import { AuthUtils } from "./auth-utils";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSubscription(userId: string, tier: string, billingPeriod: string, nextBillingDate: Date): Promise<User>;
  updateUserPersonalization(userId: string, personalizationData: any): Promise<User>;
  
  // Course operations
  getCourses(category?: string, tier?: string): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourseStats(courseId: number, likes?: number, views?: number): Promise<void>;
  
  // Module operations
  getCourseModules(courseId: number): Promise<CourseModule[]>;
  createCourseModule(module: InsertCourseModule): Promise<CourseModule>;
  getCourseSubmodules(moduleId: number): Promise<CourseSubmodule[]>;
  createCourseSubmodule(submodule: InsertCourseSubmodule): Promise<CourseSubmodule>;
  
  // User submodule progress
  getUserSubmoduleProgress(userId: string, submoduleId: number): Promise<UserSubmoduleProgress | undefined>;
  updateUserSubmoduleProgress(progress: InsertUserSubmoduleProgress): Promise<UserSubmoduleProgress>;
  
  // User progress operations
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
  updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User>;
  
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

  async updateUserPersonalization(userId: string, personalizationData: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        primaryConcern: personalizationData.primaryConcern,
        childAge: personalizationData.childAge,
        childName: personalizationData.childName,
        sleepChallenges: personalizationData.sleepChallenges,
        previousExperience: personalizationData.previousExperience,
        parentingStyle: personalizationData.parentingStyle,
        timeCommitment: personalizationData.timeCommitment,
        supportNetwork: personalizationData.supportNetwork,
        additionalNotes: personalizationData.additionalNotes,
        onboardingCompleted: personalizationData.onboardingCompleted ?? true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Course operations
  async getCourses(category?: string, tier?: string): Promise<Course[]> {
    let conditions = [eq(courses.isPublished, true)];
    
    if (category) {
      conditions.push(eq(courses.category, category));
    }
    
    if (tier) {
      conditions.push(eq(courses.tier, tier));
    }
    
    return await db.select().from(courses)
      .where(and(...conditions))
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

  async getChild(id: number): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  }

  async createChild(child: InsertChild): Promise<Child> {
    const [newChild] = await db
      .insert(children)
      .values(child)
      .returning();
    return newChild;
  }

  async updateChild(id: number, child: Partial<InsertChild>): Promise<Child> {
    const [updatedChild] = await db
      .update(children)
      .set({ ...child, updatedAt: new Date() })
      .where(eq(children.id, id))
      .returning();
    return updatedChild;
  }

  async deleteChild(id: number): Promise<void> {
    await db.delete(children).where(eq(children.id, id));
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
    const [newTracking] = await db
      .insert(developmentTracking)
      .values(tracking)
      .returning();
    return newTracking;
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

  // Module operations
  async getCourseModules(courseId: number): Promise<CourseModule[]> {
    return await db.select().from(courseModules).where(eq(courseModules.courseId, courseId)).orderBy(courseModules.orderIndex);
  }

  async createCourseModule(module: InsertCourseModule): Promise<CourseModule> {
    const [newModule] = await db
      .insert(courseModules)
      .values(module)
      .returning();
    return newModule;
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
  async getBlogPosts(category?: string): Promise<BlogPost[]> {
    let query = db.select().from(blogPosts).where(eq(blogPosts.isPublished, true));
    
    if (category && category !== 'all') {
      query = query.where(and(eq(blogPosts.isPublished, true), eq(blogPosts.category, category)));
    }
    
    return await query.orderBy(desc(blogPosts.publishedAt));
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
    return await db.select().from(coursePurchases).where(eq(coursePurchases.userId, userId)).orderBy(desc(coursePurchases.purchasedAt));
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

  async updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User> {
    const [user] = await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId)).returning();
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
    monthlyGoldRevenue: number;
    annualGoldRevenue: number;
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
      .where(gte(users.lastSignIn, thirtyDaysAgo));
    
    const totalCoursesSold = await db.select({ count: count() }).from(coursePurchases);
    const totalSubscriptionUpgrades = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.subscriptionTier, "gold"), eq(users.migrated, false)));
    
    const goldUserCount = goldUsers[0]?.count || 0;
    const monthlyGoldRevenue = goldUserCount * 199;
    const annualGoldRevenue = goldUserCount * 199 * 12;
    
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
      monthlyGoldRevenue,
      annualGoldRevenue,
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
}

export const storage = new DatabaseStorage();
