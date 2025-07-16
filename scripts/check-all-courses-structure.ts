import { db } from '../server/db';
import { courses, courseChapters } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function checkAllCoursesStructure() {
  try {
    console.log('🔍 Checking all courses structure...');
    
    // Get all courses
    const allCourses = await db.select().from(courses);
    
    console.log('📋 Found courses:');
    allCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title} (ID: ${course.id})`);
    });
    
    // Check each course structure
    for (const course of allCourses) {
      console.log(`\n🔍 Checking course: ${course.title}`);
      
      const chapters = await db.select().from(courseChapters)
        .where(eq(courseChapters.courseId, course.id))
        .orderBy(courseChapters.orderIndex);
      
      console.log(`📊 Total chapters: ${chapters.length}`);
      
      if (chapters.length > 0) {
        console.log('📋 Chapter structure:');
        chapters.forEach((chapter, index) => {
          console.log(`  ${index + 1}. ${chapter.title} (Order: ${chapter.orderIndex})`);
        });
      } else {
        console.log('❌ No chapters found');
      }
    }
    
    return {
      success: true,
      totalCourses: allCourses.length,
      courses: allCourses
    };
    
  } catch (error) {
    console.error('❌ Error checking courses structure:', error);
    throw error;
  }
}

checkAllCoursesStructure()
  .then((result) => {
    console.log('\n🎉 All courses structure check completed');
    if (result) {
      console.log(`✅ Checked ${result.totalCourses} courses`);
    }
  })
  .catch((error) => {
    console.error('💥 All courses structure check failed:', error);
  });