import { db } from "../server/db";
import { 
  courses, 
  courseChapters, 
  courseLessons,
  insertCourseSchema,
  insertCourseChapterSchema,
  insertCourseLessonSchema
} from "../shared/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

// Course ID mapping from CSV data to existing database course IDs
const COURSE_ID_MAPPING = {
  "1738631920240x970515425764835300": { title: "Preparation for newborns", dbId: 10 },
  "1739065040965x300688505535201300": { title: "Little baby sleep program", dbId: 5 }, // Welcome course
  "1738211381074x619811994544111600": { title: "Little baby sleep program", dbId: 5 }, // Main course
  "1738211436896x174196059034091520": { title: "Big baby sleep program", dbId: 6 },
  "1738211513350x866090906720665600": { title: "Pre-toddler sleep program", dbId: 7 },
  "1738211565701x843388859190345699": { title: "Toddler sleep program", dbId: 8 }, // Welcome
  "1738211565701x843388859190345700": { title: "Toddler sleep program", dbId: 8 }, // Main
  "1738211625998x856545795660054500": { title: "Pre-school sleep program", dbId: 9 },
  "1740714032807x880560269585023000": { title: "New sibling supplement", dbId: 11 },
  "1740715399162x980182825696755700": { title: "Twins supplement", dbId: 12 },
  "1741822441185x826889298740510700": { title: "Toddler toolkit", dbId: 13 },
  "1746521064418x896614461038395400": { title: "Testing allergens", dbId: 14 }
};

// Helper function to clean and parse rich text content with consistent formatting
function cleanRichTextContent(content: string): string {
  if (!content) return "";
  
  // Convert HTML-like tags to proper HTML with consistent styling
  let cleaned = content
    // Convert headings with consistent sizing (matching blog post formatting)
    .replace(/\[h1\](.*?)\[\/h1\]/g, '<h1 class="text-2xl font-bold text-gray-900 mb-4">$1</h1>')
    .replace(/\[h2\](.*?)\[\/h2\]/g, '<h2 class="text-xl font-semibold text-gray-900 mb-3">$1</h2>')
    .replace(/\[h3\](.*?)\[\/h3\]/g, '<h3 class="text-lg font-medium text-gray-900 mb-2">$1</h3>')
    .replace(/\[h4\](.*?)\[\/h4\]/g, '<h4 class="text-base font-medium text-gray-900 mb-2">$1</h4>')
    // Convert text formatting
    .replace(/\[b\](.*?)\[\/b\]/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\[i\](.*?)\[\/i\]/g, '<em class="italic">$1</em>')
    // Convert line breaks
    .replace(/\[br\]/g, '<br>')
    .replace(/<br >/g, '<br>')
    // Convert images with responsive sizing
    .replace(/\[img width=(\d+)px\](.*?)\[\/img\]/g, '<img src="$2" alt="Course content image" class="max-w-full h-auto rounded-lg shadow-sm my-4" style="max-width: $1px;" />')
    // Convert videos with proper styling
    .replace(/\[video\](.*?)\[\/video\]/g, '<video controls class="w-full max-w-2xl mx-auto rounded-lg shadow-sm my-4"><source src="$1" type="video/mp4">Your browser does not support the video tag.</video>')
    // Clean up font/color tags and apply consistent body text styling
    .replace(/\[font=""Monospace""\]\[color=rgb\(31, 31, 31\)\](.*?)\[\/color\]\[\/font\]/g, '<p class="text-base text-gray-700 leading-relaxed mb-4">$1</p>')
    // Convert any remaining paragraph-like content
    .replace(/\n\n/g, '</p><p class="text-base text-gray-700 leading-relaxed mb-4">');
  
  // Wrap content in paragraph tags if it doesn't start with a heading
  if (!cleaned.startsWith('<h') && !cleaned.startsWith('<p')) {
    cleaned = `<p class="text-base text-gray-700 leading-relaxed mb-4">${cleaned}</p>`;
  }
  
  // Clean up excessive whitespace and newlines
  cleaned = cleaned.replace(/\n\s*\n/g, '\n').trim();
  
  // Fix any broken paragraph tags
  cleaned = cleaned.replace(/<p([^>]*)><\/p>/g, '');
  
  return cleaned;
}

// Helper function to extract video URL from content
function extractVideoUrl(content: string, videoField: string): string | null {
  // Check dedicated video field first
  if (videoField && videoField.includes('//')) {
    return videoField.startsWith('//') ? `https:${videoField}` : videoField;
  }
  
  // Extract from rich text content
  const videoMatch = content.match(/\[video\](.*?)\[\/video\]/);
  if (videoMatch) {
    const url = videoMatch[1];
    return url.startsWith('//') ? `https:${url}` : url;
  }
  
  return null;
}

// Helper function to parse CSV content
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    
    i++;
  }
  
  result.push(current.trim());
  return result;
}

interface CourseStructureRow {
  category: string;
  postCourse: string;
  courseId: string;
  courseSchedule: string;
  name: string;
  skillLevel: string;
  status: string;
}

interface ContentRow {
  duration: string;
  hasVideo: string;
  index: string;
  isComplete: string;
  module: string;
  setTimeFrame: string;
  text: string;
  times: string;
  titleOfRichText: string;
  titleOfVideo: string;
  uploadContent: string;
  uploadVideo: string;
  videoUrl: string;
  creationDate: string;
  modifiedDate: string;
  slug: string;
  creator: string;
  uniqueId: string;
}

export async function migrateCourses() {
  console.log("Starting course migration from CSV files...");
  
  try {
    // Read CSV files
    const structureFile = path.join(process.cwd(), 'attached_assets', 'Courses & Modules - export_All-Modules_2025-07-11_00-03-21_1752195453760.csv');
    const contentFile = path.join(process.cwd(), 'attached_assets', 'export_All-submodules-modified--_2025-07-11_00-30-29_1752195453760.csv');
    
    const structureData = fs.readFileSync(structureFile, 'utf-8');
    const contentData = fs.readFileSync(contentFile, 'utf-8');
    
    // Parse structure CSV
    const structureLines = structureData.split('\n').filter(line => line.trim());
    const structureRows: CourseStructureRow[] = [];
    
    for (let i = 1; i < structureLines.length; i++) {
      const fields = parseCSVLine(structureLines[i]);
      if (fields.length >= 7 && fields[1] && fields[2] && fields[4]) {
        structureRows.push({
          category: fields[0]?.trim() || '',
          postCourse: fields[1]?.trim() || '',
          courseId: fields[2]?.trim() || '',
          courseSchedule: fields[3]?.trim() || '',
          name: fields[4]?.trim() || '',
          skillLevel: fields[5]?.trim() || '',
          status: fields[6]?.trim() || ''
        });
      }
    }
    
    // Parse content CSV
    const contentLines = contentData.split('\n').filter(line => line.trim());
    const contentRows: ContentRow[] = [];
    
    for (let i = 1; i < contentLines.length; i++) {
      const fields = parseCSVLine(contentLines[i]);
      if (fields.length >= 18) {
        contentRows.push({
          duration: fields[0]?.trim() || '',
          hasVideo: fields[1]?.toLowerCase() === 'yes',
          index: fields[2]?.trim() || '',
          isComplete: fields[3]?.trim() || '',
          module: fields[4]?.trim() || '',
          setTimeFrame: fields[5]?.trim() || '',
          text: fields[6]?.trim() || '',
          times: fields[7]?.trim() || '',
          titleOfRichText: fields[8]?.trim() || '',
          titleOfVideo: fields[9]?.trim() || '',
          uploadContent: fields[10]?.trim() || '',
          uploadVideo: fields[11]?.trim() || '',
          videoUrl: fields[12]?.trim() || '',
          creationDate: fields[13]?.trim() || '',
          modifiedDate: fields[14]?.trim() || '',
          slug: fields[15]?.trim() || '',
          creator: fields[16]?.trim() || '',
          uniqueId: fields[17]?.trim() || ''
        });
      }
    }
    
    console.log(`Parsed ${structureRows.length} structure rows and ${contentRows.length} content rows`);
    
    // Group structure rows by course
    const courseGroups: { [key: string]: CourseStructureRow[] } = {};
    structureRows.forEach(row => {
      if (!courseGroups[row.courseId]) {
        courseGroups[row.courseId] = [];
      }
      courseGroups[row.courseId].push(row);
    });
    
    // Process each course
    for (const [courseId, courseRows] of Object.entries(courseGroups)) {
      const courseMapping = COURSE_ID_MAPPING[courseId];
      if (!courseMapping) {
        console.log(`Skipping unmapped course ID: ${courseId}`);
        continue;
      }
      
      console.log(`Processing course: ${courseMapping.title} (CSV ID: ${courseId}, DB ID: ${courseMapping.dbId})`);
      
      // Get the first row for course-level data
      const firstRow = courseRows[0];
      if (!firstRow) continue;
      
      // Use the existing database course ID
      const courseDbId = courseMapping.dbId;
      
      // Verify course exists in database
      const [existingCourse] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseDbId));
      
      if (!existingCourse) {
        console.log(`Warning: Course ID ${courseDbId} not found in database for ${courseMapping.title}`);
        continue;
      }
      
      console.log(`Using existing course: ${courseMapping.title} (DB ID: ${courseDbId})`);
      
      // Process chapters/modules
      for (const row of courseRows) {
        if (!row.name) continue;
        
        // Determine if this is a chapter (0.0, 1.1, 1.2, etc.) or a standalone module
        const isChapter = /^\d+\.\d+/.test(row.name);
        const chapterNumber = isChapter ? row.name.match(/^(\d+\.\d+)/)?.[1] : null;
        
        if (isChapter && chapterNumber) {
          // Create chapter
          const [existingChapter] = await db
            .select()
            .from(courseChapters)
            .where(eq(courseChapters.courseId, courseDbId))
            .where(eq(courseChapters.chapterNumber, chapterNumber));
          
          let chapterDbId: number;
          
          if (existingChapter) {
            chapterDbId = existingChapter.id;
          } else {
            const [newChapter] = await db
              .insert(courseChapters)
              .values({
                courseId: courseDbId,
                title: row.name,
                description: `Chapter ${chapterNumber}`,
                chapterNumber: chapterNumber,
                orderIndex: parseInt(chapterNumber.split('.')[1]) || 0,
                status: row.status?.toLowerCase() === 'publish' ? 'published' : 'draft'
              })
              .returning();
            
            chapterDbId = newChapter.id;
            console.log(`Created chapter: ${row.name} (ID: ${chapterDbId})`);
          }
          
          // Find matching content for this chapter
          const matchingContent = contentRows.filter(content => 
            content.module === courseId && 
            content.text &&
            content.text.length > 20 && // Filter out test/junk content
            !content.text.includes('mnbkjbbfvjhhvjhcdc') && // Filter out test content
            !content.text.includes('lnhkljgklddgdsg') && // Filter out test content
            !content.text.includes('fhfgjg') && // Filter out test content
            !content.text.includes('testing') && // Filter out test content
            !content.text.includes('Testing') // Filter out test content
          );
          
          // Create module for this chapter
          const moduleContent = matchingContent.find(content => content.text);
          if (moduleContent) {
            const cleanContent = cleanRichTextContent(moduleContent.text);
            const videoUrl = extractVideoUrl(moduleContent.text, moduleContent.videoUrl);
            
            const [existingModule] = await db
              .select()
              .from(courseModules)
              .where(eq(courseModules.chapterId, chapterDbId));
            
            if (!existingModule) {
              await db
                .insert(courseModules)
                .values({
                  courseId: courseDbId,
                  chapterId: chapterDbId,
                  title: row.name,
                  description: row.name,
                  content: cleanContent,
                  videoUrl: videoUrl,
                  orderIndex: 0,
                  contentType: videoUrl ? 'video' : 'text',
                  duration: moduleContent.duration ? parseFloat(moduleContent.duration) : null,
                  status: row.status?.toLowerCase() === 'publish' ? 'published' : 'draft'
                });
              
              console.log(`Created module for chapter: ${row.name}`);
            }
          }
        } else {
          // Create standalone module (no chapter)
          const [existingModule] = await db
            .select()
            .from(courseModules)
            .where(eq(courseModules.courseId, courseDbId))
            .where(eq(courseModules.title, row.name));
          
          if (!existingModule) {
            // Find matching content for this module
            const matchingContent = contentRows.find(content => 
              content.module === courseId && 
              content.text &&
              content.text.length > 20 && // Filter out test/junk content
              !content.text.includes('mnbkjbbfvjhhvjhcdc') && // Filter out test content
              !content.text.includes('lnhkljgklddgdsg') && // Filter out test content
              !content.text.includes('fhfgjg') && // Filter out test content
              !content.text.includes('testing') && // Filter out test content
              !content.text.includes('Testing') // Filter out test content
            );
            
            let cleanContent = '';
            let videoUrl = null;
            
            if (matchingContent) {
              cleanContent = cleanRichTextContent(matchingContent.text);
              videoUrl = extractVideoUrl(matchingContent.text, matchingContent.videoUrl);
            }
            
            await db
              .insert(courseModules)
              .values({
                courseId: courseDbId,
                chapterId: null,
                title: row.name,
                description: row.name,
                content: cleanContent,
                videoUrl: videoUrl,
                orderIndex: courseRows.indexOf(row),
                contentType: videoUrl ? 'video' : 'text',
                duration: matchingContent?.duration ? parseFloat(matchingContent.duration) : null,
                status: row.status?.toLowerCase() === 'publish' ? 'published' : 'draft'
              });
            
            console.log(`Created standalone module: ${row.name}`);
          }
        }
      }
    }
    
    console.log("Course migration completed successfully!");
    
  } catch (error) {
    console.error("Error during course migration:", error);
    throw error;
  }
}

// Run migration if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateCourses()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

