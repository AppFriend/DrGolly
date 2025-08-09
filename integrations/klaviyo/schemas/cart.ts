export interface CartLineItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  category: string;
}

export interface CartEventData {
  id: string;
  email: string;
  total: number;
  currency?: string;
  status?: string;
  last_activity_at?: string;
  updated_at?: string;
  abandoned_event_emitted?: boolean;
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

export interface CartEventProperties {
  cart_id: string;
  cart_value: number;
  currency: string;
  line_items: CartLineItem[];
  last_activity_at: string;
  url: string;
  environment: string;
  abandoned_at?: string;
  minutes_since_last_activity?: number;
}