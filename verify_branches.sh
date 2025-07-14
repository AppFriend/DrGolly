#!/bin/bash

# Branch Verification Script
# Run this to verify all branches were created correctly

echo "🔍 Verifying Git branch setup..."
echo ""

# Check current branch
echo "📍 Current branch:"
git branch --show-current
echo ""

# List all branches
echo "📋 All local branches:"
git branch
echo ""

# List all remote branches
echo "🌐 All remote branches:"
git branch -r
echo ""

# List all branches (local and remote)
echo "📊 Complete branch overview:"
git branch -a
echo ""

# Check for expected branches
echo "✅ Expected branches checklist:"

branches=(
    "dev"
    "test/replit"
    "feature/home"
    "feature/courses"
    "feature/tracking"
    "feature/discounts"
    "feature/family"
    "feature/settings"
    "feature/checkout"
    "feature/admin"
)

for branch in "${branches[@]}"; do
    if git show-ref --verify --quiet refs/heads/$branch; then
        echo "✅ $branch - EXISTS"
    else
        echo "❌ $branch - MISSING"
    fi
done

echo ""
echo "🎯 Branch setup verification complete!"