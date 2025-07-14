# Git Branching Strategy

## Branch Structure

```
main (protected)
├── dev (protected)
├── feature/courses/*
├── feature/admin/*
├── feature/notifications/*
├── feature/analytics/*
├── feature/checkout/*
├── feature/ui/*
└── hotfix/*
```

## Branch Naming Convention

### Feature Branches
- `feature/courses/lesson-progress-tracking`
- `feature/admin/user-management-enhancement`
- `feature/admin/course-content-editor`
- `feature/checkout/payment-optimization`
- `feature/analytics/user-engagement-metrics`
- `feature/notifications/email-automation`
- `feature/ui/mobile-optimization`

### Hotfix Branches
- `hotfix/payment-gateway-error`
- `hotfix/course-access-bug`
- `hotfix/admin-login-issue`

## Development Workflow

### 1. Starting New Work
```bash
git checkout dev
git pull origin dev
git checkout -b feature/courses/lesson-navigation-enhancement
```

### 2. Daily Development
```bash
# Make changes
git add .
git commit -m "feat(courses): enhance lesson navigation with breadcrumbs"
git push origin feature/courses/lesson-navigation-enhancement
```

### 3. Creating Pull Request
- Create PR: `feature/courses/lesson-navigation-enhancement` → `dev`
- Require code review
- Merge to dev after approval

### 4. Release Process
```bash
git checkout main
git merge dev
git tag v1.4.0
git push origin main --tags
```

## Commit Message Standards

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions
- `chore`: Maintenance tasks

### Examples
```bash
feat(courses): Add lesson completion tracking with progress persistence

- Implement user progress storage in PostgreSQL
- Add visual progress indicators on course overview
- Create lesson completion API endpoints
- Update mobile UI for progress display

Closes #123, #124
```

## Branch Protection Rules

### Main Branch
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to protect history

### Dev Branch
- Require pull request reviews
- Allow force pushes for emergency fixes
- Require linear history

## Emergency Procedures

### Hotfix Process
1. Create hotfix branch from main
2. Fix critical issue
3. Test thoroughly
4. Merge to both main and dev
5. Deploy immediately

### Rollback Process
1. Identify stable commit/tag
2. Create rollback branch
3. Revert problematic changes
4. Test rollback
5. Deploy rollback to production