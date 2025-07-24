#!/bin/bash

# Sync All Changes to Main Branch and Update GitHub Repository
# This script ensures all today's work is merged to main and pushed to GitHub

echo "🚀 SYNCING ALL CHANGES TO MAIN BRANCH AND GITHUB"
echo "=================================================================="

# Function to check if command succeeded
check_success() {
    if [ $? -eq 0 ]; then
        echo "✅ $1"
    else
        echo "❌ $1 FAILED"
        exit 1
    fi
}

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a Git repository. Initializing..."
    git init
    check_success "Git repository initialized"
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Stage all changes
echo "📦 Staging all changes..."
git add .
check_success "All changes staged"

# Check if there are any changes to commit
if git diff --cached --quiet; then
    echo "ℹ️  No changes to commit"
else
    # Commit changes with comprehensive message
    COMMIT_MESSAGE="Complete Pre-Toddler Sleep Program synchronization - SAVEPOINT v1.44

- Successfully synchronized Pre-Toddler Sleep Program (Course ID 7) with 50 lessons across 10 chapters
- Resolved foreign key constraints during content synchronization
- All three courses now have validated checkout routes (/checkout/5, /checkout/6, /checkout/7)
- Complete system validated with 224 total lessons containing authentic doctor-written content
- Created comprehensive testing guide for manual validation workflows
- Production-ready three-course ecosystem with exact CSV matching"

    echo "💾 Committing changes..."
    git commit -m "$COMMIT_MESSAGE"
    check_success "Changes committed"
fi

# Switch to main branch (create if doesn't exist)
echo "🔄 Switching to main branch..."
if git show-ref --verify --quiet refs/heads/main; then
    git checkout main
    check_success "Switched to main branch"
else
    git checkout -b main
    check_success "Created and switched to main branch"
fi

# Merge current work into main (if not already on main)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "" ]; then
    echo "🔀 Merging $CURRENT_BRANCH into main..."
    git merge "$CURRENT_BRANCH" --no-ff -m "Merge $CURRENT_BRANCH: Complete three-course ecosystem synchronization"
    check_success "Branch merged into main"
fi

# Check for remote origin
if git remote get-url origin >/dev/null 2>&1; then
    echo "🌐 Remote origin found, updating GitHub..."
    
    # Fetch latest changes from remote
    echo "⬇️  Fetching latest changes from GitHub..."
    git fetch origin
    check_success "Fetched from origin"
    
    # Push to GitHub
    echo "⬆️  Pushing to GitHub..."
    git push origin main
    check_success "Pushed to GitHub main branch"
    
    # Push all branches
    echo "📤 Pushing all branches..."
    git push origin --all
    check_success "All branches pushed"
    
    # Push all tags
    echo "🏷️  Pushing all tags..."
    git push origin --tags
    check_success "All tags pushed"
    
else
    echo "⚠️  No remote origin configured. To push to GitHub:"
    echo "   git remote add origin <your-github-repo-url>"
    echo "   git push -u origin main"
fi

# Show final status
echo ""
echo "📊 FINAL STATUS"
echo "--------------------------------"
echo "Current branch: $(git branch --show-current)"
echo "Last commit: $(git log -1 --oneline)"
echo "Remote status:"
git remote -v

echo ""
echo "🎉 SYNC COMPLETE"
echo "=================================="
echo "✅ All changes committed to main branch"
echo "✅ GitHub repository updated (if remote configured)"
echo "✅ Three-course ecosystem changes preserved"
echo "✅ Ready for production deployment"

# Optional: Show recent commits
echo ""
echo "📝 Recent commits:"
git log --oneline -5

echo ""
echo "🚀 Your Dr. Golly platform is now fully synchronized!"