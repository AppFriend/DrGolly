import { db } from "../server/db";
import { courses, courseChapters, courseModules } from "../shared/schema";
import { eq } from "drizzle-orm";

interface ThinkificChapter {
  title: string;
  description: string;
  chapterNumber: string;
  orderIndex: number;
  modules: ThinkificModule[];
}

interface ThinkificModule {
  title: string;
  description: string;
  content: string;
  contentType: 'text' | 'video';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  orderIndex: number;
  images?: string[]; // URLs of images used in the module
}

interface ThinkificCourse {
  id: number;
  title: string;
  description: string;
  chapters: ThinkificChapter[];
}

// This is the course structure that needs to be populated from Thinkific
const preparationForNewbornsData: ThinkificCourse = {
  id: 10,
  title: "Preparation for Newborns",
  description: "Comprehensive preparation course for expecting parents",
  chapters: [
    {
      title: "Welcome & Introduction",
      description: "Welcome to the course and introduction to newborn preparation",
      chapterNumber: "1",
      orderIndex: 1,
      modules: [
        {
          title: "Welcome",
          description: "Welcome to the Preparation for Newborns course",
          content: `<!-- TO BE POPULATED FROM THINKIFIC -->
                   <p>Welcome content from Thinkific welcome page</p>
                   <p>This content needs to be copied from: https://www.drgollylearninghub.com/courses/take/drgolly-8/texts/22333055-welcome</p>`,
          contentType: 'text',
          orderIndex: 1,
          images: []
        }
      ]
    },
    {
      title: "Chapter 1: Getting Ready",
      description: "Preparing for your newborn's arrival",
      chapterNumber: "2",
      orderIndex: 2,
      modules: [
        {
          title: "Getting Ready Overview",
          description: "Overview of preparations needed for newborn arrival",
          content: `<!-- TO BE POPULATED FROM THINKIFIC -->
                   <p>This content needs to be extracted from the Thinkific course</p>`,
          contentType: 'text',
          orderIndex: 1,
          images: []
        }
      ]
    },
    {
      title: "Chapter 2: Sleep Environment",
      description: "Creating the perfect sleep environment for your newborn",
      chapterNumber: "3",
      orderIndex: 3,
      modules: [
        {
          title: "Sleep Environment Setup",
          description: "How to set up a safe and comfortable sleep environment",
          content: `<!-- TO BE POPULATED FROM THINKIFIC -->
                   <p>This content needs to be extracted from the Thinkific course</p>`,
          contentType: 'text',
          orderIndex: 1,
          images: []
        }
      ]
    },
    {
      title: "Chapter 3: Feeding",
      description: "Feeding basics for newborns",
      chapterNumber: "4",
      orderIndex: 4,
      modules: [
        {
          title: "Feeding Fundamentals",
          description: "Essential feeding information for newborns",
          content: `<!-- TO BE POPULATED FROM THINKIFIC -->
                   <p>This content needs to be extracted from the Thinkific course</p>`,
          contentType: 'text',
          orderIndex: 1,
          images: []
        }
      ]
    },
    // Additional chapters will be added as we extract content from Thinkific
  ]
};

async function migrateThinkificCourse() {
  console.log("Starting migration of Preparation for Newborns course...");
  
  try {
    // First, clear existing chapters and modules for this course
    console.log("Clearing existing course structure...");
    await db.delete(courseModules).where(eq(courseModules.courseId, 10));
    await db.delete(courseChapters).where(eq(courseChapters.courseId, 10));
    
    // Insert chapters and modules
    for (const chapter of preparationForNewbornsData.chapters) {
      console.log(`Creating chapter: ${chapter.title}`);
      
      const [insertedChapter] = await db.insert(courseChapters).values({
        courseId: preparationForNewbornsData.id,
        title: chapter.title,
        description: chapter.description,
        chapterNumber: chapter.chapterNumber,
        orderIndex: chapter.orderIndex,
        status: 'published'
      }).returning();
      
      // Insert modules for this chapter
      for (const module of chapter.modules) {
        console.log(`Creating module: ${module.title}`);
        
        await db.insert(courseModules).values({
          courseId: preparationForNewbornsData.id,
          chapterId: insertedChapter.id,
          title: module.title,
          description: module.description,
          content: module.content,
          contentType: module.contentType,
          videoUrl: module.videoUrl,
          thumbnailUrl: module.thumbnailUrl,
          duration: module.duration,
          orderIndex: module.orderIndex,
          status: 'published'
        });
      }
    }
    
    console.log("Migration completed successfully!");
    
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Function to help extract content from Thinkific manually
export function createThinkificContentExtractor() {
  return {
    extractModule: (title: string, content: string, images: string[] = []) => {
      console.log(`Extracting module: ${title}`);
      console.log(`Content length: ${content.length} characters`);
      console.log(`Images found: ${images.length}`);
      
      return {
        title,
        content,
        images,
        contentType: 'text' as const
      };
    },
    
    extractChapter: (title: string, description: string, modules: any[]) => {
      console.log(`Extracting chapter: ${title}`);
      console.log(`Modules: ${modules.length}`);
      
      return {
        title,
        description,
        modules
      };
    },
    
    saveToDatabase: async (chapterData: ThinkificChapter, courseId: number) => {
      const [insertedChapter] = await db.insert(courseChapters).values({
        courseId,
        title: chapterData.title,
        description: chapterData.description,
        chapterNumber: chapterData.chapterNumber,
        orderIndex: chapterData.orderIndex,
        status: 'published'
      }).returning();
      
      for (const module of chapterData.modules) {
        await db.insert(courseModules).values({
          courseId,
          chapterId: insertedChapter.id,
          title: module.title,
          description: module.description,
          content: module.content,
          contentType: module.contentType,
          videoUrl: module.videoUrl,
          thumbnailUrl: module.thumbnailUrl,
          duration: module.duration,
          orderIndex: module.orderIndex,
          status: 'published'
        });
      }
      
      console.log(`Chapter "${chapterData.title}" saved to database`);
    }
  };
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateThinkificCourse()
    .then(() => {
      console.log("Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export default migrateThinkificCourse;