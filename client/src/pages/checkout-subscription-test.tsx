import React from 'react';
import StandaloneCheckout from '@/components/checkout/StandaloneCheckout';

// Test subscription product
const subscriptionProduct = {
  id: 'gold-monthly',
  name: 'Gold Plan - Monthly',
  description: 'Unlimited Courses + Free Dr Golly Book',
  price: 199,
  currency: 'AUD',
  stripeProductId: 'prod_gold_plan',
  type: 'subscription',
  planTier: 'gold',
  billingPeriod: 'monthly'
};

export default function CheckoutSubscriptionTest() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Subscription Checkout Test
          </h1>
          <p className="text-lg text-gray-600">
            Testing Gold Monthly subscription with checkout-new system
          </p>
        </div>
        
        <StandaloneCheckout product={subscriptionProduct} />
      </div>
    </div>
  );
}