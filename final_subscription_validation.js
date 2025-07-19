#!/usr/bin/env node

/**
 * FINAL SUBSCRIPTION SYSTEM VALIDATION
 * Comprehensive test suite for subscription payment functionality
 */

const baseUrl = 'http://localhost:5000';

async function finalSubscriptionValidation() {
  console.log('🏆 FINAL SUBSCRIPTION SYSTEM VALIDATION\n');
  
  let allTestsPassed = true;
  let testResults = [];
  
  // Test 1: Gold Monthly Subscription
  console.log('1️⃣ Testing Gold Monthly subscription creation...');
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'gold-monthly',
        customerDetails: {
          email: 'gold.monthly@test.com',
          firstName: 'Gold',
          lastName: 'Monthly'
        },
        couponCode: null
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.clientSecret) {
      console.log('✅ Gold Monthly subscription created successfully');
      console.log(`   Subscription ID: ${data.subscriptionId}`);
      console.log(`   Amount: $${data.amount} ${data.currency}`);
      testResults.push({ test: 'Gold Monthly Subscription', status: '✅ PASS' });
    } else {
      console.log('❌ Gold Monthly subscription failed');
      testResults.push({ test: 'Gold Monthly Subscription', status: '❌ FAIL' });
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    testResults.push({ test: 'Gold Monthly Subscription', status: '❌ ERROR' });
    allTestsPassed = false;
  }
  
  // Test 2: Gold Yearly Subscription
  console.log('\n2️⃣ Testing Gold Yearly subscription creation...');
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'gold-yearly',
        customerDetails: {
          email: 'gold.yearly@test.com',
          firstName: 'Gold',
          lastName: 'Yearly'
        },
        couponCode: null
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.clientSecret && data.amount === 159) {
      console.log('✅ Gold Yearly subscription created successfully');
      console.log(`   Subscription ID: ${data.subscriptionId}`);
      console.log(`   Amount: $${data.amount} ${data.currency} (Yearly discount applied)`);
      testResults.push({ test: 'Gold Yearly Subscription', status: '✅ PASS' });
    } else {
      console.log('❌ Gold Yearly subscription failed');
      testResults.push({ test: 'Gold Yearly Subscription', status: '❌ FAIL' });
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    testResults.push({ test: 'Gold Yearly Subscription', status: '❌ ERROR' });
    allTestsPassed = false;
  }
  
  // Test 3: Platinum Monthly Subscription
  console.log('\n3️⃣ Testing Platinum Monthly subscription creation...');
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'platinum-monthly',
        customerDetails: {
          email: 'platinum.monthly@test.com',
          firstName: 'Platinum',
          lastName: 'Monthly'
        },
        couponCode: null
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.clientSecret && data.amount === 499) {
      console.log('✅ Platinum Monthly subscription created successfully');
      console.log(`   Subscription ID: ${data.subscriptionId}`);
      console.log(`   Amount: $${data.amount} ${data.currency}`);
      testResults.push({ test: 'Platinum Monthly Subscription', status: '✅ PASS' });
    } else {
      console.log('❌ Platinum Monthly subscription failed');
      testResults.push({ test: 'Platinum Monthly Subscription', status: '❌ FAIL' });
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    testResults.push({ test: 'Platinum Monthly Subscription', status: '❌ ERROR' });
    allTestsPassed = false;
  }
  
  // Test 4: Subscription with Coupon
  console.log('\n4️⃣ Testing subscription with coupon code...');
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'gold-monthly',
        customerDetails: {
          email: 'gold.coupon@test.com',
          firstName: 'Gold',
          lastName: 'Coupon'
        },
        couponCode: 'ibuO5MIw' // 99% off test coupon
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.clientSecret && data.amount < 199) {
      console.log('✅ Subscription with coupon created successfully');
      console.log(`   Subscription ID: ${data.subscriptionId}`);
      console.log(`   Discounted Amount: $${data.amount} ${data.currency}`);
      testResults.push({ test: 'Subscription with Coupon', status: '✅ PASS' });
    } else {
      console.log('❌ Subscription with coupon failed');
      testResults.push({ test: 'Subscription with Coupon', status: '❌ FAIL' });
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    testResults.push({ test: 'Subscription with Coupon', status: '❌ ERROR' });
    allTestsPassed = false;
  }
  
  // Test 5: Product Type Validation
  console.log('\n5️⃣ Testing product type validation...');
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'gold-monthly', // Subscription product should be rejected for payment intent
        customerDetails: {
          email: 'test@example.com',
          firstName: 'Test'
        }
      })
    });
    
    const data = await response.json();
    
    if (response.status === 400 && data.message.includes('subscription endpoint')) {
      console.log('✅ Product type validation working correctly');
      testResults.push({ test: 'Product Type Validation', status: '✅ PASS' });
    } else {
      console.log('❌ Product type validation failed');
      testResults.push({ test: 'Product Type Validation', status: '❌ FAIL' });
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    testResults.push({ test: 'Product Type Validation', status: '❌ ERROR' });
    allTestsPassed = false;
  }
  
  // Summary Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL SUBSCRIPTION VALIDATION RESULTS');
  console.log('='.repeat(60));
  
  testResults.forEach(result => {
    console.log(`${result.test.padEnd(35)} ${result.status}`);
  });
  
  console.log('='.repeat(60));
  console.log(`Overall Status: ${allTestsPassed ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log(`Success Rate: ${testResults.filter(r => r.status.includes('✅')).length}/${testResults.length} tests passed`);
  
  if (allTestsPassed) {
    console.log('\n🚀 SUBSCRIPTION SYSTEM FULLY OPERATIONAL!');
    console.log('✅ Ready for production deployment');
  } else {
    console.log('\n⚠️  Some issues need to be resolved before deployment');
  }
  
  return { allTestsPassed, testResults };
}

finalSubscriptionValidation().catch(console.error);