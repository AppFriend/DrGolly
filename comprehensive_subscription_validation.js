#!/usr/bin/env node

/**
 * COMPREHENSIVE SUBSCRIPTION SYSTEM VALIDATION
 * Detailed analysis of subscription system with comprehensive logging
 */

const baseUrl = 'http://localhost:5000';

async function comprehensiveSubscriptionValidation() {
  console.log('🔍 COMPREHENSIVE SUBSCRIPTION SYSTEM VALIDATION\n');
  
  // Test 1: Basic subscription without coupon (should work)
  console.log('1️⃣ Testing basic Gold Monthly subscription (no coupon)...');
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'gold-monthly',
        customerDetails: {
          email: 'basic.test@example.com',
          firstName: 'Basic',
          lastName: 'Test'
        },
        couponCode: null
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.clientSecret) {
      console.log('✅ Basic subscription SUCCESS');
    } else {
      console.log('❌ Basic subscription FAILED');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 2: Subscription with valid coupon (problematic case)
  console.log('2️⃣ Testing subscription with 99% off coupon...');
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'gold-monthly',
        customerDetails: {
          email: 'coupon.detailed.test@example.com',
          firstName: 'Coupon',
          lastName: 'Test'
        },
        couponCode: 'ibuO5MIw'
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok && (data.clientSecret || data.requiresPayment === false)) {
      console.log('✅ Coupon subscription SUCCESS');
    } else {
      console.log('❌ Coupon subscription FAILED');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 3: Validate coupon first to understand the issue
  console.log('3️⃣ Testing coupon validation directly...');
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        couponCode: 'ibuO5MIw',
        productId: 'gold-monthly'
      })
    });
    
    const data = await response.json();
    console.log('Coupon validation response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.valid) {
      console.log('✅ Coupon validation SUCCESS');
      console.log(`   Original: $${data.originalAmount}`);
      console.log(`   Discount: $${data.discountAmount}`);
      console.log(`   Final: $${data.finalAmount}`);
    } else {
      console.log('❌ Coupon validation FAILED');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n🏁 Comprehensive validation complete');
}

comprehensiveSubscriptionValidation().catch(console.error);