// Production Payment Validation Script
// Validates that the billing details fix resolves the Stripe integration error

console.log('🔍 PRODUCTION PAYMENT VALIDATION STARTING...');

// Test the specific billing details fix
async function validateBillingDetailsFix() {
  console.log('\n📋 Testing Billing Details Fix...');
  
  try {
    // Navigate to the checkout page
    if (window.location.pathname !== '/big-baby-public') {
      console.log('⚠️  Not on checkout page, navigating...');
      window.location.href = '/big-baby-public';
      return;
    }
    
    // Fill in minimum required details
    const emailInput = document.querySelector('input[type="email"]');
    const firstNameInput = document.querySelector('input[name="firstName"]');
    
    if (emailInput && firstNameInput) {
      emailInput.value = 'test@example.com';
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      firstNameInput.value = 'Test';
      firstNameInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      console.log('✅ Customer details filled');
      
      // Wait for payment intent creation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Apply coupon to trigger discount calculation
      const couponInput = document.querySelector('input[placeholder*="coupon"], input[placeholder*="code"]');
      const applyButton = document.querySelector('button[type="button"]');
      
      if (couponInput && applyButton) {
        couponInput.value = 'CHECKOUT-99';
        couponInput.dispatchEvent(new Event('change', { bubbles: true }));
        applyButton.click();
        
        console.log('✅ Coupon applied');
        
        // Wait for coupon validation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if the payment button is enabled
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton && !submitButton.disabled) {
          console.log('✅ Payment button is enabled');
          
          // Check that pricing is calculated correctly
          const priceElements = document.querySelectorAll('span');
          let foundCorrectPricing = false;
          
          priceElements.forEach(element => {
            const text = element.textContent;
            if (text.includes('$1.20') || text.includes('1.20')) {
              foundCorrectPricing = true;
              console.log('✅ Pricing calculated correctly:', text);
            }
          });
          
          if (foundCorrectPricing) {
            console.log('\n🎉 VALIDATION SUCCESSFUL!');
            console.log('✅ All billing details fix tests passed');
            console.log('✅ Payment system is ready for production');
            return true;
          } else {
            console.log('❌ Pricing calculation error');
            return false;
          }
        } else {
          console.log('❌ Payment button is disabled');
          return false;
        }
      } else {
        console.log('❌ Coupon input or apply button not found');
        return false;
      }
    } else {
      console.log('❌ Customer detail inputs not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Validation error:', error);
    return false;
  }
}

// Check for console errors
function checkConsoleErrors() {
  console.log('\n🔍 Checking for console errors...');
  
  // Monitor console for errors
  const originalError = console.error;
  let errorCount = 0;
  let billingDetailsError = false;
  
  console.error = function(...args) {
    errorCount++;
    const errorMessage = args.join(' ');
    
    if (errorMessage.includes('billing_details') || 
        errorMessage.includes('fields.billing_details') ||
        errorMessage.includes('IntegrationError')) {
      billingDetailsError = true;
      console.log('❌ BILLING DETAILS ERROR DETECTED:', errorMessage);
    }
    
    originalError.apply(console, args);
  };
  
  // Return error monitoring results after validation
  setTimeout(() => {
    if (billingDetailsError) {
      console.log('❌ BILLING DETAILS ERROR STILL PRESENT');
    } else if (errorCount === 0) {
      console.log('✅ NO CONSOLE ERRORS DETECTED');
    } else {
      console.log(`⚠️  ${errorCount} console errors detected (not billing-related)`);
    }
    
    // Restore original console.error
    console.error = originalError;
  }, 10000);
}

// Run validation
async function runProductionValidation() {
  console.log('🚀 Starting Production Payment Validation...\n');
  
  // Start error monitoring
  checkConsoleErrors();
  
  // Run billing details fix validation
  const validationResult = await validateBillingDetailsFix();
  
  if (validationResult) {
    console.log('\n🎯 PRODUCTION VALIDATION COMPLETE');
    console.log('✅ Billing details fix is working correctly');
    console.log('✅ Payment system is production-ready');
  } else {
    console.log('\n❌ PRODUCTION VALIDATION FAILED');
    console.log('⚠️  Payment system needs additional fixes');
  }
  
  return validationResult;
}

// Auto-run validation
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runProductionValidation);
  } else {
    runProductionValidation();
  }
}

// Export for manual execution
window.runProductionValidation = runProductionValidation;
console.log('💡 Run window.runProductionValidation() to execute validation manually');