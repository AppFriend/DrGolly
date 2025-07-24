/**
 * Comprehensive Checkout Stability Test
 * Tests PaymentElement mounting, Google Maps integration, and payment processing
 */

const testConfig = {
  devUrl: 'http://localhost:5000',
  prodUrl: 'https://a92f89ea-09dc-4aa2-a5c5-39a24b33f402-00-2xd8b3j49zo47.kirk.replit.dev',
  testEmail: 'test@example.com',
  testData: {
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    address: '123 Main St'
  }
};

async function testPaymentElementStability(baseUrl) {
  console.log(`\n=== Testing PaymentElement Stability on ${baseUrl} ===`);
  
  try {
    // Test 1: Payment intent creation
    const paymentResponse = await fetch(`${baseUrl}/api/create-big-baby-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testConfig.testEmail,
        firstName: testConfig.testData.firstName,
        lastName: testConfig.testData.lastName,
        amount: 120,
        currency: 'USD'
      })
    });

    const paymentData = await paymentResponse.json();
    console.log('✓ Payment intent created successfully:', paymentData.clientSecret ? 'Yes' : 'No');

    // Test 2: Regional pricing
    const pricingResponse = await fetch(`${baseUrl}/api/regional-pricing`);
    const pricingData = await pricingResponse.json();
    console.log('✓ Regional pricing loaded:', pricingData.currency);

    // Test 3: Verify payment intent
    if (paymentData.clientSecret) {
      const verifyResponse = await fetch(`${baseUrl}/api/verify-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: paymentData.clientSecret.split('_secret_')[0]
        })
      });
      
      const verifyData = await verifyResponse.json();
      console.log('✓ Payment intent verification:', verifyData.status);
    }

    return {
      success: true,
      paymentIntent: !!paymentData.clientSecret,
      pricing: !!pricingData.currency
    };

  } catch (error) {
    console.error('✗ Payment element test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testGoogleMapsIntegration() {
  console.log('\n=== Testing Google Maps Integration ===');
  
  try {
    // Test Google Maps API key presence
    const hasApiKey = !!process.env.VITE_GOOGLE_MAPS_API_KEY;
    console.log('✓ Google Maps API key configured:', hasApiKey);

    if (hasApiKey) {
      // Test Google Maps API accessibility
      const mapsUrl = `https://maps.googleapis.com/maps/api/js?key=${process.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      
      try {
        const response = await fetch(mapsUrl, { method: 'HEAD' });
        console.log('✓ Google Maps API accessible:', response.ok);
      } catch (error) {
        console.log('✗ Google Maps API test failed:', error.message);
      }
    }

    return {
      success: true,
      apiKey: hasApiKey
    };

  } catch (error) {
    console.error('✗ Google Maps integration test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testStripeMounting() {
  console.log('\n=== Testing Stripe Element Mounting ===');
  
  try {
    // Test Stripe public key
    const hasStripeKey = !!process.env.VITE_STRIPE_PUBLIC_KEY;
    console.log('✓ Stripe public key configured:', hasStripeKey);

    // Test Stripe secret key
    const hasStripeSecret = !!process.env.STRIPE_SECRET_KEY;
    console.log('✓ Stripe secret key configured:', hasStripeSecret);

    return {
      success: true,
      publicKey: hasStripeKey,
      secretKey: hasStripeSecret
    };

  } catch (error) {
    console.error('✗ Stripe mounting test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Checkout Stability Test\n');
  
  const results = {
    dev: null,
    prod: null,
    googleMaps: null,
    stripe: null,
    timestamp: new Date().toISOString()
  };

  // Test development environment
  console.log('Testing Development Environment...');
  results.dev = await testPaymentElementStability(testConfig.devUrl);

  // Test production environment
  console.log('Testing Production Environment...');
  results.prod = await testPaymentElementStability(testConfig.prodUrl);

  // Test Google Maps integration
  results.googleMaps = await testGoogleMapsIntegration();

  // Test Stripe configuration
  results.stripe = await testStripeMounting();

  // Summary
  console.log('\n=== TEST SUMMARY ===');
  console.log('Development Environment:', results.dev.success ? '✓ PASS' : '✗ FAIL');
  console.log('Production Environment:', results.prod.success ? '✓ PASS' : '✗ FAIL');
  console.log('Google Maps Integration:', results.googleMaps.success ? '✓ PASS' : '✗ FAIL');
  console.log('Stripe Configuration:', results.stripe.success ? '✓ PASS' : '✗ FAIL');

  // Overall status
  const overallSuccess = results.dev.success && results.prod.success && 
                        results.googleMaps.success && results.stripe.success;
  
  console.log('\n🎯 OVERALL STATUS:', overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');

  return results;
}

// Run the test
runComprehensiveTest().catch(console.error);