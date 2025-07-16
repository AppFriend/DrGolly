import { db } from '../server/db';
import { courses, courseChapters, courseLessons } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function cleanPreparationChapters() {
  try {
    console.log('🧹 Cleaning Preparation for Newborns chapters...');
    
    // Find the Preparation for Newborns course
    const preparationCourse = await db.select().from(courses).where(eq(courses.title, 'Preparation for newborns'));
    if (preparationCourse.length === 0) {
      console.log('❌ Preparation for Newborns course not found');
      return;
    }
    
    console.log('✅ Preparation for Newborns course found:', preparationCourse[0].title);
    
    // Find the chapter marked for deletion
    const chapterToDelete = await db.select().from(courseChapters)
      .where(eq(courseChapters.courseId, preparationCourse[0].id))
      .where(eq(courseChapters.title, 'DELETE_THIS_CHAPTER'));
    
    if (chapterToDelete.length === 0) {
      console.log('❌ Chapter marked for deletion not found');
      return;
    }
    
    console.log('🗑️ Found chapter to delete:', chapterToDelete[0].title, '(ID:', chapterToDelete[0].id, ')');
    
    // First, delete all lessons associated with this chapter
    const lessonsToDelete = await db.select().from(courseLessons)
      .where(eq(courseLessons.chapterId, chapterToDelete[0].id));
    
    if (lessonsToDelete.length > 0) {
      console.log(`📚 Deleting ${lessonsToDelete.length} associated lessons...`);
      await db.delete(courseLessons)
        .where(eq(courseLessons.chapterId, chapterToDelete[0].id));
      console.log('✅ Lessons deleted successfully');
    }
    
    // Now delete the chapter
    await db.delete(courseChapters)
      .where(eq(courseChapters.id, chapterToDelete[0].id));
    
    console.log('✅ Chapter deleted successfully');
    
    // Verify the final structure
    const finalChapters = await db.select().from(courseChapters)
      .where(eq(courseChapters.courseId, preparationCourse[0].id))
      .orderBy(courseChapters.orderIndex);
    
    console.log('\n📋 Final chapters structure:');
    finalChapters.forEach((chapter, index) => {
      console.log(`${index + 1}. ${chapter.title}`);
    });
    
    console.log('\n📊 Final summary:');
    console.log(`✅ Total chapters: ${finalChapters.length}`);
    console.log(`✅ Deleted 1 unwanted chapter`);
    
    return {
      success: true,
      deletedChapterCount: 1,
      totalChapters: finalChapters.length,
      chapters: finalChapters
    };
    
  } catch (error) {
    console.error('❌ Error cleaning chapters:', error);
    throw error;
  }
}

cleanPreparationChapters()
  .then((result) => {
    console.log('\n🎉 Preparation for Newborns chapter cleanup completed successfully!');
    if (result) {
      console.log(`✅ Final structure has ${result.totalChapters} chapters`);
    }
  })
  .catch((error) => {
    console.error('💥 Chapter cleanup failed:', error);
  });