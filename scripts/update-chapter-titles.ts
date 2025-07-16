import { db } from '../server/db';
import { courses, courseChapters } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function updateBigBabyChapterTitles() {
  try {
    console.log('🔧 Updating Big Baby Sleep Program chapter titles...');
    
    // Find the Big Baby Sleep Program course
    const bigBabyCourse = await db.select().from(courses).where(eq(courses.title, 'Big baby sleep program'));
    if (bigBabyCourse.length === 0) {
      console.log('❌ Big Baby Sleep Program not found');
      return;
    }
    
    console.log('✅ Big Baby Sleep Program found:', bigBabyCourse[0].title);
    
    // Get current chapters
    const currentChapters = await db.select().from(courseChapters)
      .where(eq(courseChapters.courseId, bigBabyCourse[0].id))
      .orderBy(courseChapters.orderIndex);
    
    console.log('\n📋 Current chapters:');
    currentChapters.forEach((chapter, index) => {
      console.log(`${index + 1}. ${chapter.title} (ID: ${chapter.id})`);
    });
    
    // Title mapping - from current to expected
    const titleMapping = {
      'Big Baby: 4-8 Months': 'Evidence Based Clinical Research and Clinical Experience',
      '1.1 Sleep environment': '1.1 Sleep Environment',
      '1.2 Introducing Solids': '1.2 Introducing Solids',
      '1.3 Routine': '1.3 Routine',
      '1.4 Sleep Cycles': '1.4 Sleep Cycles',
      '1.5 Settling Techniques': '1.5 Settling Techniques',
      '1.6 Role of the non breastfeeding parent': '1.6 Role of the Non-Breastfeeding Parent',
      '1.7 Winding, Burping & More': '1.7 Winding, Burping and More',
      '1.8 Development': '1.8 Development',
      '1.9 Teething': '1.9 Teething',
      '1.10 Bottle Refusal': '1.10 Bottle Refusal',
      '1.11 Tummy time & Activity': '1.11 Tummy Time & Activity',
      '1.12 Sleep Props: Dummies & comforters': '1.12 Sleep Props: Dummies & Comforters',
      '1.13 Daycare': '1.13 Daycare',
      '1.14 Travelling with Babies': '1.14 Travelling with Babies',
      '1.15 Parental Wellbeing': '1.15 Parental Wellbeing',
      '1.16 Troubleshooting & Other': '1.16 Troubleshooting & Other',
      'Evidence Based Research & Clinical Experience': 'Evidence Based Clinical Research and Clinical Experience'
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
      .where(eq(courseChapters.courseId, bigBabyCourse[0].id))
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

updateBigBabyChapterTitles()
  .then((result) => {
    console.log('\n🎉 Chapter titles update completed successfully!');
    if (result) {
      console.log(`✅ Updated ${result.updatedCount} chapters to match reference structure`);
    }
  })
  .catch((error) => {
    console.error('💥 Chapter titles update failed:', error);
  });