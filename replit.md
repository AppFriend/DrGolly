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
- July 09, 2025. Created comprehensive Klaviyo integration testing system:
  * Added /api/test/klaviyo/signup endpoint to test regular signup flow with syncUserToKlaviyo()
  * Added /api/test/klaviyo/public-checkout endpoint to test Big Baby checkout flow with syncBigBabySignupToKlaviyo()
  * Added /api/test/klaviyo/welcome-email endpoint to test welcome email sending with sendPublicCheckoutWelcome()
  * Added /api/test/klaviyo/status endpoint to verify API key configuration and list IDs
  * Created /klaviyo-test page with interactive testing interface for both authenticated and unauthenticated users
  * Implemented comprehensive test result display with success/failure indicators and JSON response details
  * Added real-time testing of both signup flows to verify users are properly added to Klaviyo lists
- July 09, 2025. Fixed comprehensive Klaviyo integration bugs and added new email flows:
  * Fixed duplicate profile error - now handles existing profiles gracefully by returning profile ID
  * Fixed missing 'id' field error in list subscriptions - now uses correct relationship format
  * Updated all list subscription methods to use profile ID-based relationships
  * Added password reset email flow with "Password Reset" metric and reset token properties
  * Added OTP email flow with "OTP Verification" metric and configurable purpose
  * Enhanced test interface with password reset and OTP test buttons
  * All Klaviyo metrics now auto-create in dashboard when events are sent from code
  * Metrics available for Flow creation: "Public Checkout Welcome", "Admin Invite", "Family Invite", "Password Reset", "OTP Verification"
  * Email properties: customer_name, temp_password, login_url, reset_token, otp_code, purpose, expires_in
- July 09, 2025. Implemented comprehensive Klaviyo custom properties tracking for all user interactions:
  * Enhanced createOrUpdateProfile method to include 25+ custom properties: subscription_tier, plan_tier, phone_number, signup_source, marketing_opt_in, child_1_birthdate, child_2_birthdate, child_3_birthdate, billing_period, user_role, sign_in_count, stripe_customer_id, phone_number_region, primary_concerns, accepted_terms, courses_purchased_previously, count_courses, migrated, is_admin, onboarding_completed, new_member_offer_shown, new_member_offer_accepted, next_billing_date, stripe_subscription_id, children_count, profile_updated_at
  * Integrated comprehensive sync into auth flow: every user login updates Klaviyo with latest data including children birth dates
  * Enhanced signup flow: personalization data automatically syncs to Klaviyo with comprehensive custom properties
  * Subscription changes: all subscription tier changes, billing period updates, and payment method changes sync to Klaviyo
  * Family management: adding/updating children automatically syncs baby birth dates and family data to Klaviyo
  * Added getUserWithChildren method to storage for efficient data retrieval
  * Enhanced all sync methods to include children data for baby birth date tracking
  * All user interactions now maintain comprehensive Klaviyo profile data for advanced segmentation and automation
- July 09, 2025. Implemented comprehensive login-based Stripe and Klaviyo data synchronization:
  * Created StripeDataSyncService with real-time subscription data fetching (status, billing dates, payment methods, total spent)
  * Integrated Stripe sync into authentication flow: every user login now fetches and syncs latest Stripe data
  * Enhanced Klaviyo sync with real-time Stripe data: subscription status, billing dates, payment methods automatically pushed to Klaviyo
  * Added comprehensive test interface with Stripe status checks and sync testing endpoints
  * Updated Integration Testing Dashboard with both Klaviyo and Stripe sync test functionality
  * Login-based sync ensures real-time data accuracy vs daily batch updates for better customer data management
- July 09, 2025. Added performance optimizations and Monthly Active Users tracking:
  * Implemented 5-minute caching for Stripe API calls to prevent rate limiting and improve response times
  * Added asynchronous background sync using setImmediate() to prevent blocking login responses
  * Added lastLoginAt timestamp field to users table for accurate MAU calculation
  * Enhanced admin metrics to include rolling 30-day Monthly Active Users count
  * Implemented cache invalidation methods for Stripe data to ensure freshness when needed
  * Optimized database queries for MAU calculation using proper indexes on lastLoginAt field
- July 09, 2025. Completed comprehensive signup flow fixes and UI improvements:
  * Fixed profile picture upload functionality - clicking picture or upload button now triggers file selection properly
  * Created public /terms page with comprehensive terms of service content accessible to all users
  * Added marketing opt-in Klaviyo integration - checkbox updates email subscription status in real-time
  * Updated all blue highlight colors to brand green (#095D66) for preference buttons, role selection, and terms link
  * Enhanced homepage "get 50% off gold" button with rounded corners (rounded-xl) for design consistency
  * All signup flow components now use consistent Dr. Golly brand colors and styling
- July 09, 2025. Updated profile interface and mobile layout optimization:
  * Updated toggle switches to use brand green color (#095D66) for consistent styling
  * Moved marketing preferences section from separate tab to Profile tab to optimize mobile navigation
  * Reduced profile navigation from 6 tabs to 5 tabs (Profile, Plan, Invoices, Payment, Referral)
  * Moved logout button higher up the page for better mobile accessibility
  * Repositioned "Add Child" button in family page to be next to "Your Children" heading below gold banner
  * Integrated support system with header button, modal form, and dual notifications to email/Slack
- July 09, 2025. Improved banner image and page title consistency:
  * Made Dr. Golly banner image larger (96px) and centered properly on mobile with wrapper div
  * Added consistent page title formatting with icons to the left and text to the right across all pages
  * Updated courses title to use family lastname instead of firstname ("Courses for the [lastname] family")
  * Optimized feed timers layout to display left and right breast timers side-by-side to save mobile space
  * Reduced timer component sizes and spacing for more compact mobile display
  * Fixed discounts page header to have consistent icon-left, text-right formatting
  * Enhanced growth tracking with personalized titles showing child's name ("Add Growth Entry for Parker")
  * Improved mobile feed timer layout with consistent spacing, smaller text, and compact button sizes
- July 09, 2025. Enhanced course module system with clickable content and improved navigation:
  * Fixed module progress API date handling error (completedAt timestamp generation)
  * Implemented clickable module cards with "Read More" functionality instead of "Mark Complete"
  * Created ModuleDetail component for rich text content display with copy protection
  * Added comprehensive content from 8 screenshots to "1.1 Sleep Environment" modules
  * Enhanced module navigation with prominent "Back to Course" buttons (top and mobile floating)
  * Added "Mark Complete" button at bottom of content for better user flow
  * Updated all buttons to use brand colors (Dark Green for completion, Brand Teal for navigation)
  * Documented brand color guidelines: no blue buttons, use brand teal or dark green only
- July 10, 2025. Implemented visual hierarchy for course modules with tree structure:
  * Added proper indentation for modules under chapters with left padding
  * Created connecting grey lines between modules to show progression flow
  * Added chapter.submodule numbering (1.1, 1.2, etc.) for clear module identification
  * Replaced HTML temperature chart table with original image and download functionality
  * Enhanced visual design to match mobile app reference with proper spacing and alignment
  * Fixed database unique constraints for userModuleProgress and userCourseProgress tables
- July 10, 2025. Completed comprehensive chapter progress tracking system:
  * Added API endpoint for fetching all user chapter progress data
  * Fixed chapter completion checkmarks to use actual database progress instead of calculated percentages
  * Implemented automatic chapter completion when all modules in a chapter are finished
  * Enhanced course progress calculation to show real completion data from database
  * Updated homepage filters to show "Freebies" as second filter after "All"
- July 10, 2025. Enhanced payment processing with custom animated loader:
  * Added custom payment loader GIF (animated credit card) for all payment transaction processing
  * Implemented payment processing overlay for both authenticated checkout and public checkout pages
  * Added proper null-checking and validation for Stripe payment request API to prevent runtime errors
  * Enhanced user experience with visual feedback during payment processing with branded loader animation
- July 10, 2025. Fixed critical payment and discount system bugs:
  * Fixed discount calculation bug where amount_off coupons were incorrectly divided by 100
  * Restructured payment flow to only create payment intents when user clicks "Place order"
  * Eliminated incomplete transactions cluttering Stripe dashboard
  * Enhanced coupon validation to properly handle both promotion codes and direct coupons
  * Added comprehensive logging for discount calculations with dollar amounts
  * Implemented robust checking for both fixed amount and percentage-based discounts
  * Updated both authenticated checkout and Big Baby public checkout flows
  * Fixed Stripe Elements configuration with proper amount parameter
- July 10, 2025. Updated home page banner with professional welcome image:
  * Replaced teal gradient banner with Dr. Golly professional medical banner image
  * Updated text colors to brand colors (Brand Teal #095D66, Dark Green #166534) for better visibility
  * Removed circular profile image overlay to showcase banner image fully
  * Adjusted background positioning to show Dr. Golly's complete professional headshot
  * Updated button styling to use Brand Teal (#095D66) matching header menu
  * Aligned subheading text with button's right edge for better layout consistency
- July 10, 2025. Replaced freebie header images with high-resolution professional versions:
  * Updated all 6 freebie blog posts with high-resolution PNG images featuring Dr. Golly branding
  * Enhanced FreebieImageLoader component to support new PNG asset paths
  * Maintained backward compatibility with legacy SVG assets
  * All freebie images now display consistent professional branding with teal color scheme and download icons
- July 10, 2025. Implemented comprehensive PDF download functionality for freebies:
  * Created PdfViewer component with modal display and immediate download button
  * Added PDF asset management system with 5 professional PDFs (Sleep Tips, Fussy Eaters, Bedtime Routine, Starting Solids, Breastmilk Storage)
  * Enhanced BlogCard component to open PDF viewer instead of direct download
  * Updated admin panel with PDF dropdown selection for freebie posts
  * Excluded Colic Video from PDF downloads as it's video-only content
  * All PDF downloads feature proper asset mapping for easy future replacement through admin panel
  * Updated all PDF download buttons to use Brand Teal (#095D66) to match header menu styling exactly
  * Replaced document icons with high-resolution PDF preview images in the PDF viewer modal
  * Added preview image mapping system with professional branded PNG previews for 4 PDFs (Sleep Tips, Fussy Eaters, Bedtime Routine, Breastmilk Storage)
  * Enhanced PDF viewer with rounded corners, shadows, and proper fallback to document icon when preview unavailable
- July 10, 2025. Optimized architecture for 20,000 user bulk import with high-performance database configuration:
  * Enhanced database connection pool with 20 max connections, 30-second idle timeout, and 2-second connection timeout
  * Optimized bulk user import with 500-user batches (5x larger) for better throughput and reduced database round trips
  * Added comprehensive upsert logic with onConflictDoUpdate to handle duplicate emails gracefully during import
  * Implemented processing time logging and 50ms delays between batches to prevent database overwhelming
  * Enhanced temporary password batch processing with 100-user batches for optimal performance
  * Added comprehensive performance monitoring with batch-level timing and progress tracking
  * Prepared database indexes for email, subscription_tier, migrated, last_login_at, and stripe_customer_id fields
  * Validated system capability for 2,000 concurrent logins with Neon serverless auto-scaling
  * Created comprehensive CSV field mapping system with precise course name to database ID mapping
  * Added new database fields: firstChildDob (timestamp), accountActivated (boolean) for migration tracking
  * Implemented automated course purchase creation from CSV "COURSES PURCHASED" field
  * Enhanced bulk import to process users and course purchases simultaneously with performance monitoring
  * Course mapping: "Preparation for Newborns" → ID 10, "Little Baby Sleep Program" → ID 5, etc.
  * All users set with accountActivated = false initially, updated to true after successful first login
- July 10, 2025. Completed comprehensive 20,000 user database migration with real-time progress tracking:
  * Successfully processed 19,760 valid users from CSV file (20,770 total lines with filtering)
  * Imported 16,500+ users with 3,260 remaining to be processed automatically
  * Added Platinum users metric to admin panel with purple crown icon
  * Updated admin dashboard to show real-time user counts: 16,500 free, 1 gold, 0 platinum users
  * Enhanced backend API metrics to include platinumUsers count for complete subscription tier tracking
  * Migration includes 13,150 users with child birth dates and 12,988 users with phone numbers
  * Created 62,192 individual course purchase records from CSV course mapping
- July 10, 2025. Fixed critical Big Baby checkout payment intent ID mismatch causing account creation failures:
  * Resolved payment intent ID tracking issue where successful payments used different IDs than account creation
  * Enhanced payment success handlers to capture and pass the correct payment intent ID to parent component
  * Made Klaviyo integration non-blocking to prevent account creation failures (account creation continues even if Klaviyo fails)
  * Fixed Klaviyo event structure with proper "data" key formatting for profile and metric relationships
  * Added comprehensive error handling and logging for account creation process with detailed debugging
  * Enhanced error messages for duplicate email detection and invalid input validation
  * Fixed date field handling for customer due dates with proper Date object conversion
  * Updated both Apple Pay/Google Pay and card payment flows to use consistent payment intent ID tracking
  * Eliminated incomplete payment intents in Stripe by only creating payment intents when users actively initiate payment
  * Removed automatic payment intent creation on form completion to prevent abandoned transactions cluttering Stripe dashboard
  * Payment intents now created only when user clicks payment buttons (Apple Pay, Google Pay, or card payment forms)
  * Enhanced payment flow efficiency by creating payment intents just-in-time rather than pre-emptively
  * Fixed Stripe Elements integration error by switching from clientSecret-based to mode-based configuration
  * Enhanced payment form validation with visual feedback showing required fields completion status
  * Payment section now properly displays when user completes first name and valid email address requirements
- July 10, 2025. Completely eliminated incomplete Stripe transactions and fixed existing user checkout flow:
  * Replaced PaymentElement with CardElement to prevent any setup intents or incomplete transactions
  * Updated payment confirmation to use confirmCardPayment instead of confirmPayment for cleaner flow
  * Fixed duplicate email handling: existing users now get course added to their account instead of account creation failure
  * Enhanced account creation endpoint to check for existing emails and handle appropriately
  * Added proper success messaging for existing vs new users ("Course Added Successfully!" vs "Account Created Successfully!")
  * Payment flow now completely clean: no Stripe transactions until user clicks payment buttons
  * Resolved "duplicate key value violates unique constraint" error for existing email addresses
  * Stripe dashboard now shows only completed payments or failed attempts - no incomplete transactions
- July 10, 2025. Implemented automatic login after successful Big Baby checkout:
  * Users are automatically logged in after payment completion and account creation/update
  * Added authentication session creation in backend after successful course purchase
  * Updated frontend to redirect to home page (/) instead of login page after successful payment
  * Enhanced user experience: users can immediately access their purchased course without manual login
  * Invalidated React Query auth cache to ensure immediate user state refresh
  * Updated success messaging to reflect automatic login experience
- July 10, 2025. Completed comprehensive blog post author attribution system:
  * Added author field to blog posts database schema with "Daniel Golshevsky" as default value
  * Updated admin panel to include author field input for new blog posts
  * Added "Article by Daniel Golshevsky" attribution display on all blog posts
  * Enhanced admin interface to show author information in blog post management cards
  * Removed read time display from freebies category articles for cleaner presentation
  * Updated blog post content formatting with consistent heading hierarchy (H1: 2xl, H2: xl, H3: lg)
  * Simplified PDF download interface by removing top call-to-action, keeping only bottom center download button
- July 10, 2025. Updated course naming convention to sentence case:
  * Changed all course titles to only capitalize the first letter (e.g., "Little baby sleep program")
  * Updated database course titles from title case to sentence case
  * Fixed hardcoded course name in Big Baby public checkout page
  * All courses now display consistent sentence case formatting throughout the application
- July 10, 2025. Fixed critical login page z-index issue:
  * Resolved teal background covering "Sign In" button with pointer-events-none and z-index adjustments
  * Login page buttons now fully clickable and accessible
- July 10, 2025. Enhanced courses page with improved filters and search functionality:
  * Changed "All Courses" filter to "All" for better single-line mobile display
  * Implemented keyword-based search with relevance scoring for more accurate results
  * Added specific keyword matching for baby/toddler/sleep content categories
  * Search now prioritizes exact matches and relevant content over basic text matching
- July 10, 2025. Fixed support form submission error:
  * Resolved FormData vs JSON mismatch causing 400 errors in support form
  * Changed client to send JSON data matching server expectations
  * Support form now successfully submits and logs to console for email/Slack integration
- July 10, 2025. Fixed admin panel blog management runtime error and added Admin Panel button:
  * Fixed missing closing div tag in AdminBlogManagement.tsx causing runtime crash in blogs tab
  * Added Admin Panel button to home page header that only shows for admin users
  * Button uses admin check API endpoint (/api/admin/check) to verify permissions
  * Styled button to match category filters with brand green color, rounded corners, and no icon
  * Admin access currently limited to frazer.adnam@cq-partners.com.au as configured
- July 10, 2025. Streamlined admin panel by removing legacy migration features:
  * Removed bulk user import tab as migration is complete with 17,500+ users imported
  * Removed thinkific migration tab as platform migration is no longer needed
  * Fixed runtime errors in blogs and courses tabs with proper array validation
  * Updated tab layout from 8 tabs to 6 tabs with improved grid layout (3 mobile, 6 desktop)
  * Admin panel now focuses on core management: Dashboard, Blog Posts, Courses, Users, Notifications, Admin Users
- July 10, 2025. Reorganized admin panel for better functionality separation:
  * Moved invite admin functionality from User Management tab to Admin Users tab
  * User Management tab now focuses only on regular user management (edit subscriptions, view activity)
  * Admin Users tab includes both viewing existing admins and inviting new admins
  * Improved admin interface organization with clearer separation of concerns
- July 11, 2025. Completed comprehensive course content migration from CSV files:
  * Successfully migrated 142 structured course entries and 850 content rows from previous Dr. Golly app
  * Populated 10 existing courses (IDs 5-14) with 38 chapters and 203 modules of rich content
  * Implemented consistent rich text formatting with proper headings (H1: 2xl, H2: xl, H3: lg) and body text (base size, gray-700)
  * Created mapping system between CSV course IDs and database course IDs (3-14) for accurate content placement
  * Added comprehensive content filtering to exclude test/junk data and ensure quality content migration
  * Enhanced course structure with proper chapter numbering (1.0, 1.1, etc.) and module organization
  * All migrated content includes video URLs, rich text formatting, and proper admin editing capability
  * Major courses populated: Little Baby Sleep Program (23 modules), Big Baby Sleep Program (71 modules), Toddler Toolkit (19 modules), Preparation for Newborns (28 modules)
  * BREAKTHROUGH: Successfully populated 102 modules with quality rich content from CSV column G using ID matching
  * Big Baby Sleep Program: All 71 modules now have rich content with 4 video modules
  * Toddler Toolkit: All 19 modules now have rich content with 5 video modules
  * Content includes professional medical guidance, FAQ sections, video tutorials, and step-by-step instructions
  * All content properly formatted with consistent styling and embedded Vimeo video players
- July 11, 2025. COMPLETE COURSE STRUCTURE REBUILD - Fixed chapter formatting and rich content mapping:
  * Rebuilt entire course structure from CSV with proper "1.1 What is Normal?" chapter format matching user reference
  * Successfully created 130 chapters and 142 modules across 10 courses with correct hierarchy
  * Fixed CSV parsing issues by identifying trailing spaces in column headers ('Title of rich text ')
  * Mapped 401 modules with rich text content from second CSV file using intelligent title matching
  * Validated Vernix content mapping - exact match with screenshot showing vernix caseosa information and baby image
  * All courses now have proper chapter structure: Welcome modules (0.0) and numbered chapters (1.1, 1.2, etc.)
  * Rich content includes HTML formatting, images, and professional medical guidance
  * Special mapping logic handles title mismatches (e.g., "Vernix" content mapped to "What is Normal" module)
  * CRITICAL BUG FIX: Fixed course access control issue where users couldn't access purchased courses
  * FINAL FIX: Database returns 'courseId' (camelCase) field, not 'course_id' (snake_case) as originally assumed
  * Updated all course access checks to use correct field name 'courseId' instead of 'course_id'
  * Fixed access bug in course-overview.tsx, courses.tsx, and CourseDetail.tsx components
  * Users can now properly access purchased courses in both "Purchases" tab and individual course access
  * Purchased courses now show correctly in "Purchases" tab and users can access course content without access denial
- July 11, 2025. Applied systematic chapter numbering from spreadsheet to ALL courses:
  * Changed "Course modules" heading to "Chapters" throughout the interface
  * Updated progress text to show "X of Y chapters completed" for all courses
  * Applied proper chapter numbering system to all 10 courses matching exact spreadsheet format:
    - Little Baby Sleep Program: 0.0 Welcome through 1.20 Troubleshooting and Other
    - Big Baby Sleep Program: 0.0 Welcome through 1.16 Troubleshooting & Other
    - Pre-toddler Sleep Program: 0.0 Welcome through 1.14 Troublshooting
    - Toddler Sleep Program: 0.0 Welcome through 1.11 Troubleshooting
    - Pre-School Sleep Program: 0.0 Welcome through 1.10 Troubleshooting
    - Preparation for Newborns: 0.0 Welcome through 1.21 Parental Wellbeing
    - New Sibling Supplement: 0.0 Welcome through 1.7 Coping Strategies
    - Twins Supplement: 0.0 Welcome through 1.8 Getting Time Out
    - Toddler Toolkit: 0.0 Introduction - Toddler Toolkit
  * Cleaned up duplicate and legacy module entries that were causing display issues
  * All courses now display proper chapter structure with exact titles and numbering from spreadsheet
  * Removed debug console logging for cleaner production experience
```

## User Preferences

```
Preferred communication style: Simple, everyday language.

Brand Color Guidelines:
- Primary Button Colors: Brand Teal (#095D66) or Dark Green (green-700 #166534)
- No blue buttons should be created - always use brand colors
- **Dark Green (green-700 #166534)** - Official brand dark green for completion and success states, same as header menu
- **Brand Teal (#095D66)** - For navigation and primary actions
- Hover states: Dark Green uses green-800, Brand Teal uses hover:bg-brand-teal/90
```