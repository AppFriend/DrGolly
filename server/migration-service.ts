import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from './db';
import { users, migrationSnapshots, migrationAuditLog } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Temporary password for CSV cohort migration
const TEMP_PASSWORD = 'DRG-075-616!';
const MIGRATION_COHORT = '2025-08-09-csv';
const CSV_FILE_PATH = path.join(process.cwd(), 'attached_assets', 'migration_csv.csv');

// CSV row schema
const csvRowSchema = z.object({
  'Customer Name': z.string(),
  'Customer Email': z.string().email(),
  'Stripe_Customer_ID': z.string(),
  'Signup Date': z.string(),
});

type CsvRow = z.infer<typeof csvRowSchema>;

interface ProcessedCsvRecord {
  customerName: string;
  customerEmail: string;
  stripeCustomerId: string;
  signupDate: string;
  normalizedEmail: string;
  normalizedName: string;
}

interface MatchResult {
  record: ProcessedCsvRecord;
  matchType: 'MATCH_EMAIL' | 'MATCH_NAME_UNIQUE' | 'NAME_AMBIGUOUS' | 'NO_MATCH';
  existingUser?: any;
  intendedAction: 'UPDATE_EXISTING' | 'CREATE_NEW';
  errors?: string[];
}

interface MigrationReport {
  totalRecords: number;
  successful: number;
  errored: number;
  results: MatchResult[];
  duplicatesRemoved: number;
  summary: string;
}

export class MigrationService {
  private cohortEmails: Set<string> = new Set();
  private recordsByEmail: Map<string, ProcessedCsvRecord> = new Map();

  constructor() {}

  // Feature flag check
  private async isFeatureFlagEnabled(): Promise<boolean> {
    // Check for feature flag in environment or database
    return process.env.MIGRATION_CSV_2025_08_09_ENABLED === 'true';
  }

  // Normalize email for matching
  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  // Normalize name for matching
  private normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  // Parse and validate CSV file
  private async parseCsvFile(): Promise<ProcessedCsvRecord[]> {
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`CSV file not found: ${CSV_FILE_PATH}`);
    }

    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    const records: CsvRow[] = [];

    return new Promise((resolve, reject) => {
      parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          // Validate and process records
          const processedRecords: ProcessedCsvRecord[] = [];
          const seenEmails = new Set<string>();
          let duplicatesRemoved = 0;

          for (const row of data) {
            const validatedRow = csvRowSchema.parse(row);
            const normalizedEmail = this.normalizeEmail(validatedRow['Customer Email']);
            
            // Remove exact duplicate emails (keep first occurrence)
            if (seenEmails.has(normalizedEmail)) {
              duplicatesRemoved++;
              console.log(`Duplicate email removed: ${normalizedEmail}`);
              continue;
            }
            
            seenEmails.add(normalizedEmail);
            
            const processedRecord: ProcessedCsvRecord = {
              customerName: validatedRow['Customer Name'],
              customerEmail: validatedRow['Customer Email'],
              stripeCustomerId: validatedRow['Stripe_Customer_ID'],
              signupDate: validatedRow['Signup Date'],
              normalizedEmail,
              normalizedName: this.normalizeName(validatedRow['Customer Name']),
            };

            processedRecords.push(processedRecord);
            this.cohortEmails.add(normalizedEmail);
            this.recordsByEmail.set(normalizedEmail, processedRecord);
          }

          console.log(`Processed ${processedRecords.length} records, removed ${duplicatesRemoved} duplicates`);
          resolve(processedRecords);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  // Check if email is in CSV cohort
  public isInCohort(email: string): boolean {
    return this.cohortEmails.has(this.normalizeEmail(email));
  }

  // Find existing user by email
  private async findUserByEmail(email: string): Promise<any> {
    const normalizedEmail = this.normalizeEmail(email);
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));
    return user;
  }

  // Find existing users by name
  private async findUsersByName(name: string): Promise<any[]> {
    const normalizedName = this.normalizeName(name);
    // Construct full name from firstName and lastName
    const usersFound = await db.select().from(users).where(
      eq(
        sql`LOWER(TRIM(CONCAT(COALESCE(${users.firstName}, ''), ' ', COALESCE(${users.lastName}, ''))))`,
        normalizedName
      )
    );
    return usersFound;
  }

  // Perform dry run analysis
  public async dryRun(): Promise<MigrationReport> {
    if (!await this.isFeatureFlagEnabled()) {
      throw new Error('Migration feature flag is not enabled');
    }

    const records = await this.parseCsvFile();
    const results: MatchResult[] = [];

    for (const record of records) {
      try {
        // Attempt email match first
        const emailMatch = await this.findUserByEmail(record.normalizedEmail);
        
        if (emailMatch) {
          results.push({
            record,
            matchType: 'MATCH_EMAIL',
            existingUser: emailMatch,
            intendedAction: 'UPDATE_EXISTING',
          });
          continue;
        }

        // If no email match, try name match
        const nameMatches = await this.findUsersByName(record.normalizedName);
        
        if (nameMatches.length === 1) {
          results.push({
            record,
            matchType: 'MATCH_NAME_UNIQUE',
            existingUser: nameMatches[0],
            intendedAction: 'UPDATE_EXISTING',
          });
        } else if (nameMatches.length > 1) {
          results.push({
            record,
            matchType: 'NAME_AMBIGUOUS',
            intendedAction: 'CREATE_NEW',
            errors: [`Multiple users found with name: ${record.customerName}`],
          });
        } else {
          results.push({
            record,
            matchType: 'NO_MATCH',
            intendedAction: 'CREATE_NEW',
          });
        }
      } catch (error) {
        results.push({
          record,
          matchType: 'NO_MATCH',
          intendedAction: 'CREATE_NEW',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        });
      }
    }

    const report: MigrationReport = {
      totalRecords: records.length,
      successful: results.filter(r => !r.errors?.length).length,
      errored: results.filter(r => r.errors?.length).length,
      results,
      duplicatesRemoved: records.length - this.cohortEmails.size,
      summary: `Dry run completed: ${results.length} records analyzed`,
    };

    // Log dry run to audit table
    await db.insert(migrationAuditLog).values({
      cohort: MIGRATION_COHORT,
      action: 'dry_run',
      recordsProcessed: records.length,
      recordsSuccessful: report.successful,
      recordsErrored: report.errored,
      executedBy: 'system',
      summary: report,
    });

    return report;
  }

  // Create snapshot for rollback protection
  private async createSnapshot(userId: string, userData: any): Promise<void> {
    await db.insert(migrationSnapshots).values({
      userId,
      cohort: MIGRATION_COHORT,
      preSnapshot: userData,
    });
  }

  // Hash the temporary password
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Execute migration for a single user
  private async migrateUser(result: MatchResult): Promise<void> {
    const { record, intendedAction, existingUser } = result;
    
    // Cohort guard - ensure email is in CSV
    if (!this.isInCohort(record.normalizedEmail)) {
      throw new Error(`Email not in cohort: ${record.normalizedEmail}`);
    }

    const hashedPassword = await this.hashPassword(TEMP_PASSWORD);

    if (intendedAction === 'UPDATE_EXISTING' && existingUser) {
      // Create snapshot before update
      await this.createSnapshot(existingUser.id, existingUser);

      // Update existing user
      await db.update(users)
        .set({
          stripeCustomerId: record.stripeCustomerId,
          mustResetPassword: true,
          passwordHash: hashedPassword,
          migrationCohort: MIGRATION_COHORT,
          migrationSourceFile: 'migration_csv.csv',
          passwordLastSetAt: new Date(),
          passwordSetMethod: 'temp_migration_password',
        })
        .where(eq(users.id, existingUser.id));

    } else if (intendedAction === 'CREATE_NEW') {
      // Create new user
      const newUserId = nanoid();
      const [firstName, ...lastNameParts] = record.customerName.split(' ');
      const lastName = lastNameParts.join(' ');

      await db.insert(users).values({
        id: newUserId,
        email: record.normalizedEmail,
        firstName: firstName || record.customerName,
        lastName: lastName || null,
        stripeCustomerId: record.stripeCustomerId,
        mustResetPassword: true,
        passwordHash: hashedPassword,
        migrationCohort: MIGRATION_COHORT,
        migrationSourceFile: 'migration_csv.csv',
        passwordLastSetAt: new Date(),
        passwordSetMethod: 'temp_migration_password',
        subscriptionTier: 'free',
        isFirstLogin: true,
        hasSetPassword: false,
      });
    }
  }

  // Test run with 3 specific users
  public async testRun(): Promise<MigrationReport> {
    if (!await this.isFeatureFlagEnabled()) {
      throw new Error('Migration feature flag is not enabled');
    }

    const records = await this.parseCsvFile();
    
    // Select 3 test cases based on matching criteria
    const emailMatchRecord = records.find(r => r.normalizedEmail.includes('final.gold.coupon'));
    const nameMatchRecord = records.find(r => r.customerName.includes('Frazer Adnam'));
    const noMatchRecord = records.find(r => r.normalizedEmail.includes('test.com'));

    const testRecords = [emailMatchRecord, nameMatchRecord, noMatchRecord].filter(Boolean);
    
    if (testRecords.length < 3) {
      throw new Error('Could not find 3 suitable test records');
    }

    const results: MatchResult[] = [];

    for (const record of testRecords) {
      try {
        // First determine match type
        const emailMatch = await this.findUserByEmail(record.normalizedEmail);
        let matchResult: MatchResult;

        if (emailMatch) {
          matchResult = {
            record,
            matchType: 'MATCH_EMAIL',
            existingUser: emailMatch,
            intendedAction: 'UPDATE_EXISTING',
          };
        } else {
          const nameMatches = await this.findUsersByName(record.normalizedName);
          if (nameMatches.length === 1) {
            matchResult = {
              record,
              matchType: 'MATCH_NAME_UNIQUE',
              existingUser: nameMatches[0],
              intendedAction: 'UPDATE_EXISTING',
            };
          } else {
            matchResult = {
              record,
              matchType: 'NO_MATCH',
              intendedAction: 'CREATE_NEW',
            };
          }
        }

        // Execute the migration
        await this.migrateUser(matchResult);
        results.push(matchResult);

      } catch (error) {
        results.push({
          record,
          matchType: 'NO_MATCH',
          intendedAction: 'CREATE_NEW',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        });
      }
    }

    const report: MigrationReport = {
      totalRecords: testRecords.length,
      successful: results.filter(r => !r.errors?.length).length,
      errored: results.filter(r => r.errors?.length).length,
      results,
      duplicatesRemoved: 0,
      summary: `Test run completed: ${testRecords.length} records processed`,
    };

    // Log test run to audit table
    await db.insert(migrationAuditLog).values({
      cohort: MIGRATION_COHORT,
      action: 'test_run',
      recordsProcessed: testRecords.length,
      recordsSuccessful: report.successful,
      recordsErrored: report.errored,
      executedBy: 'system',
      summary: report,
    });

    return report;
  }

  // Execute full migration
  public async executeFullMigration(): Promise<MigrationReport> {
    if (!await this.isFeatureFlagEnabled()) {
      throw new Error('Migration feature flag is not enabled');
    }

    const records = await this.parseCsvFile();
    const results: MatchResult[] = [];

    for (const record of records) {
      try {
        // Determine match type
        const emailMatch = await this.findUserByEmail(record.normalizedEmail);
        let matchResult: MatchResult;

        if (emailMatch) {
          matchResult = {
            record,
            matchType: 'MATCH_EMAIL',
            existingUser: emailMatch,
            intendedAction: 'UPDATE_EXISTING',
          };
        } else {
          const nameMatches = await this.findUsersByName(record.normalizedName);
          if (nameMatches.length === 1) {
            matchResult = {
              record,
              matchType: 'MATCH_NAME_UNIQUE',
              existingUser: nameMatches[0],
              intendedAction: 'UPDATE_EXISTING',
            };
          } else {
            matchResult = {
              record,
              matchType: 'NO_MATCH',
              intendedAction: 'CREATE_NEW',
            };
          }
        }

        // Execute the migration
        await this.migrateUser(matchResult);
        results.push(matchResult);

      } catch (error) {
        results.push({
          record,
          matchType: 'NO_MATCH',
          intendedAction: 'CREATE_NEW',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        });
      }
    }

    const report: MigrationReport = {
      totalRecords: records.length,
      successful: results.filter(r => !r.errors?.length).length,
      errored: results.filter(r => r.errors?.length).length,
      results,
      duplicatesRemoved: 0,
      summary: `Full migration completed: ${records.length} records processed`,
    };

    // Log execution to audit table
    await db.insert(migrationAuditLog).values({
      cohort: MIGRATION_COHORT,
      action: 'execute',
      recordsProcessed: records.length,
      recordsSuccessful: report.successful,
      recordsErrored: report.errored,
      executedBy: 'system',
      summary: report,
    });

    return report;
  }

  // Verify user can login with temporary password
  public async verifyTempPasswordLogin(email: string, password: string): Promise<boolean> {
    if (!this.isInCohort(email)) {
      return false;
    }

    const user = await this.findUserByEmail(email);
    if (!user || !user.passwordHash) {
      return false;
    }

    return bcrypt.compare(password, user.passwordHash);
  }

  // Handle password reset completion for CSV users
  public async completePasswordReset(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);
    
    await db.update(users)
      .set({
        passwordHash: hashedPassword,
        mustResetPassword: false,
        passwordLastSetAt: new Date(),
        passwordSetMethod: 'forced-migration-reset',
        hasSetPassword: true,
        isFirstLogin: false,
      })
      .where(eq(users.id, userId));

    // TODO: Track "Migration Complete" event
    console.log(`Password reset completed for user: ${userId}`);
  }

  // Rollback functionality for single user
  public async rollbackUser(userId: string): Promise<void> {
    const [snapshot] = await db.select()
      .from(migrationSnapshots)
      .where(and(
        eq(migrationSnapshots.userId, userId),
        eq(migrationSnapshots.cohort, MIGRATION_COHORT)
      ));

    if (!snapshot) {
      throw new Error(`No snapshot found for user: ${userId}`);
    }

    const originalData = snapshot.preSnapshot as any;
    
    await db.update(users)
      .set({
        mustResetPassword: originalData.mustResetPassword || false,
        stripeCustomerId: originalData.stripeCustomerId || null,
        migrationCohort: null,
        migrationSourceFile: null,
        passwordHash: originalData.passwordHash || null,
      })
      .where(eq(users.id, userId));
  }
}

export const migrationService = new MigrationService();