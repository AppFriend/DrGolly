#!/usr/bin/env node

/**
 * Final Comprehensive Test Suite
 * 
 * Tests both critical issues reported by user:
 * 1. Payment should be charged $1.20 (not $120) with 99% coupon
 * 2. Payment should be in AUD (not USD) for Australian IP
 */

const BASE_URL = 'http://localhost:5000';
const AUSTRALIAN_IP = '203.30.42.100';

async function testRegionalPricing() {
  console.log('🌍 Testing Regional Pricing (Australian IP)...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/regional-pricing`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Forwarded-For': AUSTRALIAN_IP
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Regional pricing response:', data);
    
    // Verify Australian IP returns AUD
    if (data.currency === 'AUD' && data.region === 'AU') {
      console.log('✅ PASS: Australian IP correctly returns AUD currency');
    } else {
      console.log('❌ FAIL: Expected AUD currency for Australian IP, got:', data.currency);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Regional pricing test failed:', error.message);
    return false;
  }
}

async function testPaymentIntentWithDiscount() {
  console.log('\n💳 Testing Payment Intent Creation (99% Discount)...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/create-big-baby-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': AUSTRALIAN_IP
      },
      body: JSON.stringify({
        customerDetails: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '1234567890',
          address: {
            line1: '123 Test St',
            city: 'Sydney',
            postalCode: '2000',
            country: 'AU'
          }
        },
        couponId: 'ibuO5MIw', // 99% discount coupon
        courseId: 6
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Payment intent response:', data);
    
    // Test 1: Verify AUD currency
    if (data.currency === 'AUD') {
      console.log('✅ PASS: Payment intent uses AUD currency');
    } else {
      console.log('❌ FAIL: Expected AUD currency, got:', data.currency);
      return false;
    }
    
    // Test 2: Verify 99% discount is applied correctly
    const expectedDiscountedAmount = 1.20; // $120 with 99% discount = $1.20
    const actualAmount = data.finalAmount;
    
    if (Math.abs(actualAmount - expectedDiscountedAmount) < 0.01) {
      console.log('✅ PASS: 99% discount correctly applied - charging $1.20');
    } else {
      console.log('❌ FAIL: Expected $1.20 after 99% discount, got:', actualAmount);
      return false;
    }
    
    // Test 3: Verify original amount is $120
    if (data.originalAmount === 120) {
      console.log('✅ PASS: Original amount is $120 AUD');
    } else {
      console.log('❌ FAIL: Expected original amount $120, got:', data.originalAmount);
      return false;
    }
    
    // Test 4: Verify discount amount calculation
    const expectedDiscountAmount = 118.8; // $120 - $1.20 = $118.80
    if (Math.abs(data.discountAmount - expectedDiscountAmount) < 0.01) {
      console.log('✅ PASS: Discount amount correctly calculated as $118.80');
    } else {
      console.log('❌ FAIL: Expected discount amount $118.80, got:', data.discountAmount);
      return false;
    }
    
    // Test 5: Verify coupon information
    if (data.couponApplied && data.couponApplied.percent_off === 99) {
      console.log('✅ PASS: 99% coupon correctly applied');
    } else {
      console.log('❌ FAIL: Expected 99% coupon, got:', data.couponApplied);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Payment intent test failed:', error.message);
    return false;
  }
}

async function runComprehensiveTests() {
  console.log('🧪 Starting Final Comprehensive Test Suite');
  console.log('=' .repeat(60));
  
  const results = {
    regionalPricing: await testRegionalPricing(),
    paymentIntent: await testPaymentIntentWithDiscount()
  };
  
  console.log('\n📊 Final Test Results:');
  console.log('=' .repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${test}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 SUCCESS: All critical issues resolved!');
    console.log('✅ Issue 1: Payment now charges $1.20 (not $120) with 99% discount');
    console.log('✅ Issue 2: Payment now uses AUD (not USD) for Australian IP');
    console.log('\n✨ System is ready for production deployment');
  } else {
    console.log('\n❌ FAILURE: Some tests failed');
    console.log('Please check the failed tests above and fix the issues');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runComprehensiveTests().catch(console.error);