# Klaviyo Integration Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration
Ensure all required environment variables are set:

```bash
# Required for Klaviyo integration
KLAVIYO_API_KEY=pk_your_production_klaviyo_key

# Feature flags (enable/disable specific events)
KLAVIYO_PURCHASE_EVENTS_ENABLED=true
KLAVIYO_SUBSCRIPTION_EVENTS_ENABLED=true
KLAVIYO_CART_ABANDONED_ENABLED=true

# App URL for cart abandonment links
VITE_APP_URL=https://app.drgolly.com
```

### 2. Klaviyo Account Setup
- [ ] Production Klaviyo account configured
- [ ] Private API key created with correct scopes:
  - Events: Write access
  - Profiles: Read/Write access
- [ ] API key permissions tested

### 3. Code Integration Verification
- [ ] Klaviyo hooks integrated in server routes
- [ ] Purchase events connected to payment completion
- [ ] Subscription events connected to Stripe webhooks
- [ ] Cart abandonment tracking in cart API endpoints
- [ ] All TypeScript schemas validated

## Deployment Process

### Phase 1: Gradual Rollout
Start with limited event types to ensure stability:

```bash
# Initial deployment - purchases only
KLAVIYO_PURCHASE_EVENTS_ENABLED=true
KLAVIYO_SUBSCRIPTION_EVENTS_ENABLED=false
KLAVIYO_CART_ABANDONED_ENABLED=false
```

**Validation Steps:**
1. Deploy with purchase events only
2. Complete test purchase
3. Verify "Placed Order" event appears in Klaviyo
4. Monitor server logs for errors
5. Check customer profile creation

### Phase 2: Add Subscription Events
After 24-48 hours of stable purchase tracking:

```bash
# Add subscription events
KLAVIYO_PURCHASE_EVENTS_ENABLED=true
KLAVIYO_SUBSCRIPTION_EVENTS_ENABLED=true
KLAVIYO_CART_ABANDONED_ENABLED=false
```

**Validation Steps:**
1. Test subscription creation
2. Verify "Subscription Started" event in Klaviyo
3. Check subscription data accuracy
4. Monitor for rate limiting issues

### Phase 3: Full Feature Deployment
After successful subscription event validation:

```bash
# All events enabled
KLAVIYO_PURCHASE_EVENTS_ENABLED=true
KLAVIYO_SUBSCRIPTION_EVENTS_ENABLED=true
KLAVIYO_CART_ABANDONED_ENABLED=true
```

**Validation Steps:**
1. Test cart abandonment flow
2. Verify "Abandoned Checkout" events
3. Check cart recovery URL functionality
4. Monitor overall system performance

## Post-Deployment Monitoring

### 1. Server Logs
Monitor for these success messages:
```
Klaviyo purchase event sent successfully
Klaviyo subscription started event sent successfully
Klaviyo cart updated event sent for user: [userId]
```

Watch for error patterns:
```
Failed to send Klaviyo purchase event: [error]
Klaviyo worker queue error: [error]
Rate limit exceeded, retrying in [seconds] seconds
```

### 2. Klaviyo Dashboard Monitoring
- **Activity Feed**: Check for real-time events
- **Profile Growth**: Monitor customer profile creation
- **Event Volume**: Track event frequency and patterns
- **API Usage**: Monitor rate limits and quotas

### 3. Performance Metrics
- Server response times (Klaviyo integration should not impact)
- Error rates in payment/subscription flows
- Cart abandonment event accuracy
- Customer profile synchronization rates

## Troubleshooting Common Issues

### Events Not Appearing in Klaviyo

**Symptoms**: Server logs show success, but no events in Klaviyo dashboard

**Solutions**:
1. Verify API key permissions in Klaviyo
2. Check feature flag configuration
3. Validate event data format against schemas
4. Test with a known working email address

### Rate Limiting Errors

**Symptoms**: `429` status codes in server logs

**Solutions**:
1. Integration includes automatic retry with exponential backoff
2. Monitor retry patterns in logs
3. Consider reducing event frequency if needed
4. Contact Klaviyo support for rate limit increases

### Customer Profile Issues

**Symptoms**: Events appear but profiles not created/updated correctly

**Solutions**:
1. Verify email format and validation
2. Check profile matching logic
3. Test with existing customer profiles
4. Review custom property mapping

### Integration Performance Impact

**Symptoms**: Slower response times after deployment

**Solutions**:
1. All Klaviyo operations are non-blocking (shouldn't impact performance)
2. Check for synchronous calls (should all be asynchronous)
3. Monitor worker queue performance
4. Review error handling patterns

## Rollback Procedures

### Emergency Rollback
If critical issues occur, immediately disable all events:

```bash
KLAVIYO_PURCHASE_EVENTS_ENABLED=false
KLAVIYO_SUBSCRIPTION_EVENTS_ENABLED=false
KLAVIYO_CART_ABANDONED_ENABLED=false
```

This will stop all Klaviyo event sending without affecting core functionality.

### Selective Rollback
Disable specific event types while keeping others:

```bash
# Keep purchases, disable subscriptions and cart
KLAVIYO_PURCHASE_EVENTS_ENABLED=true
KLAVIYO_SUBSCRIPTION_EVENTS_ENABLED=false
KLAVIYO_CART_ABANDONED_ENABLED=false
```

### Code Rollback
If the integration causes application issues:
1. Revert server routes to previous version
2. Remove Klaviyo hook imports
3. Redeploy without integration code
4. Core application functionality will be unaffected

## Long-term Maintenance

### Regular Monitoring Tasks

**Weekly**:
- Review Klaviyo event volumes and patterns
- Check error rates in server logs
- Monitor customer profile growth
- Validate cart abandonment effectiveness

**Monthly**:
- Analyze Klaviyo API usage and quotas
- Review feature flag effectiveness
- Check for new Klaviyo API versions
- Validate data accuracy against business metrics

### Update Procedures

**Schema Updates**:
1. Update TypeScript definitions in `/integrations/klaviyo/schemas/`
2. Test with development Klaviyo account
3. Deploy with feature flags disabled
4. Enable gradually after validation

**New Event Types**:
1. Create new event handler in `/integrations/klaviyo/events/`
2. Add corresponding schema definitions
3. Create new feature flag
4. Integrate with appropriate server routes
5. Deploy with new flag disabled initially

## Security Considerations

### API Key Management
- Use separate development and production API keys
- Store keys securely in environment variables
- Never commit API keys to code repositories
- Rotate keys periodically per security policy

### Data Privacy
- Only send necessary customer data to Klaviyo
- Ensure compliance with data protection regulations
- Document data flow for privacy audits
- Implement data retention policies as needed

### Access Control
- Limit access to Klaviyo dashboard
- Use role-based permissions in Klaviyo
- Monitor API key usage patterns
- Log all configuration changes

## Success Metrics

### Technical Metrics
- Event delivery success rate (target: >99%)
- Average event processing time (target: <100ms)
- Error rate (target: <1%)
- Customer profile accuracy (target: >98%)

### Business Metrics
- Email engagement from Klaviyo campaigns
- Cart recovery rates from abandonment emails
- Customer lifetime value tracking accuracy
- Subscription retention correlation with events

## Support and Escalation

### Internal Support
1. Check server logs for detailed error messages
2. Review feature flag configuration
3. Test with development Klaviyo account
4. Validate API key permissions

### External Support
- **Klaviyo Support**: For API issues, rate limits, account problems
- **Documentation**: Reference official Klaviyo API docs for schema changes
- **Community**: Klaviyo developer community for best practices

The Klaviyo integration is designed to be robust and non-intrusive. Following this deployment guide ensures a smooth rollout with minimal risk to existing functionality.