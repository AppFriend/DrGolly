import { db } from '../server/db';
import { courses, courseChapters, courseLessons } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Course structure mappings from reference file
const courseStructures = {
  'Testing allergens': [
    'Be empowered not alarmed',
    'Tracking Allergy Reactions',
    'What should I do if I think my baby is having an allergic reaction?'
  ],
  'Toddler toolkit': [
    'Academic Papers',
    '15.0 New Sibling',
    '14.0 Body Awareness',
    '13.0 Anxiety',
    '12.0 Other Caregivers',
    '11.0 Screen Time',
    '10.0 Development',
    '9.0 Toilet Training',
    '8.0 Transitions',
    '7.0 Nitty Gritty',
    '6.0 Fussy Eating and Nutrition',
    '5.0 Aggression and Power Struggles',
    '4.0 Tantrums and Meltdowns',
    '3.0 Triggers and Responses',
    '2.0 Growing Autonomy',
    '1.0 Parenting Styles and Discipline',
    'Introduction'
  ],
  'Twins supplement': [
    '1.7 Getting Time Out',
    '1.7 Helpful Twin Resources',
    '1.6 Helpful Products',
    '1.5 Age Correction',
    '1.4 Sleep Environment',
    '1.3 Settling',
    '1.2 Twin Routines',
    '1.1 Feeding Twins',
    'Twins Supplement'
  ],
  'New sibling supplement': [
    '1.7 Coping Strategies',
    '1.6 Bathing Two or More Children',
    '1.5 Sleep and Routines',
    'Breastfeeding and Mealtimes',
    '1.3 Safety',
    '1.2 Challenging Behaviour and Jealousy',
    '1.1 Preparing Your Toddler for a New Sibling',
    'New Sibling Supplement'
  ],
  'Pre-school sleep program': [
    'Evidence Based Clinical Research and Clinical Experience',
    '1.10 Troubleshooting',
    '1.9 Parental Wellbeing',
    '1.8 Kinder Transition',
    '1.7 Getting Out',
    '1.6 Development',
    '1.5 Nutrition',
    '1.4 Settling Techniques for Pre-Schoolers',
    '1.3 Nightmares and Night Terrors',
    '1.2 Routine',
    '1.1 Sleep Environment',
    'Pre-School: 2-5 Years'
  ],
  'Toddler sleep program': [
    'Evidence Based Clinical Research & Clinical Experience',
    '1.11 Troubleshooting',
    '1.10 Parental Wellbeing',
    '1.9 Getting Out, Activities and Daycare',
    '1.8 Development',
    '1.7 Screen Time',
    '1.6 Nutrition',
    '1.5 Sleep Props',
    '1.4 Sleep Cycles',
    '1.3 Settling Techniques',
    '1.2 Routine',
    '1.1 Sleep Environment',
    'Toddler: 12-18 Months'
  ],
  'Pre-toddler sleep program': [
    'Evidence Based Clinical Research & Clinical Experience',
    '1.14 Troublshooting',
    '1.13 Parental Wellbeing',
    '1.12 Bottle Refusal',
    '1.11 Daycare',
    '1.10 Activities, Getting Out & Travelling with Babies',
    '1.9 Teething',
    '1.8 Development',
    '1.7 Nutrition',
    '1.6 Sleep Props',
    '1.5 Role of the Non-Breastfeeding Parent',
    '1.4 Settling Techniques',
    '1.3 Sleep Cycles',
    '1.2 Routine',
    '1.1 Sleep Environment',
    'Pre Toddler: 8-12 Months'
  ]
};

async function updateAllRemainingCourses() {
  try {
    console.log('🔧 Updating all remaining courses to match reference structure...');
    
    let totalUpdated = 0;
    let totalDeleted = 0;
    
    for (const [courseTitle, expectedChapters] of Object.entries(courseStructures)) {
      console.log(`\n📚 Processing course: ${courseTitle}`);
      
      // Find the course
      const course = await db.select().from(courses).where(eq(courses.title, courseTitle));
      if (course.length === 0) {
        console.log(`❌ Course "${courseTitle}" not found`);
        continue;
      }
      
      console.log(`✅ Found course: ${course[0].title} (ID: ${course[0].id})`);
      
      // Get current chapters
      const currentChapters = await db.select().from(courseChapters)
        .where(eq(courseChapters.courseId, course[0].id))
        .orderBy(courseChapters.orderIndex);
      
      console.log(`📋 Current chapters: ${currentChapters.length}`);
      console.log(`📋 Expected chapters: ${expectedChapters.length}`);
      
      // Delete all existing chapters and their lessons
      for (const chapter of currentChapters) {
        // Delete lessons first
        await db.delete(courseLessons).where(eq(courseLessons.chapterId, chapter.id));
        console.log(`🗑️ Deleted lessons for chapter: ${chapter.title}`);
      }
      
      // Delete all chapters
      await db.delete(courseChapters).where(eq(courseChapters.courseId, course[0].id));
      console.log(`🗑️ Deleted ${currentChapters.length} existing chapters`);
      totalDeleted += currentChapters.length;
      
      // Create new chapters with correct structure
      console.log('➕ Creating new chapters...');
      for (let i = 0; i < expectedChapters.length; i++) {
        const newChapter = {
          courseId: course[0].id,
          title: expectedChapters[i],
          orderIndex: i
        };
        
        const [insertedChapter] = await db.insert(courseChapters)
          .values(newChapter)
          .returning();
        
        console.log(`✅ Created: ${insertedChapter.title} (Order: ${insertedChapter.orderIndex})`);
        totalUpdated++;
      }
      
      console.log(`📊 Course "${courseTitle}" updated: ${expectedChapters.length} chapters created`);
    }
    
    console.log('\n📊 Overall Summary:');
    console.log(`✅ Total chapters created: ${totalUpdated}`);
    console.log(`🗑️ Total chapters deleted: ${totalDeleted}`);
    console.log(`📚 Courses updated: ${Object.keys(courseStructures).length}`);
    
    return {
      success: true,
      totalUpdated,
      totalDeleted,
      coursesUpdated: Object.keys(courseStructures).length
    };
    
  } catch (error) {
    console.error('❌ Error updating courses:', error);
    throw error;
  }
}

updateAllRemainingCourses()
  .then((result) => {
    console.log('\n🎉 All remaining courses updated successfully!');
    if (result) {
      console.log(`✅ Updated ${result.coursesUpdated} courses with ${result.totalUpdated} chapters`);
    }
  })
  .catch((error) => {
    console.error('💥 Course update failed:', error);
  });