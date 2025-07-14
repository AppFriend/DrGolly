# Branch to Page/Feature Mapping

Based on your application structure, here's the definitive mapping of branches to pages and features:

## 🏠 **feature/home** → Home Page System
**Files & Components:**
- `client/src/pages/home.tsx` - Main home page component
- `client/src/components/home/` - Home-specific components
- Home page banner and welcome messages
- Gold/Platinum plan upgrade promotions
- Course progress overview cards
- Quick access navigation

**Features:**
- User dashboard and overview
- Plan status display (Free/Gold/Platinum)
- Course progress summaries
- Welcome banners and promotions
- Quick navigation to other sections

---

## 📚 **feature/courses** → Course Learning System
**Files & Components:**
- `client/src/pages/courses.tsx` - Course listing and filters
- `client/src/pages/course-overview.tsx` - Individual course details
- `client/src/pages/course-lesson.tsx` - Lesson content display
- `client/src/components/courses/` - Course-related components
- `client/src/components/ui/video-card.tsx` - Course thumbnail cards

**Features:**
- Course catalog and filtering
- Course progress tracking
- Lesson navigation and content
- Video content and materials
- Chapter/module organization
- Course completion tracking

---

## 📊 **feature/tracking** → Family Health Tracking
**Files & Components:**
- `client/src/pages/tracking.tsx` - Main tracking dashboard
- `client/src/components/tracking/` - Tracking components
- Growth tracking (weight, height, head circumference)
- Development milestones
- Feed tracking (breastfeeding timers)
- Sleep tracking and logging

**Features:**
- Child growth monitoring
- Development milestone tracking
- Feeding session timers
- Sleep pattern logging
- Health data visualization
- Progress reports

---

## 🎁 **feature/discounts** → Partner Discounts System
**Files & Components:**
- `client/src/pages/discounts.tsx` - Discount catalog
- `client/src/components/discounts/` - Discount components
- Partner brand integration
- Discount code management
- Tier-based access control

**Features:**
- Partner discount catalog
- Discount code redemption
- Tier-based discount access
- Partner brand integration
- Discount usage tracking

---

## 👨‍👩‍👧‍👦 **feature/family** → Family Management System
**Files & Components:**
- `client/src/pages/family.tsx` - Family management page
- `client/src/components/family/` - Family components
- Child profile management
- Family member invitations
- Role-based access control

**Features:**
- Add/edit children profiles
- Family member management
- Child profile pictures
- Family sharing capabilities
- Role-based permissions

---

## ⚙️ **feature/settings** → User Settings & Profile
**Files & Components:**
- `client/src/pages/profile.tsx` - User profile management
- `client/src/components/settings/` - Settings components
- Account settings and preferences
- Subscription management
- Payment methods and billing

**Features:**
- Profile editing (name, email, phone)
- Subscription plan management
- Payment method management
- Billing history and invoices
- Account preferences
- Notification settings

---

## 🛒 **feature/checkout** → E-commerce & Payment System
**Files & Components:**
- `client/src/pages/checkout.tsx` - Authenticated checkout
- `client/src/pages/Big-baby-public.tsx` - Public checkout
- `client/src/components/checkout/` - Checkout components
- `client/src/components/cart/` - Cart management
- `server/routes/checkout.ts` - Checkout API endpoints

**Features:**
- Shopping cart functionality
- Stripe payment integration
- Coupon/discount application
- Apple Pay/Google Pay support
- Order processing and confirmation
- Course and book purchases

---

## 👑 **feature/admin** → Administrative Panel
**Files & Components:**
- `client/src/pages/admin.tsx` - Admin dashboard
- `client/src/components/admin/` - Admin components
- User management and analytics
- Course content management
- System monitoring and reports

**Features:**
- User management (17,500+ users)
- Course content editing
- Analytics and reporting
- Subscription management
- System monitoring
- Blog post management

---

## 🔧 **Supporting Systems** (Cross-Branch)
These files may be touched by multiple branches:

### Authentication & Core
- `server/auth-utils.ts` - Authentication utilities
- `server/storage.ts` - Database operations
- `shared/schema.ts` - Database schema

### UI Components
- `client/src/components/ui/` - Shared UI components
- `client/src/components/layout/` - Layout components
- `client/src/hooks/` - Custom React hooks

### API Routes
- `server/routes.ts` - Main API routes
- `server/routes/` - Feature-specific routes

## 📋 **Branch Usage Guidelines**

### When to use **feature/home**:
- Updating dashboard layout
- Changing welcome messages
- Modifying plan upgrade prompts
- Home page performance improvements

### When to use **feature/courses**:
- Adding new course features
- Improving lesson navigation
- Enhancing video playback
- Course progress tracking improvements

### When to use **feature/tracking**:
- Adding new tracking categories
- Improving data visualization
- Enhancing timer functionality
- Health metric calculations

### When to use **feature/checkout**:
- Payment flow improvements
- Cart functionality enhancements
- Stripe integration updates
- Coupon system modifications

### When to use **feature/admin**:
- User management improvements
- Analytics dashboard updates
- Course content management
- System monitoring features

## 🚨 **Important Notes**

1. **Cross-feature changes**: If a change affects multiple areas, create a separate branch like `feature/cross-system/notification-updates`

2. **Emergency fixes**: Use `hotfix/` branches for critical issues affecting production

3. **Database changes**: Document all schema changes in the branch description

4. **Testing**: Each branch should include relevant tests for its features

5. **Documentation**: Update relevant documentation when making changes to features