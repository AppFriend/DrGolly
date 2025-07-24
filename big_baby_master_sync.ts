import { parse } from 'csv-parse/sync';
import fs from 'fs';
import { db } from "./server/db";
import { courses, courseChapters, courseLessons } from "./shared/schema";
import { eq, and } from "drizzle-orm";

interface CSVRow {
  'Chapter Name': string;
  'Lesson Name': string;
  'Lesson Content': string;
}

async function updateBigBabyCourseFromMaster() {
  console.log('🚀 Starting Big Baby Course Master Spreadsheet Update');
  console.log('📋 Objective: Add content from row 70 onward while preserving rows 1-69');
  
  try {
    // Read and parse CSV
    const csvContent = fs.readFileSync('attached_assets/Big Baby - Master Sheet - Final_Matched_Chapter_and_Lesson_Content (2)_1753331891291.csv', 'utf-8');
    const records: CSVRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`📋 Total CSV rows: ${records.length}`);
    
    // Process only from row 70 onward (index 69 since arrays are 0-based)
    const newContent = records.slice(69);
    console.log(`📋 Processing ${newContent.length} new rows (starting from row 70)`);
    
    let processedCount = 0;
    let updatedCount = 0;
    let createdCount = 0;
    
    for (const row of newContent) {
      if (!row['Chapter Name'] || !row['Lesson Name']) {
        console.log(`⚠️  Skipping row with missing chapter/lesson name`);
        continue;
      }
      
      const chapterName = row['Chapter Name'].trim();
      const lessonName = row['Lesson Name'].trim();
      const lessonContent = row['Lesson Content']?.trim() || '';
      
      if (!lessonContent) {
        console.log(`⚠️  Skipping ${chapterName} -> ${lessonName} (no content)`);
        continue;
      }
      
      console.log(`\n📁 Processing: ${chapterName} -> ${lessonName}`);
      
      try {
        // Find or create chapter in Big Baby course (course ID = 15)
        const chapterId = await findOrCreateChapter(chapterName);
        
        // Find or create lesson
        const result = await findOrCreateLesson(chapterId, lessonName, lessonContent);
        
        if (result.created) {
          createdCount++;
          console.log(`✅ Created lesson: ${lessonName}`);
        } else if (result.updated) {
          updatedCount++;
          console.log(`📝 Updated lesson: ${lessonName}`);
        } else {
          console.log(`ℹ️  Lesson already exists with matching content: ${lessonName}`);
        }
        
        processedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing ${chapterName} -> ${lessonName}:`, error);
      }
    }
    
    console.log(`\n📊 Big Baby Master Update Results:`);
    console.log(`   Processed: ${processedCount} lessons`);
    console.log(`   Created: ${createdCount} new lessons`);
    console.log(`   Updated: ${updatedCount} existing lessons`);
    console.log(`\n🎯 Big Baby Course update complete!`);
    console.log(`📋 Database updated with authentic content from master spreadsheet`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

async function findOrCreateChapter(chapterName: string): Promise<number> {
  // Look for existing chapter in Big Baby course (courseId = 15)
  const existingChapter = await db.select()
    .from(courseChapters)
    .where(and(
      eq(courseChapters.courseId, 15),
      eq(courseChapters.title, chapterName)
    ));
  
  if (existingChapter.length > 0) {
    return existingChapter[0].id;
  }
  
  // Create new chapter
  const [newChapter] = await db.insert(courseChapters)
    .values({
      courseId: 15,
      title: chapterName,
      chapterNumber: Date.now().toString(), // Temporary, will be updated with proper numbering
      orderIndex: 999 // Temporary, will be updated with proper ordering
    })
    .returning({ id: courseChapters.id });
  
  return newChapter.id;
}

async function findOrCreateLesson(chapterId: number, lessonName: string, lessonContent: string): Promise<{created: boolean, updated: boolean}> {
  // Look for existing lesson
  const existingLesson = await db.select()
    .from(courseLessons)
    .where(and(
      eq(courseLessons.chapterId, chapterId),
      eq(courseLessons.title, lessonName)
    ));
  
  if (existingLesson.length > 0) {
    // Check if content needs updating
    const currentContent = existingLesson[0].content || '';
    if (currentContent !== lessonContent) {
      // Update content
      await db.update(courseLessons)
        .set({ content: lessonContent })
        .where(eq(courseLessons.id, existingLesson[0].id));
      
      return { created: false, updated: true };
    }
    
    return { created: false, updated: false };
  }
  
  // Create new lesson
  await db.insert(courseLessons)
    .values({
      courseId: 15,
      chapterId: chapterId,
      title: lessonName,
      content: lessonContent,
      orderIndex: 999 // Temporary, will be updated with proper ordering
    });
  
  return { created: true, updated: false };
}

// Run the update
updateBigBabyCourseFromMaster();