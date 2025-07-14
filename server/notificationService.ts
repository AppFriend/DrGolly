import { storage } from './storage';
import type { User } from '@shared/schema';

export class NotificationService {
  // Create welcome notification when user first signs up
  static async createWelcomeNotification(userId: string): Promise<void> {
    try {
      await storage.createNotification({
        userId,
        title: "Welcome to Dr. Golly!",
        message: "Welcome to your personalized parenting journey! We're excited to help you and your family with expert sleep guidance and parenting tips. Check out our featured courses to get started.",
        type: "info",
        category: "welcome",
        priority: "normal",
        actionText: "Browse Courses",
        actionUrl: "/courses",
        isRead: false,
        targetType: "user",
        targetUsers: [userId],
        isActive: true,
        isPublished: true,
        publishedAt: new Date(),
        createdBy: "system"
      });
      console.log(`Welcome notification created for user ${userId}`);
    } catch (error) {
      console.error('Error creating welcome notification:', error);
    }
  }

  // Create lactation consultant notification for Gold users after 1 month
  static async createLactationConsultantNotification(userId: string): Promise<void> {
    try {
      await storage.createNotification({
        userId,
        title: "Gold Member Loyalty Reward",
        message: "Thanks for your first month as a gold member, you've unlocked a free sleep review valued at $250 - book now!",
        type: "loyalty",
        category: "reward",
        priority: "high",
        actionText: "Book Now",
        actionUrl: "/track?section=review",
        isRead: false,
        targetType: "user",
        targetUsers: [userId],
        isActive: true,
        isPublished: true,
        publishedAt: new Date(),
        createdBy: "system"
      });
      console.log(`Lactation consultant notification created for user ${userId}`);
    } catch (error) {
      console.error('Error creating lactation consultant notification:', error);
    }
  }

  // Create discount offer notification when new discount is added
  static async createDiscountOfferNotification(userId: string, discountDetails?: any): Promise<void> {
    try {
      await storage.createNotification({
        userId,
        title: "Exclusive Partner Discount Available",
        message: "Great news! As a Gold member, you now have access to 25% off premium baby products from our trusted partners. This exclusive discount is available for the next 7 days only.",
        type: "offer",
        category: "discount",
        priority: "normal",
        actionText: "View Discounts",
        actionUrl: "/discounts",
        isRead: false,
        targetType: "user",
        targetUsers: [userId],
        isActive: true,
        isPublished: true,
        publishedAt: new Date(),
        createdBy: "system"
      });
      console.log(`Discount offer notification created for user ${userId}`);
    } catch (error) {
      console.error('Error creating discount offer notification:', error);
    }
  }

  // Create birthday reminder notification 1 week before child's birthday
  static async createBirthdayReminderNotification(userId: string, childName: string): Promise<void> {
    try {
      await storage.createNotification({
        userId,
        title: `${childName}'s Birthday Coming Up!`,
        message: `Don't forget - ${childName}'s birthday is coming up next week! We have some special milestone celebration ideas and developmental guidance for this exciting time.`,
        type: "reminder",
        category: "birthday",
        priority: "high",
        actionText: "Birthday Tips",
        actionUrl: "/blog",
        isRead: false,
        targetType: "user",
        targetUsers: [userId],
        isActive: true,
        isPublished: true,
        publishedAt: new Date(),
        createdBy: "system"
      });
      console.log(`Birthday reminder notification created for user ${userId} and child ${childName}`);
    } catch (error) {
      console.error('Error creating birthday reminder notification:', error);
    }
  }

  // Check and create automated notifications based on user data
  static async checkAndCreateAutomatedNotifications(userId: string): Promise<void> {
    try {
      const user = await storage.getUserById(userId);
      if (!user) return;

      // Check if user needs welcome notification (new signups)
      const hasWelcomeNotification = await storage.hasNotificationByType(userId, 'welcome');
      if (!hasWelcomeNotification) {
        await this.createWelcomeNotification(userId);
      }

      // Check if Gold user needs lactation consultant notification (1 month after Gold upgrade)
      if (user.subscriptionTier === 'gold' || user.subscriptionTier === 'platinum') {
        const hasLoyaltyNotification = await storage.hasNotificationByType(userId, 'loyalty');
        if (!hasLoyaltyNotification) {
          // Check if user has been Gold for 1 month
          const goldUpgradeDate = user.updatedAt || user.createdAt;
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          
          if (goldUpgradeDate && goldUpgradeDate < oneMonthAgo) {
            await this.createLactationConsultantNotification(userId);
          }
        }
      }

      // Check for birthday reminders
      const children = await storage.getFamilyMembers(userId);
      for (const child of children) {
        if (child.birthDate) {
          const birthday = new Date(child.birthDate);
          const today = new Date();
          const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
          
          // If birthday already passed this year, set for next year
          if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
          }
          
          // Check if birthday is within 7 days
          const oneWeekFromNow = new Date();
          oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
          
          if (nextBirthday <= oneWeekFromNow) {
            const hasBirthdayNotification = await storage.hasNotificationByTypeAndChild(userId, 'birthday', child.name);
            if (!hasBirthdayNotification) {
              await this.createBirthdayReminderNotification(userId, child.name);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking automated notifications:', error);
    }
  }

  // Run periodic check for all users (can be called by cron job)
  static async runPeriodicNotificationCheck(): Promise<void> {
    try {
      const users = await storage.getAllActiveUsers();
      for (const user of users) {
        await this.checkAndCreateAutomatedNotifications(user.id);
      }
      console.log('Periodic notification check completed');
    } catch (error) {
      console.error('Error running periodic notification check:', error);
    }
  }
}