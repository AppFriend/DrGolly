#!/bin/bash

# Post-Deployment Git Sync Script
# Created: August 9, 2025
# Purpose: Sync git branches after successful manual deployment

echo "🔄 Post-deployment git synchronization..."

# Ensure we're on main branch
git checkout main

# Push the latest changes to remote
echo "🚀 Pushing main branch to remote..."
git push origin main

# Clean up any temporary branches if they exist
echo "🧹 Cleaning up branches..."
git branch -D temp-deploy 2>/dev/null || echo "No temp branches to clean"

# Tag the current deployment
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
echo "🏷️ Tagging deployment..."
git tag -a "klaviyo_data_bolster_$TIMESTAMP" -m "Deployment: Enhanced Klaviyo integration with billing date parsing - $TIMESTAMP"

# Push tags
git push origin --tags

# Show final status
echo "✅ Post-deployment sync complete!"
echo "📊 Current repository state:"
git log --oneline -3
git tag --sort=-version:refname | head -5

echo ""
echo "🎉 Repository synchronized with deployment!"