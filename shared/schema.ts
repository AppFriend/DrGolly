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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // sleep, nutrition, health, freebies
  thumbnailUrl: varchar("thumbnail_url"),
  videoUrl: varchar("video_url"),
  duration: integer("duration"), // in minutes
  ageRange: varchar("age_range"), // e.g., "4-16 Weeks", "4-8 Months"
  tier: varchar("tier").default("free").notNull(), // free, gold, platinum
  isPublished: boolean("is_published").default(true),
  likes: integer("likes").default(0),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
});

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
  status: varchar("status").notNull(), // yes, sometimes, maybe, never
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

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type UserCourseProgress = typeof userCourseProgress.$inferSelect;
export type PartnerDiscount = typeof partnerDiscounts.$inferSelect;
export type BillingHistory = typeof billingHistory.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
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
