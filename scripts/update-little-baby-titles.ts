import { db } from '../server/db';
import { courses, courseChapters } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function updateLittleBabyChapterTitles() {
  try {
    console.log('🔧 Updating Little Baby Sleep Program chapter titles...');
    
    // Find the Little Baby Sleep Program course
    const littleBabyCourse = await db.select().from(courses).where(eq(courses.title, 'Little baby sleep program'));
    if (littleBabyCourse.length === 0) {
      console.log('❌ Little Baby Sleep Program not found');
      return;
    }
    
    console.log('✅ Little Baby Sleep Program found:', littleBabyCourse[0].title);
    
    // Get current chapters
    const currentChapters = await db.select().from(courseChapters)
      .where(eq(courseChapters.courseId, littleBabyCourse[0].id))
      .orderBy(courseChapters.orderIndex);
    
    console.log('\n📋 Current chapters:');
    currentChapters.forEach((chapter, index) => {
      console.log(`${index + 1}. ${chapter.title} (ID: ${chapter.id})`);
    });
    
    // Title mapping - from current to expected
    const titleMapping = {
      'Welcome - Little Baby: 4-16 Weeks': 'Evidence Based Clinical Research & Clinical Experience',
      '1.1 Sleep Environment': '1.1 Sleep Environment',
      '1.2 Swaddling': '1.2 Swaddling',
      '1.3 Wind and Burping': '1.3 Wind and Burping',
      '1.4 Tired Signs': '1.4 Tired Signs',
      '1.5 Awake Times': '1.5 Awake Times',
      '1.6 Routine': '1.6 Routine',
      '1.7 Sleep Cycles': '1.7 Sleep Cycles',
      '1.8 Settling and Calming Babies': '1.8 Settling and Calming Babies',
      '1.9 The Role of Dads and Non-Breastfeeding Parents': '1.9 The Role of Dads and Non-Breastfeeding Parents',
      '1.10 Breastmilk and Formula': '1.10 Breastmilk and Formula',
      '1.11 Maternal Nutrition': '1.11 Maternal Nutrition',
      '1.12 Babies & Milk': '1.12 Babies & Milk',
      '1.13 Managing Common Breastfeeding Problems': '1.13 Managing Common Breastfeeding Problems',
      '1.14 Development': '1.14 Development',
      '1.15 Possets, Vomit, Spills and Reflux': '1.15 Possets, Vomit, Spills and Reflux',
      '1.16 Getting Out of the House': '1.16 Getting Out of the House',
      '1.17 Parental Wellbeing': '1.17 Parental Wellbeing',
      '1.18 Bottle Rejection': 'Bottle Rejection',
      '1.19 Travelling with Little Babies': '1.19 Travelling with Little Babies',
      '1.20 Troubleshooting and Other': '1.20 Troubleshooting and Other',
      'Evidence based research & clinical experience': 'Evidence Based Clinical Research & Clinical Experience'
    };
    
    // Update each chapter title
    console.log('\n🔄 Updating chapter titles...');
    let updatedCount = 0;
    
    for (const chapter of currentChapters) {
      const newTitle = titleMapping[chapter.title];
      if (newTitle && newTitle !== chapter.title) {
        await db.update(courseChapters)
          .set({ title: newTitle })
          .where(eq(courseChapters.id, chapter.id));
        
        console.log(`✅ Updated: "${chapter.title}" → "${newTitle}"`);
        updatedCount++;
      } else if (newTitle === chapter.title) {
        console.log(`✓ No change needed: "${chapter.title}"`);
      } else {
        console.log(`⚠️ No mapping found for: "${chapter.title}"`);
      }
    }
    
    // Get updated chapters to verify
    const updatedChapters = await db.select().from(courseChapters)
      .where(eq(courseChapters.courseId, littleBabyCourse[0].id))
      .orderBy(courseChapters.orderIndex);
    
    console.log('\n📋 Updated chapters:');
    updatedChapters.forEach((chapter, index) => {
      console.log(`${index + 1}. ${chapter.title}`);
    });
    
    console.log('\n📊 Summary:');
    console.log(`✅ Updated ${updatedCount} chapter titles`);
    console.log(`✅ Total chapters: ${updatedChapters.length}`);
    
    return {
      success: true,
      updatedCount,
      totalChapters: updatedChapters.length,
      chapters: updatedChapters
    };
    
  } catch (error) {
    console.error('❌ Error updating chapter titles:', error);
    throw error;
  }
}

updateLittleBabyChapterTitles()
  .then((result) => {
    console.log('\n🎉 Little Baby chapter titles update completed successfully!');
    if (result) {
      console.log(`✅ Updated ${result.updatedCount} chapters to match reference structure`);
    }
  })
  .catch((error) => {
    console.error('💥 Little Baby chapter titles update failed:', error);
  });