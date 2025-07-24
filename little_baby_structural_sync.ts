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

interface DatabaseStructure {
  [chapterName: string]: {
    chapterId: number;
    orderIndex: number;
    lessons: {
      [lessonName: string]: {
        lessonId: number;
        orderIndex: number;
        currentContent: string;
      };
    };
  };
}

interface StructuralMatchResult {
  csvStructure: { [chapter: string]: string[] };
  databaseStructure: { [chapter: string]: string[] };
  missingChapters: string[];
  extraChapters: string[];
  chapterMatches: Array<{
    chapterName: string;
    csvLessons: string[];
    dbLessons: string[];
    missingLessons: string[];
    extraLessons: string[];
  }>;
}

/**
 * Parse CSV and build structure map
 */
function parseCSVStructure(): { lessons: CSVLessonData[], structure: { [chapter: string]: string[] } } {
  const csvFilePath = path.join(process.cwd(), 'attached_assets', 'Little BABY - Master Sheet - Updated_Chapter-Lesson_Matching (3) (1)_1753330616629.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`Little Baby CSV file not found: ${csvFilePath}`);
  }

  const content = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = content.split('\n');
  
  const lessons: CSVLessonData[] = [];
  const structure: { [chapter: string]: string[] } = {};
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = parseCSVLine(line);
    if (parts.length >= 3) {
      const chapterName = parts[0].trim();
      const lessonName = parts[1].trim();
      const lessonContent = parts[2].trim();
      
      lessons.push({
        chapterName,
        lessonName,
        lessonContent,
        rowNumber: i + 1
      });
      
      if (!structure[chapterName]) {
        structure[chapterName] = [];
      }
      structure[chapterName].push(lessonName);
    }
  }
  
  console.log(`📋 Parsed CSV: ${lessons.length} lessons across ${Object.keys(structure).length} chapters`);
  return { lessons, structure };
}

/**
 * Parse CSV line with proper quote handling
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
 * Get database structure
 */
async function getDatabaseStructure(): Promise<{ structure: { [chapter: string]: string[] }, detailed: DatabaseStructure }> {
  const data = await db.select({
    chapterId: courseChapters.id,
    chapterTitle: courseChapters.title,
    chapterOrderIndex: courseChapters.orderIndex,
    lessonId: courseLessons.id,
    lessonTitle: courseLessons.title,
    lessonOrderIndex: courseLessons.orderIndex,
    lessonContent: courseLessons.content
  })
  .from(courseChapters)
  .leftJoin(courseLessons, eq(courseLessons.chapterId, courseChapters.id))
  .where(eq(courseChapters.courseId, 5))
  .orderBy(courseChapters.orderIndex, courseLessons.orderIndex);
  
  const structure: { [chapter: string]: string[] } = {};
  const detailed: DatabaseStructure = {};
  
  data.forEach(row => {
    const chapterName = row.chapterTitle;
    const lessonName = row.lessonTitle;
    
    if (!structure[chapterName]) {
      structure[chapterName] = [];
      detailed[chapterName] = {
        chapterId: row.chapterId,
        orderIndex: row.chapterOrderIndex,
        lessons: {}
      };
    }
    
    if (lessonName) {
      structure[chapterName].push(lessonName);
      detailed[chapterName].lessons[lessonName] = {
        lessonId: row.lessonId!,
        orderIndex: row.lessonOrderIndex!,
        currentContent: row.lessonContent || ''
      };
    }
  });
  
  console.log(`📊 Database: ${Object.values(structure).flat().length} lessons across ${Object.keys(structure).length} chapters`);
  return { structure, detailed };
}

/**
 * Compare structures and identify mismatches
 */
function compareStructures(csvStructure: { [chapter: string]: string[] }, dbStructure: { [chapter: string]: string[] }): StructuralMatchResult {
  const csvChapters = Object.keys(csvStructure);
  const dbChapters = Object.keys(dbStructure);
  
  const missingChapters = csvChapters.filter(ch => !dbChapters.includes(ch));
  const extraChapters = dbChapters.filter(ch => !csvChapters.includes(ch));
  
  const chapterMatches: StructuralMatchResult['chapterMatches'] = [];
  
  csvChapters.forEach(chapterName => {
    if (dbStructure[chapterName]) {
      const csvLessons = csvStructure[chapterName];
      const dbLessons = dbStructure[chapterName];
      
      const missingLessons = csvLessons.filter(lesson => !dbLessons.includes(lesson));
      const extraLessons = dbLessons.filter(lesson => !csvLessons.includes(lesson));
      
      chapterMatches.push({
        chapterName,
        csvLessons,
        dbLessons,
        missingLessons,
        extraLessons
      });
    }
  });
  
  return {
    csvStructure,
    databaseStructure: dbStructure,
    missingChapters,
    extraChapters,
    chapterMatches
  };
}

/**
 * Generate detailed structural report
 */
function generateStructuralReport(matchResult: StructuralMatchResult): void {
  console.log('\n📊 LITTLE BABY STRUCTURAL ANALYSIS REPORT');
  console.log('='.repeat(60));
  
  console.log(`\n📋 CSV Structure Analysis:`);
  Object.entries(matchResult.csvStructure).forEach(([chapter, lessons]) => {
    console.log(`   "${chapter}": ${lessons.length} lessons`);
  });
  
  console.log(`\n📊 Database Structure Analysis:`);
  Object.entries(matchResult.databaseStructure).forEach(([chapter, lessons]) => {
    console.log(`   "${chapter}": ${lessons.length} lessons`);
  });
  
  if (matchResult.missingChapters.length > 0) {
    console.log(`\n🚨 MISSING CHAPTERS IN DATABASE (${matchResult.missingChapters.length}):`);
    matchResult.missingChapters.forEach(chapter => {
      const lessonCount = matchResult.csvStructure[chapter]?.length || 0;
      console.log(`   "${chapter}" (${lessonCount} lessons)`);
    });
  }
  
  if (matchResult.extraChapters.length > 0) {
    console.log(`\n📊 EXTRA CHAPTERS IN DATABASE (${matchResult.extraChapters.length}):`);
    matchResult.extraChapters.forEach(chapter => {
      const lessonCount = matchResult.databaseStructure[chapter]?.length || 0;
      console.log(`   "${chapter}" (${lessonCount} lessons)`);
    });
  }
  
  console.log(`\n🔍 CHAPTER-BY-CHAPTER ANALYSIS:`);
  matchResult.chapterMatches.forEach(match => {
    const csvCount = match.csvLessons.length;
    const dbCount = match.dbLessons.length;
    const missingCount = match.missingLessons.length;
    const extraCount = match.extraLessons.length;
    
    console.log(`\n   Chapter: "${match.chapterName}"`);
    console.log(`     CSV: ${csvCount} lessons | DB: ${dbCount} lessons`);
    console.log(`     Missing: ${missingCount} | Extra: ${extraCount}`);
    
    if (missingCount > 0) {
      console.log(`     Missing lessons:`);
      match.missingLessons.slice(0, 5).forEach(lesson => {
        console.log(`       - "${lesson}"`);
      });
      if (missingCount > 5) {
        console.log(`       ... and ${missingCount - 5} more missing lessons`);
      }
    }
    
    if (extraCount > 0) {
      console.log(`     Extra lessons:`);
      match.extraLessons.slice(0, 5).forEach(lesson => {
        console.log(`       - "${lesson}"`);
      });
      if (extraCount > 5) {
        console.log(`       ... and ${extraCount - 5} more extra lessons`);
      }
    }
  });
}

/**
 * Identify potential solutions
 */
function identifyPotentialSolutions(matchResult: StructuralMatchResult): void {
  console.log(`\n🛠️  POTENTIAL SOLUTIONS:`);
  console.log('='.repeat(30));
  
  let exactMatches = 0;
  let totalChapterMatches = 0;
  
  matchResult.chapterMatches.forEach(match => {
    if (match.missingLessons.length === 0 && match.extraLessons.length === 0) {
      exactMatches++;
    }
    totalChapterMatches++;
  });
  
  console.log(`\n📊 Match Statistics:`);
  console.log(`   Perfect chapter matches: ${exactMatches}/${totalChapterMatches}`);
  console.log(`   Missing chapters: ${matchResult.missingChapters.length}`);
  console.log(`   Extra chapters: ${matchResult.extraChapters.length}`);
  
  if (exactMatches === totalChapterMatches && matchResult.missingChapters.length === 0) {
    console.log(`\n✅ STRUCTURE COMPATIBLE: Database structure matches CSV - content sync possible`);
  } else {
    console.log(`\n⚠️  STRUCTURE MISMATCH: Database structure requires updates to match CSV`);
    console.log(`\n   Recommended actions:`);
    console.log(`   1. Create missing chapters: ${matchResult.missingChapters.length}`);
    console.log(`   2. Add missing lessons per chapter`);
    console.log(`   3. Update lesson titles to match CSV exactly`);
    console.log(`   4. Then synchronize content`);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting Little Baby Course Structural Analysis');
    
    // Parse CSV structure
    const { lessons: csvLessons, structure: csvStructure } = parseCSVStructure();
    
    // Get database structure
    const { structure: dbStructure, detailed: dbDetailed } = await getDatabaseStructure();
    
    // Compare structures
    const matchResult = compareStructures(csvStructure, dbStructure);
    
    // Generate reports
    generateStructuralReport(matchResult);
    identifyPotentialSolutions(matchResult);
    
    console.log('\n✅ Little Baby Course structural analysis complete!');
    
  } catch (error) {
    console.error('❌ Error during structural analysis:', error);
  }
}

main();