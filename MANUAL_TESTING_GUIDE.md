# Manual Testing Guide - Public Checkout Experience

## 🎯 Testing Objectives

Validate the complete public checkout experience for product-based checkout links, ensuring seamless user flows for both new and existing customers.

## 📋 Test Environment

- **Base URL**: https://dr-golly.replit.app
- **Test Products**: 
  - Little Baby Sleep Program: `/checkout/5`
  - Big Baby Sleep Program: `/checkout/6`
- **Browser**: Test on mobile (iPhone/Android) and desktop
- **Network**: Test both Wi-Fi and mobile data

## 🧪 Test Scenarios

### Test Scenario 1: New User Flow (No Existing Profile)

**Objective**: New customer completes purchase and profile setup

**Steps**:
1. Navigate to `https://dr-golly.replit.app/checkout/6` (incognito/private mode)
2. Verify page loads without login requirement
3. Fill customer details with NEW email address
4. Apply test coupon if available 
5. Complete Stripe payment process
6. Verify redirect to `/complete` page
7. Complete profile setup (password, preferences)
8. Verify auto-login after profile completion
9. Verify redirect to `/home` with purchased course visible

**Expected Results**:
- ✅ Public checkout access without authentication
- ✅ Payment processes successfully 
- ✅ Redirect to `/complete` for profile setup
- ✅ Profile completion creates account
- ✅ Auto-login after profile setup
- ✅ Course appears in purchased courses on home page

### Test Scenario 2: Existing User Flow (Recognized Email)

**Objective**: Existing customer gets auto-authenticated after purchase

**Steps**:
1. Navigate to `https://dr-golly.replit.app/checkout/5` (incognito/private mode)
2. Fill customer details with EXISTING email (e.g., tech@drgolly.com)
3. Complete Stripe payment process
4. Verify direct redirect to `/home` (skip `/complete`)
5. Verify course added to existing purchased courses
6. Verify no duplicate user accounts created

**Expected Results**:
- ✅ Payment processes for existing email
- ✅ Auto-authentication after checkout
- ✅ Direct redirect to `/home` (no profile completion)
- ✅ Course added to existing user's purchased courses
- ✅ No account duplication

### Test Scenario 3: Mobile Responsiveness

**Objective**: Ensure optimal mobile experience

**Steps**:
1. Test checkout flow on iPhone/Android
2. Verify touch-friendly payment elements
3. Test Stripe payment methods (Apple Pay, Google Pay)
4. Verify form fields are easily accessible
5. Test coupon application on mobile

**Expected Results**:
- ✅ Mobile-optimized layout
- ✅ Touch-friendly interactions
- ✅ Express payment methods work
- ✅ Keyboard interactions smooth
- ✅ No horizontal scrolling issues

### Test Scenario 4: Edge Cases & Error Handling

**Objective**: Validate system resilience

**Test Cases**:
1. **Payment Failure**: Use Stripe test card that fails
2. **Network Issues**: Test during poor connectivity
3. **Session Expiry**: Leave checkout open for extended time
4. **Invalid Coupon**: Apply expired/invalid coupon codes
5. **Duplicate Email**: Attempt payment with same email twice
6. **Browser Refresh**: Refresh during payment process

**Expected Results**:
- ✅ Clear error messages for payment failures
- ✅ Graceful handling of network issues
- ✅ Session recovery mechanisms work
- ✅ Invalid coupon feedback is helpful
- ✅ No duplicate accounts for same email
- ✅ State recovery after browser refresh

## 🔍 Validation Checklist

### Page Accessibility
- [ ] `/checkout/5` loads publicly (no login required)
- [ ] `/checkout/6` loads publicly (no login required)
- [ ] `/complete` loads publicly for profile setup
- [ ] `/home` requires authentication (protected route)

### User Experience Flow
- [ ] New users: checkout → `/complete` → profile setup → `/home`
- [ ] Existing users: checkout → auto-login → `/home`
- [ ] Course appears in purchased courses after payment
- [ ] No account duplication with same email address

### Payment Processing
- [ ] Stripe payment elements load correctly
- [ ] Credit card payments process successfully
- [ ] Apple Pay/Google Pay work on mobile
- [ ] Coupon codes apply discounts correctly
- [ ] Payment confirmation received

### Technical Functionality
- [ ] Database `public_checkout_url` fields work correctly
- [ ] API endpoints respond appropriately
- [ ] Authentication states managed properly
- [ ] Session handling works across flows
- [ ] Error handling provides clear feedback

## 🚨 Critical Success Criteria

1. **Public Access**: Checkout pages must be accessible without login
2. **User Flow Logic**: New users go to `/complete`, existing users to `/home`
3. **No Duplicates**: Same email should not create multiple accounts
4. **Course Access**: Purchased courses appear immediately after payment
5. **Mobile Compatibility**: Full functionality on mobile devices

## 📊 Test Results Template

### Test Run: [Date/Time]
**Environment**: [Browser/Device]
**Tester**: [Name]

#### New User Flow
- Checkout Access: ✅/❌
- Payment Processing: ✅/❌
- Profile Completion: ✅/❌
- Course Access: ✅/❌

#### Existing User Flow
- Auto-Authentication: ✅/❌
- Direct Home Redirect: ✅/❌
- Course Addition: ✅/❌
- No Duplication: ✅/❌

#### Mobile Experience
- Layout Responsive: ✅/❌
- Touch Interactions: ✅/❌
- Express Payments: ✅/❌
- Performance: ✅/❌

#### Edge Cases
- Payment Failures: ✅/❌
- Network Issues: ✅/❌
- Invalid Coupons: ✅/❌
- Session Recovery: ✅/❌

### Overall Assessment
**Status**: ✅ PASS / ❌ FAIL / ⚠️ ISSUES FOUND  
**Notes**: [Any specific observations or issues]

## 🛠️ Troubleshooting

### Common Issues & Solutions

**Issue**: Checkout page redirects to login
- **Solution**: Verify routing configuration allows public access

**Issue**: Payment fails repeatedly
- **Solution**: Check Stripe keys and webhook configuration

**Issue**: Profile completion doesn't work
- **Solution**: Verify `/complete` route is publicly accessible

**Issue**: Duplicate accounts created
- **Solution**: Check email matching logic in user creation

**Issue**: Course doesn't appear after purchase
- **Solution**: Verify course purchase recording and display logic

## 📞 Support Information

If critical issues are found during testing:
1. Document the exact steps to reproduce
2. Capture screenshots/screen recordings
3. Note browser/device information
4. Include any console error messages
5. Test in different browsers to confirm scope