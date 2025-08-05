#!/usr/bin/env node

/**
 * PRE-SCRIPT SECURITY CHECK
 * 
 * This script runs before any package.json script execution
 * to prevent unauthorized destructive operations.
 * 
 * Triggered by: npm run [script-name]
 */

const fs = require('fs');
const path = require('path');

const DANGEROUS_SCRIPTS = [
  'populate-course-content',
  'migrate-database',
  'bulk-update',
  'csv-sync',
  'content-import'
];

const scriptName = process.argv[2];

console.log(`🔍 Security check for script: ${scriptName}`);

// Check if script is dangerous
const isDangerous = DANGEROUS_SCRIPTS.some(dangerous => 
  scriptName && scriptName.includes(dangerous)
);

if (isDangerous) {
  console.error('🚨 SECURITY VIOLATION DETECTED');
  console.error(`Script "${scriptName}" is classified as DANGEROUS`);
  console.error('');
  console.error('INCIDENT REFERENCE: August 5th data corruption caused by unauthorized script execution');
  console.error('');
  console.error('This script cannot be executed through npm scripts.');
  console.error('Use the secured version with proper authorization checks.');
  console.error('');
  console.error('Contact admin@drgolly.com for authorized script execution.');
  process.exit(1);
}

// Check for emergency locks
const emergencyLock = path.join(process.cwd(), '.script-locks/EMERGENCY_SHUTDOWN.lock');
if (fs.existsSync(emergencyLock)) {
  console.error('🚨 EMERGENCY SHUTDOWN ACTIVE');
  console.error('All script execution is currently disabled');
  console.error(`Lock file: ${emergencyLock}`);
  process.exit(1);
}

console.log('✅ Security check passed');