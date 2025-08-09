import { sendPurchaseEvent } from '../../integrations/klaviyo/events/purchase';
import { sendSubscriptionStartedEvent } from '../../integrations/klaviyo/events/subscription_started';
import { sendStartedCheckoutEvent } from '../../integrations/klaviyo/events/cart_abandoned';
import { isKlaviyoEventEnabled } from '../../integrations/klaviyo/feature-flags';

/**
 * Hook to send purchase event to Klaviyo after successful order
 */
export async function onOrderCompleted(orderData: {
  id: string;
  email: string;
  total: number;
  currency?: string;
  paid_at?: string;
  items?: any[];
  stripe_payment_intent_id?: string;
  payment_method?: string;
}): Promise<void> {
  if (!isKlaviyoEventEnabled('purchase')) {
    return;
  }

  try {
    await sendPurchaseEvent({
      id: orderData.id,
      email: orderData.email,
      total: orderData.total,
      currency: orderData.currency,
      paid_at: orderData.paid_at,
      items: orderData.items,
      stripe_payment_intent_id: orderData.stripe_payment_intent_id,
      payment_method: orderData.payment_method
    });
  } catch (error) {
    console.error('Klaviyo purchase event failed:', error);
  }
}

/**
 * Hook to send subscription started event to Klaviyo
 */
export async function onSubscriptionStarted(subscriptionData: {
  id: string;
  email: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  tier?: string;
  start_date: string;
  amount: number;
  currency?: string;
  plan_interval?: 'month' | 'year';
}): Promise<void> {
  if (!isKlaviyoEventEnabled('subscription_started')) {
    return;
  }

  try {
    await sendSubscriptionStartedEvent({
      id: subscriptionData.id,
      email: subscriptionData.email,
      stripe_subscription_id: subscriptionData.stripe_subscription_id,
      stripe_customer_id: subscriptionData.stripe_customer_id,
      tier: subscriptionData.tier,
      start_date: subscriptionData.start_date,
      amount: subscriptionData.amount,
      currency: subscriptionData.currency,
      plan_interval: subscriptionData.plan_interval
    });
  } catch (error) {
    console.error('Klaviyo subscription started event failed:', error);
  }
}

/**
 * Hook to send cart started event to Klaviyo
 */
export async function onCartUpdated(cartData: {
  id: string;
  email: string;
  total: number;
  currency?: string;
  updated_at?: string;
  items?: any[];
}): Promise<void> {
  if (!isKlaviyoEventEnabled('cart_abandoned_10m')) {
    return;
  }

  try {
    await sendStartedCheckoutEvent({
      id: cartData.id,
      email: cartData.email,
      total: cartData.total,
      currency: cartData.currency,
      updated_at: cartData.updated_at || new Date().toISOString(),
      last_activity_at: cartData.updated_at || new Date().toISOString(),
      items: cartData.items
    });
  } catch (error) {
    console.error('Klaviyo cart started event failed:', error);
  }
}