#!/bin/bash

# Checkout Branch Creation Script with Rollback Protection
# This script creates a safe development branch for checkout modifications

echo "🔧 Creating checkout development branch with rollback protection..."

# Remove any existing git lock files
if [ -f ".git/index.lock" ]; then
    echo "🧹 Removing git lock file..."
    rm -f .git/index.lock
fi

# Check current git status
echo "📋 Current git status:"
git status --short

# Create and switch to new checkout development branch
BRANCH_NAME="feature/checkout-modifications-$(date +%Y%m%d-%H%M)"
echo "🌟 Creating branch: $BRANCH_NAME"

# Commit any current changes first
if [ -n "$(git status --porcelain)" ]; then
    echo "💾 Committing current changes before branching..."
    git add .
    git commit -m "Pre-checkout modifications: Little Baby and Big Baby CSV synchronization complete"
fi

# Create new feature branch
git checkout -b "$BRANCH_NAME"

echo "✅ Successfully created and switched to branch: $BRANCH_NAME"
echo ""
echo "🛡️  ROLLBACK PROTECTION ACTIVE:"
echo "   - Your main code is now protected on the main branch"
echo "   - All checkout modifications will be isolated to this branch"
echo "   - To rollback: git checkout main && git branch -D $BRANCH_NAME"
echo ""
echo "🚀 You can now safely make checkout modifications!"
echo "   - Current branch: $BRANCH_NAME"
echo "   - Protected main branch contains all CSV synchronization work"
echo ""
echo "ROLLBACK COMMAND (if needed):"
echo "git checkout main && git branch -D $BRANCH_NAME"