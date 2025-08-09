// @jest-environment node
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { KlaviyoClient } from '../client';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('KlaviyoClient', () => {
  let client: KlaviyoClient;
  
  beforeEach(() => {
    // Set up environment
    process.env.KLAVIYO_API_KEY = 'test-api-key';
    client = new KlaviyoClient();
    mockFetch.mockClear();
  });

  describe('sendEvent', () => {
    it('should send event with correct payload structure', async () => {
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'event-123' } })
      } as Response);

      await client.sendEvent({
        metricName: 'Placed Order',
        profileId: '$email:test@example.com',
        value: 99.99,
        time: '2025-08-09T10:00:00Z',
        idempotencyKey: 'purchase:order-123',
        properties: {
          order_id: 'order-123',
          total: 99.99
        }
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://a.klaviyo.com/api/events',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Klaviyo-API-Key test-api-key',
            'Content-Type': 'application/json',
            'revision': '2025-02-15',
            'Idempotency-Key': expect.any(String)
          }),
          body: expect.stringContaining('"type":"event"')
        })
      );
    });

    it('should retry on 429 rate limit', async () => {
      // Mock rate limit then success
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: () => Promise.resolve('Rate limited')
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: { id: 'event-123' } })
        } as Response);

      await client.sendEvent({
        metricName: 'Test Event',
        profileId: '$email:test@example.com',
        idempotencyKey: 'test:123',
        properties: { test: true }
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should sanitize sensitive properties', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'event-123' } })
      } as Response);

      await client.sendEvent({
        metricName: 'Test Event',
        profileId: '$email:test@example.com',
        idempotencyKey: 'test:123',
        properties: {
          order_id: 'order-123',
          password: 'secret123',
          credit_card: '4111111111111111'
        }
      });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      
      expect(body.data.attributes.properties.password).toBe('[REDACTED]');
      expect(body.data.attributes.properties.credit_card).toBe('[REDACTED]');
      expect(body.data.attributes.properties.order_id).toBe('order-123');
    });
  });

  describe('idempotency', () => {
    it('should generate stable hash for same idempotency key', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'event-123' } })
      } as Response);

      await client.sendEvent({
        metricName: 'Test Event',
        profileId: '$email:test@example.com',
        idempotencyKey: 'test:same-key',
        properties: { test: true }
      });

      await client.sendEvent({
        metricName: 'Test Event',
        profileId: '$email:test@example.com',
        idempotencyKey: 'test:same-key',
        properties: { test: true }
      });

      const firstCall = mockFetch.mock.calls[0];
      const secondCall = mockFetch.mock.calls[1];
      
      expect(firstCall[1]?.headers['Idempotency-Key'])
        .toBe(secondCall[1]?.headers['Idempotency-Key']);
    });
  });
});