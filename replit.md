# replit.md

## Overview

This is a mobile-first learning management system (LMS) built with React and Express.js, focused on parenting and sleep expertise. It offers course management, user progress tracking, subscription tiers, partner discounts, and family sharing. The project aims to provide comprehensive, authentic content for parents, with a strong focus on a streamlined user experience and efficient content delivery.

**Recent Achievement**: Successfully migrated to custom domain on August 5th, 2025, with zero downtime and all security protections maintained.

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
- **UI/UX Decisions**: Mobile-first design, bottom navigation, responsive layouts, touch-friendly interactions, consistent branding with Dr. Golly logo and specific brand colors (teal and dark green), simplified profile picture system using direct database storage, streamlined admin panel with accordions and inline editing, custom animated payment loaders, interactive notification bell, full-screen chapter completion modals.

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (with raw SQL fallbacks for robustness)
- **Authentication**: Replit Auth with OpenID Connect, integrated session management, and comprehensive password reset functionality.
- **Session Management**: Express sessions stored in PostgreSQL
- **Key Features**:
    - **Authentication System**: Replit Auth via OpenID, PostgreSQL-backed sessions, role-based access control.
    - **Script Security System**: Comprehensive protection against unauthorized script execution, implemented after August 5th data corruption incident. Multi-layer authorization, automatic backups, audit logging, and emergency controls.
    - **Course Management**: Categorized content (sleep, nutrition, health), Free/Gold/Platinum access tiers, individual user progress tracking, Vimeo video delivery. Features include comprehensive content migration, dynamic chapter/lesson structuring, rich text editing, and full CRUD operations for admin content management with inline editing, adding, and deleting functionality.
    - **Subscription System**: Free, Gold, Platinum tiers with monthly/yearly billing, content gating, and transaction tracking. Integrated with Stripe for payment processing and Klaviyo for lifecycle management.
    - **Partner Discounts**: Tier-based access to brand partnerships.
    - **Family Sharing**: Multi-user support with admin/member roles, shared progress, and invitation system.
    - **Tracking System**: Growth, Development, Feed (dual-timer breastfeeding), Sleep, and Sleep Review (consultation booking).
    - **Notifications**: Real-time bell icon notifications with categories, priority, and mark-as-read features. Slack integration for signup and payment notifications.
    - **Professional Services Booking**: System for booking services like Sleep Reviews and Lactation Consultants, with activation tracking.
    - **Regional Pricing**: IP-based currency detection for dynamic pricing and multi-currency Stripe integration.
    - **Admin Panel**: Streamlined interface for user, course, blog, and admin user management, including inline editing, content creation, and deletion.

## External Dependencies

- **Database Provider**: Neon serverless PostgreSQL
- **ORM**: Drizzle ORM (with Drizzle Kit for migrations)
- **Authentication**: Replit Auth (OpenID Connect)
- **Payment Processing**: Stripe (for subscriptions, course purchases, and managing payment methods)
- **Email/Marketing Automation**: Klaviyo (for user profile sync, email flows, and custom properties tracking)
- **Styling**: Tailwind CSS, shadcn/ui, Radix UI
- **Icons**: Lucide React
- **Form Handling**: React Hook Form with Zod validation
- **Deployment**: Vite (frontend build), esbuild (backend bundling)
- **Mapping/Location**: Google Maps API (for address autocomplete in checkout, although the key provided is an example)
- **Drag and Drop**: @dnd-kit (for admin panel content reordering)
- **Video Content**: Vimeo (for course video delivery)
- **Slack**: Webhooks for notifications
- **Geo-IP Detection**: geoip-lite (for regional pricing)