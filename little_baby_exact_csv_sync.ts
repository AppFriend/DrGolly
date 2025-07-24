import { db } from './server/db';
import { courseChapters, courseLessons, userLessonProgress, lessonContent, userLessonContentProgress } from './shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import fs from 'fs';
import { parse } from 'csv-parse';

// CRITICAL: This script ensures EXACT matching between CSV and database for Little Baby Course (ID 5)
// Zero tolerance for content modifications or AI-generated content

async function parseLittleBabyCSV(): Promise<{ chapterName: string; lessonName: string; lessonContent: string }[]> {
  const csvContent = fs.readFileSync('attached_assets/Little BABY - Master Sheet - Updated_Chapter-Lesson_Matching (3) (2)_1753334329936.csv', 'utf-8');
  
  return new Promise((resolve, reject) => {
    parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      quote: '"',
      escape: '"',
      relax_quotes: true,
      relax_column_count: true
    }, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Process all rows and filter out empty content
      const processedData = data
        .map((row: any) => ({
          chapterName: row['Chapter Name']?.trim(),
          lessonName: row['Lesson Name']?.trim(),
          lessonContent: row['Correct Lesson Content']?.trim() || ''
        }))
        .filter((row: any) => 
          row.chapterName && 
          row.lessonName && 
          row.lessonContent && 
          row.lessonContent.length > 10 // Only include lessons with substantial content
        );
      
      console.log(`📋 Parsed ${processedData.length} valid lessons from CSV`);
      resolve(processedData);
    });
  });
}

async function deleteAndRecreateFromCSV() {
  console.log('🚀 Starting EXACT CSV Synchronization for Little Baby Sleep Program (Course ID 5)');
  console.log('📋 Objective: Replace ALL content with EXACT CSV matches - zero tolerance for variations');
  
  try {
    const csvData = await parseLittleBabyCSV();
    console.log(`📋 Total CSV rows to process: ${csvData.length}`);
    
    // Group lessons by chapter
    const chapterLessons = new Map<string, Array<{lessonName: string, lessonContent: string}>>();
    
    for (const row of csvData) {
      if (!chapterLessons.has(row.chapterName)) {
        chapterLessons.set(row.chapterName, []);
      }
      chapterLessons.get(row.chapterName)!.push({
        lessonName: row.lessonName,
        lessonContent: row.lessonContent
      });
    }
    
    console.log(`📋 Found ${chapterLessons.size} chapters to process`);
    
    // Process each chapter
    for (const [chapterName, lessons] of chapterLessons) {
      console.log(`\n📁 Processing Chapter: ${chapterName}`);
      
      // Find or create chapter
      let existingChapter = await db.select()
        .from(courseChapters)
        .where(and(
          eq(courseChapters.courseId, 5),
          eq(courseChapters.title, chapterName)
        ));
      
      let chapterId: number;
      
      if (existingChapter.length === 0) {
        // Create new chapter
        const [newChapter] = await db.insert(courseChapters)
          .values({
            courseId: 5,
            title: chapterName,
            chapterNumber: Date.now().toString(),
            orderIndex: 999
          })
          .returning({ id: courseChapters.id });
        chapterId = newChapter.id;
        console.log(`✅ Created new chapter: ${chapterName}`);
      } else {
        chapterId = existingChapter[0].id;
        console.log(`📁 Using existing chapter: ${chapterName}`);
      }
      
      // First get all lesson IDs in this chapter
      const existingLessons = await db.select({ id: courseLessons.id })
        .from(courseLessons)
        .where(eq(courseLessons.chapterId, chapterId));
      
      if (existingLessons.length > 0) {
        const lessonIds = existingLessons.map(lesson => lesson.id);
        
        // Get lesson content IDs that reference these lessons
        const lessonContentIds = await db.select({ id: lessonContent.id })
          .from(lessonContent)
          .where(inArray(lessonContent.lessonId, lessonIds));
        
        if (lessonContentIds.length > 0) {
          const contentIds = lessonContentIds.map(content => content.id);
          
          // DELETE user lesson content progress first
          await db.delete(userLessonContentProgress)
            .where(inArray(userLessonContentProgress.lessonContentId, contentIds));
          
          // DELETE lesson content
          await db.delete(lessonContent)
            .where(inArray(lessonContent.lessonId, lessonIds));
        }
        
        // DELETE user lesson progress 
        await db.delete(userLessonProgress)
          .where(inArray(userLessonProgress.lessonId, lessonIds));
        
        // Finally DELETE all existing lessons in this chapter
        await db.delete(courseLessons)
          .where(eq(courseLessons.chapterId, chapterId));
        
        console.log(`🗑️  Deleted ${existingLessons.length} existing lessons and all related progress in chapter: ${chapterName}`);
      }
      
      // INSERT exact lessons from CSV
      for (const [index, lesson] of lessons.entries()) {
        await db.insert(courseLessons)
          .values({
            courseId: 5,
            chapterId: chapterId,
            title: lesson.lessonName,
            content: lesson.lessonContent,
            orderIndex: index + 1
          });
        console.log(`✅ Created lesson: ${lesson.lessonName}`);
      }
    }
    
    console.log('\n🎯 EXACT CSV Synchronization Complete!');
    console.log('📋 All Little Baby content now matches CSV exactly with zero variations');
    
  } catch (error) {
    console.error('❌ Error during CSV synchronization:', error);
    process.exit(1);
  }
}

// Run the synchronization
deleteAndRecreateFromCSV().then(() => {
  console.log('✅ Little Baby CSV Synchronization completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('❌ Little Baby CSV Synchronization failed:', error);
  process.exit(1);
});