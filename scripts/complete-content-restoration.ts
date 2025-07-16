import { db } from '../server/db';
import { courseLessons } from '../shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// CSV content restoration mapping for the submodules CSV
interface CSVRow {
  duration: string;
  hasVideo: string;
  index: string;
  isComplete: string;
  module: string; // Module ID that links to lessons
  setTimeFrame: string;
  text: string; // The actual content - this is what we need!
  titleOfRichText: string; // This should match lesson title
  titleOfVideo: string;
  uploadContent: string;
}

interface MatchResult {
  lesson: any;
  csvEntry: CSVRow;
  matchStrategy: number;
  confidence: number;
}

async function completeContentRestoration() {
  try {
    console.log('🔍 COMPREHENSIVE CONTENT RESTORATION - 100% MATCHING REQUIRED');
    
    // Read the CSV file with actual text content
    const csvPath = path.join(process.cwd(), 'attached_assets', 'export_All-submodules-modified--_2025-07-16_02-14-38_1752632112483.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('❌ CSV file not found. Please ensure the file is in attached_assets/');
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    console.log(`📋 Processing ${lines.length} lines from CSV export...`);
    
    // Parse CSV (skip header)
    const csvData: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line (handle quoted fields properly)
      const fields = line.split('","').map(field => field.replace(/^"|"$/g, ''));
      
      if (fields.length >= 10) {
        csvData.push({
          duration: fields[0],
          hasVideo: fields[1],
          index: fields[2],
          isComplete: fields[3],
          module: fields[4],
          setTimeFrame: fields[5],
          text: fields[6] || '', // The actual content!
          titleOfRichText: fields[7] || '', // This should match lesson title
          titleOfVideo: fields[8],
          uploadContent: fields[9]
        });
      }
    }
    
    // Filter CSV entries that have actual text content
    const csvEntriesWithText = csvData.filter(row => 
      row.text && 
      row.text.trim() && 
      row.text.trim().length > 10 && // Must have substantial content
      !row.text.includes('Creating the Optimal Sleep Environment') // Skip AI-generated content
    );
    
    console.log(`📊 Found ${csvEntriesWithText.length} CSV entries with authentic text content`);
    
    // Get all lessons from database
    const allLessons = await db.select().from(courseLessons);
    console.log(`📚 Found ${allLessons.length} lessons in database`);
    
    // Advanced matching strategies with confidence scoring
    const matchingStrategies = [
      // Strategy 1: Exact title match (highest confidence)
      {
        name: 'Exact Match',
        confidence: 100,
        match: (lessonTitle: string, csvTitle: string) => 
          lessonTitle.toLowerCase().trim() === csvTitle.toLowerCase().trim()
      },
      
      // Strategy 2: Remove numbering prefixes
      {
        name: 'Remove Numbering',
        confidence: 95,
        match: (lessonTitle: string, csvTitle: string) => {
          const cleanLesson = lessonTitle.replace(/^(\d+\.?\d*\s*)/g, '').trim();
          const cleanCsv = csvTitle.replace(/^(\d+\.?\d*\s*)/g, '').trim();
          return cleanLesson.toLowerCase() === cleanCsv.toLowerCase();
        }
      },
      
      // Strategy 3: Normalize punctuation and spacing
      {
        name: 'Normalize Punctuation',
        confidence: 90,
        match: (lessonTitle: string, csvTitle: string) => {
          const normalize = (str: string) => str
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          return normalize(lessonTitle) === normalize(csvTitle);
        }
      },
      
      // Strategy 4: Contains match (high confidence if CSV title is contained in lesson)
      {
        name: 'Contains Match',
        confidence: 85,
        match: (lessonTitle: string, csvTitle: string) => {
          const lowerLesson = lessonTitle.toLowerCase();
          const lowerCsv = csvTitle.toLowerCase();
          return lowerLesson.includes(lowerCsv) && lowerCsv.length > 3;
        }
      },
      
      // Strategy 5: Reverse contains (lesson title contained in CSV)
      {
        name: 'Reverse Contains',
        confidence: 80,
        match: (lessonTitle: string, csvTitle: string) => {
          const lowerLesson = lessonTitle.toLowerCase();
          const lowerCsv = csvTitle.toLowerCase();
          return lowerCsv.includes(lowerLesson) && lowerLesson.length > 3;
        }
      },
      
      // Strategy 6: Key word overlap (70% or more words match)
      {
        name: 'Key Word Overlap',
        confidence: 75,
        match: (lessonTitle: string, csvTitle: string) => {
          const getKeyWords = (str: string) => str
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2);
          
          const lessonWords = getKeyWords(lessonTitle);
          const csvWords = getKeyWords(csvTitle);
          
          if (lessonWords.length === 0 || csvWords.length === 0) return false;
          
          const matches = lessonWords.filter(word => csvWords.includes(word));
          return matches.length >= Math.min(lessonWords.length, csvWords.length) * 0.7;
        }
      }
    ];
    
    // Find matches for each CSV entry
    const matches: MatchResult[] = [];
    const unmatchedCsv: CSVRow[] = [];
    
    for (const csvEntry of csvEntriesWithText) {
      console.log(`\n🔍 Matching CSV entry: "${csvEntry.titleOfRichText}"`);
      
      let bestMatch: MatchResult | null = null;
      
      // Try each matching strategy
      for (let i = 0; i < matchingStrategies.length; i++) {
        const strategy = matchingStrategies[i];
        
        const lesson = allLessons.find(l => {
          const csvTitle = csvEntry.titleOfRichText.trim();
          const lessonTitle = l.title.trim();
          
          // Skip empty titles
          if (!csvTitle || !lessonTitle) return false;
          
          return strategy.match(lessonTitle, csvTitle);
        });
        
        if (lesson) {
          const match: MatchResult = {
            lesson,
            csvEntry,
            matchStrategy: i + 1,
            confidence: strategy.confidence
          };
          
          if (!bestMatch || match.confidence > bestMatch.confidence) {
            bestMatch = match;
          }
        }
      }
      
      if (bestMatch) {
        matches.push(bestMatch);
        console.log(`✅ Matched with strategy ${bestMatch.matchStrategy} (${matchingStrategies[bestMatch.matchStrategy - 1].name}): "${bestMatch.lesson.title}"`);
      } else {
        unmatchedCsv.push(csvEntry);
        console.log(`❌ NO MATCH FOUND for: "${csvEntry.titleOfRichText}"`);
      }
    }
    
    // Check for lessons without matches
    const matchedLessonIds = matches.map(m => m.lesson.id);
    const unmatchedLessons = allLessons.filter(l => !matchedLessonIds.includes(l.id));
    
    console.log('\n📊 COMPREHENSIVE MATCHING RESULTS:');
    console.log(`✅ Matched CSV entries: ${matches.length}`);
    console.log(`❌ Unmatched CSV entries: ${unmatchedCsv.length}`);
    console.log(`📚 Total lessons in database: ${allLessons.length}`);
    console.log(`❌ Lessons without CSV matches: ${unmatchedLessons.length}`);
    
    // Show unmatched CSV entries
    if (unmatchedCsv.length > 0) {
      console.log('\n❌ UNMATCHED CSV ENTRIES:');
      unmatchedCsv.forEach((entry, index) => {
        console.log(`${index + 1}. "${entry.titleOfRichText}" - Text: "${entry.text.substring(0, 100)}..."`);
      });
    }
    
    // Show unmatched lessons
    if (unmatchedLessons.length > 0) {
      console.log('\n❌ LESSONS WITHOUT CSV MATCHES:');
      unmatchedLessons.slice(0, 20).forEach((lesson, index) => {
        console.log(`${index + 1}. "${lesson.title}" (ID: ${lesson.id})`);
      });
      if (unmatchedLessons.length > 20) {
        console.log(`... and ${unmatchedLessons.length - 20} more`);
      }
    }
    
    // Apply matches if user confirms
    if (matches.length > 0) {
      console.log('\n🚀 APPLYING CONTENT RESTORATION...');
      
      let restoredCount = 0;
      const duplicateCheck = new Map<string, string[]>();
      
      for (const match of matches) {
        const restoredContent = formatContentFromCSV(match.csvEntry.text);
        
        // Check for duplicate content
        const contentHash = restoredContent.slice(0, 100).toLowerCase().trim();
        if (duplicateCheck.has(contentHash)) {
          duplicateCheck.get(contentHash)?.push(match.lesson.title);
          console.log(`⚠️  DUPLICATE CONTENT DETECTED: "${match.lesson.title}" matches existing content`);
          continue;
        } else {
          duplicateCheck.set(contentHash, [match.lesson.title]);
        }
        
        // Update the lesson content
        await db.update(courseLessons)
          .set({ 
            content: restoredContent,
            updatedAt: new Date()
          })
          .where(eq(courseLessons.id, match.lesson.id));
        
        restoredCount++;
        console.log(`✅ Restored: "${match.lesson.title}" (${restoredContent.length} chars)`);
      }
      
      console.log(`\n🎉 CONTENT RESTORATION COMPLETE!`);
      console.log(`✅ Successfully restored ${restoredCount} lessons`);
      
      // Run comprehensive duplicate check
      await runDuplicateContentCheck();
    }
    
  } catch (error) {
    console.error('❌ Error in content restoration:', error);
    throw error;
  }
}

function formatContentFromCSV(text: string): string {
  // CRITICAL: Only minimal formatting allowed - no content changes
  let formatted = text.trim();
  
  // Convert bubble-style formatting tags to HTML (preserve original content structure)
  formatted = formatted
    // Handle heading tags
    .replace(/\[h1\](.*?)\[\/h1\]/g, '<h1>$1</h1>')
    .replace(/\[h2\](.*?)\[\/h2\]/g, '<h2>$1</h2>')
    .replace(/\[h3\](.*?)\[\/h3\]/g, '<h3>$1</h3>')
    .replace(/\[h4\](.*?)\[\/h4\]/g, '<h4>$1</h4>')
    
    // Handle text formatting
    .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
    .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
    .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>')
    
    // Handle alignment
    .replace(/\[center\](.*?)\[\/center\]/g, '<div style="text-align: center">$1</div>')
    
    // Handle colors and fonts (preserve but simplify)
    .replace(/\[color=rgb\([^\]]+\)\](.*?)\[\/color\]/g, '$1')
    .replace(/\[font="[^"]*"\](.*?)\[\/font\]/g, '$1')
    
    // Handle images (keep as is for now)
    .replace(/\[img[^\]]*\](.*?)\[\/img\]/g, '<img src="$1" alt="Image" style="max-width: 100%; height: auto;" />')
    
    // Handle videos
    .replace(/\[video\](.*?)\[\/video\]/g, '<img src="$1" alt="Video thumbnail" style="max-width: 100%; height: auto;" />')
    
    // Handle line breaks
    .replace(/<br\s*\/?>/g, '<br>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br>')
    
    // Wrap in paragraph if not already wrapped
    .replace(/^(?!<[h1-6]|<div|<p|<img|<strong|<em)/gm, '<p>')
    .replace(/(?<!<\/[h1-6]>|<\/div>|<\/p>|<\/img>|<\/strong>|<\/em>)$/gm, '</p>');
  
  // Clean up any double paragraph tags
  formatted = formatted
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-6])/g, '$1')
    .replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  
  return formatted;
}

async function runDuplicateContentCheck() {
  console.log('\n🔍 RUNNING COMPREHENSIVE DUPLICATE CONTENT CHECK...');
  
  const allLessons = await db.select().from(courseLessons);
  const contentMap = new Map<string, string[]>();
  
  for (const lesson of allLessons) {
    if (!lesson.content) continue;
    
    // Create a hash of the first 200 characters (normalized)
    const contentHash = lesson.content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .toLowerCase()
      .trim()
      .slice(0, 200);
    
    if (contentMap.has(contentHash)) {
      contentMap.get(contentHash)?.push(lesson.title);
    } else {
      contentMap.set(contentHash, [lesson.title]);
    }
  }
  
  // Find duplicates
  const duplicates = Array.from(contentMap.entries())
    .filter(([_, titles]) => titles.length > 1);
  
  if (duplicates.length === 0) {
    console.log('✅ ZERO DUPLICATE CONTENT FOUND - All lessons are unique!');
  } else {
    console.log(`❌ FOUND ${duplicates.length} DUPLICATE CONTENT GROUPS:`);
    duplicates.forEach(([contentHash, titles], index) => {
      console.log(`\n${index + 1}. Duplicate content found in ${titles.length} lessons:`);
      titles.forEach(title => console.log(`   - "${title}"`));
      console.log(`   Content preview: "${contentHash.slice(0, 100)}..."`);
    });
  }
  
  return duplicates.length;
}

// Export the function for use in admin panel
export { completeContentRestoration };

// Run the restoration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  completeContentRestoration().catch(console.error);
}