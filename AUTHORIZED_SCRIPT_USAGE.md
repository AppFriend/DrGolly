# AUTHORIZED SCRIPT EXECUTION GUIDE

## SECURE SCRIPT EXECUTION FOR AUTHORIZED USERS

The system now provides secure ways to execute important scripts while maintaining maximum protection against unauthorized execution like the August 5th incident.

### 🔐 ENHANCED AUTHORIZATION PROCESS

When you need to run important scripts, the system now uses a **3-step authorization process**:

#### Step 1: Business Purpose
```
What is the business purpose for running this script?
> Restoring lesson content after data corruption verification
```

#### Step 2: Backup Confirmation  
```
Confirm automatic backup creation? (type "BACKUP_CONFIRMED"):
> BACKUP_CONFIRMED
```

#### Step 3: Final Authorization
```
Type exactly: AUTHORIZED_EXECUTION_WITH_FULL_RESPONSIBILITY
> AUTHORIZED_EXECUTION_WITH_FULL_RESPONSIBILITY
```

### 📋 AVAILABLE AUTHORIZED SCRIPTS

#### Content Recovery Scripts
- **content-recovery**: Restore authentic lesson content after data corruption
- **content-migration**: Migrate content between systems with full safeguards

#### Maintenance Scripts  
- **database-maintenance**: Perform routine database maintenance operations

### 🚀 HOW TO EXECUTE SCRIPTS SAFELY

#### Option 1: Authorized Script Runner (RECOMMENDED)
```bash
# View all available scripts
tsx scripts/authorized-script-runner.ts

# Execute specific script with full protection
tsx scripts/authorized-script-runner.ts content-recovery
```

#### Option 2: Direct Script Execution
```bash
# Execute individual scripts (also protected)
tsx scripts/authentic-content-recovery.ts
```

### 🔒 SECURITY FEATURES

✅ **Multi-step confirmation**: 3 authorization steps required
✅ **Business justification**: Must explain purpose
✅ **Automatic backups**: Created before any destructive operations
✅ **Complete audit trail**: All actions logged with user attribution
✅ **User verification**: Only authorized users can execute
✅ **Emergency override**: Can be disabled instantly if needed

### 🚨 SECURITY GUARANTEES

- **No automatic execution**: Scripts require explicit manual authorization
- **Authorization trail**: Every execution logged with business purpose
- **Backup protection**: Automatic data backup before any changes
- **User accountability**: Full audit trail with email and timestamp
- **Emergency controls**: Instant disable capability maintained

### ⚡ QUICK REFERENCE

```bash
# List available scripts
tsx scripts/authorized-script-runner.ts

# Execute content recovery
tsx scripts/authorized-script-runner.ts content-recovery

# Check security status
ls -la .script-locks/

# Emergency disable all scripts
touch .script-locks/EMERGENCY_SHUTDOWN.lock
```

### 📞 SUPPORT

For script authorization or technical issues:
- **Authorized Users**: admin@drgolly.com
- **Security Questions**: Contact system administrator
- **Emergency**: Use emergency shutdown if suspicious activity detected

---

**This system ensures you can execute important scripts safely while preventing any recurrence of the August 5th data corruption incident.**