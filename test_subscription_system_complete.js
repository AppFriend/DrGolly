#!/usr/bin/env node

/**
 * COMPREHENSIVE SUBSCRIPTION SYSTEM VALIDATION TEST
 * 
 * This script validates all 4 key subscription payment handling points:
 * 1. Subscription product type detection
 * 2. Subscription payment intent creation
 * 3. Subscription checkout flow integration
 * 4. Subscription vs one-time payment routing logic
 */

const baseUrl = 'https://7db1b48c-f2e5-4c42-9b16-e5d26ad65987-00-3aohq89g3pvr4.teams.replit.dev';

// Test subscription products
const subscriptionProducts = [
  {
    id: 'gold-monthly',
    expectedType: 'subscription',
    expectedTier: 'gold',
    expectedBilling: 'monthly',
    expectedPrice: 199
  },
  {
    id: 'gold-yearly', 
    expectedType: 'subscription',
    expectedTier: 'gold',
    expectedBilling: 'yearly',
    expectedPrice: 159
  },
  {
    id: 'platinum-monthly',
    expectedType: 'subscription',
    expectedTier: 'platinum',
    expectedBilling: 'monthly',
    expectedPrice: 499
  }
];

// Test one-time products for comparison
const oneTimeProducts = [
  {
    id: '1',
    expectedType: 'one-off',
    expectedPrice: 120
  },
  {
    id: '2',
    expectedType: 'one-off', 
    expectedPrice: 120
  }
];

const testResults = {
  productDetection: { passed: 0, failed: 0, details: [] },
  subscriptionCreation: { passed: 0, failed: 0, details: [] },
  routingLogic: { passed: 0, failed: 0, details: [] },
  integration: { passed: 0, failed: 0, details: [] }
};

console.log('🧪 COMPREHENSIVE SUBSCRIPTION SYSTEM VALIDATION');
console.log('===============================================\n');

async function testProductDetection() {
  console.log('1️⃣ TESTING SUBSCRIPTION PRODUCT TYPE DETECTION...');
  
  for (const product of subscriptionProducts) {
    try {
      console.log(`   Testing ${product.id}...`);
      
      const response = await fetch(`${baseUrl}/api/checkout-new/products/${product.id}`);
      const data = await response.json();
      
      if (response.ok && 
          data.type === product.expectedType &&
          data.planTier === product.expectedTier &&
          data.billingPeriod === product.expectedBilling &&
          data.price === product.expectedPrice) {
        
        console.log(`   ✅ ${product.id}: Correct subscription product detection`);
        testResults.productDetection.passed++;
        testResults.productDetection.details.push({
          test: `${product.id} product detection`,
          status: 'PASS',
          expected: product,
          actual: data
        });
      } else {
        console.log(`   ❌ ${product.id}: Incorrect product data`);
        console.log(`      Expected: type=${product.expectedType}, tier=${product.expectedTier}`);
        console.log(`      Actual: type=${data.type}, tier=${data.planTier}`);
        testResults.productDetection.failed++;
        testResults.productDetection.details.push({
          test: `${product.id} product detection`,
          status: 'FAIL',
          expected: product,
          actual: data,
          error: 'Product data mismatch'
        });
      }
    } catch (error) {
      console.log(`   ❌ ${product.id}: Error - ${error.message}`);
      testResults.productDetection.failed++;
      testResults.productDetection.details.push({
        test: `${product.id} product detection`,
        status: 'FAIL',
        error: error.message
      });
    }
  }
  
  console.log(`   📊 Product Detection: ${testResults.productDetection.passed}/${subscriptionProducts.length} passed\n`);
}

async function testSubscriptionCreation() {
  console.log('2️⃣ TESTING SUBSCRIPTION PAYMENT INTENT CREATION...');
  
  const testCustomer = {
    email: 'test.subscription@example.com',
    firstName: 'Test',
    lastName: 'Subscriber'
  };
  
  for (const product of subscriptionProducts.slice(0, 2)) { // Test first 2 to avoid rate limits
    try {
      console.log(`   Creating subscription for ${product.id}...`);
      
      const response = await fetch(`${baseUrl}/api/checkout-new/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          customerDetails: testCustomer,
          couponCode: null
        })
      });
      
      const data = await response.json();
      
      if (response.ok && 
          data.clientSecret &&
          data.subscriptionId &&
          data.productType === 'subscription' &&
          data.planTier === product.expectedTier &&
          data.billingPeriod === product.expectedBilling) {
        
        console.log(`   ✅ ${product.id}: Subscription created successfully`);
        console.log(`      Subscription ID: ${data.subscriptionId}`);
        console.log(`      Plan: ${data.planTier} ${data.billingPeriod}`);
        console.log(`      Amount: $${data.amount} ${data.currency}`);
        
        testResults.subscriptionCreation.passed++;
        testResults.subscriptionCreation.details.push({
          test: `${product.id} subscription creation`,
          status: 'PASS',
          subscriptionId: data.subscriptionId,
          amount: data.amount,
          currency: data.currency
        });
      } else {
        console.log(`   ❌ ${product.id}: Subscription creation failed`);
        console.log(`      Response: ${JSON.stringify(data, null, 2)}`);
        testResults.subscriptionCreation.failed++;
        testResults.subscriptionCreation.details.push({
          test: `${product.id} subscription creation`,
          status: 'FAIL',
          response: data,
          error: 'Subscription creation failed'
        });
      }
    } catch (error) {
      console.log(`   ❌ ${product.id}: Error - ${error.message}`);
      testResults.subscriptionCreation.failed++;
      testResults.subscriptionCreation.details.push({
        test: `${product.id} subscription creation`,
        status: 'FAIL',
        error: error.message
      });
    }
  }
  
  console.log(`   📊 Subscription Creation: ${testResults.subscriptionCreation.passed}/${Math.min(subscriptionProducts.length, 2)} passed\n`);
}

async function testRoutingLogic() {
  console.log('3️⃣ TESTING SUBSCRIPTION VS ONE-TIME PAYMENT ROUTING...');
  
  const testCustomer = {
    email: 'test.routing@example.com',
    firstName: 'Test',
    lastName: 'Router'
  };
  
  // Test subscription products should route to subscription endpoint
  console.log('   Testing subscription product routing...');
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'gold-monthly',
        customerDetails: testCustomer
      })
    });
    
    const data = await response.json();
    
    if (response.status === 400 && data.message.includes('subscription endpoint')) {
      console.log('   ✅ Subscription products correctly redirect to subscription endpoint');
      testResults.routingLogic.passed++;
      testResults.routingLogic.details.push({
        test: 'Subscription product routing',
        status: 'PASS',
        message: 'Correctly redirected to subscription endpoint'
      });
    } else {
      console.log('   ❌ Subscription products should redirect to subscription endpoint');
      testResults.routingLogic.failed++;
      testResults.routingLogic.details.push({
        test: 'Subscription product routing',
        status: 'FAIL',
        response: data
      });
    }
  } catch (error) {
    console.log(`   ❌ Subscription routing test error: ${error.message}`);
    testResults.routingLogic.failed++;
  }
  
  // Test one-time products should work with payment intent endpoint
  console.log('   Testing one-time product routing...');
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: '1', // Big Baby Sleep Program
        customerDetails: testCustomer
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.clientSecret) {
      console.log('   ✅ One-time products work correctly with payment intent endpoint');
      testResults.routingLogic.passed++;
      testResults.routingLogic.details.push({
        test: 'One-time product routing',
        status: 'PASS',
        message: 'Payment intent created successfully'
      });
    } else {
      console.log('   ❌ One-time products should work with payment intent endpoint');
      testResults.routingLogic.failed++;
      testResults.routingLogic.details.push({
        test: 'One-time product routing',
        status: 'FAIL',
        response: data
      });
    }
  } catch (error) {
    console.log(`   ❌ One-time routing test error: ${error.message}`);
    testResults.routingLogic.failed++;
  }
  
  console.log(`   📊 Routing Logic: ${testResults.routingLogic.passed}/2 passed\n`);
}

async function testCheckoutIntegration() {
  console.log('4️⃣ TESTING CHECKOUT FLOW INTEGRATION...');
  
  // Test that checkout-new page loads with subscription product
  console.log('   Testing subscription checkout page access...');
  try {
    const response = await fetch(`${baseUrl}/checkout-subscription-test`);
    
    if (response.ok) {
      console.log('   ✅ Subscription checkout test page accessible');
      testResults.integration.passed++;
      testResults.integration.details.push({
        test: 'Subscription checkout page access',
        status: 'PASS'
      });
    } else {
      console.log('   ❌ Subscription checkout test page not accessible');
      testResults.integration.failed++;
      testResults.integration.details.push({
        test: 'Subscription checkout page access',
        status: 'FAIL',
        statusCode: response.status
      });
    }
  } catch (error) {
    console.log(`   ❌ Checkout integration test error: ${error.message}`);
    testResults.integration.failed++;
  }
  
  // Test email check endpoint
  console.log('   Testing email check functionality...');
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
      console.log('   ✅ Email check endpoint working correctly');
      testResults.integration.passed++;
      testResults.integration.details.push({
        test: 'Email check functionality',
        status: 'PASS',
        result: data
      });
    } else {
      console.log('   ❌ Email check endpoint not working');
      testResults.integration.failed++;
      testResults.integration.details.push({
        test: 'Email check functionality',
        status: 'FAIL',
        response: data
      });
    }
  } catch (error) {
    console.log(`   ❌ Email check test error: ${error.message}`);
    testResults.integration.failed++;
  }
  
  console.log(`   📊 Integration Tests: ${testResults.integration.passed}/2 passed\n`);
}

async function generateReport() {
  console.log('📋 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('=====================================\n');
  
  const totalTests = Object.values(testResults).reduce((sum, category) => sum + category.passed + category.failed, 0);
  const totalPassed = Object.values(testResults).reduce((sum, category) => sum + category.passed, 0);
  const totalFailed = Object.values(testResults).reduce((sum, category) => sum + category.failed, 0);
  
  console.log(`🎯 OVERALL RESULTS: ${totalPassed}/${totalTests} tests passed (${Math.round(totalPassed/totalTests*100)}% success rate)`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}\n`);
  
  // Detailed breakdown by category
  for (const [category, results] of Object.entries(testResults)) {
    const categoryTotal = results.passed + results.failed;
    const categorySuccess = categoryTotal > 0 ? Math.round(results.passed/categoryTotal*100) : 0;
    
    console.log(`📊 ${category.toUpperCase()}: ${results.passed}/${categoryTotal} passed (${categorySuccess}%)`);
    
    if (results.failed > 0) {
      console.log(`   Failed tests:`);
      results.details.filter(d => d.status === 'FAIL').forEach(detail => {
        console.log(`   - ${detail.test}: ${detail.error || 'Failed'}`);
      });
    }
    console.log('');
  }
  
  // Final status determination
  if (totalPassed === totalTests) {
    console.log('🎉 ALL SUBSCRIPTION SYSTEM TESTS PASSED!');
    console.log('✅ Subscription payment handling is fully operational');
  } else if (totalPassed >= totalTests * 0.8) {
    console.log('⚠️  SUBSCRIPTION SYSTEM MOSTLY OPERATIONAL');
    console.log('🔧 Minor issues detected, but core functionality working');
  } else {
    console.log('🚨 SUBSCRIPTION SYSTEM NEEDS ATTENTION');
    console.log('❌ Significant issues detected, requires debugging');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 SUBSCRIPTION SYSTEM VALIDATION COMPLETE');
  console.log('='.repeat(50));
}

async function runAllTests() {
  console.log(`🌐 Testing against: ${baseUrl}\n`);
  
  try {
    await testProductDetection();
    await testSubscriptionCreation();
    await testRoutingLogic();
    await testCheckoutIntegration();
    await generateReport();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run the comprehensive test suite
runAllTests().catch(console.error);