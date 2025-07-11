import { db } from '../server/db';
import { courseModules } from '../shared/schema';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { eq } from 'drizzle-orm';

/**
 * Map rich text content from CSV to course modules
 */
export async function mapRichContent() {
  console.log("Mapping rich text content to course modules...");
  
  try {
    // Read and parse the rich content CSV
    const csvContent = readFileSync('attached_assets/export_All-submodules-modified--_2025-07-11_00-30-29_1752197687502.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Parsed ${records.length} rich content records`);

    // Get all current modules from database
    const allModules = await db.select().from(courseModules);
    console.log(`Found ${allModules.length} modules in database`);

    let mappedCount = 0;
    let videoCount = 0;

    // Process each rich content record
    for (const record of records) {
      const moduleTitle = record['Title of rich text ']?.trim(); // Note: CSV has trailing space
      const richContent = record['text']?.trim();
      const videoUrl = record['Video URL']?.trim();
      
      // Skip if no title or content
      if (!moduleTitle || !richContent) continue;
      
      // Skip test/junk data
      if (richContent.includes('(deleted thing)') || 
          richContent.includes('mnbkjbbfvjhhvjhcdc') ||
          richContent.includes('jkbfcjk.SHB') ||
          richContent.length < 50) {
        continue;
      }

      // Find matching module by title - use exact matching first, then flexible matching
      let matchingModule = allModules.find(module => 
        module.title?.toLowerCase() === moduleTitle.toLowerCase()
      );
      
      // If no exact match, try flexible matching
      if (!matchingModule) {
        matchingModule = allModules.find(module => {
          const moduleTitle_lower = moduleTitle.toLowerCase();
          const module_title_lower = module.title?.toLowerCase() || '';
          
          // Special mappings for known mismatches
          if (moduleTitle_lower === 'vernix' && module_title_lower === 'what is normal') {
            return true;
          }
          
          // General flexible matching
          return module_title_lower.includes(moduleTitle_lower) ||
                 moduleTitle_lower.includes(module_title_lower);
        });
      }

      if (matchingModule) {
        // Clean and format the rich content
        let cleanContent = richContent;
        
        // Convert basic HTML formatting
        cleanContent = cleanContent
          .replace(/\[h1\]/g, '<h1 class="text-2xl font-bold mb-4">')
          .replace(/\[\/h1\]/g, '</h1>')
          .replace(/\[h2\]/g, '<h2 class="text-xl font-semibold mb-3">')
          .replace(/\[\/h2\]/g, '</h2>')
          .replace(/\[h3\]/g, '<h3 class="text-lg font-medium mb-2">')
          .replace(/\[\/h3\]/g, '</h3>')
          .replace(/\[h4\]/g, '<h4 class="text-base font-medium mb-2">')
          .replace(/\[\/h4\]/g, '</h4>')
          .replace(/\[b\]/g, '<strong>')
          .replace(/\[\/b\]/g, '</strong>')
          .replace(/\[i\]/g, '<em>')
          .replace(/\[\/i\]/g, '</em>')
          .replace(/\[br\]/g, '<br>')
          .replace(/<br\s*>/g, '<br>')
          .replace(/\[\/font\]/g, '</span>')
          .replace(/\[font=[^\]]*\]/g, '<span>')
          .replace(/\[color=[^\]]*\]/g, '<span>')
          .replace(/\[\/color\]/g, '</span>');

        // Wrap in proper paragraph tags if not already formatted
        if (!cleanContent.includes('<p') && !cleanContent.includes('<div') && !cleanContent.includes('<h')) {
          cleanContent = `<p class="text-base text-gray-700 mb-4">${cleanContent}</p>`;
        }

        // Determine content type
        let contentType = 'text';
        let cleanVideoUrl = null;
        
        if (videoUrl && videoUrl.includes('vimeo.com')) {
          contentType = 'video';
          // Extract Vimeo ID and create player URL
          const vimeoMatch = videoUrl.match(/vimeo\.com\/video\/(\d+)/);
          if (vimeoMatch) {
            cleanVideoUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
            videoCount++;
          }
        }

        // Update the module
        await db.update(courseModules)
          .set({
            content: cleanContent,
            contentType: contentType,
            videoUrl: cleanVideoUrl
          })
          .where(eq(courseModules.id, matchingModule.id));

        mappedCount++;
        console.log(`✓ Mapped "${moduleTitle}" to module "${matchingModule.title}"`);
        
        if (cleanVideoUrl) {
          console.log(`  └─ Added video: ${cleanVideoUrl}`);
        }
      } else {
        console.log(`✗ No matching module found for: "${moduleTitle}"`);
      }
    }

    console.log(`\nMapping completed successfully:`);
    console.log(`- ${mappedCount} modules updated with rich content`);
    console.log(`- ${videoCount} videos embedded`);

  } catch (error) {
    console.error("Error mapping rich content:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  mapRichContent()
    .then(() => {
      console.log("Rich content mapping completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Rich content mapping failed:", error);
      process.exit(1);
    });
}