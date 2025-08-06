/**
 * Conversion Tracking Validation Script
 * Validates that purchase and signup conversions are properly tracked
 */

console.log('🎯 CONVERSION TRACKING VALIDATION\n');

// Test conversion tracking effectiveness
const validateConversions = {
  testPurchaseConversion() {
    console.log('💳 Testing Purchase Conversion Tracking...');
    
    const results = [];
    const testPurchase = {
      value: 120,
      currency: 'AUD',
      transactionId: 'test_purchase_' + Date.now(),
      productId: 'big_baby_course',
      productName: 'Big Baby Sleep Course'
    };
    
    // Google Ads Conversion
    try {
      if (window.gtag) {
        window.gtag('event', 'conversion', {
          send_to: 'AW-389499988/Oe6QCJmi5P8BENSY3bkB',
          value: testPurchase.value,
          currency: testPurchase.currency,
          transaction_id: testPurchase.transactionId
        });
        results.push('✅ Google Ads - Purchase conversion sent');
      } else {
        results.push('❌ Google Ads - gtag not available');
      }
    } catch (error) {
      results.push(`❌ Google Ads - Error: ${error.message}`);
    }
    
    // Meta Pixel Purchase
    try {
      if (window.fbq) {
        window.fbq('track', 'Purchase', {
          value: testPurchase.value,
          currency: testPurchase.currency,
          content_ids: [testPurchase.productId],
          content_type: 'product',
          content_name: testPurchase.productName
        });
        results.push('✅ Meta Pixel - Purchase event sent');
      } else {
        results.push('❌ Meta Pixel - fbq not available');
      }
    } catch (error) {
      results.push(`❌ Meta Pixel - Error: ${error.message}`);
    }
    
    // Pinterest Conversion
    try {
      if (window.pintrk) {
        window.pintrk('track', 'checkout', {
          event_id: 'purchase_' + Date.now(),
          value: testPurchase.value,
          currency: testPurchase.currency,
          order_quantity: 1
        });
        results.push('✅ Pinterest - Checkout conversion sent');
      } else {
        results.push('❌ Pinterest - pintrk not available');
      }
    } catch (error) {
      results.push(`❌ Pinterest - Error: ${error.message}`);
    }
    
    // TikTok Conversion
    try {
      if (window.ttq) {
        window.ttq.track('CompletePayment', {
          value: testPurchase.value,
          currency: testPurchase.currency,
          content_type: 'product'
        });
        results.push('✅ TikTok - Payment completion sent');
      } else {
        results.push('❌ TikTok - ttq not available');
      }
    } catch (error) {
      results.push(`❌ TikTok - Error: ${error.message}`);
    }
    
    // LinkedIn Conversion
    try {
      if (window.lintrk) {
        window.lintrk('track', { conversion_id: testPurchase.transactionId });
        results.push('✅ LinkedIn - Conversion sent');
      } else {
        results.push('❌ LinkedIn - lintrk not available');
      }
    } catch (error) {
      results.push(`❌ LinkedIn - Error: ${error.message}`);
    }
    
    // Reddit Conversion
    try {
      if (window.rdt) {
        window.rdt('track', 'Purchase', {
          value: testPurchase.value,
          currency: testPurchase.currency
        });
        results.push('✅ Reddit - Purchase event sent');
      } else {
        results.push('❌ Reddit - rdt not available');
      }
    } catch (error) {
      results.push(`❌ Reddit - Error: ${error.message}`);
    }
    
    return results;
  },
  
  testSignupConversion() {
    console.log('\n👤 Testing Signup Conversion Tracking...');
    
    const results = [];
    const testSignup = {
      email: 'test@example.com',
      firstName: 'Test',
      eventId: 'signup_' + Date.now()
    };
    
    // Google Ads Signup Conversion
    try {
      if (window.gtag) {
        window.gtag('event', 'conversion', {
          send_to: 'AW-389499988/OswFCJr7icsaENSY3bkB'
        });
        results.push('✅ Google Ads - Signup conversion sent');
      } else {
        results.push('❌ Google Ads - gtag not available');
      }
    } catch (error) {
      results.push(`❌ Google Ads - Error: ${error.message}`);
    }
    
    // Meta Pixel Signup
    try {
      if (window.fbq) {
        window.fbq('track', 'CompleteRegistration', {
          content_name: 'Account Registration'
        });
        results.push('✅ Meta Pixel - Registration event sent');
      } else {
        results.push('❌ Meta Pixel - fbq not available');
      }
    } catch (error) {
      results.push(`❌ Meta Pixel - Error: ${error.message}`);
    }
    
    // Pinterest Signup
    try {
      if (window.pintrk) {
        window.pintrk('track', 'signup', {
          event_id: testSignup.eventId,
          lead_type: 'App'
        });
        results.push('✅ Pinterest - Signup event sent');
      } else {
        results.push('❌ Pinterest - pintrk not available');
      }
    } catch (error) {
      results.push(`❌ Pinterest - Error: ${error.message}`);
    }
    
    // TikTok Signup
    try {
      if (window.ttq) {
        window.ttq.track('CompleteRegistration', {
          content_type: 'registration'
        });
        results.push('✅ TikTok - Registration event sent');
      } else {
        results.push('❌ TikTok - ttq not available');
      }
    } catch (error) {
      results.push(`❌ TikTok - Error: ${error.message}`);
    }
    
    // Reddit Signup
    try {
      if (window.rdt) {
        window.rdt('track', 'SignUp', {
          item_type: 'account'
        });
        results.push('✅ Reddit - Signup event sent');
      } else {
        results.push('❌ Reddit - rdt not available');
      }
    } catch (error) {
      results.push(`❌ Reddit - Error: ${error.message}`);
    }
    
    return results;
  },
  
  validatePixelIntegration() {
    console.log('\n🔍 Validating Pixel Integration...');
    
    const results = [];
    const expectedPixels = [
      { name: 'Google Ads', check: () => window.gtag && window.dataLayer },
      { name: 'Meta Pixel', check: () => window.fbq },
      { name: 'Pinterest', check: () => window.pintrk },
      { name: 'TikTok', check: () => window.ttq },
      { name: 'LinkedIn', check: () => window.lintrk },
      { name: 'Reddit', check: () => window.rdt }
    ];
    
    expectedPixels.forEach(pixel => {
      if (pixel.check()) {
        results.push(`✅ ${pixel.name} - Pixel loaded and ready`);
      } else {
        results.push(`❌ ${pixel.name} - Pixel not loaded`);
      }
    });
    
    // Check for tracking utility functions
    const utilities = ['trackPurchase', 'trackSignUp', 'trackPageView', 'initAllTracking'];
    utilities.forEach(utility => {
      if (window[utility]) {
        results.push(`✅ Utility - ${utility} function available`);
      } else {
        results.push(`❌ Utility - ${utility} function missing`);
      }
    });
    
    return results;
  },
  
  runValidation() {
    console.log('🚀 Running Conversion Tracking Validation...\n');
    console.log('━'.repeat(60));
    
    const allResults = [];
    
    // Run all validation tests
    const integrationResults = this.validatePixelIntegration();
    const purchaseResults = this.testPurchaseConversion();
    const signupResults = this.testSignupConversion();
    
    allResults.push(...integrationResults, ...purchaseResults, ...signupResults);
    
    // Calculate success metrics
    const successful = allResults.filter(r => r.startsWith('✅')).length;
    const failed = allResults.filter(r => r.startsWith('❌')).length;
    const total = allResults.length;
    const successRate = (successful / total) * 100;
    
    // Display results
    console.log('\n🎯 CONVERSION TRACKING VALIDATION RESULTS');
    console.log('━'.repeat(60));
    
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Successful: ${successful}/${total}`);
    console.log(`❌ Failed: ${failed}/${total}`);
    console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
    
    console.log('\n📋 DETAILED RESULTS:');
    allResults.forEach(result => console.log(result));
    
    console.log('\n━'.repeat(60));
    
    if (failed === 0) {
      console.log('🎉 ALL CONVERSION TRACKING VALIDATED! Production ready.');
    } else if (successRate >= 80) {
      console.log('⚠️ Most tracking working. Minor issues to address.');
    } else {
      console.log('🔧 Significant tracking issues. Requires attention.');
    }
    
    // Page-specific recommendations
    const currentPage = window.location.pathname;
    console.log(`\n📍 Current Page: ${currentPage}`);
    
    if (currentPage === '/') {
      console.log('💡 Recommendation: Test signup flow and course engagement tracking');
    } else if (currentPage === '/login') {
      console.log('💡 Recommendation: Test login success events and user journey tracking');
    } else if (currentPage.includes('checkout')) {
      console.log('💡 Recommendation: Test complete purchase funnel from cart to completion');
    }
    
    return {
      successful,
      failed,
      total,
      successRate,
      currentPage,
      results: allResults
    };
  }
};

// Auto-run validation
validateConversions.runValidation();