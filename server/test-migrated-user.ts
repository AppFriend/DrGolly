// Test script to create a migrated user with temporary password
import { db } from './db';
import { users, temporaryPasswords } from '../shared/schema';
import { AuthUtils } from './auth-utils';

async function createTestMigratedUser() {
  const testUserId = `migrated_user_${Date.now()}`;
  const testEmail = "testuser@example.com";
  const tempPassword = "temp123456";
  
  try {
    // Create user record (migrated user)
    const [user] = await db.insert(users).values({
      id: testUserId,
      email: testEmail,
      firstName: "Test",
      lastName: "User",
      migrated: true,
      hasSetPassword: false,
      isFirstLogin: true,
      passwordSet: "no",
      subscriptionTier: "free",
      subscriptionStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Create temporary password record
    const [tempPasswordRecord] = await db.insert(temporaryPasswords).values({
      userId: testUserId,
      tempPassword: tempPassword,
      isUsed: false,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      createdAt: new Date(),
    }).returning();

    console.log("Test migrated user created successfully:");
    console.log(`Email: ${testEmail}`);
    console.log(`Temporary Password: ${tempPassword}`);
    console.log(`User ID: ${testUserId}`);
    console.log(`Password Set: ${user.passwordSet}`);
    console.log(`Has Set Password: ${user.hasSetPassword}`);
    console.log(`Is First Login: ${user.isFirstLogin}`);
    console.log(`Migrated: ${user.migrated}`);
    
    return { user, tempPassword };
  } catch (error) {
    console.error("Error creating test migrated user:", error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  createTestMigratedUser()
    .then(() => {
      console.log("Test user creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Test user creation failed:", error);
      process.exit(1);
    });
}

export { createTestMigratedUser };