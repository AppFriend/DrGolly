declare global {
  interface Window {
    fbq: any;
  }
}

export const FacebookPixel = {
  // Track page views
  trackPageView: () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }
  },

  // Track when user starts registration
  trackInitiateRegistration: () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout');
    }
  },

  // Track successful registration
  trackCompleteRegistration: () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'CompleteRegistration');
    }
  },

  // Track course purchases
  trackPurchase: (courseId: number, courseTitle: string, amount: number, currency: string = 'USD') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        value: amount,
        currency: currency,
        content_ids: [courseId.toString()],
        content_name: courseTitle,
        content_type: 'product'
      });
    }
  },

  // Track when user starts course purchase
  trackInitiatePurchase: (courseId: number, courseTitle: string, amount: number, currency: string = 'USD') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        value: amount,
        currency: currency,
        content_ids: [courseId.toString()],
        content_name: courseTitle,
        content_type: 'product'
      });
    }
  },

  // Track subscription upgrades
  trackSubscribe: (tier: string, amount: number, currency: string = 'USD') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Subscribe', {
        value: amount,
        currency: currency,
        predicted_ltv: tier === 'gold' ? 2388 : 5988, // Annual value
        content_name: `${tier} Subscription`
      });
    }
  },

  // Track when user adds payment method
  trackAddPaymentInfo: () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddPaymentInfo');
    }
  },

  // Track content views (course access)
  trackViewContent: (courseId: number, courseTitle: string) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: [courseId.toString()],
        content_name: courseTitle,
        content_type: 'product'
      });
    }
  },

  // Track leads (email signups, consultation bookings)
  trackLead: (leadType: string = 'email_signup') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead', {
        content_name: leadType
      });
    }
  },

  // Track custom events
  trackCustomEvent: (eventName: string, parameters?: any) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', eventName, parameters);
    }
  }
};