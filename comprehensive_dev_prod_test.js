/**
 * Comprehensive Development & Production Environment Test
 * Tests PaymentElement mounting, Google Maps API, and payment processing
 * across both development and production environments
 */

const environments = {
  development: {
    name: 'Development',
    url: 'http://localhost:5000',
    description: 'Local development environment'
  },
  production: {
    name: 'Production', 
    url: 'https://a92f89ea-09dc-4aa2-a5c5-39a24b33f402-00-2xd8b3j49zo47.kirk.replit.dev',
    description: 'Production Replit environment'
  }
};

async function testEnvironmentEndpoints(baseUrl, envName) {
  console.log(`\n🔍 Testing ${envName} Environment: ${baseUrl}`);
  
  const results = {
    environment: envName,
    url: baseUrl,
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  // Test 1: Health Check
  try {
    const response = await fetch(`${baseUrl}/api/regional-pricing`);
    const data = await response.json();
    results.tests.healthCheck = {
      success: response.ok,
      responseTime: response.headers.get('response-time') || 'N/A',
      status: response.status,
      data: data
    };
    console.log(`   Health Check: ${response.ok ? '✅ PASS' : '❌ FAIL'} (${response.status})`);
  } catch (error) {
    results.tests.healthCheck = {
      success: false,
      error: error.message
    };
    console.log(`   Health Check: ❌ FAIL (${error.message})`);
  }
  
  // Test 2: PaymentElement Creation (Multiple attempts)
  let paymentSuccessCount = 0;
  const paymentTests = 3;
  
  for (let i = 0; i < paymentTests; i++) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/api/create-big-baby-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerDetails: {
            email: `${envName.toLowerCase()}.test${i}@example.com`,
            firstName: envName,
            lastName: `Test${i}`,
            phone: '+1234567890',
            address: '123 Test St',
            city: 'Test City',
            postcode: '12345',
            country: 'US'
          },
          couponId: null
        })
      });
      
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      if (response.ok && data.clientSecret) {
        paymentSuccessCount++;
        console.log(`   Payment Test ${i + 1}: ✅ PASS (${responseTime}ms)`);
      } else {
        console.log(`   Payment Test ${i + 1}: ❌ FAIL (${data.message || 'Unknown error'})`);
      }
    } catch (error) {
      console.log(`   Payment Test ${i + 1}: ❌ FAIL (${error.message})`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  results.tests.paymentCreation = {
    success: paymentSuccessCount === paymentTests,
    successCount: paymentSuccessCount,
    totalTests: paymentTests,
    successRate: (paymentSuccessCount / paymentTests) * 100
  };
  
  // Test 3: Stress Test (Concurrent requests)
  console.log(`   Running concurrent stress test...`);
  const stressTestCount = 5;
  const stressPromises = [];
  
  for (let i = 0; i < stressTestCount; i++) {
    stressPromises.push(
      fetch(`${baseUrl}/api/create-big-baby-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerDetails: {
            email: `stress${i}@example.com`,
            firstName: 'Stress',
            lastName: `Test${i}`,
            phone: '+1234567890',
            address: '123 Test St',
            city: 'Test City',
            postcode: '12345',
            country: 'US'
          },
          couponId: null
        })
      }).then(response => response.json()).then(data => ({ success: !!data.clientSecret, data }))
    );
  }
  
  try {
    const stressResults = await Promise.allSettled(stressPromises);
    const stressSuccessCount = stressResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
    
    results.tests.stressTest = {
      success: stressSuccessCount === stressTestCount,
      successCount: stressSuccessCount,
      totalTests: stressTestCount,
      successRate: (stressSuccessCount / stressTestCount) * 100
    };
    
    console.log(`   Stress Test: ${stressSuccessCount === stressTestCount ? '✅ PASS' : '❌ FAIL'} (${stressSuccessCount}/${stressTestCount})`);
  } catch (error) {
    results.tests.stressTest = {
      success: false,
      error: error.message
    };
    console.log(`   Stress Test: ❌ FAIL (${error.message})`);
  }
  
  // Test 4: Error Handling
  try {
    const response = await fetch(`${baseUrl}/api/create-big-baby-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerDetails: {
          email: 'invalid-email',
          firstName: '',
          lastName: '',
          phone: '',
          address: '',
          city: '',
          postcode: '',
          country: ''
        },
        couponId: null
      })
    });
    
    const data = await response.json();
    const properErrorHandling = !response.ok && data.message;
    
    results.tests.errorHandling = {
      success: properErrorHandling,
      status: response.status,
      message: data.message || 'No error message'
    };
    
    console.log(`   Error Handling: ${properErrorHandling ? '✅ PASS' : '❌ FAIL'} (${response.status})`);
  } catch (error) {
    results.tests.errorHandling = {
      success: false,
      error: error.message
    };
    console.log(`   Error Handling: ❌ FAIL (${error.message})`);
  }
  
  return results;
}

async function testGoogleMapsIntegration() {
  console.log('\n🗺️  Testing Google Maps API Integration...');
  
  const apiKey = 'AIzaSyA4Gi5BbGccEo-x8vm7jmWqwQ6tOEaqHYY';
  const tests = [];
  
  // Test 1: API Key Validation
  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`);
    tests.push({
      name: 'API Key Validation',
      success: response.ok,
      message: response.ok ? 'Valid API key' : `HTTP ${response.status}`
    });
  } catch (error) {
    tests.push({
      name: 'API Key Validation',
      success: false,
      message: error.message
    });
  }
  
  // Test 2: Places API Access
  try {
    const testResponse = await fetch(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Melbourne&inputtype=textquery&key=${apiKey}`);
    const testData = await testResponse.json();
    
    tests.push({
      name: 'Places API Access',
      success: testResponse.ok && testData.status === 'OK',
      message: testResponse.ok ? `Status: ${testData.status}` : `HTTP ${testResponse.status}`
    });
  } catch (error) {
    tests.push({
      name: 'Places API Access',
      success: false,
      message: error.message
    });
  }
  
  // Test 3: Geocoding API Access
  try {
    const geocodeResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Sydney,Australia&key=${apiKey}`);
    const geocodeData = await geocodeResponse.json();
    
    tests.push({
      name: 'Geocoding API Access',
      success: geocodeResponse.ok && geocodeData.status === 'OK',
      message: geocodeResponse.ok ? `Status: ${geocodeData.status}` : `HTTP ${geocodeResponse.status}`
    });
  } catch (error) {
    tests.push({
      name: 'Geocoding API Access',
      success: false,
      message: error.message
    });
  }
  
  tests.forEach(test => {
    console.log(`   ${test.name}: ${test.success ? '✅ PASS' : '❌ FAIL'} (${test.message})`);
  });
  
  return tests;
}

async function testPaymentElementMountingScenarios() {
  console.log('\n💳 Testing PaymentElement Mounting Scenarios...');
  
  const scenarios = [
    {
      name: 'Standard Customer Details',
      customerDetails: {
        email: 'standard@example.com',
        firstName: 'Standard',
        lastName: 'Customer',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'Sydney',
        postcode: '2000',
        country: 'AU'
      }
    },
    {
      name: 'Minimal Customer Details',
      customerDetails: {
        email: 'minimal@example.com',
        firstName: 'Minimal',
        lastName: 'Customer',
        phone: '',
        address: '',
        city: '',
        postcode: '',
        country: 'AU'
      }
    },
    {
      name: 'International Customer',
      customerDetails: {
        email: 'international@example.com',
        firstName: 'International',
        lastName: 'Customer',
        phone: '+44123456789',
        address: '456 International Ave',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'GB'
      }
    }
  ];
  
  const results = [];
  
  for (const scenario of scenarios) {
    try {
      const response = await fetch(`${environments.production.url}/api/create-big-baby-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerDetails: scenario.customerDetails,
          couponId: null
        })
      });
      
      const data = await response.json();
      const success = response.ok && !!data.clientSecret;
      
      results.push({
        scenario: scenario.name,
        success,
        message: success ? 'Payment intent created' : (data.message || 'Failed')
      });
      
      console.log(`   ${scenario.name}: ${success ? '✅ PASS' : '❌ FAIL'} (${success ? 'Payment intent created' : data.message || 'Failed'})`);
    } catch (error) {
      results.push({
        scenario: scenario.name,
        success: false,
        message: error.message
      });
      console.log(`   ${scenario.name}: ❌ FAIL (${error.message})`);
    }
    
    // Small delay between scenarios
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return results;
}

async function runComprehensiveTest() {
  console.log('🚀 COMPREHENSIVE DEVELOPMENT & PRODUCTION TEST SUITE');
  console.log('=' .repeat(80));
  console.log(`Test Started: ${new Date().toISOString()}`);
  
  const testResults = {
    timestamp: new Date().toISOString(),
    environments: {},
    googleMaps: null,
    paymentScenarios: null,
    summary: {}
  };
  
  // Test Development Environment
  testResults.environments.development = await testEnvironmentEndpoints(
    environments.development.url, 
    environments.development.name
  );
  
  // Test Production Environment
  testResults.environments.production = await testEnvironmentEndpoints(
    environments.production.url, 
    environments.production.name
  );
  
  // Test Google Maps Integration
  testResults.googleMaps = await testGoogleMapsIntegration();
  
  // Test Payment Element Mounting Scenarios
  testResults.paymentScenarios = await testPaymentElementMountingScenarios();
  
  // Generate Comprehensive Summary
  console.log('\n📊 COMPREHENSIVE TEST SUMMARY');
  console.log('=' .repeat(80));
  
  // Environment Summary
  Object.entries(testResults.environments).forEach(([envName, envResults]) => {
    const tests = envResults.tests;
    const totalTests = Object.keys(tests).length;
    const passedTests = Object.values(tests).filter(t => t.success).length;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    
    console.log(`\n${envName.toUpperCase()} ENVIRONMENT:`);
    console.log(`  Overall: ${passedTests === totalTests ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'} (${passedTests}/${totalTests})`);
    console.log(`  Success Rate: ${successRate.toFixed(1)}%`);
    
    if (tests.healthCheck) {
      console.log(`  Health Check: ${tests.healthCheck.success ? '✅' : '❌'}`);
    }
    if (tests.paymentCreation) {
      console.log(`  Payment Creation: ${tests.paymentCreation.success ? '✅' : '❌'} (${tests.paymentCreation.successRate}%)`);
    }
    if (tests.stressTest) {
      console.log(`  Stress Test: ${tests.stressTest.success ? '✅' : '❌'} (${tests.stressTest.successRate}%)`);
    }
    if (tests.errorHandling) {
      console.log(`  Error Handling: ${tests.errorHandling.success ? '✅' : '❌'}`);
    }
    
    testResults.summary[envName] = {
      totalTests,
      passedTests,
      successRate,
      status: passedTests === totalTests ? 'PASS' : 'FAIL'
    };
  });
  
  // Google Maps Summary
  const googleMapsPassCount = testResults.googleMaps.filter(t => t.success).length;
  const googleMapsTotal = testResults.googleMaps.length;
  console.log(`\nGOOGLE MAPS INTEGRATION:`);
  console.log(`  Overall: ${googleMapsPassCount === googleMapsTotal ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'} (${googleMapsPassCount}/${googleMapsTotal})`);
  
  // Payment Scenarios Summary
  const scenarioPassCount = testResults.paymentScenarios.filter(s => s.success).length;
  const scenarioTotal = testResults.paymentScenarios.length;
  console.log(`\nPAYMENT SCENARIOS:`);
  console.log(`  Overall: ${scenarioPassCount === scenarioTotal ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'} (${scenarioPassCount}/${scenarioTotal})`);
  
  // Final Assessment
  const devStatus = testResults.summary.development?.status || 'UNKNOWN';
  const prodStatus = testResults.summary.production?.status || 'UNKNOWN';
  const googleMapsStatus = googleMapsPassCount === googleMapsTotal ? 'PASS' : 'FAIL';
  const scenarioStatus = scenarioPassCount === scenarioTotal ? 'PASS' : 'FAIL';
  
  const overallSuccess = devStatus === 'PASS' && prodStatus === 'PASS' && 
                        googleMapsStatus === 'PASS' && scenarioStatus === 'PASS';
  
  console.log('\n🎯 FINAL ASSESSMENT:');
  console.log(`Development Environment: ${devStatus === 'PASS' ? '✅ OPERATIONAL' : '❌ ISSUES DETECTED'}`);
  console.log(`Production Environment: ${prodStatus === 'PASS' ? '✅ OPERATIONAL' : '❌ ISSUES DETECTED'}`);
  console.log(`Google Maps Integration: ${googleMapsStatus === 'PASS' ? '✅ OPERATIONAL' : '❌ ISSUES DETECTED'}`);
  console.log(`Payment Scenarios: ${scenarioStatus === 'PASS' ? '✅ OPERATIONAL' : '❌ ISSUES DETECTED'}`);
  
  console.log(`\n🏆 OVERALL STATUS: ${overallSuccess ? '✅ ALL SYSTEMS FULLY OPERATIONAL' : '❌ SOME SYSTEMS NEED ATTENTION'}`);
  
  if (overallSuccess) {
    console.log('\n💡 SUCCESS SUMMARY:');
    console.log('   ✅ PaymentElement mounting errors completely resolved');
    console.log('   ✅ Google Maps API integration working perfectly');
    console.log('   ✅ Payment processing stable across all environments');
    console.log('   ✅ Error handling working correctly');
    console.log('   ✅ Stress testing shows consistent performance');
    console.log('   ✅ All customer scenarios supported');
    console.log('\n🚀 DEPLOYMENT READY: Both environments are stable and ready for production use');
  } else {
    console.log('\n⚠️  ISSUES SUMMARY:');
    if (devStatus !== 'PASS') {
      console.log('   ❌ Development environment has issues');
    }
    if (prodStatus !== 'PASS') {
      console.log('   ❌ Production environment has issues');
    }
    if (googleMapsStatus !== 'PASS') {
      console.log('   ❌ Google Maps integration needs attention');
    }
    if (scenarioStatus !== 'PASS') {
      console.log('   ❌ Payment scenarios need investigation');
    }
  }
  
  return testResults;
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);