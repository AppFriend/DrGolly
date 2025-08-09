# Dr. Golly Klaviyo Integration

## Overview
Comprehensive Klaviyo integration for Dr. Golly's learning platform, providing robust event tracking, customer profiling, and marketing automation capabilities.

## Architecture

```
├── integrations/klaviyo/
│   ├── client.ts              # Main Klaviyo API client
│   ├── worker.ts              # Background job processing
│   ├── feature-flags.ts       # Configuration management
│   ├── events/                # Event-specific handlers
│   │   ├── purchase.ts        # Order completion events
│   │   ├── subscription_started.ts # Subscription events  
│   │   └── cart_abandoned.ts  # Cart abandonment tracking
│   ├── schemas/               # TypeScript type definitions
│   │   ├── purchase.ts        # Purchase event schemas
│   │   ├── subscription.ts    # Subscription event schemas
│   │   └── cart.ts           # Cart event schemas
│   └── server/integrations/
│       └── klaviyo-hooks.ts   # Route integration hooks
```

## Features

### 1. Purchase Tracking
- **Event**: "Placed Order"
- **Triggers**: Course purchases, one-time payments
- **Data**: Order total, items, payment method, customer details
- **Integration**: Stripe webhook handlers

### 2. Subscription Management  
- **Event**: "Subscription Started"
- **Triggers**: New subscription creation via Stripe
- **Data**: Plan tier, billing period, trial info, subscription dates
- **Integration**: Stripe subscription webhooks

### 3. Cart Abandonment
- **Event**: "Abandoned Checkout"  
- **Triggers**: Cart updates without purchase completion
- **Data**: Cart items, total value, abandonment timestamp
- **Integration**: Cart API endpoints

### 4. Customer Profiling
- **Automatic Profile Creation**: All events create/update Klaviyo profiles
- **Custom Properties**: Subscription tier, purchase history, cart data
- **Email Matching**: Profiles linked by email address

## Implementation

### Server Integration
Events are automatically triggered via hooks in `server/routes.ts`:

```typescript
import { onOrderCompleted, onSubscriptionStarted, onCartUpdated } from "./integrations/klaviyo-hooks";

// In payment completion route:
await onOrderCompleted({
  id: paymentIntentId,
  email: customerEmail,
  total: amount,
  items: orderItems
});
```

### Worker Queue
Background processing ensures reliability:
- **Non-blocking**: Main application flow never waits for Klaviyo
- **Retry Logic**: Automatic retries with exponential backoff  
- **Error Handling**: Failed events logged, don't break user flow

### Feature Flags
Granular control over event types:
```bash
KLAVIYO_PURCHASE_EVENTS_ENABLED=true
KLAVIYO_SUBSCRIPTION_EVENTS_ENABLED=true  
KLAVIYO_CART_ABANDONED_ENABLED=true
```

## Configuration

### Environment Variables
```bash
# Required
KLAVIYO_API_KEY=pk_your_klaviyo_private_key

# Feature Controls
KLAVIYO_PURCHASE_EVENTS_ENABLED=true
KLAVIYO_SUBSCRIPTION_EVENTS_ENABLED=true
KLAVIYO_CART_ABANDONED_ENABLED=true

# Optional
VITE_APP_URL=https://app.drgolly.com  # For cart abandonment links
```

### Klaviyo API Setup
1. Create Private API Key in Klaviyo dashboard
2. Required scopes:
   - **Events**: Write access (send events)
   - **Profiles**: Read/Write access (manage customers)

## Event Schemas

### Purchase Event
```typescript
{
  id: string;           // Order/Payment ID
  email: string;        // Customer email
  total: number;        // Order total
  currency: string;     // Currency code
  items: Array<{        // Purchased items
    id: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
  }>;
  paid_at: string;      // Purchase timestamp
  payment_method: string;
  stripe_payment_intent_id?: string;
}
```

### Subscription Event  
```typescript
{
  id: string;           // Subscription ID
  email: string;        // Customer email
  status: string;       // Subscription status
  plan: string;         // Plan tier (gold, platinum)
  billing_period: string; // month/year
  amount: number;       // Subscription amount
  currency: string;     // Currency code
  current_period_start: string;
  current_period_end: string;
  stripe_subscription_id: string;
  trial_end?: string;   // Trial end date if applicable
}
```

### Cart Event
```typescript
{
  email: string;        // Customer email
  total: number;        // Cart total
  currency: string;     // Currency code
  items: Array<{        // Cart items
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  abandoned_at: string; // Timestamp
  checkout_url?: string; // Recovery link
}
```

## Error Handling

### Non-Blocking Design
- Klaviyo failures never impact user experience
- All operations wrapped in try/catch blocks
- Errors logged but don't propagate to user

### Retry Strategy
- Failed events automatically retried
- Exponential backoff prevents API flooding
- Maximum retry attempts to prevent infinite loops

### Monitoring
- All Klaviyo operations logged with context
- Success/failure status clearly indicated  
- Error details captured for debugging

## Testing

### Development Testing
1. Set feature flags to `true` in development
2. Use test Klaviyo account for development events
3. Monitor server logs for integration success/failure
4. Check Klaviyo dashboard for event appearance

### Production Validation
1. Verify events appear in production Klaviyo account
2. Check customer profiles are created/updated correctly
3. Monitor error rates and retry patterns
4. Validate email flows triggered by events

## Security Considerations

### API Key Protection
- Private API key stored in environment variables
- Never exposed to client-side code
- Separate development/production keys recommended

### Data Privacy  
- Only necessary customer data sent to Klaviyo
- Email addresses used as primary identifiers
- Compliant with data protection requirements

### Rate Limiting
- Automatic retry handles Klaviyo rate limits
- Worker queue prevents request flooding
- Exponential backoff respects API constraints

## Maintenance

### Monitoring
- Watch server logs for Klaviyo integration errors
- Monitor Klaviyo dashboard for event volumes
- Check feature flag effectiveness via logs

### Updates
- Schema changes require updates to TypeScript definitions
- New event types need new handlers and feature flags
- API version updates may require client modifications

### Troubleshooting
1. **Events not appearing**: Check API key permissions and feature flags
2. **Rate limiting**: Verify retry logic is working correctly  
3. **Data issues**: Check TypeScript schemas and data mapping
4. **Profile problems**: Verify email matching and profile creation

## Integration Points

### Existing System Integration
- **Stripe Webhooks**: Purchase and subscription events
- **Cart API**: Abandonment tracking
- **User Authentication**: Profile linking via email
- **Database**: No additional storage required

### Future Enhancements
- Course completion events
- User engagement tracking
- Advanced segmentation data
- Real-time personalization APIs

## Support

For technical issues:
1. Check server logs for Klaviyo-related errors
2. Verify Klaviyo dashboard for event processing
3. Test with feature flags disabled/enabled
4. Review TypeScript schemas for data format issues

The integration is designed to be robust, non-intrusive, and easily maintainable while providing comprehensive marketing automation capabilities.