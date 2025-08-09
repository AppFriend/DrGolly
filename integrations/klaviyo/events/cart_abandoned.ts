import { klaviyoClient } from '../client';
import { CartEventData, CartLineItem } from '../schemas/cart';

export async function sendStartedCheckoutEvent(cartData: CartEventData): Promise<void> {
  try {
    const lineItems = mapCartItems(cartData.items || []);

    await klaviyoClient.sendEvent({
      metricName: 'Started Checkout',
      profileId: `$email:${cartData.email}`,
      time: cartData.updated_at || new Date().toISOString(),
      idempotencyKey: `started_checkout:${cartData.id}:${cartData.updated_at}`,
      properties: {
        cart_id: cartData.id,
        cart_value: cartData.total,
        currency: cartData.currency || 'AUD',
        line_items: lineItems,
        last_activity_at: cartData.last_activity_at || cartData.updated_at,
        url: `${process.env.VITE_APP_URL || 'https://app.drgolly.com'}/checkout/${cartData.id}`,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
      }
    });

    console.log(`Klaviyo started checkout event sent for cart ${cartData.id}`);
  } catch (error) {
    console.error(`Failed to send Klaviyo started checkout event for cart ${cartData.id}:`, error.message);
  }
}

export async function sendCheckoutAbandonedEvent(cartData: CartEventData): Promise<void> {
  try {
    const lineItems = mapCartItems(cartData.items || []);
    const abandonedTime = new Date().toISOString();

    await klaviyoClient.sendEvent({
      metricName: 'Checkout Abandoned',
      profileId: `$email:${cartData.email}`,
      time: abandonedTime,
      idempotencyKey: `checkout_abandoned:${cartData.id}:${cartData.last_activity_at}`,
      properties: {
        cart_id: cartData.id,
        cart_value: cartData.total,
        currency: cartData.currency || 'AUD',
        line_items: lineItems,
        last_activity_at: cartData.last_activity_at,
        abandoned_at: abandonedTime,
        minutes_since_last_activity: Math.floor(
          (Date.now() - new Date(cartData.last_activity_at || 0).getTime()) / (1000 * 60)
        ),
        url: `${process.env.VITE_APP_URL || 'https://app.drgolly.com'}/checkout/${cartData.id}`,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
      }
    });

    console.log(`Klaviyo checkout abandoned event sent for cart ${cartData.id}`);
  } catch (error) {
    console.error(`Failed to send Klaviyo checkout abandoned event for cart ${cartData.id}:`, error.message);
  }
}

function mapCartItems(items: any[]): CartLineItem[] {
  return items.map((item): CartLineItem => ({
    product_id: (item.product_id || item.id || '').toString(),
    product_name: (item.name || item.title || 'Unknown Product').toString(),
    sku: (item.sku || item.product_id || item.id || '').toString(),
    quantity: item.quantity || item.qty || 1,
    unit_price: item.price || item.unit_price || 0,
    line_total: (item.price || item.unit_price || 0) * (item.quantity || item.qty || 1),
    category: item.category || 'course'
  }));
}