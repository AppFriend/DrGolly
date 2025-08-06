# replit.md

## Overview

This is a mobile-first learning management system (LMS) designed for parenting and sleep expertise, built with React and Express.js. It provides comprehensive course management, user progress tracking, tiered subscriptions, partner discounts, and family sharing. The project aims to deliver authentic content and a streamlined user experience, recently migrating to a custom domain with zero downtime.

## Recent Changes (August 6, 2025)
- **Dual User Checkout Flows**: Complete implementation with new/existing user detection
- **Payment Enhancement**: User status checking integrated into payment processing  
- **Merge Conflicts Resolved**: All conflicts from testing-and-updates branch fixed
- **Build Optimization**: LSP diagnostics cleared, application deployment-ready
- **Savepoint Created**: Pre-pixel tracking implementation backup established
- **Comprehensive Pixel Tracking**: Complete implementation of 6 tracking platforms (Google Ads, Pinterest, TikTok, LinkedIn, Meta, Reddit) with SPA-aware page view tracking, signup/purchase event tracking, and secure CSP policy updates

## User Preferences

Preferred communication style: Simple, everyday language.

Brand Color Guidelines:
- Primary Button Colors: Brand Teal (#095D66) or Dark Green (green-700 #166534)
- No blue buttons should be created - always use brand colors
- **Dark Green (green-700 #166534)** - Official brand dark green for completion and success states, same as header menu
- **Brand Teal (#095D66)** - For navigation and primary actions
- Hover states: Dark Green uses green-800, Brand Teal uses hover:bg-brand-teal/90

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Build Tool**: Vite
- **UI Components**: Radix UI primitives with custom styling
- **UI/UX Decisions**: Mobile-first design is paramount, featuring bottom navigation, responsive layouts, and touch-friendly interactions. A consistent brand identity is maintained through the Dr. Golly logo and specific brand colors (teal and dark green). The design includes a simplified profile picture system, streamlined admin panel with accordions and inline editing, custom animated payment loaders, an interactive notification bell, and full-screen chapter completion modals for an engaging user experience.

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM, augmented by raw SQL fallbacks for enhanced robustness.
- **Authentication**: Replit Auth integrated with OpenID Connect, providing session management and comprehensive password reset capabilities.
- **Session Management**: Express sessions persistently stored in PostgreSQL.
- **Key Features**:
    - **Authentication System**: Utilizes Replit Auth via OpenID, backed by PostgreSQL sessions and role-based access control.
    - **Script Security System**: Post-August 5th incident, a multi-layered system protects against unauthorized script execution, featuring automatic backups, audit logging, and emergency controls.
    - **Course Management**: Content is categorized (sleep, nutrition, health) with Free, Gold, and Platinum access tiers. It supports individual user progress tracking and Vimeo video delivery. Admins benefit from comprehensive content migration, dynamic chapter/lesson structuring, rich text editing, and full CRUD operations (Create, Read, Update, Delete) for content management, including inline editing.
    - **Subscription System**: Offers Free, Gold, and Platinum tiers with flexible monthly/yearly billing. Integrates with Stripe for payment processing and Klaviyo for lifecycle management, controlling content access based on subscription level.
    - **Partner Discounts**: Provides tier-based access to exclusive brand partnerships.
    - **Family Sharing**: Supports multiple users with distinct admin/member roles, shared progress tracking, and an invitation system.
    - **Tracking System**: Comprehensive tracking for Growth, Development, Feed (including a dual-timer breastfeeding feature), Sleep, and Sleep Review (integrating a consultation booking system).
    - **Notifications**: Real-time notifications via a bell icon, categorized by type, priority, and mark-as-read functionality. Slack integration provides instant alerts for new signups and payments.
    - **Professional Services Booking**: Enables users to book specialized services such as Sleep Reviews and Lactation Consultant sessions, with integrated activation tracking.
    - **Regional Pricing**: Dynamically adjusts pricing based on IP-detected currency, utilizing multi-currency Stripe integration.
    - **Admin Panel**: A streamlined interface facilitates management of users, courses, blogs, and other administrative tasks, offering inline editing, content creation, and deletion capabilities.

## External Dependencies

- **Database Provider**: Neon serverless PostgreSQL
- **ORM**: Drizzle ORM (with Drizzle Kit for migrations)
- **Authentication**: Replit Auth (OpenID Connect)
- **Payment Processing**: Stripe (for subscriptions, course purchases, and payment method management)
- **Email/Marketing Automation**: Klaviyo (for user profile synchronization, email flows, and custom properties tracking)
- **Styling**: Tailwind CSS, shadcn/ui, Radix UI
- **Icons**: Lucide React
- **Form Handling**: React Hook Form with Zod validation
- **Deployment**: Vite (frontend build), esbuild (backend bundling)
- **Mapping/Location**: Google Maps API (for address autocomplete in checkout)
- **Drag and Drop**: @dnd-kit (for admin panel content reordering)
- **Video Content**: Vimeo (for course video delivery)
- **Slack**: Webhooks for notifications
- **Geo-IP Detection**: geoip-lite (for regional pricing)