#!/usr/bin/env ts-node

/**
 * MEDICAL CONTENT PROTECTION SYSTEM
 * 
 * This script enforces strict authorization for any script that could modify
 * medical or educational content. Created after August 5th, 2025 data corruption
 * incident to prevent unauthorized automated content modifications.
 * 
 * PROTECTED CONTENT TYPES:
 * - Course modules and lessons (medical education)
 * - Blog posts (medical advice) 
 * - Feature flags (content access control)
 * - Course structure (educational pathways)
 * 
 * AUTHORIZATION REQUIRED FOR:
 * - alex@drgolly.com (primary admin)
 * - admin@drgolly.com (system admin)
 */

import { readFileSync, existsSync } from 'fs';
import * as path from 'path';

// Scripts that require manual authorization for medical content protection
const PROTECTED_SCRIPTS = [
  'seed-blog-posts.ts',
  'manual-content-entry.ts', 
  'map-rich-content.ts',
  'rebuild-course-structure.ts',
  'seed-feature-flags.ts',
  'populate-course-content.ts', // Permanently disabled
];

// Authorized users who can approve medical content changes
const AUTHORIZED_USERS = [
  'alex@drgolly.com',
  'admin@drgolly.com',
  'tech@drgolly.com'
];

interface SecurityCheck {
  scriptName: string;
  isProtected: boolean;
  requiresAuthorization: boolean;
  emergencyLockActive: boolean;
  authorizedUser?: string;
}

export class MedicalContentProtection {
  
  static checkScriptSecurity(scriptPath: string): SecurityCheck {
    const scriptName = path.basename(scriptPath);
    const isProtected = PROTECTED_SCRIPTS.includes(scriptName);
    const emergencyLockActive = existsSync('.script-locks/EMERGENCY_SHUTDOWN.lock');
    
    return {
      scriptName,
      isProtected,
      requiresAuthorization: isProtected,
      emergencyLockActive
    };
  }
  
  static validateExecution(scriptPath: string, userEmail?: string): boolean {
    const security = this.checkScriptSecurity(scriptPath);
    
    // Emergency shutdown check
    if (security.emergencyLockActive) {
      console.error('🚨 EMERGENCY SHUTDOWN ACTIVE - All content scripts disabled');
      console.error('Remove .script-locks/EMERGENCY_SHUTDOWN.lock to re-enable');
      return false;
    }
    
    // Protected script check
    if (security.isProtected) {
      if (!userEmail || !AUTHORIZED_USERS.includes(userEmail)) {
        console.error('🔒 MEDICAL CONTENT PROTECTION ACTIVE');
        console.error(`Script: ${security.scriptName}`);
        console.error('This script can modify medical content and requires authorization.');
        console.error(`Authorized users: ${AUTHORIZED_USERS.join(', ')}`);
        console.error('Contact admin for approval before executing.');
        return false;
      }
      
      console.log('✅ AUTHORIZED USER CONFIRMED');
      console.log(`User: ${userEmail}`);
      console.log(`Script: ${security.scriptName}`);
      console.log('Medical content modification authorized.');
    }
    
    return true;
  }
  
  static requireConfirmation(action: string): boolean {
    console.log('\n🔐 MEDICAL CONTENT MODIFICATION CONFIRMATION REQUIRED');
    console.log(`Action: ${action}`);
    console.log('This action could affect medical advice or educational content.');
    console.log('\nType: AUTHORIZE_MEDICAL_CONTENT_CHANGE');
    console.log('Or press Ctrl+C to cancel');
    
    // In a real implementation, this would wait for user input
    // For now, we return false to require explicit script modification
    return false;
  }
  
  static createEmergencyLock(): void {
    const lockDir = '.script-locks';
    const lockFile = path.join(lockDir, 'EMERGENCY_SHUTDOWN.lock');
    
    if (!existsSync(lockDir)) {
      require('fs').mkdirSync(lockDir, { recursive: true });
    }
    
    require('fs').writeFileSync(lockFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      reason: 'Emergency protection activated',
      incident_reference: 'August 5th, 2025 data corruption prevention'
    }, null, 2));
    
    console.log('🚨 EMERGENCY LOCK ACTIVATED');
    console.log('All content modification scripts disabled');
  }
  
  static removeEmergencyLock(): void {
    const lockFile = '.script-locks/EMERGENCY_SHUTDOWN.lock';
    if (existsSync(lockFile)) {
      require('fs').unlinkSync(lockFile);
      console.log('✅ Emergency lock removed');
    }
  }
}

// Export for use in other scripts
export default MedicalContentProtection;