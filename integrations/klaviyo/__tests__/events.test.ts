// @jest-environment node
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { sendPurchaseEvent } from '../events/purchase';
import { sendSubscriptionStartedEvent } from '../events/subscription_started';
import { sendStartedCheckoutEvent, sendCheckoutAbandonedEvent } from '../events/cart_abandoned';
import { klaviyoClient } from '../client';

// Mock the client
jest.mock('../client');
const mockKlaviyoClient = klaviyoClient as jest.Mocked<typeof klaviyoClient>;

describe('Klaviyo Events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockKlaviyoClient.sendEvent = jest.fn().mockResolvedValue(undefined);
  });

  describe('sendPurchaseEvent', () => {
    it('should send purchase event with required fields', async () => {
      const orderData = {
        id: 'order-123',
        email: 'customer@example.com',
        total: 99.99,
        currency: 'AUD',
        paid_at: '2025-08-09T10:00:00Z',
        items: [
          {
            id: 'course-1',
            name: 'Sleep Course',
            price: 99.99,
            quantity: 1,
            category: 'course'
          }
        ]
      };

      await sendPurchaseEvent(orderData);

      expect(mockKlaviyoClient.sendEvent).toHaveBeenCalledWith({
        metricName: 'Placed Order',
        profileId: '$email:customer@example.com',
        value: 99.99,
        time: '2025-08-09T10:00:00Z',
        idempotencyKey: 'purchase:order-123',
        properties: expect.objectContaining({
          order_id: 'order-123',
          currency: 'AUD',
          total: 99.99,
          line_items: expect.arrayContaining([
            expect.objectContaining({
              product_id: 'course-1',
              product_name: 'Sleep Course',
              quantity: 1,
              unit_price: 99.99,
              line_total: 99.99
            })
          ])
        })
      });
    });

    it('should handle missing optional fields', async () => {
      const minimalOrderData = {
        id: 'order-456',
        email: 'customer@example.com',
        total: 49.99
      };

      await sendPurchaseEvent(minimalOrderData);

      expect(mockKlaviyoClient.sendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          metricName: 'Placed Order',
          profileId: '$email:customer@example.com',
          value: 49.99,
          properties: expect.objectContaining({
            order_id: 'order-456',
            total: 49.99,
            currency: 'AUD', // default
            line_items: [] // empty when no items
          })
        })
      );
    });
  });

  describe('sendSubscriptionStartedEvent', () => {
    it('should send subscription event with all fields', async () => {
      const subscriptionData = {
        id: 'sub-123',
        email: 'subscriber@example.com',
        stripe_subscription_id: 'sub_stripe123',
        stripe_customer_id: 'cus_stripe123',
        tier: 'gold',
        plan_interval: 'month' as const,
        start_date: '2025-08-09T10:00:00Z',
        amount: 29.99,
        currency: 'AUD'
      };

      await sendSubscriptionStartedEvent(subscriptionData);

      expect(mockKlaviyoClient.sendEvent).toHaveBeenCalledWith({
        metricName: 'Subscription Started',
        profileId: '$email:subscriber@example.com',
        time: '2025-08-09T10:00:00Z',
        idempotencyKey: 'sub_started:sub_stripe123',
        properties: expect.objectContaining({
          subscription_id: 'sub-123',
          stripe_subscription_id: 'sub_stripe123',
          tier: 'gold',
          plan_interval: 'month',
          amount: 29.99,
          status: 'active',
          monthly_billing_day: 9 // extracted from start_date
        })
      });
    });
  });

  describe('cart abandonment events', () => {
    const cartData = {
      id: 'cart-123',
      email: 'customer@example.com',
      total: 99.99,
      currency: 'AUD',
      updated_at: '2025-08-09T10:00:00Z',
      last_activity_at: '2025-08-09T09:50:00Z',
      items: [
        {
          id: 'course-1',
          name: 'Sleep Course',
          price: 99.99,
          quantity: 1
        }
      ]
    };

    it('should send started checkout event', async () => {
      await sendStartedCheckoutEvent(cartData);

      expect(mockKlaviyoClient.sendEvent).toHaveBeenCalledWith({
        metricName: 'Started Checkout',
        profileId: '$email:customer@example.com',
        time: '2025-08-09T10:00:00Z',
        idempotencyKey: 'started_checkout:cart-123:2025-08-09T10:00:00Z',
        properties: expect.objectContaining({
          cart_id: 'cart-123',
          cart_value: 99.99,
          line_items: expect.arrayContaining([
            expect.objectContaining({
              product_id: 'course-1',
              product_name: 'Sleep Course'
            })
          ])
        })
      });
    });

    it('should send checkout abandoned event', async () => {
      await sendCheckoutAbandonedEvent(cartData);

      expect(mockKlaviyoClient.sendEvent).toHaveBeenCalledWith({
        metricName: 'Checkout Abandoned',
        profileId: '$email:customer@example.com',
        time: expect.any(String),
        idempotencyKey: 'checkout_abandoned:cart-123:2025-08-09T09:50:00Z',
        properties: expect.objectContaining({
          cart_id: 'cart-123',
          cart_value: 99.99,
          abandoned_at: expect.any(String),
          minutes_since_last_activity: expect.any(Number)
        })
      });
    });
  });

  describe('error handling', () => {
    it('should not throw errors from purchase event', async () => {
      mockKlaviyoClient.sendEvent.mockRejectedValue(new Error('API error'));

      await expect(sendPurchaseEvent({
        id: 'order-123',
        email: 'test@example.com',
        total: 99.99
      })).resolves.not.toThrow();
    });

    it('should not throw errors from subscription event', async () => {
      mockKlaviyoClient.sendEvent.mockRejectedValue(new Error('API error'));

      await expect(sendSubscriptionStartedEvent({
        id: 'sub-123',
        email: 'test@example.com',
        stripe_subscription_id: 'sub_123',
        stripe_customer_id: 'cus_123',
        start_date: '2025-08-09T10:00:00Z',
        amount: 29.99
      })).resolves.not.toThrow();
    });
  });
});