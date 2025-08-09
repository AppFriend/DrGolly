import { klaviyoClient } from '../client';
import { SubscriptionStartedEventData } from '../schemas/subscription';

export async function sendSubscriptionStartedEvent(subscriptionData: SubscriptionStartedEventData): Promise<void> {
  try {
    // Extract billing day from start date
    const startDate = new Date(subscriptionData.start_date);
    const monthlyBillingDay = startDate.getDate();

    await klaviyoClient.sendEvent({
      metricName: 'Subscription Started',
      profileId: `$email:${subscriptionData.email}`,
      time: subscriptionData.start_date,
      idempotencyKey: `sub_started:${subscriptionData.stripe_subscription_id}`,
      properties: {
        subscription_id: subscriptionData.id,
        stripe_subscription_id: subscriptionData.stripe_subscription_id,
        stripe_customer_id: subscriptionData.stripe_customer_id,
        tier: subscriptionData.tier || 'gold',
        product_name: subscriptionData.product_name || `Dr. Golly ${subscriptionData.tier || 'Gold'} Plan`,
        plan_interval: subscriptionData.plan_interval || 'month',
        plan_interval_count: subscriptionData.plan_interval_count || 1,
        start_date: subscriptionData.start_date,
        monthly_billing_day: monthlyBillingDay,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency || 'AUD',
        trial_end: subscriptionData.trial_end || null,
        status: 'active',
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
      }
    });

    console.log(`Klaviyo subscription started event sent for subscription ${subscriptionData.stripe_subscription_id}`);
  } catch (error) {
    console.error(`Failed to send Klaviyo subscription started event for ${subscriptionData.stripe_subscription_id}:`, error.message);
    // Don't throw - we don't want to break subscription processing
  }
}