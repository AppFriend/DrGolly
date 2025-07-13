#!/bin/bash
# Create release script for Dr. Golly app

DATE=$(date +%d-%m-%Y)
FEATURE_NAME=$1

if [ -z "$FEATURE_NAME" ]; then
    echo "Usage: ./create-release.sh <feature-name>"
    echo "Example: ./create-release.sh course-images"
    exit 1
fi

TAG_NAME="stable-$DATE-$FEATURE_NAME"

echo "Creating release: $TAG_NAME"

# Create and push tag
git tag -a $TAG_NAME -m "Stable release: $FEATURE_NAME - $(date)"
git push origin $TAG_NAME

echo "✅ Release created: $TAG_NAME"
echo "📝 Don't forget to update replit.md with the new savepoint"