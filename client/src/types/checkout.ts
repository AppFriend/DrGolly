// Checkout-specific types for new checkout system
import { Product } from './product';

export interface CustomerDetails {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  dueDate: string;
  address: string;
}

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  currency: string;
  appliedCoupon?: string;
}

export interface CouponValidation {
  valid: boolean;
  coupon?: {
    id: string;
    name: string;
    percent_off?: number;
    amount_off?: number;
  };
  discountAmount: number;
  finalAmount: number;
  message?: string;
}

export interface CheckoutState {
  product: Product;
  customerDetails: CustomerDetails;
  paymentIntent?: PaymentIntent;
  appliedCoupon?: string;
  isLoading: boolean;
  paymentProcessing: boolean;
}

export interface ExpressPaymentResult {
  paymentIntent: any;
  billingDetails: any;
  paymentMethod: any;
}

export interface RegionalPricing {
  amount: number;
  currency: string;
  region: string;
  symbol: string;
}

export type PaymentFlow = 'new-user' | 'existing-user' | 'guest';
export type RedirectDestination = '/complete' | '/home' | '/checkout-success';