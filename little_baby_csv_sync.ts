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

interface MatchResult {
  csvLessons: CSVLessonData[];
  databaseLessons: any[];
  successfulMatches: Array<{
    chapterName: string;
    lessonName: string;
    lessonId: number;
    contentLength: number;
    updated: boolean;
  }>;
  unmatchedCSV: CSVLessonData[];
  unmatchedDatabase: any[];
  contentMismatches: Array<{
    chapterName: string;
    lessonName: string;
    csvLength: number;
    dbLength: number;
    contentMatches: boolean;
  }>;
}

/**
 * Parse the Little Baby CSV file with proper quote handling
 */
function parseLittleBabyCSV(): CSVLessonData[] {
  const csvFilePath = path.join(process.cwd(), 'attached_assets', 'Little BABY - Master Sheet - Updated_Chapter-Lesson_Matching (3) (1)_1753330616629.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`Little Baby CSV file not found: ${csvFilePath}`);
  }

  const content = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = content.split('\n');
  
  const lessons: CSVLessonData[] = [];
  
  // Skip header line, process data starting from line 2
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line with proper quote handling
    const parts = parseCSVLine(line);
    if (parts.length >= 3) {
      lessons.push({
        chapterName: parts[0].trim(),
        lessonName: parts[1].trim(),
        lessonContent: parts[2].trim(),
        rowNumber: i + 1
      });
    }
  }
  
  console.log(`📋 Parsed ${lessons.length} lessons from Little Baby CSV`);
  return lessons;
}

/**
 * Parse CSV line with proper quote handling for complex content
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
        // Double quote inside quoted field
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current);
  return result;
}

/**
 * Get all Little Baby lessons from database
 */
async function getLittleBabyDatabaseLessons() {
  const littleBabyCourse = await db.select()
    .from(courses)
    .where(eq(courses.id, 5))
    .limit(1);
  
  if (littleBabyCourse.length === 0) {
    throw new Error('Little Baby course not found in database (expected ID: 5)');
  }
  
  const lessonsWithChapters = await db.select({
    lessonId: courseLessons.id,
    lessonTitle: courseLessons.title,
    lessonContent: courseLessons.content,
    chapterTitle: courseChapters.title,
    chapterOrderIndex: courseChapters.orderIndex,
    lessonOrderIndex: courseLessons.orderIndex
  })
  .from(courseLessons)
  .innerJoin(courseChapters, eq(courseLessons.chapterId, courseChapters.id))
  .where(eq(courseChapters.courseId, 5))
  .orderBy(courseChapters.orderIndex, courseLessons.orderIndex);
  
  console.log(`📊 Found ${lessonsWithChapters.length} lessons in Little Baby database`);
  return lessonsWithChapters;
}

/**
 * Normalize titles for exact matching
 */
function normalizeTitle(title: string): string {
  return title.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match CSV lessons to database lessons
 */
async function matchCSVToDatabaseLessons(): Promise<MatchResult> {
  console.log('🔍 Starting Little Baby CSV-Database matching process...');
  
  const csvLessons = parseLittleBabyCSV();
  const databaseLessons = await getLittleBabyDatabaseLessons();
  
  const result: MatchResult = {
    csvLessons,
    databaseLessons,
    successfulMatches: [],
    unmatchedCSV: [],
    unmatchedDatabase: [],
    contentMismatches: []
  };
  
  // Create maps for efficient matching
  const dbLessonMap = new Map<string, any>();
  databaseLessons.forEach(lesson => {
    const key = `${normalizeTitle(lesson.chapterTitle)}|${normalizeTitle(lesson.lessonTitle)}`;
    dbLessonMap.set(key, lesson);
  });
  
  // Process each CSV lesson
  csvLessons.forEach(csvLesson => {
    const key = `${normalizeTitle(csvLesson.chapterName)}|${normalizeTitle(csvLesson.lessonName)}`;
    const dbLesson = dbLessonMap.get(key);
    
    if (dbLesson) {
      // Found a match
      const csvContentLength = csvLesson.lessonContent.length;
      const dbContentLength = dbLesson.lessonContent.length;
      
      // Normalize content for comparison
      const csvContentNormalized = csvLesson.lessonContent.replace(/\s+/g, ' ').trim();
      const dbContentNormalized = dbLesson.lessonContent.replace(/\s+/g, ' ').trim();
      const contentMatches = csvContentNormalized === dbContentNormalized;
      
      result.successfulMatches.push({
        chapterName: csvLesson.chapterName,
        lessonName: csvLesson.lessonName,
        lessonId: dbLesson.lessonId,
        contentLength: csvContentLength,
        updated: false // Will be updated during sync
      });
      
      result.contentMismatches.push({
        chapterName: csvLesson.chapterName,
        lessonName: csvLesson.lessonName,
        csvLength: csvContentLength,
        dbLength: dbContentLength,
        contentMatches
      });
      
      // Remove matched lesson from database map
      dbLessonMap.delete(key);
    } else {
      // No match found
      result.unmatchedCSV.push(csvLesson);
    }
  });
  
  // Remaining lessons in database map are unmatched
  result.unmatchedDatabase = Array.from(dbLessonMap.values());
  
  return result;
}

/**
 * Synchronize database content with CSV
 */
async function synchronizeLittleBabyContent(matchResult: MatchResult): Promise<number> {
  console.log('🔄 Synchronizing Little Baby database with CSV content...');
  
  let updatesCount = 0;
  
  // Update content for all successful matches that have content mismatches
  for (const mismatch of matchResult.contentMismatches) {
    if (!mismatch.contentMatches) {
      const csvLesson = matchResult.csvLessons.find(
        l => normalizeTitle(l.chapterName) === normalizeTitle(mismatch.chapterName) &&
             normalizeTitle(l.lessonName) === normalizeTitle(mismatch.lessonName)
      );
      
      const match = matchResult.successfulMatches.find(
        m => normalizeTitle(m.chapterName) === normalizeTitle(mismatch.chapterName) &&
             normalizeTitle(m.lessonName) === normalizeTitle(mismatch.lessonName)
      );
      
      if (csvLesson && match) {
        console.log(`Updating: ${mismatch.chapterName} -> ${mismatch.lessonName}`);
        
        await db.update(courseLessons)
          .set({ content: csvLesson.lessonContent })
          .where(eq(courseLessons.id, match.lessonId));
        
        // Mark as updated
        match.updated = true;
        updatesCount++;
      }
    }
  }
  
  console.log(`✅ Updated ${updatesCount} Little Baby lesson contents to match CSV`);
  return updatesCount;
}

/**
 * Generate comprehensive report
 */
function generateSyncReport(matchResult: MatchResult): void {
  console.log('\n📊 LITTLE BABY COURSE SYNCHRONIZATION REPORT');
  console.log('='.repeat(50));
  
  console.log(`\n📋 CSV Analysis:`);
  console.log(`   Total CSV lessons: ${matchResult.csvLessons.length}`);
  console.log(`   Successfully matched: ${matchResult.successfulMatches.length}`);
  console.log(`   Unmatched CSV entries: ${matchResult.unmatchedCSV.length}`);
  
  console.log(`\n📊 Database Analysis:`);
  console.log(`   Total database lessons: ${matchResult.databaseLessons.length}`);
  console.log(`   Unmatched database lessons: ${matchResult.unmatchedDatabase.length}`);
  
  console.log(`\n🔄 Content Analysis:`);
  const contentMismatches = matchResult.contentMismatches.filter(m => !m.contentMatches);
  console.log(`   Content mismatches found: ${contentMismatches.length}`);
  console.log(`   Content updates applied: ${matchResult.successfulMatches.filter(m => m.updated).length}`);
  
  if (matchResult.unmatchedCSV.length > 0) {
    console.log(`\n🚨 UNMATCHED CSV ENTRIES (${matchResult.unmatchedCSV.length}):`);
    matchResult.unmatchedCSV.slice(0, 10).forEach(lesson => {
      console.log(`   Row ${lesson.rowNumber}: "${lesson.chapterName}" -> "${lesson.lessonName}"`);
    });
    if (matchResult.unmatchedCSV.length > 10) {
      console.log(`   ... and ${matchResult.unmatchedCSV.length - 10} more unmatched entries`);
    }
  }
  
  if (matchResult.unmatchedDatabase.length > 0) {
    console.log(`\n📊 EXTRA DATABASE LESSONS (${matchResult.unmatchedDatabase.length}):`);
    matchResult.unmatchedDatabase.slice(0, 10).forEach(lesson => {
      console.log(`   "${lesson.chapterTitle}" -> "${lesson.lessonTitle}"`);
    });
    if (matchResult.unmatchedDatabase.length > 10) {
      console.log(`   ... and ${matchResult.unmatchedDatabase.length - 10} more extra lessons`);
    }
  }
}

/**
 * Verify synchronization was successful
 */
async function verifySynchronization(): Promise<void> {
  console.log('\n🔍 Verifying synchronization...');
  
  const postSyncResult = await matchCSVToDatabaseLessons();
  const remainingMismatches = postSyncResult.contentMismatches.filter(m => !m.contentMatches);
  
  if (remainingMismatches.length === 0) {
    console.log('✅ VERIFICATION SUCCESS: All matched lessons now have identical content!');
  } else {
    console.log(`⚠️  VERIFICATION WARNING: ${remainingMismatches.length} content mismatches remain`);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting Little Baby Course CSV Synchronization');
    
    // Step 1: Match CSV to database
    const matchResult = await matchCSVToDatabaseLessons();
    
    // Step 2: Synchronize content
    const updatesApplied = await synchronizeLittleBabyContent(matchResult);
    
    // Step 3: Generate report
    generateSyncReport(matchResult);
    
    // Step 4: Verify synchronization
    await verifySynchronization();
    
    console.log('\n✅ Little Baby Course synchronization complete!');
    
  } catch (error) {
    console.error('❌ Error during Little Baby synchronization:', error);
  }
}

main();