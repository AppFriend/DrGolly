export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stripeProductId: string;
  type: 'one-off' | 'subscription';
  imageUrl?: string;
}

export interface RegionalPricing {
  AUD: number;
  USD: number;
  EUR: number;
}