# Klaviyo Integration Testing Guide

## Overview
This guide helps you test the comprehensive Klaviyo integration for Dr. Golly's platform, including purchase events, subscription events, and cart abandonment tracking.

## Prerequisites

1. **Environment Variables Set**: Ensure your `.env` file has:
   ```bash
   KLAVIYO_API_KEY=pk_your_api_key
   KLAVIYO_PURCHASE_EVENTS_ENABLED=true
   KLAVIYO_SUBSCRIPTION_EVENTS_ENABLED=true  
   KLAVIYO_CART_ABANDONED_ENABLED=true
   VITE_APP_URL=https://app.drgolly.com
   ```

2. **Klaviyo Account Access**: Access to the Klaviyo dashboard for event verification

## Test Scenarios

### 1. Purchase Event Testing

**Test Case**: Complete Course Purchase
1. Navigate to course checkout
2. Enter customer details and payment information
3. Complete payment successfully
4. **Expected Klaviyo Event**: "Placed Order"
   - Check Klaviyo dashboard > Activity Feed
   - Event should include:
     - Customer email and profile
     - Order total and currency
     - Product details (course name, category)
     - Payment method and Stripe payment intent ID

**Server Logs to Watch For**:
```
Course purchase record created successfully
Klaviyo purchase event sent successfully
```

### 2. Subscription Event Testing

**Test Case**: Start New Subscription
1. Navigate to subscription checkout (Gold/Platinum plan)
2. Enter payment details and complete subscription
3. **Expected Klaviyo Event**: "Subscription Started"  
   - Check Klaviyo dashboard for the event
   - Event should include:
     - Subscription plan and billing period
     - Amount and currency
     - Subscription dates and trial info
     - Stripe subscription ID

**Server Logs to Watch For**:
```
Subscription created: sub_xxxxxxxx
Klaviyo subscription started event sent successfully
```

### 3. Cart Abandonment Testing

**Test Case**: Add Items Without Checkout
1. Add course to cart
2. Wait 10 minutes without completing checkout
3. **Expected Klaviyo Event**: "Abandoned Checkout"
   - Event includes cart items and total
   - Customer profile created/updated
   - Abandonment timestamp recorded

**Test Case**: Remove Items from Cart
1. Add course to cart 
2. Remove course from cart
3. **Expected**: Updated cart event tracked

**Server Logs to Watch For**:
```
Cart updated for user: xxxx  
Klaviyo cart abandonment event sent successfully
```

## Monitoring and Validation

### 1. Server Logs
Monitor the application logs for Klaviyo integration messages:

**Successful Events**:
- `Klaviyo purchase event sent successfully`
- `Klaviyo subscription started event sent successfully`  
- `Klaviyo cart abandonment event sent successfully`

**Error Conditions**:
- `Failed to send Klaviyo purchase event: [error]`
- `Failed to send Klaviyo subscription started event: [error]`
- `Klaviyo worker queue error: [error]`

### 2. Klaviyo Dashboard Verification

**Activity Feed** (Real-time):
- Go to Klaviyo > Activity
- Filter by event type: "Placed Order", "Subscription Started", "Abandoned Checkout"
- Verify event data matches test transactions

**Profile Check**:
- Find customer profile in Klaviyo
- Verify custom properties are set correctly:
  - `subscription_tier`
  - `last_purchase_amount`  
  - `total_spent`
  - `cart_total`

### 3. Feature Flag Testing

Test feature flag controls:

1. **Disable Purchase Events**: Set `KLAVIYO_PURCHASE_EVENTS_ENABLED=false`
   - Complete purchase → No "Placed Order" event should appear
   - Server logs should show "Klaviyo purchase events disabled"

2. **Disable Subscription Events**: Set `KLAVIYO_SUBSCRIPTION_EVENTS_ENABLED=false`
   - Start subscription → No "Subscription Started" event should appear

3. **Disable Cart Events**: Set `KLAVIYO_CART_ABANDONED_ENABLED=false`
   - Cart updates → No abandonment tracking

## Error Testing

### 1. Invalid API Key
1. Set `KLAVIYO_API_KEY=invalid_key`
2. Trigger events → Should see authentication errors in logs
3. Application should continue working (non-blocking errors)

### 2. Network Issues
1. Block Klaviyo API access temporarily
2. Trigger events → Should see retry attempts in logs
3. Worker queue should handle retries automatically

### 3. Malformed Data
The integration includes data validation - malformed events should be caught and logged.

## Production Readiness Checklist

- [ ] All environment variables configured
- [ ] Feature flags set appropriately for production
- [ ] Test events appearing in production Klaviyo account
- [ ] Error monitoring set up for Klaviyo integration errors
- [ ] Rate limiting confirmed working (no 429 errors)
- [ ] Customer profiles syncing correctly
- [ ] Email flows triggered by events working as expected

## Troubleshooting Common Issues

**Events not appearing in Klaviyo**:
- Check API key permissions (needs Events: Write, Profiles: Read/Write)
- Verify feature flags are enabled
- Check server logs for error messages

**Customer profiles not found**:
- Events automatically create profiles if they don't exist
- Profiles are matched by email address
- Check email format and validation

**Rate limiting errors**:
- Integration includes automatic retry with backoff
- Monitor for 429 status codes in logs
- Consider reducing event frequency if needed

**Missing event data**:
- Events include fallbacks for missing data
- Check TypeScript schemas in `/integrations/klaviyo/schemas/`
- Verify data mapping in event handlers