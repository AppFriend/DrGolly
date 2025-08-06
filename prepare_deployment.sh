#!/bin/bash

# Deployment Preparation Script
# Ensures all code is up to date and merged to main branch

echo "🚀 DEPLOYMENT PREPARATION SCRIPT"
echo "================================="

# Function to handle errors
handle_error() {
    echo "❌ Error: $1"
    exit 1
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    handle_error "Not in project root directory. Please run from project root."
fi

echo "📍 Current branch status:"
git branch --show-current || handle_error "Failed to get current branch"

echo ""
echo "📋 Step 1: Checking git status..."
git status --porcelain

echo ""
echo "💾 Step 2: Adding all changes to staging..."
git add . || handle_error "Failed to add changes"

echo ""
echo "📝 Step 3: Committing changes..."
git commit -m "feat: implement dual user checkout flows

- Enhanced payment endpoint with email-based user detection
- Auto-login for existing users during checkout
- New users routed to /complete page for profile setup
- Comprehensive testing completed for both user flows
- Ready for deployment" || echo "No changes to commit"

echo ""
echo "🔄 Step 4: Switching to main branch..."
git checkout main || handle_error "Failed to switch to main branch"

echo ""
echo "⬇️  Step 5: Pulling latest main branch changes..."
git pull origin main || handle_error "Failed to pull latest main changes"

echo ""
echo "🔀 Step 6: Merging testing-and-updates into main..."
git merge testing-and-updates --no-ff -m "merge: dual user checkout flow implementation

Merging comprehensive dual user checkout system:
- New users: public checkout → /complete page setup
- Existing users: auto-login → /courses with purchase linked
- Full testing completed, ready for production deployment" || handle_error "Failed to merge testing-and-updates"

echo ""
echo "📤 Step 7: Pushing to main branch..."
git push origin main || handle_error "Failed to push to main branch"

echo ""
echo "🧹 Step 8: Cleaning up - switching back to development branch..."
git checkout testing-and-updates || handle_error "Failed to switch back to development branch"

echo ""
echo "✅ DEPLOYMENT PREPARATION COMPLETE!"
echo "=================================="
echo ""
echo "📦 Next steps:"
echo "1. Code is now merged to main branch"
echo "2. Ready for Replit deployment"
echo "3. Use Replit's deployment panel to deploy"
echo ""
echo "🔍 Verify deployment readiness:"
echo "   - Main branch contains latest changes"
echo "   - Dual user checkout flows implemented"
echo "   - Database schema supports both flows"
echo "   - Frontend routing handles both scenarios"
echo ""
echo "🎯 Test after deployment:"
echo "   - New user checkout → /complete page"
echo "   - Existing user checkout → auto-login to /courses"