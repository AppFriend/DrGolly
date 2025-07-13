# 🍼 Dr. Golly - Mobile-First Family Health Platform

A comprehensive mobile-first learning management system focused on parenting and sleep expertise with course management, user progress tracking, subscription tiers, and family sharing capabilities.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access the application
open http://localhost:5000
```

## 📁 Project Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   └── hooks/       # Custom hooks
├── server/              # Express backend
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database layer
│   └── index.ts         # Server entry point
├── shared/              # Shared types and schemas
└── attached_assets/     # Static assets and images
```

## 🌳 Git Workflow & Branch Management

### Core Branches
- **`main`** - Production-ready code (protected)
- **`dev`** - Integration branch for staging
- **`test/replit`** - Replit development environment

### Feature Branches
Use module-based naming: `<module>/<feature-description>`

```bash
# Core modules
home/*          # Landing page, dashboard
courses/*       # Course management, lessons
tracking/*      # Growth, development, sleep tracking
discounts/*     # Partner discounts, coupons
family/*        # Family management, children
settings/*      # User settings, profile
subscription/*  # Subscription management, /manage page
checkout/*      # Checkout flow, payment processing
admin/*         # Admin panel, user management, analytics
```

### Quick Commands

#### Start New Feature
```bash
git checkout dev
git pull origin dev
git checkout -b courses/add-video-player
```

#### Switch Between Branches
```bash
# Use our helper script
./scripts/switch-branch.sh tracking/sleep-graph

# Or manually
git checkout tracking/sleep-graph
git pull origin tracking/sleep-graph
```

#### Create Release
```bash
# Create stable release
./scripts/create-release.sh course-images

# This creates: stable-14-07-2025-course-images
```

#### Emergency Rollback
```bash
# Rollback to previous stable release
./scripts/emergency-rollback.sh stable-14-07-2025-course-images
```

## 📦 Branch Protection Rules

### Main Branch
- ✅ Require PR reviews (minimum 1)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Restrict direct pushes

### Dev Branch
- ✅ Require PR reviews
- ✅ Require status checks
- ✅ Allow force pushes for rebasing

## 🚀 Release Management

### Release Naming: `stable-DD-MM-YYYY-feature-name`

#### Current Stable Releases
- `stable-14-07-2025-course-images` - Course image system complete
- `stable-15-07-2025-git-workflow` - Git workflow implementation

#### Creating Releases
```bash
# Automated release creation
./scripts/create-release.sh <feature-name>

# Manual process
git tag -a stable-15-07-2025-git-workflow -m "Git workflow implementation"
git push origin stable-15-07-2025-git-workflow
```

## 🔄 Development Workflow

### 1. Feature Development
```bash
# Start feature
git checkout dev
git pull origin dev
git checkout -b courses/video-player

# Develop and commit
git add .
git commit -m "Add video player component"
git push origin courses/video-player
```

### 2. Code Review
- Create PR targeting `dev` branch
- Use PR template for consistency
- Get approval from team member
- Merge to `dev`

### 3. Testing
```bash
# Deploy to test environment
git checkout test/replit
git merge courses/video-player
git push origin test/replit
```

### 4. Production Release
- Create PR from `dev` to `main`
- Final testing and approval
- Merge to `main`
- Automatic production deployment

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Wouter** for routing
- **TanStack Query** for data fetching
- **Radix UI** for components

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **Stripe** for payments
- **Replit Auth** for authentication

### Development Tools
- **Vite** for build tooling
- **GitHub Actions** for CI/CD
- **ESLint** and **Prettier** for code quality

## 🗂️ Key Features

### Course Management
- 10 professional courses with rich content
- Progress tracking and completion
- Video lessons with custom thumbnails
- Subscription-based access control

### User Management
- Dr. Golly authentication system
- Family sharing capabilities
- Subscription tiers (Free, Gold, Platinum)
- Profile management with child tracking

### Payment System
- Stripe integration for subscriptions
- Regional pricing support
- Discount codes and coupons
- Invoice and payment history

### Family Tracking
- Growth tracking (weight, height, head circumference)
- Development milestone tracking
- Sleep and feeding logs
- Multiple children support

## 📊 Database Schema

### Core Tables
- `users` - User accounts and profiles
- `courses` - Course content and metadata
- `course_purchases` - Purchase tracking
- `course_progress` - User progress tracking
- `families` - Family relationships
- `children` - Child profiles and data

## 🔐 Security

### Authentication
- Replit Auth with OpenID Connect
- Session-based authentication
- Role-based access control

### Data Protection
- Environment variable management
- Secure API key storage
- Database connection pooling
- Input validation with Zod

## 📱 Mobile-First Design

### Responsive Features
- Bottom navigation for mobile
- Touch-friendly interactions
- Progressive enhancement
- Optimized for iOS and Android

### Performance
- Image optimization
- Lazy loading
- Efficient data fetching
- Minimal bundle size

## 🧪 Testing Strategy

### Automated Testing
- Unit tests for components
- Integration tests for API
- End-to-end testing
- Performance monitoring

### Manual Testing
- Cross-browser compatibility
- Mobile device testing
- User flow validation
- Accessibility compliance

## 📈 Deployment

### Environments
- **Development**: Local development
- **Test**: Replit test environment
- **Staging**: Dev branch deployment
- **Production**: Main branch deployment

### CI/CD Pipeline
- Automated testing on PR
- Security audits
- Build verification
- Deployment automation

## 🆘 Emergency Procedures

### Production Issues
1. **Assess**: Determine severity
2. **Rollback**: Use emergency rollback script
3. **Fix**: Create hotfix branch
4. **Deploy**: Emergency deployment
5. **Monitor**: Watch for stability

### Rollback Process
```bash
# Emergency rollback
./scripts/emergency-rollback.sh stable-14-07-2025-course-images

# Create PR and get approval
# Deploy to production
```

## 👥 Team Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write descriptive commit messages

### PR Requirements
- Small, focused changes
- Clear description
- Screenshots for UI changes
- All tests passing

### Review Process
- Code review required
- Check for breaking changes
- Test mobile responsiveness
- Verify database changes

## 📞 Support

### Getting Help
- Check documentation first
- Review existing issues
- Create detailed bug reports
- Use issue templates

### Contact
- Tech team: tech@drgolly.com
- Admin access: frazer.adnam@cq-partners.com.au

---

*This documentation is maintained by the development team and updated with each release.*