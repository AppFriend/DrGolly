# replit.md

## Overview

This is a full-stack web application built with React and Express.js that provides a mobile-first learning management system focused on parenting and sleep expertise. The application features course management, user progress tracking, subscription tiers, partner discounts, and family sharing capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions stored in PostgreSQL
- **Database Provider**: Neon serverless PostgreSQL

### Mobile-First Design
The application is designed as a mobile-first experience with:
- Bottom navigation for primary user flows
- Responsive design optimized for mobile devices
- Touch-friendly interactions and gestures
- Progressive enhancement for larger screens

## Key Components

### Authentication System
- **Provider**: Replit Auth using OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **User Management**: Automatic user creation and profile management
- **Authorization**: Role-based access control for content tiers

### Course Management
- **Content Organization**: Courses categorized by sleep, nutrition, health, and freebies
- **Tier System**: Free, Gold, and Platinum content access levels
- **Progress Tracking**: Individual user progress per course
- **Video Delivery**: Video content with thumbnail previews

### Subscription System
- **Tiers**: Free, Gold, and Platinum subscription levels
- **Billing**: Monthly and yearly billing periods
- **Access Control**: Content gating based on subscription tier
- **Billing History**: Transaction tracking and management

### Partner Discounts
- **Tier-based Access**: Discounts available based on subscription level
- **Partner Integration**: Brand partnerships with discount codes
- **Redemption Tracking**: Code usage and expiration management

### Family Sharing
- **Multi-user Support**: Family account management
- **Role-based Access**: Admin and member roles
- **Shared Progress**: Family-wide progress tracking
- **Invitation System**: Email-based family member invitations

## Data Flow

### User Authentication Flow
1. User visits application
2. Replit Auth redirects to OpenID Connect provider
3. User authenticates and returns with tokens
4. Session created and stored in PostgreSQL
5. User profile created or updated in database
6. Client receives authentication status

### Course Access Flow
1. User requests course content
2. Server validates subscription tier
3. Content filtered based on access level
4. Progress tracking updated on interaction
5. Client receives authorized content

### Subscription Management Flow
1. User selects subscription tier
2. Payment processing (external integration)
3. Database updated with subscription details
4. Access permissions refreshed
5. Billing history recorded

## External Dependencies

### Database
- **Provider**: Neon serverless PostgreSQL
- **ORM**: Drizzle with TypeScript support
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Connection pooling with @neondatabase/serverless

### UI Framework
- **Component Library**: shadcn/ui built on Radix UI
- **Styling**: Tailwind CSS with CSS variables
- **Icons**: Lucide React icons
- **Form Handling**: React Hook Form with Zod validation

### Development Tools
- **Build System**: Vite with React plugin
- **TypeScript**: Full TypeScript support across stack
- **Code Quality**: ESLint and Prettier configuration
- **Development**: Hot module replacement and error overlay

## Deployment Strategy

### Production Build
- **Client**: Vite builds React app to `dist/public`
- **Server**: esbuild bundles Express server to `dist/index.js`
- **Assets**: Static files served from build directory
- **Environment**: NODE_ENV=production for optimizations

### Database Setup
- **Schema**: Drizzle migrations applied via `db:push`
- **Environment**: DATABASE_URL required for connection
- **Sessions**: Automatic session table creation
- **Seeding**: Initial data populated via storage layer

### Environment Variables
- **DATABASE_URL**: PostgreSQL connection string
- **SESSION_SECRET**: Session encryption key
- **REPL_ID**: Replit environment identifier
- **ISSUER_URL**: OpenID Connect issuer endpoint

## Changelog

```
Changelog:
- July 08, 2025. Initial setup
- July 08, 2025. Extended user schema with CSV attributes (country, phone, signup source, etc.)
- July 08, 2025. Implemented comprehensive 5-section tracking system:
  * Growth Tracking (weight, height, head circumference with history)
  * Development Tracking (milestone videos with achievement status)
  * Feed Tracking (breastfeeding timer with duration logs)
  * Sleep Tracking (sleep periods with quality ratings)
  * Sleep Review (consultation booking system)
- July 08, 2025. Added Family management page for adding/viewing children
- July 08, 2025. Seeded 10 CSV users and their children for testing
- July 08, 2025. Created sample development milestones database
- July 08, 2025. Fixed sleep tracking database column mismatch (sleepStart/sleepEnd -> startTime/endTime)
- July 08, 2025. Added sleep quality field to sleep entries schema
- July 08, 2025. Implemented comprehensive courses system with modules and submodules:
  * Added courseModules and courseSubmodules tables
  * Added userSubmoduleProgress tracking
  * Extended courses table with price, skillLevel, stripeProductId
  * Created API endpoints for module/submodule access and progress tracking
- July 08, 2025. Integrated Klaviyo API for user profile creation and superapp list management
- July 08, 2025. Populated courses database from Bubble CSV export with 11 courses and modules
- July 08, 2025. Created comprehensive feature flags system for subscription tier access control:
  * Added featureFlags table with Free/Gold/Platinum access permissions
  * Implemented 8 feature flags including courses access, growth tracking review, discounts
  * Created API endpoints for feature access checking
  * Built React hooks and components for feature gating (FeatureGate, FeatureToggle)
  * Seeded database with plan-specific permissions (Free: home+basic features, Gold: unlimited courses+full access)
- July 08, 2025. Completed URL-based routing system for all authentication and navigation:
  * Created dedicated /login and /signup pages with proper form handling
  * Updated App.tsx router to handle URL-based flows instead of modals
  * Implemented proper URL routing for all bottom navigation pages (/home, /courses, /track, /family)
  * Added URL routes for payment and management pages (/checkout, /manage)
  * Updated BottomNavigation component to use URL navigation
  * Landing page now routes to /signup and /login URLs instead of using modals
- July 08, 2025. Implemented database-driven feature flag monetization system:
  * Integrated courses pricing with feature flags - free users see $120 individual pricing
  * Locked discounts page for free users with upgrade modal and sample locked content
  * Connected all access controls to feature flags database for automatic updates
  * Fixed white screen flash during filter transitions with smooth loading overlays
  * Added comprehensive upgrade prompts throughout the free user experience
- July 08, 2025. Built comprehensive first-time login system for 20,000 user bulk import:
  * Extended user schema with temporary password fields (temporaryPassword, isFirstLogin, hasSetPassword, passwordHash)
  * Created temporaryPasswords table with expiration tracking and usage validation
  * Implemented AuthUtils service for password hashing, generation, and validation
  * Added bulk user import API endpoint with batch processing for 20,000+ users
  * Created temporary password authentication flow with 30-day expiration
  * Built password setup modal with real-time validation and strength requirements
  * Added TempLoginForm component for seamless first-time user authentication
  * Implemented BulkUserImport admin component with CSV parsing and progress tracking
  * Added bulk import tab to admin panel with performance optimization for concurrent users
- July 08, 2025. Optimized admin interface for mobile iPhone viewing:
  * Redesigned AdminUserManagement with compact vertical layout and truncated text
  * Optimized AdminCourseManagement with mobile-first responsive design
  * Updated AdminUserSettings to focus only on admin users (removed regular users section)
  * Implemented touch-friendly buttons and mobile-optimized spacing across all admin components
  * Created consistent mobile design patterns with smaller avatars, compact cards, and efficient layouts
- July 08, 2025. Rebuilt comprehensive Dr. Golly signup flow matching exact app design:
  * Reordered steps: Account → Personal Info → Interests → Offer → Complete
  * Added phone number with country code selection, role selection, profile picture upload
  * Implemented terms acceptance and marketing opt-in checkboxes
  * Created multiple interest selection (Baby Sleep, Toddler Sleep, Toddler Behaviour, Partner discounts)
  * Added new member Gold subscription offer with 50% discount
  * Updated database schema with new personalization fields
  * Implemented API endpoints for personalization data persistence
  * Applied Dr. Golly brand colors (teal buttons, clean white background)
  * Created mobile-first design with proper spacing and rounded inputs
- July 08, 2025. Implemented comprehensive 404 error prevention system:
  * Fixed authentication flow to handle 401 responses gracefully with proper query configuration
  * Created authGuards utility with route validation and redirect logic
  * Added ErrorBoundary component with retry functionality for component-level error handling
  * Implemented routing configuration validation to prevent future routing issues
  * Added comprehensive error logging and development debugging tools
  * Created authentication-aware redirect system to prevent unauthorized access loops
- July 08, 2025. Implemented dual-timer breastfeeding system:
  * Split feed timer into separate left and right breast timers with individual start/stop controls
  * Added session tracking with cumulative duration for each breast
  * Updated database schema to store leftDuration, rightDuration, and totalDuration in minutes
  * Created comprehensive feed session UI with individual timer displays and session summary
  * Implemented proper logging system that records complete feed session with timestamps
  * Updated feed history display to show left/right breast durations and total time
  * Added session controls for logging complete feeds and resetting timers
- July 09, 2025. Created comprehensive profile page system:
  * Built complete profile page at /profile route with tabbed interface
  * Implemented profile image click handler in header to navigate to profile page
  * Added profile details editing with firstName, lastName, email, and phone
  * Created current plan display showing subscription tier and status
  * Built payment history section with Stripe invoice integration
  * Added payment methods management with default payment method updates
  * Implemented shareable referral code system with copy functionality (DRG-015)
  * Added logout functionality that properly redirects to login page
  * Created mobile-optimized 5-tab interface (Profile, Plan, Invoices, Payment, Referral)
  * Integrated Stripe API for real invoice and payment method data
  * Added profile picture upload functionality with camera icon
  * Built comprehensive API routes for profile management and Stripe integration
- July 09, 2025. Updated blog post formatting for consistent, clean display:
  * Standardized heading sizes (H1: 2xl, H2: xl, H3: lg) matching app design
  * Unified body text to base size (16px) with consistent gray-700 color
  * Improved list formatting with proper spacing and consistent styling
  * Applied clean content structure with proper section spacing
  * Updated all blog post content in database with new formatting
- July 09, 2025. Enhanced course purchase and display system:
  * Fixed profile picture upload functionality in signup flow
  * Implemented "My Courses" tab showing user's purchased courses
  * Created course purchase tracking with proper user data isolation
  * Added empty state banner for users with no purchased courses
  * Updated course display logic: purchased courses show "Access Course", unpurchased show "$120 purchase option"
  * Connected Gold/Platinum subscribers to unlimited course access
  * Implemented proper course filtering for free users vs subscribers
- July 09, 2025. Implemented comprehensive Gold plan user experience:
  * Updated courses system: Gold users get unlimited access to all courses in "All Courses" tab
  * Preserved purchased courses in "Purchases" tab (renamed from "My Courses") for downgrade protection
  * Added gold gradient banner (gold to orange) with black text for Gold/Platinum users on home page
  * Enhanced top bar plan indicator with gold gradient icon and "Gold Plan" text
  * Integrated feature flags system: all Gold features unlocked (unlimited courses, discounts, family sharing, tracking review)
  * Updated user database: frazer.adnam@cq-partners.com.au set to Gold plan with active status
  * Changed tab label from "My Courses" to "Purchases" for clarity
- July 09, 2025. Enhanced Stripe integration for comprehensive course purchase tracking:
  * Added intelligent customer creation: checks for existing Stripe customers by email before creating new profiles
  * Implemented comprehensive payment metadata mapping: course details, user info, subscription tier stored in Stripe
  * Added webhook endpoint for automatic payment completion handling and purchase status updates
  * Created real-time purchase tracking: courses appear in "Purchases" tab immediately after successful payment
  * Enhanced database filtering: only completed purchases show in user's course library
  * Added automatic refresh mechanism: "Purchases" tab updates every 5 seconds to show new purchases
  * Implemented success notifications: users see confirmation when course purchase completes
  * Added manual payment confirmation endpoint for development and testing purposes
- July 09, 2025. Implemented comprehensive Stripe invoice and payment method management in profile system:
  * Created detailed invoice history display with Stripe invoice retrieval and formatting
  * Added payment method management with card details, expiration dates, and default payment method setting
  * Implemented secure payment method removal with user confirmation
  * Added downloadable invoice links with PDF access through Stripe hosted invoice URLs
  * Created comprehensive profile management with user data editing and real-time updates
  * Integrated invoice amounts, tax calculations, and transaction status tracking
  * Added proper currency formatting and invoice number display for all $120 course purchases
  * Built mobile-optimized 5-tab profile interface (Profile, Plan, Invoices, Payment, Referral)
- July 09, 2025. Enhanced Big Baby public checkout with mobile-optimized payment methods:
  * Added intelligent device detection for mobile vs desktop payment options
  * Implemented Stripe Payment Request API for Apple Pay (iOS) and Google Pay (Android)
  * Mobile users see express payment button (Apple Pay/Google Pay) followed by Link and Card tabs
  * Desktop users see only Link and Card payment tabs (no express payment buttons)
  * Fixed duplicate Link payment method issue by removing redundant buttons
  * Added proper email validation to prevent Stripe payment errors
  * Configured PaymentElement with Link-first ordering for optimal user experience
- July 09, 2025. Implemented comprehensive regional pricing system with IP-based currency detection:
  * Added regionalPricing database table with currency, region, amount fields for flexible multi-currency support
  * Integrated geoip-lite package for automatic IP-based geographic region detection
  * Created regional pricing service with default pricing: $120 AUD (Australia), $120 USD (US), €120 EUR (Europe)
  * Updated all pricing endpoints to use regional pricing: course purchases, subscription creation, Big Baby public checkout
  * Enhanced subscription checkout and manage pages to display regional currency symbols and pricing
  * Implemented dynamic Stripe price creation for multi-currency subscription billing
  * Added regional pricing API endpoints for frontend pricing display and management
  * Updated all payment forms to show correct currency symbols ($ for AUD/USD, € for EUR)
  * Connected regional pricing to Gold/Platinum subscription tiers with proper currency conversion
  * Ensured consistent pricing display across all components: manage page, checkout forms, course displays
- July 09, 2025. Replaced text headers with Dr. Golly logo for consistent branding:
  * Updated landing page to use Dr. Golly logo instead of text header
  * Updated signup page to use Dr. Golly logo in header navigation
  * Updated admin panel to use Dr. Golly logo in header with "Admin Panel" text
  * Ensured consistent logo sizing (h-8) and styling across all pages
  * Home page and Big Baby public page already had logo implementation
- July 09, 2025. Enhanced /checkout page with seamless Apple Pay and Link payment functionality:
  * Added intelligent device detection for mobile vs desktop payment options
  * Implemented Stripe Payment Request API for Apple Pay (iOS) and Google Pay (Android) on mobile devices
  * Created tabbed payment interface with Link and Card payment methods
  * Simplified user details section for logged-in users - removed redundant form fields
  * Added regional pricing support with proper currency detection (AUD/USD/EUR)
  * Mobile users see express payment buttons followed by Link/Card tabs
  * Desktop users see Link/Card tabs without express payment options
  * Integrated multi-currency support matching Big Baby public checkout functionality
  * Updated checkout form to use regional pricing for accurate payment processing
- July 09, 2025. Fixed child deletion foreign key constraint error in family management:
  * Removed duplicate deleteChild functions that were causing foreign key constraint violations
  * Cleaned up duplicate getChild and updateChild functions in storage.ts
  * Proper cascade deletion now works: removes all related records (growth entries, development tracking, feed entries, sleep entries) before deleting child
  * Fixed "Failed to delete child" error when removing family members from family section
- July 09, 2025. Added optional profile picture support for children:
  * Extended children database schema with profilePicture field for storing image data
  * Added profile picture upload functionality to family management page with file input and preview
  * Updated child display cards to show circular profile pictures or default baby icon
  * Enhanced growth tracking dropdown to display child profile pictures as circular avatars
  * Implemented Base64 image encoding for profile picture storage and display
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```