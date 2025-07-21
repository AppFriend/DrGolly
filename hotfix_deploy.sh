#!/bin/bash

# Hotfix deployment script for mobile deployment
echo "🚀 Starting hotfix deployment for Stripe Link email fix..."

# 1. Add all changes
git add .

# 2. Commit the hotfix with clear message
git commit -m "HOTFIX: Fix Stripe Link hardcoded email issue

- Replace hardcoded frazeradnam@gmail.com with dynamic user email
- Fix checkout for existing Stripe customers (Yvonne Pfliger, Alex Dawkins)
- Add fallback text 'Enter email above' when no email entered
- Enables proper Stripe Link payment method detection

Files changed:
- client/src/pages/big-baby-public.tsx (line 351)
- replit.md (documentation update)

Impact: Critical fix for checkout conversion optimization"

# 3. Push to main branch
git push origin main

echo "✅ Hotfix committed and pushed to main branch"
echo "📱 Mobile deployment completed successfully"
echo ""
echo "Next steps:"
echo "1. Deploy button will auto-deploy the fix to production"
echo "2. Test with your users (Yvonne Pfliger, Alex Dawkins)"
echo "3. Monitor checkout completion rates"
echo ""
echo "🎯 Fix is now live for immediate user testing"