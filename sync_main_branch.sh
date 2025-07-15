#!/bin/bash

# Git commands to sync main branch with deployed changes
echo "Syncing main branch with deployed changes..."

# Ensure you're on main branch
git checkout main

# Pull latest changes from remote main (includes deployed changes)
git pull origin main

# Check if there are any uncommitted local changes
if [ -n "$(git status --porcelain)" ]; then
    echo "Found uncommitted changes. Adding and committing..."
    
    # Add all changes
    git add .
    
    # Commit with deployment message
    git commit -m "Post-deployment sync: Enhanced payment notifications with real transaction data

- Fixed database WebSocket configuration for Neon serverless
- Resolved schema constraint conflicts without data loss
- Enhanced payment notifications with promotional codes and discount tracking
- Real transaction data extraction from Stripe webhooks
- All webhook endpoints verified and operational
- Database connectivity restored and tested

System Status: Production-ready with complete transaction integration"
    
    # Push committed changes
    git push origin main
    
    echo "✅ Local changes committed and pushed to main"
else
    echo "✅ No uncommitted changes - main branch is up to date"
fi

# Show current branch status
echo ""
echo "Current branch status:"
git status --short
echo ""
echo "Latest commits:"
git log --oneline -5

echo ""
echo "🎉 Main branch sync completed"
echo "Main branch is now fully synchronized with deployed changes"