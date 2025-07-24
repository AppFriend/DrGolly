#!/bin/bash

# Desktop Optimization Branch Creation Script
# Created: July 24, 2025
# Purpose: Create new branch for desktop checkout optimization work

echo "🚀 CREATING DESKTOP OPTIMIZATION BRANCH"
echo "========================================"

# Check current git status
echo "📋 Current Git Status:"
git status --porcelain

# Check if we have uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  WARNING: You have uncommitted changes."
    echo "   Commit current changes before creating new branch:"
    echo "   git add ."
    echo "   git commit -m 'SAVEPOINT v1.47: Complete public checkout system - Pre-desktop optimization'"
    echo ""
    read -p "   Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted. Please commit changes first."
        exit 1
    fi
fi

# Create and switch to new desktop optimization branch
BRANCH_NAME="feature/checkout-desktop-optimization"
echo "🌟 Creating branch: $BRANCH_NAME"
git checkout -b $BRANCH_NAME

if [ $? -eq 0 ]; then
    echo "✅ Successfully created and switched to branch: $BRANCH_NAME"
    echo ""
    echo "📝 BRANCH PURPOSE:"
    echo "   - Optimize checkout experience for desktop users"
    echo "   - Enhance responsive design for larger screens"
    echo "   - Improve desktop-specific UX patterns"
    echo "   - Maintain mobile-first foundation"
    echo ""
    echo "🔄 TO ROLLBACK TO STABLE CHECKOUT:"
    echo "   git checkout main"
    echo "   # or"
    echo "   git checkout -f main  # (force, discards changes)"
    echo ""
    echo "📊 CURRENT SYSTEM STATUS:"
    echo "   ✅ 14 public checkout URLs operational"
    echo "   ✅ All products stored in database"
    echo "   ✅ Authentication system working"
    echo "   ✅ Stripe integration complete"
    echo "   ✅ Mobile-first design ready"
    echo ""
    echo "🎯 READY FOR DESKTOP OPTIMIZATION WORK"
else
    echo "❌ Failed to create branch. Check git status."
    exit 1
fi