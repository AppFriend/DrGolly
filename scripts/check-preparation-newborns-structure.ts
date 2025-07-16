import { db } from '../server/db';
import { courses, courseChapters } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function checkPreparationNewbornsStructure() {
  try {
    console.log('🔍 Checking Preparation for Newborns course structure...');
    
    // Find the Preparation for Newborns course
    const preparationCourse = await db.select().from(courses).where(eq(courses.title, 'Preparation for newborns'));
    if (preparationCourse.length === 0) {
      console.log('❌ Preparation for Newborns course not found');
      return;
    }
    
    console.log('✅ Preparation for Newborns course found:', preparationCourse[0].title);
    
    // Get all chapters for this course
    const chapters = await db.select().from(courseChapters)
      .where(eq(courseChapters.courseId, preparationCourse[0].id))
      .orderBy(courseChapters.orderIndex);
    
    console.log('\n📋 Current chapters in Preparation for Newborns:');
    chapters.forEach((chapter, index) => {
      console.log(`${index + 1}. ${chapter.title} (Order: ${chapter.orderIndex})`);
    });
    
    console.log('\n📊 Total chapters:', chapters.length);
    
    // Expected structure from the reference file
    const expectedChapters = [
      'Frequently Asked Questions',
      '1.21 Parental Wellbeing',
      '1.20 Pacifiers and Dummies',
      '1.19 Development',
      '1.18 Tummy Time',
      '1.17 Swaddling',
      '1.16 Bathing',
      '1.15 The Role of the Non-Breastfeeding Parent',
      '1.14 Settling and Unsettled Babies',
      '1.13 Tired Signs',
      '1.12 Hunger Signs',
      '1.11 Managing Common Breastfeeding Problems',
      '1.10 Babies and Breastmilk',
      '1.9 Maternal Nutrition',
      '1.8 Breastmilk vs Formula',
      '1.7 Rashes and Other Things',
      'Vomits, Spills, Possets and Reflux',
      '1.5 Winding and Burping',
      '1.4 Sleep Environment',
      '1.3 Awake Times',
      '1.2 Poo (stool, bowel action)',
      '1.1 What is Normal',
      'Newborn: 0-4 weeks'
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

checkPreparationNewbornsStructure()
  .then((result) => {
    console.log('\n🎉 Preparation for Newborns structure check completed');
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
    console.error('💥 Preparation for Newborns structure check failed:', error);
  });