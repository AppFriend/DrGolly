import { db } from './server/db';
import { courseChapters, courseLessons } from './shared/schema';
import { eq, and } from 'drizzle-orm';
import fs from 'fs';
import { parse } from 'csv-parse';

// CRITICAL: This script ensures EXACT matching between CSV and database
// Zero tolerance for content modifications or AI-generated content

async function parseBigBabyCSV(): Promise<{ chapterName: string; lessonName: string; lessonContent: string }[]> {
  const csvContent = fs.readFileSync('attached_assets/Big Baby - Master Sheet - Final_Matched_Chapter_and_Lesson_Content (3)_1753332371595.csv', 'utf-8');
  
  const records: any[] = [];
  return new Promise((resolve, reject) => {
    parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    }, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Process only rows 70+ as per user requirements (preserving rows 1-69)
      const processedData = data.slice(69).map((row: any) => ({
        chapterName: row['Chapter Name'],
        lessonName: row['Lesson Name'],
        lessonContent: row['Lesson Content'] || ''
      })).filter((row: any) => row.chapterName && row.lessonName && row.lessonContent.trim());
      
      resolve(processedData);
    });
  });
}

async function deleteAndRecreateFromCSV() {
  console.log('🚀 Starting EXACT CSV Synchronization for Big Baby Course (Course ID 6)');
  console.log('📋 Objective: Replace ALL content with EXACT CSV matches - zero tolerance for variations');
  
  try {
    const csvData = await parseBigBabyCSV();
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
          eq(courseChapters.courseId, 6),
          eq(courseChapters.title, chapterName)
        ));
      
      let chapterId: number;
      
      if (existingChapter.length === 0) {
        // Create new chapter
        const [newChapter] = await db.insert(courseChapters)
          .values({
            courseId: 6,
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
      
      // DELETE all existing lessons in this chapter to ensure clean slate
      await db.delete(courseLessons)
        .where(eq(courseLessons.chapterId, chapterId));
      console.log(`🗑️  Deleted all existing lessons in chapter: ${chapterName}`);
      
      // INSERT exact lessons from CSV
      for (const [index, lesson] of lessons.entries()) {
        await db.insert(courseLessons)
          .values({
            courseId: 6,
            chapterId: chapterId,
            title: lesson.lessonName,
            content: lesson.lessonContent,
            orderIndex: index + 1
          });
        console.log(`✅ Created lesson: ${lesson.lessonName}`);
      }
    }
    
    console.log('\n🎯 EXACT CSV Synchronization Complete!');
    console.log('📋 All content now matches CSV exactly with zero variations');
    
  } catch (error) {
    console.error('❌ Error during CSV synchronization:', error);
    process.exit(1);
  }
}

// Run the synchronization
deleteAndRecreateFromCSV().then(() => {
  console.log('✅ Script completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});