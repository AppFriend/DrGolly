/**
 * CRITICAL DATA RECOVERY SYSTEM
 * 
 * This script addresses the data loss incident where Alex's course content 
 * updates were overwritten by a CSV sync operation on August 5th, 2025.
 * 
 * INCIDENT SUMMARY:
 * - 277 lessons were mass-updated on August 5th at 09:41 UTC
 * - Alex's admin changes from July 22nd were completely overwritten
 * - No audit trail existed to track the changes
 * 
 * RECOVERY ACTIONS:
 * 1. Add updated_at field to lesson_content table
 * 2. Create comprehensive audit logging system
 * 3. Implement data backup before any bulk operations
 * 4. Add admin panel confirmation for bulk changes
 */

import { db } from "../server/db";
import { 
  lessonContent, 
  contentAuditLog, 
  courseLessons,
  users,
  type InsertContentAuditLog 
} from "../shared/schema";
import { eq, and, sql } from "drizzle-orm";

interface AuditLogEntry {
  tableId: string;
  tableName: string;
  action: 'create' | 'update' | 'delete';
  oldValues?: any;
  newValues?: any;
  userId?: string;
  userEmail?: string;
  changeSource: 'admin_panel' | 'csv_sync' | 'api' | 'migration' | 'recovery';
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Add updated_at field to lesson_content table if it doesn't exist
 */
export async function addUpdatedAtField() {
  try {
    console.log("🔧 Adding updated_at field to lesson_content table...");
    
    // Check if column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'lesson_content' 
      AND column_name = 'updated_at'
    `);
    
    if (result.length === 0) {
      // Add the updated_at column
      await db.execute(sql`
        ALTER TABLE lesson_content 
        ADD COLUMN updated_at TIMESTAMP DEFAULT NOW()
      `);
      
      // Update existing records with a timestamp
      await db.execute(sql`
        UPDATE lesson_content 
        SET updated_at = created_at 
        WHERE updated_at IS NULL
      `);
      
      console.log("✅ Successfully added updated_at field to lesson_content");
    } else {
      console.log("ℹ️ updated_at field already exists in lesson_content");
    }
  } catch (error) {
    console.error("❌ Error adding updated_at field:", error);
    throw error;
  }
}

/**
 * Create the audit log table if it doesn't exist
 */
export async function createAuditLogTable() {
  try {
    console.log("🔧 Creating content_audit_log table...");
    
    // The table creation will be handled by drizzle migration
    // This function serves as a verification step
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'content_audit_log'
    `);
    
    if (result.length > 0) {
      console.log("✅ content_audit_log table exists");
    } else {
      console.log("⚠️ content_audit_log table not found - run db:push first");
    }
  } catch (error) {
    console.error("❌ Error checking audit log table:", error);
    throw error;
  }
}

/**
 * Log a content change to the audit trail
 */
export async function logContentChange(logEntry: AuditLogEntry): Promise<void> {
  try {
    const auditEntry: InsertContentAuditLog = {
      tableId: logEntry.tableId,
      tableName: logEntry.tableName,
      action: logEntry.action,
      oldValues: logEntry.oldValues || null,
      newValues: logEntry.newValues || null,
      userId: logEntry.userId || null,
      userEmail: logEntry.userEmail || null,
      changeSource: logEntry.changeSource,
      ipAddress: logEntry.ipAddress || null,
      userAgent: logEntry.userAgent || null,
      sessionId: logEntry.sessionId || null,
    };

    await db.insert(contentAuditLog).values(auditEntry);
    console.log(`📝 Logged ${logEntry.action} action for ${logEntry.tableName} ID: ${logEntry.tableId}`);
  } catch (error) {
    console.error("❌ Error logging content change:", error);
    // Don't throw - audit logging shouldn't break the main operation
  }
}

/**
 * Create a backup of content before bulk operations
 */
export async function createContentBackup(tableName: string, description: string) {
  try {
    console.log(`🗄️ Creating backup of ${tableName}: ${description}`);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupTableName = `${tableName}_backup_${timestamp.substring(0, 19)}`;
    
    if (tableName === 'lesson_content') {
      await db.execute(sql.raw(`
        CREATE TABLE ${backupTableName} AS 
        SELECT * FROM lesson_content
      `));
    } else if (tableName === 'course_lessons') {
      await db.execute(sql.raw(`
        CREATE TABLE ${backupTableName} AS 
        SELECT * FROM course_lessons
      `));
    }
    
    // Log the backup creation
    await logContentChange({
      tableId: 'backup',
      tableName: backupTableName,
      action: 'create',
      newValues: { description, original_table: tableName },
      changeSource: 'recovery',
    });
    
    console.log(`✅ Backup created: ${backupTableName}`);
    return backupTableName;
  } catch (error) {
    console.error("❌ Error creating backup:", error);
    throw error;
  }
}

/**
 * Restore content from a backup table
 */
export async function restoreFromBackup(backupTableName: string, userId?: string, userEmail?: string) {
  try {
    console.log(`🔄 Restoring content from backup: ${backupTableName}`);
    
    // Determine target table from backup name
    const targetTable = backupTableName.includes('lesson_content') ? 'lesson_content' : 'course_lessons';
    
    // Create current backup before restore
    await createContentBackup(targetTable, `Pre-restore backup before restoring from ${backupTableName}`);
    
    if (targetTable === 'lesson_content') {
      // Clear current content
      await db.delete(lessonContent);
      
      // Restore from backup
      await db.execute(sql.raw(`
        INSERT INTO lesson_content 
        SELECT * FROM ${backupTableName}
      `));
    } else if (targetTable === 'course_lessons') {
      // Clear current content
      await db.delete(courseLessons);
      
      // Restore from backup
      await db.execute(sql.raw(`
        INSERT INTO course_lessons 
        SELECT * FROM ${backupTableName}
      `));
    }
    
    // Log the restore operation
    await logContentChange({
      tableId: 'restore',
      tableName: targetTable,
      action: 'update',
      newValues: { backup_source: backupTableName, description: 'Data restored from backup' },
      userId,
      userEmail,
      changeSource: 'recovery',
    });
    
    console.log(`✅ Successfully restored ${targetTable} from ${backupTableName}`);
  } catch (error) {
    console.error("❌ Error restoring from backup:", error);
    throw error;
  }
}

/**
 * List all available backups
 */
export async function listBackups(): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%_backup_%'
      ORDER BY table_name DESC
    `);
    
    const backups = result.map((row: any) => row.table_name);
    console.log("📋 Available backups:", backups);
    return backups;
  } catch (error) {
    console.error("❌ Error listing backups:", error);
    return [];
  }
}

/**
 * Get audit history for a specific content item
 */
export async function getContentHistory(tableName: string, tableId: string) {
  try {
    const history = await db
      .select()
      .from(contentAuditLog)
      .where(and(
        eq(contentAuditLog.tableName, tableName),
        eq(contentAuditLog.tableId, tableId)
      ))
      .orderBy(contentAuditLog.createdAt);
    
    console.log(`📜 History for ${tableName} ID ${tableId}:`, history.length, "entries");
    return history;
  } catch (error) {
    console.error("❌ Error getting content history:", error);
    return [];
  }
}

/**
 * Initialize the data recovery system
 */
export async function initializeDataRecoverySystem() {
  console.log("🚀 Initializing Data Recovery System...");
  
  try {
    // 1. Add updated_at field to lesson_content
    await addUpdatedAtField();
    
    // 2. Verify audit log table exists
    await createAuditLogTable();
    
    // 3. Create initial backup of current state
    await createContentBackup('lesson_content', 'Initial backup after data recovery system setup');
    await createContentBackup('course_lessons', 'Initial backup after data recovery system setup');
    
    // 4. Log the initialization
    await logContentChange({
      tableId: 'system',
      tableName: 'system',
      action: 'create',
      newValues: { 
        event: 'data_recovery_system_initialized',
        description: 'Response to data loss incident on August 5th, 2025'
      },
      changeSource: 'recovery',
    });
    
    console.log("✅ Data Recovery System initialized successfully!");
    console.log("🔒 Future content changes will be tracked and backed up");
    
  } catch (error) {
    console.error("❌ Error initializing data recovery system:", error);
    throw error;
  }
}

/**
 * Emergency recovery function - Use only in data loss incidents
 */
export async function emergencyDataRecovery() {
  console.log("🚨 EMERGENCY DATA RECOVERY INITIATED");
  console.log("This will attempt to restore content to the last known good state");
  
  try {
    // List available backups
    const backups = await listBackups();
    
    if (backups.length === 0) {
      console.log("❌ No backups available for recovery");
      return;
    }
    
    console.log("📋 Available backups for recovery:");
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup}`);
    });
    
    // For automated recovery, use the most recent backup
    const mostRecentBackup = backups[0];
    console.log(`🔄 Automatically selecting most recent backup: ${mostRecentBackup}`);
    
    await restoreFromBackup(mostRecentBackup, 'system', 'emergency-recovery@drgolly.com');
    
    console.log("✅ Emergency recovery completed");
    
  } catch (error) {
    console.error("❌ Emergency recovery failed:", error);
    throw error;
  }
}

// Main export
export default initializeDataRecoverySystem;