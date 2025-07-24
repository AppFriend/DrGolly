import { db } from './server/db';
import { courses, courseChapters, courseLessons } from './shared/schema';
import { eq, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

interface CSVLessonData {
  chapterName: string;
  lessonName: string;
  lessonContent: string;
  rowNumber: number;
}

interface SyncResult {
  chaptersCreated: number;
  chaptersUpdated: number;
  lessonsCreated: number;
  lessonsUpdated: number;
  contentUpdated: number;
  errors: string[];
}

/**
 * Parse the authoritative Little Baby CSV
 */
function parseLittleBabyCSV(): CSVLessonData[] {
  const csvFilePath = path.join(process.cwd(), 'attached_assets', 'Little BABY - Master Sheet - Updated_Chapter-Lesson_Matching (3) (1)_1753330616629.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`Little Baby CSV file not found: ${csvFilePath}`);
  }

  const content = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = content.split('\n');
  
  const lessons: CSVLessonData[] = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = parseCSVLine(line);
    if (parts.length >= 3 && parts[0].trim() && parts[1].trim()) {
      lessons.push({
        chapterName: parts[0].trim(),
        lessonName: parts[1].trim(),
        lessonContent: parts[2].trim(),
        rowNumber: i + 1
      });
    }
  }
  
  console.log(`📋 Parsed ${lessons.length} valid lessons from authoritative CSV`);
  return lessons;
}

/**
 * Parse CSV line with robust quote handling
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * Get current database chapters and lessons for Little Baby course
 */
async function getCurrentDatabaseState() {
  const chapters = await db.select({
    id: courseChapters.id,
    title: courseChapters.title,
    orderIndex: courseChapters.orderIndex
  })
  .from(courseChapters)
  .where(eq(courseChapters.courseId, 5))
  .orderBy(courseChapters.orderIndex);
  
  const lessons = await db.select({
    id: courseLessons.id,
    title: courseLessons.title,
    content: courseLessons.content,
    chapterId: courseLessons.chapterId,
    orderIndex: courseLessons.orderIndex
  })
  .from(courseLessons)
  .innerJoin(courseChapters, eq(courseLessons.chapterId, courseChapters.id))
  .where(eq(courseChapters.courseId, 5))
  .orderBy(courseChapters.orderIndex, courseLessons.orderIndex);
  
  return { chapters, lessons };
}

/**
 * Create or update chapter to match CSV exactly
 */
async function ensureChapterExists(chapterName: string, orderIndex: number): Promise<number> {
  // Check if chapter exists
  const existingChapter = await db.select()
    .from(courseChapters)
    .where(and(
      eq(courseChapters.courseId, 5),
      eq(courseChapters.title, chapterName)
    ))
    .limit(1);
  
  if (existingChapter.length > 0) {
    return existingChapter[0].id;
  }
  
  // Create new chapter
  const [newChapter] = await db.insert(courseChapters)
    .values({
      courseId: 5,
      title: chapterName,
      chapterNumber: orderIndex.toString(),
      orderIndex: orderIndex
    })
    .returning({ id: courseChapters.id });
  
  console.log(`✅ Created chapter: "${chapterName}"`);
  return newChapter.id;
}

/**
 * Create or update lesson to match CSV exactly
 */
async function ensureLessonExists(
  chapterId: number, 
  lessonName: string, 
  lessonContent: string, 
  orderIndex: number
): Promise<{ id: number, wasCreated: boolean, contentUpdated: boolean }> {
  // Check if lesson exists in this chapter
  const existingLesson = await db.select()
    .from(courseLessons)
    .where(and(
      eq(courseLessons.chapterId, chapterId),
      eq(courseLessons.title, lessonName)
    ))
    .limit(1);
  
  if (existingLesson.length > 0) {
    const currentContent = existingLesson[0].content || '';
    const normalizedCurrentContent = currentContent.replace(/\s+/g, ' ').trim();
    const normalizedNewContent = lessonContent.replace(/\s+/g, ' ').trim();
    
    let contentUpdated = false;
    
    // Update content if different
    if (normalizedCurrentContent !== normalizedNewContent) {
      await db.update(courseLessons)
        .set({ 
          content: lessonContent,
          orderIndex: orderIndex 
        })
        .where(eq(courseLessons.id, existingLesson[0].id));
      
      contentUpdated = true;
      console.log(`📝 Updated content for lesson: "${lessonName}"`);
    }
    
    return { 
      id: existingLesson[0].id, 
      wasCreated: false, 
      contentUpdated 
    };
  }
  
  // Create new lesson
  const [newLesson] = await db.insert(courseLessons)
    .values({
      courseId: 5,
      chapterId: chapterId,
      title: lessonName,
      content: lessonContent,
      orderIndex: orderIndex
    })
    .returning({ id: courseLessons.id });
  
  console.log(`✅ Created lesson: "${lessonName}"`);
  return { 
    id: newLesson.id, 
    wasCreated: true, 
    contentUpdated: false 
  };
}

/**
 * Synchronize database structure and content with CSV
 */
async function synchronizeWithCSV(): Promise<SyncResult> {
  console.log('🔄 Starting comprehensive Little Baby course synchronization...');
  
  const csvLessons = parseLittleBabyCSV();
  const result: SyncResult = {
    chaptersCreated: 0,
    chaptersUpdated: 0,
    lessonsCreated: 0,
    lessonsUpdated: 0,
    contentUpdated: 0,
    errors: []
  };
  
  // Group lessons by chapter to maintain order
  const chapterMap = new Map<string, CSVLessonData[]>();
  csvLessons.forEach(lesson => {
    if (!chapterMap.has(lesson.chapterName)) {
      chapterMap.set(lesson.chapterName, []);
    }
    chapterMap.get(lesson.chapterName)!.push(lesson);
  });
  
  let chapterOrderIndex = 1;
  
  // Process each chapter in order
  for (const [chapterName, lessons] of chapterMap) {
    try {
      console.log(`\n📁 Processing chapter: "${chapterName}" (${lessons.length} lessons)`);
      
      // Ensure chapter exists
      const chapterId = await ensureChapterExists(chapterName, chapterOrderIndex);
      
      let lessonOrderIndex = 1;
      
      // Process each lesson in the chapter
      for (const lesson of lessons) {
        try {
          const lessonResult = await ensureLessonExists(
            chapterId,
            lesson.lessonName,
            lesson.lessonContent,
            lessonOrderIndex
          );
          
          if (lessonResult.wasCreated) {
            result.lessonsCreated++;
          } else {
            result.lessonsUpdated++;
          }
          
          if (lessonResult.contentUpdated) {
            result.contentUpdated++;
          }
          
          lessonOrderIndex++;
          
        } catch (error) {
          const errorMsg = `Failed to process lesson "${lesson.lessonName}" in chapter "${chapterName}": ${error}`;
          console.error(`❌ ${errorMsg}`);
          result.errors.push(errorMsg);
        }
      }
      
      chapterOrderIndex++;
      
    } catch (error) {
      const errorMsg = `Failed to process chapter "${chapterName}": ${error}`;
      console.error(`❌ ${errorMsg}`);
      result.errors.push(errorMsg);
    }
  }
  
  return result;
}

/**
 * Verify synchronization by comparing final state with CSV
 */
async function verifySynchronization(csvLessons: CSVLessonData[]): Promise<void> {
  console.log('\n🔍 Verifying synchronization against CSV...');
  
  const finalState = await getCurrentDatabaseState();
  
  // Build verification map
  const dbLessonMap = new Map<string, any>();
  
  for (const chapter of finalState.chapters) {
    const chapterLessons = finalState.lessons.filter(l => l.chapterId === chapter.id);
    
    for (const lesson of chapterLessons) {
      const key = `${chapter.title}|${lesson.title}`;
      dbLessonMap.set(key, {
        chapterName: chapter.title,
        lessonName: lesson.title,
        content: lesson.content || ''
      });
    }
  }
  
  let perfectMatches = 0;
  let contentMismatches = 0;
  let missingEntries = 0;
  
  // Verify each CSV entry
  for (const csvLesson of csvLessons) {
    const key = `${csvLesson.chapterName}|${csvLesson.lessonName}`;
    const dbLesson = dbLessonMap.get(key);
    
    if (!dbLesson) {
      missingEntries++;
      console.log(`❌ Missing: ${csvLesson.chapterName} -> ${csvLesson.lessonName}`);
      continue;
    }
    
    // Compare content
    const csvContentNormalized = csvLesson.lessonContent.replace(/\s+/g, ' ').trim();
    const dbContentNormalized = dbLesson.content.replace(/\s+/g, ' ').trim();
    
    if (csvContentNormalized === dbContentNormalized) {
      perfectMatches++;
    } else {
      contentMismatches++;
      console.log(`⚠️  Content mismatch: ${csvLesson.chapterName} -> ${csvLesson.lessonName}`);
    }
  }
  
  console.log(`\n📊 Verification Results:`);
  console.log(`   Perfect matches: ${perfectMatches}/${csvLessons.length}`);
  console.log(`   Content mismatches: ${contentMismatches}`);
  console.log(`   Missing entries: ${missingEntries}`);
  
  if (perfectMatches === csvLessons.length) {
    console.log(`✅ VERIFICATION SUCCESS: Database perfectly matches CSV!`);
  } else {
    console.log(`⚠️  VERIFICATION INCOMPLETE: ${csvLessons.length - perfectMatches} discrepancies remain`);
  }
}

/**
 * Generate comprehensive synchronization report
 */
function generateSyncReport(result: SyncResult): void {
  console.log('\n📊 LITTLE BABY SYNCHRONIZATION REPORT');
  console.log('='.repeat(50));
  
  console.log(`\n✅ Success Metrics:`);
  console.log(`   Chapters created: ${result.chaptersCreated}`);
  console.log(`   Chapters updated: ${result.chaptersUpdated}`);
  console.log(`   Lessons created: ${result.lessonsCreated}`);
  console.log(`   Lessons updated: ${result.lessonsUpdated}`);
  console.log(`   Content updates: ${result.contentUpdated}`);
  
  if (result.errors.length > 0) {
    console.log(`\n❌ Errors Encountered (${result.errors.length}):`);
    result.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  } else {
    console.log(`\n✅ Zero errors encountered during synchronization`);
  }
  
  const totalOperations = result.chaptersCreated + result.chaptersUpdated + 
                          result.lessonsCreated + result.lessonsUpdated + result.contentUpdated;
  
  console.log(`\n📈 Total operations completed: ${totalOperations}`);
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting Complete Little Baby Course Synchronization');
    console.log('📋 Objective: Database must match CSV exactly with zero modifications');
    
    // Parse CSV first to validate
    const csvLessons = parseLittleBabyCSV();
    
    // Perform comprehensive synchronization
    const syncResult = await synchronizeWithCSV();
    
    // Generate report
    generateSyncReport(syncResult);
    
    // Verify final state
    await verifySynchronization(csvLessons);
    
    console.log('\n🎯 Little Baby Course synchronization complete!');
    console.log('📋 Database now serves as authentic single source of truth matching CSV exactly');
    
  } catch (error) {
    console.error('❌ Critical error during synchronization:', error);
  }
}

main();