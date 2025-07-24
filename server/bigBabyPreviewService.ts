import fs from 'fs';
import path from 'path';

interface LessonData {
  chapterName: string;
  lessonName: string;
  matchedLessonName: string;
  matchedContent: string;
}

interface ChapterData {
  [chapterName: string]: LessonData[];
}

// READ-ONLY PREVIEW STATUS FLAGS
export const PREVIEW_STATUS = {
  mode: 'READ_ONLY_PREVIEW',
  approvalRequired: true,
  databaseUpdatesBlocked: true,
  contentSource: 'Final_Chapter_Lesson_Matches_Refined.csv',
  medicalGradeCompliance: true
};

/**
 * Parse CSV line handling quoted content with commas
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
        // Escaped quote
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
 * Parse the approved CSV file
 */
function parseApprovedCSV(): LessonData[] {
  try {
    const csvFilePath = path.join(process.cwd(), 'attached_assets', 'Final_Chapter_Lesson_Matches_Refined_1753315755094.csv');
    
    if (!fs.existsSync(csvFilePath)) {
      console.error('❌ CSV file not found:', csvFilePath);
      return [];
    }

    const content = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = content.split('\n');
    
    // Skip header line
    const data: LessonData[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const row = parseCSVLine(lines[i]);
        if (row.length >= 4) {
          data.push({
            chapterName: row[0],
            lessonName: row[1],
            matchedLessonName: row[2],
            matchedContent: row[3]
          });
        }
      }
    }
    
    console.log(`📋 Parsed ${data.length} lessons from approved CSV`);
    return data;
  } catch (error) {
    console.error('❌ Error parsing CSV file:', error);
    return [];
  }
}

/**
 * Group lessons by chapter with custom ordering
 */
function groupByChapter(data: LessonData[]): ChapterData {
  const chapters: ChapterData = {};
  
  data.forEach(item => {
    const chapterName = item.chapterName;
    if (!chapters[chapterName]) {
      chapters[chapterName] = [];
    }
    chapters[chapterName].push(item);
  });
  
  // Custom ordering: "Big Baby: 4-8 Months" first, then rest alphabetically
  const orderedChapters: ChapterData = {};
  const chapterNames = Object.keys(chapters);
  
  // Add "Big Baby: 4-8 Months" first if it exists
  const introChapter = chapterNames.find(name => name === "Big Baby: 4-8 Months");
  if (introChapter) {
    orderedChapters[introChapter] = chapters[introChapter];
  }
  
  // Add remaining chapters in alphabetical order
  chapterNames
    .filter(name => name !== "Big Baby: 4-8 Months")
    .sort()
    .forEach(chapterName => {
      orderedChapters[chapterName] = chapters[chapterName];
    });
  
  return orderedChapters;
}

/**
 * Get Big Baby course preview data
 * READ-ONLY - No database modifications
 */
export function getBigBabyPreviewData() {
  console.log('🔍 Generating Big Baby course preview data...');
  console.log(`Status: ${PREVIEW_STATUS.mode}`);
  console.log(`Database Updates: ${PREVIEW_STATUS.databaseUpdatesBlocked ? 'BLOCKED' : 'ALLOWED'}`);
  
  const lessons = parseApprovedCSV();
  const chapters = groupByChapter(lessons);
  
  const stats = {
    totalChapters: Object.keys(chapters).length,
    totalLessons: lessons.length,
    lessonsWithContent: lessons.filter(l => l.matchedContent && l.matchedContent !== 'No confident match found').length,
    lessonsWithoutContent: lessons.filter(l => !l.matchedContent || l.matchedContent === 'No confident match found').length
  };
  
  return {
    status: PREVIEW_STATUS,
    chapters,
    stats,
    timestamp: new Date().toISOString()
  };
}