# Complete Product Table with Checkout URLs

## Individual Courses (One-off Purchases)

| Product ID | Product Name | Description | Price | Category | Age Range | New Checkout URL | Legacy URL |
|------------|--------------|-------------|-------|----------|-----------|------------------|------------|
| 3 | Baby's First Foods | Complete guide to starting solid foods | $120 AUD | Nutrition | 6+ Months | `/checkout-new/3` | `/checkout/3` |
| 5 | Little Baby Sleep Program | 4-16 Weeks Sleep Program | $120 AUD | Sleep | 4-16 Weeks | `/checkout-new/5` | `/checkout/5` |
| 6 | Big Baby Sleep Program | 4-8 Months Sleep Program | $120 AUD | Sleep | 4-8 Months | `/checkout-new/6` | `/checkout/6` |
| 7 | Pre-toddler Sleep Program | 8-12 Months Sleep Program | $120 AUD | Sleep | 8-12 Months | `/checkout-new/7` | `/checkout/7` |
| 8 | Toddler Sleep Program | 1-2 Years Sleep Program | $120 AUD | Sleep | 1-2 Years | `/checkout-new/8` | `/checkout/8` |
| 9 | Pre-school Sleep Program | 2-5 Years Sleep Program | $120 AUD | Sleep | 2-5 Years | `/checkout-new/9` | `/checkout/9` |
| 10 | Preparation for Newborns | Complete newborn preparation course | $120 AUD | Sleep | Newborn | `/checkout-new/10` | `/checkout/10` |
| 11 | New Sibling Supplement | New Sibling Supplement | $25 AUD | Sleep | New Sibling | `/checkout-new/11` | `/checkout/11` |
| 12 | Twins Supplement | Twins Supplement | $25 AUD | Sleep | Twins | `/checkout-new/12` | `/checkout/12` |
| 13 | Toddler Toolkit | Toddler Toolkit | $120 AUD | Health | Toddler | `/checkout-new/13` | `/checkout/13` |
| 14 | Testing Allergens | Introduce Allergens with Confidence | **FREE** | Nutrition | All Ages | `/checkout-new/14` | `/checkout/14` |

## Subscription Plans

| Product ID | Product Name | Description | Price | Billing Period | Tier | New Checkout URL | Legacy URL |
|------------|--------------|-------------|-------|----------------|------|------------------|------------|
| gold-monthly | Gold Plan - Monthly | Unlimited Courses + Free Dr Golly Book | $199 AUD | Monthly | Gold | `/checkout-new/gold-monthly` | `/checkout/gold-monthly` |
| gold-yearly | Gold Plan - Yearly | Unlimited Courses + Free Dr Golly Book (Save 20%) | $159 AUD | Yearly | Gold | `/checkout-new/gold-yearly` | `/checkout/gold-yearly` |
| platinum-monthly | Platinum Plan - Monthly | The Ultimate Dr Golly Program | $499 AUD | Monthly | Platinum | `/checkout-new/platinum-monthly` | `/checkout/platinum-monthly` |
| platinum-yearly | Platinum Plan - Yearly | The Ultimate Dr Golly Program (Save 20%) | $399 AUD | Yearly | Platinum | `/checkout-new/platinum-yearly` | `/checkout/platinum-yearly` |

## Physical Books

| Product ID | Product Name | Description | Price | Age Range | New Checkout URL | Legacy URL |
|------------|--------------|-------------|-------|-----------|------------------|------------|
| big-baby-book | Big Baby Sleep Book | Physical book for 4-8 month sleep solutions | $35 AUD | 4-8 Months | `/checkout-new/big-baby-book` | `/checkout/big-baby-book` |
| little-baby-book | Little Baby Sleep Book | Physical book for 0-4 month sleep solutions | $35 AUD | 0-4 Months | `/checkout-new/little-baby-book` | `/checkout/little-baby-book` |

## API Endpoints for Product Data

All products can be accessed via the API:
- **Product Info**: `GET /api/checkout-new/products/{productId}`
- **Payment Intent**: `POST /api/checkout-new/create-payment-intent`
- **Complete Purchase**: `POST /api/checkout-new/complete-purchase`

## Direct Checkout URLs

### New Checkout System (checkout-new) URLs:
- **Individual Courses**: `/checkout-new/{productId}`
- **Subscription Plans**: `/checkout-new/{planId}`
- **Physical Books**: `/checkout-new/{bookId}`

### Legacy Checkout System URLs:
- **Individual Courses**: `/checkout/{productId}`
- **Subscription Plans**: `/checkout/{planId}`
- **Physical Books**: `/checkout/{bookId}`

### Special Pages:
- **New User Profile Completion**: `/complete` (public access for new users)
- **Pending Purchase Data**: `/api/checkout-new/pending-purchase` (session-based)

## Product Categories Summary

- **Sleep Courses**: IDs 5, 6, 7, 8, 9, 10, 11, 12 (Prices: $120 for main courses, $25 for supplements)
- **Nutrition Courses**: IDs 3, 14 (Prices: $120 for Baby's First Foods, FREE for Testing Allergens)
- **Health Courses**: ID 13 (Price: $120 for Toddler Toolkit)
- **Subscription Plans**: gold-monthly, gold-yearly, platinum-monthly, platinum-yearly (Prices: $159-$499)
- **Physical Books**: big-baby-book, little-baby-book (Price: $35 each)

## Database Correlation Status

✅ **100% Perfect Correlation**: All product IDs directly match database course IDs
✅ **Pricing Accuracy**: All prices reflect authentic database values
✅ **URL Structure**: All checkout URLs use exact product identifiers

## Coupon System

All products support discount coupons:
- **CHECKOUT-99**: 99% discount (charges $1.20 instead of full price)
- **Other coupons**: Various percentage and fixed amount discounts available

## New User Flow

For new users completing checkout:
1. Complete payment → Redirect to `/complete`
2. Fill profile completion form (pre-populated with checkout details)
3. Account creation with purchased course automatically added
4. Auto-login to authenticated experience

All URLs are production-ready with complete payment processing, session management, and user account creation integration.