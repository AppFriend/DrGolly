#!/bin/bash

# Emergency Rollback Script
# Use this to quickly return to the protected main branch and delete checkout modifications

echo "🚨 EMERGENCY ROLLBACK TO MAIN BRANCH"
echo "⚠️  This will DELETE all checkout modifications on the current branch!"
echo ""

# Confirm with user
read -p "Are you sure you want to rollback? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelled"
    exit 1
fi

# Get current branch name
CURRENT_BRANCH=$(git branch --show-current)
echo "📋 Current branch: $CURRENT_BRANCH"

# Switch to main branch
echo "🔄 Switching to main branch..."
git checkout main

# Confirm deletion
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    echo "🗑️  Deleting branch: $CURRENT_BRANCH"
    git branch -D "$CURRENT_BRANCH"
    echo "✅ Successfully rolled back to main branch"
    echo "🛡️  All your CSV synchronization work is preserved"
else
    echo "ℹ️  Already on main branch - no rollback needed"
fi

echo ""
echo "📋 Current git status:"
git status --short
echo ""
echo "🎯 You are now back on the protected main branch with all your content work intact"