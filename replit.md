# replit.md

## Overview

This project is a mobile-first Learning Management System (LMS) built for parents, offering expertise in parenting and sleep. It provides course management, user progress tracking, subscription tiers, partner discounts, and family sharing. The core vision is to deliver comprehensive, authentic content via a streamlined user experience, supporting parents with reliable information and tools. The system is designed for efficient content delivery and aims to maximize market potential through its specialized focus.

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
- **Styling**: Tailwind CSS with shadcn/ui components, Radix UI primitives
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Build Tool**: Vite
- **UI/UX Decisions**: Mobile-first design, responsive layouts, bottom navigation, touch-friendly interactions, consistent branding using Dr. Golly logo and specific brand colors (teal and dark green). Features include simplified profile picture system, streamlined admin panel with accordions and inline editing, custom animated payment loaders, an interactive notification bell, and full-screen chapter completion modals. A comprehensive design standardization ensures global CSS classes for consistent button and tab styling.

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect, integrated session management, and role-based access control. Comprehensive password reset functionality.
- **Session Management**: Express sessions stored in PostgreSQL.
- **Key Features**:
    - **Script Security System**: Robust protection against unauthorized script execution for critical content (e.g., medical content), with multi-layer authorization, automatic backups, and audit logging.
    - **Course Management**: Categorized content (sleep, nutrition, health) with Free, Gold, and Platinum access tiers. Includes individual user progress tracking, Vimeo video delivery, comprehensive content migration, dynamic structuring, rich text editing, and full CRUD operations for admin content management.
    - **Subscription System**: Free, Gold, and Platinum tiers with monthly/yearly billing, content gating, and transaction tracking, integrated with Stripe.
    - **Partner Discounts**: Tier-based access to brand partnerships.
    - **Family Sharing**: Multi-user support with admin/member roles, shared progress, and an invitation system.
    - **Tracking Systems**: For growth, development, feeding (dual-timer breastfeeding), sleep, and sleep review consultations.
    - **Notifications**: Real-time bell icon notifications with categories and priority. Slack integration for signup and payment events.
    - **Professional Services Booking**: System for booking services like Sleep Reviews and Lactation Consultants.
    - **Regional Pricing**: IP-based currency detection for dynamic pricing and multi-currency Stripe integration.
    - **Admin Panel**: Streamlined interface for user, course, blog, and admin user management, supporting inline editing, content creation, and deletion.
    - **Affiliate Management System**: Database infrastructure with public application system, automated code generation, admin management (approval, tracking, analytics), Slack notifications for applications, and sales/commission management.
    - **Top of Funnel Tracking**: System for freebie downloads, automatic detection and tracking generation, server-side redirects with click tracking, and admin panel integration for analytics.
    - **Signup Flow**: A 3-step signup process with visual redesign, Google OAuth integration, and streamlined user preferences.

## External Dependencies

- **Database Provider**: Neon serverless PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Payment Processing**: Stripe (for subscriptions, course purchases, payment methods)
- **Email/Marketing Automation**: Klaviyo (for user profile sync, email flows, custom properties, purchase tracking, subscription management, cart abandonment)
- **Styling**: Tailwind CSS, shadcn/ui, Radix UI
- **Icons**: Lucide React
- **Form Handling**: React Hook Form with Zod validation
- **Deployment**: Vite (frontend build), esbuild (backend bundling)
- **Mapping/Location**: Google Maps API (for address autocomplete)
- **Drag and Drop**: @dnd-kit (for admin panel content reordering)
- **Video Content**: Vimeo (for course video delivery)
- **Notifications**: Slack (webhooks)
- **Geo-IP Detection**: geoip-lite