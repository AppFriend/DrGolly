/**
 * Pixel Tracking Page-Specific Testing Script
 * Tests tracking on /home, /login, and /checkout pages
 */

console.log('🧪 Starting Page-Specific Pixel Tracking Tests...\n');

// Test Results Container
const testResults = {
  pageTests: [],
  trackingEvents: [],
  errors: [],
  warnings: []
};

// Helper function to wait for elements to load
const waitForElement = (selector, timeout = 5000) => {
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
};

// Helper function to test pixel loading on current page
const testPixelsOnCurrentPage = (pageName) => {
  console.log(`\n📍 Testing ${pageName} Page...`);
  
  // Check if tracking pixels are loaded
  const pixelChecks = [
    { name: 'Google Ads', check: () => window.gtag && window.dataLayer },
    { name: 'Pinterest', check: () => window.pintrk },
    { name: 'TikTok', check: () => window.ttq },
    { name: 'LinkedIn', check: () => window.lintrk },
    { name: 'Meta', check: () => window.fbq },
    { name: 'Reddit', check: () => window.rdt }
  ];
  
  let loadedPixels = 0;
  pixelChecks.forEach(pixel => {
    if (pixel.check()) {
      testResults.pageTests.push(`✅ ${pageName} - ${pixel.name} loaded`);
      loadedPixels++;
    } else {
      testResults.errors.push(`❌ ${pageName} - ${pixel.name} not loaded`);
    }
  });
  
  // Test page view tracking
  try {
    if (window.trackPageView) {
      window.trackPageView(window.location.pathname);
      testResults.trackingEvents.push(`✅ ${pageName} - Page view tracked`);
    } else {
      testResults.warnings.push(`⚠️ ${pageName} - trackPageView function not available`);
    }
  } catch (error) {
    testResults.errors.push(`❌ ${pageName} - Page view tracking failed: ${error.message}`);
  }
  
  return loadedPixels;
};

// Test Home Page Tracking
const testHomePage = async () => {
  if (window.location.pathname === '/' || window.location.pathname === '/home') {
    const loadedPixels = testPixelsOnCurrentPage('Home');
    
    // Test home page specific tracking
    try {
      // Simulate page engagement
      if (window.fbq) {
        window.fbq('track', 'ViewContent', {
          content_type: 'page',
          content_name: 'Home Page'
        });
        testResults.trackingEvents.push('✅ Home - Content view tracked (Meta)');
      }
      
      if (window.ttq) {
        window.ttq.track('ViewContent', {
          content_type: 'page'
        });
        testResults.trackingEvents.push('✅ Home - Content view tracked (TikTok)');
      }
    } catch (error) {
      testResults.errors.push(`❌ Home - Content tracking failed: ${error.message}`);
    }
    
    return loadedPixels;
  }
  return null;
};

// Test Login Page Tracking
const testLoginPage = async () => {
  if (window.location.pathname === '/login') {
    const loadedPixels = testPixelsOnCurrentPage('Login');
    
    // Test login page specific tracking
    try {
      // Look for login form
      const loginForm = document.querySelector('form[action*="login"], form:has(input[type="password"]), .login-form');
      if (loginForm) {
        testResults.pageTests.push('✅ Login - Login form detected');
        
        // Test form interaction tracking
        if (window.fbq) {
          window.fbq('track', 'InitiateCheckout', {
            content_category: 'login_form'
          });
          testResults.trackingEvents.push('✅ Login - Form interaction tracked (Meta)');
        }
      } else {
        testResults.warnings.push('⚠️ Login - No login form detected');
      }
    } catch (error) {
      testResults.errors.push(`❌ Login - Form tracking failed: ${error.message}`);
    }
    
    return loadedPixels;
  }
  return null;
};

// Test Checkout Page Tracking
const testCheckoutPage = async () => {
  if (window.location.pathname.includes('/checkout') || window.location.pathname.includes('/big-baby-public')) {
    const loadedPixels = testPixelsOnCurrentPage('Checkout');
    
    // Test checkout page specific tracking
    try {
      // Look for payment elements
      const paymentElements = document.querySelectorAll(
        '[data-stripe], .payment-form, #payment-element, .StripeElement, input[name*="card"], button[type="submit"]:has-text("pay"), button:contains("Place order")'
      );
      
      if (paymentElements.length > 0) {
        testResults.pageTests.push(`✅ Checkout - ${paymentElements.length} payment elements detected`);
      } else {
        testResults.warnings.push('⚠️ Checkout - No payment elements detected');
      }
      
      // Test checkout initiation tracking
      if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          content_type: 'product',
          value: 100,
          currency: 'USD'
        });
        testResults.trackingEvents.push('✅ Checkout - Initiate checkout tracked (Meta)');
      }
      
      if (window.gtag) {
        window.gtag('event', 'begin_checkout', {
          currency: 'USD',
          value: 100,
          items: [{
            item_id: 'big_baby_course',
            item_name: 'Big Baby Sleep Course',
            price: 100,
            quantity: 1
          }]
        });
        testResults.trackingEvents.push('✅ Checkout - Begin checkout tracked (Google)');
      }
      
      if (window.pintrk) {
        window.pintrk('track', 'checkout', {
          value: 100,
          currency: 'USD'
        });
        testResults.trackingEvents.push('✅ Checkout - Checkout tracked (Pinterest)');
      }
      
      if (window.ttq) {
        window.ttq.track('PlaceAnOrder', {
          value: 100,
          currency: 'USD'
        });
        testResults.trackingEvents.push('✅ Checkout - Order placed tracked (TikTok)');
      }
      
    } catch (error) {
      testResults.errors.push(`❌ Checkout - Tracking failed: ${error.message}`);
    }
    
    return loadedPixels;
  }
  return null;
};

// Test Purchase Completion Tracking
const testPurchaseTracking = () => {
  console.log('\n💳 Testing Purchase Completion Tracking...');
  
  try {
    if (window.trackPurchase) {
      // Simulate purchase completion
      window.trackPurchase({
        value: 120,
        currency: 'AUD',
        transactionId: 'test_' + Date.now(),
        content_ids: ['big_baby_course'],
        content_type: 'product',
        product_name: 'Big Baby Sleep Course'
      });
      testResults.trackingEvents.push('✅ Purchase - Comprehensive purchase tracking test completed');
    } else {
      testResults.errors.push('❌ Purchase - trackPurchase function not available');
    }
  } catch (error) {
    testResults.errors.push(`❌ Purchase - Purchase tracking failed: ${error.message}`);
  }
};

// Test Signup Tracking
const testSignupTracking = () => {
  console.log('\n👤 Testing Signup Tracking...');
  
  try {
    if (window.trackSignUp) {
      // Simulate signup completion
      window.trackSignUp({
        email: 'test@example.com',
        firstName: 'Test',
        signupSource: 'Web App Test'
      });
      testResults.trackingEvents.push('✅ Signup - Comprehensive signup tracking test completed');
    } else {
      testResults.errors.push('❌ Signup - trackSignUp function not available');
    }
  } catch (error) {
    testResults.errors.push(`❌ Signup - Signup tracking failed: ${error.message}`);
  }
};

// Check for tracking utility availability
const testTrackingUtilities = () => {
  console.log('\n🛠️ Testing Tracking Utilities...');
  
  const utilities = [
    'initAllTracking',
    'trackPageView', 
    'trackSignUp',
    'trackPurchase'
  ];
  
  utilities.forEach(utility => {
    if (window[utility]) {
      testResults.pageTests.push(`✅ Utility - ${utility} available`);
    } else {
      testResults.warnings.push(`⚠️ Utility - ${utility} not globally available`);
    }
  });
};

// Main test execution
const runPageSpecificTests = async () => {
  console.log('🎯 PIXEL TRACKING PAGE-SPECIFIC TESTS\n');
  console.log('Current page:', window.location.pathname);
  console.log('━'.repeat(60));
  
  // Test current page
  const currentPage = window.location.pathname;
  let pageTestResult = null;
  
  if (currentPage === '/' || currentPage === '/home') {
    pageTestResult = await testHomePage();
  } else if (currentPage === '/login') {
    pageTestResult = await testLoginPage();
  } else if (currentPage.includes('/checkout') || currentPage.includes('/big-baby-public')) {
    pageTestResult = await testCheckoutPage();
  } else {
    testResults.warnings.push(`⚠️ Current page (${currentPage}) is not a target test page`);
    testPixelsOnCurrentPage('Current');
  }
  
  // Test general tracking utilities
  testTrackingUtilities();
  testPurchaseTracking();
  testSignupTracking();
  
  // Display results
  console.log('\n🎯 PAGE-SPECIFIC TEST RESULTS\n');
  console.log('━'.repeat(60));
  
  console.log('\n✅ PAGE TESTS:');
  testResults.pageTests.forEach(test => console.log(test));
  
  console.log('\n📊 TRACKING EVENTS:');
  testResults.trackingEvents.forEach(event => console.log(event));
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    testResults.warnings.forEach(warning => console.log(warning));
  }
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    testResults.errors.forEach(error => console.log(error));
  }
  
  console.log('\n━'.repeat(60));
  
  const totalTests = testResults.pageTests.length + testResults.trackingEvents.length;
  const successRate = (totalTests / (totalTests + testResults.errors.length)) * 100;
  
  console.log(`📈 SUCCESS RATE: ${successRate.toFixed(1)}%`);
  console.log(`📍 CURRENT PAGE: ${currentPage}`);
  console.log(`🎯 PIXELS TESTED: ${pageTestResult || 'N/A'} platforms`);
  
  if (testResults.errors.length === 0) {
    console.log('🚀 PAGE TRACKING STATUS: FULLY OPERATIONAL');
  } else {
    console.log('🔧 PAGE TRACKING STATUS: NEEDS ATTENTION');
  }
  
  return {
    success: testResults.errors.length === 0,
    currentPage,
    pixelsLoaded: pageTestResult,
    tests: totalTests,
    errors: testResults.errors.length,
    warnings: testResults.warnings.length,
    details: testResults
  };
};

// Auto-run the tests
runPageSpecificTests();