# Safe Content Update Branch Setup
## Savepoint: STABLE_PRE_CONTENT_UPDATE_20250806_0404

### 🎯 CURRENT STABLE STATE
- Pixel tracking implementation complete across 6 platforms
- Production build successful and validated
- Checkout, payments, and core features fully operational
- Ready for safe content management updates

---

## 📋 MANUAL GIT COMMANDS TO RUN

### Step 1: Create Savepoint Tag
```bash
# Remove any git lock files first (if needed)
rm -f .git/index.lock

# Create a tagged savepoint for easy rollback
git add .
git commit -m "SAVEPOINT: Stable before content update 06/08 - Complete pixel tracking implementation

- ✅ 6 tracking platforms fully integrated (Google Ads, Meta, Pinterest, TikTok, LinkedIn, Reddit)  
- ✅ Conversion tracking validated on Home, Login, and Checkout pages
- ✅ Production build successful with all tracking features
- ✅ Comprehensive testing suite created with validation scripts
- ✅ CSP updated for all tracking domains
- ✅ TypeScript implementation with proper error handling

TIMESTAMP: 2025-08-06 04:04:00 UTC
SAVEPOINT_ID: STABLE_PRE_CONTENT_UPDATE_20250806_0404"

# Tag this commit for easy reference
git tag -a stable-pre-content-update-20250806-0404 -m "Stable savepoint before content updates - Pixel tracking complete"
```

### Step 2: Create Safe Content Update Branch  
```bash
# Create and switch to a new branch for content updates
git checkout -b content-updates-admin-courses-20250806

# Verify you're on the new branch
git branch --show-current

# Push the new branch to remote (optional but recommended)
git push -u origin content-updates-admin-courses-20250806
```

### Step 3: Validate Branch Setup
```bash
# Confirm you're working safely
echo "Current branch: $(git branch --show-current)"
echo "Last commit: $(git log --oneline -1)"
echo "Available tags: $(git tag -l '*content-update*')"

# Test build to ensure everything still works
npm run build
```

---

## 🛡️ SAFE DEVELOPMENT GUIDELINES

### ✅ SAFE TO MODIFY ON THIS BRANCH:
- **Admin Panel** (`/client/src/pages/admin/`)
  - Course management interfaces
  - Content editing forms  
  - User management (non-auth related)
  - Blog post management
  - Admin dashboard improvements

- **Course Pages** (`/client/src/pages/courses/`)
  - Course display components
  - Chapter/lesson navigation
  - Progress tracking displays
  - Course content rendering
  - Video player integration

- **Content Management**
  - Course content CRUD operations
  - Chapter and lesson organization
  - Content migration scripts
  - Rich text editor improvements

### ❌ DO NOT MODIFY ON THIS BRANCH:
- **Pixel Tracking** (fully tested and production-ready)
  - `client/src/utils/tracking.js`
  - `client/src/hooks/useTracking.ts`
  - Any tracking-related code

- **Checkout Flow** (payment processing stable)
  - `client/src/pages/big-baby-public.tsx`
  - Payment forms and Stripe integration
  - Purchase completion flows

- **Core Authentication**
  - Login/signup processes
  - User session management
  - Authentication hooks

- **Database Schema Changes**
  - Keep to content updates only
  - No structural changes to core tables

---

## 🔄 EMERGENCY ROLLBACK PROCEDURES

### If Something Goes Wrong:
```bash
# Quick rollback to stable state
git checkout main
git reset --hard stable-pre-content-update-20250806-0404

# Or switch back to main if needed
git checkout main

# Rebuild to ensure stability
npm install
npm run build
```

### To Resume Content Work:
```bash
# Switch back to content branch
git checkout content-updates-admin-courses-20250806

# Continue development safely
```

---

## 📊 VALIDATION CHECKS

### Before Starting Content Work:
```bash
# Verify tracking still works
curl -s http://localhost:5000/ | grep -E "(gtag|fbq|pintrk|ttq)"

# Check build success
npm run build

# Verify server starts
npm run dev
```

### After Content Changes:
```bash
# Test that core functionality still works
# 1. Navigate to /big-baby-public - should load with tracking
# 2. Check /login page - should work normally  
# 3. Verify /admin routes function properly
# 4. Run: npm run build (should succeed)
```

---

## 🎯 BRANCH MERGE STRATEGY

### When Content Updates Are Complete:
```bash
# Ensure you're on your content branch
git checkout content-updates-admin-courses-20250806

# Commit all content changes
git add .
git commit -m "Content updates: [describe changes]"

# Switch to main and merge
git checkout main
git merge content-updates-admin-courses-20250806

# Test everything works
npm run build
npm run dev

# Push to remote
git push origin main

# Clean up branch (optional)
git branch -d content-updates-admin-courses-20250806
```

### If Issues Arise During Merge:
```bash
# Abort merge and rollback
git merge --abort
git checkout main
git reset --hard stable-pre-content-update-20250806-0404

# Review conflicts on content branch
git checkout content-updates-admin-courses-20250806
# Fix issues, then try merge again
```

---

## 📝 IMPORTANT REMINDERS

1. **Always test builds** after changes: `npm run build`
2. **Keep pixel tracking untouched** - it's production-ready
3. **Focus on content management only** in `/admin` and `/courses`
4. **Use the tagged commit** for rollbacks if needed
5. **Test checkout flow** remains functional after changes

**Savepoint Reference**: `stable-pre-content-update-20250806-0404`  
**Safe Branch**: `content-updates-admin-courses-20250806`  
**Emergency Rollback**: Always available via git tag

---

## 🚀 READY TO PROCEED

Your application is in a stable, production-ready state with complete pixel tracking implementation. You can now safely modify course content management and admin features without affecting the core functionality that's already working perfectly.

Run the commands above to create your safe development environment!