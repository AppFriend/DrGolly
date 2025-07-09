import { db } from "../server/db";
import { 
  courseChapters, 
  courseModules, 
  type InsertCourseChapter, 
  type InsertCourseModule 
} from "../shared/schema";

const BIG_BABY_COURSE_ID = 6;

// Chapter data from the screenshots
const chapters: InsertCourseChapter[] = [
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Big Baby: 4-8 Months",
    description: "Introduction to the Big Baby sleep program for 4-8 month olds",
    chapterNumber: "1",
    orderIndex: 1,
    isCompleted: false,
  },
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Sleep Environment", 
    description: "Setting up the optimal sleep environment for your baby",
    chapterNumber: "1.1",
    orderIndex: 2,
    isCompleted: false,
  },
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Introducing Solids",
    description: "Guide to introducing solid foods and their impact on sleep",
    chapterNumber: "1.2", 
    orderIndex: 3,
    isCompleted: false,
  },
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Routine",
    description: "Establishing healthy daily routines for better sleep",
    chapterNumber: "1.3",
    orderIndex: 4,
    isCompleted: false,
  },
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Sleep Cycles",
    description: "Understanding baby sleep cycles and patterns",
    chapterNumber: "1.4",
    orderIndex: 5,
    isCompleted: false,
  },
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Settling Techniques",
    description: "Effective settling techniques for 4-8 month olds",
    chapterNumber: "1.5",
    orderIndex: 6,
    isCompleted: false,
  },
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Role of the Non-Breastfeeding Parent",
    description: "How partners can support sleep training",
    chapterNumber: "1.6",
    orderIndex: 7,
    isCompleted: false,
  },
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Winding, Burping and More",
    description: "Managing wind, burping, and other sleep disruptions",
    chapterNumber: "1.7",
    orderIndex: 8,
    isCompleted: false,
  },
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Development",
    description: "How development affects sleep at 4-8 months",
    chapterNumber: "1.8",
    orderIndex: 9,
    isCompleted: false,
  },
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Teething",
    description: "Managing sleep during teething periods",
    chapterNumber: "1.9",
    orderIndex: 10,
    isCompleted: false,
  },
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Bottle Refusal",
    description: "Addressing bottle refusal and its impact on sleep",
    chapterNumber: "1.10",
    orderIndex: 11,
    isCompleted: false,
  },
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Tummy Time & Activity",
    description: "The importance of tummy time and activity for sleep",
    chapterNumber: "1.11",
    orderIndex: 12,
    isCompleted: false,
  },
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Sleep Props: Dummies & Comforters",
    description: "Managing sleep props and dependencies",
    chapterNumber: "1.12",
    orderIndex: 13,
    isCompleted: false,
  },
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Daycare",
    description: "Maintaining sleep routines at daycare",
    chapterNumber: "1.13",
    orderIndex: 14,
    isCompleted: false,
  },
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Travelling with Babies",
    description: "Managing sleep when travelling",
    chapterNumber: "1.14",
    orderIndex: 15,
    isCompleted: false,
  },
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Parental Wellbeing",
    description: "Supporting parental mental health and wellbeing",
    chapterNumber: "1.15",
    orderIndex: 16,
    isCompleted: false,
  },
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Troubleshooting & Other",
    description: "Common problems and solutions",
    chapterNumber: "1.16",
    orderIndex: 17,
    isCompleted: false,
  },
  {
    courseId: BIG_BABY_COURSE_ID,
    title: "Evidence Based Clinical Research and Clinical Experience",
    description: "Scientific backing for sleep training methods",
    chapterNumber: "1.17",
    orderIndex: 18,
    isCompleted: false,
  },
];

// Module data from the screenshots
const modulesByChapter: { [key: string]: Omit<InsertCourseModule, 'chapterId'>[] } = {
  "1.7": [ // Winding, Burping and More
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Intro to Winding and Burping",
      description: "Understanding wind and burping basics",
      orderIndex: 1,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Wind Causes",
      description: "What causes wind in babies",
      orderIndex: 2,
      contentType: "video",
      duration: 9,
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Wind Signs",
      description: "Recognizing signs of wind",
      orderIndex: 3,
      contentType: "video",
      duration: 3,
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Wind Techniques",
      description: "Effective winding techniques",
      orderIndex: 4,
      contentType: "video",
      duration: 8,
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Hiccoughs/Hiccups",
      description: "Managing hiccoughs and hiccups",
      orderIndex: 5,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Possets, Vomits, Spills and Reflux",
      description: "Understanding different types of spit-up",
      orderIndex: 6,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Happy Spitters",
      description: "When spitting up is normal",
      orderIndex: 7,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "FAQs - Winding and Burping",
      description: "Common questions about winding and burping",
      orderIndex: 8,
      contentType: "text",
    },
  ],
  "1.8": [ // Development
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "General Development",
      description: "Overall development milestones",
      orderIndex: 1,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Weight",
      description: "Weight gain and development",
      orderIndex: 2,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Unswaddling",
      description: "Transitioning away from swaddling",
      orderIndex: 3,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "What is a Baby or Infant Growth Chart?",
      description: "Understanding growth charts",
      orderIndex: 4,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "What are Centile Charts?",
      description: "How to read centile charts",
      orderIndex: 5,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Following Growth Curves",
      description: "Monitoring baby's growth over time",
      orderIndex: 6,
      contentType: "text",
    },
  ],
  "1.9": [ // Teething
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "When Does Teething Start?",
      description: "Understanding teething timeline",
      orderIndex: 1,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Signs and Symptoms",
      description: "Recognizing teething symptoms",
      orderIndex: 2,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Tips to Help Your Teething Baby",
      description: "Soothing techniques for teething babies",
      orderIndex: 3,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Why Teething Gels Aren't Recommended",
      description: "Safety concerns with teething gels",
      orderIndex: 4,
      contentType: "text",
    },
  ],
  "1.10": [ // Bottle Refusal
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Bottle Rejection 101",
      description: "Understanding bottle refusal",
      orderIndex: 1,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Introducing Bottles - A How to Guide",
      description: "Step-by-step bottle introduction",
      orderIndex: 2,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Protecting Breastfeeding and Bottles",
      description: "Maintaining breastfeeding while using bottles",
      orderIndex: 3,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Which Teat to Choose",
      description: "Selecting the right bottle teat",
      orderIndex: 4,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Paced Bottle Feeding",
      description: "Responsive bottle feeding techniques",
      orderIndex: 5,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "General Tips and Tricks for Success",
      description: "Additional bottle feeding tips",
      orderIndex: 6,
      contentType: "text",
    },
  ],
  "1.11": [ // Tummy Time & Activity
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Tummy Time",
      description: "The importance of tummy time",
      orderIndex: 1,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "The History of Tummy Time",
      description: "Why tummy time became important",
      orderIndex: 2,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Getting Out",
      description: "Getting out with baby",
      orderIndex: 3,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Overstimulation",
      description: "Recognizing and managing overstimulation",
      orderIndex: 4,
      contentType: "text",
    },
  ],
  "1.12": [ // Sleep Props: Dummies & Comforters
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Dummies/Pacifiers",
      description: "Using dummies effectively",
      orderIndex: 1,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Ditching the Dummy",
      description: "How to stop using dummies",
      orderIndex: 2,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Teaching Your Baby to Find and Replace their Dummy",
      description: "Self-soothing with dummies",
      orderIndex: 3,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Comforters",
      description: "Using comfort objects",
      orderIndex: 4,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "FAQs - Dummies/Pacifiers",
      description: "Common dummy questions",
      orderIndex: 5,
      contentType: "text",
    },
  ],
  "1.13": [ // Daycare
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Starting Daycare",
      description: "Preparing for daycare",
      orderIndex: 1,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Daycare and Sleep Routines",
      description: "Maintaining sleep routines at daycare",
      orderIndex: 2,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Saying Goodbyes",
      description: "Making daycare transitions easier",
      orderIndex: 3,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Bottle Rejection at Daycare",
      description: "Managing feeding issues at daycare",
      orderIndex: 4,
      contentType: "text",
    },
  ],
  "1.14": [ // Travelling with Babies
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Flying with Babies",
      description: "Tips for air travel with babies",
      orderIndex: 1,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Long Car Trips with Babies",
      description: "Managing car travel with babies",
      orderIndex: 2,
      contentType: "text",
    },
  ],
  "1.15": [ // Parental Wellbeing
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Couple Alignment",
      description: "Working together as parents",
      orderIndex: 1,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Couple Strategies",
      description: "Strategies for parenting together",
      orderIndex: 2,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "A Word on Sleep Schools",
      description: "Information about sleep schools",
      orderIndex: 3,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Parents and Mental Health",
      description: "Supporting parental mental health",
      orderIndex: 4,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Postnatal Depression (PND)",
      description: "Understanding postnatal depression",
      orderIndex: 5,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Postnatal Anxiety (PNA)",
      description: "Managing postnatal anxiety",
      orderIndex: 6,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Postpartum Psychosis (PPP)",
      description: "Understanding postpartum psychosis",
      orderIndex: 7,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Which Parents are at Greater Risk of Mental Health Problems?",
      description: "Risk factors for mental health issues",
      orderIndex: 8,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Perinatal Mental Health Help",
      description: "Getting help for mental health",
      orderIndex: 9,
      contentType: "text",
    },
  ],
  "1.16": [ // Troubleshooting & Other
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Early Morning Waking",
      description: "Solving early morning wake-ups",
      orderIndex: 1,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "What to do if Your Baby is Cat-Napping",
      description: "Managing short naps",
      orderIndex: 2,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Nap Refusal",
      description: "When babies refuse to nap",
      orderIndex: 3,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Managing Sickness and Sleep",
      description: "Sleep during illness",
      orderIndex: 4,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Bedtime Refusal",
      description: "When babies resist bedtime",
      orderIndex: 5,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Eczema",
      description: "Managing eczema and sleep",
      orderIndex: 6,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Adjusting to Daylight Savings Changes",
      description: "Managing time changes",
      orderIndex: 7,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Parents Worried About the '4 Month Sleep Regression'",
      description: "Understanding the 4-month sleep regression",
      orderIndex: 8,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Leaking Nappies Overnight",
      description: "Preventing overnight diaper leaks",
      orderIndex: 9,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Breastmilk Storage Guidelines",
      description: "Safely storing breastmilk",
      orderIndex: 10,
      contentType: "text",
    },
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Congestion",
      description: "Managing congestion in babies",
      orderIndex: 11,
      contentType: "text",
    },
  ],
  "1.17": [ // Evidence Based Clinical Research
    {
      courseId: BIG_BABY_COURSE_ID,
      title: "Research for Those Who Want to Dig Deeper",
      description: "Scientific research behind sleep training",
      orderIndex: 1,
      contentType: "text",
    },
  ],
};

export async function seedBigBabyCourse() {
  console.log("Seeding Big Baby Course chapters and modules...");
  
  try {
    // Insert chapters
    const insertedChapters = await db
      .insert(courseChapters)
      .values(chapters)
      .onConflictDoNothing()
      .returning();
    
    console.log(`Inserted ${insertedChapters.length} chapters`);
    
    // Insert modules for each chapter
    for (const [chapterNumber, modules] of Object.entries(modulesByChapter)) {
      const chapter = insertedChapters.find(c => c.chapterNumber === chapterNumber);
      if (chapter) {
        const modulesWithChapterId = modules.map(module => ({
          ...module,
          chapterId: chapter.id,
        }));
        
        const insertedModules = await db
          .insert(courseModules)
          .values(modulesWithChapterId)
          .onConflictDoNothing()
          .returning();
        
        console.log(`Inserted ${insertedModules.length} modules for chapter ${chapterNumber}`);
      }
    }
    
    console.log("Big Baby Course seeding completed successfully!");
    
  } catch (error) {
    console.error("Error seeding Big Baby Course:", error);
    throw error;
  }
}

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedBigBabyCourse()
    .then(() => {
      console.log("Seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}