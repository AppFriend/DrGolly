import { db } from '../server/db';
import { courseChapters, courseModules } from '../shared/schema';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

/**
 * Rebuild course structure from CSV data
 */
export async function rebuildCourseStructure() {
  console.log("Rebuilding course structure from CSV...");
  
  try {
    // Course name mapping from CSV to database
    const COURSE_NAME_MAPPING: { [key: string]: number } = {
      'Preparation for Newborns': 10,
      'Little Baby Sleep Program': 5,
      'Big Baby Sleep Program': 6,
      'Pre-Toddler Sleep Program': 7,
      'Toddler Sleep Program': 8,
      'Pre-School Sleep Program': 9,
      'New Sibling Supplement': 11,
      'Twins Supplement': 12,
      'Toddler Toolkit': 13,
      'Testing Allergens': 14
    };

    // Read and parse CSV
    const csvContent = readFileSync('attached_assets/Courses & Modules - export_All-Modules_2025-07-11_00-03-21_1752197285874.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Parsed ${records.length} CSV records`);

    // Group by course and chapter
    const courseStructure: { [courseId: number]: { [chapterNumber: string]: string[] } } = {};

    for (const record of records) {
      const courseName = record['Post Course']?.trim();
      const moduleName = record['Name']?.trim();
      
      if (!courseName || !moduleName) continue;

      const courseId = COURSE_NAME_MAPPING[courseName];
      if (!courseId) {
        console.log(`Skipping unknown course: ${courseName}`);
        continue;
      }

      // Extract chapter number from module name
      let chapterNumber = '0.0'; // Default for welcome modules
      let cleanModuleName = moduleName;

      // Match patterns like "1.1 Sleep Environment" or "0.0 Welcome"
      const chapterMatch = moduleName.match(/^(\d+\.\d+)\s+(.+)$/);
      if (chapterMatch) {
        chapterNumber = chapterMatch[1];
        cleanModuleName = chapterMatch[2];
      }

      if (!courseStructure[courseId]) {
        courseStructure[courseId] = {};
      }
      if (!courseStructure[courseId][chapterNumber]) {
        courseStructure[courseId][chapterNumber] = [];
      }

      courseStructure[courseId][chapterNumber].push(cleanModuleName);
    }

    // Create chapters and modules in database
    let chapterCount = 0;
    let moduleCount = 0;

    for (const [courseId, chapters] of Object.entries(courseStructure)) {
      console.log(`\nProcessing course ID ${courseId}:`);
      
      const sortedChapters = Object.keys(chapters).sort((a, b) => {
        const [aMajor, aMinor] = a.split('.').map(Number);
        const [bMajor, bMinor] = b.split('.').map(Number);
        return aMajor - bMajor || aMinor - bMinor;
      });

      for (let i = 0; i < sortedChapters.length; i++) {
        const chapterNumber = sortedChapters[i];
        const modules = chapters[chapterNumber];
        
        // Create chapter title - use the actual first module title with chapter number
        let chapterTitle = chapterNumber === '0.0' 
          ? modules[0] // Use first module name for welcome
          : `${chapterNumber} ${modules[0]}`; // Use "1.1 What is Normal?" format

        // Insert chapter
        const [chapter] = await db.insert(courseChapters).values({
          courseId: parseInt(courseId),
          title: chapterTitle,
          chapterNumber: chapterNumber,
          orderIndex: i
        }).returning();

        chapterCount++;
        console.log(`  Created chapter: ${chapterTitle} (${chapterNumber})`);

        // Insert modules for this chapter
        for (let j = 0; j < modules.length; j++) {
          const moduleName = modules[j];
          
          await db.insert(courseModules).values({
            courseId: parseInt(courseId),
            chapterId: chapter.id,
            title: moduleName,
            contentType: 'text',
            orderIndex: j
          });

          moduleCount++;
          console.log(`    - Module: ${moduleName}`);
        }
      }
    }

    console.log(`\nSuccessfully created:`);
    console.log(`- ${chapterCount} chapters`);
    console.log(`- ${moduleCount} modules`);
    console.log(`- Across ${Object.keys(courseStructure).length} courses`);

  } catch (error) {
    console.error("Error rebuilding course structure:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  rebuildCourseStructure()
    .then(() => {
      console.log("Rebuild completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Rebuild failed:", error);
      process.exit(1);
    });
}