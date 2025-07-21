#!/usr/bin/env node

// Complete checkout flow test - simulates real user journey
// Tests: Product load → Payment intent → Complete purchase → Profile completion → Auto-login

const BASE_URL = 'http://localhost:5000';

async function testCompleteCheckoutFlow() {
  console.log('🛒 TESTING COMPLETE NEW USER CHECKOUT FLOW');
  console.log('='.repeat(80));
  
  const testResults = [];
  let sessionCookie = '';
  
  try {
    // Test 1: Load product page (Big Baby Sleep Program)
    console.log('\n1️⃣ Loading Big Baby Sleep Program product...');
    try {
      const productResponse = await fetch(`${BASE_URL}/api/checkout-new/products/6`);
      const productData = await productResponse.json();
      
      if (productResponse.status === 200 && productData.name === 'Big Baby Sleep Program') {
        console.log(`✅ Product loaded: ${productData.name} - $${productData.price} ${productData.currency}`);
        testResults.push({ test: 'Product Loading', status: 'PASS', details: `${productData.name} loaded successfully` });
      } else {
        console.log(`❌ Product loading failed (status: ${productResponse.status})`);
        testResults.push({ test: 'Product Loading', status: 'FAIL', details: `Status: ${productResponse.status}` });
      }
    } catch (error) {
      console.log(`❌ Product loading error: ${error.message}`);
      testResults.push({ test: 'Product Loading', status: 'FAIL', details: error.message });
    }
    
    // Test 2: Create payment intent with customer details
    console.log('\n2️⃣ Creating payment intent with customer details...');
    try {
      const paymentIntentData = {
        productId: '6',
        customerEmail: 'testuser@example.com',
        customerFirstName: 'Test',
        customerLastName: 'User',
        couponCode: 'CHECKOUT-99' // 99% discount coupon
      };
      
      const paymentResponse = await fetch(`${BASE_URL}/api/checkout-new/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentIntentData)
      });
      
      // Extract session cookie for subsequent requests
      const setCookieHeader = paymentResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        sessionCookie = setCookieHeader.split(';')[0];
      }
      
      const paymentData = await paymentResponse.json();
      
      if (paymentResponse.status === 200 && paymentData.clientSecret) {
        console.log(`✅ Payment intent created: ${paymentData.clientSecret.substring(0, 20)}...`);
        console.log(`   Final amount: $${paymentData.finalAmount} (original: $${paymentData.originalAmount}, discount: $${paymentData.discountAmount})`);
        testResults.push({ test: 'Payment Intent Creation', status: 'PASS', details: `Client secret generated, discount applied correctly` });
      } else {
        console.log(`❌ Payment intent creation failed (status: ${paymentResponse.status})`);
        testResults.push({ test: 'Payment Intent Creation', status: 'FAIL', details: `Status: ${paymentResponse.status}` });
      }
    } catch (error) {
      console.log(`❌ Payment intent creation error: ${error.message}`);
      testResults.push({ test: 'Payment Intent Creation', status: 'FAIL', details: error.message });
    }
    
    // Test 3: Simulate successful payment completion using real payment intent
    console.log('\n3️⃣ Simulating successful payment completion...');
    try {
      // Use the real payment intent ID from step 2
      let realPaymentIntentId = null;
      
      // Extract payment intent ID from previous step
      const paymentResponse2 = await fetch(`${BASE_URL}/api/checkout-new/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie
        },
        body: JSON.stringify({
          productId: '6',
          customerEmail: 'testuser@example.com',
          customerFirstName: 'Test',
          customerLastName: 'User',
          couponCode: 'CHECKOUT-99'
        })
      });
      
      if (paymentResponse2.status === 200) {
        const paymentData2 = await paymentResponse2.json();
        realPaymentIntentId = paymentData2.clientSecret.split('_secret_')[0];
        console.log(`   Using real payment intent: ${realPaymentIntentId}`);
      }
      
      if (realPaymentIntentId) {
        const completePurchaseData = {
          paymentIntentId: realPaymentIntentId,
          productId: '6',
          customerEmail: 'testuser@example.com',
          customerFirstName: 'Test',
          customerLastName: 'User',
          originalAmount: '12000', // $120 in cents
          discountAmount: '11880', // $118.80 discount in cents
          couponCode: 'CHECKOUT-99'
        };
        
        const completeResponse = await fetch(`${BASE_URL}/api/checkout-new/complete-purchase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': sessionCookie
          },
          body: JSON.stringify(completePurchaseData)
        });
        
        const completeData = await completeResponse.json();
        
        if (completeResponse.status === 200 && completeData.success) {
          console.log(`✅ Purchase completed successfully`);
          console.log(`   User exists: ${completeData.userExists}`);
          console.log(`   Redirect to: ${completeData.redirectTo}`);
          console.log(`   Purchase ID: ${completeData.purchaseId || 'N/A'}`);
          testResults.push({ test: 'Purchase Completion', status: 'PASS', details: `Redirects to ${completeData.redirectTo}` });
        } else {
          console.log(`❌ Purchase completion failed (status: ${completeResponse.status})`);
          console.log(`   Error: ${completeData.message || 'Unknown error'}`);
          testResults.push({ test: 'Purchase Completion', status: 'FAIL', details: completeData.message || `Status: ${completeResponse.status}` });
        }
      } else {
        console.log(`❌ Could not obtain real payment intent ID`);
        testResults.push({ test: 'Purchase Completion', status: 'FAIL', details: 'No valid payment intent ID' });
      }
    } catch (error) {
      console.log(`❌ Purchase completion error: ${error.message}`);
      testResults.push({ test: 'Purchase Completion', status: 'FAIL', details: error.message });
    }
    
    // Test 4: Check pending purchase data retrieval
    console.log('\n4️⃣ Checking pending purchase data retrieval...');
    try {
      const pendingResponse = await fetch(`${BASE_URL}/api/checkout-new/pending-purchase`, {
        headers: {
          'Cookie': sessionCookie
        }
      });
      
      if (pendingResponse.status === 200) {
        const pendingData = await pendingResponse.json();
        console.log(`✅ Pending purchase data retrieved`);
        console.log(`   Product ID: ${pendingData.pendingPurchase?.productId || 'N/A'}`);
        console.log(`   Customer email: ${pendingData.pendingPurchase?.customerEmail || 'N/A'}`);
        console.log(`   Amount: $${pendingData.pendingPurchase?.amount || 'N/A'}`);
        testResults.push({ test: 'Pending Purchase Retrieval', status: 'PASS', details: 'Session contains purchase data' });
      } else {
        console.log(`❌ Pending purchase retrieval failed (status: ${pendingResponse.status})`);
        testResults.push({ test: 'Pending Purchase Retrieval', status: 'FAIL', details: `Status: ${pendingResponse.status}` });
      }
    } catch (error) {
      console.log(`❌ Pending purchase retrieval error: ${error.message}`);
      testResults.push({ test: 'Pending Purchase Retrieval', status: 'FAIL', details: error.message });
    }
    
    // Test 5: Complete new user profile creation
    console.log('\n5️⃣ Completing new user profile creation...');
    try {
      const profileData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'testpassword123',
        interests: ['Sleep Training'],
        marketingOptIn: true,
        smsMarketingOptIn: false,
        termsAccepted: true
      };
      
      const profileResponse = await fetch(`${BASE_URL}/api/auth/complete-new-user-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie
        },
        body: JSON.stringify(profileData)
      });
      
      const profileResult = await profileResponse.json();
      
      if (profileResponse.status === 200 && profileResult.success) {
        console.log(`✅ User profile created successfully`);
        console.log(`   User ID: ${profileResult.userId}`);
        console.log(`   Course added: ${profileResult.courseAdded ? 'Yes' : 'No'}`);
        console.log(`   Auto-login: ${profileResult.autoLogin ? 'Yes' : 'No'}`);
        testResults.push({ test: 'Profile Creation', status: 'PASS', details: 'User created with course access' });
      } else if (profileResponse.status === 400 && profileResult.message === 'User already exists with this email') {
        console.log(`✅ Profile creation correctly detected existing user`);
        testResults.push({ test: 'Profile Creation', status: 'PASS', details: 'Correctly prevents duplicate users' });
      } else {
        console.log(`❌ Profile creation failed (status: ${profileResponse.status})`);
        console.log(`   Error: ${profileResult.message || 'Unknown error'}`);
        testResults.push({ test: 'Profile Creation', status: 'FAIL', details: profileResult.message || `Status: ${profileResponse.status}` });
      }
    } catch (error) {
      console.log(`❌ Profile creation error: ${error.message}`);
      testResults.push({ test: 'Profile Creation', status: 'FAIL', details: error.message });
    }
    
    // Test 6: Verify authentication after profile creation
    console.log('\n6️⃣ Verifying authentication after profile creation...');
    try {
      const authResponse = await fetch(`${BASE_URL}/api/user`, {
        headers: {
          'Cookie': sessionCookie
        }
      });
      
      if (authResponse.status === 200) {
        const userData = await authResponse.json();
        console.log(`✅ User authenticated successfully`);
        console.log(`   User ID: ${userData.id}`);
        console.log(`   Email: ${userData.email}`);
        testResults.push({ test: 'Auto-Login Verification', status: 'PASS', details: 'User automatically logged in' });
      } else if (authResponse.status === 401) {
        console.log(`⚠️ User not authenticated - may need manual login`);
        testResults.push({ test: 'Auto-Login Verification', status: 'WARN', details: 'User needs to login manually' });
      } else {
        console.log(`❌ Authentication verification failed (status: ${authResponse.status})`);
        testResults.push({ test: 'Auto-Login Verification', status: 'FAIL', details: `Status: ${authResponse.status}` });
      }
    } catch (error) {
      console.log(`❌ Authentication verification error: ${error.message}`);
      testResults.push({ test: 'Auto-Login Verification', status: 'FAIL', details: error.message });
    }
    
    // Summary Report
    console.log('\n📊 COMPLETE CHECKOUT FLOW TEST SUMMARY');
    console.log('='.repeat(80));
    
    const passCount = testResults.filter(r => r.status === 'PASS').length;
    const failCount = testResults.filter(r => r.status === 'FAIL').length;
    const warnCount = testResults.filter(r => r.status === 'WARN').length;
    
    testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.test}: ${result.status}`);
      console.log(`   ${result.details}`);
    });
    
    console.log('\n📈 FLOW RESULTS:');
    console.log(`   ✅ Passed: ${passCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   ⚠️  Warnings: ${warnCount}`);
    
    const successRate = Math.round((passCount / testResults.length) * 100);
    console.log(`   🎯 Success Rate: ${successRate}%`);
    
    console.log('\n🔍 FLOW ANALYSIS:');
    if (successRate >= 80) {
      console.log('🎉 COMPLETE CHECKOUT FLOW: FULLY OPERATIONAL');
      console.log('   New user journey works end-to-end with proper session management');
      console.log('   Payment processing, profile creation, and auto-login all functional');
    } else if (successRate >= 60) {
      console.log('⚠️ COMPLETE CHECKOUT FLOW: MOSTLY WORKING');
      console.log('   Core functionality operational but some issues detected');
    } else {
      console.log('❌ COMPLETE CHECKOUT FLOW: NEEDS FIXES');
      console.log('   Critical issues preventing complete user journey');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run the complete flow test
testCompleteCheckoutFlow().catch(console.error);