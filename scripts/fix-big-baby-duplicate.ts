import { db } from '../server/db';
import { courses, courseChapters, courseLessons } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function fixBigBabyDuplicate() {
  try {
    console.log('🔧 Fixing Big Baby Sleep Program duplicate chapter...');
    
    // Find the Big Baby Sleep Program course
    const bigBabyCourse = await db.select().from(courses).where(eq(courses.title, 'Big baby sleep program'));
    if (bigBabyCourse.length === 0) {
      console.log('❌ Big Baby Sleep Program not found');
      return;
    }
    
    console.log('✅ Big Baby Sleep Program found:', bigBabyCourse[0].title);
    
    // Find duplicate "Evidence Based Clinical Research and Clinical Experience" chapters
    const duplicateChapters = await db.select().from(courseChapters)
      .where(eq(courseChapters.courseId, bigBabyCourse[0].id))
      .where(eq(courseChapters.title, 'Evidence Based Clinical Research and Clinical Experience'));
    
    console.log(`🔍 Found ${duplicateChapters.length} chapters with this title`);
    
    if (duplicateChapters.length > 1) {
      // Keep the first one (order index 1), delete the rest
      const chaptersToDelete = duplicateChapters.slice(1);
      
      for (const chapter of chaptersToDelete) {
        console.log(`🗑️ Deleting duplicate chapter: ${chapter.title} (ID: ${chapter.id}, Order: ${chapter.orderIndex})`);
        
        // Delete lessons first
        await db.delete(courseLessons).where(eq(courseLessons.chapterId, chapter.id));
        console.log(`🗑️ Deleted lessons for chapter ID: ${chapter.id}`);
        
        // Delete the chapter
        await db.delete(courseChapters).where(eq(courseChapters.id, chapter.id));
        console.log(`✅ Deleted duplicate chapter`);
      }
      
      console.log(`📊 Deleted ${chaptersToDelete.length} duplicate chapters`);
    } else {
      console.log('✅ No duplicate chapters found');
    }
    
    // Verify final structure
    const finalChapters = await db.select().from(courseChapters)
      .where(eq(courseChapters.courseId, bigBabyCourse[0].id))
      .orderBy(courseChapters.orderIndex);
    
    console.log('\n📋 Final Big Baby Sleep Program structure:');
    finalChapters.forEach((chapter, index) => {
      console.log(`${index + 1}. ${chapter.title} (Order: ${chapter.orderIndex})`);
    });
    
    console.log(`\n📊 Total chapters: ${finalChapters.length}`);
    
    return {
      success: true,
      totalChapters: finalChapters.length,
      duplicatesRemoved: duplicateChapters.length > 1 ? duplicateChapters.length - 1 : 0
    };
    
  } catch (error) {
    console.error('❌ Error fixing Big Baby duplicate:', error);
    throw error;
  }
}

fixBigBabyDuplicate()
  .then((result) => {
    console.log('\n🎉 Big Baby Sleep Program duplicate fix completed!');
    if (result) {
      console.log(`✅ Final structure has ${result.totalChapters} chapters`);
      console.log(`🗑️ Removed ${result.duplicatesRemoved} duplicate chapters`);
    }
  })
  .catch((error) => {
    console.error('💥 Big Baby duplicate fix failed:', error);
  });