import { db } from '../server/db';
import { courseLessons } from '../shared/schema';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { eq, like, or } from 'drizzle-orm';

/**
 * CRITICAL: Restore authentic lesson content from original CSV files
 * This script identifies and replaces AI-generated content with original content
 */

interface AuthenticContentRecord {
  title: string;
  content: string;
  videoUrl?: string;
  lessonId?: number;
}

export async function restoreAuthenticContent() {
  console.log("🔍 RESTORING AUTHENTIC CONTENT - Removing AI-generated templates");
  
  try {
    // Read the original content CSV file
    const csvContent = readFileSync('../attached_assets/export_All-submodules-modified--_2025-07-11_00-30-29_1752195453760.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`📊 Found ${records.length} authentic content records in CSV`);

    // Get all lessons with AI-generated content
    const aiGeneratedLessons = await db.select()
      .from(courseLessons)
      .where(or(
        like(courseLessons.content, '%Key Learning Objectives%'),
        like(courseLessons.content, '%This lesson provides important information%'),
        like(courseLessons.content, '%Evidence-Based Approach%')
      ));

    console.log(`🚨 Found ${aiGeneratedLessons.length} lessons with AI-generated content`);

    let restoredCount = 0;
    let authenticContentMap = new Map<string, AuthenticContentRecord>();

    // Process CSV records to build authentic content map
    for (const record of records) {
      const title = record['Title of rich text ']?.trim();
      const content = record['text']?.trim();
      const videoUrl = record['Video URL']?.trim();
      
      if (!title || !content) continue;
      
      // Skip test/junk data
      if (content.includes('(deleted thing)') || 
          content.includes('mnbkjbbfvjhhvjhcdc') ||
          content.includes('jkbfcjk.SHB') ||
          content.length < 50) {
        continue;
      }

      // Clean and format authentic content
      let cleanContent = content
        .replace(/\[h1\]/g, '<h1 class="text-2xl font-bold mb-4">')
        .replace(/\[\/h1\]/g, '</h1>')
        .replace(/\[h2\]/g, '<h2 class="text-xl font-semibold mb-3">')
        .replace(/\[\/h2\]/g, '</h2>')
        .replace(/\[h3\]/g, '<h3 class="text-lg font-medium mb-2">')
        .replace(/\[\/h3\]/g, '</h3>')
        .replace(/\[b\]/g, '<strong>')
        .replace(/\[\/b\]/g, '</strong>')
        .replace(/\[i\]/g, '<em>')
        .replace(/\[\/i\]/g, '</em>')
        .replace(/\[br\]/g, '<br>')
        .replace(/\[img width=(\d+)px\](.*?)\[\/img\]/g, '<img src="$2" alt="Course content" class="max-w-full h-auto rounded-lg my-4" style="max-width: $1px;" />')
        .replace(/\[video\](.*?)\[\/video\]/g, '<video controls class="w-full max-w-2xl mx-auto rounded-lg my-4"><source src="$1" type="video/mp4"></video>');

      authenticContentMap.set(title.toLowerCase(), {
        title,
        content: cleanContent,
        videoUrl
      });
    }

    console.log(`📚 Built authentic content map with ${authenticContentMap.size} entries`);

    // Get all lessons from database
    const allLessons = await db.select().from(courseLessons);
    console.log(`📖 Processing ${allLessons.length} lessons for content restoration`);

    // Process each lesson
    for (const lesson of allLessons) {
      if (!lesson.content) continue;

      // Check if lesson has AI-generated content
      const hasAIContent = lesson.content.includes('Key Learning Objectives') ||
                          lesson.content.includes('This lesson provides important information');

      if (hasAIContent) {
        console.log(`🔍 Processing AI-generated lesson: ${lesson.title}`);
        
        // Try to find authentic content
        const authenticContent = authenticContentMap.get(lesson.title?.toLowerCase() || '');
        
        if (authenticContent) {
          console.log(`✅ Restoring authentic content for: ${lesson.title}`);
          
          await db.update(courseLessons)
            .set({
              content: authenticContent.content,
              videoUrl: authenticContent.videoUrl || lesson.videoUrl
            })
            .where(eq(courseLessons.id, lesson.id));
          
          restoredCount++;
        } else {
          console.log(`⚠️  No authentic content found for: ${lesson.title}`);
        }
      }
    }

    console.log(`✅ RESTORATION COMPLETE: ${restoredCount} lessons restored with authentic content`);
    console.log(`📊 Total lessons processed: ${allLessons.length}`);
    console.log(`🎯 Authentic content ratio: ${((restoredCount / allLessons.length) * 100).toFixed(1)}%`);

    return {
      totalLessons: allLessons.length,
      restoredLessons: restoredCount,
      authenticContentEntries: authenticContentMap.size
    };

  } catch (error) {
    console.error('❌ Content restoration failed:', error);
    throw error;
  }
}

// Run the restoration
if (import.meta.url === `file://${process.argv[1]}`) {
  restoreAuthenticContent()
    .then((result) => {
      console.log('🎉 Content restoration completed successfully:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Content restoration failed:', error);
      process.exit(1);
    });
}