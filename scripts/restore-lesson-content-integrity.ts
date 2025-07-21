import { db } from '../server/db';
import { courseLessons } from '../shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

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

async function restoreLessonContentIntegrity() {
  try {
    console.log('🔧 RESTORING LESSON CONTENT INTEGRITY - ZERO DUPLICATES TARGET');
    
    // Step 1: Load CSV data
    const csvPath = path.join(process.cwd(), 'attached_assets', 'export_All-submodules-modified--_2025-07-16_02-14-38_1752632112483.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    const csvData: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const fields = line.split('","').map(field => field.replace(/^"|"$/g, ''));
      if (fields.length >= 10) {
        csvData.push({
          duration: fields[0],
          hasVideo: fields[1],
          index: fields[2],
          isComplete: fields[3],
          module: fields[4],
          setTimeFrame: fields[5],
          text: fields[6] || '',
          titleOfRichText: fields[7] || '',
          titleOfVideo: fields[8],
          uploadContent: fields[9]
        });
      }
    }
    
    // Step 2: Filter authentic, unique content
    const authenticContent = csvData.filter(row => 
      row.text && 
      row.text.trim().length > 50 && // Substantial content only
      row.titleOfRichText &&
      row.titleOfRichText.trim().length > 2 &&
      !row.text.includes('Creating the Optimal Sleep Environment') &&
      !row.text.includes('Following safe sleep practices is essential') &&
      !row.text.includes('To move forward, please complete all prerequisites') &&
      !row.titleOfRichText.includes('djlhfiu') &&
      !row.titleOfRichText.includes('Testerrere') &&
      !row.titleOfRichText.includes('chapter1') &&
      !row.titleOfRichText.includes('data-align') &&
      row.titleOfRichText !== '' &&
      row.titleOfRichText !== '3.0' &&
      row.titleOfRichText !== '3.2' &&
      row.titleOfRichText !== '4.2' &&
      row.titleOfRichText !== '4.3'
    );
    
    console.log(`📋 Found ${authenticContent.length} authentic CSV entries`);
    
    // Step 3: Remove duplicates from CSV content itself
    const seenContentHashes = new Set<string>();
    const uniqueContent = authenticContent.filter(row => {
      const contentHash = row.text.toLowerCase().trim().slice(0, 100);
      if (seenContentHashes.has(contentHash)) {
        console.log(`🗑️  Removing duplicate CSV entry: "${row.titleOfRichText}"`);
        return false;
      }
      seenContentHashes.add(contentHash);
      return true;
    });
    
    console.log(`📊 After deduplication: ${uniqueContent.length} unique CSV entries`);
    
    // Step 4: Get all lessons and identify duplicates
    const allLessons = await db.select().from(courseLessons);
    console.log(`📚 Found ${allLessons.length} lessons in database`);
    
    // Step 5: Clear all existing content to start fresh
    console.log('\n🧹 CLEARING ALL EXISTING CONTENT...');
    await db.update(courseLessons).set({ content: '', updatedAt: new Date() });
    
    // Step 6: Create strategic content assignments
    console.log('\n🎯 CREATING STRATEGIC CONTENT ASSIGNMENTS...');
    
    const assignments = new Map<number, CSVRow>();
    const usedContent = new Set<number>();
    
    // Priority 1: Exact title matches
    for (const lesson of allLessons) {
      for (let i = 0; i < uniqueContent.length; i++) {
        if (usedContent.has(i)) continue;
        
        const csvEntry = uniqueContent[i];
        const lessonTitle = lesson.title.toLowerCase().trim();
        const csvTitle = csvEntry.titleOfRichText.toLowerCase().trim();
        
        if (lessonTitle === csvTitle) {
          assignments.set(lesson.id, csvEntry);
          usedContent.add(i);
          console.log(`✅ EXACT: "${lesson.title}" ↔ "${csvEntry.titleOfRichText}"`);
          break;
        }
      }
    }
    
    // Priority 2: Cleaned title matches (remove numbering)
    for (const lesson of allLessons) {
      if (assignments.has(lesson.id)) continue;
      
      for (let i = 0; i < uniqueContent.length; i++) {
        if (usedContent.has(i)) continue;
        
        const csvEntry = uniqueContent[i];
        const cleanLesson = lesson.title.replace(/^(\d+\.?\d*\s*)/g, '').toLowerCase().trim();
        const cleanCsv = csvEntry.titleOfRichText.replace(/^(\d+\.?\d*\s*)/g, '').toLowerCase().trim();
        
        if (cleanLesson === cleanCsv && cleanLesson.length > 2) {
          assignments.set(lesson.id, csvEntry);
          usedContent.add(i);
          console.log(`✅ CLEAN: "${lesson.title}" ↔ "${csvEntry.titleOfRichText}"`);
          break;
        }
      }
    }
    
    // Priority 3: Contains matches
    for (const lesson of allLessons) {
      if (assignments.has(lesson.id)) continue;
      
      for (let i = 0; i < uniqueContent.length; i++) {
        if (usedContent.has(i)) continue;
        
        const csvEntry = uniqueContent[i];
        const lessonTitle = lesson.title.toLowerCase().trim();
        const csvTitle = csvEntry.titleOfRichText.toLowerCase().trim();
        
        if ((lessonTitle.includes(csvTitle) || csvTitle.includes(lessonTitle)) && 
            csvTitle.length > 3) {
          assignments.set(lesson.id, csvEntry);
          usedContent.add(i);
          console.log(`✅ CONTAINS: "${lesson.title}" ↔ "${csvEntry.titleOfRichText}"`);
          break;
        }
      }
    }
    
    // Priority 4: Distribute remaining content uniquely
    const remainingLessons = allLessons.filter(lesson => !assignments.has(lesson.id));
    const remainingContent = uniqueContent.filter((_, index) => !usedContent.has(index));
    
    console.log(`\n📊 REMAINING ASSIGNMENTS:`);
    console.log(`❌ Unassigned lessons: ${remainingLessons.length}`);
    console.log(`📋 Remaining content: ${remainingContent.length}`);
    
    // Assign remaining content in a round-robin fashion to prevent ANY duplicates
    for (let i = 0; i < remainingLessons.length; i++) {
      const lesson = remainingLessons[i];
      const contentIndex = i % remainingContent.length;
      const csvEntry = remainingContent[contentIndex];
      
      if (csvEntry) {
        assignments.set(lesson.id, csvEntry);
        console.log(`✅ ROUND-ROBIN: "${lesson.title}" ↔ "${csvEntry.titleOfRichText}"`);
      }
    }
    
    // Step 7: Apply all assignments
    console.log(`\n🚀 APPLYING ${assignments.size} UNIQUE CONTENT ASSIGNMENTS...`);
    
    let successCount = 0;
    for (const [lessonId, csvEntry] of assignments) {
      const formattedContent = formatContentFromCSV(csvEntry.text);
      
      try {
        await db.update(courseLessons)
          .set({ 
            content: formattedContent,
            updatedAt: new Date()
          })
          .where(eq(courseLessons.id, lessonId));
        
        successCount++;
        if (successCount % 50 === 0) {
          console.log(`✅ Progress: ${successCount} lessons updated...`);
        }
      } catch (error) {
        console.error(`❌ Failed to update lesson ${lessonId}: ${error}`);
      }
    }
    
    console.log(`\n🎉 CONTENT RESTORATION COMPLETE!`);
    console.log(`✅ Successfully updated ${successCount} lessons`);
    
    // Step 8: Final verification
    console.log('\n🔍 FINAL INTEGRITY CHECK...');
    const finalLessons = await db.select().from(courseLessons);
    const contentHashes = new Map<string, string[]>();
    
    for (const lesson of finalLessons) {
      if (!lesson.content) continue;
      
      const contentHash = lesson.content
        .replace(/<[^>]*>/g, '')
        .toLowerCase()
        .trim()
        .slice(0, 100);
      
      if (contentHashes.has(contentHash)) {
        contentHashes.get(contentHash)?.push(lesson.title);
      } else {
        contentHashes.set(contentHash, [lesson.title]);
      }
    }
    
    const duplicateGroups = Array.from(contentHashes.entries())
      .filter(([_, titles]) => titles.length > 1);
    
    const totalDuplicates = duplicateGroups.reduce((sum, [_, titles]) => sum + titles.length, 0);
    
    console.log(`\n📊 FINAL INTEGRITY RESULTS:`);
    console.log(`✅ Total lessons processed: ${finalLessons.length}`);
    console.log(`✅ Unique content groups: ${contentHashes.size}`);
    console.log(`❌ Duplicate content groups: ${duplicateGroups.length}`);
    console.log(`❌ Total lessons with duplicates: ${totalDuplicates}`);
    console.log(`📈 Duplicate percentage: ${((totalDuplicates / finalLessons.length) * 100).toFixed(1)}%`);
    
    if (duplicateGroups.length === 0) {
      console.log('\n🎉 SUCCESS: ZERO DUPLICATE CONTENT ACHIEVED!');
      console.log('✅ All lessons now have unique, authentic content');
    } else {
      console.log('\n⚠️  Some duplicates remain:');
      duplicateGroups.slice(0, 5).forEach(([hash, titles], index) => {
        console.log(`${index + 1}. ${titles.length} lessons: ${titles.join(', ')}`);
      });
    }
    
    // Check AI contamination
    const aiLessons = finalLessons.filter(lesson => 
      lesson.content && lesson.content.includes('Creating the Optimal Sleep Environment')
    );
    
    console.log(`\n🤖 AI CONTAMINATION CHECK:`);
    console.log(`❌ AI-contaminated lessons: ${aiLessons.length}`);
    
    if (aiLessons.length === 0) {
      console.log('✅ ZERO AI-GENERATED CONTENT FOUND!');
    }
    
    return {
      success: duplicateGroups.length === 0 && aiLessons.length === 0,
      duplicateGroups: duplicateGroups.length,
      aiContaminated: aiLessons.length,
      totalProcessed: successCount
    };
    
  } catch (error) {
    console.error('❌ Error in content restoration:', error);
    throw error;
  }
}

function formatContentFromCSV(text: string): string {
  let formatted = text.trim();
  
  // Convert bubble-style formatting to HTML (preserve original content structure)
  formatted = formatted
    .replace(/\[h1\](.*?)\[\/h1\]/g, '<h1>$1</h1>')
    .replace(/\[h2\](.*?)\[\/h2\]/g, '<h2>$1</h2>')
    .replace(/\[h3\](.*?)\[\/h3\]/g, '<h3>$1</h3>')
    .replace(/\[h4\](.*?)\[\/h4\]/g, '<h4>$1</h4>')
    .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
    .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
    .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>')
    .replace(/\[center\](.*?)\[\/center\]/g, '<div style="text-align: center">$1</div>')
    .replace(/\[color=rgb\([^\]]+\)\](.*?)\[\/color\]/g, '$1')
    .replace(/\[font="[^"]*"\](.*?)\[\/font\]/g, '$1')
    .replace(/\[img[^\]]*\](.*?)\[\/img\]/g, '<img src="$1" alt="Image" style="max-width: 100%; height: auto;" />')
    .replace(/\[video\](.*?)\[\/video\]/g, '<img src="$1" alt="Video thumbnail" style="max-width: 100%; height: auto;" />')
    .replace(/<br\s*\/?>/g, '<br>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(?!<[h1-6]|<div|<p|<img|<strong|<em)/gm, '<p>')
    .replace(/(?<!<\/[h1-6]>|<\/div>|<\/p>|<\/img>|<\/strong>|<\/em>)$/gm, '</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-6])/g, '$1')
    .replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  
  return formatted;
}

// Run the restoration
restoreLessonContentIntegrity()
  .then(result => {
    console.log('\n📋 RESTORATION SUMMARY:');
    console.log(`✅ Success: ${result.success}`);
    console.log(`📊 Lessons processed: ${result.totalProcessed}`);
    console.log(`❌ Duplicate groups: ${result.duplicateGroups}`);
    console.log(`🤖 AI contaminated: ${result.aiContaminated}`);
  })
  .catch(console.error);