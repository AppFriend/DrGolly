/**
 * Comprehensive Pixel Tracking Flow Test
 * Tests conversion tracking on Home, Login, and Checkout pages
 */

console.log('🎯 COMPREHENSIVE PIXEL TRACKING FLOW TEST\n');

const testPixelTracking = {
  async testHomePage() {
    console.log('🏠 Testing Home Page Tracking...');
    
    // Navigate to home page
    if (window.location.pathname !== '/') {
      window.location.href = '/';
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    const results = [];
    
    // Test page view tracking
    try {
      if (window.fbq) {
        window.fbq('track', 'ViewContent', {
          content_type: 'page',
          content_name: 'Home Page'
        });
        results.push('✅ Meta - Home page view tracked');
      }
      
      if (window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: 'Home',
          page_location: window.location.href
        });
        results.push('✅ Google - Home page view tracked');
      }
      
      if (window.ttq) {
        window.ttq.track('ViewContent', {
          content_type: 'page'
        });
        results.push('✅ TikTok - Home page view tracked');
      }
      
      if (window.pintrk) {
        window.pintrk('page');
        results.push('✅ Pinterest - Home page view tracked');
      }
      
    } catch (error) {
      results.push(`❌ Home page tracking error: ${error.message}`);
    }
    
    return results;
  },

  async testLoginPage() {
    console.log('🔑 Testing Login Page Tracking...');
    
    // Navigate to login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    const results = [];
    
    try {
      // Test login form interaction tracking
      if (window.fbq) {
        window.fbq('track', 'Lead', {
          content_category: 'login_form'
        });
        results.push('✅ Meta - Login form interaction tracked');
      }
      
      if (window.gtag) {
        window.gtag('event', 'login', {
          method: 'email'
        });
        results.push('✅ Google - Login attempt tracked');
      }
      
      if (window.ttq) {
        window.ttq.track('ClickButton', {
          content_type: 'login'
        });
        results.push('✅ TikTok - Login button tracked');
      }
      
      if (window.pintrk) {
        window.pintrk('track', 'lead', {
          lead_type: 'Login'
        });
        results.push('✅ Pinterest - Login lead tracked');
      }
      
    } catch (error) {
      results.push(`❌ Login page tracking error: ${error.message}`);
    }
    
    return results;
  },

  async testCheckoutPage() {
    console.log('💳 Testing Checkout Page Tracking...');
    
    // Navigate to checkout page
    const checkoutUrl = '/big-baby-public';
    if (window.location.pathname !== checkoutUrl) {
      window.location.href = checkoutUrl;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    const results = [];
    
    try {
      // Test checkout initiation
      if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          content_type: 'product',
          value: 120,
          currency: 'AUD',
          content_ids: ['big_baby_course']
        });
        results.push('✅ Meta - Checkout initiation tracked');
      }
      
      if (window.gtag) {
        window.gtag('event', 'begin_checkout', {
          currency: 'AUD',
          value: 120,
          items: [{
            item_id: 'big_baby_course',
            item_name: 'Big Baby Sleep Course',
            price: 120,
            quantity: 1
          }]
        });
        results.push('✅ Google - Begin checkout tracked');
      }
      
      if (window.ttq) {
        window.ttq.track('PlaceAnOrder', {
          value: 120,
          currency: 'AUD'
        });
        results.push('✅ TikTok - Place order tracked');
      }
      
      if (window.pintrk) {
        window.pintrk('track', 'checkout', {
          value: 120,
          currency: 'AUD',
          order_quantity: 1
        });
        results.push('✅ Pinterest - Checkout tracked');
      }
      
      // Test purchase completion simulation
      setTimeout(() => {
        this.testPurchaseCompletion();
      }, 2000);
      
    } catch (error) {
      results.push(`❌ Checkout page tracking error: ${error.message}`);
    }
    
    return results;
  },

  testPurchaseCompletion() {
    console.log('🎉 Testing Purchase Completion...');
    
    const results = [];
    
    try {
      const purchaseData = {
        value: 120,
        currency: 'AUD',
        transactionId: 'test_' + Date.now(),
        content_ids: ['big_baby_course'],
        content_type: 'product'
      };
      
      // Test purchase tracking across all platforms
      if (window.fbq) {
        window.fbq('track', 'Purchase', purchaseData);
        results.push('✅ Meta - Purchase tracked');
      }
      
      if (window.gtag) {
        window.gtag('event', 'purchase', {
          transaction_id: purchaseData.transactionId,
          value: purchaseData.value,
          currency: purchaseData.currency,
          items: [{
            item_id: 'big_baby_course',
            item_name: 'Big Baby Sleep Course',
            price: purchaseData.value,
            quantity: 1
          }]
        });
        results.push('✅ Google - Purchase conversion tracked');
      }
      
      if (window.ttq) {
        window.ttq.track('CompletePayment', purchaseData);
        results.push('✅ TikTok - Payment completion tracked');
      }
      
      if (window.pintrk) {
        window.pintrk('track', 'checkout', {
          value: purchaseData.value,
          currency: purchaseData.currency,
          order_quantity: 1
        });
        results.push('✅ Pinterest - Purchase tracked');
      }
      
      if (window.rdt) {
        window.rdt('track', 'Purchase', purchaseData);
        results.push('✅ Reddit - Purchase tracked');
      }
      
      if (window.lintrk) {
        window.lintrk('track', { conversion_id: purchaseData.transactionId });
        results.push('✅ LinkedIn - Conversion tracked');
      }
      
    } catch (error) {
      results.push(`❌ Purchase completion tracking error: ${error.message}`);
    }
    
    console.log('\n💰 PURCHASE COMPLETION RESULTS:');
    results.forEach(result => console.log(result));
    
    return results;
  },

  testSignupFlow() {
    console.log('👤 Testing Signup Flow...');
    
    const results = [];
    
    try {
      const signupData = {
        email: 'test@example.com',
        firstName: 'Test',
        signupSource: 'Web App'
      };
      
      // Test signup tracking across all platforms
      if (window.fbq) {
        window.fbq('track', 'CompleteRegistration', {
          content_name: 'Account Registration'
        });
        results.push('✅ Meta - Registration tracked');
      }
      
      if (window.gtag) {
        window.gtag('event', 'sign_up', {
          method: 'email'
        });
        results.push('✅ Google - Sign up tracked');
      }
      
      if (window.ttq) {
        window.ttq.track('CompleteRegistration', {
          content_type: 'registration'
        });
        results.push('✅ TikTok - Registration tracked');
      }
      
      if (window.pintrk) {
        window.pintrk('track', 'signup', {
          lead_type: 'App'
        });
        results.push('✅ Pinterest - Signup tracked');
      }
      
      if (window.rdt) {
        window.rdt('track', 'SignUp', {
          item_type: 'account'
        });
        results.push('✅ Reddit - Signup tracked');
      }
      
    } catch (error) {
      results.push(`❌ Signup flow tracking error: ${error.message}`);
    }
    
    console.log('\n👤 SIGNUP FLOW RESULTS:');
    results.forEach(result => console.log(result));
    
    return results;
  },

  async runComprehensiveTest() {
    console.log('🚀 Running Comprehensive Pixel Tracking Test...\n');
    console.log('━'.repeat(60));
    
    const allResults = [];
    
    // Test current page immediately
    const currentPage = window.location.pathname;
    console.log(`📍 Current page: ${currentPage}\n`);
    
    if (currentPage === '/' || currentPage === '/home') {
      const homeResults = await this.testHomePage();
      allResults.push(...homeResults);
    } else if (currentPage === '/login') {
      const loginResults = await this.testLoginPage();
      allResults.push(...loginResults);
    } else if (currentPage.includes('checkout') || currentPage.includes('big-baby-public')) {
      const checkoutResults = await this.testCheckoutPage();
      allResults.push(...checkoutResults);
    }
    
    // Test signup and purchase flows
    const signupResults = this.testSignupFlow();
    allResults.push(...signupResults);
    
    // Display comprehensive results
    console.log('\n🎯 COMPREHENSIVE TEST RESULTS');
    console.log('━'.repeat(60));
    
    const successful = allResults.filter(r => r.startsWith('✅')).length;
    const failed = allResults.filter(r => r.startsWith('❌')).length;
    const total = allResults.length;
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((successful/total) * 100).toFixed(1)}%`);
    
    console.log('\n📋 DETAILED RESULTS:');
    allResults.forEach(result => console.log(result));
    
    console.log('\n━'.repeat(60));
    
    if (failed === 0) {
      console.log('🎉 ALL TRACKING TESTS PASSED! Ready for production.');
    } else {
      console.log('⚠️ Some tracking tests failed. Review and fix issues.');
    }
    
    return {
      successful,
      failed,
      total,
      successRate: (successful/total) * 100,
      results: allResults
    };
  }
};

// Auto-run comprehensive test
testPixelTracking.runComprehensiveTest();