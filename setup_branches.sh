#!/bin/bash

# Branch Setup Script
# Run this in your Replit Shell to create all feature branches

echo "🚀 Setting up Git branches for Dr. Golly project..."

# Create and push dev branch
echo "Creating dev branch..."
git checkout -b dev
git push -u origin dev

# Create and push test/replit branch
echo "Creating test/replit branch..."
git checkout -b test/replit
git push -u origin test/replit

# Create feature branches
echo "Creating feature branches..."

# feature/home - Home dashboard
git checkout -b feature/home
git push -u origin feature/home

# feature/courses - Course system
git checkout -b feature/courses
git push -u origin feature/courses

# feature/tracking - Health tracking
git checkout -b feature/tracking
git push -u origin feature/tracking

# feature/discounts - Partner discounts
git checkout -b feature/discounts
git push -u origin feature/discounts

# feature/family - Family management
git checkout -b feature/family
git push -u origin feature/family

# feature/settings - User profile/settings
git checkout -b feature/settings
git push -u origin feature/settings

# feature/checkout - E-commerce/payment
git checkout -b feature/checkout
git push -u origin feature/checkout

# feature/admin - Admin panel
git checkout -b feature/admin
git push -u origin feature/admin

# Return to main branch
echo "Returning to main branch..."
git checkout main

echo "✅ All branches created successfully!"
echo ""
echo "📋 Created branches:"
echo "- dev (integration branch)"
echo "- test/replit (testing branch)"
echo "- feature/home (dashboard & welcome)"
echo "- feature/courses (course system)"
echo "- feature/tracking (health tracking)"
echo "- feature/discounts (partner deals)"
echo "- feature/family (family management)"
echo "- feature/settings (user profile)"
echo "- feature/checkout (e-commerce)"
echo "- feature/admin (admin panel)"
echo ""
echo "🎯 Ready for feature development!"