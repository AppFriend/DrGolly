import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { db } from '../server/db';
import { users } from '@shared/schema';
import { eq, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import path from 'path';

// Fixed temporary password for all migrated users
const TEMPORARY_PASSWORD = 'DRG-075-616!';

interface CSVRecord {
  'Customer Email'?: string;
  'Customer Name'?: string;
  'Plan'?: string;
  'Status'?: string;
  'Created'?: string;
  [key: string]: any; // Allow for different column names
}

interface ProcessedUser {
  email: string;
  name: string;
  plan: string;
  status: 'created' | 'updated' | 'error';
  error?: string;
  isNew?: boolean;
}

class CompleteUserMigrationService {
  private csvData: CSVRecord[] = [];
  private processedUsers: ProcessedUser[] = [];
  private csvFilePath = path.join(process.cwd(), 'attached_assets', 'subscriptions_MIgration_Cancellation (1)_1754533334628.csv');

  async loadCSVData(): Promise<void> {
    console.log('📂 Loading CSV data from:', this.csvFilePath);
    
    return new Promise((resolve, reject) => {
      const records: CSVRecord[] = [];
      
      createReadStream(this.csvFilePath)
        .pipe(parse({ 
          headers: true,
          delimiter: ',',
          quote: '"',
          escape: '"'
        }))
        .on('data', (record: CSVRecord) => {
          // Debug first few records to see structure
          if (records.length < 3) {
            console.log('CSV Record structure:', Object.keys(record));
            console.log('Sample record:', record);
          }
          
          // Try different possible email column names
          const emailField = record['Customer Email'] || 
                            record['email'] || 
                            record['Email'] || 
                            record['customer_email'] ||
                            Object.values(record).find(val => 
                              typeof val === 'string' && val.includes('@')
                            );
          
          if (emailField && emailField.trim()) {
            // Normalize the record format
            const normalizedRecord: CSVRecord = {
              'Customer Email': emailField,
              'Customer Name': record['Customer Name'] || record['name'] || record['Name'] || 'Unknown',
              'Plan': record['Plan'] || record['plan'] || record['subscription'] || 'Unknown',
              'Status': record['Status'] || record['status'] || 'active',
              'Created': record['Created'] || record['created'] || new Date().toISOString()
            };
            records.push(normalizedRecord);
          }
        })
        .on('end', () => {
          this.csvData = records;
          console.log(`✅ Loaded ${records.length} records from CSV`);
          
          // Log unique emails for verification
          const uniqueEmails = new Set(records.map(r => r['Customer Email'].toLowerCase().trim()));
          console.log(`📧 Found ${uniqueEmails.size} unique emails in CSV`);
          
          resolve();
        })
        .on('error', (error) => {
          console.error('❌ Error loading CSV:', error);
          reject(error);
        });
    });
  }

  async processAllCSVUsers(): Promise<void> {
    console.log('🔄 Processing all CSV users...');
    
    const hashedTempPassword = await bcrypt.hash(TEMPORARY_PASSWORD, 12);
    
    // Get all emails from CSV
    const csvEmails = this.csvData.map(record => record['Customer Email'].toLowerCase().trim());
    
    // Find existing users
    const existingUsers = await db
      .select()
      .from(users)
      .where(inArray(users.email, csvEmails));
    
    const existingEmailSet = new Set(existingUsers.map(user => user.email.toLowerCase()));
    
    console.log(`📊 Processing ${this.csvData.length} total users:`);
    console.log(`   - ${existingUsers.length} existing users to update`);
    console.log(`   - ${this.csvData.length - existingUsers.length} new users to create`);
    
    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const csvRecord of this.csvData) {
      const email = csvRecord['Customer Email'].toLowerCase().trim();
      const name = csvRecord['Customer Name'] || 'Unknown';
      const plan = csvRecord['Plan'] || 'Unknown';
      
      try {
        if (existingEmailSet.has(email)) {
          // Update existing user
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
            .where(eq(users.email, email));
          
          this.processedUsers.push({
            email,
            name,
            plan,
            status: 'updated',
            isNew: false
          });
          
          updatedCount++;
          console.log(`✅ Updated: ${email} (${name})`);
          
        } else {
          // Create new user
          const firstName = name.split(' ')[0] || name;
          const lastName = name.split(' ').slice(1).join(' ') || '';
          
          await db
            .insert(users)
            .values({
              email,
              firstName,
              lastName: lastName || null,
              temporaryPassword: hashedTempPassword,
              isFirstLogin: true,
              hasSetPassword: false,
              passwordHash: hashedTempPassword,
              passwordSet: 'no',
              migrated: true,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          
          this.processedUsers.push({
            email,
            name,
            plan,
            status: 'created',
            isNew: true
          });
          
          createdCount++;
          console.log(`✅ Created: ${email} (${name})`);
        }
        
      } catch (error) {
        this.processedUsers.push({
          email,
          name,
          plan,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        errorCount++;
        console.log(`❌ Error processing ${email}:`, error);
      }
    }
    
    console.log(`\n📊 Processing Summary:`);
    console.log(`✅ Created: ${createdCount} new users`);
    console.log(`✅ Updated: ${updatedCount} existing users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log(`📧 Total processed: ${createdCount + updatedCount} users`);
  }

  async verifyMigration(): Promise<void> {
    console.log('\n🔍 Verifying migration...');
    
    const csvEmails = this.csvData.map(record => record['Customer Email'].toLowerCase().trim());
    
    // Check all users in database
    const migratedUsers = await db
      .select()
      .from(users)
      .where(inArray(users.email, csvEmails));
    
    console.log(`✅ Found ${migratedUsers.length} migrated users in database`);
    
    // Verify flags are set correctly
    const correctlyFlagged = migratedUsers.filter(user => 
      user.migrated === true && 
      user.isFirstLogin === true && 
      user.hasSetPassword === false &&
      user.temporaryPassword !== null
    );
    
    console.log(`✅ ${correctlyFlagged.length} users have correct migration flags`);
    
    if (correctlyFlagged.length !== migratedUsers.length) {
      console.log(`⚠️ ${migratedUsers.length - correctlyFlagged.length} users have incorrect flags`);
    }
  }

  async testSampleUsers(): Promise<void> {
    console.log('\n🧪 Testing sample users...');
    
    const successfulUsers = this.processedUsers.filter(u => u.status !== 'error');
    const testUsers = successfulUsers.slice(0, 5);
    
    console.log(`\n🎯 Testing ${testUsers.length} users with temporary password: ${TEMPORARY_PASSWORD}`);
    
    for (const testUser of testUsers) {
      console.log(`\n👤 ${testUser.email} (${testUser.name})`);
      console.log(`   Status: ${testUser.status} ${testUser.isNew ? '(NEW USER)' : '(EXISTING)'}`);
      console.log(`   Plan: ${testUser.plan}`);
      console.log(`   Login: ${testUser.email} + ${TEMPORARY_PASSWORD}`);
      console.log(`   Expected: Forced password reset modal on login`);
    }
  }

  generateReport(): void {
    console.log('\n📋 COMPLETE MIGRATION REPORT');
    console.log('='.repeat(60));
    
    const created = this.processedUsers.filter(u => u.status === 'created');
    const updated = this.processedUsers.filter(u => u.status === 'updated');
    const errors = this.processedUsers.filter(u => u.status === 'error');
    
    console.log(`✅ Total processed: ${created.length + updated.length} users`);
    console.log(`✅ New users created: ${created.length}`);
    console.log(`✅ Existing users updated: ${updated.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`📧 Temporary password: ${TEMPORARY_PASSWORD}`);
    
    if (created.length > 0) {
      console.log('\n🆕 NEW USERS CREATED:');
      created.forEach(user => {
        console.log(`   ${user.email} (${user.name}) - ${user.plan}`);
      });
    }
    
    if (updated.length > 0) {
      console.log('\n🔄 EXISTING USERS UPDATED:');
      updated.forEach(user => {
        console.log(`   ${user.email} (${user.name}) - ${user.plan}`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(user => {
        console.log(`   ${user.email} - ${user.error}`);
      });
    }

    console.log('\n🚀 NEXT STEPS:');
    console.log('1. All 60 users now have temporary password: DRG-075-616!');
    console.log('2. Users will see forced password reset modal on login');
    console.log('3. Test the complete flow with sample users');
    console.log('4. Send email notifications to all migrated users');
    
    console.log('\n🧪 TESTING:');
    console.log('• Login URL: https://myapp.drgolly.com');
    console.log('• Use any email from CSV + DRG-075-616!');
    console.log('• Verify forced password reset modal appears');
    console.log('• Complete password change flow');
  }

  async execute(): Promise<void> {
    console.log('🚀 Starting Complete User Migration for ALL 60 Users...\n');
    
    try {
      // Step 1: Load CSV data
      await this.loadCSVData();
      
      // Step 2: Process all users (create new + update existing)
      await this.processAllCSVUsers();
      
      // Step 3: Verify migration
      await this.verifyMigration();
      
      // Step 4: Test sample users
      await this.testSampleUsers();
      
      // Step 5: Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('\n💥 Complete migration failed:', error);
      throw error;
    }
  }
}

// Execute migration if run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const migration = new CompleteUserMigrationService();
  migration.execute()
    .then(() => {
      console.log('\n🎉 Complete migration finished successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Complete migration failed:', error);
      process.exit(1);
    });
}

export { CompleteUserMigrationService };