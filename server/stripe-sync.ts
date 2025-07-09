import Stripe from "stripe";
import type { User } from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export interface StripeUserData {
  customerId: string | null;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  nextBillingDate: string | null;
  paymentMethodType: string | null;
  lastPaymentDate: string | null;
  totalSpent: number;
  invoiceCount: number;
  defaultPaymentMethod: string | null;
  subscriptionTier: string | null;
  billingPeriod: string | null;
}

export class StripeDataSyncService {
  private static instance: StripeDataSyncService;

  static getInstance(): StripeDataSyncService {
    if (!StripeDataSyncService.instance) {
      StripeDataSyncService.instance = new StripeDataSyncService();
    }
    return StripeDataSyncService.instance;
  }

  async getStripeDataForUser(user: User): Promise<StripeUserData | null> {
    try {
      if (!user.stripeCustomerId) {
        return null;
      }

      // Get customer data
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      if (customer.deleted) {
        return null;
      }

      // Get subscription data
      let subscriptionData: any = null;
      if (user.stripeSubscriptionId) {
        try {
          subscriptionData = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        } catch (error) {
          console.error("Failed to retrieve subscription:", error);
        }
      }

      // Get payment methods
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      // Get invoices to calculate total spent
      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        status: 'paid',
        limit: 100,
      });

      const totalSpent = invoices.data.reduce((sum, invoice) => {
        return sum + (invoice.amount_paid || 0);
      }, 0) / 100; // Convert from cents

      // Get latest payment
      const latestPayment = invoices.data.length > 0 ? invoices.data[0] : null;

      // Determine subscription tier from subscription metadata or price
      let subscriptionTier = null;
      let billingPeriod = null;
      if (subscriptionData && subscriptionData.status === 'active') {
        const price = subscriptionData.items.data[0]?.price;
        if (price) {
          billingPeriod = price.recurring?.interval || null;
          
          // Determine tier based on price amount (you may need to adjust these values)
          const priceAmount = price.unit_amount || 0;
          if (priceAmount >= 49900) { // $499 or more
            subscriptionTier = 'platinum';
          } else if (priceAmount >= 19900) { // $199 or more
            subscriptionTier = 'gold';
          } else {
            subscriptionTier = 'free';
          }
        }
      }

      const stripeData: StripeUserData = {
        customerId: user.stripeCustomerId,
        subscriptionId: user.stripeSubscriptionId,
        subscriptionStatus: subscriptionData?.status || null,
        nextBillingDate: subscriptionData?.current_period_end 
          ? new Date(subscriptionData.current_period_end * 1000).toISOString()
          : null,
        paymentMethodType: paymentMethods.data[0]?.card?.brand || null,
        lastPaymentDate: latestPayment?.created 
          ? new Date(latestPayment.created * 1000).toISOString()
          : null,
        totalSpent: totalSpent,
        invoiceCount: invoices.data.length,
        defaultPaymentMethod: paymentMethods.data[0]?.id || null,
        subscriptionTier: subscriptionTier,
        billingPeriod: billingPeriod
      };

      return stripeData;
    } catch (error) {
      console.error("Error fetching Stripe data for user:", error);
      return null;
    }
  }

  async syncStripeDataToDatabase(user: User, stripeData: StripeUserData): Promise<boolean> {
    try {
      // This would update the database with latest Stripe data
      // For now, we'll just log and return true
      console.log("Syncing Stripe data to database for user:", user.id);
      console.log("Stripe data:", {
        subscriptionStatus: stripeData.subscriptionStatus,
        nextBillingDate: stripeData.nextBillingDate,
        totalSpent: stripeData.totalSpent,
        subscriptionTier: stripeData.subscriptionTier
      });
      
      return true;
    } catch (error) {
      console.error("Error syncing Stripe data to database:", error);
      return false;
    }
  }

  async getStripeHealthStatus(): Promise<{ healthy: boolean; message: string }> {
    try {
      // Test Stripe connection by retrieving balance
      const balance = await stripe.balance.retrieve();
      return {
        healthy: true,
        message: `Stripe connection healthy. Available balance: ${balance.available?.[0]?.amount || 0} ${balance.available?.[0]?.currency || 'USD'}`
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Stripe connection failed: ${error.message}`
      };
    }
  }
}

export const stripeDataSyncService = StripeDataSyncService.getInstance();