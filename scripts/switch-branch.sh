#!/bin/bash
# Branch switching helper for Dr. Golly app

BRANCH_NAME=$1

if [ -z "$BRANCH_NAME" ]; then
    echo "Usage: ./switch-branch.sh <branch-name>"
    echo ""
    echo "Available branches:"
    git branch -a
    echo ""
    echo "Feature branch examples:"
    echo "  home/new-banner"
    echo "  courses/video-player"
    echo "  tracking/sleep-graph"
    echo "  discounts/partner-integration"
    echo "  family/child-profiles"
    echo "  settings/profile-update"
    exit 1
fi

echo "Switching to branch: $BRANCH_NAME"

# Check if branch exists locally
if git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
    echo "📦 Branch exists locally, switching..."
    git checkout $BRANCH_NAME
    git pull origin $BRANCH_NAME
elif git show-ref --verify --quiet refs/remotes/origin/$BRANCH_NAME; then
    echo "📦 Branch exists remotely, checking out..."
    git checkout -b $BRANCH_NAME origin/$BRANCH_NAME
else
    echo "🆕 Creating new branch..."
    git checkout dev
    git pull origin dev
    git checkout -b $BRANCH_NAME
fi

echo "✅ Now on branch: $BRANCH_NAME"
echo "🔄 Current status:"
git status --short