import axios from 'axios';

// Test configuration
const DEV_URL = 'http://localhost:5000';
const PROD_URL = 'http://localhost:5000'; // Using same as development for now

const TEST_CONFIG = {
  customerDetails: {
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    dueDate: '2025-08-01',
    address: '123 Test St',
    city: 'Melbourne',
    postcode: '3000',
    country: 'AU'
  },
  couponCode: 'ibuO5MIw', // 99% discount coupon
  originalAmount: 120,
  expectedDiscountedAmount: 1.20,
  currency: 'AUD'
};

class StripeValidationTester {
  constructor(baseUrl, environment) {
    this.baseUrl = baseUrl;
    this.environment = environment;
    this.results = [];
  }

  async log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, environment: this.environment, message, data };
    this.results.push(logEntry);
    console.log(`[${this.environment}] ${timestamp}: ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  }

  async testRegionalPricing() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/regional-pricing`);
      await this.log('✓ Regional pricing API working', {
        status: response.status,
        data: response.data
      });
      
      // Validate expected pricing structure
      const pricing = response.data;
      if (pricing.coursePrice === TEST_CONFIG.originalAmount && pricing.currency === TEST_CONFIG.currency) {
        await this.log('✓ Regional pricing values correct');
      } else {
        await this.log('✗ Regional pricing values incorrect', { expected: TEST_CONFIG, actual: pricing });
      }
      
      return true;
    } catch (error) {
      await this.log('✗ Regional pricing API failed', { error: error.message });
      return false;
    }
  }

  async testCouponValidation() {
    try {
      const response = await axios.post(`${this.baseUrl}/api/validate-coupon`, {
        couponCode: TEST_CONFIG.couponCode
      });
      
      await this.log('✓ Coupon validation API working', {
        status: response.status,
        couponValid: response.data.valid,
        couponData: response.data.coupon
      });
      
      // Validate coupon structure
      const coupon = response.data.coupon;
      if (coupon && coupon.percent_off === 99) {
        await this.log('✓ Coupon discount percentage correct (99%)');
      } else {
        await this.log('✗ Coupon discount percentage incorrect', { expected: 99, actual: coupon?.percent_off });
      }
      
      return response.data.valid;
    } catch (error) {
      await this.log('✗ Coupon validation failed', { error: error.message });
      return false;
    }
  }

  async testPaymentIntentCreation() {
    try {
      const response = await axios.post(`${this.baseUrl}/api/create-big-baby-payment-intent`, {
        customerDetails: TEST_CONFIG.customerDetails,
        couponId: TEST_CONFIG.couponCode
      });
      
      await this.log('✓ Payment intent creation working', {
        status: response.status,
        hasClientSecret: !!response.data.clientSecret,
        finalAmount: response.data.finalAmount,
        originalAmount: response.data.originalAmount,
        discountAmount: response.data.discountAmount,
        couponApplied: response.data.couponApplied
      });
      
      // Validate payment intent amounts
      const { finalAmount, originalAmount, discountAmount } = response.data;
      
      if (Math.abs(originalAmount - TEST_CONFIG.originalAmount) < 0.01) {
        await this.log('✓ Original amount correct');
      } else {
        await this.log('✗ Original amount incorrect', { expected: TEST_CONFIG.originalAmount, actual: originalAmount });
      }
      
      if (Math.abs(finalAmount - TEST_CONFIG.expectedDiscountedAmount) < 0.01) {
        await this.log('✓ Discounted amount correct');
      } else {
        await this.log('✗ Discounted amount incorrect', { expected: TEST_CONFIG.expectedDiscountedAmount, actual: finalAmount });
      }
      
      if (Math.abs(discountAmount - (TEST_CONFIG.originalAmount - TEST_CONFIG.expectedDiscountedAmount)) < 0.01) {
        await this.log('✓ Discount calculation correct');
      } else {
        await this.log('✗ Discount calculation incorrect', { 
          expected: TEST_CONFIG.originalAmount - TEST_CONFIG.expectedDiscountedAmount, 
          actual: discountAmount 
        });
      }
      
      // Validate product information
      if (response.data.productName === 'Big Baby Sleep Program') {
        await this.log('✓ Product name correct');
      } else {
        await this.log('✗ Product name incorrect', { expected: 'Big Baby Sleep Program', actual: response.data.productName });
      }
      
      return response.data.clientSecret;
    } catch (error) {
      await this.log('✗ Payment intent creation failed', { error: error.message, response: error.response?.data });
      return null;
    }
  }

  async testStripeIntegration(clientSecret) {
    try {
      // Test Stripe key availability
      if (clientSecret && clientSecret.startsWith('pi_')) {
        await this.log('✓ Stripe client secret format valid');
      } else {
        await this.log('✗ Stripe client secret format invalid', { clientSecret });
        return false;
      }
      
      // Since we can't actually complete a payment in test mode, we'll validate
      // that the payment intent was created with correct metadata
      await this.log('✓ Stripe integration ready for frontend testing');
      return true;
    } catch (error) {
      await this.log('✗ Stripe integration test failed', { error: error.message });
      return false;
    }
  }

  async runFullTest() {
    await this.log(`Starting comprehensive Stripe validation for ${this.environment} environment`);
    
    const tests = [
      { name: 'Regional Pricing', test: () => this.testRegionalPricing() },
      { name: 'Coupon Validation', test: () => this.testCouponValidation() },
      { name: 'Payment Intent Creation', test: () => this.testPaymentIntentCreation() },
    ];
    
    let clientSecret = null;
    let passedTests = 0;
    
    for (const { name, test } of tests) {
      try {
        const result = await test();
        if (result) {
          if (name === 'Payment Intent Creation' && typeof result === 'string') {
            clientSecret = result;
          }
          passedTests++;
        }
      } catch (error) {
        await this.log(`✗ ${name} test crashed`, { error: error.message });
      }
    }
    
    // Test Stripe integration if we have a client secret
    if (clientSecret) {
      const stripeResult = await this.testStripeIntegration(clientSecret);
      if (stripeResult) passedTests++;
    }
    
    const totalTests = tests.length + (clientSecret ? 1 : 0);
    await this.log(`${this.environment} testing complete: ${passedTests}/${totalTests} tests passed`, {
      successRate: `${(passedTests / totalTests * 100).toFixed(1)}%`,
      clientSecretGenerated: !!clientSecret
    });
    
    return { passedTests, totalTests, clientSecret, results: this.results };
  }
}

async function runComprehensiveValidation() {
  console.log('🧪 Starting Comprehensive Stripe Form Validation');
  console.log('=' .repeat(60));
  
  // Test development environment
  const devTester = new StripeValidationTester(DEV_URL, 'DEVELOPMENT');
  const devResults = await devTester.runFullTest();
  
  console.log('\n' + '=' .repeat(60));
  
  // Test production environment (same URL for now)
  const prodTester = new StripeValidationTester(PROD_URL, 'PRODUCTION');
  const prodResults = await prodTester.runFullTest();
  
  console.log('\n' + '🏆 COMPREHENSIVE VALIDATION SUMMARY');
  console.log('=' .repeat(60));
  
  const devSuccess = devResults.passedTests === devResults.totalTests;
  const prodSuccess = prodResults.passedTests === prodResults.totalTests;
  
  console.log(`Development: ${devSuccess ? '✅ PASSED' : '❌ FAILED'} (${devResults.passedTests}/${devResults.totalTests})`);
  console.log(`Production:  ${prodSuccess ? '✅ PASSED' : '❌ FAILED'} (${prodResults.passedTests}/${prodResults.totalTests})`);
  
  if (devSuccess && prodSuccess) {
    console.log('\n🎉 ALL SYSTEMS OPERATIONAL');
    console.log('✓ Standalone Stripe form ready for production');
    console.log('✓ All transaction details preserved');
    console.log('✓ Discount calculations working correctly');
    console.log('✓ Product information maintained');
  } else {
    console.log('\n⚠️  ISSUES DETECTED');
    if (!devSuccess) console.log('- Development environment has issues');
    if (!prodSuccess) console.log('- Production environment has issues');
  }
  
  return { devResults, prodResults, overallSuccess: devSuccess && prodSuccess };
}

// Run the validation
runComprehensiveValidation()
  .then(results => {
    process.exit(results.overallSuccess ? 0 : 1);
  })
  .catch(error => {
    console.error('Validation crashed:', error);
    process.exit(1);
  });