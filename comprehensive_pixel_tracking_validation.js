/**
 * Comprehensive Pixel Tracking Validation Script
 * Run this in browser console to verify all tracking pixels are working
 */

console.log('🎯 Starting Comprehensive Pixel Tracking Validation...\n');

const results = {
  platforms: [],
  errors: [],
  warnings: []
};

// 1. Validate Google Ads
console.log('1️⃣ Checking Google Ads...');
if (window.gtag && window.dataLayer) {
  results.platforms.push('✅ Google Ads - gtag and dataLayer loaded');
  
  // Test conversion tracking
  try {
    window.gtag('event', 'test_conversion', {
      send_to: 'AW-389499988/OswFCJr7icsaENSY3bkB',
      debug_mode: true
    });
    results.platforms.push('   ↳ Sign-up conversion test sent');
    
    window.gtag('event', 'test_purchase', {
      send_to: 'AW-389499988/Oe6QCJmi5P8BENSY3bkB',
      value: 100.0,
      currency: 'AUD',
      debug_mode: true
    });
    results.platforms.push('   ↳ Purchase conversion test sent');
  } catch (error) {
    results.errors.push('❌ Google Ads conversion test failed: ' + error.message);
  }
} else {
  results.errors.push('❌ Google Ads - gtag or dataLayer not found');
}

// 2. Validate Pinterest
console.log('2️⃣ Checking Pinterest...');
if (window.pintrk) {
  results.platforms.push('✅ Pinterest - pintrk loaded');
  
  try {
    window.pintrk('track', 'signup', {
      event_id: 'test_signup_' + Date.now(),
      lead_type: 'App'
    });
    results.platforms.push('   ↳ Signup event test sent');
    
    window.pintrk('track', 'checkout', {
      event_id: 'test_purchase_' + Date.now(),
      value: 100,
      currency: 'USD'
    });
    results.platforms.push('   ↳ Purchase event test sent');
  } catch (error) {
    results.errors.push('❌ Pinterest event test failed: ' + error.message);
  }
} else {
  results.errors.push('❌ Pinterest - pintrk not found');
}

// 3. Validate TikTok
console.log('3️⃣ Checking TikTok...');
if (window.ttq) {
  results.platforms.push('✅ TikTok - ttq loaded');
  
  try {
    window.ttq.track('CompleteRegistration', {
      content_type: 'test',
      debug_mode: true
    });
    results.platforms.push('   ↳ Registration event test sent');
    
    window.ttq.track('CompletePayment', {
      value: 100,
      currency: 'USD',
      debug_mode: true
    });
    results.platforms.push('   ↳ Payment event test sent');
  } catch (error) {
    results.errors.push('❌ TikTok event test failed: ' + error.message);
  }
} else {
  results.errors.push('❌ TikTok - ttq not found');
}

// 4. Validate LinkedIn
console.log('4️⃣ Checking LinkedIn...');
if (window.lintrk) {
  results.platforms.push('✅ LinkedIn - lintrk loaded');
  
  try {
    window.lintrk('track', { conversion_id: 'test_conversion' });
    results.platforms.push('   ↳ Conversion event test sent');
  } catch (error) {
    results.errors.push('❌ LinkedIn event test failed: ' + error.message);
  }
} else {
  results.errors.push('❌ LinkedIn - lintrk not found');
}

// 5. Validate Meta (Facebook)
console.log('5️⃣ Checking Meta (Facebook)...');
if (window.fbq) {
  results.platforms.push('✅ Meta - fbq loaded');
  
  try {
    window.fbq('track', 'CompleteRegistration', {
      test_event_code: 'TEST12345'
    });
    results.platforms.push('   ↳ Registration event test sent');
    
    window.fbq('track', 'Purchase', {
      value: 100,
      currency: 'USD',
      test_event_code: 'TEST12345'
    });
    results.platforms.push('   ↳ Purchase event test sent');
  } catch (error) {
    results.errors.push('❌ Meta event test failed: ' + error.message);
  }
} else {
  results.errors.push('❌ Meta - fbq not found');
}

// 6. Validate Reddit
console.log('6️⃣ Checking Reddit...');
if (window.rdt) {
  results.platforms.push('✅ Reddit - rdt loaded');
  
  try {
    window.rdt('track', 'SignUp', {
      test: true
    });
    results.platforms.push('   ↳ Signup event test sent');
    
    window.rdt('track', 'Purchase', {
      value: 100,
      currency: 'USD',
      test: true
    });
    results.platforms.push('   ↳ Purchase event test sent');
  } catch (error) {
    results.errors.push('❌ Reddit event test failed: ' + error.message);
  }
} else {
  results.errors.push('❌ Reddit - rdt not found');
}

// 7. Check for network requests
console.log('7️⃣ Checking network requests...');
const performanceEntries = performance.getEntriesByType('resource');
const trackingDomains = [
  'googletagmanager.com',
  'pinimg.com',
  'analytics.tiktok.com',
  'snap.licdn.com',
  'connect.facebook.net',
  'redditstatic.com'
];

trackingDomains.forEach(domain => {
  const found = performanceEntries.some(entry => entry.name.includes(domain));
  if (found) {
    results.platforms.push(`✅ Network - ${domain} script loaded`);
  } else {
    results.warnings.push(`⚠️ Network - ${domain} script not detected`);
  }
});

// 8. Validate CSP compliance
console.log('8️⃣ Checking Content Security Policy...');
const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
if (metaCSP) {
  const cspContent = metaCSP.getAttribute('content');
  trackingDomains.forEach(domain => {
    if (cspContent.includes(domain)) {
      results.platforms.push(`✅ CSP - ${domain} allowed`);
    } else {
      results.warnings.push(`⚠️ CSP - ${domain} may not be allowed`);
    }
  });
} else {
  results.warnings.push('⚠️ CSP - No CSP meta tag found');
}

// 9. Test tracking utility functions
console.log('9️⃣ Testing tracking utility functions...');
if (window.initAllTracking && window.trackSignUp && window.trackPurchase) {
  results.platforms.push('✅ Tracking utilities - Functions available');
  
  try {
    // Test signup tracking
    window.trackSignUp({
      eventId: 'test_signup_utility_' + Date.now(),
      email: 'test@example.com'
    });
    results.platforms.push('   ↳ Signup utility test completed');
    
    // Test purchase tracking
    window.trackPurchase({
      value: 100,
      currency: 'USD',
      transactionId: 'test_' + Date.now()
    });
    results.platforms.push('   ↳ Purchase utility test completed');
  } catch (error) {
    results.errors.push('❌ Tracking utility test failed: ' + error.message);
  }
} else {
  results.warnings.push('⚠️ Tracking utilities - Not globally available');
}

// 10. Display comprehensive results
console.log('\n🎯 COMPREHENSIVE VALIDATION RESULTS\n');
console.log('━'.repeat(50));

console.log('\n✅ SUCCESSFULLY LOADED PLATFORMS:');
results.platforms.forEach(platform => console.log(platform));

if (results.warnings.length > 0) {
  console.log('\n⚠️ WARNINGS:');
  results.warnings.forEach(warning => console.log(warning));
}

if (results.errors.length > 0) {
  console.log('\n❌ ERRORS:');
  results.errors.forEach(error => console.log(error));
} else {
  console.log('\n🎉 NO CRITICAL ERRORS DETECTED!');
}

console.log('\n━'.repeat(50));

const successRate = (results.platforms.length / (results.platforms.length + results.errors.length)) * 100;
console.log(`📊 SUCCESS RATE: ${successRate.toFixed(1)}%`);

if (results.errors.length === 0) {
  console.log('🚀 TRACKING IMPLEMENTATION STATUS: READY FOR PRODUCTION');
} else {
  console.log('🔧 TRACKING IMPLEMENTATION STATUS: NEEDS ATTENTION');
}

// Return results for programmatic access
return {
  success: results.errors.length === 0,
  platforms: results.platforms.length,
  errors: results.errors.length,
  warnings: results.warnings.length,
  details: results
};