import { readFileSync } from 'fs';
import { db } from '../server/db';
import { users, coursePurchases, temporaryPasswords } from '../shared/schema';
import { AuthUtils } from '../server/auth-utils';
import { sql } from 'drizzle-orm';

// Course name mapping for CSV migration
const COURSE_NAME_MAPPING: { [key: string]: number } = {
  "Preparation for Newborns": 10,
  "Little Baby Sleep Program": 5,
  "Big Baby Sleep Program": 6,
  "Pre-Toddler Sleep Program": 7,
  "Toddler Sleep Program": 8,
  "Pre-School Sleep Program": 9,
  "New Sibling Supplement": 11,
  "Twins Supplement": 12,
  "Toddler Toolkit": 13,
};

// Parse course names from CSV and create course purchases
const parseCourseNames = (courseString: string): number[] => {
  if (!courseString || courseString.trim() === '') return [];
  
  const courseNames = courseString.split(',').map(name => name.trim());
  const courseIds: number[] = [];
  
  courseNames.forEach(courseName => {
    const courseId = COURSE_NAME_MAPPING[courseName];
    if (courseId) {
      courseIds.push(courseId);
    } else {
      console.warn(`Unknown course name: ${courseName}`);
    }
  });
  
  return courseIds;
};

// Parse date string to Date object with comprehensive format handling
const parseDate = (dateString: string): Date | null => {
  if (!dateString || dateString.trim() === '') return null;
  
  const trimmed = dateString.trim();
  
  // Handle different date formats commonly found in CSV exports
  const dateFormats = [
    // MM/DD/YYYY format
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // DD/MM/YYYY format 
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // YYYY-MM-DD format
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // ISO format with UTC
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    // Full timestamp format
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC$/,
  ];
  
  try {
    // Try direct parsing first
    let date = new Date(trimmed);
    
    // If direct parsing fails, try manual parsing for specific formats
    if (isNaN(date.getTime())) {
      // Handle MM/DD/YYYY or DD/MM/YYYY formats
      const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        const [, first, second, year] = match;
        // Assume MM/DD/YYYY format (US format)
        date = new Date(parseInt(year), parseInt(first) - 1, parseInt(second));
      }
    }
    
    // Validate the parsed date
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date format: ${trimmed}`);
      return null;
    }
    
    // Check for obviously wrong dates (like year 2028 for child birth date)
    const now = new Date();
    const year = date.getFullYear();
    
    if (year > now.getFullYear() + 1) {
      console.warn(`Future date detected (possibly wrong): ${trimmed} -> ${date.toISOString()}`);
      // Still return the date, as it might be intentional
    }
    
    return date;
  } catch (error) {
    console.warn(`Error parsing date "${trimmed}":`, error);
    return null;
  }
};

// Parse CSV data with comprehensive field mapping
const parseCsvData = (csvContent: string) => {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  console.log('CSV Headers:', headers);
  console.log('Total lines in CSV:', lines.length);
  
  return lines.slice(2).map((line, index) => { // Skip header and description row
    // Handle CSV parsing with proper quote handling for complex fields
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && (i === 0 || line[i-1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else if (char !== '"' || (char === '"' && inQuotes)) {
        currentValue += char;
      }
    }
    values.push(currentValue.trim()); // Add the last value
    
    const user: any = {};
    let skipRow = false;
    
    headers.forEach((header, headerIndex) => {
      const value = values[headerIndex] || '';
      
      // Comprehensive CSV field mapping with all variations
      switch (header.toLowerCase().trim()) {
        case 'email':
          user.email = value;
          break;
        case 'first name':
        case 'firstname':
          user.firstName = value;
          break;
        case 'last name':
        case 'lastname':
          user.lastName = value;
          break;
        case 'first child dob':
        case 'firstchilddob':
          user.firstChildDob = parseDate(value);
          break;
        case 'country':
          user.country = value;
          break;
        case 'user phone number':
        case 'phone':
        case 'phone number':
          user.phone = value;
          break;
        case 'source':
        case 'signup source':
        case 'signupsource':
          user.signupSource = value;
          break;
        case 'migration profile':
        case 'migrationprofile':
          user.migrationProfile = value;
          break;
        case 'choose plan':
        case 'plan':
        case 'subscription tier':
        case 'subscriptiontier':
          user.subscriptionTier = (value || 'free').toLowerCase();
          break;
        case 'count courses':
        case 'countcourses':
          user.countCourses = parseInt(value) || 0;
          break;
        case 'courses purchased':
        case 'coursespurchased':
          user.coursesPurchased = value;
          break;
        case 'sign in count':
        case 'signincount':
          user.signInCount = parseInt(value) || 0;
          break;
        case 'last sign in':
        case 'lastsignin':
          user.lastSignIn = parseDate(value);
          break;
        case 'temporary password':
        case 'temporarypassword':
          user.existingTempPassword = value;
          break;
        case 'account activated in app':
        case 'accountactivated':
          user.accountActivated = value.toLowerCase() === 'y' || value.toLowerCase() === 'yes';
          break;
        default:
          // Store unknown fields for debugging
          if (value) {
            user[header.toLowerCase().replace(/\s+/g, '')] = value;
          }
      }
    });
    
    // Skip empty rows or description rows
    if (!user.email || 
        user.email.toLowerCase().includes('email address') || 
        user.email.toLowerCase().includes('user email') ||
        user.firstName?.toLowerCase().includes('first name') ||
        user.lastName?.toLowerCase().includes('last name')) {
      console.log(`Skipping row ${index + 1}: ${user.email || 'no email'}`);
      return null;
    }
    
    // Validate required fields
    if (!user.email || !user.firstName || !user.lastName) {
      console.warn(`Row ${index + 1}: Missing required fields - email: ${user.email}, firstName: ${user.firstName}, lastName: ${user.lastName}`);
      return null;
    }
    
    // Parse course names and create course ID array
    const courseIds = parseCourseNames(user.coursesPurchased || '');
    
    // Generate unique user ID
    const userId = AuthUtils.generateUserId();
    
    return {
      id: userId,
      email: user.email.toLowerCase().trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      country: user.country,
      phone: user.phone,
      signupSource: user.signupSource || 'App',
      subscriptionTier: user.subscriptionTier || 'free',
      countCourses: user.countCourses || 0,
      coursesPurchasedPreviously: user.coursesPurchased || '',
      signInCount: user.signInCount || 0,
      lastSignIn: user.lastSignIn,
      lastLoginAt: user.lastSignIn, // For MAU tracking
      // New fields from CSV
      firstChildDob: user.firstChildDob,
      accountActivated: false, // Always set to false initially - will be true after first login
      // Generated security fields
      temporaryPassword: AuthUtils.generateTemporaryPassword(),
      isFirstLogin: true,
      hasSetPassword: false,
      migrated: true, // Mark as migrated from other app
      // Metadata
      createdAt: new Date(),
      updatedAt: new Date(),
      // Store course IDs for later processing
      _courseIds: courseIds,
      // Store original CSV row for debugging
      _csvRow: index + 1,
    };
  }).filter(user => user !== null);
};

async function runMigration() {
  try {
    console.log('🚀 Starting 20,000 user migration...');
    const startTime = Date.now();
    
    // Read CSV file
    const csvContent = readFileSync('attached_assets/Replit Database Migration - Sheet1 (1)_1752114292603.csv', 'utf8');
    
    // Parse CSV data with comprehensive validation
    console.log('📊 Parsing CSV data...');
    const processedUsers = parseCsvData(csvContent);
    
    console.log(`✅ Parsed ${processedUsers.length} users from CSV`);
    
    // Validation summary
    const validationSummary = {
      totalUsers: processedUsers.length,
      usersWithFirstChildDob: processedUsers.filter(u => u.firstChildDob).length,
      usersWithPhone: processedUsers.filter(u => u.phone).length,
      usersWithCourses: processedUsers.filter(u => u._courseIds.length > 0).length,
      totalCoursePurchases: processedUsers.reduce((sum, u) => sum + u._courseIds.length, 0),
      subscriptionTiers: {
        free: processedUsers.filter(u => u.subscriptionTier === 'free').length,
        gold: processedUsers.filter(u => u.subscriptionTier === 'gold').length,
        platinum: processedUsers.filter(u => u.subscriptionTier === 'platinum').length,
      },
      signupSources: processedUsers.reduce((acc, u) => {
        acc[u.signupSource] = (acc[u.signupSource] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
    
    console.log('📋 Validation Summary:');
    console.table(validationSummary);
    
    // Check for duplicate emails
    const emailCounts = processedUsers.reduce((acc, u) => {
      acc[u.email] = (acc[u.email] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const duplicateEmails = Object.entries(emailCounts).filter(([_, count]) => count > 1);
    if (duplicateEmails.length > 0) {
      console.warn(`⚠️  Found ${duplicateEmails.length} duplicate emails:`, duplicateEmails);
    }
    
    // Create users in bulk (optimized for 20,000 users)
    console.log('👥 Creating users in database...');
    const userResults: any[] = [];
    const batchSize = 500;
    
    for (let i = 0; i < processedUsers.length; i += batchSize) {
      const batch = processedUsers.slice(i, i + batchSize);
      const batchStartTime = Date.now();
      
      try {
        // Use onConflictDoUpdate for upsert behavior in case of duplicates
        const batchResults = await db.insert(users)
          .values(batch)
          .onConflictDoUpdate({
            target: users.email,
            set: {
              firstName: sql`EXCLUDED.first_name`,
              lastName: sql`EXCLUDED.last_name`,
              country: sql`EXCLUDED.country`,
              phone: sql`EXCLUDED.phone`,
              subscriptionTier: sql`EXCLUDED.subscription_tier`,
              migrated: sql`EXCLUDED.migrated`,
              firstChildDob: sql`EXCLUDED.first_child_dob`,
              accountActivated: sql`EXCLUDED.account_activated`,
              updatedAt: new Date(),
            },
          })
          .returning();
        
        userResults.push(...batchResults);
        
        const processingTime = Date.now() - batchStartTime;
        console.log(`✅ Processed user batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(processedUsers.length/batchSize)} (${batch.length} users) in ${processingTime}ms`);
        
        // Small delay between batches to prevent overwhelming the database
        if (i + batchSize < processedUsers.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.error(`❌ Error processing user batch ${Math.floor(i/batchSize) + 1}:`, error);
        throw error;
      }
    }
    
    console.log(`✅ Created ${userResults.length} users successfully`);
    
    // Create temporary password records
    console.log('🔐 Creating temporary passwords...');
    const tempPasswordBatchSize = 100;
    for (let i = 0; i < processedUsers.length; i += tempPasswordBatchSize) {
      const batch = processedUsers.slice(i, i + tempPasswordBatchSize);
      await Promise.all(
        batch.map(user => 
          db.insert(temporaryPasswords).values({
            userId: user.id,
            tempPassword: AuthUtils.hashTemporaryPassword(user.temporaryPassword),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            isUsed: false,
            createdAt: new Date(),
          })
        )
      );
      
      console.log(`✅ Created temp passwords for batch ${Math.floor(i/tempPasswordBatchSize) + 1}/${Math.ceil(processedUsers.length/tempPasswordBatchSize)}`);
    }
    
    // Create course purchases for users with purchased courses
    console.log('📚 Creating course purchases...');
    const coursePurchasesData: any[] = [];
    
    processedUsers.forEach(user => {
      if (user._courseIds && user._courseIds.length > 0) {
        user._courseIds.forEach(courseId => {
          coursePurchasesData.push({
            userId: user.id,
            courseId: courseId,
            purchaseDate: user.createdAt,
            status: 'completed',
            migrated: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        });
      }
    });
    
    // Create course purchases in batches
    if (coursePurchasesData.length > 0) {
      const coursePurchaseBatchSize = 200;
      for (let i = 0; i < coursePurchasesData.length; i += coursePurchaseBatchSize) {
        const batch = coursePurchasesData.slice(i, i + coursePurchaseBatchSize);
        await db.insert(coursePurchases).values(batch);
        
        console.log(`✅ Created course purchase batch ${Math.floor(i/coursePurchaseBatchSize) + 1}/${Math.ceil(coursePurchasesData.length/coursePurchaseBatchSize)}`);
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Migration Summary:`);
    console.log(`   • Users created: ${userResults.length}`);
    console.log(`   • Course purchases created: ${coursePurchasesData.length}`);
    console.log(`   • Total processing time: ${Math.round(totalTime/1000)} seconds`);
    console.log(`   • Average processing speed: ${Math.round(processedUsers.length / (totalTime/1000))} users/second`);
    
    // Output sample credentials for testing
    console.log('\n📝 Sample credentials for testing:');
    const sampleCredentials = processedUsers.slice(0, 10).map(u => ({
      email: u.email,
      temporaryPassword: u.temporaryPassword,
      firstName: u.firstName,
      lastName: u.lastName,
      courses: u._courseIds.length,
    }));
    
    console.table(sampleCredentials);
    
    // Additional migration statistics
    console.log('\n📊 Detailed Migration Statistics:');
    console.log(`   • Users with first child DOB: ${processedUsers.filter(u => u.firstChildDob).length}`);
    console.log(`   • Users with phone numbers: ${processedUsers.filter(u => u.phone).length}`);
    console.log(`   • Users with previous sign-ins: ${processedUsers.filter(u => u.signInCount > 0).length}`);
    console.log(`   • Users never signed in: ${processedUsers.filter(u => u.signInCount === 0).length}`);
    console.log(`   • Average courses per user: ${Math.round(coursePurchasesData.length / processedUsers.length * 100) / 100}`);
    console.log(`   • Most active user: ${Math.max(...processedUsers.map(u => u.signInCount))} sign-ins`);
    
    // Export credentials to CSV for secure distribution
    const credentialsCSV = 'email,temporaryPassword,firstName,lastName,accountActivated\n' + 
      processedUsers.map(u => 
        `${u.email},${u.temporaryPassword},${u.firstName},${u.lastName},${u.accountActivated}`
      ).join('\n');
    
    try {
      const fs = require('fs');
      fs.writeFileSync('migration-credentials.csv', credentialsCSV);
      console.log('💾 Credentials exported to migration-credentials.csv');
    } catch (error) {
      console.warn('⚠️  Could not export credentials file:', error);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration().then(() => {
  console.log('✅ Migration script completed');
  process.exit(0);
});