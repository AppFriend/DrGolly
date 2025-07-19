// Frontend Stripe Form Test Script
// This script can be run in browser console to test the new standalone form

const frontendStripeTest = {
  async testFormAccessibility() {
    console.log('🧪 Testing Standalone Stripe Form Accessibility');
    
    // Test 1: Check if SimpleStripeForm component is loaded
    const stripeForm = document.querySelector('[data-testid="stripe-card-element"], .StripeElement--focus, .StripeElement');
    if (stripeForm) {
      console.log('✓ Stripe card element found in DOM');
    } else {
      console.log('✗ Stripe card element not found');
      return false;
    }
    
    // Test 2: Check if form is accessible immediately
    const emailInput = document.querySelector('input[type="email"]');
    const firstNameInput = document.querySelector('input[placeholder*="First"], input[placeholder*="first"]');
    
    if (emailInput && firstNameInput) {
      console.log('✓ Email and first name inputs found');
      
      // Simulate user input
      emailInput.value = 'test@example.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      setTimeout(() => {
        firstNameInput.value = 'Test';
        firstNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        setTimeout(() => {
          // Check if Stripe element becomes available
          const updatedStripeForm = document.querySelector('.StripeElement');
          if (updatedStripeForm && !updatedStripeForm.disabled) {
            console.log('✓ Stripe form accessible after email + first name entry');
          } else {
            console.log('✗ Stripe form still not accessible');
          }
        }, 1000);
      }, 500);
    } else {
      console.log('✗ Required input fields not found');
      return false;
    }
    
    return true;
  },
  
  async testCouponIntegration() {
    console.log('🧪 Testing Coupon Integration');
    
    const couponInput = document.querySelector('input[placeholder*="coupon"], input[placeholder*="promo"]');
    if (couponInput) {
      console.log('✓ Coupon input found');
      
      // Test coupon application
      couponInput.value = 'ibuO5MIw';
      couponInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Look for apply button
      const applyButton = document.querySelector('button[type="submit"]:not([disabled])');
      if (applyButton) {
        console.log('✓ Coupon apply functionality available');
      }
    } else {
      console.log('✗ Coupon input not found');
    }
  },
  
  async testPaymentButtonState() {
    console.log('🧪 Testing Payment Button States');
    
    const paymentButton = document.querySelector('button[type="submit"]:last-of-type, button:contains("Place order"), button:contains("Complete Purchase")');
    if (paymentButton) {
      console.log('✓ Payment button found');
      console.log(`Button text: "${paymentButton.textContent}"`);
      console.log(`Button disabled: ${paymentButton.disabled}`);
      
      if (paymentButton.disabled) {
        console.log('ℹ️  Button currently disabled (expected until form completion)');
      } else {
        console.log('✓ Button enabled and ready for payment');
      }
    } else {
      console.log('✗ Payment button not found');
    }
  },
  
  async testPricingDisplay() {
    console.log('🧪 Testing Pricing Display');
    
    const priceElements = document.querySelectorAll('[data-testid*="price"], .price, [data-testid*="amount"]');
    priceElements.forEach((element, index) => {
      console.log(`Price element ${index + 1}: "${element.textContent}"`);
    });
    
    // Look for discount display
    const discountElements = document.querySelectorAll('[data-testid*="discount"], .discount');
    discountElements.forEach((element, index) => {
      console.log(`Discount element ${index + 1}: "${element.textContent}"`);
    });
  },
  
  async runAllTests() {
    console.log('🚀 Starting Frontend Stripe Form Tests');
    console.log('=' .repeat(50));
    
    await this.testFormAccessibility();
    await this.testCouponIntegration();
    await this.testPaymentButtonState();
    await this.testPricingDisplay();
    
    console.log('=' .repeat(50));
    console.log('✅ Frontend testing complete');
    console.log('ℹ️  Check console logs above for detailed results');
  }
};

// Instructions for manual testing
console.log(`
🧪 MANUAL TESTING INSTRUCTIONS:

1. Open browser console on the checkout page
2. Run: frontendStripeTest.runAllTests()
3. Fill in email and first name manually
4. Verify credit card fields become accessible immediately
5. Test coupon application (use: ibuO5MIw)
6. Verify pricing updates correctly
7. Test payment button enablement

To run individual tests:
- frontendStripeTest.testFormAccessibility()
- frontendStripeTest.testCouponIntegration() 
- frontendStripeTest.testPaymentButtonState()
- frontendStripeTest.testPricingDisplay()
`);

// Make available globally for browser console
if (typeof window !== 'undefined') {
  window.frontendStripeTest = frontendStripeTest;
}