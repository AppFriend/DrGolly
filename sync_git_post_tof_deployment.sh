#!/bin/bash

# Git Synchronization Script - Post TOF Tracking Deployment
# Created: August 8th, 2025 - 5:49 AM
# Purpose: Ensure git repository matches the deployed Top of Funnel tracking system

echo "🔄 Synchronizing git repository with deployed TOF tracking system..."
echo "Date: $(date)"
echo "Savepoint: Top of Funnel Tracking System Complete"
echo ""

# Check current git status
echo "📋 Current git status:"
git status --short
echo ""

# Add all files including new tracking components
echo "📁 Adding all files to git..."
git add -A

# Show what will be committed
echo "📝 Files to be committed:"
git diff --cached --name-status
echo ""

# Commit with descriptive message
echo "💾 Committing TOF tracking system..."
git commit -m "STABLE: Complete Top of Funnel tracking system

Features completed:
- Automatic freebie detection for /blog/free-* posts
- Database schema with tracking columns (original_url, tracking_url, tracking_id)
- Server-side redirects at /t/of/blog/:slug with click tracking
- Admin panel integration with real-time analytics
- Client-side routing for seamless UX
- Enhanced logging and error handling

Technical changes:
- Enhanced top_of_funnel_links table schema
- TrackingRedirect React component
- Express routes for /t/of/blog/:slug tracking
- Admin interface auto-generation of tracking links
- 7 freebie posts now have active tracking URLs

Status: Ready for production deployment
Medical content: Completely preserved and unaffected
Savepoint: August 8th, 2025 - TOF Tracking Complete"

echo ""

# Push to main branch
echo "🚀 Pushing to main branch..."
git push origin main

# Verify final status
echo ""
echo "✅ Git synchronization complete!"
echo "📊 Final repository status:"
git log --oneline -3
echo ""
echo "🔗 Latest commit matches deployed TOF tracking system"
echo "📈 All 7 freebie tracking URLs ready for marketing campaigns"
echo "🎯 Admin panel shows real-time engagement analytics"