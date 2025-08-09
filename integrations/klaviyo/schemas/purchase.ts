export interface PurchaseLineItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  category: string;
}

export interface PurchaseEventData {
  id: string;
  email: string;
  total: number;
  currency?: string;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  discount_total?: number;
  payment_method?: string;
  stripe_payment_intent_id?: string;
  paid_at?: string;
  items?: Array<{
    id?: string;
    product_id?: string;
    name?: string;
    title?: string;
    sku?: string;
    quantity?: number;
    qty?: number;
    price?: number;
    unit_price?: number;
    category?: string;
  }>;
}

export interface PurchaseEventProperties {
  order_id: string;
  currency: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount_total: number;
  total: number;
  payment_method: string;
  line_items: PurchaseLineItem[];
  stripe_payment_intent_id?: string;
  source: string;
  environment: string;
}