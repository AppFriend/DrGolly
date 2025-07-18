#!/usr/bin/env node

/**
 * Final Payment System Validation
 * 
 * Tests all three critical aspects:
 * 1. Discount application ($1.20 charged instead of $120)
 * 2. Currency detection (AUD for Australian IP)
 * 3. Transaction description (Big Baby Sleep Program)
 */

const BASE_URL = 'http://localhost:5000';
const AUSTRALIAN_IP = '203.30.42.100';

async function createAndVerifyPaymentIntent() {
  console.log('🎯 Final Payment System Validation');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Create payment intent with 99% discount
    const paymentResponse = await fetch(`${BASE_URL}/api/create-big-baby-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': AUSTRALIAN_IP
      },
      body: JSON.stringify({
        customerDetails: {
          firstName: 'Final',
          lastName: 'Validation',
          email: 'final.validation@example.com',
          phone: '1234567890',
          address: {
            line1: '123 Validation St',
            city: 'Sydney',
            postalCode: '2000',
            country: 'AU'
          }
        },
        couponId: 'ibuO5MIw', // 99% discount
        courseId: 6
      })
    });
    
    if (!paymentResponse.ok) {
      throw new Error(`Payment creation failed: ${paymentResponse.status}`);
    }
    
    const paymentData = await paymentResponse.json();
    console.log('✅ Payment intent created successfully');
    console.log('Payment Intent ID:', paymentData.paymentIntentId);
    
    // Step 2: Verify with Stripe directly
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentData.paymentIntentId);
    
    console.log('\\n🔍 Verification Results:');
    console.log('=' .repeat(50));
    
    // Test 1: Amount verification
    const expectedAmount = 120; // cents = $1.20
    const amountCorrect = paymentIntent.amount === expectedAmount;
    console.log(`Amount: ${paymentIntent.amount} cents ($${paymentIntent.amount / 100}) - ${amountCorrect ? 'PASS' : 'FAIL'}`);
    
    // Test 2: Currency verification
    const expectedCurrency = 'aud';
    const currencyCorrect = paymentIntent.currency === expectedCurrency;
    console.log(`Currency: ${paymentIntent.currency.toUpperCase()} - ${currencyCorrect ? 'PASS' : 'FAIL'}`);
    
    // Test 3: Description verification
    const expectedDescription = 'Big Baby Sleep Program';
    const descriptionCorrect = paymentIntent.description === expectedDescription;
    console.log(`Description: "${paymentIntent.description}" - ${descriptionCorrect ? 'PASS' : 'FAIL'}`);
    
    // Overall result
    const allTestsPassed = amountCorrect && currencyCorrect && descriptionCorrect;
    
    console.log('\\n📊 Final Results:');
    console.log('=' .repeat(50));
    
    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('✅ Customer will be charged: $1.20 AUD (99% discount applied)');
      console.log('✅ Transaction will appear as: "Big Baby Sleep Program"');
      console.log('✅ Currency correctly detected: AUD for Australian IP');
      console.log('\\n🚀 Payment system is ready for production');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('Please review the failed tests above');
    }
    
    // Additional verification details
    console.log('\\n📋 Transaction Details:');
    console.log('- Payment Intent ID:', paymentIntent.id);
    console.log('- Status:', paymentIntent.status);
    console.log('- Created:', new Date(paymentIntent.created * 1000).toLocaleString());
    console.log('- Customer Email:', paymentIntent.metadata.customerEmail);
    console.log('- Original Amount:', paymentIntent.metadata.originalAmount);
    console.log('- Discount Amount:', paymentIntent.metadata.discountAmount);
    console.log('- Final Amount:', paymentIntent.metadata.finalAmount);
    
    return allTestsPassed;
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
}

// Run the validation
createAndVerifyPaymentIntent().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);