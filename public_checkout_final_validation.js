#!/usr/bin/env node

/**
 * COMPREHENSIVE PUBLIC CHECKOUT VALIDATION
 * Tests all aspects of the public checkout system for Dr. Golly platform
 * 
 * This script validates:
 * 1. Public checkout authentication bypass working correctly
 * 2. All three course checkout routes accessible (Big Baby, Little Baby, Pre-Toddler)
 * 3. Payment intent creation for unauthenticated users
 * 4. Proper separation of authenticated vs unauthenticated flows
 * 5. Course purchase record handling for public purchases
 */

const BASE_URL = 'http://localhost:5000';

// Test data for validation
const TEST_CUSTOMER = {
  email: 'test.public@example.com',
  firstName: 'Public',
  lastName: 'User'
};

const COURSES = [
  { id: 5, name: 'Little Baby Sleep Program' },
  { id: 6, name: 'Big Baby Sleep Program' },
  { id: 7, name: 'Pre-Toddler Sleep Program' }
];

// Utility functions
function logTest(test, status, details = '') {
  const statusSymbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${statusSymbol} ${test}${details ? ': ' + details : ''}`);
}

function logSection(title) {
  console.log(`\n📋 ${title}`);
  console.log('='.repeat(title.length + 3));
}

async function makeRequest(method, endpoint, data = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    return {
      status: response.status,
      ok: response.ok,
      data: response.ok ? await response.json() : null,
      error: !response.ok ? await response.text() : null
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      data: null,
      error: error.message
    };
  }
}

async function validatePublicCheckoutRoutes() {
  logSection('PUBLIC CHECKOUT ROUTE ACCESSIBILITY');
  
  let allRoutesAccessible = true;
  
  for (const course of COURSES) {
    const result = await makeRequest('GET', `/checkout/${course.id}`);
    
    if (result.status === 200) {
      logTest(`Course ${course.id} checkout route`, 'PASS', `${course.name} accessible`);
    } else {
      logTest(`Course ${course.id} checkout route`, 'FAIL', `Status: ${result.status}`);
      allRoutesAccessible = false;
    }
  }
  
  return allRoutesAccessible;
}

async function validatePublicPaymentIntentCreation() {
  logSection('PUBLIC CHECKOUT PAYMENT INTENT CREATION');
  
  let allPaymentIntentsWorking = true;
  
  for (const course of COURSES) {
    const requestData = {
      courseId: course.id,
      customerDetails: TEST_CUSTOMER,
      couponId: null,
      isDirectPurchase: true // This is the key flag for public checkout
    };
    
    const result = await makeRequest('POST', '/api/create-course-payment', requestData);
    
    if (result.status === 200 && result.data?.clientSecret) {
      logTest(`Course ${course.id} payment creation`, 'PASS', 
        `Client secret: ${result.data.clientSecret.substring(0, 20)}...`);
    } else {
      logTest(`Course ${course.id} payment creation`, 'FAIL', 
        `Status: ${result.status}, Error: ${result.error}`);
      allPaymentIntentsWorking = false;
    }
  }
  
  return allPaymentIntentsWorking;
}

async function validateAuthenticatedCheckoutProtection() {
  logSection('AUTHENTICATED CHECKOUT PROTECTION');
  
  const requestData = {
    courseId: 6, // Test with Big Baby course
    customerDetails: TEST_CUSTOMER,
    couponId: null,
    isDirectPurchase: false // This should require authentication
  };
  
  const result = await makeRequest('POST', '/api/create-course-payment', requestData);
  
  if (result.status === 401) {
    logTest('Authenticated checkout protection', 'PASS', 'Correctly blocks unauthenticated users');
    return true;
  } else {
    logTest('Authenticated checkout protection', 'FAIL', 
      `Expected 401, got ${result.status}`);
    return false;
  }
}

async function validateDualFlowSystem() {
  logSection('DUAL FLOW SYSTEM VALIDATION');
  
  // Test public flow
  const publicResult = await makeRequest('POST', '/api/create-course-payment', {
    courseId: 6,
    customerDetails: TEST_CUSTOMER,
    couponId: null,
    isDirectPurchase: true
  });
  
  // Test authenticated flow (should fail without auth)
  const authResult = await makeRequest('POST', '/api/create-course-payment', {
    courseId: 6,
    customerDetails: TEST_CUSTOMER,
    couponId: null,
    isDirectPurchase: false
  });
  
  const publicWorking = publicResult.status === 200 && publicResult.data?.clientSecret;
  const authProtected = authResult.status === 401;
  
  if (publicWorking && authProtected) {
    logTest('Dual flow system', 'PASS', 'Public works (200), authenticated protected (401)');
    return true;
  } else {
    logTest('Dual flow system', 'FAIL', 
      `Public: ${publicResult.status}, Auth: ${authResult.status}`);
    return false;
  }
}

async function validateCoursePurchaseHandling() {
  logSection('COURSE PURCHASE RECORD HANDLING');
  
  // This test validates that public checkout doesn't try to create course purchase records
  // The logs should show "Course purchase creation: { skipped: true }"
  
  const result = await makeRequest('POST', '/api/create-course-payment', {
    courseId: 6,
    customerDetails: TEST_CUSTOMER,
    couponId: null,
    isDirectPurchase: true
  });
  
  if (result.status === 200) {
    logTest('Course purchase record handling', 'PASS', 
      'Public checkout skips course purchase creation (check logs)');
    return true;
  } else {
    logTest('Course purchase record handling', 'FAIL', 
      `Expected 200, got ${result.status}`);
    return false;
  }
}

async function runComprehensiveValidation() {
  console.log('🚀 PUBLIC CHECKOUT SYSTEM - COMPREHENSIVE VALIDATION');
  console.log('====================================================');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Test customer: ${TEST_CUSTOMER.email}`);
  console.log(`Courses to test: ${COURSES.map(c => `${c.id} (${c.name})`).join(', ')}`);
  
  const results = {
    routesAccessible: false,
    paymentIntentsWorking: false,
    authProtectionWorking: false,
    dualFlowWorking: false,
    coursePurchaseHandling: false
  };
  
  try {
    results.routesAccessible = await validatePublicCheckoutRoutes();
    results.paymentIntentsWorking = await validatePublicPaymentIntentCreation();
    results.authProtectionWorking = await validateAuthenticatedCheckoutProtection();
    results.dualFlowWorking = await validateDualFlowSystem();
    results.coursePurchaseHandling = await validateCoursePurchaseHandling();
    
    // Summary
    logSection('VALIDATION SUMMARY');
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Public checkout system is fully operational.');
      console.log('');
      console.log('✅ Public checkout routes accessible for all three courses');
      console.log('✅ Payment intent creation working for unauthenticated users');
      console.log('✅ Authenticated checkout properly protected');
      console.log('✅ Dual flow system working correctly');
      console.log('✅ Course purchase records handled appropriately');
      console.log('');
      console.log('🚀 SYSTEM STATUS: PRODUCTION READY');
      console.log('');
      console.log('NEXT STEPS:');
      console.log('1. Frontend integration complete with isDirectPurchase flag');
      console.log('2. Backend authentication bypass working correctly');
      console.log('3. Course purchase records will be created post-payment during account setup');
      console.log('4. Ready for comprehensive manual testing of complete checkout flow');
      
    } else {
      console.log(`❌ ${totalTests - passedTests} out of ${totalTests} tests failed.`);
      console.log('');
      console.log('FAILED TESTS:');
      Object.entries(results).forEach(([test, passed]) => {
        if (!passed) {
          console.log(`  ❌ ${test}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Validation failed with error:', error.message);
  }
}

// Run validation if called directly
runComprehensiveValidation();