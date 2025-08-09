import { klaviyoClient } from '../client';
import { PurchaseEventData, PurchaseLineItem } from '../schemas/purchase';

export async function sendPurchaseEvent(orderData: PurchaseEventData): Promise<void> {
  try {
    const lineItems = orderData.items?.map((item): PurchaseLineItem => ({
      product_id: (item.product_id || item.id || '').toString(),
      product_name: (item.name || item.title || 'Unknown Product').toString(),
      sku: (item.sku || item.product_id || item.id || '').toString(),
      quantity: item.quantity || item.qty || 1,
      unit_price: item.price || item.unit_price || 0,
      line_total: (item.price || item.unit_price || 0) * (item.quantity || item.qty || 1),
      category: item.category || 'course'
    })) || [];

    await klaviyoClient.sendEvent({
      metricName: 'Placed Order',
      profileId: `$email:${orderData.email}`,
      value: orderData.total,
      time: orderData.paid_at || new Date().toISOString(),
      idempotencyKey: `purchase:${orderData.id}`,
      properties: {
        order_id: orderData.id,
        currency: orderData.currency || 'AUD',
        subtotal: orderData.subtotal || orderData.total,
        tax: orderData.tax || 0,
        shipping: orderData.shipping || 0,
        discount_total: orderData.discount_total || 0,
        total: orderData.total,
        payment_method: orderData.payment_method || 'stripe',
        line_items: lineItems,
        stripe_payment_intent_id: orderData.stripe_payment_intent_id,
        source: 'app',
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
      }
    });

    console.log(`Klaviyo purchase event sent for order ${orderData.id}`);
  } catch (error) {
    console.error(`Failed to send Klaviyo purchase event for order ${orderData.id}:`, error.message);
    // Don't throw - we don't want to break order processing
  }
}