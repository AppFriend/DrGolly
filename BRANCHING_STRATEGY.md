# 🌳 Dr. Golly Git Branching Strategy

## Overview
This document outlines our Git workflow designed to protect production code while enabling safe, organized development.

## 🗺️ Visual Git Flow

```
main (protected) ←------ Production deployments
  ↑
  PR merge
  ↑
dev ←------ Staging deployments & integration
  ↑
  PR merge
  ↑
Feature Branches:
├── home/feature-name
├── courses/feature-name
├── tracking/feature-name
├── discounts/feature-name
├── family/feature-name
├── settings/feature-name
└── hotfix/issue-name

test/replit ←------ Replit testing environment
```

## 🏗️ Branch Structure

### Protected Branches
- **`main`** - Production-ready code only
  - Direct pushes disabled
  - Requires PR approval
  - Triggers production deployment
  
- **`dev`** - Integration branch
  - All features merge here first
  - Triggers staging deployment
  - Code review required

### Feature Branches
Branch naming convention: `<module>/<feature-description>`

#### Core Modules:
- `home/*` - Landing page, dashboard functionality
- `courses/*` - Course management, lessons, progress
- `tracking/*` - Growth, development, sleep tracking
- `discounts/*` - Partner discounts, coupon system
- `family/*` - Family management, children profiles
- `settings/*` - User settings, profile management

#### Special Branches:
- `test/replit` - Replit development environment
- `hotfix/*` - Critical production fixes
- `release/*` - Release preparation

## 🚀 Deployment Workflow

### Step-by-Step Process

1. **Start New Feature**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b courses/add-video-player
   ```

2. **Develop & Test**
   ```bash
   # Make changes
   git add .
   git commit -m "Add video player component"
   git push origin courses/add-video-player
   ```

3. **Create Pull Request**
   - Target: `dev` branch
   - Use PR template
   - Add reviewers
   - Link related issues

4. **Code Review & Merge**
   - PR reviewed and approved
   - Merge to `dev`
   - Deploy to staging

5. **Release to Production**
   - Create PR from `dev` to `main`
   - Final testing
   - Merge to `main`
   - Production deployment

## 📋 Branch Policies

### Main Branch Protection
- ✅ Require PR reviews (minimum 1)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Restrict pushes to specific people/teams
- ✅ Include administrators in restrictions

### Dev Branch Protection
- ✅ Require PR reviews
- ✅ Require status checks to pass
- ✅ Allow force pushes (for rebasing)

## 🔧 Local Development Commands

### Quick Reference

```bash
# Start new feature
git checkout dev && git pull origin dev
git checkout -b <module>/<feature-name>

# Save work
git add . && git commit -m "descriptive message"
git push origin <branch-name>

# Update from dev
git checkout dev && git pull origin dev
git checkout <your-branch>
git rebase dev  # or merge dev

# Switch to test environment
git checkout test/replit
git pull origin test/replit

# Deploy feature to test
git checkout test/replit
git merge <your-feature-branch>
git push origin test/replit
```

## 🎯 Best Practices

### Commit Messages
- Use present tense ("Add feature" not "Added feature")
- Be descriptive but concise
- Reference issues when applicable

### Pull Requests
- Small, focused changes
- Clear description of what changed
- Screenshots for UI changes
- Test thoroughly before requesting review

### Code Reviews
- Check for breaking changes
- Verify mobile responsiveness
- Test authentication flows
- Ensure database migrations are safe

## 🚨 Emergency Procedures

### Hotfix Process
```bash
# For critical production issues
git checkout main
git checkout -b hotfix/critical-bug-fix
# Fix the issue
git push origin hotfix/critical-bug-fix
# Create PR to main (skip dev for emergencies)
```

### Rollback Process
```bash
# If production deployment fails
git checkout main
git revert <commit-hash>
git push origin main
```

## 📊 Branch Monitoring

### Regular Maintenance
- Delete merged feature branches
- Keep dev up to date with main
- Monitor for stale branches
- Regular dependency updates

### Branch Lifecycle
1. **Active Development** (< 1 week)
2. **Review Phase** (1-2 days)
3. **Merged** (delete feature branch)
4. **Deployed** (monitor for issues)

## 🛡️ Security Considerations

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Regular security audits via GitHub Actions
- Dependency vulnerability scanning

## 📈 Success Metrics

- **Lead Time**: Feature idea to production
- **Deployment Frequency**: How often we deploy
- **Mean Time to Recovery**: How quickly we fix issues
- **Change Failure Rate**: Percentage of deployments causing issues

---

*This strategy evolves with our team needs. Regular reviews ensure it serves our development goals effectively.*