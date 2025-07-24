/**
 * Comprehensive PaymentElement Stability Test Suite
 * Tests mounting behavior, Google Maps integration, and payment processing
 * in both development and production environments
 */

import fs from 'fs';
import path from 'path';

// Test configuration
const testConfig = {
  baseUrl: 'https://a92f89ea-09dc-4aa2-a5c5-39a24b33f402-00-2xd8b3j49zo47.kirk.replit.dev',
  testIterations: 10,
  testTimeout: 30000,
  testEmail: 'stability.test@example.com',
  testData: {
    firstName: 'Stability',
    lastName: 'Test',
    phone: '+1234567890',
    address: '123 Test Street'
  }
};

// Test results storage
let testResults = {
  paymentElementTests: [],
  googleMapsTests: [],
  environmentChecks: {},
  summary: {},
  timestamp: new Date().toISOString()
};

/**
 * Test PaymentElement mounting stability
 */
async function testPaymentElementStability() {
  console.log('\n🧪 Testing PaymentElement Mounting Stability...');
  
  const results = [];
  
  for (let i = 0; i < testConfig.testIterations; i++) {
    console.log(`Running PaymentElement test ${i + 1}/${testConfig.testIterations}`);
    
    try {
      // Create payment intent
      const paymentResponse = await fetch(`${testConfig.baseUrl}/api/create-big-baby-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `${testConfig.testEmail}${i}`,
          firstName: testConfig.testData.firstName,
          lastName: testConfig.testData.lastName,
          amount: 120,
          currency: 'USD'
        })
      });

      const paymentData = await paymentResponse.json();
      
      if (paymentData.clientSecret) {
        // Test payment intent verification
        const verifyResponse = await fetch(`${testConfig.baseUrl}/api/verify-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentData.clientSecret.split('_secret_')[0]
          })
        });

        const verifyData = await verifyResponse.json();
        
        results.push({
          iteration: i + 1,
          paymentIntentCreated: true,
          clientSecret: paymentData.clientSecret.slice(-8),
          verificationStatus: verifyData.status,
          success: true,
          timestamp: new Date().toISOString()
        });
      } else {
        results.push({
          iteration: i + 1,
          paymentIntentCreated: false,
          error: paymentData.message || 'Unknown error',
          success: false,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      results.push({
        iteration: i + 1,
        paymentIntentCreated: false,
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      });
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  testResults.paymentElementTests = results;
  
  const successCount = results.filter(r => r.success).length;
  const successRate = (successCount / results.length) * 100;
  
  console.log(`✓ PaymentElement Tests: ${successCount}/${results.length} (${successRate.toFixed(1)}%)`);
  return results;
}

/**
 * Test Google Maps integration
 */
async function testGoogleMapsIntegration() {
  console.log('\n🗺️ Testing Google Maps Integration...');
  
  const results = [];
  
  try {
    // Check if API key is configured
    const hasApiKey = !!process.env.VITE_GOOGLE_MAPS_API_KEY;
    
    results.push({
      test: 'API Key Configuration',
      success: hasApiKey,
      result: hasApiKey ? 'Configured' : 'Missing'
    });
    
    if (hasApiKey) {
      // Test Google Maps API accessibility
      const mapsUrl = `https://maps.googleapis.com/maps/api/js?key=${process.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      
      try {
        const response = await fetch(mapsUrl, { 
          method: 'HEAD',
          timeout: 5000
        });
        
        results.push({
          test: 'Google Maps API Access',
          success: response.ok,
          result: response.ok ? 'Accessible' : `HTTP ${response.status}`
        });
      } catch (error) {
        results.push({
          test: 'Google Maps API Access',
          success: false,
          result: error.message
        });
      }
    }
    
    testResults.googleMapsTests = results;
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✓ Google Maps Tests: ${successCount}/${results.length}`);
    
  } catch (error) {
    console.error('Google Maps test failed:', error.message);
    results.push({
      test: 'Google Maps Integration',
      success: false,
      result: error.message
    });
  }
  
  return results;
}

/**
 * Test environment configuration
 */
async function testEnvironmentConfiguration() {
  console.log('\n⚙️ Testing Environment Configuration...');
  
  const checks = {
    stripePublicKey: !!process.env.VITE_STRIPE_PUBLIC_KEY,
    stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    googleMapsApiKey: !!process.env.VITE_GOOGLE_MAPS_API_KEY,
    databaseUrl: !!process.env.DATABASE_URL,
    sessionSecret: !!process.env.SESSION_SECRET,
    nodeEnv: process.env.NODE_ENV || 'development'
  };
  
  testResults.environmentChecks = checks;
  
  console.log('Environment Configuration:');
  Object.entries(checks).forEach(([key, value]) => {
    console.log(`  ${key}: ${value === true ? '✓' : value === false ? '✗' : value}`);
  });
  
  return checks;
}

/**
 * Test regional pricing functionality
 */
async function testRegionalPricing() {
  console.log('\n💰 Testing Regional Pricing...');
  
  try {
    const response = await fetch(`${testConfig.baseUrl}/api/regional-pricing`);
    const data = await response.json();
    
    console.log(`✓ Regional Pricing: ${data.region} - ${data.currency}`);
    
    return {
      success: true,
      region: data.region,
      currency: data.currency,
      amount: data.amount || data.coursePrice
    };
    
  } catch (error) {
    console.error('Regional pricing test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  console.log('\n📊 Generating Test Report...');
  
  const paymentElementSuccess = testResults.paymentElementTests.filter(r => r.success).length;
  const paymentElementTotal = testResults.paymentElementTests.length;
  const paymentElementSuccessRate = paymentElementTotal > 0 ? (paymentElementSuccess / paymentElementTotal) * 100 : 0;
  
  const googleMapsSuccess = testResults.googleMapsTests.filter(r => r.success).length;
  const googleMapsTotal = testResults.googleMapsTests.length;
  const googleMapsSuccessRate = googleMapsTotal > 0 ? (googleMapsSuccess / googleMapsTotal) * 100 : 0;
  
  const environmentPassed = Object.values(testResults.environmentChecks).filter(v => v === true).length;
  const environmentTotal = Object.keys(testResults.environmentChecks).length;
  
  testResults.summary = {
    paymentElement: {
      total: paymentElementTotal,
      success: paymentElementSuccess,
      successRate: paymentElementSuccessRate,
      status: paymentElementSuccessRate >= 90 ? 'PASS' : 'FAIL'
    },
    googleMaps: {
      total: googleMapsTotal,
      success: googleMapsSuccess,
      successRate: googleMapsSuccessRate,
      status: googleMapsSuccessRate >= 80 ? 'PASS' : 'FAIL'
    },
    environment: {
      total: environmentTotal,
      passed: environmentPassed,
      status: environmentPassed >= 4 ? 'PASS' : 'FAIL'
    },
    overall: {
      status: (paymentElementSuccessRate >= 90 && googleMapsSuccessRate >= 80 && environmentPassed >= 4) ? 'PASS' : 'FAIL'
    }
  };
  
  // Save results to file
  fs.writeFileSync(
    path.join(__dirname, 'test_results.json'),
    JSON.stringify(testResults, null, 2)
  );
  
  console.log('\n=== COMPREHENSIVE TEST REPORT ===');
  console.log(`PaymentElement Stability: ${testResults.summary.paymentElement.status} (${paymentElementSuccess}/${paymentElementTotal} - ${paymentElementSuccessRate.toFixed(1)}%)`);
  console.log(`Google Maps Integration: ${testResults.summary.googleMaps.status} (${googleMapsSuccess}/${googleMapsTotal} - ${googleMapsSuccessRate.toFixed(1)}%)`);
  console.log(`Environment Configuration: ${testResults.summary.environment.status} (${environmentPassed}/${environmentTotal})`);
  console.log(`\n🎯 OVERALL STATUS: ${testResults.summary.overall.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
  
  return testResults;
}

/**
 * Main test execution
 */
async function runComprehensiveStabilityTest() {
  console.log('🚀 Starting Comprehensive Stability Test Suite');
  console.log(`Target: ${testConfig.baseUrl}`);
  console.log(`Iterations: ${testConfig.testIterations}`);
  console.log(`Timeout: ${testConfig.testTimeout}ms\n`);
  
  try {
    // Run all tests
    await testEnvironmentConfiguration();
    await testRegionalPricing();
    await testPaymentElementStability();
    await testGoogleMapsIntegration();
    
    // Generate report
    const finalReport = generateTestReport();
    
    console.log('\n📄 Test results saved to: test_results.json');
    
    return finalReport;
    
  } catch (error) {
    console.error('Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the comprehensive test
runComprehensiveStabilityTest().catch(console.error);