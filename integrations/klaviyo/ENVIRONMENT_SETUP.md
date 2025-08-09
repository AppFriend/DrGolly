# Klaviyo Integration Environment Setup

## Required Environment Variables

Add these to your `.env` file to enable Klaviyo tracking:

```bash
# Klaviyo API Configuration
KLAVIYO_API_KEY=your_klaviyo_private_api_key_here

# Feature Flags (set to true to enable)
KLAVIYO_PURCHASE_EVENTS_ENABLED=true
KLAVIYO_SUBSCRIPTION_EVENTS_ENABLED=true
KLAVIYO_CART_ABANDONED_ENABLED=true

# Optional: App URL for cart abandonment links
VITE_APP_URL=https://app.drgolly.com
```

## Getting Your Klaviyo API Key

1. **Log in to Klaviyo**: Go to your Klaviyo account dashboard
2. **Navigate to API Keys**: 
   - Click on your profile icon in the top right
   - Select "Settings"
   - Choose "API Keys" from the left sidebar
3. **Create Private API Key**:
   - Click "Create Private API Key"
   - Give it a descriptive name like "Dr Golly App Integration"
   - Select the following scopes:
     - **Events**: Write access (required for sending events)
     - **Profiles**: Read/Write access (required for managing customer profiles)
   - Click "Create"
4. **Copy the Key**: Copy the generated API key (starts with `pk_`)
5. **Add to Environment**: Paste it as `KLAVIYO_API_KEY` in your `.env` file

## Feature Flag Configuration

The integration uses feature flags for granular control:

- **KLAVIYO_PURCHASE_EVENTS_ENABLED**: Tracks completed orders
- **KLAVIYO_SUBSCRIPTION_EVENTS_ENABLED**: Tracks subscription starts
- **KLAVIYO_CART_ABANDONED_ENABLED**: Enables cart abandonment tracking

Set any to `false` to disable that event type.

## Testing the Integration

1. **Enable Development Mode**: Set feature flags to `true` in development
2. **Test Purchase Flow**: Complete a course purchase and check Klaviyo for "Placed Order" event
3. **Test Subscription Flow**: Start a subscription and check for "Subscription Started" event
4. **Check Logs**: Monitor server logs for Klaviyo integration messages

## Production Deployment

1. **Separate Klaviyo Account**: Consider using a separate Klaviyo account for development
2. **Feature Flag Rollout**: Start with purchase events only, then add subscription and cart events
3. **Monitor Rate Limits**: Klaviyo has API rate limits - the integration includes retry logic
4. **Error Monitoring**: Watch for Klaviyo errors in production logs (won't break main functionality)

## Troubleshooting

- **Events not appearing**: Check API key permissions and feature flags
- **Rate limit errors**: The integration handles these automatically with backoff
- **Missing customer profiles**: Events will create profiles automatically in Klaviyo
- **Development vs Production**: Events are tagged with environment context