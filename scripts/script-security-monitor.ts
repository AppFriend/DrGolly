/**
 * SCRIPT SECURITY MONITORING SYSTEM
 * 
 * This module monitors and prevents unauthorized script execution.
 * Created in response to the August 5th data corruption incident.
 */

import fs from 'fs';
import path from 'path';
import { db } from '../server/db';
import { contentAuditLog } from '../shared/schema';

interface SecurityViolation {
  timestamp: string;
  scriptName: string;
  violation: string;
  userInfo: string;
  prevented: boolean;
}

/**
 * Logs security violations
 */
export async function logSecurityViolation(violation: SecurityViolation): Promise<void> {
  try {
    // Log to database
    await db.insert(contentAuditLog).values({
      tableId: 'security-violation',
      tableName: 'system_security',
      action: 'security_violation',
      newValues: violation,
      changeSource: 'security-monitor',
      userEmail: violation.userInfo,
      ipAddress: process.env.USER_IP || 'unknown'
    });

    // Log to file system
    const logDir = path.join(process.cwd(), 'logs/security');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, `security-violations-${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = `${violation.timestamp} | ${violation.scriptName} | ${violation.violation} | ${violation.userInfo} | Prevented: ${violation.prevented}\n`;
    
    fs.appendFileSync(logFile, logEntry);

    console.error('🚨 SECURITY VIOLATION LOGGED:', violation);
  } catch (error) {
    console.error('Failed to log security violation:', error);
  }
}

/**
 * Checks if a script execution should be blocked
 */
export function shouldBlockExecution(scriptPath: string): boolean {
  const scriptName = path.basename(scriptPath);
  
  // Check if script is quarantined
  const quarantinedScripts = [
    'populate-course-content.ts',
    'populate-course-content.ts.DISABLED',
    'bulk-content-operations.ts',
    'migrate-database.ts'
  ];

  if (quarantinedScripts.includes(scriptName)) {
    logSecurityViolation({
      timestamp: new Date().toISOString(),
      scriptName,
      violation: 'ATTEMPTED_EXECUTION_OF_QUARANTINED_SCRIPT',
      userInfo: process.env.USER_EMAIL || 'unknown',
      prevented: true
    });
    return true;
  }

  return false;
}

/**
 * Monitors script directory for unauthorized changes
 */
export function monitorScriptDirectory(): void {
  try {
    const scriptsDir = path.join(__dirname);
    
    if (fs.existsSync(scriptsDir)) {
      fs.watch(scriptsDir, (eventType, filename) => {
        if (filename && (filename.includes('populate-course-content') || filename.includes('bulk-'))) {
          logSecurityViolation({
            timestamp: new Date().toISOString(),
            scriptName: filename,
            violation: `SUSPICIOUS_FILE_${eventType.toUpperCase()}`,
            userInfo: process.env.USER_EMAIL || 'unknown',
            prevented: false
          });
        }
      });
      console.log('🔍 Script directory monitoring enabled');
    }
  } catch (error) {
    console.log('⚠️  Script monitoring initialization deferred');
  }
}

/**
 * Emergency shutdown of all destructive operations
 */
export function emergencyShutdown(reason: string): void {
  const lockFile = path.join(process.cwd(), '.script-locks/EMERGENCY_SHUTDOWN.lock');
  const lockDir = path.dirname(lockFile);
  
  if (!fs.existsSync(lockDir)) {
    fs.mkdirSync(lockDir, { recursive: true });
  }
  
  fs.writeFileSync(lockFile, JSON.stringify({
    reason,
    timestamp: new Date().toISOString(),
    triggered_by: process.env.USER_EMAIL || 'system',
    incident_reference: 'August 5th data corruption prevention'
  }));
  
  console.error('🚨 EMERGENCY SHUTDOWN ACTIVATED');
  console.error(`Reason: ${reason}`);
  console.error(`Lock file: ${lockFile}`);
}

// Initialize monitoring
monitorScriptDirectory();

export default {
  logSecurityViolation,
  shouldBlockExecution,
  monitorScriptDirectory,
  emergencyShutdown
};