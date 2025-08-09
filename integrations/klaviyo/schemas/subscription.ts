export interface SubscriptionStartedEventData {
  id: string;
  email: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  tier?: string;
  product_name?: string;
  plan_interval?: 'month' | 'year';
  plan_interval_count?: number;
  start_date: string;
  amount: number;
  currency?: string;
  trial_end?: string | null;
}

export interface SubscriptionStartedEventProperties {
  subscription_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  tier: string;
  product_name: string;
  plan_interval: string;
  plan_interval_count: number;
  start_date: string;
  monthly_billing_day: number;
  amount: number;
  currency: string;
  trial_end: string | null;
  status: string;
  environment: string;
}