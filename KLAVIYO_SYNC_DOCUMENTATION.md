# Klaviyo Profile Sync Documentation

## Overview
Every user signup and login automatically syncs comprehensive profile data to Klaviyo profiles, creating or updating existing profiles with the latest information.

## Data Synced During SIGNUP

| Field Category | Field Name | Source | Klaviyo Property | Description |
|---|---|---|---|---|
| **Core User Info** | User ID | `user.id` | `user_id` | Unique user identifier |
| | First Name | `user.firstName` | `first_name` | User's first name |
| | Last Name | `user.lastName` | `last_name` | User's last name |
| | Email | `user.email` | `email` | Primary email address |
| | Signup Source | `user.signupSource` | `signup_source` | Origin of signup (App, Big Baby Public Checkout, etc.) |
| | Signup Date | `user.createdAt` | `signup_date` | Account creation timestamp |
| | Last Login | `user.lastLoginAt` | `last_login_at` | Most recent login timestamp |
| | Sign-in Count | `user.signInCount` | `sign_in_count` | Total number of logins |
| **Subscription Info** | Subscription Tier | `user.subscriptionTier` | `subscription_tier` | free/gold/platinum |
| | Subscription Status | `user.subscriptionStatus` | `subscription_status` | active/cancelled/expired |
| | Plan Tier | `user.subscriptionTier` | `plan_tier` | Alternative naming for subscription |
| | Billing Period | `user.billingPeriod` | `billing_period` | monthly/yearly |
| | Next Billing Date | `user.nextBillingDate` | `next_billing_date` | Next payment due date |
| **Contact Info** | Phone Number | `user.phoneNumber` | `phone_number` | E.164 formatted phone |
| | Phone Region | `user.country` | `phone_number_region` | Country/region code |
| **Profile & Preferences** | User Role | `user.userRole` | `user_role` | User's role in app |
| | Primary Concerns | `user.primaryConcerns` | `primary_concerns` | Health/sleep concerns |
| | Marketing Opt-in | `user.marketingOptIn` | `marketing_opt_in` | Email marketing consent |
| | SMS Marketing Opt-in | `user.smsMarketingOptIn` | `sms_marketing_opt_in` | SMS marketing consent |
| | Terms Accepted | `user.acceptedTerms` | `accepted_terms` | Terms acceptance status |
| **Course Data** | Courses Purchased Previously | `user.coursesPurchasedPreviously` | `courses_purchased_previously` | Legacy course data |
| | Course Count | `user.countCourses` | `count_courses` | Number of courses owned |
| | **Real-time Purchase Data** | `coursePurchases` | `courses_purchased_count` | Current purchased courses count |
| | Course List | `coursePurchases` | `courses_purchased_list` | Comma-separated course names |
| | Total Purchase Amount | `coursePurchases` | `courses_purchased_total_amount` | Total spent on courses |
| | Last Purchase Date | `coursePurchases` | `last_course_purchase_date` | Most recent purchase |
| | Last Course Purchased | `coursePurchases` | `last_course_purchased` | Most recent course name |
| **System Info** | Migrated Status | `user.migrated` | `migrated` | Migration from old system |
| | Admin Status | `user.isAdmin` | `is_admin` | Administrative privileges |
| | Onboarding Complete | `user.onboardingCompleted` | `onboarding_completed` | Setup completion status |
| | New Member Offer Shown | `user.newMemberOfferShown` | `new_member_offer_shown` | Offer display tracking |
| | New Member Offer Accepted | `user.newMemberOfferAccepted` | `new_member_offer_accepted` | Offer acceptance tracking |
| **Payment Integration** | Stripe Customer ID | `user.stripeCustomerId` | `stripe_customer_id` | Stripe customer identifier |
| | Stripe Subscription ID | `user.stripeSubscriptionId` | `stripe_subscription_id` | Stripe subscription identifier |
| **Children Data** | Children Count | `children.length` | `children_count` | Number of children |
| | Child 1 Birth Date | `children[0].dateOfBirth` | `child_1_birthdate` | First child's birth date |
| | Child 1 Name | `children[0].name` | `child_1_name` | First child's name |
| | Child 1 Gender | `children[0].gender` | `child_1_gender` | First child's gender |
| | Child 2 Birth Date | `children[1].dateOfBirth` | `child_2_birthdate` | Second child's birth date |
| | Child 2 Name | `children[1].name` | `child_2_name` | Second child's name |
| | Child 2 Gender | `children[1].gender` | `child_2_gender` | Second child's gender |
| | Child 3 Birth Date | `children[2].dateOfBirth` | `child_3_birthdate` | Third child's birth date |
| | Child 3 Name | `children[2].name` | `child_3_name` | Third child's name |
| | Child 3 Gender | `children[2].gender` | `child_3_gender` | Third child's gender |
| **Metadata** | Profile Updated | `new Date()` | `profile_updated_at` | Last sync timestamp |

## Data Synced During LOGIN (All signup data PLUS)

| Field Category | Field Name | Source | Klaviyo Property | Description |
|---|---|---|---|---|
| **Updated Login Data** | Last Sign-in | `user.lastSignIn` | `last_sign_in` | Updated login timestamp |
| | Last Login At | `user.lastLoginAt` | `last_login_at` | Updated for MAU tracking |
| | Sign-in Count | `user.signInCount + 1` | `sign_in_count` | Incremented login counter |
| **Real-time Course Data** | Current Purchases | `storage.getUserCoursePurchases()` | `courses_purchased_*` | Live course purchase data |
| **Stripe Integration** | Subscription Status | `stripeData.subscriptionStatus` | `stripe_subscription_status` | Live Stripe subscription status |
| | Next Billing Date | `stripeData.nextBillingDate` | `stripe_next_billing_date` | Live billing information |
| | Payment Method Type | `stripeData.paymentMethodType` | `stripe_payment_method_type` | Current payment method |
| | Last Payment Date | `stripeData.lastPaymentDate` | `stripe_last_payment_date` | Most recent payment |
| | Total Spent | `stripeData.totalSpent` | `stripe_total_spent` | Lifetime customer value |
| **Children Updates** | Updated Children Data | `storage.getUserChildren()` | `child_*` | Current children information |

## Course Purchase Events

When a course is purchased, a separate "Course Purchase" event is sent to Klaviyo with:

| Field | Source | Description |
|---|---|---|
| `course_name` | `coursePurchase.courseName` | Name of purchased course |
| `course_id` | `coursePurchase.courseId` | Course identifier |
| `purchase_amount` | `coursePurchase.amount / 100` | Purchase amount in dollars |
| `currency` | `coursePurchase.currency` | Payment currency |
| `purchase_date` | `coursePurchase.purchasedAt` | Purchase timestamp |
| `payment_intent_id` | `coursePurchase.paymentIntentId` | Stripe payment ID |
| `customer_email` | `coursePurchase.customerEmail` | Purchaser email |
| `customer_name` | `coursePurchase.customerName` | Purchaser name |
| `purchase_status` | `coursePurchase.status` | Purchase status |

## Login Events

Every login triggers a "User Login" event with:

| Field | Source | Description |
|---|---|---|
| `login_time` | `new Date()` | Login timestamp |
| `user_id` | `user.id` | User identifier |
| `subscription_tier` | `user.subscriptionTier` | Current subscription |
| `sign_in_count` | `user.signInCount` | Login counter |
| `stripe_customer_id` | `stripeData.customerId` | Stripe customer ID (if available) |
| `stripe_subscription_status` | `stripeData.subscriptionStatus` | Stripe status (if available) |

## Subscription Management

Email and SMS subscription preferences are managed through:
- `marketing_opt_in` - Email marketing consent
- `sms_marketing_opt_in` - SMS marketing consent

## List Management

Users are automatically added to Klaviyo lists:
- **Superapp List** (`XBRBuN`) - All app users
- **App Signups List** (`WyGwy9`) - New signups

## Data Freshness

- **Signup**: Profile created with all available data
- **Login**: Profile updated with latest data every login
- **Course Purchase**: Real-time sync when purchase completed
- **Subscription Changes**: Updated through Stripe webhook integration
- **Children Updates**: Synced when family data changes

## Performance Optimizations

- **Asynchronous Sync**: Klaviyo updates happen in background to avoid blocking login
- **5-minute Caching**: Stripe data cached to prevent rate limiting
- **Duplicate Handling**: Existing profiles updated rather than creating duplicates
- **Error Handling**: Klaviyo failures don't block core app functionality

## Security & Privacy

- **API Key Management**: Klaviyo API key stored securely in environment variables
- **Data Validation**: All data sanitized before sending to Klaviyo
- **Consent Tracking**: Marketing preferences properly managed
- **Phone Number Formatting**: Automatic E.164 format conversion for international compatibility