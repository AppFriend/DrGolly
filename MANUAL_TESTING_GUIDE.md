# 🧪 MANUAL TESTING GUIDE - Credit Card Functionality & Profile Flows

## 🎯 Quick Start (5 Minutes)

### 1. Open Checkout Page
Navigate to: `http://localhost:5173/checkout-new/6`

### 2. Immediate Credit Card Test
- **Wait for page to load completely**
- **Click on card number field** → cursor should appear immediately
- **Type: `4242424242424242`** → numbers should appear as you type
- **Tab to expiry field** → type `12/25`
- **Tab to CVC field** → type `123`

**✅ PASS CRITERIA:** All fields accept input without issues

### 3. Coupon Application Test
- **Enter coupon code: `CHECKOUT-99`**
- **Click Apply Coupon**
- **Verify price changes from $120 to $1.20**
- **Click card number field again**
- **Type additional digits**

**✅ PASS CRITERIA:** Card field remains fully interactive after coupon application

---

## 📋 Comprehensive Test Matrix

### Test Scenario A: No Coupon (Full Price)

**Setup:**
- Product: Big Baby Sleep Program ($120)
- User: New email address
- Payment: Full $120

**Steps:**
1. Navigate to checkout-new/6
2. Fill customer details with new email
3. Fill all card fields (4242424242424242, 12/25, 123)
4. Complete checkout without coupon
5. Verify redirect to profile completion page
6. Complete profile form
7. Verify redirect to /home
8. Check course appears under "Purchased" tab

**Expected Results:**
- ✅ Card fields fully interactive
- ✅ Payment processes $120
- ✅ New user profile created
- ✅ Course added to purchases
- ✅ User logged in and on /home

### Test Scenario B: Partial Discount Coupon

**Setup:**
- Same as Scenario A
- Apply coupon for partial discount

**Additional Steps:**
- Apply coupon before payment
- Verify reduced price calculation
- Complete payment with discounted amount

### Test Scenario C: 99% Discount Coupon

**Setup:**
- Product: Big Baby Sleep Program ($120)
- Coupon: CHECKOUT-99 (99% discount)
- Final price: $1.20

**Steps:**
1. Navigate to checkout-new/6
2. Apply coupon CHECKOUT-99
3. Verify price changes to $1.20
4. Fill customer details
5. **CRITICAL:** Click each card field and verify interaction
6. Complete payment for $1.20
7. Verify checkout completion

**Expected Results:**
- ✅ Price correctly shows $1.20
- ✅ Card fields remain fully clickable after coupon
- ✅ Payment processes $1.20 (not $120)
- ✅ Profile flow completes correctly

### Test Scenario D: Existing User Flow

**Setup:**
- Use existing email: tech@drgolly.com
- Any discount level

**Steps:**
1. Enter existing email in customer details
2. Complete checkout process
3. Verify automatic login (no profile form)
4. Verify redirect to /home
5. Check course added to existing purchases

**Expected Results:**
- ✅ No duplicate user creation
- ✅ Auto-login after purchase
- ✅ Course added to existing account
- ✅ All existing data preserved

---

## 🔍 Detailed Validation Checklist

### Credit Card Field Validation
- [ ] Card number field visible and styled correctly
- [ ] Field accepts click and shows cursor
- [ ] Field accepts keyboard input (digits appear)
- [ ] Field maintains focus when typing
- [ ] Expiry field accepts MM/YY format
- [ ] CVC field accepts 3-digit codes
- [ ] No console errors during interaction
- [ ] Fields work on mobile viewport
- [ ] Fields remain interactive after price changes

### Coupon System Validation
- [ ] Coupon input field accepts text
- [ ] Apply button triggers validation
- [ ] Valid coupons update price display
- [ ] Invalid coupons show error messages
- [ ] Price calculations are mathematically correct
- [ ] Payment intent updates with discounted amount
- [ ] Card fields remain interactive after coupon application

### Profile Flow Validation
- [ ] New email triggers profile completion form
- [ ] Existing email triggers auto-login
- [ ] Profile form accepts all required data
- [ ] User session persists after completion
- [ ] Redirect to /home works correctly
- [ ] Course appears in user's purchased list
- [ ] No duplicate users created

### Payment Processing Validation
- [ ] Payment intent creation succeeds
- [ ] Stripe processes payment correctly
- [ ] Transaction amount matches displayed price
- [ ] Success confirmation appears
- [ ] User receives purchase confirmation
- [ ] Database updates with purchase record
- [ ] Slack notifications sent correctly

---

## 🚨 Critical Issues to Watch For

### Previously Fixed Issues (Should NOT Occur)
- ❌ Card field appears but won't accept clicks
- ❌ Field loses focus immediately after clicking
- ❌ Invisible overlay blocking interaction
- ❌ Coupon application breaks field interaction
- ❌ Z-index conflicts preventing access

### Payment Amount Issues (Should NOT Occur)
- ❌ Coupon applied but charged full price
- ❌ Wrong currency charged (USD vs AUD)
- ❌ NaN or undefined prices displayed
- ❌ Payment intent creation failures

### Profile Flow Issues (Should NOT Occur)
- ❌ Duplicate user accounts created
- ❌ Profile data not saving correctly
- ❌ Session not persisting after checkout
- ❌ Wrong redirect destinations

---

## 🖥️ Browser Console Debugging

### If Card Fields Not Working:
```javascript
// Check Stripe elements
document.querySelectorAll('.__PrivateStripeElement').forEach(el => {
  console.log('Element:', el);
  console.log('Pointer Events:', getComputedStyle(el).pointerEvents);
  console.log('Z-Index:', getComputedStyle(el).zIndex);
});

// Test click programmatically
const cardField = document.querySelector('.__PrivateStripeElement');
if (cardField) {
  cardField.click();
  console.log('Card field clicked');
}
```

### Check for Overlays:
```javascript
const cardContainer = document.querySelector('.StripeElement');
if (cardContainer) {
  const rect = cardContainer.getBoundingClientRect();
  const elementAtPoint = document.elementFromPoint(
    rect.left + rect.width/2, 
    rect.top + rect.height/2
  );
  console.log('Element at card center:', elementAtPoint);
}
```

---

## ⏱️ Test Timing

- **Quick validation:** 5 minutes
- **Single scenario:** 10 minutes  
- **Full test matrix:** 30 minutes
- **Comprehensive validation:** 45 minutes

---

## 📊 Success Criteria Summary

**100% MUST PASS:**
- ✅ Credit card fields clickable in all scenarios
- ✅ Payment processing works at all discount levels
- ✅ New users: Profile created → Logged in → Course purchased
- ✅ Existing users: Auto-login → Course added → No duplicates
- ✅ Users redirect to /home with persistent session
- ✅ Zero console errors during checkout flow

**DEPLOYMENT READY WHEN:**
All test scenarios pass with 100% success rate and no critical issues identified.