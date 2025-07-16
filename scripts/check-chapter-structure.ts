import { db } from '../server/db';
import { courses, courseChapters } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function checkBigBabyStructure() {
  try {
    console.log('🔍 Checking Big Baby Sleep Program structure...');
    
    // Find the Big Baby Sleep Program course
    const bigBabyCourse = await db.select().from(courses).where(eq(courses.title, 'Big baby sleep program'));
    if (bigBabyCourse.length === 0) {
      console.log('❌ Big Baby Sleep Program not found');
      return;
    }
    
    console.log('✅ Big Baby Sleep Program found:', bigBabyCourse[0].title);
    
    // Get all chapters for this course
    const chapters = await db.select().from(courseChapters)
      .where(eq(courseChapters.courseId, bigBabyCourse[0].id))
      .orderBy(courseChapters.orderIndex);
    
    console.log('\n📋 Current chapters in Big Baby Sleep Program:');
    chapters.forEach((chapter, index) => {
      console.log(`${index + 1}. ${chapter.title} (Order: ${chapter.orderIndex})`);
    });
    
    console.log('\n📊 Total chapters:', chapters.length);
    
    // Expected structure from the reference file
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
      currentChapters: chapters
    };
    
  } catch (error) {
    console.error('❌ Error checking structure:', error);
    throw error;
  }
}

checkBigBabyStructure()
  .then((result) => {
    console.log('\n🎉 Structure check completed');
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
    console.error('💥 Structure check failed:', error);
  });