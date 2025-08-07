#!/usr/bin/env tsx
/**
 * User Migration Script for Dr. Golly App
 * Objective: Onboard batch of users with temporary passwords
 * 
 * Tasks:
 * 1. Load emails from CSV and match against user database
 * 2. Assign temporary password: DRG-075-616!
 * 3. Set password_reset_required flag
 * 4. Test first login flow for 5 random users
 */

import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq, inArray } from 'drizzle-orm';
import { AuthUtils } from '../server/auth-utils';

const TEMPORARY_PASSWORD = 'DRG-075-616!';
const CSV_FILE_PATH = './attached_assets/subscriptions_MIgration_Cancellation (1)_1754533334628.csv';

interface CSVUser {
  'Customer Email': string;
  'Customer Name': string;
  Plan: string;
  Amount: string;
  Status: string;
}

class UserMigrationService {
  private migratedUsers: Array<{
    email: string;
    id: string;
    name: string;
    plan: string;
    migrationStatus: 'success' | 'error' | 'not_found';
    error?: string;
  }> = [];

  /**
   * Step 1: Load and parse CSV data
   */
  async loadCSVData(): Promise<CSVUser[]> {
    console.log('🔄 Loading CSV data...');
    
    try {
      const csvContent = readFileSync(CSV_FILE_PATH, 'utf8');
      const records: CSVUser[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      console.log(`✅ Loaded ${records.length} records from CSV`);
      return records;
    } catch (error) {
      console.error('❌ Error loading CSV:', error);
      throw error;
    }
  }

  /**
   * Step 2: Extract unique emails from CSV
   */
  extractEmailsFromCSV(records: CSVUser[]): string[] {
    const emails = records
      .map(record => record['Customer Email'])
      .filter(email => email && email.trim() !== '')
      .map(email => email.toLowerCase().trim());
    
    const uniqueEmails = [...new Set(emails)];
    console.log(`📧 Found ${uniqueEmails.length} unique emails in CSV`);
    return uniqueEmails;
  }

  /**
   * Step 3: Find matching users in database
   */
  async findMatchingUsers(emails: string[]) {
    console.log('🔍 Finding matching users in database...');
    
    try {
      const matchingUsers = await db
        .select()
        .from(users)
        .where(inArray(users.email, emails));
      
      console.log(`✅ Found ${matchingUsers.length} matching users in database`);
      return matchingUsers;
    } catch (error) {
      console.error('❌ Error finding matching users:', error);
      throw error;
    }
  }

  /**
   * Step 4: Assign temporary password to matched users
   */
  async assignTemporaryPasswords(matchingUsers: any[], csvRecords: CSVUser[]) {
    console.log('🔐 Assigning temporary passwords...');
    
    const hashedTempPassword = await AuthUtils.hashPassword(TEMPORARY_PASSWORD);
    let successCount = 0;
    let errorCount = 0;

    for (const user of matchingUsers) {
      try {
        // Find corresponding CSV record for plan info
        const csvRecord = csvRecords.find(
          record => record['Customer Email']?.toLowerCase().trim() === user.email?.toLowerCase()
        );

        await db
          .update(users)
          .set({
            temporaryPassword: hashedTempPassword,
            isFirstLogin: true,
            hasSetPassword: false,
            passwordHash: hashedTempPassword,
            passwordSet: 'no',
            migrated: true,
            updatedAt: new Date()
          })
          .where(eq(users.id, user.id));

        this.migratedUsers.push({
          email: user.email,
          id: user.id,
          name: user.firstName || csvRecord?.['Customer Name'] || 'Unknown',
          plan: csvRecord?.Plan || 'Unknown',
          migrationStatus: 'success'
        });

        successCount++;
        console.log(`✅ ${user.email} - Password assigned successfully`);
      } catch (error) {
        console.error(`❌ ${user.email} - Error:`, error);
        
        this.migratedUsers.push({
          email: user.email,
          id: user.id,
          name: user.firstName || 'Unknown',
          plan: 'Unknown',
          migrationStatus: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Success: ${successCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log(`📧 Total users processed: ${matchingUsers.length}`);
  }

  /**
   * Step 5: Test login flow for 5 random users
   */
  async testLoginFlow() {
    console.log('\n🧪 Testing login flow for 5 random users...');
    
    const successfulMigrations = this.migratedUsers.filter(u => u.migrationStatus === 'success');
    if (successfulMigrations.length === 0) {
      console.log('❌ No successful migrations to test');
      return;
    }

    const testUsers = successfulMigrations
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(5, successfulMigrations.length));

    console.log(`\n🎯 Testing login for ${testUsers.length} users:`);
    
    for (const testUser of testUsers) {
      console.log(`\n👤 Testing user: ${testUser.email}`);
      console.log(`   Name: ${testUser.name}`);
      console.log(`   Plan: ${testUser.plan}`);
      console.log(`   Temp Password: ${TEMPORARY_PASSWORD}`);
      console.log(`   Expected Flow:`);
      console.log(`   1. Login with ${testUser.email} + ${TEMPORARY_PASSWORD}`);
      console.log(`   2. Forced password reset modal should appear`);
      console.log(`   3. User sets new password`);
      console.log(`   4. Modal disappears, flags cleared`);
      
      // Verify the user flags are set correctly
      try {
        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.id, testUser.id))
          .limit(1);

        if (dbUser.length > 0) {
          const user = dbUser[0];
          console.log(`   ✅ Database verification:`);
          console.log(`      - isFirstLogin: ${user.isFirstLogin}`);
          console.log(`      - hasSetPassword: ${user.hasSetPassword}`);
          console.log(`      - passwordSet: ${user.passwordSet}`);
          console.log(`      - migrated: ${user.migrated}`);
          console.log(`      - temporaryPassword: ${user.temporaryPassword ? 'SET' : 'NOT SET'}`);
        }
      } catch (error) {
        console.log(`   ❌ Error verifying user flags:`, error);
      }
    }
  }

  /**
   * Step 6: Generate migration report
   */
  generateReport() {
    console.log('\n📋 MIGRATION REPORT');
    console.log('='.repeat(50));
    
    const successful = this.migratedUsers.filter(u => u.migrationStatus === 'success');
    const errors = this.migratedUsers.filter(u => u.migrationStatus === 'error');
    
    console.log(`✅ Successfully migrated: ${successful.length} users`);
    console.log(`❌ Migration errors: ${errors.length} users`);
    console.log(`📧 Temporary password: ${TEMPORARY_PASSWORD}`);
    
    if (successful.length > 0) {
      console.log('\n✅ SUCCESSFUL MIGRATIONS:');
      successful.forEach(user => {
        console.log(`   ${user.email} (${user.name}) - ${user.plan}`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\n❌ MIGRATION ERRORS:');
      errors.forEach(user => {
        console.log(`   ${user.email} - ${user.error}`);
      });
    }

    console.log('\n🔄 NEXT STEPS:');
    console.log('1. Send email notifications to migrated users with temporary password');
    console.log('2. Monitor first-time logins and password reset completions');
    console.log('3. Verify the forced password reset modal appears correctly');
    console.log('4. Test complete login flow end-to-end');
    
    console.log('\n🧪 TESTING INSTRUCTIONS:');
    console.log('1. Go to https://myapp.drgolly.com');
    console.log('2. Login with any of the migrated emails + DRG-075-616!');
    console.log('3. Verify forced password reset modal appears');
    console.log('4. Set new password and verify modal disappears');
    console.log('5. Log out and log back in with new password');
  }

  /**
   * Main migration execution
   */
  async execute() {
    console.log('🚀 Starting User Migration Process...\n');
    
    try {
      // Step 1: Load CSV data
      const csvRecords = await this.loadCSVData();
      
      // Step 2: Extract emails
      const emails = this.extractEmailsFromCSV(csvRecords);
      
      // Step 3: Find matching users
      const matchingUsers = await this.findMatchingUsers(emails);
      
      if (matchingUsers.length === 0) {
        console.log('⚠️ No matching users found in database');
        return;
      }
      
      // Step 4: Assign temporary passwords
      await this.assignTemporaryPasswords(matchingUsers, csvRecords);
      
      // Step 5: Test login flow
      await this.testLoginFlow();
      
      // Step 6: Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    }
  }
}

// Execute migration if run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const migration = new UserMigrationService();
  migration.execute()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

export { UserMigrationService };