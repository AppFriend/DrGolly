#!/bin/bash
# Emergency rollback script for Dr. Golly app

RELEASE_TAG=$1

if [ -z "$RELEASE_TAG" ]; then
    echo "Usage: ./emergency-rollback.sh <release-tag>"
    echo "Example: ./emergency-rollback.sh stable-14-07-2025-course-images"
    echo ""
    echo "Available releases:"
    git tag -l "stable-*" --sort=-version:refname | head -10
    exit 1
fi

# Verify tag exists
if ! git rev-parse $RELEASE_TAG >/dev/null 2>&1; then
    echo "❌ Error: Tag $RELEASE_TAG not found"
    echo "Available releases:"
    git tag -l "stable-*" --sort=-version:refname | head -10
    exit 1
fi

echo "🚨 EMERGENCY ROLLBACK to $RELEASE_TAG"
echo "⚠️  This will create a rollback branch. You must create a PR to complete the rollback."

# Create rollback branch
git checkout main
git checkout -b rollback-to-$RELEASE_TAG

# Reset to the stable release
git reset --hard $RELEASE_TAG

# Push rollback branch
git push origin rollback-to-$RELEASE_TAG

echo "✅ Rollback branch created: rollback-to-$RELEASE_TAG"
echo "🔄 Next steps:"
echo "1. Go to GitHub and create a PR from rollback-to-$RELEASE_TAG to main"
echo "2. Get emergency approval and merge"
echo "3. Deploy to production"