# 🚀 Release Management Guide

## Release Naming Convention

### Format: `stable-DD-MM-YYYY-feature-name`
- **stable-14-07-2025-course-images** - Course image system complete
- **stable-15-07-2025-git-workflow** - Git workflow implementation
- **stable-20-07-2025-checkout-fixes** - Checkout page improvements

### Release Types
- **stable-** : Production-ready releases
- **beta-** : Pre-release testing versions
- **hotfix-** : Emergency fixes
- **snapshot-** : Development snapshots

## Creating Releases

### 1. Create Release Branch
```bash
# From main branch
git checkout main
git pull origin main
git checkout -b release/stable-14-07-2025-course-images
```

### 2. Tag the Release
```bash
# Create annotated tag
git tag -a stable-14-07-2025-course-images -m "
Course Image System Complete
- All 9 course thumbnails working
- Static file serving implemented
- Database paths updated
- Ready for production deployment
"

# Push tag to GitHub
git push origin stable-14-07-2025-course-images
```

### 3. Create GitHub Release
- Go to GitHub → Releases → Create New Release
- Tag: `stable-14-07-2025-course-images`
- Title: `Stable Release - Course Images (July 14, 2025)`
- Description: Detailed changelog

## Quick Release Commands

### Create Today's Release
```bash
#!/bin/bash
# save as: scripts/create-release.sh

DATE=$(date +%d-%m-%Y)
FEATURE_NAME=$1

if [ -z "$FEATURE_NAME" ]; then
    echo "Usage: ./create-release.sh <feature-name>"
    exit 1
fi

TAG_NAME="stable-$DATE-$FEATURE_NAME"

# Create and push tag
git tag -a $TAG_NAME -m "Stable release: $FEATURE_NAME"
git push origin $TAG_NAME

echo "Release created: $TAG_NAME"
```

### Usage
```bash
chmod +x scripts/create-release.sh
./scripts/create-release.sh course-images
```

## Reverting to Previous Releases

### 1. List Available Releases
```bash
# Show all tags
git tag -l "stable-*" --sort=-version:refname

# Show recent releases with dates
git log --tags --simplify-by-decoration --pretty="format:%ai %d"
```

### 2. Revert to Specific Release
```bash
# Method 1: Reset to tag (destructive)
git checkout main
git reset --hard stable-14-07-2025-course-images
git push origin main --force

# Method 2: Create revert commit (safer)
git checkout main
git revert --no-commit HEAD~5..HEAD  # adjust number as needed
git commit -m "Revert to stable-14-07-2025-course-images"
```

### 3. Emergency Rollback Script
```bash
#!/bin/bash
# save as: scripts/emergency-rollback.sh

RELEASE_TAG=$1

if [ -z "$RELEASE_TAG" ]; then
    echo "Usage: ./emergency-rollback.sh <release-tag>"
    echo "Example: ./emergency-rollback.sh stable-14-07-2025-course-images"
    exit 1
fi

# Verify tag exists
if ! git rev-parse $RELEASE_TAG >/dev/null 2>&1; then
    echo "Error: Tag $RELEASE_TAG not found"
    exit 1
fi

# Create rollback branch
git checkout main
git checkout -b rollback-to-$RELEASE_TAG

# Reset to the stable release
git reset --hard $RELEASE_TAG

# Push rollback branch
git push origin rollback-to-$RELEASE_TAG

echo "Rollback branch created: rollback-to-$RELEASE_TAG"
echo "Create PR to merge this into main"
```

## Release Checklist

### Pre-Release
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Database migrations tested
- [ ] Security audit complete

### Release Process
- [ ] Create release branch
- [ ] Update version numbers
- [ ] Create release notes
- [ ] Tag release
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production

### Post-Release
- [ ] Monitor for issues
- [ ] Update replit.md with savepoint
- [ ] Notify team of deployment
- [ ] Close related GitHub issues

## Savepoint System

### Current Savepoints (from replit.md)
```
STABLE VERSIONS (for easy rollback reference):
- SAVEPOINT v1.0 (July 14, 2025): Course image system complete
  * All 9 course thumbnails display correctly from user screenshots
  * Direct static file serving: `/attached_assets/` folder
  * Database paths: `/assets/` converted to `/attached_assets/`
  * Key files: server/index.ts, client/src/pages/courses.tsx
  * Status: Ready for production deployment
```

### Adding New Savepoints
```bash
# After successful feature completion
git tag -a v1.1-stable-15-07-2025 -m "Git workflow implementation complete"
git push origin v1.1-stable-15-07-2025

# Update replit.md
echo "- SAVEPOINT v1.1 (July 15, 2025): Git workflow implementation" >> replit.md
```

## Version Management

### Semantic Versioning
- **Major** (v2.0.0): Breaking changes
- **Minor** (v1.1.0): New features
- **Patch** (v1.0.1): Bug fixes

### Dr. Golly Versioning
- **v1.0**: Initial stable release
- **v1.1**: Feature additions
- **v1.1.1**: Bug fixes
- **v2.0**: Major redesign/refactor

## Monitoring & Alerts

### Post-Release Monitoring
```bash
# Check deployment health
curl -f https://your-app.com/health || echo "Deployment failed"

# Monitor error rates
# Set up alerts for increased error rates
```

### Automated Rollback Triggers
- 500 error rate > 5%
- Response time > 5 seconds
- Database connection failures

## Best Practices

### Release Timing
- **Weekdays**: Tuesday-Thursday (avoid Mondays/Fridays)
- **Time**: Business hours for immediate support
- **Frequency**: Weekly stable releases

### Documentation
- Always update CHANGELOG.md
- Include breaking changes
- Document database migrations
- Update API documentation

### Communication
- Slack/email notifications
- GitHub release notes
- Update status page

## Emergency Procedures

### If Release Breaks Production
1. **Immediate**: Run rollback script
2. **Assess**: Determine root cause
3. **Fix**: Create hotfix branch
4. **Test**: Verify fix in staging
5. **Deploy**: Emergency deployment
6. **Review**: Post-mortem analysis

### Rollback Decision Matrix
- **Critical bug**: Immediate rollback
- **Minor issue**: Hotfix in next release
- **Performance degradation**: Rollback if >20% impact
- **Database corruption**: Immediate rollback + restore

---

*This release management system ensures safe, organized deployments with clear recovery procedures.*