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
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```