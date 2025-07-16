import { db } from '../server/db';
import { courses, courseChapters } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Title mappings for each course
const courseTitleMappings = {
  'Testing allergens': {
    'What should I do if I think my baby is having an allergic reaction?': 'Be empowered not alarmed'
  },
  'Toddler toolkit': {
    '1.0 Introduction - Toddler Toolkit': 'Introduction',
    '2.0 Parenting Styles and Discipline': '1.0 Parenting Styles and Discipline',
    '3.0 Growing Autonomy': '2.0 Growing Autonomy',
    '4.0 Triggers and Responses': '3.0 Triggers and Responses',
    '5.0 Tantrums and Meltdowns': '4.0 Tantrums and Meltdowns',
    '6.0 Aggression and Power Struggles': '5.0 Aggression and Power Struggles',
    '7.0 Fussy Eating and Nutrition': '6.0 Fussy Eating and Nutrition',
    '8.0 Nitty Gritty': '7.0 Nitty Gritty',
    '9.0 Transitions': '8.0 Transitions',
    '10.0 Toilet Training': '9.0 Toilet Training',
    '11.0 Development': '10.0 Development',
    '12.0 Screen Time': '11.0 Screen Time',
    '13.0 Other Caregivers': '12.0 Other Caregivers',
    '14.0 Anxiety': '13.0 Anxiety',
    '15.0 Body Awareness': '14.0 Body Awareness',
    '16.0 New Sibling': '15.0 New Sibling',
    '17.0 Academic Papers': 'Academic Papers'
  },
  'Twins supplement': {
    'Welcome - Twins Supplement': 'Twins Supplement',
    '1.1 Feeding Twins': '1.1 Feeding Twins',
    '1.2 Twin Routines': '1.2 Twin Routines',
    '1.3 Settling': '1.3 Settling',
    '1.4 Sleep Environment': '1.4 Sleep Environment',
    '1.5 Age Correction': '1.5 Age Correction',
    '1.6 Helpful Products': '1.6 Helpful Products',
    '1.7 Helpful Twin Resources': '1.7 Helpful Twin Resources',
    '1.8 Getting Time Out': '1.7 Getting Time Out'
  },
  'New sibling supplement': {
    'Welcome - New Sibling Supplement': 'New Sibling Supplement',
    '1.1 Preparing Your Toddler for a New Sibling': '1.1 Preparing Your Toddler for a New Sibling',
    '1.2 Challenging Behaviour and Jealousy': '1.2 Challenging Behaviour and Jealousy',
    '1.3 Safety': '1.3 Safety',
    '1.4 Breastfeeding and Mealtimes': 'Breastfeeding and Mealtimes',
    '1.5 Sleep and Routines': '1.5 Sleep and Routines',
    '1.6 Bathing Two or More Children': '1.6 Bathing Two or More Children',
    '1.7 Coping Strategies': '1.7 Coping Strategies'
  },
  'Pre-school sleep program': {
    'Welcome Pre-School: 2-5 Years': 'Pre-School: 2-5 Years',
    '1.1 Sleep Environment': '1.1 Sleep Environment',
    '1.2 Routine': '1.2 Routine',
    '1.3 Nightmares and Night Terrors': '1.3 Nightmares and Night Terrors',
    '1.4 Settling Techniques for Pre-Schoolers': '1.4 Settling Techniques for Pre-Schoolers',
    '1.5 Nutrition': '1.5 Nutrition',
    '1.6 Development': '1.6 Development',
    '1.7 Getting Out': '1.7 Getting Out',
    '1.8 Kinder Transition': '1.8 Kinder Transition',
    '1.9 Parental Wellbeing': '1.9 Parental Wellbeing',
    '1.10 Troubleshooting': '1.10 Troubleshooting',
    'ADD_CHAPTER': 'Evidence Based Clinical Research and Clinical Experience'
  },
  'Toddler sleep program': {
    'Welcome - Toddler Sleep Program': 'Toddler: 12-18 Months',
    '1.1 Sleep Environment': '1.1 Sleep Environment',
    '1.2 Routine': '1.2 Routine',
    '1.3 Settling Techniques': '1.3 Settling Techniques',
    '1.4 Sleep Cycles': '1.4 Sleep Cycles',
    '1.5 Sleep Props': '1.5 Sleep Props',
    '1.6 Nutrition': '1.6 Nutrition',
    '1.7 Screen Time': '1.7 Screen Time',
    '1.8 Development': '1.8 Development',
    '1.9 Getting Out, Activities and Daycare': '1.9 Getting Out, Activities and Daycare',
    '1.10 Parental Wellbeing': '1.10 Parental Wellbeing',
    '1.11 Troubleshooting': '1.11 Troubleshooting',
    'ADD_CHAPTER': 'Evidence Based Clinical Research & Clinical Experience'
  },
  'Pre-toddler sleep program': {
    'Welcome - Pre Toddler: 8-12 Months': 'Pre Toddler: 8-12 Months',
    '1.1 Sleep Environment': '1.1 Sleep Environment',
    '1.2 Routine': '1.2 Routine',
    '1.3 Sleep Cycles': '1.3 Sleep Cycles',
    '1.4 Settling Techniques': '1.4 Settling Techniques',
    '1.5 Role of the Non-Breastfeeding Parent': '1.5 Role of the Non-Breastfeeding Parent',
    '1.6 Sleep Props': '1.6 Sleep Props',
    '1.7 Nutrition': '1.7 Nutrition',
    '1.8 Development': '1.8 Development',
    '1.9 Teething': '1.9 Teething',
    '1.10 Activities, Getting Out & Travelling with Babies': '1.10 Activities, Getting Out & Travelling with Babies',
    '1.11 Daycare': '1.11 Daycare',
    '1.12 Bottle Refusal': '1.12 Bottle Refusal',
    '1.13 Parental Wellbeing': '1.13 Parental Wellbeing',
    '1.14 Troublshooting': '1.14 Troublshooting',
    'ADD_CHAPTER': 'Evidence Based Clinical Research & Clinical Experience'
  }
};

async function updateCoursesSafely() {
  try {
    console.log('🔧 Safely updating all courses to match reference structure...');
    
    let totalUpdated = 0;
    let totalAdded = 0;
    
    for (const [courseTitle, titleMapping] of Object.entries(courseTitleMappings)) {
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
      
      // Update existing chapters
      let updatedCount = 0;
      for (const chapter of currentChapters) {
        const newTitle = titleMapping[chapter.title];
        if (newTitle && newTitle !== chapter.title && newTitle !== 'ADD_CHAPTER') {
          await db.update(courseChapters)
            .set({ title: newTitle })
            .where(eq(courseChapters.id, chapter.id));
          
          console.log(`✅ Updated: "${chapter.title}" → "${newTitle}"`);
          updatedCount++;
          totalUpdated++;
        } else if (newTitle === chapter.title) {
          console.log(`✓ No change needed: "${chapter.title}"`);
        }
      }
      
      // Add new chapters if needed
      if (titleMapping['ADD_CHAPTER']) {
        const newChapter = {
          courseId: course[0].id,
          title: titleMapping['ADD_CHAPTER'],
          chapterNumber: '0.0', // Required field
          orderIndex: 0 // Add at the beginning
        };
        
        const [insertedChapter] = await db.insert(courseChapters)
          .values(newChapter)
          .returning();
        
        console.log(`➕ Added new chapter: "${insertedChapter.title}"`);
        totalAdded++;
      }
      
      console.log(`📊 Course "${courseTitle}" updated: ${updatedCount} chapters modified`);
    }
    
    console.log('\n📊 Overall Summary:');
    console.log(`✅ Total chapters updated: ${totalUpdated}`);
    console.log(`➕ Total chapters added: ${totalAdded}`);
    console.log(`📚 Courses processed: ${Object.keys(courseTitleMappings).length}`);
    
    return {
      success: true,
      totalUpdated,
      totalAdded,
      coursesProcessed: Object.keys(courseTitleMappings).length
    };
    
  } catch (error) {
    console.error('❌ Error updating courses:', error);
    throw error;
  }
}

updateCoursesSafely()
  .then((result) => {
    console.log('\n🎉 All courses updated safely!');
    if (result) {
      console.log(`✅ Processed ${result.coursesProcessed} courses`);
      console.log(`✅ Updated ${result.totalUpdated} chapters`);
      console.log(`➕ Added ${result.totalAdded} chapters`);
    }
  })
  .catch((error) => {
    console.error('💥 Course update failed:', error);
  });