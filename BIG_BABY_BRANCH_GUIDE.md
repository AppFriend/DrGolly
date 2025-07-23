# Big Baby Course Data Update - Branch Management Guide

This guide provides safe branch management for Big Baby course data updates with complete rollback capabilities.

## Quick Start

### 1. Create Feature Branch with Database Backup
```bash
./create_big_baby_branch.sh
```

This will:
- ✅ Create database backup/checkpoint
- ✅ Create feature branch `feature/courses/big-baby-data-update`
- ✅ Generate rollback script
- ✅ Set up branch documentation

### 2. Verify Database State (Optional)
```bash
./verify_database_state.sh
```

### 3. Work on Your Changes
Make your Big Baby course updates safely:
- Update course data in database
- Modify course components
- Test thoroughly

### 4. Complete Rollback (If Needed)
```bash
./rollback_big_baby_branch.sh
```

This will:
- ❌ Delete feature branch
- ❌ Switch back to main/dev
- ❌ Restore database from checkpoint
- ❌ Undo ALL changes

## File Structure After Setup

```
├── create_big_baby_branch.sh          # Initial setup script
├── verify_database_state.sh           # Database verification
├── rollback_big_baby_branch.sh        # Complete rollback (auto-generated)
├── BRANCH_INFO.md                     # Branch details (auto-generated)
├── database_backups/                  # Database checkpoint files
│   ├── big_baby_checkpoint_YYYYMMDD_HHMMSS_schema.sql
│   ├── big_baby_checkpoint_YYYYMMDD_HHMMSS_data.sql
│   └── big_baby_checkpoint_YYYYMMDD_HHMMSS_full.sql
└── branch_setup.log                   # Setup activity log
```

## Safety Features

### Database Backup
- **Schema backup**: Table structures, indexes, constraints
- **Data backup**: All data (excluding sessions)
- **Full backup**: Complete database state

### Git Branch Management
- Clean feature branch creation
- Automatic base branch detection (main/dev/master)
- Uncommitted changes detection

### Rollback Protection
- Confirmation prompts before destructive operations
- Complete database restoration
- Branch cleanup and deletion

## Best Practices

### Before Making Changes
1. ✅ Run database verification
2. ✅ Commit any existing work
3. ✅ Review current Big Baby course data

### During Development
1. ✅ Make incremental commits
2. ✅ Test changes thoroughly
3. ✅ Use `npm run db:push` for schema changes
4. ✅ Backup before major modifications

### Emergency Situations
1. 🚨 Data corruption detected → Run rollback immediately
2. 🚨 Database schema errors → Restore from checkpoint
3. 🚨 Application crashes → Verify database state first

## Troubleshooting

### Common Issues

**"pg_dump: command not found"**
```bash
# Install PostgreSQL client tools
sudo apt-get install postgresql-client
```

**"Permission denied" errors**
```bash
# Make scripts executable
chmod +x *.sh
```

**"Database connection failed"**
```bash
# Check DATABASE_URL environment variable
echo $DATABASE_URL
```

### Recovery Steps

1. **Check branch status**:
   ```bash
   git branch -v
   cat BRANCH_INFO.md
   ```

2. **Verify database state**:
   ```bash
   ./verify_database_state.sh
   ```

3. **Review setup log**:
   ```bash
   cat branch_setup.log
   ```

## Integration with Existing Workflow

### With Current Project Structure
- Works with existing Drizzle ORM setup
- Compatible with `npm run db:push` workflow
- Preserves current authentication system
- Maintains Klaviyo integration

### With Replit Environment
- Uses environment variables automatically
- Compatible with Replit database
- Works with current deployment setup

## Command Reference

| Command | Purpose | Safety Level |
|---------|---------|--------------|
| `./create_big_baby_branch.sh` | Create branch + backup | ✅ Safe |
| `./verify_database_state.sh` | Check database | ✅ Safe |
| `./rollback_big_baby_branch.sh` | Complete rollback | ⚠️ Destructive |
| `git status` | Check branch state | ✅ Safe |
| `npm run db:push` | Apply schema changes | ⚠️ Modifies DB |

## Next Steps

1. Run the branch creation script
2. Start working on Big Baby course updates
3. Test thoroughly before merging
4. Keep rollback script available for emergencies

Remember: The rollback capability gives you confidence to make significant changes knowing you can always return to a known good state.