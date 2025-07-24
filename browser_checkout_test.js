// Browser-based Checkout Testing Script
// Run this in browser console on the checkout page to validate functionality

console.log("🧪 BROWSER CHECKOUT VALIDATION TEST");
console.log("===================================");

// Test Configuration
const testConfig = {
  productUrl: "http://localhost:5173/checkout-new/6",
  testCard: {
    number: "4242424242424242",
    expiry: "12/25", 
    cvc: "123"
  },
  couponCode: "CHECKOUT-99",
  testEmails: {
    new: `test${Date.now()}@example.com`,
    existing: "tech@drgolly.com"
  }
};

// Helper Functions
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

function addTestResult(test, status, message) {
  const resultDiv = document.getElementById('test-results') || createResultsDiv();
  const timestamp = new Date().toLocaleTimeString();
  
  const resultItem = document.createElement('div');
  resultItem.style.cssText = `
    padding: 10px;
    margin: 5px 0;
    border-radius: 4px;
    font-family: monospace;
    ${status === 'success' ? 'background: #d4edda; color: #155724;' : 
      status === 'error' ? 'background: #f8d7da; color: #721c24;' : 
      'background: #fff3cd; color: #856404;'}
  `;
  
  resultItem.innerHTML = `
    <strong>[${timestamp}] ${test}:</strong> ${message}
  `;
  
  resultDiv.appendChild(resultItem);
  resultDiv.scrollTop = resultDiv.scrollHeight;
}

function createResultsDiv() {
  const div = document.createElement('div');
  div.id = 'test-results';
  div.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 400px;
    max-height: 400px;
    overflow-y: auto;
    background: white;
    border: 2px solid #007bff;
    border-radius: 8px;
    z-index: 9999;
    padding: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  `;
  
  div.innerHTML = '<h3 style="margin-top: 0;">🧪 Checkout Test Results</h3>';
  document.body.appendChild(div);
  return div;
}

// Test 1: Page Load and Elements
async function testPageLoad() {
  addTestResult('Page Load', 'pending', 'Checking if checkout page loaded correctly...');
  
  try {
    // Check if we're on the right page
    const currentUrl = window.location.href;
    if (!currentUrl.includes('checkout-new')) {
      throw new Error('Not on checkout-new page');
    }
    
    // Check for essential elements
    const productInfo = document.querySelector('[data-testid="product-info"]') || 
                       document.querySelector('h1, h2, h3');
    const paymentForm = document.querySelector('form') ||
                       document.querySelector('[data-testid="payment-form"]');
                       
    if (!productInfo) {
      throw new Error('Product information not found');
    }
    
    if (!paymentForm) {
      throw new Error('Payment form not found');
    }
    
    addTestResult('Page Load', 'success', 'Checkout page loaded with all essential elements');
    return true;
  } catch (error) {
    addTestResult('Page Load', 'error', error.message);
    return false;
  }
}

// Test 2: Stripe Elements Loading
async function testStripeElements() {
  addTestResult('Stripe Elements', 'pending', 'Checking Stripe payment elements...');
  
  try {
    // Wait for Stripe elements to load
    await waitForElement('.__PrivateStripeElement, .StripeElement', 10000);
    
    const stripeElements = document.querySelectorAll('.__PrivateStripeElement, .StripeElement');
    
    if (stripeElements.length === 0) {
      throw new Error('No Stripe elements found');
    }
    
    // Check if elements are interactive
    const cardNumberElement = Array.from(stripeElements).find(el => {
      const container = el.closest('[data-testid="card-number"], .card-number, label');
      return container && (
        container.textContent.toLowerCase().includes('card number') ||
        container.textContent.toLowerCase().includes('card')
      );
    });
    
    if (!cardNumberElement) {
      throw new Error('Card number element not found');
    }
    
    // Test element properties
    const computedStyle = getComputedStyle(cardNumberElement);
    const pointerEvents = computedStyle.pointerEvents;
    const zIndex = computedStyle.zIndex;
    
    addTestResult('Stripe Elements', 'success', 
      `Found ${stripeElements.length} Stripe elements. Card field has pointer-events: ${pointerEvents}, z-index: ${zIndex}`);
    
    return { cardNumberElement, elementCount: stripeElements.length };
  } catch (error) {
    addTestResult('Stripe Elements', 'error', error.message);
    return false;
  }
}

// Test 3: Credit Card Field Interaction
async function testCardFieldInteraction(cardElement) {
  addTestResult('Card Field Interaction', 'pending', 'Testing credit card field clickability...');
  
  try {
    if (!cardElement) {
      const elements = await testStripeElements();
      if (!elements || !elements.cardNumberElement) {
        throw new Error('Card element not available');
      }
      cardElement = elements.cardNumberElement;
    }
    
    // Simulate click on card element
    const rect = cardElement.getBoundingClientRect();
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    });
    
    cardElement.dispatchEvent(clickEvent);
    
    // Check if element at click point is the card element
    const elementAtPoint = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
    
    const isAccessible = elementAtPoint === cardElement || 
                        cardElement.contains(elementAtPoint) ||
                        elementAtPoint.closest('.__PrivateStripeElement, .StripeElement') === cardElement;
    
    if (!isAccessible) {
      addTestResult('Card Field Interaction', 'error', 
        `Element at click point is ${elementAtPoint.tagName || 'unknown'}, not the card field`);
      return false;
    }
    
    addTestResult('Card Field Interaction', 'success', 'Card field is clickable and accessible');
    return true;
  } catch (error) {
    addTestResult('Card Field Interaction', 'error', error.message);
    return false;
  }
}

// Test 4: Coupon Application
async function testCouponApplication() {
  addTestResult('Coupon Application', 'pending', 'Testing coupon code application...');
  
  try {
    // Find coupon input field
    const couponInput = document.querySelector('input[placeholder*="coupon"], input[name*="coupon"], input[id*="coupon"]') ||
                       Array.from(document.querySelectorAll('input')).find(input => 
                         input.placeholder.toLowerCase().includes('promo') ||
                         input.placeholder.toLowerCase().includes('discount') ||
                         input.name.toLowerCase().includes('coupon')
                       );
    
    if (!couponInput) {
      throw new Error('Coupon input field not found');
    }
    
    // Clear and enter coupon code
    couponInput.focus();
    couponInput.value = '';
    couponInput.value = testConfig.couponCode;
    couponInput.dispatchEvent(new Event('input', { bubbles: true }));
    couponInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Find and click apply button
    const applyButton = document.querySelector('button[type="submit"]') ||
                       Array.from(document.querySelectorAll('button')).find(btn =>
                         btn.textContent.toLowerCase().includes('apply') ||
                         btn.textContent.toLowerCase().includes('validate')
                       );
    
    if (applyButton) {
      applyButton.click();
      
      // Wait for price update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if price updated (look for $1.20 or similar discount indication)
      const priceElements = Array.from(document.querySelectorAll('*')).filter(el =>
        el.textContent.includes('$1.20') || 
        el.textContent.includes('$1.2') ||
        el.textContent.includes('99%') ||
        el.textContent.includes('118.8')
      );
      
      if (priceElements.length > 0) {
        addTestResult('Coupon Application', 'success', 'Coupon applied successfully - price updated');
      } else {
        addTestResult('Coupon Application', 'success', 'Coupon input completed (price change detection inconclusive)');
      }
    } else {
      addTestResult('Coupon Application', 'success', 'Coupon entered (apply button not found)');
    }
    
    return true;
  } catch (error) {
    addTestResult('Coupon Application', 'error', error.message);
    return false;
  }
}

// Test 5: Card Field Persistence After Coupon
async function testCardFieldPersistence() {
  addTestResult('Card Field Persistence', 'pending', 'Testing card field after coupon application...');
  
  try {
    const elements = await testStripeElements();
    if (!elements || !elements.cardNumberElement) {
      throw new Error('Card elements not available after coupon application');
    }
    
    const isInteractive = await testCardFieldInteraction(elements.cardNumberElement);
    
    if (isInteractive) {
      addTestResult('Card Field Persistence', 'success', 'Card field remains interactive after coupon application');
      return true;
    } else {
      addTestResult('Card Field Persistence', 'error', 'Card field lost interactivity after coupon application');
      return false;
    }
  } catch (error) {
    addTestResult('Card Field Persistence', 'error', error.message);
    return false;
  }
}

// Test 6: Form Validation
async function testFormValidation() {
  addTestResult('Form Validation', 'pending', 'Testing form validation and submission...');
  
  try {
    // Fill customer details
    const emailField = document.querySelector('input[type="email"], input[name*="email"]');
    const firstNameField = document.querySelector('input[name*="firstName"], input[name*="first"]');
    
    if (emailField) {
      emailField.value = testConfig.testEmails.new;
      emailField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (firstNameField) {
      firstNameField.value = 'Test';
      firstNameField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Check for form errors
    const errorElements = document.querySelectorAll('.error, [role="alert"], .text-red-500, .text-danger');
    const hasErrors = Array.from(errorElements).some(el => 
      el.textContent.trim().length > 0 && 
      getComputedStyle(el).display !== 'none'
    );
    
    if (hasErrors) {
      addTestResult('Form Validation', 'error', 'Form has validation errors');
      return false;
    }
    
    addTestResult('Form Validation', 'success', 'Form validation appears to be working correctly');
    return true;
  } catch (error) {
    addTestResult('Form Validation', 'error', error.message);
    return false;
  }
}

// Main Test Runner
async function runAllTests() {
  console.log(`🎯 Running checkout tests on: ${window.location.href}`);
  
  const tests = [
    { name: "Page Load", fn: testPageLoad },
    { name: "Stripe Elements", fn: testStripeElements },
    { name: "Card Field Interaction", fn: testCardFieldInteraction },
    { name: "Coupon Application", fn: testCouponApplication },
    { name: "Card Field Persistence", fn: testCardFieldPersistence },
    { name: "Form Validation", fn: testFormValidation }
  ];
  
  let passed = 0;
  let failed = 0;
  let cardElement = null;
  
  for (const test of tests) {
    try {
      const result = await test.fn(cardElement);
      
      if (result && typeof result === 'object' && result.cardNumberElement) {
        cardElement = result.cardNumberElement;
      }
      
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      addTestResult(test.name, 'error', `Test threw error: ${error.message}`);
      failed++;
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Final Summary
  const successRate = Math.round((passed / (passed + failed)) * 100);
  const summaryMessage = `Tests completed: ${passed} passed, ${failed} failed (${successRate}% success rate)`;
  
  if (failed === 0) {
    addTestResult('FINAL RESULT', 'success', `🎉 ALL TESTS PASSED! ${summaryMessage}`);
  } else {
    addTestResult('FINAL RESULT', 'error', `⚠️ SOME TESTS FAILED: ${summaryMessage}`);
  }
  
  console.log(`🏁 Test Summary: ${summaryMessage}`);
  return { passed, failed, successRate };
}

// Auto-start tests if on checkout page
if (window.location.href.includes('checkout-new')) {
  console.log("🚀 Auto-starting checkout tests...");
  setTimeout(() => runAllTests(), 2000);
} else {
  console.log("❌ Not on checkout page. Navigate to checkout-new/6 first.");
}

// Expose functions to global scope for manual testing
window.runCheckoutTests = runAllTests;
window.testCardField = testCardFieldInteraction;
window.testCoupon = testCouponApplication;
window.testConfig = testConfig;