import { db } from './db';
import { courses, courseChapters, courseLessons, lessonContent } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { getBigBabyPreviewData } from './bigBabyPreviewService';

interface DatabaseUpdatePlan {
  courseId: number;
  chapters: {
    chapterName: string;
    chapterNumber: string;
    lessons: {
      lessonName: string;
      matchedLessonTitle: string;
      matchedContent: string;
      contentPreview: string;
      existingLessonId?: number;
    }[];
  }[];
}

interface VerificationTable {
  chapterName: string;
  lessonName: string;
  matchedLessonTitle: string;
  contentPreview: string;
  status: 'MATCHED' | 'NO_MATCH' | 'DUPLICATE';
}

/**
 * Extract chapter number from chapter name for database consistency
 */
function extractChapterNumber(chapterName: string): string {
  if (chapterName === "Big Baby: 4-8 Months") {
    return "0.0"; // Introduction chapter
  }
  
  const match = chapterName.match(/^(\d+\.\d+)/);
  return match ? match[1] : "999.0"; // Fallback for non-numbered chapters
}

/**
 * Find existing lesson in database by matching title variations
 */
async function findExistingLesson(targetTitle: string): Promise<any | null> {
  try {
    // Get all existing lessons
    const allLessons = await db.select().from(courseLessons);
    
    // Normalize titles for comparison
    const normalizeTitle = (title: string) => 
      title.toLowerCase()
           .replace(/[^\w\s]/g, '')
           .replace(/\s+/g, ' ')
           .trim();
    
    const normalizedTarget = normalizeTitle(targetTitle);
    
    // Find exact match first
    const exactMatch = allLessons.find(lesson => 
      normalizeTitle(lesson.title) === normalizedTarget
    );
    
    if (exactMatch) return exactMatch;
    
    // Find partial matches (for aliases or variations)
    const partialMatch = allLessons.find(lesson => {
      const lessonTitle = normalizeTitle(lesson.title);
      return lessonTitle.includes(normalizedTarget) || 
             normalizedTarget.includes(lessonTitle);
    });
    
    return partialMatch || null;
  } catch (error) {
    console.error('Error finding existing lesson:', error);
    return null;
  }
}

/**
 * Build database update plan from read-only preview data
 */
export async function buildDatabaseUpdatePlan(): Promise<DatabaseUpdatePlan> {
  console.log('🏗️ Building database update plan from read-only preview...');
  
  // Get preview data (our source of truth)
  const previewData = getBigBabyPreviewData();
  
  // Find or create Big Baby course
  let bigBabyCourse = await db.select().from(courses)
    .where(eq(courses.title, 'Big Baby: 4–8 Months'))
    .limit(1);
  
  let courseId: number;
  if (bigBabyCourse.length === 0) {
    console.log('📚 Creating new Big Baby course...');
    const [newCourse] = await db.insert(courses).values({
      title: 'Big Baby: 4–8 Months',
      description: 'Comprehensive sleep guidance for babies 4-8 months old',
      category: 'sleep'
    }).returning();
    courseId = newCourse.id;
  } else {
    courseId = bigBabyCourse[0].id;
  }
  
  const updatePlan: DatabaseUpdatePlan = {
    courseId,
    chapters: []
  };
  
  // Process each chapter from preview data
  for (const [chapterName, chapterLessons] of Object.entries(previewData.chapters)) {
    console.log(`📖 Processing chapter: ${chapterName}`);
    
    const chapterPlan = {
      chapterName,
      chapterNumber: extractChapterNumber(chapterName),
      lessons: [] as any[]
    };
    
    // Process each lesson in the chapter
    for (const lessonData of chapterLessons) {
      const existingLesson = await findExistingLesson(lessonData.matchedLessonName);
      
      const lessonPlan = {
        lessonName: lessonData.lessonName,
        matchedLessonTitle: lessonData.matchedLessonName,
        matchedContent: lessonData.matchedContent,
        contentPreview: lessonData.matchedContent.substring(0, 100) + '...',
        existingLessonId: existingLesson?.id
      };
      
      chapterPlan.lessons.push(lessonPlan);
    }
    
    updatePlan.chapters.push(chapterPlan);
  }
  
  console.log(`✅ Database update plan built: ${updatePlan.chapters.length} chapters`);
  return updatePlan;
}

/**
 * Generate verification table for manual approval
 */
export async function generateVerificationTable(): Promise<VerificationTable[]> {
  console.log('📋 Generating verification table for manual approval...');
  
  const updatePlan = await buildDatabaseUpdatePlan();
  const verificationTable: VerificationTable[] = [];
  const seenLessons = new Set<string>();
  
  for (const chapter of updatePlan.chapters) {
    for (const lesson of chapter.lessons) {
      const lessonKey = lesson.matchedLessonTitle.toLowerCase();
      
      let status: 'MATCHED' | 'NO_MATCH' | 'DUPLICATE' = 'NO_MATCH';
      
      if (seenLessons.has(lessonKey)) {
        status = 'DUPLICATE';
      } else if (lesson.existingLessonId) {
        status = 'MATCHED';
      }
      
      seenLessons.add(lessonKey);
      
      verificationTable.push({
        chapterName: chapter.chapterName,
        lessonName: lesson.lessonName,
        matchedLessonTitle: lesson.matchedLessonTitle,
        contentPreview: lesson.contentPreview,
        status
      });
    }
  }
  
  console.log(`📊 Verification table generated: ${verificationTable.length} lessons`);
  return verificationTable;
}

/**
 * Verify database integrity and return current status
 */
export async function verifyDatabaseIntegrity(): Promise<{
  courseExists: boolean;
  totalChapters: number;
  totalLessons: number;
  totalLessonContent: number;
  publishedStatus: boolean;
}> {
  console.log('🔍 Verifying Big Baby course database integrity...');
  
  // Check if course exists
  const course = await db.select().from(courses)
    .where(eq(courses.title, 'Big Baby: 4–8 Months'))
    .limit(1);
  
  if (course.length === 0) {
    return {
      courseExists: false,
      totalChapters: 0,
      totalLessons: 0,
      totalLessonContent: 0,
      publishedStatus: false
    };
  }
  
  const courseId = course[0].id;
  
  // Count chapters
  const chapters = await db.select().from(courseChapters)
    .where(eq(courseChapters.courseId, courseId));
  
  // Count lessons
  const lessons = await db.select().from(courseLessons)
    .where(eq(courseLessons.courseId, courseId));
  
  // Count lesson content
  const content = await db.select().from(lessonContent)
    .innerJoin(courseLessons, eq(lessonContent.lessonId, courseLessons.id))
    .where(eq(courseLessons.courseId, courseId));
  
  return {
    courseExists: true,
    totalChapters: chapters.length,
    totalLessons: lessons.length,
    totalLessonContent: content.length,
    publishedStatus: course[0].status === 'published'
  };
}

/**
 * Execute database updates (ONLY after manual approval)
 */
export async function executeDatabaseUpdate(approved: boolean): Promise<{success: boolean, message: string}> {
  if (!approved) {
    return { success: false, message: 'Database update requires manual approval' };
  }
  
  console.log('🚀 Executing approved database update...');
  
  try {
    const updatePlan = await buildDatabaseUpdatePlan();
    let chaptersCreated = 0;
    let lessonsCreated = 0;
    let lessonContentCreated = 0;
    
    // First, ensure the course is properly configured as the single source of truth
    await db.update(courses)
      .set({
        title: 'Big Baby: 4–8 Months',
        description: 'Comprehensive sleep guidance for babies 4-8 months old',
        detailedDescription: 'Professional medical-grade content for baby sleep guidance from 4-8 months',
        category: 'sleep',
        ageRange: '4-8 Months',
        status: 'published',
        isPublished: true,
        updatedAt: new Date()
      })
      .where(eq(courses.id, updatePlan.courseId));
    
    for (let index = 0; index < updatePlan.chapters.length; index++) {
      const chapterPlan = updatePlan.chapters[index];
      
      // Create or update chapter
      const [chapter] = await db.insert(courseChapters).values({
        courseId: updatePlan.courseId,
        title: chapterPlan.chapterName,
        chapterNumber: chapterPlan.chapterNumber,
        orderIndex: index + 1
      }).onConflictDoUpdate({
        target: [courseChapters.courseId, courseChapters.chapterNumber],
        set: {
          title: chapterPlan.chapterName,
          orderIndex: index + 1
        }
      }).returning();
      
      chaptersCreated++;
      
      // Create lessons for this chapter
      for (let lessonIndex = 0; lessonIndex < chapterPlan.lessons.length; lessonIndex++) {
        const lessonPlan = chapterPlan.lessons[lessonIndex];
        
        // Create the lesson with description and basic info
        const [lesson] = await db.insert(courseLessons).values({
          courseId: updatePlan.courseId,
          chapterId: chapter.id,
          title: lessonPlan.matchedLessonTitle,
          description: `Lesson content for ${lessonPlan.matchedLessonTitle}`,
          content: lessonPlan.matchedContent,
          orderIndex: lessonIndex + 1,
          contentType: 'text',
          status: 'published'
        }).onConflictDoUpdate({
          target: [courseLessons.chapterId, courseLessons.orderIndex],
          set: {
            title: lessonPlan.matchedLessonTitle,
            content: lessonPlan.matchedContent,
            status: 'published'
          }
        }).returning();
        
        // Create detailed lesson content if we have rich content
        if (lessonPlan.matchedContent && lessonPlan.matchedContent.length > 100) {
          await db.insert(lessonContent).values({
            lessonId: lesson.id,
            title: `${lessonPlan.matchedLessonTitle} - Main Content`,
            description: `Detailed content for ${lessonPlan.matchedLessonTitle}`,
            content: lessonPlan.matchedContent,
            orderIndex: 1
          }).onConflictDoNothing();
          lessonContentCreated++;
        }
        
        lessonsCreated++;
      }
    }
    
    console.log(`✅ Database update completed: ${chaptersCreated} chapters, ${lessonsCreated} lessons, ${lessonContentCreated} lesson content items`);
    console.log(`📊 Big Baby course is now the single source of truth in the database`);
    
    return { 
      success: true, 
      message: `Successfully updated ${chaptersCreated} chapters, ${lessonsCreated} lessons, and ${lessonContentCreated} detailed content items. Big Baby course is now stored as the single source of truth in the database.` 
    };
    
  } catch (error) {
    console.error('❌ Database update failed:', error);
    return { 
      success: false, 
      message: `Database update failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}