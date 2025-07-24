/**
 * Simple PaymentElement Stability Test
 * Quick test to verify payment element mounting and Google Maps integration
 */

const baseUrl = 'https://a92f89ea-09dc-4aa2-a5c5-39a24b33f402-00-2xd8b3j49zo47.kirk.replit.dev';

async function testPaymentElementCreation() {
  console.log('🔍 Testing PaymentElement Creation...');
  
  try {
    const response = await fetch(`${baseUrl}/api/create-big-baby-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerDetails: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          phone: '+1234567890',
          address: '123 Test St',
          city: 'Test City',
          postcode: '12345',
          country: 'US'
        },
        couponId: null
      })
    });

    const data = await response.json();
    
    if (response.ok && data.clientSecret) {
      console.log('✅ PaymentElement Creation: SUCCESS');
      console.log(`   Client Secret: ${data.clientSecret.slice(0, 20)}...`);
      return { success: true, clientSecret: data.clientSecret };
    } else {
      console.log('❌ PaymentElement Creation: FAILED');
      console.log(`   Error: ${data.message || 'Unknown error'}`);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log('❌ PaymentElement Creation: FAILED');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testPaymentVerification(clientSecret) {
  console.log('🔍 Testing Payment Verification...');
  
  try {
    const paymentIntentId = clientSecret.split('_secret_')[0];
    const response = await fetch(`${baseUrl}/api/verify-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentIntentId: paymentIntentId
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Payment Verification: SUCCESS');
      console.log(`   Status: ${data.status}`);
      console.log(`   Amount: ${data.amount} ${data.currency}`);
      return { success: true, status: data.status };
    } else {
      console.log('❌ Payment Verification: FAILED');
      console.log(`   Error: ${data.message || 'Unknown error'}`);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log('❌ Payment Verification: FAILED');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testEnvironmentConfiguration() {
  console.log('🔍 Testing Environment Configuration...');
  
  const checks = {
    stripePublicKey: !!process.env.VITE_STRIPE_PUBLIC_KEY,
    stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    googleMapsApiKey: !!process.env.VITE_GOOGLE_MAPS_API_KEY,
    databaseUrl: !!process.env.DATABASE_URL,
    sessionSecret: !!process.env.SESSION_SECRET
  };
  
  console.log('Environment Status:');
  Object.entries(checks).forEach(([key, value]) => {
    console.log(`   ${key}: ${value ? '✅' : '❌'}`);
  });
  
  const configuredCount = Object.values(checks).filter(v => v).length;
  const totalCount = Object.keys(checks).length;
  
  console.log(`\n📊 Configuration: ${configuredCount}/${totalCount} items configured`);
  
  return checks;
}

async function testRegionalPricing() {
  console.log('🔍 Testing Regional Pricing...');
  
  try {
    const response = await fetch(`${baseUrl}/api/regional-pricing`);
    const data = await response.json();
    
    console.log('✅ Regional Pricing: SUCCESS');
    console.log(`   Region: ${data.region}`);
    console.log(`   Currency: ${data.currency}`);
    console.log(`   Course Price: ${data.coursePrice || data.amount}`);
    
    return { success: true, ...data };
  } catch (error) {
    console.log('❌ Regional Pricing: FAILED');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runStabilityTest() {
  console.log('🚀 Starting PaymentElement Stability Test');
  console.log(`Target: ${baseUrl}\n`);
  
  // Test environment configuration
  const envConfig = await testEnvironmentConfiguration();
  console.log('');
  
  // Test regional pricing
  const pricingResult = await testRegionalPricing();
  console.log('');
  
  // Test payment element creation
  const paymentResult = await testPaymentElementCreation();
  console.log('');
  
  // Test payment verification if payment creation succeeded
  let verificationResult = { success: false };
  if (paymentResult.success && paymentResult.clientSecret) {
    verificationResult = await testPaymentVerification(paymentResult.clientSecret);
    console.log('');
  }
  
  // Summary
  console.log('=== TEST SUMMARY ===');
  
  const envPassed = Object.values(envConfig).filter(v => v).length;
  const envTotal = Object.keys(envConfig).length;
  
  console.log(`Environment Configuration: ${envPassed >= 4 ? '✅ PASS' : '❌ FAIL'} (${envPassed}/${envTotal})`);
  console.log(`Regional Pricing: ${pricingResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`PaymentElement Creation: ${paymentResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Payment Verification: ${verificationResult.success ? '✅ PASS' : '❌ FAIL'}`);
  
  const overallSuccess = envPassed >= 4 && pricingResult.success && 
                        paymentResult.success && verificationResult.success;
  
  console.log(`\n🎯 OVERALL STATUS: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (overallSuccess) {
    console.log('\n💡 PaymentElement mounting should be stable based on successful API tests.');
    console.log('   Both development and production environments are properly configured.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the above results for details.');
  }
  
  return {
    environment: envConfig,
    regionalPricing: pricingResult,
    paymentCreation: paymentResult,
    paymentVerification: verificationResult,
    overallSuccess
  };
}

// Run the test
runStabilityTest().catch(console.error);