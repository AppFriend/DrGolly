#!/bin/bash

# Sync Main Branch After Klaviyo Data Bolster Enhancement
# Created: August 9, 2025
# Purpose: Merge all Klaviyo billing date integration changes to main branch before manual deployment

echo "🔄 Starting sync process for Klaviyo Data Bolster changes..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Initializing..."
    git init
    git remote add origin https://github.com/yourusername/your-repo.git || echo "Remote may already exist"
fi

# Show current branch status
echo "📍 Current branch status:"
git branch -a
git status --short

# Stage all changes including new files
echo "➕ Staging all changes..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "✅ No changes to commit - repository is already up to date"
else
    echo "💾 Committing Klaviyo Data Bolster enhancement..."
    git commit -m "feat: Enhanced Klaviyo integration with next billing date parsing

- Added comprehensive e-commerce event tracking (purchase, subscription, cart abandonment)
- Implemented next billing date parsing for payment reminder communications
- Enhanced subscription events with current_period_end and next_billing_date fields
- Fixed LSP errors in Klaviyo integration
- Added comprehensive documentation and deployment guides
- Maintained backward compatibility with existing Klaviyo functionality
- Created savepoint: Stable, Klaviyo Data Bolster 09/08/2025

Technical improvements:
- Updated KlaviyoService with sendPurchaseEvent, sendSubscriptionStartedEvent, sendCartAbandonmentEvent
- Enhanced Stripe webhook integration with proper date parsing
- Added environment variable controls for selective event sending
- Implemented robust error handling with detailed logging
- Created comprehensive event schemas and documentation

Production ready features:
- Precise billing date triggers for payment reminders
- Detailed product information for cart recovery flows
- Subscription lifecycle management with billing period tracking
- Enhanced customer journey analytics in Klaviyo"
fi

# Ensure we're on main branch
echo "🔄 Switching to main branch..."
git checkout main 2>/dev/null || git checkout -b main

# If we were on a feature branch, merge it
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "🔀 Merging $CURRENT_BRANCH into main..."
    git checkout main
    git merge "$CURRENT_BRANCH" --no-ff -m "Merge Klaviyo Data Bolster enhancement to main"
fi

# Show final status
echo "✅ Final repository status:"
git log --oneline -5
echo ""
echo "📊 Repository summary:"
git status --short
echo ""

# Prepare for deployment
echo "🚀 Ready for manual deployment!"
echo "📋 Next steps:"
echo "   1. Click the 'Deploy' button in Replit"
echo "   2. Wait for deployment to complete"
echo "   3. Test the enhanced Klaviyo integration"
echo "   4. Verify billing date parsing in subscription events"
echo ""
echo "💡 Enhanced features deployed:"
echo "   ✓ Next billing date parsing for payment reminders"
echo "   ✓ Comprehensive purchase event tracking"  
echo "   ✓ Cart abandonment recovery events"
echo "   ✓ Subscription lifecycle management"
echo "   ✓ Enhanced customer journey analytics"
echo ""
echo "🔧 Environment variables to verify in production:"
echo "   - KLAVIYO_PURCHASE_EVENTS_ENABLED=true"
echo "   - KLAVIYO_SUBSCRIPTION_EVENTS_ENABLED=true" 
echo "   - KLAVIYO_CART_ABANDONED_ENABLED=true"
echo "   - VITE_APP_URL (for cart abandonment URLs)"
echo ""
echo "📚 Documentation available:"
echo "   - integrations/klaviyo/DEPLOYMENT_GUIDE.md"
echo "   - integrations/klaviyo/BILLING_DATE_INTEGRATION.md"
echo "   - SAVEPOINT_STABLE_KLAVIYO_DATA_BOLSTER_09_08_2025.md"

echo ""
echo "🎉 Sync complete! Ready for deployment."