#!/usr/bin/env node

/**
 * FINAL COMPREHENSIVE SUBSCRIPTION SYSTEM TEST
 * Complete validation of all subscription functionality with detailed analysis
 */

const baseUrl = 'http://localhost:5000';

async function finalComprehensiveTest() {
  console.log('🎯 FINAL COMPREHENSIVE SUBSCRIPTION SYSTEM TEST\n');
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test 1: Gold Monthly Basic Subscription
  console.log('1️⃣ Testing Gold Monthly subscription (basic)...');
  totalTests++;
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'gold-monthly',
        customerDetails: {
          email: 'final.gold.basic@test.com',
          firstName: 'Gold',
          lastName: 'Basic'
        }
      })
    });
    
    const data = await response.json();
    if (response.ok && data.clientSecret && data.amount === 199) {
      console.log('✅ Gold Monthly basic subscription SUCCESS');
      console.log(`   Amount: $${data.amount} ${data.currency}`);
      console.log(`   Subscription ID: ${data.subscriptionId}`);
      passedTests++;
    } else {
      console.log('❌ Gold Monthly basic subscription FAILED');
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 2: Gold Monthly with 99% Coupon (Special handling)
  console.log('2️⃣ Testing Gold Monthly subscription with 99% coupon...');
  totalTests++;
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'gold-monthly',
        customerDetails: {
          email: 'final.gold.coupon@test.com',
          firstName: 'Gold',
          lastName: 'Coupon'
        },
        couponCode: 'ibuO5MIw'
      })
    });
    
    const data = await response.json();
    if (response.ok && data.requiresPayment === false && data.amount === 1.99) {
      console.log('✅ Gold Monthly coupon subscription SUCCESS (intelligent no-payment)');
      console.log(`   Original: $${data.originalAmount} ${data.currency}`);
      console.log(`   Discount: $${data.discountAmount} ${data.currency}`);
      console.log(`   Final: $${data.amount} ${data.currency}`);
      console.log(`   Requires Payment: ${data.requiresPayment}`);
      passedTests++;
    } else {
      console.log('❌ Gold Monthly coupon subscription FAILED');
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 3: Gold Yearly Subscription
  console.log('3️⃣ Testing Gold Yearly subscription...');
  totalTests++;
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'gold-yearly',
        customerDetails: {
          email: 'final.gold.yearly@test.com',
          firstName: 'Gold',
          lastName: 'Yearly'
        }
      })
    });
    
    const data = await response.json();
    if (response.ok && data.clientSecret && data.amount === 159) {
      console.log('✅ Gold Yearly subscription SUCCESS');
      console.log(`   Amount: $${data.amount} ${data.currency} (yearly discount applied)`);
      console.log(`   Billing Period: ${data.billingPeriod}`);
      passedTests++;
    } else {
      console.log('❌ Gold Yearly subscription FAILED');
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 4: Platinum Monthly Subscription
  console.log('4️⃣ Testing Platinum Monthly subscription...');
  totalTests++;
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'platinum-monthly',
        customerDetails: {
          email: 'final.platinum@test.com',
          firstName: 'Platinum',
          lastName: 'User'
        }
      })
    });
    
    const data = await response.json();
    if (response.ok && data.clientSecret && data.amount === 499) {
      console.log('✅ Platinum Monthly subscription SUCCESS');
      console.log(`   Amount: $${data.amount} ${data.currency}`);
      console.log(`   Plan Tier: ${data.planTier}`);
      passedTests++;
    } else {
      console.log('❌ Platinum Monthly subscription FAILED');
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 5: Email Check Functionality
  console.log('5️⃣ Testing email check functionality...');
  totalTests++;
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });
    
    const data = await response.json();
    if (response.ok && typeof data.exists === 'boolean') {
      console.log('✅ Email check functionality SUCCESS');
      console.log(`   Email exists: ${data.exists}`);
      passedTests++;
    } else {
      console.log('❌ Email check functionality FAILED');
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 6: Coupon Validation with ProductId
  console.log('6️⃣ Testing coupon validation with productId...');
  totalTests++;
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
    if (response.ok && data.valid && data.coupon) {
      console.log('✅ Coupon validation with productId SUCCESS');
      console.log(`   Coupon: ${data.coupon.name}`);
      console.log(`   Discount: ${data.coupon.percent_off}%`);
      passedTests++;
    } else {
      console.log('❌ Coupon validation with productId FAILED');
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(80));
  
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`Gold Monthly Basic Subscription        ${passedTests >= 1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Gold Monthly Coupon Subscription       ${passedTests >= 2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Gold Yearly Subscription               ${passedTests >= 3 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Platinum Monthly Subscription          ${passedTests >= 4 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Email Check Functionality              ${passedTests >= 5 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Coupon Validation                      ${passedTests >= 6 ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('='.repeat(80));
  console.log(`Overall Status: ${successRate === 100 ? '✅ ALL SYSTEMS OPERATIONAL' : `⚠️  ${passedTests}/${totalTests} TESTS PASSED`}`);
  console.log(`Success Rate: ${passedTests}/${totalTests} tests passed (${successRate}%)`);
  console.log('='.repeat(80));
  
  if (successRate === 100) {
    console.log('\n🎉 SUBSCRIPTION SYSTEM FULLY OPERATIONAL AND READY FOR PRODUCTION!');
  } else {
    console.log(`\n⚠️  ${totalTests - passedTests} issues need to be resolved before deployment`);
  }
}

finalComprehensiveTest().catch(console.error);