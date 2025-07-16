import { db } from '../server/db';
import { courseLessons, courses } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function diagnoseLessonContent() {
  try {
    console.log('🔍 DIAGNOSTIC: Analyzing current lesson content for AI contamination...');
    
    // Get all lessons with course information
    const lessonsWithCourses = await db
      .select({
        lessonId: courseLessons.id,
        lessonTitle: courseLessons.title,
        lessonContent: courseLessons.content,
        courseId: courseLessons.courseId,
        courseTitle: courses.title
      })
      .from(courseLessons)
      .innerJoin(courses, eq(courseLessons.courseId, courses.id))
      .orderBy(courses.title, courseLessons.title);
    
    console.log(`📊 Total lessons found: ${lessonsWithCourses.length}`);
    
    // Analyze content for AI patterns
    const aiPatterns = [
      'Creating the Optimal Sleep Environment',
      'Safe Sleep Guidelines',
      'Following safe sleep practices is essential',
      'The sleep environment plays a crucial',
      'Swaddling the legs can impede proper hip development',
      'When to Stop Swaddling',
      'It is important to swaddle'
    ];
    
    let suspiciousLessons = 0;
    let emptyLessons = 0;
    let validLessons = 0;
    
    const suspiciousResults: any[] = [];
    const emptyResults: any[] = [];
    
    for (const lesson of lessonsWithCourses) {
      const content = lesson.lessonContent || '';
      
      if (!content || content.trim().length === 0) {
        emptyLessons++;
        emptyResults.push({
          course: lesson.courseTitle,
          lesson: lesson.lessonTitle,
          id: lesson.lessonId
        });
      } else {
        // Check for AI-generated patterns
        const hasSuspiciousContent = aiPatterns.some(pattern => 
          content.includes(pattern)
        );
        
        if (hasSuspiciousContent) {
          suspiciousLessons++;
          suspiciousResults.push({
            course: lesson.courseTitle,
            lesson: lesson.lessonTitle,
            id: lesson.lessonId,
            suspiciousPatterns: aiPatterns.filter(pattern => content.includes(pattern))
          });
        } else {
          validLessons++;
        }
      }
    }
    
    console.log('\n📊 CONTENT INTEGRITY ANALYSIS:');
    console.log(`✅ Valid lessons: ${validLessons}`);
    console.log(`⚠️  Suspicious (AI-generated): ${suspiciousLessons}`);
    console.log(`❌ Empty lessons: ${emptyLessons}`);
    
    if (suspiciousLessons > 0) {
      console.log('\n❌ SUSPICIOUS LESSONS (AI-GENERATED CONTENT):');
      suspiciousResults.forEach(result => {
        console.log(`  - ${result.course} > ${result.lesson} (ID: ${result.id})`);
        console.log(`    Patterns: ${result.suspiciousPatterns.join(', ')}`);
      });
    }
    
    if (emptyLessons > 0) {
      console.log('\n⚠️  EMPTY LESSONS:');
      emptyResults.forEach(result => {
        console.log(`  - ${result.course} > ${result.lesson} (ID: ${result.id})`);
      });
    }
    
    // Sample suspicious content
    if (suspiciousResults.length > 0) {
      console.log('\n🔍 SAMPLE SUSPICIOUS CONTENT:');
      const sample = lessonsWithCourses.find(l => l.lessonId === suspiciousResults[0].id);
      if (sample) {
        console.log(`Title: ${sample.lessonTitle}`);
        console.log(`Content preview: ${sample.lessonContent?.substring(0, 200)}...`);
      }
    }
    
    return {
      total: lessonsWithCourses.length,
      valid: validLessons,
      suspicious: suspiciousLessons,
      empty: emptyLessons,
      suspiciousResults,
      emptyResults
    };
    
  } catch (error) {
    console.error('❌ Error diagnosing lesson content:', error);
    throw error;
  }
}

diagnoseLessonContent()
  .then((result) => {
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log(`📊 Content integrity: ${result.valid}/${result.total} lessons verified`);
    console.log(`⚠️  Requires restoration: ${result.suspicious + result.empty} lessons`);
  })
  .catch((error) => {
    console.error('💥 Diagnosis failed:', error);
  });