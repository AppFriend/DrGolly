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
 * Prompts user for confirmation with detailed warnings
 */
async function getUserConfirmation(config: ScriptGuardConfig): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n🚨 DESTRUCTIVE SCRIPT EXECUTION WARNING 🚨');
    console.log('═'.repeat(60));
    console.log(`Script: ${config.scriptName}`);
    console.log(`Description: ${config.description}`);
    console.log(`Destructive: ${config.destructive ? 'YES - WILL MODIFY/DELETE DATA' : 'No'}`);
    console.log(`Backup Required: ${config.requiresBackup ? 'YES' : 'No'}`);
    console.log('═'.repeat(60));
    
    if (config.destructive) {
      console.log('⚠️  WARNING: This script will make IRREVERSIBLE changes to your data');
      console.log('⚠️  WARNING: Always ensure you have recent backups before proceeding');
      console.log('⚠️  WARNING: This action was the cause of the August 5th data loss incident');
    }
    
    console.log('\nRef: DATA_LOSS_INCIDENT_REPORT.md for full incident details');
    console.log('\nTo proceed, you must type: EXECUTE_DESTRUCTIVE_SCRIPT');
    
    rl.question('\nYour response: ', (answer) => {
      rl.close();
      resolve(answer.trim() === 'EXECUTE_DESTRUCTIVE_SCRIPT');
    });
  });
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
    
    // 2. Require explicit confirmation
    if (config.requiresConfirmation) {
      const confirmed = await getUserConfirmation(config);
      if (!confirmed) {
        console.log('❌ Script execution cancelled by user');
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