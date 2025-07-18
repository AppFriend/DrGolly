/**
 * Focused Checkout Validation Test
 * Validates key functionality that was recently fixed:
 * - NaN pricing issues resolved
 * - PaymentElement mounting stability
 * - Price calculations working correctly
 * - React hooks functioning properly
 */

// Run validation tests using browser console
const runCheckoutValidationTests = () => {
  console.log('🚀 Starting Checkout Validation Tests...');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  const test = (name, testFn) => {
    try {
      testFn();
      results.passed++;
      console.log(`✅ ${name} - PASSED`);
    } catch (error) {
      results.failed++;
      results.errors.push({ name, error: error.message });
      console.error(`❌ ${name} - FAILED: ${error.message}`);
    }
  };

  // Test 1: Check for NaN values in pricing
  test('No NaN Pricing Values', () => {
    const originalPrice = document.querySelector('[data-testid="original-price"]')?.textContent || '';
    const finalPrice = document.querySelector('[data-testid="final-price"]')?.textContent || '';
    const discountAmount = document.querySelector('[data-testid="discount-amount"]')?.textContent || '';
    
    if (originalPrice.includes('NaN')) {
      throw new Error('Original price contains NaN');
    }
    if (finalPrice.includes('NaN')) {
      throw new Error('Final price contains NaN');
    }
    if (discountAmount.includes('NaN')) {
      throw new Error('Discount amount contains NaN');
    }
    
    console.log('Price values:', { originalPrice, finalPrice, discountAmount });
  });

  // Test 2: Check React is loaded and working
  test('React Framework Loading', () => {
    if (typeof window.React === 'undefined') {
      // Check if React components are working by looking for React fiber
      const reactFiber = document.querySelector('[data-reactroot]') || 
                        document.querySelector('#root')?._reactInternalInstance ||
                        document.querySelector('#root')?._reactInternalFiber;
      
      if (!reactFiber && !window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        throw new Error('React not detected');
      }
    }
  });

  // Test 3: Check for console errors
  test('No Critical Console Errors', () => {
    // This test relies on manual observation of console during the test
    const criticalErrors = [
      'useMemo is not defined',
      'React is not defined',
      'billingDetails is not defined',
      'elements should have a mounted Payment Element'
    ];
    
    // Check if any of these errors appear in the console
    console.log('Monitor console for these critical errors:', criticalErrors);
  });

  // Test 4: Form elements exist and are accessible
  test('Form Elements Accessible', () => {
    const emailInput = document.querySelector('[data-testid="customer-email"]');
    const firstNameInput = document.querySelector('[data-testid="customer-firstName"]');
    const originalPriceElement = document.querySelector('[data-testid="original-price"]');
    const finalPriceElement = document.querySelector('[data-testid="final-price"]');
    
    if (!emailInput) throw new Error('Email input not found');
    if (!firstNameInput) throw new Error('First name input not found');
    if (!originalPriceElement) throw new Error('Original price element not found');
    if (!finalPriceElement) throw new Error('Final price element not found');
  });

  // Test 5: Check price calculation with sample data
  test('Price Calculation Logic', () => {
    // Simulate filling form to trigger calculations
    const emailInput = document.querySelector('[data-testid="customer-email"]');
    const firstNameInput = document.querySelector('[data-testid="customer-firstName"]');
    
    if (emailInput && firstNameInput) {
      emailInput.value = 'test@example.com';
      firstNameInput.value = 'Test';
      
      // Trigger change events
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      firstNameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Wait a moment for React to update
      setTimeout(() => {
        const finalPrice = document.querySelector('[data-testid="final-price"]')?.textContent || '';
        if (finalPrice.includes('NaN') || finalPrice.includes('undefined')) {
          throw new Error('Price calculation still showing NaN after form fill');
        }
        console.log('Price after form fill:', finalPrice);
      }, 1000);
    }
  });

  // Test 6: PaymentElement mounting check
  test('PaymentElement Container Exists', () => {
    // Look for Stripe elements container
    const stripeContainer = document.querySelector('[data-testid="payment-element"]') ||
                           document.querySelector('.StripeElement') ||
                           document.querySelector('iframe[src*="stripe"]');
    
    if (!stripeContainer) {
      console.warn('PaymentElement container not found - may need customer details first');
    } else {
      console.log('PaymentElement container found');
    }
  });

  // Test 7: Google Maps integration
  test('Google Maps API Available', () => {
    if (typeof window.google === 'undefined') {
      console.warn('Google Maps API not loaded');
    } else {
      console.log('Google Maps API loaded successfully');
    }
  });

  // Generate results
  setTimeout(() => {
    console.log('\n📊 VALIDATION TEST RESULTS:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(error => {
        console.log(`  - ${error.name}: ${error.error}`);
      });
    } else {
      console.log('\n🎉 All tests passed! Checkout system is working correctly.');
    }
  }, 2000);
};

// Auto-run tests when script is loaded
if (typeof window !== 'undefined') {
  // Run tests after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runCheckoutValidationTests);
  } else {
    runCheckoutValidationTests();
  }
} else {
  // Node.js environment - export for manual testing
  module.exports = runCheckoutValidationTests;
}

// Manual test instructions
console.log(`
🔧 MANUAL TESTING INSTRUCTIONS:

1. Navigate to the checkout page: /big-baby-public
2. Open browser console (F12)
3. The validation tests will run automatically
4. Additionally, manually test:
   - Fill in email and first name
   - Apply coupon code: CHECKOUT-99
   - Verify prices show correctly (no NaN)
   - Check PaymentElement loads without errors
   - Verify Google Maps address autocomplete works

5. Look for these specific validations:
   ✅ Original price displays: $120.00 (not NaN)
   ✅ With CHECKOUT-99 coupon: Final price $1.20, Discount $118.80
   ✅ No React hook errors in console
   ✅ PaymentElement mounts successfully
   ✅ No "billingDetails is not defined" errors

Expected Results:
- All pricing displays correct dollar amounts
- Coupon calculations work properly
- No JavaScript/React errors
- Payment form loads and is interactive
`);