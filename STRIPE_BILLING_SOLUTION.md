# Stripe Billing Details Complete Solution

## Problem
When using `billingDetails: 'never'` in Stripe PaymentElement, ALL billing details fields must be provided in `confirmParams.payment_method_data.billing_details` when calling `stripe.confirmPayment()`.

## Required Fields (Complete List)
Based on Stripe's validation errors, the following fields are ALL required:

### Personal Details
- `name` (firstName + lastName)
- `email`
- `phone`

### Address Details
- `address.line1`
- `address.line2`
- `address.city`
- `address.postal_code`
- `address.state`
- `address.country`

## Solution Implementation

### 1. effectiveBillingDetails Object
```javascript
const effectiveBillingDetails = {
  firstName: billingDetails.firstName || customerDetails.firstName || '',
  lastName: billingDetails.lastName || 'Customer',
  phone: billingDetails.phone || '',
  address: billingDetails.address || '',
  addressLine2: billingDetails.addressLine2 || '',
  city: billingDetails.city || '',
  postcode: billingDetails.postcode || '',
  state: billingDetails.state || '',
  country: billingDetails.country || 'AU'
};
```

### 2. Complete billing_details in confirmPayment
```javascript
billing_details: {
  name: `${effectiveBillingDetails.firstName} ${effectiveBillingDetails.lastName}`,
  email: customerDetails.email,
  phone: effectiveBillingDetails.phone || '',
  address: {
    line1: effectiveBillingDetails.address || '',
    line2: effectiveBillingDetails.addressLine2 || '',
    city: effectiveBillingDetails.city || '',
    postal_code: effectiveBillingDetails.postcode || '',
    state: effectiveBillingDetails.state || '',
    country: effectiveBillingDetails.country
  }
}
```

## Key Points
1. **Never use `undefined`** - Always provide empty strings `''` for missing fields
2. **ALL fields are required** - Stripe validates every field when using `billingDetails: 'never'`
3. **Fallback values** - Use customer details where available, defaults where not
4. **Country code** - Default to 'AU' for Australia

## Implementation Status
✅ All required fields implemented in StableStripeElements.tsx
✅ Fallback system using customer details
✅ Empty string defaults for all missing fields
✅ Complete address structure with all sub-fields

## Testing
- Navigate to /big-baby-public
- Fill customer details (email, firstName)
- Apply coupon code
- Attempt payment processing
- Should no longer receive billing_details errors