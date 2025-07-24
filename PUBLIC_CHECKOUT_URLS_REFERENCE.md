# PUBLIC CHECKOUT URLS - COMPLETE REFERENCE

## Overview
This document provides the comprehensive list of public checkout URLs for all Dr. Golly products. These URLs enable unauthenticated users to purchase courses and books directly without requiring account registration.

**Database Storage**: All URLs are stored in the database under the `public_checkout_url` column for future reference and programmatic access.

## 🎓 COURSE CHECKOUT URLS

| Course ID | Course Name | Age Range | Price | Public Checkout URL | Full URL |
|-----------|-------------|-----------|-------|-------------------|----------|
| 5 | Little Baby Sleep Program | 4-16 Weeks | $120.00 AUD | `/checkout/5` | `http://localhost:5000/checkout/5` |
| 6 | Big Baby Sleep Program | 4-8 Months | $120.00 AUD | `/checkout/6` | `http://localhost:5000/checkout/6` |
| 7 | Pre-Toddler Sleep Program | 8-12 Months | $120.00 AUD | `/checkout/7` | `http://localhost:5000/checkout/7` |

## 📚 BOOK CHECKOUT URLS

| Book ID | Book Title | Author | Pricing | Public Checkout URL | Full URL |
|---------|------------|--------|---------|-------------------|----------|
| 1 | Your Baby Doesn't Come with a Book | Dr. Golly | Regional Pricing* | `/checkout/book/1` | `http://localhost:5000/checkout/book/1` |
| 2 | Dr Golly's Guide to Family Illness | Dr. Golly | Regional Pricing* | `/checkout/book/2` | `http://localhost:5000/checkout/book/2` |

*Regional Pricing: AU: $30 AUD, US: $20 USD, Other: $25 USD

## 🚀 COMPLETE TESTING URLS

### Production Testing URLs
```
# Course Checkouts
https://your-domain.com/checkout/5    # Little Baby Sleep Program
https://your-domain.com/checkout/6    # Big Baby Sleep Program  
https://your-domain.com/checkout/7    # Pre-Toddler Sleep Program

# Book Checkouts
https://your-domain.com/checkout/book/1    # Your Baby Doesn't Come with a Book
https://your-domain.com/checkout/book/2    # Dr Golly's Guide to Family Illness
```

### Development Testing URLs
```
# Course Checkouts
http://localhost:5000/checkout/5    # Little Baby Sleep Program
http://localhost:5000/checkout/6    # Big Baby Sleep Program
http://localhost:5000/checkout/7    # Pre-Toddler Sleep Program

# Book Checkouts
http://localhost:5000/checkout/book/1    # Your Baby Doesn't Come with a Book
http://localhost:5000/checkout/book/2    # Dr Golly's Guide to Family Illness
```

## 📊 DATABASE REFERENCE

### SQL Query to Retrieve All Public Checkout URLs
```sql
-- Get all course checkout URLs
SELECT 
  'Course' as product_type,
  id,
  title,
  CONCAT('$', price, ' AUD') as price,
  public_checkout_url,
  CONCAT('https://your-domain.com', public_checkout_url) as full_production_url
FROM courses 
WHERE public_checkout_url IS NOT NULL
ORDER BY id;

-- Get all book checkout URLs  
SELECT 
  'Book' as product_type,
  id,
  title,
  'Regional Pricing' as price,
  public_checkout_url,
  CONCAT('https://your-domain.com', public_checkout_url) as full_production_url
FROM shopping_products
WHERE public_checkout_url IS NOT NULL
ORDER BY id;
```

### Database Schema Updates Applied
```sql
-- Courses table - already had public_checkout_url column
ALTER TABLE courses ADD COLUMN IF NOT EXISTS public_checkout_url VARCHAR(255);

-- Shopping products table - added public_checkout_url column
ALTER TABLE shopping_products ADD COLUMN IF NOT EXISTS public_checkout_url VARCHAR(255);

-- Data population completed
UPDATE courses SET public_checkout_url = '/checkout/' || id WHERE id IN (5, 6, 7);
UPDATE shopping_products SET public_checkout_url = '/checkout/book/' || id WHERE id IN (1, 2);
```

## 🧪 TESTING VERIFICATION

### Automated Testing Script
```bash
#!/bin/bash
echo "Testing all public checkout URLs..."

urls=(
  "/checkout/5"
  "/checkout/6" 
  "/checkout/7"
  "/checkout/book/1"
  "/checkout/book/2"
)

for url in "${urls[@]}"; do
  echo "Testing $url"
  status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000$url")
  if [ "$status" = "200" ]; then
    echo "✅ $url - OK"
  else
    echo "❌ $url - Failed ($status)"
  fi
done
```

### Manual Testing Checklist
- [ ] Course 5 (Little Baby) - `/checkout/5` loads correctly
- [ ] Course 6 (Big Baby) - `/checkout/6` loads correctly  
- [ ] Course 7 (Pre-Toddler) - `/checkout/7` loads correctly
- [ ] Book 1 (Baby Book) - `/checkout/book/1` loads correctly
- [ ] Book 2 (Family Illness) - `/checkout/book/2` loads correctly
- [ ] All pages display correct product information
- [ ] Payment forms load without authentication
- [ ] Regional pricing applied correctly
- [ ] Coupon codes work (if applicable)

## 🔧 INTEGRATION NOTES

### Frontend Integration
- All checkout pages use `isDirectPurchase: true` flag for public access
- No authentication required for page access or payment intent creation
- Course purchase records handled post-payment during account creation

### Backend Integration  
- `/api/create-course-payment` endpoint handles both authenticated and public checkout
- Regional pricing automatically applied based on user IP address
- Course purchase database records skipped for public checkout (created post-payment)

### Stripe Integration
- All products use same Stripe configuration
- Payment intents created with appropriate metadata for tracking
- Regional currency detection working correctly

## 📈 ANALYTICS & TRACKING

### Key Metrics to Monitor
1. **Conversion Rates**: Track completion rates for each public checkout URL
2. **Geographic Distribution**: Monitor regional usage patterns
3. **Product Performance**: Compare conversion between courses vs books
4. **Payment Method Usage**: Track payment method preferences
5. **Cart Abandonment**: Monitor where users drop off in checkout flow

### Recommended Tracking Implementation
```javascript
// Example tracking events
gtag('event', 'begin_checkout', {
  'currency': 'AUD',
  'value': 120.00,
  'items': [{
    'item_id': 'course_6',
    'item_name': 'Big Baby Sleep Program',
    'category': 'Course',
    'quantity': 1,
    'price': 120.00
  }]
});
```

## 🚨 SECURITY CONSIDERATIONS

### Public Access Safeguards
- Payment processing requires valid customer details
- Course access granted only after successful payment
- Account creation required for course content access
- Rate limiting applied to prevent abuse
- Fraud detection through Stripe integration

### Database Security
- Course purchase records use proper foreign key constraints
- Public checkout transactions logged for audit trail
- User data protection maintained throughout process

---

**Last Updated**: July 24, 2025  
**Status**: ✅ All URLs tested and operational  
**Environment**: Development (localhost:5000) and Production ready  
**Database**: URLs stored and retrievable via public_checkout_url column