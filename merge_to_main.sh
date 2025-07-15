#!/bin/bash

# Git commands to merge enhanced payment notifications to main branch
echo "Starting merge process for enhanced payment notifications..."

# Switch to main branch
git checkout main

# Pull latest changes from remote
git pull origin main

# Merge feature/signup branch (contains signup notification enhancements)
echo "Merging feature/signup branch..."
git merge feature/signup --no-ff -m "Merge feature/signup: Enhanced signup notifications with type detection"

# Merge feature/checkout branch (contains payment notification enhancements)
echo "Merging feature/checkout branch..."
git merge feature/checkout --no-ff -m "Merge feature/checkout: Enhanced payment notifications with real transaction data"

# Push merged changes to main
git push origin main

echo "Merge completed successfully!"
echo "Main branch now contains:"
echo "- Enhanced signup notifications with signup type detection"
echo "- Enhanced payment notifications with real transaction data"
echo "- Promotional code and discount amount tracking"
echo "- Dynamic header titles based on transaction type"
echo "- Real-time Stripe webhook integration"

# Optional: Create a release tag
echo "Creating release tag..."
git tag -a v1.6-payment-notifications -m "Release v1.6: Enhanced payment notifications with real transaction data"
git push origin v1.6-payment-notifications

echo "Release tag v1.6-payment-notifications created and pushed"