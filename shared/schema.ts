import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  subscriptionTier: varchar("subscription_tier").default("free").notNull(), // free, gold, platinum
  subscriptionStatus: varchar("subscription_status").default("active").notNull(), // active, cancelled, expired
  nextBillingDate: timestamp("next_billing_date"),
  billingPeriod: varchar("billing_period").default("monthly"), // monthly, yearly
  // Additional CSV attributes
  country: varchar("country"),
  phone: varchar("phone"),
  signupSource: varchar("signup_source"),
  migrated: boolean("migrated").default(false),
  choosePlan: varchar("choose_plan").default("free"),
  countCourses: integer("count_courses").default(0),
  coursesPurchasedPreviously: text("courses_purchased_previously"),
  signInCount: integer("sign_in_count").default(0),
  lastSignIn: timestamp("last_sign_in"),
  lastLoginAt: timestamp("last_login_at"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  isAdmin: boolean("is_admin").default(false),
  // First-time login system
  temporaryPassword: varchar("temporary_password"),
  isFirstLogin: boolean("is_first_login").default(true),
  hasSetPassword: boolean("has_set_password").default(false),
  passwordHash: varchar("password_hash"),
  lastPasswordChange: timestamp("last_password_change"),
  // Personalization preferences for enhanced signup flow
  primaryConcerns: text("primary_concerns"), // JSON array of selected concerns (baby-sleep, toddler-sleep, toddler-behaviour, partner-discounts)
  phoneNumber: varchar("phone_number"), // Phone number with country code
  profilePictureUrl: varchar("profile_picture_url"), // Profile picture URL
  userRole: varchar("user_role"), // Parent, Grandparent, Carer
  acceptedTerms: boolean("accepted_terms").default(false), // Terms and conditions acceptance
  marketingOptIn: boolean("marketing_opt_in").default(false), // Email marketing opt-in
  smsMarketingOptIn: boolean("sms_marketing_opt_in").default(false), // SMS marketing opt-in
  newMemberOfferShown: boolean("new_member_offer_shown").default(false), // Whether new member offer was shown
  newMemberOfferAccepted: boolean("new_member_offer_accepted").default(false), // Whether they accepted the offer
  onboardingCompleted: boolean("onboarding_completed").default(false),
  // New fields for CSV migration
  firstChildDob: timestamp("first_child_dob"), // Date of birth of first child
  accountActivated: boolean("account_activated").default(false), // Whether user has activated their account
  // Service activations tracking
  activatedServices: text("activated_services").array().default([]), // Array of service IDs user has purchased/activated
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Temporary password system for bulk imports
export const temporaryPasswords = pgTable("temporary_passwords", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  tempPassword: varchar("temp_password").notNull(),
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens for proper password reset flow
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  token: varchar("token").notNull().unique(),
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Family members table for family sharing
export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  familyOwnerId: varchar("family_owner_id").references(() => users.id).notNull(), // Gold subscriber who owns the family
  memberId: varchar("member_id").references(() => users.id).notNull(), // Family member user ID
  memberEmail: varchar("member_email").notNull(),
  memberName: varchar("member_name").notNull(),
  memberRole: varchar("member_role").notNull(), // parent, carer
  status: varchar("status").default("active"), // active, inactive, pending
  invitedAt: timestamp("invited_at").defaultNow(),
  joinedAt: timestamp("joined_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Family invites table for tracking pending invitations
export const familyInvites = pgTable("family_invites", {
  id: serial("id").primaryKey(),
  familyOwnerId: varchar("family_owner_id").references(() => users.id).notNull(),
  inviteeEmail: varchar("invitee_email").notNull(),
  inviteeName: varchar("invitee_name").notNull(),
  inviteeRole: varchar("invitee_role").notNull(), // parent, carer
  tempPassword: varchar("temp_password").notNull(),
  status: varchar("status").default("pending"), // pending, accepted, expired
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Feature flags table to manage access control per subscription tier
export const featureFlags = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  featureName: varchar("feature_name", { length: 100 }).notNull().unique(),
  description: text("description"),
  freeAccess: boolean("free_access").default(false),
  goldAccess: boolean("gold_access").default(false),
  platinumAccess: boolean("platinum_access").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  
  // ==== COURSE DESCRIPTION PAGE FIELDS ====
  // These fields are used for the purchase/marketing page when users haven't bought the course
  description: text("description"), // Short description for course cards
  detailedDescription: text("detailed_description"), // Detailed description for course description page
  websiteContent: text("website_content"), // Full marketing content for course detail page
  keyFeatures: text("key_features").array(), // Array of key features for marketing
  whatsCovered: text("whats_covered").array(), // Array of what's covered points for marketing
  price: decimal("price", { precision: 10, scale: 2 }),
  discountedPrice: decimal("discounted_price", { precision: 10, scale: 2 }),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("4.8"), // Course rating for description page
  reviewCount: integer("review_count").default(0), // Number of reviews for description page
  thumbnailUrl: varchar("thumbnail_url"), // Thumbnail for course cards and description page
  
  // ==== COURSE OVERVIEW PAGE FIELDS ====
  // These fields are used for the purchased course learning experience
  overviewDescription: text("overview_description"), // Welcome message for purchased course
  learningObjectives: text("learning_objectives").array(), // What students will learn
  completionCriteria: text("completion_criteria"), // How course completion is determined
  courseStructureNotes: text("course_structure_notes"), // Notes about course organization
  
  // ==== SHARED FIELDS ====
  // These fields are used by both description and overview pages
  category: varchar("category", { length: 100 }).notNull(), // sleep, nutrition, health, freebies
  videoUrl: varchar("video_url"), // Course introduction video
  duration: integer("duration"), // Total course duration in minutes
  ageRange: varchar("age_range"), // e.g., "4-16 Weeks", "4-8 Months"

  skillLevel: varchar("skill_level"), // beginner, intermediate, advanced
  stripeProductId: varchar("stripe_product_id"),
  uniqueId: varchar("unique_id"),
  isPublished: boolean("is_published").default(false), // Default to draft
  status: varchar("status").default("draft").notNull(), // draft, published, archived
  likes: integer("likes").default(0),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course chapters (new layer above modules)
export const courseChapters = pgTable("course_chapters", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  chapterNumber: varchar("chapter_number").notNull(), // e.g., "1", "1.1", "1.2"
  orderIndex: integer("order_index").notNull(),
  isCompleted: boolean("is_completed").default(false),
  status: varchar("status").default("draft").notNull(), // draft, published, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course lessons (previously called modules, now under chapters)
export const courseLessons = pgTable("course_lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  chapterId: integer("chapter_id").references(() => courseChapters.id),
  title: varchar("title").notNull(),
  description: text("description"),
  content: text("content"), // Rich text content
  videoUrl: varchar("video_url"), // Video URL
  thumbnailUrl: varchar("thumbnail_url"), // Thumbnail URL
  orderIndex: integer("order_index").notNull(),
  contentType: varchar("content_type").default("text"), // text, video
  duration: integer("duration"), // in minutes for videos
  status: varchar("status").default("draft").notNull(), // draft, published, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lesson content (previously called submodules, rich text content within lessons)
export const lessonContent = pgTable("lesson_content", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => courseLessons.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  videoUrl: varchar("video_url"),
  content: text("content"),
  duration: integer("duration"), // in minutes
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User progress on chapters
export const userChapterProgress = pgTable("user_chapter_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  chapterId: integer("chapter_id").references(() => courseChapters.id).notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User progress on lessons
export const userLessonProgress = pgTable("user_lesson_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  lessonId: integer("lesson_id").references(() => courseLessons.id).notNull(),
  completed: boolean("completed").default(false),
  watchTime: integer("watch_time").default(0), // in seconds for videos
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Unique constraint on userId and lessonId for upsert operations
  uniqueUserLesson: unique().on(table.userId, table.lessonId),
}));

// User progress on lesson content
export const userLessonContentProgress = pgTable("user_lesson_content_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  lessonContentId: integer("lesson_content_id").references(() => lessonContent.id).notNull(),
  completed: boolean("completed").default(false),
  watchTime: integer("watch_time").default(0), // in seconds
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User course progress
export const userCourseProgress = pgTable("user_course_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  isCompleted: boolean("is_completed").default(false),
  progress: integer("progress").default(0), // percentage 0-100
  lastWatched: timestamp("last_watched").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Unique constraint on userId and courseId for upsert operations
  uniqueUserCourse: unique().on(table.userId, table.courseId),
}));

// Partner discounts
export const partnerDiscounts = pgTable("partner_discounts", {
  id: serial("id").primaryKey(),
  partnerName: varchar("partner_name", { length: 255 }).notNull(),
  logoUrl: varchar("logo_url"),
  description: text("description"),
  discountCode: varchar("discount_code", { length: 100 }).notNull(),
  discountPercentage: integer("discount_percentage"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  requiredTier: varchar("required_tier").default("gold"), // gold, platinum
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Billing history
export const billingHistory = pgTable("billing_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  status: varchar("status").default("completed"), // completed, pending, failed
  billingDate: timestamp("billing_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Children profiles for family tracking
export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  gender: varchar("gender"), // male, female, other
  profilePicture: varchar("profile_picture"), // URL or base64 data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Growth tracking data
export const growthEntries = pgTable("growth_entries", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  measurementType: varchar("measurement_type").notNull(), // weight, height, head_circumference
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit").notNull(), // kg, cm, etc.
  percentile: decimal("percentile", { precision: 5, scale: 2 }),
  logDate: timestamp("log_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Development milestone tracking
export const developmentMilestones = pgTable("development_milestones", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  videoUrl: varchar("video_url"),
  ageRangeStart: integer("age_range_start"), // in months
  ageRangeEnd: integer("age_range_end"), // in months
  category: varchar("category"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const developmentTracking = pgTable("development_tracking", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  milestoneId: integer("milestone_id").references(() => developmentMilestones.id).notNull(),
  status: varchar("status").notNull(), // yes, sometimes, not_yet
  achievedDate: timestamp("achieved_date"), // Date when status was set to 'yes'
  logDate: timestamp("log_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Feed tracking
export const feedEntries = pgTable("feed_entries", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  feedDate: timestamp("feed_date").defaultNow(),
  leftDuration: integer("left_duration"), // in minutes
  rightDuration: integer("right_duration"), // in minutes
  totalDuration: integer("total_duration"), // in minutes
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sleep tracking
export const sleepEntries = pgTable("sleep_entries", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  sleepDate: timestamp("sleep_date").defaultNow(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in minutes
  quality: varchar("quality"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Consultation bookings
export const consultationBookings = pgTable("consultation_bookings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  consultationType: varchar("consultation_type").notNull(), // sleep, lactation
  requestedDate: timestamp("requested_date"),
  status: varchar("status").default("pending"), // pending, confirmed, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blog posts table
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  slug: varchar("slug").unique().notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  category: varchar("category").notNull(), // sleep, nutrition, health, parenting, freebies
  tags: text("tags").array(),
  imageUrl: varchar("image_url"),
  pdfUrl: varchar("pdf_url"), // For freebies downloads
  readTime: integer("read_time"), // in minutes
  author: varchar("author").default("Daniel Golshevsky").notNull(),
  publishedAt: timestamp("published_at"),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  isPublished: boolean("is_published").default(false), // Default to draft
  status: varchar("status").default("draft").notNull(), // draft, published, archived
  isPinned: boolean("is_pinned").default(false), // Pin posts to top of home page
  pinnedAt: timestamp("pinned_at"), // When post was pinned for ordering
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stripe products table - sync between app and Stripe
export const stripeProducts = pgTable("stripe_products", {
  id: serial("id").primaryKey(),
  stripeProductId: varchar("stripe_product_id").unique().notNull(),
  stripePriceId: varchar("stripe_price_id").unique().notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  statementDescriptor: varchar("statement_descriptor"),
  purchaseCategory: varchar("purchase_category").notNull(), // Gold Plan, Single Purchase - Course, Single Purchase - Service, Gift Card, Free User
  type: varchar("type").notNull(), // subscription, course, service, gift_card, free
  amount: integer("amount"), // in cents, null for free products
  currency: varchar("currency").default("usd"),
  billingInterval: varchar("billing_interval"), // monthly, yearly (for subscriptions)
  isActive: boolean("is_active").default(true),
  // Link to existing courses for course products
  courseId: integer("course_id").references(() => courses.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course purchases table
export const coursePurchases = pgTable("course_purchases", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  stripeProductId: varchar("stripe_product_id").references(() => stripeProducts.stripeProductId),
  stripePaymentIntentId: varchar("stripe_payment_intent_id").unique(),
  stripeCustomerId: varchar("stripe_customer_id"),
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency").default("usd"),
  status: varchar("status").default("pending"), // pending, completed, failed, refunded
  purchasedAt: timestamp("purchased_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  courseProgress: many(userCourseProgress),
  billingHistory: many(billingHistory),
  children: many(children),
  consultationBookings: many(consultationBookings),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  user: one(users, {
    fields: [children.userId],
    references: [users.id],
  }),
  growthEntries: many(growthEntries),
  developmentTracking: many(developmentTracking),
  feedEntries: many(feedEntries),
  sleepEntries: many(sleepEntries),
}));

export const growthEntriesRelations = relations(growthEntries, ({ one }) => ({
  child: one(children, {
    fields: [growthEntries.childId],
    references: [children.id],
  }),
}));

export const developmentMilestonesRelations = relations(developmentMilestones, ({ many }) => ({
  tracking: many(developmentTracking),
}));

export const developmentTrackingRelations = relations(developmentTracking, ({ one }) => ({
  child: one(children, {
    fields: [developmentTracking.childId],
    references: [children.id],
  }),
  milestone: one(developmentMilestones, {
    fields: [developmentTracking.milestoneId],
    references: [developmentMilestones.id],
  }),
}));

export const feedEntriesRelations = relations(feedEntries, ({ one }) => ({
  child: one(children, {
    fields: [feedEntries.childId],
    references: [children.id],
  }),
}));

export const sleepEntriesRelations = relations(sleepEntries, ({ one }) => ({
  child: one(children, {
    fields: [sleepEntries.childId],
    references: [children.id],
  }),
}));

export const consultationBookingsRelations = relations(consultationBookings, ({ one }) => ({
  user: one(users, {
    fields: [consultationBookings.userId],
    references: [users.id],
  }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  userProgress: many(userCourseProgress),
  chapters: many(courseChapters),
  lessons: many(courseLessons),
}));

export const courseChaptersRelations = relations(courseChapters, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseChapters.courseId],
    references: [courses.id],
  }),
  lessons: many(courseLessons),
  userProgress: many(userChapterProgress),
}));

export const courseLessonsRelations = relations(courseLessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseLessons.courseId],
    references: [courses.id],
  }),
  chapter: one(courseChapters, {
    fields: [courseLessons.chapterId],
    references: [courseChapters.id],
  }),
  lessonContent: many(lessonContent),
  userProgress: many(userLessonProgress),
}));

export const lessonContentRelations = relations(lessonContent, ({ one, many }) => ({
  lesson: one(courseLessons, {
    fields: [lessonContent.lessonId],
    references: [courseLessons.id],
  }),
  userProgress: many(userLessonContentProgress),
}));

export const userChapterProgressRelations = relations(userChapterProgress, ({ one }) => ({
  user: one(users, {
    fields: [userChapterProgress.userId],
    references: [users.id],
  }),
  chapter: one(courseChapters, {
    fields: [userChapterProgress.chapterId],
    references: [courseChapters.id],
  }),
}));

export const userLessonProgressRelations = relations(userLessonProgress, ({ one }) => ({
  user: one(users, {
    fields: [userLessonProgress.userId],
    references: [users.id],
  }),
  lesson: one(courseLessons, {
    fields: [userLessonProgress.lessonId],
    references: [courseLessons.id],
  }),
}));

export const userLessonContentProgressRelations = relations(userLessonContentProgress, ({ one }) => ({
  user: one(users, {
    fields: [userLessonContentProgress.userId],
    references: [users.id],
  }),
  lessonContent: one(lessonContent, {
    fields: [userLessonContentProgress.lessonContentId],
    references: [lessonContent.id],
  }),
}));

export const userCourseProgressRelations = relations(userCourseProgress, ({ one }) => ({
  user: one(users, {
    fields: [userCourseProgress.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [userCourseProgress.courseId],
    references: [courses.id],
  }),
}));

export const billingHistoryRelations = relations(billingHistory, ({ one }) => ({
  user: one(users, {
    fields: [billingHistory.userId],
    references: [users.id],
  }),
}));

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  familyOwner: one(users, {
    fields: [familyMembers.familyOwnerId],
    references: [users.id],
  }),
  member: one(users, {
    fields: [familyMembers.memberId],
    references: [users.id],
  }),
}));

export const familyInvitesRelations = relations(familyInvites, ({ one }) => ({
  familyOwner: one(users, {
    fields: [familyInvites.familyOwnerId],
    references: [users.id],
  }),
}));

export const stripeProductsRelations = relations(stripeProducts, ({ one, many }) => ({
  course: one(courses, {
    fields: [stripeProducts.courseId],
    references: [courses.id],
  }),
  purchases: many(coursePurchases),
}));

export const coursePurchasesRelations = relations(coursePurchases, ({ one }) => ({
  user: one(users, {
    fields: [coursePurchases.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [coursePurchases.courseId],
    references: [courses.id],
  }),
  stripeProduct: one(stripeProducts, {
    fields: [coursePurchases.stripeProductId],
    references: [stripeProducts.stripeProductId],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserCourseProgressSchema = createInsertSchema(userCourseProgress).omit({
  id: true,
  createdAt: true,
});

export const insertPartnerDiscountSchema = createInsertSchema(partnerDiscounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBillingHistorySchema = createInsertSchema(billingHistory).omit({
  id: true,
  createdAt: true,
});

// New tracking schemas
export const insertChildSchema = createInsertSchema(children).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGrowthEntrySchema = createInsertSchema(growthEntries).omit({
  id: true,
  createdAt: true,
});

export const insertDevelopmentMilestoneSchema = createInsertSchema(developmentMilestones).omit({
  id: true,
  createdAt: true,
});

export const insertDevelopmentTrackingSchema = createInsertSchema(developmentTracking).omit({
  id: true,
  createdAt: true,
});

export const insertFeedEntrySchema = createInsertSchema(feedEntries).omit({
  id: true,
  createdAt: true,
});

export const insertSleepEntrySchema = createInsertSchema(sleepEntries).omit({
  id: true,
  createdAt: true,
});

export const insertConsultationBookingSchema = createInsertSchema(consultationBookings).omit({
  id: true,
  createdAt: true,
});

// Lesson schemas
export const insertCourseLessonSchema = createInsertSchema(courseLessons).omit({
  id: true,
  createdAt: true,
});

export const insertLessonContentSchema = createInsertSchema(lessonContent).omit({
  id: true,
  createdAt: true,
});

export const insertCourseChapterSchema = createInsertSchema(courseChapters).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export const insertUserChapterProgressSchema = createInsertSchema(userChapterProgress).omit({
  id: true,
  createdAt: true,
});

export const insertUserLessonProgressSchema = createInsertSchema(userLessonProgress).omit({
  id: true,
  createdAt: true,
});

export const insertUserLessonContentProgressSchema = createInsertSchema(userLessonContentProgress).omit({
  id: true,
  createdAt: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCoursePurchaseSchema = createInsertSchema(coursePurchases).omit({
  id: true,
  createdAt: true,
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({
  id: true,
  createdAt: true,
});

export const insertFamilyInviteSchema = createInsertSchema(familyInvites).omit({
  id: true,
  createdAt: true,
});

export const insertStripeProductSchema = createInsertSchema(stripeProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
// Lead capture table for public freebie downloads
export const leadCaptures = pgTable("lead_captures", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  freebieId: integer("freebie_id").notNull(),
  topOfFunnelNurture: boolean("top_of_funnel_nurture").default(true),
  klaviyoProfileId: varchar("klaviyo_profile_id", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  referrerUrl: text("referrer_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type LeadCapture = typeof leadCaptures.$inferSelect;
export type InsertLeadCapture = typeof leadCaptures.$inferInsert;

export const insertLeadCaptureSchema = createInsertSchema(leadCaptures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type CourseChapter = typeof courseChapters.$inferSelect;
export type CourseLesson = typeof courseLessons.$inferSelect;
export type LessonContent = typeof lessonContent.$inferSelect;
export type UserChapterProgress = typeof userChapterProgress.$inferSelect;
export type UserLessonProgress = typeof userLessonProgress.$inferSelect;
export type UserLessonContentProgress = typeof userLessonContentProgress.$inferSelect;
export type UserCourseProgress = typeof userCourseProgress.$inferSelect;
export type PartnerDiscount = typeof partnerDiscounts.$inferSelect;
export type BillingHistory = typeof billingHistory.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertCourseChapter = z.infer<typeof insertCourseChapterSchema>;
export type InsertCourseLesson = z.infer<typeof insertCourseLessonSchema>;
export type InsertLessonContent = z.infer<typeof insertLessonContentSchema>;
export type InsertUserChapterProgress = z.infer<typeof insertUserChapterProgressSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type InsertUserLessonProgress = z.infer<typeof insertUserLessonProgressSchema>;
export type InsertUserLessonContentProgress = z.infer<typeof insertUserLessonContentProgressSchema>;
export type InsertUserCourseProgress = z.infer<typeof insertUserCourseProgressSchema>;
export type InsertPartnerDiscount = z.infer<typeof insertPartnerDiscountSchema>;
export type InsertBillingHistory = z.infer<typeof insertBillingHistorySchema>;

// New tracking types
export type Child = typeof children.$inferSelect;
export type GrowthEntry = typeof growthEntries.$inferSelect;
export type DevelopmentMilestone = typeof developmentMilestones.$inferSelect;
export type DevelopmentTracking = typeof developmentTracking.$inferSelect;
export type FeedEntry = typeof feedEntries.$inferSelect;
export type SleepEntry = typeof sleepEntries.$inferSelect;
export type ConsultationBooking = typeof consultationBookings.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type InsertGrowthEntry = z.infer<typeof insertGrowthEntrySchema>;
export type InsertDevelopmentMilestone = z.infer<typeof insertDevelopmentMilestoneSchema>;
export type InsertDevelopmentTracking = z.infer<typeof insertDevelopmentTrackingSchema>;
export type InsertFeedEntry = z.infer<typeof insertFeedEntrySchema>;
export type InsertSleepEntry = z.infer<typeof insertSleepEntrySchema>;
export type InsertConsultationBooking = z.infer<typeof insertConsultationBookingSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type CoursePurchase = typeof coursePurchases.$inferSelect;
export type InsertCoursePurchase = z.infer<typeof insertCoursePurchaseSchema>;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type FamilyInvite = typeof familyInvites.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type InsertFamilyInvite = z.infer<typeof insertFamilyInviteSchema>;

// Notification system tables
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // User ID for specific targeting
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // welcome, birthday, discount, manual, system
  category: text("category").notNull().default("system"), // general, birthday, discount, welcome, system
  priority: text("priority").notNull().default("normal"), // low, normal, high
  
  // Read tracking
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  
  // Action buttons (optional)
  actionText: text("action_text"),
  actionUrl: text("action_url"),
  
  // Targeting options (kept for backward compatibility)
  targetType: varchar("target_type", { length: 20 }).default("global"), // global, user, tier
  targetUsers: text("target_users").array(), // Array of user IDs for specific targeting
  targetTiers: text("target_tiers").array(), // Array of tiers (free, gold, platinum)
  
  // Scheduling and automation
  isScheduled: boolean("is_scheduled").default(false),
  scheduledFor: timestamp("scheduled_for"),
  isAutomated: boolean("is_automated").default(false),
  automationTrigger: varchar("automation_trigger", { length: 100 }), // signup, birthday, new_discount
  
  // Status and metadata
  isActive: boolean("is_active").default(true),
  isPublished: boolean("is_published").default(true),
  publishedAt: timestamp("published_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  
  // Tracking
  totalSent: integer("total_sent").default(0),
  totalRead: integer("total_read").default(0),
  
  createdBy: varchar("created_by"), // Admin user ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User notification status tracking
export const userNotifications = pgTable("user_notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  notificationId: integer("notification_id").notNull(),
  
  // Status tracking
  isRead: boolean("is_read").default(false),
  isClicked: boolean("is_clicked").default(false),
  readAt: timestamp("read_at"),
  clickedAt: timestamp("clicked_at"),
  
  // Delivery metadata
  deliveredAt: timestamp("delivered_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("unique_user_notification").on(table.userId, table.notificationId),
]);

// Admin notifications table (legacy - keeping for backward compatibility)
export const adminNotifications = pgTable("admin_notifications", {
  id: serial("id").primaryKey(),
  heading: varchar("heading", { length: 200 }).notNull(),
  body: text("body").notNull(),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notification relations
export const notificationRelations = relations(notifications, ({ many }) => ({
  userNotifications: many(userNotifications),
}));

export const userNotificationRelations = relations(userNotifications, ({ one }) => ({
  notification: one(notifications, {
    fields: [userNotifications.notificationId],
    references: [notifications.id],
  }),
  user: one(users, {
    fields: [userNotifications.userId],
    references: [users.id],
  }),
}));



// Temporary password types
export type TemporaryPassword = typeof temporaryPasswords.$inferSelect;
export type InsertTemporaryPassword = typeof temporaryPasswords.$inferInsert;

// Regional pricing table for multi-currency support
export const regionalPricing = pgTable("regional_pricing", {
  id: serial("id").primaryKey(),
  region: varchar("region", { length: 50 }).notNull(), // 'AU', 'US', 'EU'
  currency: varchar("currency", { length: 3 }).notNull(), // 'AUD', 'USD', 'EUR'
  coursePrice: decimal("course_price", { precision: 10, scale: 2 }).notNull(), // Base course price
  goldMonthly: decimal("gold_monthly", { precision: 10, scale: 2 }).notNull(), // Gold monthly price
  goldYearly: decimal("gold_yearly", { precision: 10, scale: 2 }).notNull(), // Gold yearly price
  platinumMonthly: decimal("platinum_monthly", { precision: 10, scale: 2 }).notNull(), // Platinum monthly price
  platinumYearly: decimal("platinum_yearly", { precision: 10, scale: 2 }).notNull(), // Platinum yearly price
  // Book pricing
  book1Price: decimal("book1_price", { precision: 10, scale: 2 }).notNull(), // Your Baby Doesn't Come with a Book
  book2Price: decimal("book2_price", { precision: 10, scale: 2 }).notNull(), // Dr Golly's Guide to Family Illness
  countryList: text("country_list").array(), // Countries for this region
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shopping products table for books and other products
export const shoppingProducts = pgTable("shopping_products", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  author: varchar("author"),
  description: text("description"),
  category: varchar("category").notNull(), // book, product, etc.
  stripeProductId: varchar("stripe_product_id").unique().notNull(),
  stripePriceAudId: varchar("stripe_price_aud_id").unique().notNull(), // AUD price ID
  stripePriceUsdId: varchar("stripe_price_usd_id").unique().notNull(), // USD price ID
  stripePriceEurId: varchar("stripe_price_eur_id").unique(), // EUR price ID (optional)
  priceField: varchar("price_field").notNull(), // book1Price, book2Price - maps to regionalPricing table
  rating: decimal("rating", { precision: 2, scale: 1 }),
  reviewCount: integer("review_count").default(0),
  imageUrl: varchar("image_url"),
  amazonUrl: varchar("amazon_url"),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  inStock: boolean("in_stock").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRegionalPricingSchema = createInsertSchema(regionalPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Notification schema types
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  totalSent: true,
  totalRead: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserNotificationSchema = createInsertSchema(userNotifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Notification = typeof notifications.$inferSelect;
export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertUserNotification = z.infer<typeof insertUserNotificationSchema>;

// Legacy admin notification schema
export const insertAdminNotificationSchema = createInsertSchema(adminNotifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;

// Services table for sleep review and lactation consultant
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  serviceType: varchar("service_type", { length: 100 }).notNull(), // 'sleep-review', 'lactation-consultant'
  duration: integer("duration").notNull(), // Duration in minutes
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  
  // Service details
  whatToExpect: text("what_to_expect"), // Detailed description of what happens during the service
  whoIsItFor: text("who_is_it_for"), // Target audience description
  benefits: text("benefits").array(), // Array of benefit points
  includes: text("includes").array(), // What's included in the service
  
  // Booking configuration
  isActive: boolean("is_active").default(true),
  maxAdvanceBookingDays: integer("max_advance_booking_days").default(30), // How far in advance can be booked
  minAdvanceBookingHours: integer("min_advance_booking_hours").default(24), // Minimum hours before booking
  
  // Availability
  availableDays: text("available_days").array(), // ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  availableTimeSlots: text("available_time_slots").array(), // ['09:00', '10:00', '11:00', '14:00', '15:00']
  
  // Metadata
  imageUrl: varchar("image_url"),
  iconName: varchar("icon_name"), // Lucide icon name
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service bookings table
export const serviceBookings = pgTable("service_bookings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  serviceId: integer("service_id").notNull(),
  
  // Booking details
  preferredDate: timestamp("preferred_date").notNull(),
  preferredTime: varchar("preferred_time", { length: 10 }).notNull(), // '09:00', '10:00', etc.
  concerns: text("concerns"), // User's concerns/questions
  
  // Status tracking
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, confirmed, completed, cancelled
  confirmationCode: varchar("confirmation_code", { length: 50 }),
  
  // Meeting details
  meetingLink: varchar("meeting_link"),
  meetingNotes: text("meeting_notes"), // Admin notes after consultation
  
  // Notification tracking
  reminderSent: boolean("reminder_sent").default(false),
  reminderSentAt: timestamp("reminder_sent_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service relations
export const serviceRelations = relations(services, ({ many }) => ({
  bookings: many(serviceBookings),
}));

export const serviceBookingRelations = relations(serviceBookings, ({ one }) => ({
  service: one(services, {
    fields: [serviceBookings.serviceId],
    references: [services.id],
  }),
  user: one(users, {
    fields: [serviceBookings.userId],
    references: [users.id],
  }),
}));

// Service schemas
export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceBookingSchema = createInsertSchema(serviceBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Service types
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type ServiceBooking = typeof serviceBookings.$inferSelect;
export type InsertServiceBooking = z.infer<typeof insertServiceBookingSchema>;

// Shopping product schemas
export const insertShoppingProductSchema = createInsertSchema(shoppingProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Shopping product types
export type ShoppingProduct = typeof shoppingProducts.$inferSelect;
export type InsertShoppingProduct = z.infer<typeof insertShoppingProductSchema>;

// Shopping cart system
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  itemType: varchar("item_type").notNull(), // 'course' or 'book'
  itemId: integer("item_id").notNull(), // course ID or book ID
  quantity: integer("quantity").default(1),
  addedAt: timestamp("added_at").defaultNow(),
});

// Cart schemas
export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  addedAt: true,
});

// Cart types
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

// Stripe product types
export type StripeProduct = typeof stripeProducts.$inferSelect;
export type InsertStripeProduct = z.infer<typeof insertStripeProductSchema>;
export type RegionalPricing = typeof regionalPricing.$inferSelect;
export type InsertRegionalPricing = z.infer<typeof insertRegionalPricingSchema>;
