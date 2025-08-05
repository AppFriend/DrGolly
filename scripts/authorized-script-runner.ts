/**
 * AUTHORIZED SCRIPT RUNNER
 * 
 * This utility provides a secure way to execute important scripts with proper
 * authorization, logging, and backup procedures.
 * 
 * Usage: tsx authorized-script-runner.ts [script-name]
 */

import { executeWithGuard, registerProtectedScript } from './script-execution-guard';
import { logSecurityViolation } from './script-security-monitor';
import fs from 'fs';
import path from 'path';

// Available authorized scripts
const AUTHORIZED_SCRIPTS = {
  'content-recovery': {
    scriptName: 'authentic-content-recovery.ts',
    destructive: true,
    requiresConfirmation: true,
    requiresBackup: true,
    allowedUsers: ['admin@drgolly.com'],
    description: 'Restore authentic lesson content after data corruption'
  },
  'database-maintenance': {
    scriptName: 'database-maintenance.ts',
    destructive: false,
    requiresConfirmation: true,
    requiresBackup: false,
    allowedUsers: ['admin@drgolly.com'],
    description: 'Perform routine database maintenance operations'
  },
  'content-migration': {
    scriptName: 'content-migration.ts',
    destructive: true,
    requiresConfirmation: true,
    requiresBackup: true,
    allowedUsers: ['admin@drgolly.com'],
    description: 'Migrate content between systems with full safeguards'
  }
};

/**
 * Display available scripts
 */
function showAvailableScripts(): void {
  console.log('📋 AVAILABLE AUTHORIZED SCRIPTS');
  console.log('═'.repeat(50));
  
  Object.entries(AUTHORIZED_SCRIPTS).forEach(([key, config]) => {
    console.log(`🔑 ${key}`);
    console.log(`   Script: ${config.scriptName}`);
    console.log(`   Risk: ${config.destructive ? 'HIGH' : 'LOW'}`);
    console.log(`   Description: ${config.description}`);
    console.log('');
  });
  
  console.log('Usage: tsx authorized-script-runner.ts [script-key]');
}

/**
 * Execute an authorized script
 */
async function executeAuthorizedScript(scriptKey: string): Promise<void> {
  const config = AUTHORIZED_SCRIPTS[scriptKey as keyof typeof AUTHORIZED_SCRIPTS];
  
  if (!config) {
    console.error(`❌ Unknown script: ${scriptKey}`);
    console.log('Available scripts:');
    showAvailableScripts();
    process.exit(1);
  }

  // Register the script for protection
  registerProtectedScript(config);

  console.log(`🚀 Preparing to execute: ${config.scriptName}`);
  console.log(`📋 Description: ${config.description}`);
  
  // Check if script file exists
  const scriptPath = path.join(__dirname, config.scriptName);
  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ Script file not found: ${scriptPath}`);
    console.log('Available script files:');
    const scripts = fs.readdirSync(__dirname).filter(f => f.endsWith('.ts'));
    scripts.forEach(script => console.log(`   - ${script}`));
    process.exit(1);
  }

  // Execute with full security guard
  try {
    const operation = async () => {
      console.log(`📦 Loading script: ${config.scriptName}`);
      
      // Dynamically import and execute the script
      const scriptModule = await import(`./${config.scriptName}`);
      
      if (scriptModule.default && typeof scriptModule.default === 'function') {
        await scriptModule.default();
      } else if (scriptModule.main && typeof scriptModule.main === 'function') {
        await scriptModule.main();
      } else {
        console.log('ℹ️  Script loaded successfully (no default export function)');
      }
    };

    await executeWithGuard(config.scriptName, operation);
    console.log('✅ Script execution completed successfully');
    
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    
    // Log the failure
    await logSecurityViolation({
      timestamp: new Date().toISOString(),
      scriptName: config.scriptName,
      violation: 'SCRIPT_EXECUTION_FAILED',
      userInfo: process.env.USER_EMAIL || 'unknown',
      prevented: false
    });
    
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const scriptKey = process.argv[2];
  
  if (!scriptKey) {
    showAvailableScripts();
    return;
  }

  await executeAuthorizedScript(scriptKey);
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

export { AUTHORIZED_SCRIPTS, executeAuthorizedScript };