import { db } from '../server/db';
import { courses, courseChapters } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function updatePreparationNewbornsChapterTitles() {
  try {
    console.log('🔧 Updating Preparation for Newborns chapter titles...');
    
    // Find the Preparation for Newborns course
    const preparationCourse = await db.select().from(courses).where(eq(courses.title, 'Preparation for newborns'));
    if (preparationCourse.length === 0) {
      console.log('❌ Preparation for Newborns course not found');
      return;
    }
    
    console.log('✅ Preparation for Newborns course found:', preparationCourse[0].title);
    
    // Get current chapters
    const currentChapters = await db.select().from(courseChapters)
      .where(eq(courseChapters.courseId, preparationCourse[0].id))
      .orderBy(courseChapters.orderIndex);
    
    console.log('\n📋 Current chapters:');
    currentChapters.forEach((chapter, index) => {
      console.log(`${index + 1}. ${chapter.title} (ID: ${chapter.id})`);
    });
    
    // Title mapping - from current to expected based on reference file
    const titleMapping = {
      'Welcome - Newborn: 0-4 weeks': 'Newborn: 0-4 weeks',
      '1.1 What is Normal': '1.1 What is Normal',
      '1.2 Poo (stool, bowel action)': '1.2 Poo (stool, bowel action)',
      '1.3 Awake Times': '1.3 Awake Times',
      '1.4 Sleep Environment': '1.4 Sleep Environment',
      '1.6 Vomits, Spills, Possets & Reflux': 'Vomits, Spills, Possets and Reflux',
      '1.5 Winding and Burping': '1.5 Winding and Burping',
      '1.7 Rashes and Other Things': '1.7 Rashes and Other Things',
      '1.8 Breastmilk vs Formula': '1.8 Breastmilk vs Formula',
      '1.9 Maternal Nutrition': '1.9 Maternal Nutrition',
      '1.10 Babies and Breastmilk': '1.10 Babies and Breastmilk',
      '1.11 Managing Common Breastfeeding Problems': '1.11 Managing Common Breastfeeding Problems',
      '1.12 Hunger Signs': '1.12 Hunger Signs',
      '1.13 Tired Signs': '1.13 Tired Signs',
      '1.14 Settling and Unsettled Babies': '1.14 Settling and Unsettled Babies',
      '1.15 The Role of the Non-Breastfeeding Parent': '1.15 The Role of the Non-Breastfeeding Parent',
      '1.16 Bathing': '1.16 Bathing',
      '1.17 Swaddling': '1.17 Swaddling',
      '1.18 Tummy Time': '1.18 Tummy Time',
      '1.19 Development': '1.19 Development',
      '1.20 Pacifiers and Dummies': '1.20 Pacifiers and Dummies',
      '1.21 Parental Wellbeing': '1.21 Parental Wellbeing',
      'FAQs': 'Frequently Asked Questions',
      'Evidence Based Research & Clinical Experience': 'DELETE_THIS_CHAPTER'
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
      .where(eq(courseChapters.courseId, preparationCourse[0].id))
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

updatePreparationNewbornsChapterTitles()
  .then((result) => {
    console.log('\n🎉 Preparation for Newborns chapter titles update completed successfully!');
    if (result) {
      console.log(`✅ Updated ${result.updatedCount} chapters to match reference structure`);
    }
  })
  .catch((error) => {
    console.error('💥 Preparation for Newborns chapter titles update failed:', error);
  });