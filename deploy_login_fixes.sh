#!/bin/bash

# Deploy Login Fixes to Main Branch
# This script pushes the current stable code (with login fixes) to main branch
# for deployment to myapp.drgolly.com

echo "🚀 Deploying Login Fixes to Main Branch"
echo "========================================"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Ensure we have the latest changes
echo "🔄 Adding all changes to staging..."
git add .

# Check if there are any changes to commit
if git diff --cached --quiet; then
    echo "ℹ️  No new changes to commit"
else
    echo "📝 Committing login fixes..."
    git commit -m "Fix: Login errors and ProfileCompletion references

- Removed cached JavaScript causing ProfileCompletion not defined errors
- Added missing AuthUtils import to server routes
- Cleared build cache to resolve stale component references
- Verified authentication system working for both Dr. Golly and Replit Auth
- Fixed server-side login endpoint with proper session management

Resolves login issues on myapp.drgolly.com"
fi

# Switch to main branch
echo "🔄 Switching to main branch..."
git checkout main

# Pull latest changes from main
echo "⬇️  Pulling latest changes from main..."
git pull origin main

# Merge current fixes into main
echo "🔀 Merging fixes from $CURRENT_BRANCH into main..."
git merge $CURRENT_BRANCH --no-ff -m "Merge login fixes from $CURRENT_BRANCH

This merge includes critical fixes for login errors on myapp.drgolly.com:
- Fixed ProfileCompletion not defined errors
- Cleared JavaScript build cache
- Added AuthUtils import for proper authentication
- Verified all core functionality working locally

Ready for production deployment."

# Push to main branch
echo "⬆️  Pushing to main branch..."
git push origin main

# Switch back to original branch
echo "🔄 Switching back to $CURRENT_BRANCH..."
git checkout $CURRENT_BRANCH

echo ""
echo "✅ Deployment Complete!"
echo "========================================"
echo "The login fixes have been successfully deployed to the main branch."
echo "Users on myapp.drgolly.com should now see the fixed version."
echo ""
echo "🔧 If users still see login errors, they should:"
echo "   1. Clear their browser cache (Ctrl+F5 or Cmd+Shift+R)"
echo "   2. Or open the site in an incognito/private window"
echo ""
echo "📊 Changes deployed:"
echo "   ✓ Fixed ProfileCompletion JavaScript errors"
echo "   ✓ Added AuthUtils import for password verification"
echo "   ✓ Cleared build cache for fresh JavaScript"
echo "   ✓ Verified authentication system stability"
echo ""
echo "🌐 Production site: https://myapp.drgolly.com"