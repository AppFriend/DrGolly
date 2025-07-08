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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  courseProgress: many(userCourseProgress),
  billingHistory: many(billingHistory),
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
