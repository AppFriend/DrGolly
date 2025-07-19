export interface CustomerDetails {
  email: string;
  dueDate: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}

export interface CouponData {
  id: string;
  code: string;
  percent_off?: number;
  amount_off?: number;
  valid: boolean;
}

export interface PaymentData {
  amount: number;
  currency: string;
  productId: string;
  couponCode?: string;
}