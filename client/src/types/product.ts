export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  stripeProductId: string;
  type: 'one-off' | 'subscription';
  ageRange?: string;
  regionalPricing?: {
    amount: number;
    currency: string;
    region: string;
  };
}

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  currency: string;
  appliedCoupon: string | null;
}

export interface CouponValidation {
  valid: boolean;
  coupon?: {
    id: string;
    name: string;
    percent_off: number | null;
    amount_off: number | null;
  };
  discountAmount?: number;
  finalAmount?: number;
  message?: string;
}