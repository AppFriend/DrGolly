/**
 * Auto-Run Conversion Tests for Home, Login, and Checkout Pages
 * Paste this in browser console on any target page for immediate testing
 */

console.log('🎯 AUTO-RUNNING CONVERSION TESTS FOR KEY PAGES\n');

const autoTest = {
  currentPage: window.location.pathname,
  
  async runPageSpecificTests() {
    console.log(`📍 Current Page: ${this.currentPage}\n`);
    
    if (this.currentPage === '/' || this.currentPage === '/home') {
      return this.testHomePage();
    } else if (this.currentPage === '/login') {
      return this.testLoginPage();
    } else if (this.currentPage.includes('checkout') || this.currentPage.includes('big-baby-public')) {
      return this.testCheckoutPage();
    } else {
      console.log('⚠️ Not on a target test page. Running general pixel test...');
      return this.testGeneralPixels();
    }
  },
  
  testHomePage() {
    console.log('🏠 TESTING HOME PAGE CONVERSIONS...\n');
    const results = [];
    
    // Test all pixels loaded
    const pixels = [
      {name: 'Google Ads', check: () => window.gtag},
      {name: 'Meta Pixel', check: () => window.fbq},
      {name: 'Pinterest', check: () => window.pintrk},
      {name: 'TikTok', check: () => window.ttq},
      {name: 'LinkedIn', check: () => window.lintrk},
      {name: 'Reddit', check: () => window.rdt}
    ];
    
    pixels.forEach(pixel => {
      if (pixel.check()) {
        results.push(`✅ ${pixel.name} - Loaded and ready`);
      } else {
        results.push(`❌ ${pixel.name} - Not loaded`);
      }
    });
    
    // Test page engagement tracking
    try {
      if (window.fbq) {
        window.fbq('track', 'ViewContent', {
          content_type: 'page',
          content_name: 'Home Page'
        });
        results.push('✅ Meta - Home page engagement tracked');
      }
      
      if (window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: 'Home',
          page_location: window.location.href
        });
        results.push('✅ Google - Home page view tracked');
      }
      
      if (window.ttq) {
        window.ttq.track('ViewContent', {content_type: 'page'});
        results.push('✅ TikTok - Home content view tracked');
      }
      
    } catch (error) {
      results.push(`❌ Home tracking error: ${error.message}`);
    }
    
    return results;
  },
  
  testLoginPage() {
    console.log('🔑 TESTING LOGIN PAGE CONVERSIONS...\n');
    const results = [];
    
    // Test login intent tracking
    try {
      if (window.fbq) {
        window.fbq('track', 'Lead', {
          content_category: 'login_form'
        });
        results.push('✅ Meta - Login form lead tracked');
      }
      
      if (window.gtag) {
        window.gtag('event', 'login', {method: 'email'});
        results.push('✅ Google - Login attempt tracked');
      }
      
      if (window.pintrk) {
        window.pintrk('track', 'lead', {lead_type: 'Login'});
        results.push('✅ Pinterest - Login lead tracked');
      }
      
      if (window.ttq) {
        window.ttq.track('ClickButton', {content_type: 'login'});
        results.push('✅ TikTok - Login button tracked');
      }
      
    } catch (error) {
      results.push(`❌ Login tracking error: ${error.message}`);
    }
    
    return results;
  },
  
  testCheckoutPage() {
    console.log('💳 TESTING CHECKOUT PAGE CONVERSIONS...\n');
    const results = [];
    
    // Test checkout initiation
    try {
      const checkoutData = {
        value: 120,
        currency: 'AUD',
        content_ids: ['big_baby_course']
      };
      
      if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          content_type: 'product',
          ...checkoutData
        });
        results.push('✅ Meta - Checkout initiation tracked');
      }
      
      if (window.gtag) {
        window.gtag('event', 'begin_checkout', {
          currency: checkoutData.currency,
          value: checkoutData.value,
          items: [{
            item_id: 'big_baby_course',
            item_name: 'Big Baby Sleep Course',
            price: checkoutData.value,
            quantity: 1
          }]
        });
        results.push('✅ Google - Begin checkout tracked');
      }
      
      if (window.pintrk) {
        window.pintrk('track', 'checkout', checkoutData);
        results.push('✅ Pinterest - Checkout tracked');
      }
      
      if (window.ttq) {
        window.ttq.track('PlaceAnOrder', checkoutData);
        results.push('✅ TikTok - Place order tracked');
      }
      
      // Test purchase completion
      setTimeout(() => {
        this.testPurchaseCompletion();
      }, 1000);
      
    } catch (error) {
      results.push(`❌ Checkout tracking error: ${error.message}`);
    }
    
    return results;
  },
  
  testPurchaseCompletion() {
    console.log('\n💰 TESTING PURCHASE COMPLETION...\n');
    const results = [];
    
    const transactionId = 'test_purchase_' + Date.now();
    const purchaseData = {
      value: 120,
      currency: 'AUD',
      transactionId: transactionId
    };
    
    try {
      // Google Ads Purchase Conversion (specific conversion ID)
      if (window.gtag) {
        window.gtag('event', 'conversion', {
          send_to: 'AW-389499988/Oe6QCJmi5P8BENSY3bkB',
          value: purchaseData.value,
          currency: purchaseData.currency,
          transaction_id: purchaseData.transactionId
        });
        results.push('✅ Google Ads - Purchase conversion sent');
      }
      
      // Meta Purchase
      if (window.fbq) {
        window.fbq('track', 'Purchase', {
          value: purchaseData.value,
          currency: purchaseData.currency,
          content_ids: ['big_baby_course'],
          content_type: 'product'
        });
        results.push('✅ Meta - Purchase event sent');
      }
      
      // Pinterest Checkout Conversion
      if (window.pintrk) {
        window.pintrk('track', 'checkout', {
          event_id: 'purchase_' + Date.now(),
          value: purchaseData.value,
          currency: purchaseData.currency
        });
        results.push('✅ Pinterest - Purchase conversion sent');
      }
      
      // TikTok Purchase
      if (window.ttq) {
        window.ttq.track('CompletePayment', purchaseData);
        results.push('✅ TikTok - Payment completion sent');
      }
      
      // LinkedIn Conversion
      if (window.lintrk) {
        window.lintrk('track', {conversion_id: purchaseData.transactionId});
        results.push('✅ LinkedIn - Conversion sent');
      }
      
      // Reddit Purchase
      if (window.rdt) {
        window.rdt('track', 'Purchase', purchaseData);
        results.push('✅ Reddit - Purchase event sent');
      }
      
    } catch (error) {
      results.push(`❌ Purchase completion error: ${error.message}`);
    }
    
    console.log('💰 PURCHASE COMPLETION RESULTS:');
    results.forEach(result => console.log(result));
    
    return results;
  },
  
  testGeneralPixels() {
    console.log('🔍 TESTING GENERAL PIXEL LOADING...\n');
    const results = [];
    
    const pixels = [
      {name: 'Google Ads (gtag)', check: () => window.gtag && window.dataLayer},
      {name: 'Meta Pixel (fbq)', check: () => window.fbq},
      {name: 'Pinterest (pintrk)', check: () => window.pintrk},
      {name: 'TikTok (ttq)', check: () => window.ttq},
      {name: 'LinkedIn (lintrk)', check: () => window.lintrk},
      {name: 'Reddit (rdt)', check: () => window.rdt}
    ];
    
    pixels.forEach(pixel => {
      if (pixel.check()) {
        results.push(`✅ ${pixel.name} - Available`);
      } else {
        results.push(`❌ ${pixel.name} - Not found`);
      }
    });
    
    return results;
  },
  
  async runFullTest() {
    console.log('🚀 RUNNING FULL CONVERSION TEST SUITE...\n');
    console.log('━'.repeat(60));
    
    // Run page-specific tests
    const pageResults = await this.runPageSpecificTests();
    
    // Test tracking utilities
    const utilityResults = [];
    const utilities = ['trackPurchase', 'trackSignUp', 'trackPageView', 'initAllTracking'];
    utilities.forEach(utility => {
      if (window[utility]) {
        utilityResults.push(`✅ ${utility} - Function available`);
      } else {
        utilityResults.push(`❌ ${utility} - Function missing`);
      }
    });
    
    // Combine all results
    const allResults = [...pageResults, ...utilityResults];
    
    // Calculate metrics
    const successful = allResults.filter(r => r.startsWith('✅')).length;
    const failed = allResults.filter(r => r.startsWith('❌')).length;
    const total = allResults.length;
    const successRate = (successful / total) * 100;
    
    // Display results
    console.log('\n🎯 CONVERSION TEST RESULTS');
    console.log('━'.repeat(60));
    
    console.log(`\n📍 Page: ${this.currentPage}`);
    console.log(`📊 Success Rate: ${successRate.toFixed(1)}% (${successful}/${total})`);
    
    console.log('\n📋 DETAILED RESULTS:');
    allResults.forEach(result => console.log(result));
    
    console.log('\n━'.repeat(60));
    
    if (successRate === 100) {
      console.log('🎉 PERFECT! All conversion tracking working.');
    } else if (successRate >= 80) {
      console.log('✅ GOOD! Most tracking working, minor issues.');
    } else {
      console.log('⚠️ ATTENTION NEEDED! Multiple tracking issues detected.');
    }
    
    // Provide next steps
    console.log('\n💡 NEXT STEPS:');
    if (this.currentPage === '/') {
      console.log('- Test navigation to checkout pages');
      console.log('- Monitor course engagement tracking');
    } else if (this.currentPage === '/login') {
      console.log('- Test actual login flow');
      console.log('- Verify user journey continues to checkout');
    } else if (this.currentPage.includes('checkout')) {
      console.log('- Complete actual purchase to test real conversions');
      console.log('- Verify transaction IDs and values are accurate');
    }
    
    return {
      page: this.currentPage,
      successRate,
      successful,
      failed,
      total,
      results: allResults
    };
  }
};

// Auto-run the test
autoTest.runFullTest();