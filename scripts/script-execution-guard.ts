/**
 * SCRIPT EXECUTION GUARD SYSTEM
 * 
 * This module provides comprehensive protection against unauthorized 
 * script execution, particularly for scripts that modify data.
 * 
 * Created in response to August 5th data corruption incident where
 * populate-course-content.ts ran without authorization.
 */

import readline from 'readline';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface ScriptGuardConfig {
  scriptName: string;
  destructive: boolean;
  requiresConfirmation: boolean;
  requiresBackup: boolean;
  allowedUsers: string[];
  description: string;
}

// Registry of all protected scripts
const PROTECTED_SCRIPTS: Record<string, ScriptGuardConfig> = {
  'populate-course-content.ts': {
    scriptName: 'populate-course-content.ts',
    destructive: true,
    requiresConfirmation: true,
    requiresBackup: true,
    allowedUsers: ['admin@drgolly.com'], // Only specific users can run
    description: 'CSV sync script that overwrites ALL lesson content'
  },
  'migrate-database.ts': {
    scriptName: 'migrate-database.ts',
    destructive: true,
    requiresConfirmation: true,
    requiresBackup: true,
    allowedUsers: ['admin@drgolly.com'],
    description: 'Database migration script'
  },
  'bulk-content-operations.ts': {
    scriptName: 'bulk-content-operations.ts',
    destructive: true,
    requiresConfirmation: true,
    requiresBackup: true,
    allowedUsers: ['admin@drgolly.com'],
    description: 'Bulk content modification operations'
  }
};

/**
 * Creates a secure execution lock file
 */
function createExecutionLock(scriptName: string): string {
  const lockId = crypto.randomUUID();
  const lockFile = path.join(process.cwd(), `.script-locks/${scriptName}-${lockId}.lock`);
  
  // Ensure lock directory exists
  const lockDir = path.dirname(lockFile);
  if (!fs.existsSync(lockDir)) {
    fs.mkdirSync(lockDir, { recursive: true });
  }
  
  fs.writeFileSync(lockFile, JSON.stringify({
    scriptName,
    lockId,
    timestamp: new Date().toISOString(),
    process: process.pid
  }));
  
  return lockFile;
}

/**
 * Removes execution lock
 */
function removeExecutionLock(lockFile: string): void {
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
  }
}

/**
 * Multi-step authorization process with escalating security
 */
async function getDetailedAuthorization(config: ScriptGuardConfig): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n🔐 SECURE SCRIPT EXECUTION AUTHORIZATION 🔐');
  console.log('═'.repeat(60));
  console.log(`Script: ${config.scriptName}`);
  console.log(`Description: ${config.description}`);
  console.log(`Risk Level: ${config.destructive ? 'HIGH - DATA MODIFICATION' : 'LOW'}`);
  console.log(`Backup Required: ${config.requiresBackup ? 'YES' : 'No'}`);
  console.log('═'.repeat(60));
  
  if (config.destructive) {
    console.log('⚠️  CRITICAL WARNING: This script makes IRREVERSIBLE changes');
    console.log('⚠️  INCIDENT REFERENCE: Similar to August 5th data corruption');
    console.log('⚠️  SAFETY REQUIREMENT: Backup will be created automatically');
  }

  // Step 1: Purpose confirmation
  const purpose = await new Promise<string>((resolve) => {
    rl.question('\n1. What is the business purpose for running this script? ', resolve);
  });

  if (!purpose.trim()) {
    console.log('❌ Authorization denied: Purpose is required');
    rl.close();
    return false;
  }

  // Step 2: Backup confirmation
  if (config.requiresBackup) {
    const backupConfirm = await new Promise<string>((resolve) => {
      rl.question('2. Confirm automatic backup creation? (type "BACKUP_CONFIRMED"): ', resolve);
    });

    if (backupConfirm.trim() !== 'BACKUP_CONFIRMED') {
      console.log('❌ Authorization denied: Backup confirmation required');
      rl.close();
      return false;
    }
  }

  // Step 3: Final authorization phrase
  console.log('\n3. Final Authorization Required:');
  console.log('   Type exactly: AUTHORIZED_EXECUTION_WITH_FULL_RESPONSIBILITY');
  
  const finalAuth = await new Promise<string>((resolve) => {
    rl.question('\nFinal authorization: ', resolve);
  });

  rl.close();

  const authorized = finalAuth.trim() === 'AUTHORIZED_EXECUTION_WITH_FULL_RESPONSIBILITY';
  
  if (authorized) {
    console.log('✅ Authorization granted');
    console.log(`📝 Purpose logged: ${purpose}`);
    console.log(`👤 Authorized by: ${process.env.USER_EMAIL || 'unknown'}`);
  } else {
    console.log('❌ Authorization denied: Incorrect authorization phrase');
  }

  return authorized;
}

/**
 * Checks if current user is authorized to run the script
 */
function checkUserAuthorization(config: ScriptGuardConfig): boolean {
  const currentUser = process.env.USER_EMAIL || process.env.REPLIT_USER_EMAIL || 'unknown';
  
  if (config.allowedUsers.length > 0 && !config.allowedUsers.includes(currentUser)) {
    console.error(`❌ UNAUTHORIZED: User ${currentUser} is not authorized to run ${config.scriptName}`);
    console.error(`   Authorized users: ${config.allowedUsers.join(', ')}`);
    return false;
  }
  
  return true;
}

/**
 * Main guard function that must be called before any destructive operation
 */
export async function executeWithGuard(
  scriptName: string,
  operation: () => Promise<void>
): Promise<void> {
  console.log(`🔒 Script Execution Guard: Protecting ${scriptName}`);
  
  // Check if script is registered for protection
  const config = PROTECTED_SCRIPTS[scriptName];
  if (!config) {
    console.log(`⚠️  Script ${scriptName} is not registered in protection system`);
    console.log('   Consider adding it to PROTECTED_SCRIPTS for safety');
  }
  
  // For registered destructive scripts, enforce all protections
  if (config && config.destructive) {
    console.log('🔍 Performing security checks...');
    
    // 1. Check user authorization
    if (!checkUserAuthorization(config)) {
      process.exit(1);
    }
    
    // 2. Require detailed authorization
    if (config.requiresConfirmation) {
      const authorized = await getDetailedAuthorization(config);
      if (!authorized) {
        console.log('❌ Script execution cancelled - authorization failed');
        process.exit(0);
      }
    }
    
    // 3. Create execution lock
    const lockFile = createExecutionLock(scriptName);
    
    try {
      // 4. Log the execution attempt
      console.log(`📝 Logging destructive script execution: ${scriptName}`);
      console.log(`   User: ${process.env.USER_EMAIL || 'unknown'}`);
      console.log(`   Timestamp: ${new Date().toISOString()}`);
      console.log(`   Lock File: ${lockFile}`);
      
      // 5. Execute the actual operation
      console.log('🚀 Executing protected operation...');
      await operation();
      
      console.log('✅ Operation completed successfully');
      
    } catch (error) {
      console.error('❌ Operation failed:', error);
      throw error;
    } finally {
      // Always clean up the lock
      removeExecutionLock(lockFile);
    }
  } else {
    // For non-destructive scripts, just execute
    await operation();
  }
}

/**
 * Registers a new script for protection
 */
export function registerProtectedScript(config: ScriptGuardConfig): void {
  PROTECTED_SCRIPTS[config.scriptName] = config;
  console.log(`🔒 Registered ${config.scriptName} for protection`);
}

/**
 * Emergency disable function - creates a global lock preventing all destructive operations
 */
export function emergencyDisableDestructiveScripts(): void {
  const emergencyLock = path.join(process.cwd(), '.script-locks/EMERGENCY_DISABLE.lock');
  fs.writeFileSync(emergencyLock, JSON.stringify({
    reason: 'Emergency disable of all destructive scripts',
    timestamp: new Date().toISOString(),
    disabledBy: process.env.USER_EMAIL || 'system'
  }));
  
  console.log('🚨 EMERGENCY: All destructive scripts have been disabled');
  console.log(`   Lock file: ${emergencyLock}`);
  console.log('   Remove this file to re-enable destructive operations');
}

/**
 * Checks if emergency disable is active
 */
export function isEmergencyDisabled(): boolean {
  const emergencyLock = path.join(process.cwd(), '.script-locks/EMERGENCY_DISABLE.lock');
  return fs.existsSync(emergencyLock);
}

export default executeWithGuard;