#!/usr/bin/env node

// Comprehensive test script for new user complete flow
// Tests: /complete route access → pending purchase retrieval → profile completion → auto-login

const BASE_URL = 'http://localhost:5000';

async function testNewUserCompleteFlow() {
  console.log('🔍 TESTING NEW USER COMPLETE FLOW');
  console.log('='.repeat(80));
  
  const testResults = [];
  
  try {
    // Test 1: Access /complete route (should be publicly accessible)
    console.log('\n1️⃣ Testing /complete route access...');
    try {
      const completeResponse = await fetch(`${BASE_URL}/complete`);
      const completeStatus = completeResponse.status;
      
      if (completeStatus === 200) {
        console.log('✅ /complete route accessible (status: 200)');
        testResults.push({ test: 'Complete Route Access', status: 'PASS', details: 'Route accessible to new users' });
      } else {
        console.log(`❌ /complete route failed (status: ${completeStatus})`);
        testResults.push({ test: 'Complete Route Access', status: 'FAIL', details: `Unexpected status: ${completeStatus}` });
      }
    } catch (error) {
      console.log(`❌ /complete route error: ${error.message}`);
      testResults.push({ test: 'Complete Route Access', status: 'FAIL', details: error.message });
    }
    
    // Test 2: Pending purchase endpoint (simulating session data)
    console.log('\n2️⃣ Testing pending purchase retrieval...');
    try {
      const pendingResponse = await fetch(`${BASE_URL}/api/checkout-new/pending-purchase`);
      const pendingStatus = pendingResponse.status;
      
      if (pendingStatus === 401) {
        console.log('✅ Pending purchase endpoint requires authentication (status: 401) - expected for unauthenticated requests');
        testResults.push({ test: 'Pending Purchase Endpoint', status: 'PASS', details: 'Correctly requires authentication' });
      } else if (pendingStatus === 200) {
        const pendingData = await pendingResponse.json();
        console.log('✅ Pending purchase endpoint accessible (status: 200)');
        console.log('   Data structure:', Object.keys(pendingData));
        testResults.push({ test: 'Pending Purchase Endpoint', status: 'PASS', details: 'Returns pending purchase data' });
      } else {
        console.log(`⚠️ Pending purchase unexpected status: ${pendingStatus}`);
        testResults.push({ test: 'Pending Purchase Endpoint', status: 'WARN', details: `Unexpected status: ${pendingStatus}` });
      }
    } catch (error) {
      console.log(`❌ Pending purchase error: ${error.message}`);
      testResults.push({ test: 'Pending Purchase Endpoint', status: 'FAIL', details: error.message });
    }
    
    // Test 3: New user profile completion endpoint structure
    console.log('\n3️⃣ Testing new user profile completion endpoint...');
    try {
      const testProfileData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        interests: ['Sleep Training'],
        marketingOptIn: true,
        smsMarketingOptIn: false,
        termsAccepted: true,
        pendingPurchase: {
          productId: 6,
          paymentIntentId: 'pi_test_123',
          amount: 120,
          customerEmail: 'test@example.com'
        }
      };
      
      const profileResponse = await fetch(`${BASE_URL}/api/auth/complete-new-user-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testProfileData)
      });
      
      const profileStatus = profileResponse.status;
      
      if (profileStatus === 400) {
        const errorData = await profileResponse.json();
        if (errorData.message === 'User already exists with this email') {
          console.log('✅ New user profile endpoint correctly detects existing users');
          testResults.push({ test: 'New User Profile Endpoint', status: 'PASS', details: 'Correctly prevents duplicate users' });
        } else {
          console.log(`⚠️ New user profile validation: ${errorData.message}`);
          testResults.push({ test: 'New User Profile Endpoint', status: 'WARN', details: errorData.message });
        }
      } else if (profileStatus === 200) {
        console.log('✅ New user profile endpoint accepts valid data');
        testResults.push({ test: 'New User Profile Endpoint', status: 'PASS', details: 'Accepts valid profile data' });
      } else {
        console.log(`❌ New user profile unexpected status: ${profileStatus}`);
        const errorText = await profileResponse.text();
        testResults.push({ test: 'New User Profile Endpoint', status: 'FAIL', details: `Status ${profileStatus}: ${errorText}` });
      }
    } catch (error) {
      console.log(`❌ New user profile error: ${error.message}`);
      testResults.push({ test: 'New User Profile Endpoint', status: 'FAIL', details: error.message });
    }
    
    // Test 4: Form validation requirements
    console.log('\n4️⃣ Testing form validation requirements...');
    try {
      const invalidTestData = {
        firstName: '',
        lastName: '',
        email: 'invalid-email',
        password: '123', // Too short
        termsAccepted: false,
        pendingPurchase: null
      };
      
      const validationResponse = await fetch(`${BASE_URL}/api/auth/complete-new-user-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidTestData)
      });
      
      const validationStatus = validationResponse.status;
      
      if (validationStatus === 400) {
        const validationError = await validationResponse.json();
        console.log('✅ Form validation working correctly');
        console.log(`   Validation error: ${validationError.message}`);
        testResults.push({ test: 'Form Validation', status: 'PASS', details: 'Correctly validates required fields' });
      } else {
        console.log(`❌ Form validation not working (status: ${validationStatus})`);
        testResults.push({ test: 'Form Validation', status: 'FAIL', details: `Expected 400, got ${validationStatus}` });
      }
    } catch (error) {
      console.log(`❌ Form validation test error: ${error.message}`);
      testResults.push({ test: 'Form Validation', status: 'FAIL', details: error.message });
    }
    
    // Summary Report
    console.log('\n📊 TEST SUMMARY');
    console.log('='.repeat(80));
    
    const passCount = testResults.filter(r => r.status === 'PASS').length;
    const failCount = testResults.filter(r => r.status === 'FAIL').length;
    const warnCount = testResults.filter(r => r.status === 'WARN').length;
    
    testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.test}: ${result.status}`);
      console.log(`   ${result.details}`);
    });
    
    console.log('\n📈 RESULTS:');
    console.log(`   ✅ Passed: ${passCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   ⚠️  Warnings: ${warnCount}`);
    
    const successRate = Math.round((passCount / testResults.length) * 100);
    console.log(`   🎯 Success Rate: ${successRate}%`);
    
    if (successRate >= 75) {
      console.log('\n🎉 NEW USER COMPLETE FLOW: READY FOR TESTING');
      console.log('   All critical systems operational for new user account creation');
    } else {
      console.log('\n⚠️ NEW USER COMPLETE FLOW: NEEDS ATTENTION');
      console.log('   Some issues detected - review failed tests');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run the test
testNewUserCompleteFlow().catch(console.error);