# Manual Conversion Testing Guide
## Pixel Tracking Validation for Home, Login & Checkout Pages

### 🎯 Testing Overview
This guide validates conversion tracking effectiveness on:
- **Home Page** (`/`) - Page views and engagement
- **Login Page** (`/login`) - Lead generation and user intent
- **Checkout Page** (`/big-baby-public`) - Purchase conversions

---

## 🏠 Home Page Testing (`/`)

### What to Test:
1. **Page View Tracking** - All 6 pixels should fire on page load
2. **Content Engagement** - User interaction with courses/content
3. **Navigation Intent** - Clicks to checkout or course pages

### Browser Console Tests:
```javascript
// Run this in browser console on home page:

// 1. Check pixel loading
console.log('Google Ads:', !!window.gtag);
console.log('Meta Pixel:', !!window.fbq);
console.log('Pinterest:', !!window.pintrk);
console.log('TikTok:', !!window.ttq);
console.log('LinkedIn:', !!window.lintrk);
console.log('Reddit:', !!window.rdt);

// 2. Test content engagement tracking
if (window.fbq) {
  window.fbq('track', 'ViewContent', {
    content_type: 'page',
    content_name: 'Home Page'
  });
  console.log('✅ Meta - Home content view tracked');
}

if (window.gtag) {
  window.gtag('event', 'page_view', {
    page_title: 'Home',
    page_location: window.location.href
  });
  console.log('✅ Google - Home page view tracked');
}
```

### Expected Results:
- ✅ All 6 pixels loaded: Google Ads, Meta, Pinterest, TikTok, LinkedIn, Reddit
- ✅ Page view events firing automatically
- ✅ Content engagement trackable

---

## 🔑 Login Page Testing (`/login`)

### What to Test:
1. **Lead Generation** - Form interactions and login attempts
2. **User Intent** - Signup vs login behavior
3. **Conversion Funnel** - Login success tracking

### Browser Console Tests:
```javascript
// Run this in browser console on login page:

// 1. Test login form interaction
if (window.fbq) {
  window.fbq('track', 'Lead', {
    content_category: 'login_form'
  });
  console.log('✅ Meta - Login form interaction tracked');
}

// 2. Test login attempt
if (window.gtag) {
  window.gtag('event', 'login', {
    method: 'email'
  });
  console.log('✅ Google - Login attempt tracked');
}

// 3. Test Pinterest lead tracking
if (window.pintrk) {
  window.pintrk('track', 'lead', {
    lead_type: 'Login'
  });
  console.log('✅ Pinterest - Login lead tracked');
}
```

### Manual Testing Steps:
1. Navigate to `/login`
2. Fill in email field - should trigger form interaction events
3. Click login button - should fire login attempt events
4. Check Network tab for pixel fires

### Expected Results:
- ✅ Form interaction events when typing in fields
- ✅ Login attempt tracking on button click
- ✅ Lead generation events for remarketing

---

## 💳 Checkout Page Testing (`/big-baby-public`)

### What to Test:
1. **Checkout Initiation** - Page load and form engagement
2. **Payment Process** - Purchase funnel tracking
3. **Conversion Completion** - Successful purchase events

### Browser Console Tests:
```javascript
// Run this in browser console on checkout page:

// 1. Test checkout initiation
if (window.fbq) {
  window.fbq('track', 'InitiateCheckout', {
    content_type: 'product',
    value: 120,
    currency: 'AUD',
    content_ids: ['big_baby_course']
  });
  console.log('✅ Meta - Checkout initiation tracked');
}

// 2. Test Google Ads begin checkout
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
  console.log('✅ Google - Begin checkout tracked');
}

// 3. Test purchase completion simulation
function testPurchaseCompletion() {
  const transactionId = 'test_' + Date.now();
  
  // Google Ads Purchase Conversion
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: 'AW-389499988/Oe6QCJmi5P8BENSY3bkB',
      value: 120,
      currency: 'AUD',
      transaction_id: transactionId
    });
    console.log('✅ Google Ads - Purchase conversion sent');
  }
  
  // Meta Purchase
  if (window.fbq) {
    window.fbq('track', 'Purchase', {
      value: 120,
      currency: 'AUD',
      content_ids: ['big_baby_course'],
      content_type: 'product'
    });
    console.log('✅ Meta - Purchase event sent');
  }
  
  // Pinterest Checkout
  if (window.pintrk) {
    window.pintrk('track', 'checkout', {
      value: 120,
      currency: 'AUD',
      order_quantity: 1
    });
    console.log('✅ Pinterest - Checkout conversion sent');
  }
}

// Run purchase test
testPurchaseCompletion();
```

### Manual Testing Steps:
1. Navigate to `/big-baby-public`
2. Fill in customer details - should trigger form events
3. Enter payment information - should fire checkout events
4. Complete purchase - should trigger all conversion pixels

### Expected Results:
- ✅ Checkout initiation when page loads
- ✅ Form progression tracking as user fills details
- ✅ Payment attempt tracking on submit
- ✅ Purchase conversion tracking on success

---

## 🧪 Comprehensive Validation Scripts

### Quick Pixel Check (Any Page):
```javascript
// Copy/paste this on any page to check pixel status
const pixels = [
  {name: 'Google Ads', loaded: !!window.gtag},
  {name: 'Meta Pixel', loaded: !!window.fbq},
  {name: 'Pinterest', loaded: !!window.pintrk},
  {name: 'TikTok', loaded: !!window.ttq},
  {name: 'LinkedIn', loaded: !!window.lintrk},
  {name: 'Reddit', loaded: !!window.rdt}
];

console.log('🎯 Pixel Status Check:');
pixels.forEach(p => {
  console.log(`${p.loaded ? '✅' : '❌'} ${p.name}: ${p.loaded ? 'Loaded' : 'Not Found'}`);
});

const loadedCount = pixels.filter(p => p.loaded).length;
console.log(`\n📊 Summary: ${loadedCount}/6 pixels loaded (${(loadedCount/6*100).toFixed(1)}%)`);
```

### Full Conversion Test:
```javascript
// Run the comprehensive validation script (already created)
// Load the script: validate_conversion_tracking.js
// This will test all conversion events across all platforms
```

---

## 🔍 Browser Developer Tools Verification

### Network Tab Verification:
1. Open Developer Tools (F12)
2. Go to Network tab
3. Reload page
4. Look for requests to these domains:
   - `googletagmanager.com` (Google Ads)
   - `connect.facebook.net` (Meta Pixel)
   - `pinimg.com` (Pinterest)
   - `analytics.tiktok.com` (TikTok)
   - `snap.licdn.com` (LinkedIn)
   - `redditstatic.com` (Reddit)

### Console Verification:
1. Check for tracking function availability:
   ```javascript
   console.log('Tracking functions available:');
   console.log('trackPurchase:', typeof window.trackPurchase);
   console.log('trackSignUp:', typeof window.trackSignUp);
   console.log('trackPageView:', typeof window.trackPageView);
   ```

2. Look for any JavaScript errors related to tracking
3. Verify CSP (Content Security Policy) allows all tracking domains

---

## 📱 Platform-Specific Verification Tools

### Meta Pixel Helper (Chrome Extension):
- Install Facebook Pixel Helper
- Should show green checkmark for active pixels
- Click for detailed event information

### Google Tag Assistant:
- Install Google Tag Assistant
- Should detect Google Ads tags
- Verify conversion tracking setup

### Pinterest Tag Helper:
- Use Pinterest browser debugger
- Verify Pinterest pixel is firing correctly

---

## 🎯 Success Criteria

### Home Page:
- [ ] All 6 pixels load within 3 seconds
- [ ] Page view events fire automatically
- [ ] Content engagement trackable
- [ ] No console errors

### Login Page:
- [ ] Form interaction events fire
- [ ] Login attempt tracking works
- [ ] Lead generation events active
- [ ] User journey trackable

### Checkout Page:
- [ ] Checkout initiation tracking
- [ ] Payment form progression tracking
- [ ] Purchase conversion events
- [ ] Transaction ID tracking
- [ ] Dynamic value/currency tracking

### Overall System:
- [ ] 100% pixel load success rate
- [ ] All conversion events fire correctly
- [ ] No JavaScript errors
- [ ] CSP policy allows all tracking
- [ ] Network requests succeed

---

## 🚨 Troubleshooting Common Issues

### Pixels Not Loading:
1. Check CSP policy in index.html
2. Verify network connectivity
3. Check for ad blockers
4. Inspect browser console for errors

### Events Not Firing:
1. Verify pixel functions exist (`window.fbq`, etc.)
2. Check event data format
3. Look for JavaScript errors
4. Test on different browsers

### Conversion Tracking Issues:
1. Verify conversion IDs are correct
2. Check transaction ID format
3. Ensure value/currency are valid
4. Test with platform debugging tools

---

This guide ensures comprehensive testing of all conversion tracking across your three key pages. Run these tests regularly to maintain tracking accuracy and troubleshoot any issues quickly.