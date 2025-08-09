import { createHash } from 'crypto';

export interface KlaviyoEventParams {
  metricName: string;
  profileId: string;
  properties: Record<string, any>;
  time?: string;
  value?: number;
  idempotencyKey: string;
}

export interface KlaviyoEventPayload {
  data: {
    type: 'event';
    attributes: {
      metric: { name: string };
      properties: Record<string, any>;
      time?: string;
      value?: number;
    };
    relationships: {
      profile: {
        data: {
          type: 'profile';
          id: string;
        };
      };
    };
  };
}

export class KlaviyoClient {
  private baseUrl = 'https://a.klaviyo.com/api';
  private apiKey: string;
  private revision = '2025-02-15';

  constructor() {
    const apiKey = process.env.KLAVIYO_API_KEY;
    if (!apiKey) {
      throw new Error('KLAVIYO_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Send an event to Klaviyo with retries and idempotency
   */
  async sendEvent(params: KlaviyoEventParams): Promise<void> {
    const { metricName, profileId, properties, time, value, idempotencyKey } = params;

    // Create stable hash for idempotency
    const idempotencyHash = this.createIdempotencyHash(idempotencyKey);

    const payload: KlaviyoEventPayload = {
      data: {
        type: 'event',
        attributes: {
          metric: { name: metricName },
          properties: this.sanitizeProperties(properties),
          ...(time && { time }),
          ...(value && { value })
        },
        relationships: {
          profile: {
            data: {
              type: 'profile',
              id: profileId
            }
          }
        }
      }
    };

    await this.makeRequest('/events', 'POST', payload, idempotencyHash);
  }

  /**
   * Make HTTP request with retry logic and error handling
   */
  private async makeRequest(
    endpoint: string,
    method: string,
    body: any,
    idempotencyKey: string,
    attempt: number = 1
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const maxRetries = 3;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'revision': this.revision
        },
        body: JSON.stringify(body)
      });

      // Handle rate limiting and server errors with exponential backoff
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        if (attempt < maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          console.log(`Klaviyo API ${response.status} - retrying in ${delay}ms (attempt ${attempt + 1})`);
          await this.sleep(delay);
          return this.makeRequest(endpoint, method, body, idempotencyKey, attempt + 1);
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Klaviyo API error ${response.status}:`, errorText);
        throw new Error(`Klaviyo API error: ${response.status} ${errorText}`);
      }

      return response.json();

    } catch (error) {
      if (attempt < maxRetries && this.isRetryableError(error)) {
        const delay = this.calculateBackoffDelay(attempt);
        console.log(`Klaviyo network error - retrying in ${delay}ms (attempt ${attempt + 1}):`, error.message);
        await this.sleep(delay);
        return this.makeRequest(endpoint, method, body, idempotencyKey, attempt + 1);
      }
      
      console.error('Klaviyo API request failed:', error.message);
      throw error;
    }
  }

  /**
   * Create stable hash for idempotency key
   */
  private createIdempotencyHash(key: string): string {
    return createHash('sha256').update(key).digest('hex').substring(0, 32);
  }

  /**
   * Remove sensitive data from properties before logging
   */
  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized = { ...properties };
    
    // Remove sensitive fields that shouldn't be logged
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'credit_card',
      'payment_method_id', 'stripe_payment_method'
    ];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    return error.code === 'ECONNRESET' ||
           error.code === 'ENOTFOUND' ||
           error.code === 'ECONNREFUSED' ||
           error.code === 'ETIMEDOUT';
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const klaviyoClient = new KlaviyoClient();