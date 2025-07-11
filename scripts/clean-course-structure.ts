import { db } from '../server/db';
import { courseChapters, courseModules } from '../shared/schema';

/**
 * Clean course structure - remove all chapters and modules
 */
export async function cleanCourseStructure() {
  console.log("Cleaning course structure...");
  
  try {
    // Delete all modules first (due to foreign key constraints)
    await db.delete(courseModules);
    console.log("Deleted all course modules");
    
    // Delete all chapters
    await db.delete(courseChapters);
    console.log("Deleted all course chapters");
    
    console.log("Course structure cleaned successfully");
  } catch (error) {
    console.error("Error cleaning course structure:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanCourseStructure()
    .then(() => {
      console.log("Cleanup completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Cleanup failed:", error);
      process.exit(1);
    });
}