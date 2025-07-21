import { db } from '../server/db';
import { courses, courseChapters } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function checkLittleBabyStructure() {
  try {
    console.log('🔍 Checking Little Baby Sleep Program structure...');
    
    // Find the Little Baby Sleep Program course
    const littleBabyCourse = await db.select().from(courses).where(eq(courses.title, 'Little baby sleep program'));
    if (littleBabyCourse.length === 0) {
      console.log('❌ Little Baby Sleep Program not found');
      return;
    }
    
    console.log('✅ Little Baby Sleep Program found:', littleBabyCourse[0].title);
    
    // Get all chapters for this course
    const chapters = await db.select().from(courseChapters)
      .where(eq(courseChapters.courseId, littleBabyCourse[0].id))
      .orderBy(courseChapters.orderIndex);
    
    console.log('\n📋 Current chapters in Little Baby Sleep Program:');
    chapters.forEach((chapter, index) => {
      console.log(`${index + 1}. ${chapter.title} (Order: ${chapter.orderIndex})`);
    });
    
    console.log('\n📊 Total chapters:', chapters.length);
    
    // Expected structure from the reference file
    const expectedChapters = [
      'Evidence Based Clinical Research & Clinical Experience',
      '1.20 Troubleshooting and Other',
      '1.19 Travelling with Little Babies',
      'Bottle Rejection',
      '1.17 Parental Wellbeing',
      '1.16 Getting Out of the House',
      '1.15 Possets, Vomit, Spills and Reflux',
      '1.14 Development',
      '1.13 Managing Common Breastfeeding Problems',
      '1.12 Babies & Milk',
      '1.11 Maternal Nutrition',
      '1.10 Breastmilk and Formula',
      '1.9 The Role of Dads and Non-Breastfeeding Parents',
      '1.8 Settling and Calming Babies',
      '1.7 Sleep Cycles',
      '1.6 Routine',
      '1.5 Awake Times',
      '1.4 Tired Signs',
      '1.3 Wind and Burping',
      '1.2 Swaddling',
      '1.1 Sleep Environment'
    ];
    
    console.log('\n📌 Expected chapters from reference file:');
    expectedChapters.forEach((title, index) => {
      console.log(`${index + 1}. ${title}`);
    });
    
    // Compare current vs expected
    console.log('\n🔍 Comparison Analysis:');
    console.log('Expected chapters:', expectedChapters.length);
    console.log('Current chapters:', chapters.length);
    
    // Check for missing chapters
    const currentTitles = chapters.map(c => c.title);
    const missingChapters = expectedChapters.filter(title => !currentTitles.includes(title));
    const extraChapters = currentTitles.filter(title => !expectedChapters.includes(title));
    
    if (missingChapters.length > 0) {
      console.log('\n❌ Missing chapters:');
      missingChapters.forEach(title => console.log(`  - ${title}`));
    }
    
    if (extraChapters.length > 0) {
      console.log('\n⚠️ Extra chapters (not in reference):');
      extraChapters.forEach(title => console.log(`  - ${title}`));
    }
    
    if (missingChapters.length === 0 && extraChapters.length === 0) {
      console.log('\n✅ All chapters match the expected structure!');
    }
    
    return {
      totalExpected: expectedChapters.length,
      totalCurrent: chapters.length,
      missingChapters,
      extraChapters,
      currentChapters: chapters,
      expectedChapters
    };
    
  } catch (error) {
    console.error('❌ Error checking structure:', error);
    throw error;
  }
}

checkLittleBabyStructure()
  .then((result) => {
    console.log('\n🎉 Little Baby structure check completed');
    if (result) {
      console.log('Result:', {
        expectedCount: result.totalExpected,
        currentCount: result.totalCurrent,
        missingCount: result.missingChapters.length,
        extraCount: result.extraChapters.length
      });
    }
  })
  .catch((error) => {
    console.error('💥 Little Baby structure check failed:', error);
  });