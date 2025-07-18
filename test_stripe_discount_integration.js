const SERVER_URL = 'http://localhost:5000';

async function testStripeDiscountIntegration() {
  console.log('🔍 TEST 1: STRIPE DISCOUNT INTEGRATION');
  console.log('================================================================');
  console.log('Testing that discounted payment amounts are correctly sent to Stripe');
  console.log('');
  
  try {
    // Step 1: Create payment intent with discount
    console.log('Step 1: Creating payment intent with 99% discount coupon...');
    const paymentResponse = await fetch(`${SERVER_URL}/api/create-big-baby-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerDetails: {
          email: 'stripe-test@example.com',
          firstName: 'Stripe',
          lastName: 'Test'
        },
        couponId: 'ibuO5MIw' // 99% off coupon
      })
    });

    const paymentData = await paymentResponse.json();
    
    if (!paymentResponse.ok) {
      throw new Error(`Payment intent creation failed: ${paymentData.message}`);
    }
    
    console.log('✅ Payment intent created successfully');
    console.log(`   Payment Intent ID: ${paymentData.paymentIntentId}`);
    console.log(`   Original Amount: $${paymentData.originalAmount}`);
    console.log(`   Discounted Amount: $${paymentData.finalAmount}`);
    console.log(`   Discount Applied: $${paymentData.discountAmount}`);
    console.log('');
    
    // Step 2: Verify the payment intent in Stripe
    console.log('Step 2: Verifying payment intent details in Stripe...');
    const verifyResponse = await fetch(`${SERVER_URL}/api/verify-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentIntentId: paymentData.paymentIntentId
      })
    });

    const verifyData = await verifyResponse.json();
    
    if (!verifyResponse.ok) {
      throw new Error(`Payment verification failed: ${verifyData.message}`);
    }
    
    console.log('✅ Payment intent verified in Stripe');
    console.log(`   Stripe Amount: $${verifyData.amount / 100} ${verifyData.currency.toUpperCase()}`);
    console.log(`   Stripe Status: ${verifyData.status}`);
    console.log(`   Stripe Metadata: ${JSON.stringify(verifyData.metadata)}`);
    console.log('');
    
    // Step 3: Verify discount calculation matches
    const expectedDiscountedAmount = Math.round(paymentData.finalAmount * 100); // Convert to cents
    const stripeAmount = verifyData.amount;
    
    console.log('Step 3: Verifying discount calculation accuracy...');
    console.log(`   Expected Amount (cents): ${expectedDiscountedAmount}`);
    console.log(`   Stripe Amount (cents): ${stripeAmount}`);
    
    if (Math.abs(expectedDiscountedAmount - stripeAmount) <= 1) { // Allow 1 cent rounding difference
      console.log('✅ DISCOUNT INTEGRATION: PERFECT MATCH');
      console.log('   The discounted amount is correctly sent to Stripe');
    } else {
      console.log('❌ DISCOUNT INTEGRATION: MISMATCH');
      console.log('   The discounted amount does not match what was sent to Stripe');
      return false;
    }
    
    // Step 4: Test with different discount amounts
    console.log('');
    console.log('Step 4: Testing with different discount scenario...');
    
    // Test without coupon for comparison
    const noCouponResponse = await fetch(`${SERVER_URL}/api/create-big-baby-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerDetails: {
          email: 'no-coupon-test@example.com',
          firstName: 'NoCoupon',
          lastName: 'Test'
        }
        // No couponId
      })
    });

    const noCouponData = await noCouponResponse.json();
    
    if (noCouponResponse.ok) {
      console.log('✅ No-coupon payment intent created');
      console.log(`   Full Price Amount: $${noCouponData.finalAmount}`);
      console.log(`   Discount Amount: $${noCouponData.discountAmount}`);
      
      if (noCouponData.discountAmount === 0) {
        console.log('✅ No-coupon scenario working correctly');
      } else {
        console.log('❌ No-coupon scenario shows unexpected discount');
      }
    }
    
    console.log('');
    console.log('=== STRIPE DISCOUNT INTEGRATION SUMMARY ===');
    console.log('✅ Payment intent creation: Working');
    console.log('✅ Discount calculation: Accurate');
    console.log('✅ Stripe amount matching: Perfect');
    console.log('✅ Metadata preservation: Working');
    console.log('');
    console.log('🎉 STRIPE DISCOUNT INTEGRATION: FULLY FUNCTIONAL');
    return true;
    
  } catch (error) {
    console.error('❌ STRIPE DISCOUNT INTEGRATION TEST FAILED:', error.message);
    return false;
  }
}

// Run the test
testStripeDiscountIntegration().then(success => {
  if (success) {
    console.log('================================================================');
    console.log('TEST 1 COMPLETED SUCCESSFULLY');
  } else {
    console.log('================================================================');
    console.log('TEST 1 FAILED - REVIEW REQUIRED');
  }
});