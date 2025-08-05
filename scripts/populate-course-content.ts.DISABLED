import * as fs from 'fs';
import * as path from 'path';
import { db } from '../server/db';
import { courseModules } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { executeWithGuard, isEmergencyDisabled } from "./script-execution-guard";

// Content mapping for specific high-quality modules
const QUALITY_CONTENT_MAPPING = {
  // Big Baby Sleep Program - Course ID 6
  6: {
    'FAQs - Sleep Environment': {
      content: `<p><span style="font-size: 16px"><strong>Q: My baby starts crying as soon as they enter their room as they know it's sleep time, how can I fix this?</strong></span></p><p><span style="font-size: 16px"><strong>ANS:</strong> We want your baby to see their bedroom or sleep space as a positive, happy place and not one of fear and anxiety. Make sure you offer your baby lots of playtime, tummy time, and fun in their bedroom. Read books, play peekaboo, and sing songs during the day with them in there.</span><br></p><p><span style="font-size: 16px">If they begin crying on entering their darkened room, it can be helpful to have some wind-down time in their room with a dim light on. Then do their nappy change, put them in a sleep sack, and cuddle (or whatever your wind-down routine involves) with the light still on. Pop them down in their cot and then turn the light off before continuing with your settling technique.</span></p><p><span style="font-size: 16px"><strong>Q: I've unswaddled my baby but they still fling their arms around and this seems to keep them awake, what can I do about this?</strong><br><strong>ANS:</strong> If you are still transitioning your baby from the swaddle, try to settle them unswaddled and gently hold their arms down if they find it difficult to keep them still. Also, try putting socks or mittens on their hands, as they are used to having material on them.</span></p><p><span style="font-size: 16px">If they wake and need resettling, it is okay to use the swaddle as a backup resettling technique. Just keep trying every day to resettle them without the swaddle, and they will get there eventually. For some babies, this may take 2-3 weeks.</span></p><p><span style="font-size: 16px"><strong>Q: Why do you suggest playtime in their bedroom during the day?</strong><br><strong>ANS:</strong> Playtime in their sleep environment is important so they feel safe and happy there and don't just see it as a place for sleep. If they associate their bedroom only with sleep, it can create anxieties and fears as they get older.</span></p><p><span style="font-size: 16px">To help them feel secure, spend a small part of the day playing in their room, reading books, singing songs, and interacting with them.</span></p>`,
      videoUrl: null
    },
    'Introducing Solids': {
      content: `<div class="se-component se-video-container __se__float-none" style="width: 100%"><figure style="width: 100%; height: 56.25%; padding-bottom: 56.25%;"><iframe frameborder="0" allowfullscreen="" src="https://player.vimeo.com/video/1063389998?share=copy" data-proportion="true" data-percentage="100%,56.25%" data-size="100%,56.25%" data-align="none" data-file-name="1063389998?share=copy" data-file-size="0" data-origin="100%,56.25%" style="width: 100%; height: 100%;"></iframe></figure></div><p><span style="font-size: 16px">In this video, Dr. Golly will encourage you to make a mess! Introducing solids is meant to be fun, exploratory, messy, and silly. If you are anxious about what your baby is eating, how much they are eating, and what mess is being made—then your baby is far less likely to develop a positive association with solids.</span></p><p><span style="font-size: 16px">In this video, Dr. Golly will talk you through the signs of developmental readiness for solids, the best way to introduce new foods, the importance of reducing allergy risk, and ways to make solids lead to better day and night sleep. Follow these steps, and Dr. Golly will have your baby sleeping 12 hours straight in no time!</span></p>`,
      videoUrl: 'https://player.vimeo.com/video/1063389998?share=copy',
      duration: 7
    }
  }
};

function cleanRichTextContent(content: string): string {
  if (!content) return '';
  
  // Convert <br> tags to proper line breaks
  let cleaned = content.replace(/<br\s*\/?>/gi, '\n');
  
  // Convert common rich text tags to proper HTML
  cleaned = cleaned.replace(/\[h1\]/g, '<h1 class="text-2xl font-bold mb-4">');
  cleaned = cleaned.replace(/\[\/h1\]/g, '</h1>');
  cleaned = cleaned.replace(/\[h2\]/g, '<h2 class="text-xl font-semibold mb-3">');
  cleaned = cleaned.replace(/\[\/h2\]/g, '</h2>');
  cleaned = cleaned.replace(/\[h3\]/g, '<h3 class="text-lg font-medium mb-2">');
  cleaned = cleaned.replace(/\[\/h3\]/g, '</h3>');
  cleaned = cleaned.replace(/\[b\]/g, '<strong>');
  cleaned = cleaned.replace(/\[\/b\]/g, '</strong>');
  cleaned = cleaned.replace(/\[i\]/g, '<em>');
  cleaned = cleaned.replace(/\[\/i\]/g, '</em>');
  
  // Wrap paragraphs if not already wrapped
  if (!cleaned.includes('<p>') && cleaned.trim().length > 0) {
    const paragraphs = cleaned.split('\n\n').filter(p => p.trim());
    cleaned = paragraphs.map(p => `<p class="text-base text-gray-700 mb-4">${p.trim()}</p>`).join('');
  }
  
  return cleaned;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    i++;
  }
  
  result.push(current.trim());
  return result;
}

export async function populateCourseContent() {
  console.log("Starting course content population...");
  
  try {
    // Module ID mapping from content CSV to database courses
    // These are the actual module IDs from the content file
    const MODULE_TO_COURSE_MAPPING: { [key: string]: { dbId: number; title: string } } = {
      // Big Baby Sleep Program modules
      '1739404266739x737943141551439900': { dbId: 6, title: 'Big baby sleep program' },
      '1739404874277x566403385926352900': { dbId: 6, title: 'Big baby sleep program' },
      '1739405595881x808617604539482100': { dbId: 6, title: 'Big baby sleep program' },
      '1739412328631x579161976752832500': { dbId: 6, title: 'Big baby sleep program' },
      '1739836385755x733166840193744900': { dbId: 6, title: 'Big baby sleep program' },
      '1739837703247x674864623323185200': { dbId: 6, title: 'Big baby sleep program' },
      '1739834880856x830132068100341800': { dbId: 6, title: 'Big baby sleep program' },
      '1739843833309x720000265638903800': { dbId: 6, title: 'Big baby sleep program' },
      '1739318814239x997237020893642800': { dbId: 6, title: 'Big baby sleep program' },
      
      // Toddler Toolkit modules
      '1741836897554x685761904016621600': { dbId: 13, title: 'Toddler toolkit' },
      '1741829493723x992100870422265900': { dbId: 13, title: 'Toddler toolkit' },
      
      // Little Baby Sleep Program modules
      '1739065040965x300688505535201300': { dbId: 5, title: 'Little baby sleep program' },
      '1738211381074x619811994544111600': { dbId: 5, title: 'Little baby sleep program' },
      
      // Other programs
      '1738631920240x970515425764835300': { dbId: 10, title: 'Preparation for newborns' },
      '1738211513350x866090906720665600': { dbId: 7, title: 'Pre-toddler sleep program' },
      '1738211565701x843388859190345699': { dbId: 8, title: 'Toddler sleep program' },
      '1738211625998x856545795660054500': { dbId: 9, title: 'Pre-school sleep program' },
      '1740714032807x880560269585023000': { dbId: 11, title: 'New sibling supplement' },
      '1740715399162x980182825696755700': { dbId: 12, title: 'Twins supplement' },
      '1746521064418x896614461038395400': { dbId: 14, title: 'Testing allergens' }
    };
    
    // Read both CSV files
    const structureFile = path.join(process.cwd(), 'attached_assets', 'Courses & Modules - export_All-Modules_2025-07-11_00-03-21_1752195453760.csv');
    const contentFile = path.join(process.cwd(), 'attached_assets', 'export_All-submodules-modified--_2025-07-11_00-30-29_1752195453760.csv');
    
    const structureData = fs.readFileSync(structureFile, 'utf-8');
    const contentData = fs.readFileSync(contentFile, 'utf-8');
    
    // Parse structure CSV (spreadsheet 1)
    const structureLines = structureData.split('\n').filter(line => line.trim());
    const structureMap: { [key: string]: { courseId: string; title: string } } = {};
    
    for (let i = 1; i < structureLines.length; i++) {
      const fields = parseCSVLine(structureLines[i]);
      if (fields.length >= 5) {
        const courseId = fields[2]?.trim();
        const moduleName = fields[4]?.trim();
        if (courseId && moduleName) {
          structureMap[moduleName] = { courseId, title: moduleName };
        }
      }
    }
    
    console.log(`Parsed ${Object.keys(structureMap).length} structure entries`);
    
    // Parse content CSV (spreadsheet 2) - column G is index 6
    const contentLines = contentData.split('\n').filter(line => line.trim());
    let contentCount = 0;
    
    for (let i = 1; i < contentLines.length; i++) {
      const fields = parseCSVLine(contentLines[i]);
      if (fields.length < 18) continue;
      
      const moduleId = fields[4]?.trim(); // Column E - module ID
      const richTextContent = fields[6]?.trim(); // Column G - rich text content
      const titleOfRichText = fields[8]?.trim(); // Column I - title of rich text
      const videoUrl = fields[12]?.trim(); // Column M - video URL
      const duration = fields[0]?.trim(); // Column A - duration
      
      // Skip if no meaningful content
      if (!richTextContent || richTextContent.length < 50) continue;
      
      // Skip test data
      if (richTextContent.includes('mnbkjbbfvjhhvjhcdc') || 
          richTextContent.includes('lnhkljgklddgdsg') || 
          richTextContent.includes('fhfgjg') ||
          richTextContent.includes('testing') ||
          richTextContent.includes('Testing') ||
          richTextContent.includes('bjkcsbJV') ||
          richTextContent.includes('dtesting') ||
          richTextContent.includes('(deleted thing)')) {
        continue;
      }
      
      // Map module ID to course
      const courseMapping = MODULE_TO_COURSE_MAPPING[moduleId];
      if (!courseMapping) continue;
      
      // Clean the content
      const cleanedContent = cleanRichTextContent(richTextContent);
      
      // Extract video URL from content if available
      let extractedVideoUrl = null;
      if (richTextContent.includes('vimeo.com/video/')) {
        const vimeoMatch = richTextContent.match(/vimeo\.com\/video\/(\d+)/);
        if (vimeoMatch) {
          extractedVideoUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }
      } else if (videoUrl && videoUrl.includes('vimeo')) {
        extractedVideoUrl = videoUrl;
      }
      
      // Find modules in the specific course
      const modules = await db
        .select()
        .from(courseModules)
        .where(eq(courseModules.courseId, courseMapping.dbId));
      
      // Find best matching module by title
      let matchingModule = null;
      
      if (titleOfRichText) {
        // First try exact title match
        matchingModule = modules.find(m => 
          m.title.toLowerCase() === titleOfRichText.toLowerCase()
        );
        
        // Then try partial match
        if (!matchingModule) {
          matchingModule = modules.find(m => {
            const moduleTitle = m.title.toLowerCase();
            const contentTitle = titleOfRichText.toLowerCase();
            
            return moduleTitle.includes(contentTitle) || 
                   contentTitle.includes(moduleTitle);
          });
        }
      }
      
      // If no title match, try content-based matching
      if (!matchingModule && modules.length > 0) {
        matchingModule = modules.find(m => !m.content || m.content.length < 100);
      }
      
      if (matchingModule && cleanedContent.length > 100) {
        // Update the module with content
        await db
          .update(courseModules)
          .set({
            content: cleanedContent,
            videoUrl: extractedVideoUrl,
            duration: duration ? parseFloat(duration) : null,
            contentType: extractedVideoUrl ? 'video' : 'text'
          })
          .where(eq(courseModules.id, matchingModule.id));
        
        console.log(`Updated module "${matchingModule.title}" in course ${courseMapping.title} with content from "${titleOfRichText || 'untitled'}"`);
        contentCount++;
      }
    }
    
    console.log(`Successfully populated ${contentCount} modules with quality content`);
    
  } catch (error) {
    console.error("Error during content population:", error);
    throw error;
  }
}

// Run population if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateCourseContent()
    .then(() => {
      console.log('Content population completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Content population failed:', error);
      process.exit(1);
    });
}