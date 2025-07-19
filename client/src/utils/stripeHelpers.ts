import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

export const stripeElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#ef4444',
    },
    complete: {
      color: '#059669',
    },
  },
};

export const createPaymentRequest = (stripe: any, amount: number, currency: string) => {
  return stripe.paymentRequest({
    country: currency === 'EUR' ? 'DE' : currency === 'USD' ? 'US' : 'AU',
    currency: currency.toLowerCase(),
    total: {
      label: 'Big Baby Sleep Program',
      amount,
    },
    requestPayerName: true,
    requestPayerEmail: true,
    requestPayerPhone: true,
  });
};