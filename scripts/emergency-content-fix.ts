import { db } from '../server/db';
import { courseLessons, courseChapters, courses } from '../shared/schema';
import { eq, isNull, or } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

interface CSVRow {
  text: string;
  titleOfRichText: string;
}

async function emergencyContentFix() {
  console.log('🚨 EMERGENCY CONTENT FIX - FILLING REMAINING GAPS');
  
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
        text: fields[6] || '',
        titleOfRichText: fields[7] || ''
      });
    }
  }
  
  // Step 2: Filter usable content
  const usableContent = csvData.filter(row => 
    row.text && 
    row.text.trim().length > 20 &&
    row.titleOfRichText &&
    row.titleOfRichText.trim().length > 1 &&
    !row.text.includes('Creating the Optimal Sleep Environment') &&
    !row.text.includes('mnbkjbbfvjhhvjhcdc') &&
    !row.text.includes('jkbfcjk.SHB') &&
    !row.text.includes('KHFZG GKZHG') &&
    !row.text.includes('testing a') &&
    !row.text.includes('Testing Text') &&
    !row.titleOfRichText.includes('Tester') &&
    !row.titleOfRichText.includes('djlhfiu') &&
    row.titleOfRichText !== 'Welcome' &&
    row.titleOfRichText !== 'Introduction' &&
    row.titleOfRichText !== 'Course Overview'
  );
  
  console.log(`📋 Found ${usableContent.length} usable CSV entries`);
  
  // Step 3: Find lessons without content
  const lessonsWithoutContent = await db.select({
    id: courseLessons.id,
    title: courseLessons.title,
    content: courseLessons.content,
    courseId: courseLessons.courseId,
    courseName: courses.title
  })
  .from(courseLessons)
  .leftJoin(courses, eq(courseLessons.courseId, courses.id))
  .where(or(
    isNull(courseLessons.content),
    eq(courseLessons.content, '')
  ));
  
  console.log(`❌ Found ${lessonsWithoutContent.length} lessons without content`);
  
  // Step 4: Advanced matching for empty lessons
  const assignments = new Map<number, CSVRow>();
  const usedContent = new Set<number>();
  
  for (const lesson of lessonsWithoutContent) {
    const lessonTitle = lesson.title.toLowerCase().trim();
    let bestMatch = -1;
    let bestScore = 0;
    
    // Try different matching approaches
    for (let i = 0; i < usableContent.length; i++) {
      if (usedContent.has(i)) continue;
      
      const csvEntry = usableContent[i];
      const csvTitle = csvEntry.titleOfRichText.toLowerCase().trim();
      const csvContent = csvEntry.text.toLowerCase();
      
      let score = 0;
      
      // Exact match (highest priority)
      if (lessonTitle === csvTitle) {
        score = 1000;
      }
      // Clean title match
      else if (lessonTitle.replace(/^(\d+\.?\d*\s*)/g, '') === csvTitle.replace(/^(\d+\.?\d*\s*)/g, '')) {
        score = 900;
      }
      // Contains match
      else if (lessonTitle.includes(csvTitle) || csvTitle.includes(lessonTitle)) {
        score = 800;
      }
      // Keyword scoring
      else {
        const lessonWords = lessonTitle.split(/\s+/).filter(w => w.length > 2);
        const csvWords = csvTitle.split(/\s+/).filter(w => w.length > 2);
        
        for (const word of lessonWords) {
          if (csvTitle.includes(word)) score += 10;
          if (csvContent.includes(word)) score += 5;
        }
        
        for (const word of csvWords) {
          if (lessonTitle.includes(word)) score += 10;
        }
      }
      
      // Topic-specific bonuses
      if (lessonTitle.includes('sleep') && (csvTitle.includes('sleep') || csvContent.includes('sleep'))) score += 50;
      if (lessonTitle.includes('feed') && (csvTitle.includes('feed') || csvContent.includes('feed'))) score += 50;
      if (lessonTitle.includes('routine') && (csvTitle.includes('routine') || csvContent.includes('routine'))) score += 50;
      if (lessonTitle.includes('wind') && (csvTitle.includes('wind') || csvContent.includes('wind'))) score += 50;
      if (lessonTitle.includes('settling') && (csvTitle.includes('settling') || csvContent.includes('settling'))) score += 50;
      if (lessonTitle.includes('breast') && (csvTitle.includes('breast') || csvContent.includes('breast'))) score += 50;
      if (lessonTitle.includes('bottle') && (csvTitle.includes('bottle') || csvContent.includes('bottle'))) score += 50;
      if (lessonTitle.includes('nap') && (csvTitle.includes('nap') || csvContent.includes('nap'))) score += 50;
      if (lessonTitle.includes('night') && (csvTitle.includes('night') || csvContent.includes('night'))) score += 50;
      if (lessonTitle.includes('toddler') && (csvTitle.includes('toddler') || csvContent.includes('toddler'))) score += 50;
      if (lessonTitle.includes('baby') && (csvTitle.includes('baby') || csvContent.includes('baby'))) score += 30;
      if (lessonTitle.includes('development') && (csvTitle.includes('development') || csvContent.includes('development'))) score += 40;
      if (lessonTitle.includes('environment') && (csvTitle.includes('environment') || csvContent.includes('environment'))) score += 40;
      if (lessonTitle.includes('temperature') && (csvTitle.includes('temperature') || csvContent.includes('temperature'))) score += 60;
      if (lessonTitle.includes('noise') && (csvTitle.includes('noise') || csvContent.includes('noise'))) score += 60;
      if (lessonTitle.includes('light') && (csvTitle.includes('light') || csvContent.includes('light'))) score += 60;
      if (lessonTitle.includes('bedding') && (csvTitle.includes('bedding') || csvContent.includes('bedding'))) score += 60;
      if (lessonTitle.includes('mattress') && (csvTitle.includes('mattress') || csvContent.includes('mattress'))) score += 60;
      if (lessonTitle.includes('swaddle') && (csvTitle.includes('swaddle') || csvContent.includes('swaddle'))) score += 60;
      if (lessonTitle.includes('dummy') && (csvTitle.includes('dummy') || csvContent.includes('dummy'))) score += 60;
      if (lessonTitle.includes('pacifier') && (csvTitle.includes('pacifier') || csvContent.includes('pacifier'))) score += 60;
      if (lessonTitle.includes('mastitis') && (csvTitle.includes('mastitis') || csvContent.includes('mastitis'))) score += 100;
      if (lessonTitle.includes('engorgement') && (csvTitle.includes('engorgement') || csvContent.includes('engorgement'))) score += 100;
      if (lessonTitle.includes('cluster') && (csvTitle.includes('cluster') || csvContent.includes('cluster'))) score += 80;
      if (lessonTitle.includes('colic') && (csvTitle.includes('colic') || csvContent.includes('colic'))) score += 80;
      if (lessonTitle.includes('reflux') && (csvTitle.includes('reflux') || csvContent.includes('reflux'))) score += 80;
      if (lessonTitle.includes('allergy') && (csvTitle.includes('allergy') || csvContent.includes('allergy'))) score += 80;
      if (lessonTitle.includes('solid') && (csvTitle.includes('solid') || csvContent.includes('solid'))) score += 70;
      if (lessonTitle.includes('weaning') && (csvTitle.includes('weaning') || csvContent.includes('weaning'))) score += 70;
      if (lessonTitle.includes('anxiety') && (csvTitle.includes('anxiety') || csvContent.includes('anxiety'))) score += 70;
      if (lessonTitle.includes('separation') && (csvTitle.includes('separation') || csvContent.includes('separation'))) score += 70;
      if (lessonTitle.includes('milestone') && (csvTitle.includes('milestone') || csvContent.includes('milestone'))) score += 60;
      if (lessonTitle.includes('motor') && (csvTitle.includes('motor') || csvContent.includes('motor'))) score += 60;
      if (lessonTitle.includes('cognitive') && (csvTitle.includes('cognitive') || csvContent.includes('cognitive'))) score += 60;
      if (lessonTitle.includes('language') && (csvTitle.includes('language') || csvContent.includes('language'))) score += 60;
      if (lessonTitle.includes('social') && (csvTitle.includes('social') || csvContent.includes('social'))) score += 60;
      if (lessonTitle.includes('emotional') && (csvTitle.includes('emotional') || csvContent.includes('emotional'))) score += 60;
      if (lessonTitle.includes('safety') && (csvTitle.includes('safety') || csvContent.includes('safety'))) score += 50;
      if (lessonTitle.includes('car seat') && (csvTitle.includes('car seat') || csvContent.includes('car seat'))) score += 80;
      if (lessonTitle.includes('travel') && (csvTitle.includes('travel') || csvContent.includes('travel'))) score += 50;
      if (lessonTitle.includes('daycare') && (csvTitle.includes('daycare') || csvContent.includes('daycare'))) score += 60;
      if (lessonTitle.includes('childcare') && (csvTitle.includes('childcare') || csvContent.includes('childcare'))) score += 60;
      if (lessonTitle.includes('twin') && (csvTitle.includes('twin') || csvContent.includes('twin'))) score += 100;
      if (lessonTitle.includes('sibling') && (csvTitle.includes('sibling') || csvContent.includes('sibling'))) score += 80;
      if (lessonTitle.includes('newborn') && (csvTitle.includes('newborn') || csvContent.includes('newborn'))) score += 70;
      if (lessonTitle.includes('premature') && (csvTitle.includes('premature') || csvContent.includes('premature'))) score += 90;
      if (lessonTitle.includes('jaundice') && (csvTitle.includes('jaundice') || csvContent.includes('jaundice'))) score += 90;
      if (lessonTitle.includes('cradle cap') && (csvTitle.includes('cradle cap') || csvContent.includes('cradle cap'))) score += 90;
      if (lessonTitle.includes('eczema') && (csvTitle.includes('eczema') || csvContent.includes('eczema'))) score += 90;
      if (lessonTitle.includes('teething') && (csvTitle.includes('teething') || csvContent.includes('teething'))) score += 80;
      if (lessonTitle.includes('mental health') && (csvTitle.includes('mental health') || csvContent.includes('mental health'))) score += 80;
      if (lessonTitle.includes('wellbeing') && (csvTitle.includes('wellbeing') || csvContent.includes('wellbeing'))) score += 70;
      if (lessonTitle.includes('partner') && (csvTitle.includes('partner') || csvContent.includes('partner'))) score += 60;
      if (lessonTitle.includes('support') && (csvTitle.includes('support') || csvContent.includes('support'))) score += 50;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = i;
      }
    }
    
    if (bestMatch >= 0 && bestScore > 0) {
      assignments.set(lesson.id, usableContent[bestMatch]);
      usedContent.add(bestMatch);
      console.log(`✅ MATCH: "${lesson.title}" ↔ "${usableContent[bestMatch].titleOfRichText}" (score: ${bestScore})`);
    } else {
      console.log(`❌ NO MATCH: "${lesson.title}"`);
    }
  }
  
  // Step 5: Apply assignments
  console.log(`\n🚀 APPLYING ${assignments.size} EMERGENCY FIXES...`);
  
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
    } catch (error) {
      console.error(`❌ Failed to update lesson ${lessonId}: ${error}`);
    }
  }
  
  console.log(`\n📊 EMERGENCY FIX RESULTS:`);
  console.log(`✅ Successfully fixed: ${successCount} lessons`);
  console.log(`❌ Still empty: ${lessonsWithoutContent.length - successCount} lessons`);
  
  // Final status check
  const finalLessons = await db.select().from(courseLessons);
  const finalWithContent = finalLessons.filter(l => l.content && l.content.trim().length > 0);
  
  console.log(`\n🎯 FINAL STATUS:`);
  console.log(`✅ Lessons with content: ${finalWithContent.length}`);
  console.log(`❌ Lessons without content: ${finalLessons.length - finalWithContent.length}`);
  console.log(`📈 Content coverage: ${((finalWithContent.length / finalLessons.length) * 100).toFixed(1)}%`);
  
  return {
    fixed: successCount,
    remaining: lessonsWithoutContent.length - successCount,
    coverage: ((finalWithContent.length / finalLessons.length) * 100)
  };
}

function formatContentFromCSV(text: string): string {
  let formatted = text.trim();
  
  // Convert bubble-style formatting to HTML (preserve original content)
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

// Run the emergency fix
emergencyContentFix()
  .then(result => {
    console.log('\n🚨 EMERGENCY FIX COMPLETE!');
    console.log(`✅ Fixed ${result.fixed} lessons`);
    console.log(`❌ ${result.remaining} lessons still need content`);
    console.log(`📈 Coverage: ${result.coverage.toFixed(1)}%`);
  })
  .catch(console.error);