# ROLLBACK TO STABLE CHECKOUT - EMERGENCY PROCEDURES

## Quick Rollback Commands

### Option 1: Simple Branch Switch (Preserves Work)
```bash
git checkout main
```

### Option 2: Force Rollback (Discards All Changes)
```bash
git checkout -f main
git clean -fd  # Remove untracked files
```

### Option 3: Stash Current Work and Switch
```bash
git stash push -m "Desktop optimization work in progress"
git checkout main
# To restore later: git stash pop
```

## Stable Checkpoint Information

**Savepoint**: v1.47 - STABLE CHECKOUT (July 24, 2025)
**Status**: Complete public checkout system operational
**Last Known Good State**: All 14 products with working public checkout

### What Works in Stable Version:
- ✅ 12 courses with public checkout URLs
- ✅ 2 books with public checkout URLs  
- ✅ All URLs stored in database
- ✅ Authentication bypass for public checkout
- ✅ Stripe payment processing
- ✅ Regional pricing
- ✅ Mobile-first responsive design

### Database State:
- `courses.public_checkout_url` - 12 entries populated
- `shopping_products.public_checkout_url` - 2 entries populated
- All URLs tested and returning 200 status

### Files at Stable State:
- `PUBLIC_CHECKOUT_URLS_REFERENCE.md` - Complete product table
- `PUBLIC_CHECKOUT_TESTING_GUIDE.md` - Testing documentation
- `public_checkout_final_validation.js` - Validation script
- `server/routes.ts` - Backend API with isDirectPurchase logic
- `client/src/pages/checkout.tsx` - Frontend checkout implementation

## Emergency Rollback Checklist

1. **Immediate Rollback**:
   ```bash
   git checkout main
   ```

2. **Verify System Status**:
   ```bash
   # Test key URLs
   curl -I http://localhost:5000/checkout/6
   curl -I http://localhost:5000/checkout/5
   curl -I http://localhost:5000/checkout/7
   ```

3. **Restart Application**:
   - Use Replit "Start application" workflow
   - Verify server starts on port 5000

4. **Validate Database**:
   ```sql
   SELECT COUNT(*) FROM courses WHERE public_checkout_url IS NOT NULL;
   -- Should return: 12
   
   SELECT COUNT(*) FROM shopping_products WHERE public_checkout_url IS NOT NULL;
   -- Should return: 2
   ```

5. **Test Core Functionality**:
   - Visit `/checkout/6` (Big Baby course)
   - Verify page loads without authentication
   - Confirm payment form appears
   - Check regional pricing applies

## Branch Management

### Current Development Branch:
`feature/checkout-desktop-optimization`

### Stable Branches:
- `main` - Contains SAVEPOINT v1.47
- `dev` - Development integration branch

### Recovery Commands:
```bash
# If branch is corrupted
git branch -D feature/checkout-desktop-optimization
git checkout main
git checkout -b feature/checkout-desktop-optimization

# If local repo is corrupted
git fetch origin
git reset --hard origin/main
```

## Support Information

**Last Stable Test**: July 24, 2025 9:41 AM AEST
**All 14 URLs Status**: ✅ Working (200 response)
**Database Integrity**: ✅ Confirmed
**Payment System**: ✅ Operational

**Key Contacts for Issues**:
- Database: Check `execute_sql_tool` for direct queries
- Frontend: Check `client/src/pages/checkout.tsx`
- Backend: Check `server/routes.ts` for API endpoints

---

**Remember**: The stable checkout system in `main` branch is production-ready with comprehensive testing completed. Only use rollback if desktop optimization work breaks core functionality.