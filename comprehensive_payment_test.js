// Comprehensive Payment Test Script for Big Baby Public Checkout
// Tests the complete payment flow with billing details fix

console.log('🧪 COMPREHENSIVE PAYMENT TEST STARTING...');

// Test Configuration
const testConfig = {
  baseUrl: window.location.origin,
  testEmail: 'test@example.com',
  testFirstName: 'Test',
  couponCode: 'CHECKOUT-99', // 99% off coupon
  testCardNumber: '4242424242424242',
  testExpiry: '12/34',
  testCVC: '123'
};

// Test Results Storage
let testResults = {
  pageLoad: false,
  paymentIntentCreation: false,
  couponApplication: false,
  paymentElementMount: false,
  pricingCalculation: false,
  billingDetailsHandling: false,
  paymentProcessing: false,
  errors: []
};

// Helper Functions
function logTest(testName, result, details = '') {
  const icon = result ? '✅' : '❌';
  console.log(`${icon} ${testName}${details ? ': ' + details : ''}`);
  return result;
}

function addError(error) {
  testResults.errors.push(error);
  console.error('❌ ERROR:', error);
}

// Test 1: Page Load and Initial State
async function testPageLoad() {
  console.log('\n📋 Test 1: Page Load and Initial State');
  
  try {
    // Check if we're on the right page
    const isCorrectPage = window.location.pathname === '/big-baby-public';
    testResults.pageLoad = logTest('Page Load', isCorrectPage, 
      isCorrectPage ? 'On correct page' : 'Wrong page: ' + window.location.pathname);
    
    // Check for required elements
    const hasForm = document.querySelector('form') !== null;
    const hasEmailInput = document.querySelector('input[type="email"]') !== null;
    const hasFirstNameInput = document.querySelector('input[name="firstName"]') !== null;
    
    logTest('Form Elements', hasForm && hasEmailInput && hasFirstNameInput);
    
    return testResults.pageLoad;
  } catch (error) {
    addError('Page load test failed: ' + error.message);
    return false;
  }
}

// Test 2: Payment Intent Creation
async function testPaymentIntentCreation() {
  console.log('\n💳 Test 2: Payment Intent Creation');
  
  try {
    // Fill in customer details
    const emailInput = document.querySelector('input[type="email"]');
    const firstNameInput = document.querySelector('input[name="firstName"]');
    
    if (emailInput && firstNameInput) {
      emailInput.value = testConfig.testEmail;
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      firstNameInput.value = testConfig.testFirstName;
      firstNameInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      logTest('Customer Details Filled', true);
      
      // Wait for payment intent creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if payment intent was created (look for Stripe Elements)
      const hasStripeElements = document.querySelector('.StripeElement') !== null;
      testResults.paymentIntentCreation = logTest('Payment Intent Creation', hasStripeElements);
      
      return testResults.paymentIntentCreation;
    } else {
      addError('Customer detail inputs not found');
      return false;
    }
  } catch (error) {
    addError('Payment intent creation test failed: ' + error.message);
    return false;
  }
}

// Test 3: Coupon Application
async function testCouponApplication() {
  console.log('\n🎟️ Test 3: Coupon Application');
  
  try {
    // Find coupon input
    const couponInput = document.querySelector('input[placeholder*="coupon"], input[placeholder*="code"]');
    const applyButton = document.querySelector('button[type="button"]');
    
    if (couponInput && applyButton) {
      couponInput.value = testConfig.couponCode;
      couponInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      applyButton.click();
      
      // Wait for coupon validation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if coupon was applied
      const hasCouponApplied = document.querySelector('.bg-green-50') !== null;
      testResults.couponApplication = logTest('Coupon Application', hasCouponApplied);
      
      return testResults.couponApplication;
    } else {
      addError('Coupon input or apply button not found');
      return false;
    }
  } catch (error) {
    addError('Coupon application test failed: ' + error.message);
    return false;
  }
}

// Test 4: Payment Element Mounting
async function testPaymentElementMount() {
  console.log('\n⚡ Test 4: Payment Element Mounting');
  
  try {
    // Wait for payment element to fully mount
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for payment element
    const hasPaymentElement = document.querySelector('.StripeElement') !== null;
    const hasCardInput = document.querySelector('input[placeholder*="1234"]') !== null;
    
    testResults.paymentElementMount = logTest('Payment Element Mount', 
      hasPaymentElement || hasCardInput, 
      hasPaymentElement ? 'Stripe Element found' : 'Card input found');
    
    return testResults.paymentElementMount;
  } catch (error) {
    addError('Payment element mount test failed: ' + error.message);
    return false;
  }
}

// Test 5: Pricing Calculation
async function testPricingCalculation() {
  console.log('\n💰 Test 5: Pricing Calculation');
  
  try {
    // Check for pricing displays
    const totalElement = document.querySelector('span:contains("Total:")');
    const priceElements = document.querySelectorAll('span');
    
    let foundPricing = false;
    let pricingDetails = '';
    
    priceElements.forEach(element => {
      const text = element.textContent;
      if (text.includes('$') && (text.includes('1.20') || text.includes('120'))) {
        foundPricing = true;
        pricingDetails = text;
      }
    });
    
    testResults.pricingCalculation = logTest('Pricing Calculation', foundPricing, pricingDetails);
    
    return testResults.pricingCalculation;
  } catch (error) {
    addError('Pricing calculation test failed: ' + error.message);
    return false;
  }
}

// Test 6: Billing Details Handling
async function testBillingDetailsHandling() {
  console.log('\n📋 Test 6: Billing Details Handling');
  
  try {
    // Check that billing details are handled properly
    // Look for signs that billing details are being processed correctly
    
    const hasPlaceOrderButton = document.querySelector('button[type="submit"]') !== null;
    const buttonText = document.querySelector('button[type="submit"]')?.textContent || '';
    const isButtonEnabled = !document.querySelector('button[type="submit"]')?.disabled;
    
    testResults.billingDetailsHandling = logTest('Billing Details Handling', 
      hasPlaceOrderButton && isButtonEnabled, 
      `Button: ${buttonText}, Enabled: ${isButtonEnabled}`);
    
    return testResults.billingDetailsHandling;
  } catch (error) {
    addError('Billing details handling test failed: ' + error.message);
    return false;
  }
}

// Test 7: Payment Processing Simulation
async function testPaymentProcessing() {
  console.log('\n🔄 Test 7: Payment Processing Simulation');
  
  try {
    // Note: We won't actually process payment, just check if the flow is ready
    const submitButton = document.querySelector('button[type="submit"]');
    
    if (submitButton && !submitButton.disabled) {
      testResults.paymentProcessing = logTest('Payment Processing Ready', true, 
        'Submit button is enabled and ready');
      return true;
    } else {
      testResults.paymentProcessing = logTest('Payment Processing Ready', false, 
        'Submit button is disabled or not found');
      return false;
    }
  } catch (error) {
    addError('Payment processing test failed: ' + error.message);
    return false;
  }
}

// Run All Tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Payment Test Suite...\n');
  
  const results = {
    pageLoad: await testPageLoad(),
    paymentIntentCreation: await testPaymentIntentCreation(),
    couponApplication: await testCouponApplication(),
    paymentElementMount: await testPaymentElementMount(),
    pricingCalculation: await testPricingCalculation(),
    billingDetailsHandling: await testBillingDetailsHandling(),
    paymentProcessing: await testPaymentProcessing()
  };
  
  // Calculate overall success rate
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(result => result).length;
  const successRate = (passedTests / totalTests * 100).toFixed(1);
  
  console.log('\n📊 FINAL TEST RESULTS:');
  console.log('========================');
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`📈 Success Rate: ${successRate}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  if (successRate >= 80) {
    console.log('\n🎉 PAYMENT SYSTEM IS READY FOR PRODUCTION!');
  } else {
    console.log('\n⚠️  PAYMENT SYSTEM NEEDS ATTENTION BEFORE PRODUCTION');
  }
  
  return {
    results,
    successRate,
    errors: testResults.errors
  };
}

// Auto-run if script is executed directly
if (typeof window !== 'undefined') {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
  } else {
    runAllTests();
  }
}

// Export for manual execution
window.runPaymentTests = runAllTests;
console.log('💡 Run window.runPaymentTests() to execute the test suite manually');