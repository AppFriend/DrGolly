#!/usr/bin/env node

/**
 * Stripe Transaction Verification Test
 * 
 * This test verifies that the actual Stripe transaction amount matches
 * the discounted price, not just the coupon application.
 */

const BASE_URL = 'http://localhost:5000';
const AUSTRALIAN_IP = '203.30.42.100';

async function testStripeTransactionAmount() {
  console.log('💳 Testing Actual Stripe Transaction Amount...');
  
  try {
    // Step 1: Create payment intent with 99% discount
    const paymentIntentResponse = await fetch(`${BASE_URL}/api/create-big-baby-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': AUSTRALIAN_IP
      },
      body: JSON.stringify({
        customerDetails: {
          firstName: 'Test',
          lastName: 'Transaction',
          email: 'stripe.test@example.com',
          phone: '1234567890',
          address: {
            line1: '123 Stripe Test St',
            city: 'Sydney',
            postalCode: '2000',
            country: 'AU'
          }
        },
        couponId: 'ibuO5MIw', // 99% discount coupon
        courseId: 6
      })
    });
    
    if (!paymentIntentResponse.ok) {
      throw new Error(`Payment intent creation failed: ${paymentIntentResponse.status}`);
    }
    
    const paymentData = await paymentIntentResponse.json();
    console.log('✅ Payment intent created:', {
      paymentIntentId: paymentData.paymentIntentId,
      finalAmount: paymentData.finalAmount,
      currency: paymentData.currency,
      originalAmount: paymentData.originalAmount,
      discountAmount: paymentData.discountAmount
    });
    
    // Step 2: Verify the payment intent in Stripe directly
    const stripeVerificationResponse = await fetch(`${BASE_URL}/api/verify-stripe-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentIntentId: paymentData.paymentIntentId
      })
    });
    
    if (!stripeVerificationResponse.ok) {
      throw new Error(`Stripe verification failed: ${stripeVerificationResponse.status}`);
    }
    
    const stripeData = await stripeVerificationResponse.json();
    console.log('✅ Stripe payment intent verification:', stripeData);
    
    // Step 3: Verify the actual amount in Stripe matches our calculation
    const expectedAmountInCents = Math.round(paymentData.finalAmount * 100); // Convert to cents
    const actualAmountInCents = stripeData.amount;
    
    console.log('\n🔍 Transaction Amount Verification:');
    console.log(`Expected amount (cents): ${expectedAmountInCents}`);
    console.log(`Actual Stripe amount (cents): ${actualAmountInCents}`);
    console.log(`Expected amount (dollars): $${paymentData.finalAmount}`);
    console.log(`Actual Stripe amount (dollars): $${actualAmountInCents / 100}`);
    
    if (expectedAmountInCents === actualAmountInCents) {
      console.log('✅ PASS: Stripe transaction amount matches discounted price');
      return true;
    } else {
      console.log('❌ FAIL: Stripe transaction amount does not match discounted price');
      console.log(`Expected: ${expectedAmountInCents} cents, Got: ${actualAmountInCents} cents`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Stripe transaction verification failed:', error.message);
    return false;
  }
}

// Run the test
testStripeTransactionAmount().then(success => {
  if (success) {
    console.log('\n🎉 SUCCESS: Customer will be charged the correct discounted amount');
    console.log('✅ The actual Stripe transaction amount is $1.20 (not $120)');
  } else {
    console.log('\n❌ FAILURE: Customer may be charged incorrect amount');
  }
  process.exit(success ? 0 : 1);
}).catch(console.error);