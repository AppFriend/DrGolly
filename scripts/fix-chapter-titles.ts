import { db } from '../server/db';
import { courses, courseChapters } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function fixBigBabyChapterTitles() {
  try {
    console.log('🔧 Fixing Big Baby Sleep Program chapter titles...');
    
    // Find the Big Baby Sleep Program course
    const bigBabyCourse = await db.select().from(courses).where(eq(courses.title, 'Big baby sleep program'));
    if (bigBabyCourse.length === 0) {
      console.log('❌ Big Baby Sleep Program not found');
      return;
    }
    
    console.log('✅ Big Baby Sleep Program found:', bigBabyCourse[0].title);
    
    // Expected chapter structure from reference file (in reverse order from file)
    const expectedChapters = [
      'Evidence Based Clinical Research and Clinical Experience',
      '1.16 Troubleshooting & Other',
      '1.15 Parental Wellbeing',
      '1.14 Travelling with Babies',
      '1.13 Daycare',
      '1.12 Sleep Props: Dummies & Comforters',
      '1.11 Tummy Time & Activity',
      '1.10 Bottle Refusal',
      '1.9 Teething',
      '1.8 Development',
      '1.7 Winding, Burping and More',
      '1.6 Role of the Non-Breastfeeding Parent',
      '1.5 Settling Techniques',
      '1.4 Sleep Cycles',
      '1.3 Routine',
      '1.2 Introducing Solids',
      '1.1 Sleep Environment'
    ];
    
    // Get current chapters
    const currentChapters = await db.select().from(courseChapters)
      .where(eq(courseChapters.courseId, bigBabyCourse[0].id))
      .orderBy(courseChapters.orderIndex);
    
    console.log('\n📋 Current chapters before fix:');
    currentChapters.forEach((chapter, index) => {
      console.log(`${index + 1}. ${chapter.title}`);
    });
    
    // Delete all existing chapters for this course
    console.log('\n🗑️ Deleting existing chapters...');
    await db.delete(courseChapters).where(eq(courseChapters.courseId, bigBabyCourse[0].id));
    
    // Insert new chapters with correct titles and order
    console.log('\n➕ Creating new chapters with correct titles...');
    const newChapters = [];
    
    for (let i = 0; i < expectedChapters.length; i++) {
      const newChapter = {
        courseId: bigBabyCourse[0].id,
        title: expectedChapters[i],
        orderIndex: i + 1
      };
      
      const [insertedChapter] = await db.insert(courseChapters)
        .values(newChapter)
        .returning();
      
      newChapters.push(insertedChapter);
      console.log(`✅ Created: ${insertedChapter.title} (Order: ${insertedChapter.orderIndex})`);
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Created ${newChapters.length} chapters`);
    console.log(`✅ All chapters now match the reference structure exactly`);
    
    return {
      success: true,
      totalChapters: newChapters.length,
      chapters: newChapters
    };
    
  } catch (error) {
    console.error('❌ Error fixing chapter titles:', error);
    throw error;
  }
}

fixBigBabyChapterTitles()
  .then((result) => {
    console.log('\n🎉 Chapter titles fix completed successfully!');
    if (result) {
      console.log('✅ All Big Baby Sleep Program chapters now match the reference structure');
    }
  })
  .catch((error) => {
    console.error('💥 Chapter titles fix failed:', error);
  });