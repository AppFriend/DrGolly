# Branch Setup Commands

## Base Branches Creation
Run these commands in your Replit Shell:

```bash
# Create and push dev branch
git checkout -b dev
git push -u origin dev

# Create and push test/replit branch
git checkout -b test/replit
git push -u origin test/replit

# Return to main
git checkout main
```

## Feature Branches Creation
Run these commands to create feature branches:

```bash
# Home page features
git checkout -b feature/home
git push -u origin feature/home

# Course system features
git checkout -b feature/courses
git push -u origin feature/courses

# Tracking system features
git checkout -b feature/tracking
git push -u origin feature/tracking

# Discounts system features
git checkout -b feature/discounts
git push -u origin feature/discounts

# Family management features
git checkout -b feature/family
git push -u origin feature/family

# Settings features
git checkout -b feature/settings
git push -u origin feature/settings

# Checkout system features
git checkout -b feature/checkout
git push -u origin feature/checkout

# Admin panel features
git checkout -b feature/admin
git push -u origin feature/admin

# Return to main
git checkout main
```

## Verification Commands
```bash
# List all branches
git branch -a

# Check current branch
git branch --show-current

# Check branch protection status
git log --oneline -5
```