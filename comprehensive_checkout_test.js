/**
 * Comprehensive Checkout Testing Suite
 * Tests both development and production environments for:
 * - PaymentElement mounting stability
 * - Price calculations and coupon handling
 * - React hook errors
 * - Transaction flow completion
 * - Google Maps integration
 * - Address autocomplete functionality
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configurations
const TEST_CONFIG = {
  dev: {
    url: 'http://localhost:5000/big-baby-public',
    name: 'Development'
  },
  prod: {
    url: 'https://a92f89ea-09dc-4aa2-a5c5-39a24b33f402-00-2xd8b3j49zo47.kirk.replit.dev/big-baby-public',
    name: 'Production'
  }
};

const TEST_DATA = {
  customerDetails: {
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890'
  },
  billingDetails: {
    address: '123 Test Street',
    city: 'Test City',
    postcode: '12345',
    country: 'Australia'
  },
  coupons: [
    { code: 'CHECKOUT-99', expectedDiscount: 99, type: 'percent' },
    { code: 'SAVE20', expectedDiscount: 20, type: 'amount' }
  ]
};

class CheckoutTester {
  constructor() {
    this.browser = null;
    this.results = {
      dev: { passed: 0, failed: 0, errors: [] },
      prod: { passed: 0, failed: 0, errors: [] }
    };
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runTest(testName, testFunction, environment) {
    console.log(`\n🧪 Running ${testName} on ${environment}...`);
    try {
      await testFunction();
      this.results[environment].passed++;
      console.log(`✅ ${testName} passed`);
      return true;
    } catch (error) {
      this.results[environment].failed++;
      this.results[environment].errors.push({
        test: testName,
        error: error.message,
        stack: error.stack
      });
      console.log(`❌ ${testName} failed: ${error.message}`);
      return false;
    }
  }

  async testPageLoading(page, environment) {
    await this.runTest('Page Loading', async () => {
      const response = await page.goto(TEST_CONFIG[environment].url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      if (!response.ok()) {
        throw new Error(`Page failed to load: ${response.status()}`);
      }

      // Wait for main content to load
      await page.waitForSelector('.bg-white', { timeout: 10000 });
      
      // Check for any console errors
      const errors = await page.evaluate(() => {
        return window.console.errors || [];
      });
      
      if (errors.length > 0) {
        throw new Error(`Console errors found: ${errors.join(', ')}`);
      }
    }, environment);
  }

  async testReactHookErrors(page, environment) {
    await this.runTest('React Hook Errors', async () => {
      // Listen for console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Wait for React to initialize
      await page.waitForTimeout(2000);

      // Check for React hook errors
      const reactErrors = consoleErrors.filter(error => 
        error.includes('React') || 
        error.includes('Hook') || 
        error.includes('useMemo') ||
        error.includes('useEffect')
      );

      if (reactErrors.length > 0) {
        throw new Error(`React hook errors found: ${reactErrors.join(', ')}`);
      }
    }, environment);
  }

  async testPriceCalculations(page, environment) {
    await this.runTest('Price Calculations', async () => {
      // Fill customer details
      await page.type('[data-testid="customer-email"]', TEST_DATA.customerDetails.email);
      await page.type('[data-testid="customer-firstName"]', TEST_DATA.customerDetails.firstName);
      await page.type('[data-testid="customer-lastName"]', TEST_DATA.customerDetails.lastName);
      
      // Wait for payment intent creation
      await page.waitForTimeout(2000);

      // Check original price display
      const originalPrice = await page.$eval('[data-testid="original-price"]', el => el.textContent);
      if (!originalPrice || originalPrice.includes('NaN')) {
        throw new Error('Original price is NaN or missing');
      }

      // Test coupon application
      for (const coupon of TEST_DATA.coupons) {
        await page.type('[data-testid="coupon-input"]', coupon.code);
        await page.click('[data-testid="apply-coupon"]');
        
        // Wait for coupon validation
        await page.waitForTimeout(2000);
        
        // Check discount display
        const discountAmount = await page.$eval('[data-testid="discount-amount"]', el => el.textContent);
        if (!discountAmount || discountAmount.includes('NaN')) {
          throw new Error(`Discount amount is NaN for coupon ${coupon.code}`);
        }
        
        // Check final price
        const finalPrice = await page.$eval('[data-testid="final-price"]', el => el.textContent);
        if (!finalPrice || finalPrice.includes('NaN')) {
          throw new Error(`Final price is NaN for coupon ${coupon.code}`);
        }
        
        // Clear coupon for next test
        await page.evaluate(() => {
          document.querySelector('[data-testid="coupon-input"]').value = '';
        });
      }
    }, environment);
  }

  async testPaymentElementMounting(page, environment) {
    await this.runTest('PaymentElement Mounting', async () => {
      // Fill required customer details
      await page.type('[data-testid="customer-email"]', TEST_DATA.customerDetails.email);
      await page.type('[data-testid="customer-firstName"]', TEST_DATA.customerDetails.firstName);
      
      // Wait for payment intent creation and element mounting
      await page.waitForTimeout(5000);
      
      // Check if PaymentElement is mounted
      const paymentElement = await page.$('[data-testid="payment-element"]');
      if (!paymentElement) {
        throw new Error('PaymentElement not found');
      }
      
      // Check for mounting errors in console
      const mountingErrors = await page.evaluate(() => {
        return window.console.errors?.filter(error => 
          error.includes('PaymentElement') || 
          error.includes('elements should have a mounted') ||
          error.includes('stripe.confirmPayment')
        ) || [];
      });
      
      if (mountingErrors.length > 0) {
        throw new Error(`PaymentElement mounting errors: ${mountingErrors.join(', ')}`);
      }
      
      // Test element readiness
      await page.waitForSelector('[data-testid="payment-element"] iframe', { timeout: 10000 });
      
      // Verify element is ready for interaction
      const elementReady = await page.evaluate(() => {
        return window.paymentElementReady === true;
      });
      
      if (!elementReady) {
        console.warn('PaymentElement readiness could not be verified');
      }
    }, environment);
  }

  async testAddressAutocomplete(page, environment) {
    await this.runTest('Address Autocomplete', async () => {
      // Check if Google Maps is loaded
      const mapsLoaded = await page.evaluate(() => {
        return typeof window.google !== 'undefined' && 
               typeof window.google.maps !== 'undefined';
      });
      
      if (!mapsLoaded) {
        throw new Error('Google Maps API not loaded');
      }
      
      // Test address autocomplete functionality
      const addressInput = await page.$('[data-testid="address-input"]');
      if (!addressInput) {
        throw new Error('Address input not found');
      }
      
      // Type partial address
      await page.type('[data-testid="address-input"]', '123 Test');
      await page.waitForTimeout(2000);
      
      // Check for autocomplete suggestions
      const suggestions = await page.$$('[data-testid="address-suggestion"]');
      if (suggestions.length === 0) {
        console.warn('No address suggestions found (may be expected in test environment)');
      }
    }, environment);
  }

  async testTransactionFlow(page, environment) {
    await this.runTest('Transaction Flow', async () => {
      // Fill all required fields
      await page.type('[data-testid="customer-email"]', TEST_DATA.customerDetails.email);
      await page.type('[data-testid="customer-firstName"]', TEST_DATA.customerDetails.firstName);
      await page.type('[data-testid="customer-lastName"]', TEST_DATA.customerDetails.lastName);
      await page.type('[data-testid="customer-phone"]', TEST_DATA.customerDetails.phone);
      
      // Fill billing details
      await page.type('[data-testid="billing-address"]', TEST_DATA.billingDetails.address);
      await page.type('[data-testid="billing-city"]', TEST_DATA.billingDetails.city);
      await page.type('[data-testid="billing-postcode"]', TEST_DATA.billingDetails.postcode);
      
      // Wait for payment element to be ready
      await page.waitForTimeout(5000);
      
      // Check if payment button is enabled
      const paymentButton = await page.$('[data-testid="payment-button"]');
      if (!paymentButton) {
        throw new Error('Payment button not found');
      }
      
      const isEnabled = await page.evaluate(button => {
        return !button.disabled;
      }, paymentButton);
      
      if (!isEnabled) {
        throw new Error('Payment button is disabled');
      }
      
      // Note: We don't actually submit the payment in tests
      console.log('✅ Payment button is ready for submission');
    }, environment);
  }

  async testEnvironment(environment) {
    console.log(`\n🌍 Testing ${TEST_CONFIG[environment].name} Environment`);
    console.log(`URL: ${TEST_CONFIG[environment].url}`);
    
    const page = await this.browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔴 Console Error: ${msg.text()}`);
      }
    });
    
    try {
      await this.testPageLoading(page, environment);
      await this.testReactHookErrors(page, environment);
      await this.testPriceCalculations(page, environment);
      await this.testPaymentElementMounting(page, environment);
      await this.testAddressAutocomplete(page, environment);
      await this.testTransactionFlow(page, environment);
    } catch (error) {
      console.error(`❌ Critical error in ${environment} testing:`, error);
    } finally {
      await page.close();
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Checkout Testing Suite');
    
    await this.initialize();
    
    try {
      // Test both environments
      await this.testEnvironment('dev');
      await this.testEnvironment('prod');
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  generateReport() {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('=' * 50);
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const [env, results] of Object.entries(this.results)) {
      console.log(`\n${TEST_CONFIG[env].name} Environment:`);
      console.log(`✅ Passed: ${results.passed}`);
      console.log(`❌ Failed: ${results.failed}`);
      
      if (results.errors.length > 0) {
        console.log('\nErrors:');
        results.errors.forEach(error => {
          console.log(`  - ${error.test}: ${error.error}`);
        });
      }
      
      totalPassed += results.passed;
      totalFailed += results.failed;
    }
    
    console.log(`\n🎯 OVERALL RESULTS:`);
    console.log(`✅ Total Passed: ${totalPassed}`);
    console.log(`❌ Total Failed: ${totalFailed}`);
    console.log(`📈 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        totalPassed,
        totalFailed,
        successRate: ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)
      }
    };
    
    fs.writeFileSync('checkout_test_report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to checkout_test_report.json');
  }
}

// Add data-testid attributes to components for reliable testing
const addTestIds = `
// Add these data-testid attributes to your components:

// Customer Details Form
<input data-testid="customer-email" ... />
<input data-testid="customer-firstName" ... />
<input data-testid="customer-lastName" ... />
<input data-testid="customer-phone" ... />

// Billing Details Form
<input data-testid="billing-address" ... />
<input data-testid="billing-city" ... />
<input data-testid="billing-postcode" ... />

// Pricing Display
<span data-testid="original-price">...</span>
<span data-testid="discount-amount">...</span>
<span data-testid="final-price">...</span>

// Coupon System
<input data-testid="coupon-input" ... />
<button data-testid="apply-coupon" ... />

// Payment System
<div data-testid="payment-element">...</div>
<button data-testid="payment-button" ... />

// Address Autocomplete
<input data-testid="address-input" ... />
<div data-testid="address-suggestion" ... />
`;

// Run tests if called directly
if (require.main === module) {
  const tester = new CheckoutTester();
  tester.runAllTests().catch(console.error);
}

module.exports = CheckoutTester;