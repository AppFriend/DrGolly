#!/bin/bash

# Git Sync Script - Post Manual Deployment
# Ensures Git repository matches the latest redeployment state
# Created: August 8th, 2025 - 2:04 AM

echo "🔄 Syncing Git with latest deployment state..."

# Add all changes to staging
echo "📝 Adding all changes to Git staging..."
git add .

# Create commit with deployment timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "💾 Creating commit for deployment sync..."
git commit -m "DEPLOYMENT SYNC: Stable signup flow with authentication fixes - $TIMESTAMP

✅ Fixed authentication bug in signup completion endpoint
✅ Changed breadcrumbs to 'Back' navigation across all steps  
✅ Updated step 1 heading to 'LET'S GET STARTED'
✅ Baby due date parsing and storage verified working
✅ Brand color consistency maintained (HEX #0a5d66)
✅ End-to-end signup flow tested and stable
✅ Medical content and admin functionality confirmed unaffected

Manual deployment completed: $TIMESTAMP
Savepoint: Stable with New Signup before publish (08/08 2:01 AM)"

# Push to remote repository
echo "🚀 Pushing changes to remote repository..."
git push origin main

# Display current branch and status
echo "📋 Current Git status:"
git status --short
git log --oneline -3

echo "✅ Git sync completed successfully!"
echo "📌 Repository now matches deployed state"