#!/bin/bash

# Big Baby Course Feature Branch Setup Script
# Creates a new feature branch with database checkpoint and rollback capabilities

set -e  # Exit on any error

# Configuration
BRANCH_NAME="feature/courses/big-baby-data-update"
CHECKPOINT_NAME="big_baby_checkpoint_$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="./database_backups"
LOG_FILE="./branch_setup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

echo -e "${BLUE}🚀 Setting up Big Baby Course Feature Branch${NC}"
echo "=================================================="

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
    echo "Please commit or stash your changes before proceeding."
    git status --short
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborting branch creation."
        exit 1
    fi
fi

# Create backup directory
log "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Step 1: Create database backup/checkpoint
echo -e "${BLUE}📊 Creating database checkpoint...${NC}"
log "Creating database checkpoint: $CHECKPOINT_NAME"

# Export current database schema and data
if command -v pg_dump &> /dev/null && [ -n "$DATABASE_URL" ]; then
    echo "Creating PostgreSQL database backup..."
    
    # Create schema backup
    pg_dump "$DATABASE_URL" --schema-only > "$BACKUP_DIR/${CHECKPOINT_NAME}_schema.sql"
    log "Schema backup created: ${BACKUP_DIR}/${CHECKPOINT_NAME}_schema.sql"
    
    # Create data backup (excluding large tables if needed)
    pg_dump "$DATABASE_URL" --data-only --exclude-table=sessions > "$BACKUP_DIR/${CHECKPOINT_NAME}_data.sql"
    log "Data backup created: ${BACKUP_DIR}/${CHECKPOINT_NAME}_data.sql"
    
    # Create full backup
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/${CHECKPOINT_NAME}_full.sql"
    log "Full backup created: ${BACKUP_DIR}/${CHECKPOINT_NAME}_full.sql"
    
    echo -e "${GREEN}✅ Database backup completed${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Could not create database backup (pg_dump not available or DATABASE_URL not set)${NC}"
    log "Warning: Database backup skipped - pg_dump not available or DATABASE_URL not set"
fi

# Step 2: Create and switch to feature branch
echo -e "${BLUE}🌿 Creating feature branch...${NC}"
log "Creating branch: $BRANCH_NAME"

# Fetch latest changes
git fetch origin

# Create new branch from main/dev
if git show-ref --verify --quiet refs/heads/main; then
    BASE_BRANCH="main"
elif git show-ref --verify --quiet refs/heads/dev; then
    BASE_BRANCH="dev"
else
    BASE_BRANCH="master"
fi

echo "Creating branch '$BRANCH_NAME' from '$BASE_BRANCH'"
git checkout -b "$BRANCH_NAME" "$BASE_BRANCH"
log "Branch created and checked out: $BRANCH_NAME"

# Step 3: Create rollback script
echo -e "${BLUE}🔄 Creating rollback script...${NC}"
ROLLBACK_SCRIPT="rollback_big_baby_branch.sh"

cat > "$ROLLBACK_SCRIPT" << EOF
#!/bin/bash

# Big Baby Course Feature Branch Rollback Script
# Generated on: $(date)
# Checkpoint: $CHECKPOINT_NAME

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\${YELLOW}⚠️  Big Baby Course Branch Rollback\${NC}"
echo "This will:"
echo "1. Switch back to $BASE_BRANCH branch"
echo "2. Delete the feature branch '$BRANCH_NAME'"
echo "3. Restore database from checkpoint '$CHECKPOINT_NAME'"
echo

read -p "Are you sure you want to rollback? This cannot be undone! (y/N): " -n 1 -r
echo
if [[ ! \$REPLY =~ ^[Yy]\$ ]]; then
    echo "Rollback cancelled."
    exit 1
fi

echo -e "\${BLUE}🔄 Rolling back changes...\${NC}"

# Switch to base branch
git checkout $BASE_BRANCH
echo -e "\${GREEN}✅ Switched to $BASE_BRANCH branch\${NC}"

# Delete feature branch
git branch -D "$BRANCH_NAME" 2>/dev/null || echo "Branch already deleted"
echo -e "\${GREEN}✅ Deleted feature branch\${NC}"

# Restore database if backup exists
if [ -f "$BACKUP_DIR/${CHECKPOINT_NAME}_full.sql" ] && [ -n "\$DATABASE_URL" ]; then
    echo -e "\${BLUE}📊 Restoring database from checkpoint...\${NC}"
    
    # Drop and recreate database (be careful!)
    echo "Restoring database from backup..."
    psql "\$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    psql "\$DATABASE_URL" < "$BACKUP_DIR/${CHECKPOINT_NAME}_full.sql"
    
    echo -e "\${GREEN}✅ Database restored from checkpoint\${NC}"
else
    echo -e "\${YELLOW}⚠️  Warning: Database backup not found or DATABASE_URL not set\${NC}"
    echo "Manual database rollback may be required"
fi

echo -e "\${GREEN}🎉 Rollback completed successfully!\${NC}"
echo "Checkpoint used: $CHECKPOINT_NAME"
echo "Backup location: $BACKUP_DIR"
EOF

chmod +x "$ROLLBACK_SCRIPT"
log "Rollback script created: $ROLLBACK_SCRIPT"

# Step 4: Create branch information file
echo -e "${BLUE}📝 Creating branch information...${NC}"
cat > "BRANCH_INFO.md" << EOF
# Big Baby Course Data Update Branch

**Branch:** $BRANCH_NAME  
**Created:** $(date)  
**Checkpoint:** $CHECKPOINT_NAME  
**Base Branch:** $BASE_BRANCH

## Purpose
This branch is specifically for updating Big Baby course information and data.

## Database Checkpoint
- Schema backup: $BACKUP_DIR/${CHECKPOINT_NAME}_schema.sql
- Data backup: $BACKUP_DIR/${CHECKPOINT_NAME}_data.sql  
- Full backup: $BACKUP_DIR/${CHECKPOINT_NAME}_full.sql

## Rollback Instructions
To rollback all changes including database state:
\`\`\`bash
./$ROLLBACK_SCRIPT
\`\`\`

## Safe Development Practices
1. Test all database changes on staging first
2. Make incremental commits
3. Use \`npm run db:push\` for schema changes
4. Backup before major modifications

## Files to Focus On
- \`shared/schema.ts\` - Database schema changes
- \`server/storage.ts\` - Data access methods
- Course-related components in \`client/src/\`
- Admin panel course management

## Merge Checklist
- [ ] All tests passing
- [ ] Database migrations tested
- [ ] Admin panel functionality verified
- [ ] Course display working correctly
- [ ] No data corruption or loss
EOF

git add "BRANCH_INFO.md"
git commit -m "feat: Initialize Big Baby course data update branch

- Add branch information and guidelines
- Create database checkpoint: $CHECKPOINT_NAME
- Set up rollback capabilities"

log "Branch information file created and committed"

# Step 5: Summary
echo
echo -e "${GREEN}🎉 Big Baby Course Feature Branch Setup Complete!${NC}"
echo "=================================================="
echo -e "Branch: ${BLUE}$BRANCH_NAME${NC}"
echo -e "Checkpoint: ${BLUE}$CHECKPOINT_NAME${NC}"
echo -e "Base: ${BLUE}$BASE_BRANCH${NC}"
echo
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Make your Big Baby course data changes"
echo "2. Test thoroughly before committing"
echo "3. Use incremental commits for safety"
echo "4. Run '$ROLLBACK_SCRIPT' if you need to rollback everything"
echo
echo -e "${YELLOW}📁 Important Files:${NC}"
echo "- Branch info: BRANCH_INFO.md"
echo "- Rollback script: $ROLLBACK_SCRIPT"
echo "- Database backups: $BACKUP_DIR/"
echo "- Setup log: $LOG_FILE"
echo
echo -e "${BLUE}Happy coding! 🚀${NC}"

log "Branch setup completed successfully"