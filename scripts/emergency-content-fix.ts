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
  module: string;
  setTimeFrame: string;
  text: string;
  titleOfRichText: string;
  titleOfVideo: string;
  uploadContent: string;
}

async function emergencyContentFix() {
  console.log('🚨 EMERGENCY CONTENT FIX - ELIMINATING ALL DUPLICATES');
  
  // Step 1: Clear all AI-contaminated content
  console.log('\n🧹 STEP 1: Clearing AI-contaminated content...');
  await db.update(courseLessons)
    .set({ 
      content: '',
      updatedAt: new Date()
    })
    .where(eq(courseLessons.content, 'Creating the Optimal Sleep Environment'));
  
  // Step 2: Read CSV and prepare authentic content
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
  
  // Filter for authentic content only
  const authenticContent = csvData.filter(row => 
    row.text && 
    row.text.trim().length > 20 &&
    row.titleOfRichText &&
    row.titleOfRichText.trim().length > 2 &&
    !row.text.includes('Creating the Optimal Sleep Environment') &&
    !row.text.includes('Safe Sleep Guidelines') &&
    !row.text.includes('Following safe sleep practices is essential')
  );
  
  console.log(`📊 Found ${authenticContent.length} authentic CSV entries`);
  
  // Step 3: Get all lessons and create unique assignments
  const allLessons = await db.select().from(courseLessons);
  console.log(`📚 Found ${allLessons.length} lessons to populate`);
  
  // Step 4: Create one-to-one mapping (no duplicates allowed)
  const usedContentIndices = new Set<number>();
  const assignments: Array<{lesson: any, csvEntry: CSVRow, confidence: number}> = [];
  
  // First pass: Exact matches
  for (const lesson of allLessons) {
    for (let i = 0; i < authenticContent.length; i++) {
      if (usedContentIndices.has(i)) continue;
      
      const csvEntry = authenticContent[i];
      const lessonTitle = lesson.title.toLowerCase().trim();
      const csvTitle = csvEntry.titleOfRichText.toLowerCase().trim();
      
      if (lessonTitle === csvTitle) {
        assignments.push({lesson, csvEntry, confidence: 100});
        usedContentIndices.add(i);
        console.log(`✅ EXACT MATCH: "${lesson.title}" ↔ "${csvEntry.titleOfRichText}"`);
        break;
      }
    }
  }
  
  // Second pass: Partial matches for unassigned lessons
  const unassignedLessons = allLessons.filter(lesson => 
    !assignments.some(a => a.lesson.id === lesson.id)
  );
  
  for (const lesson of unassignedLessons) {
    let bestMatch: {csvEntry: CSVRow, confidence: number, index: number} | null = null;
    
    for (let i = 0; i < authenticContent.length; i++) {
      if (usedContentIndices.has(i)) continue;
      
      const csvEntry = authenticContent[i];
      const lessonTitle = lesson.title.toLowerCase().trim();
      const csvTitle = csvEntry.titleOfRichText.toLowerCase().trim();
      
      // Remove numbering and check
      const cleanLesson = lessonTitle.replace(/^(\d+\.?\d*\s*)/g, '');
      const cleanCsv = csvTitle.replace(/^(\d+\.?\d*\s*)/g, '');
      
      if (cleanLesson === cleanCsv) {
        bestMatch = {csvEntry, confidence: 95, index: i};
        break;
      }
      
      // Contains match
      if (lessonTitle.includes(csvTitle) || csvTitle.includes(lessonTitle)) {
        if (!bestMatch || bestMatch.confidence < 80) {
          bestMatch = {csvEntry, confidence: 80, index: i};
        }
      }
    }
    
    if (bestMatch) {
      assignments.push({lesson, csvEntry: bestMatch.csvEntry, confidence: bestMatch.confidence});
      usedContentIndices.add(bestMatch.index);
      console.log(`✅ PARTIAL MATCH: "${lesson.title}" ↔ "${bestMatch.csvEntry.titleOfRichText}" (${bestMatch.confidence}%)`);
    }
  }
  
  // Step 5: Fill remaining lessons with unused content (round-robin to avoid duplicates)
  const stillUnassigned = allLessons.filter(lesson => 
    !assignments.some(a => a.lesson.id === lesson.id)
  );
  
  const unusedContent = authenticContent.filter((_, index) => !usedContentIndices.has(index));
  
  for (let i = 0; i < stillUnassigned.length; i++) {
    const lesson = stillUnassigned[i];
    const csvEntry = unusedContent[i % unusedContent.length]; // Round-robin to prevent duplicates
    
    if (csvEntry) {
      assignments.push({lesson, csvEntry, confidence: 50});
      console.log(`⚠️  FALLBACK ASSIGN: "${lesson.title}" ↔ "${csvEntry.titleOfRichText}"`);
    }
  }
  
  console.log(`\n📊 ASSIGNMENT SUMMARY:`);
  console.log(`✅ Total assignments: ${assignments.length}`);
  console.log(`❌ Unassigned lessons: ${allLessons.length - assignments.length}`);
  console.log(`📋 Unused CSV content: ${authenticContent.length - usedContentIndices.size}`);
  
  // Step 6: Apply all assignments
  console.log('\n🚀 APPLYING UNIQUE CONTENT ASSIGNMENTS...');
  
  let successCount = 0;
  
  for (const assignment of assignments) {
    const formattedContent = formatContentFromCSV(assignment.csvEntry.text);
    
    try {
      await db.update(courseLessons)
        .set({ 
          content: formattedContent,
          updatedAt: new Date()
        })
        .where(eq(courseLessons.id, assignment.lesson.id));
      
      successCount++;
      console.log(`✅ Applied: "${assignment.lesson.title}" (${formattedContent.length} chars)`);
    } catch (error) {
      console.error(`❌ Failed to update lesson ${assignment.lesson.id}: ${error}`);
    }
  }
  
  console.log(`\n🎉 EMERGENCY FIX COMPLETE!`);
  console.log(`✅ Successfully updated ${successCount} lessons`);
  
  // Step 7: Final duplicate check
  console.log('\n🔍 FINAL DUPLICATE CHECK...');
  const finalLessons = await db.select().from(courseLessons);
  const contentHashes = new Set<string>();
  let duplicateCount = 0;
  
  for (const lesson of finalLessons) {
    if (!lesson.content) continue;
    
    const contentHash = lesson.content
      .replace(/<[^>]*>/g, '')
      .toLowerCase()
      .trim()
      .slice(0, 200);
    
    if (contentHashes.has(contentHash)) {
      duplicateCount++;
    } else {
      contentHashes.add(contentHash);
    }
  }
  
  console.log(`📊 FINAL RESULTS:`);
  console.log(`✅ Unique lessons: ${contentHashes.size}`);
  console.log(`❌ Duplicate lessons: ${duplicateCount}`);
  console.log(`📈 Duplicate percentage: ${((duplicateCount / finalLessons.length) * 100).toFixed(1)}%`);
  
  if (duplicateCount === 0) {
    console.log('🎉 SUCCESS: ZERO DUPLICATE CONTENT ACHIEVED!');
  } else {
    console.log('⚠️  Warning: Some duplicates remain');
  }
}

function formatContentFromCSV(text: string): string {
  let formatted = text.trim();
  
  // Convert bubble-style formatting to HTML
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

emergencyContentFix().catch(console.error);