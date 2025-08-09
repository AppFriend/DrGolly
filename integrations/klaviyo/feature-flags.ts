/**
 * Feature flags for Klaviyo integration
 * These control which events are sent to Klaviyo
 */
export interface KlaviyoFeatureFlags {
  events: {
    purchase: boolean;
    subscription_started: boolean;
    cart_abandoned_10m: boolean;
  };
}

/**
 * Get current Klaviyo feature flags from environment
 */
export function getKlaviyoFlags(): KlaviyoFeatureFlags {
  return {
    events: {
      purchase: process.env.KLAVIYO_PURCHASE_EVENTS_ENABLED === 'true',
      subscription_started: process.env.KLAVIYO_SUBSCRIPTION_EVENTS_ENABLED === 'true',
      cart_abandoned_10m: process.env.KLAVIYO_CART_ABANDONED_ENABLED === 'true'
    }
  };
}

/**
 * Check if specific Klaviyo event is enabled
 */
export function isKlaviyoEventEnabled(eventType: keyof KlaviyoFeatureFlags['events']): boolean {
  const flags = getKlaviyoFlags();
  return flags.events[eventType];
}