import { storage } from "../server/storage";

const featureFlagsData = [
  {
    featureName: "home_tab_access",
    description: "Access to Home tab with blog posts",
    freeAccess: true,
    goldAccess: true,
    platinumAccess: true,
  },
  {
    featureName: "courses_tab_access",
    description: "Access to Courses tab",
    freeAccess: true, // But must pay per course
    goldAccess: true,
    platinumAccess: true,
  },
  {
    featureName: "unlimited_courses",
    description: "Unlimited access to all courses without individual payment",
    freeAccess: false,
    goldAccess: true,
    platinumAccess: true,
  },
  {
    featureName: "growth_tracking_access",
    description: "Access to Growth Tracking features",
    freeAccess: true,
    goldAccess: true,
    platinumAccess: true,
  },
  {
    featureName: "growth_tracking_review",
    description: "Access to Growth Tracking review subpage",
    freeAccess: false, // Locked for free users
    goldAccess: true,
    platinumAccess: true,
  },
  {
    featureName: "discounts_access",
    description: "Access to partner discounts and special offers",
    freeAccess: false, // Locked for free users
    goldAccess: true,
    platinumAccess: true,
  },
  {
    featureName: "family_sharing_access",
    description: "Access to Family Sharing features",
    freeAccess: true,
    goldAccess: true,
    platinumAccess: true,
  },
  {
    featureName: "course_single_purchase",
    description: "Ability to purchase individual courses for $120",
    freeAccess: true,
    goldAccess: false, // Gold users get unlimited access instead
    platinumAccess: false, // Platinum users get unlimited access instead
  },
];

export async function seedFeatureFlags() {
  console.log("Seeding feature flags...");
  
  try {
    for (const flagData of featureFlagsData) {
      // Check if feature flag already exists
      const existingFlag = await storage.getFeatureFlag(flagData.featureName);
      
      if (!existingFlag) {
        await storage.createFeatureFlag(flagData);
        console.log(`✓ Created feature flag: ${flagData.featureName}`);
      } else {
        console.log(`• Feature flag already exists: ${flagData.featureName}`);
      }
    }
    
    console.log("Feature flags seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding feature flags:", error);
    throw error;
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seedFeatureFlags()
    .then(() => {
      console.log("Feature flags seeding finished!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Feature flags seeding failed:", error);
      process.exit(1);
    });
}