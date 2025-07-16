import { db } from '../server/db';
import { courseLessons, courseChapters, courses } from '../shared/schema';
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

interface LessonWithContext {
  id: number;
  title: string;
  content: string;
  courseId: number;
  courseName: string;
  chapterTitle: string;
  chapterOrder: number;
  lessonOrder: number;
}

async function comprehensiveContentMatching() {
  console.log('🎯 COMPREHENSIVE CONTENT MATCHING - PRECISION LESSON ALIGNMENT');
  
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
  
  // Step 2: Filter high-quality content
  const qualityContent = csvData.filter(row => 
    row.text && 
    row.text.trim().length > 30 &&
    row.titleOfRichText &&
    row.titleOfRichText.trim().length > 1 &&
    !row.text.includes('Creating the Optimal Sleep Environment') &&
    !row.text.includes('Following safe sleep practices is essential') &&
    !row.text.includes('To move forward, please complete all prerequisites') &&
    !row.titleOfRichText.includes('Tester') &&
    !row.titleOfRichText.includes('djlhfiu') &&
    !row.titleOfRichText.includes('data-align') &&
    row.titleOfRichText !== '' &&
    row.titleOfRichText !== 'Welcome' &&
    row.titleOfRichText !== 'Introduction' &&
    row.titleOfRichText !== 'Course Overview' &&
    row.titleOfRichText !== 'Course Overview Video' &&
    row.titleOfRichText !== 'Course 1' &&
    row.titleOfRichText !== 'Course 2' &&
    row.titleOfRichText !== 'Tutorial 1' &&
    row.titleOfRichText !== 'Chapter 1' &&
    row.titleOfRichText !== 'Chapter 2.1' &&
    row.titleOfRichText !== 'chapter1' &&
    row.titleOfRichText !== '3.0' &&
    row.titleOfRichText !== '3.2' &&
    row.titleOfRichText !== '4.2' &&
    row.titleOfRichText !== '4.3'
  );
  
  console.log(`📋 Found ${qualityContent.length} high-quality CSV entries`);
  
  // Step 3: Get all lessons with full context
  const lessonsWithContext = await db.select({
    id: courseLessons.id,
    title: courseLessons.title,
    content: courseLessons.content,
    courseId: courseLessons.courseId,
    courseName: courses.title,
    chapterTitle: courseChapters.title,
    chapterOrder: courseChapters.orderIndex,
    lessonOrder: courseLessons.orderIndex
  })
  .from(courseLessons)
  .leftJoin(courseChapters, eq(courseLessons.chapterId, courseChapters.id))
  .leftJoin(courses, eq(courseLessons.courseId, courses.id));
  
  console.log(`📚 Found ${lessonsWithContext.length} lessons with context`);
  
  // Step 4: Advanced matching strategies
  const matches = new Map<number, CSVRow>();
  const usedContent = new Set<number>();
  
  // Strategy 1: Exact title matches
  console.log('\n🎯 STRATEGY 1: Exact Title Matching');
  for (const lesson of lessonsWithContext) {
    for (let i = 0; i < qualityContent.length; i++) {
      if (usedContent.has(i)) continue;
      
      const csvEntry = qualityContent[i];
      const lessonTitle = lesson.title.toLowerCase().trim();
      const csvTitle = csvEntry.titleOfRichText.toLowerCase().trim();
      
      if (lessonTitle === csvTitle) {
        matches.set(lesson.id, csvEntry);
        usedContent.add(i);
        console.log(`✅ EXACT: "${lesson.title}" ↔ "${csvEntry.titleOfRichText}"`);
        break;
      }
    }
  }
  
  // Strategy 2: Clean title matches (remove numbers/formatting)
  console.log('\n🎯 STRATEGY 2: Clean Title Matching');
  for (const lesson of lessonsWithContext) {
    if (matches.has(lesson.id)) continue;
    
    for (let i = 0; i < qualityContent.length; i++) {
      if (usedContent.has(i)) continue;
      
      const csvEntry = qualityContent[i];
      const cleanLesson = lesson.title
        .replace(/^(\d+\.?\d*\s*)/g, '') // Remove numbers
        .replace(/^(Evidence Based|Academic|FAQ|Frequently Asked|Course|Module|Chapter)\s*/i, '') // Remove prefixes
        .toLowerCase()
        .trim();
      
      const cleanCsv = csvEntry.titleOfRichText
        .replace(/^(\d+\.?\d*\s*)/g, '')
        .replace(/^(Evidence Based|Academic|FAQ|Frequently Asked|Course|Module|Chapter)\s*/i, '')
        .toLowerCase()
        .trim();
      
      if (cleanLesson === cleanCsv && cleanLesson.length > 3) {
        matches.set(lesson.id, csvEntry);
        usedContent.add(i);
        console.log(`✅ CLEAN: "${lesson.title}" ↔ "${csvEntry.titleOfRichText}"`);
        break;
      }
    }
  }
  
  // Strategy 3: Sleep Environment specific matching
  console.log('\n🎯 STRATEGY 3: Sleep Environment Matching');
  for (const lesson of lessonsWithContext) {
    if (matches.has(lesson.id)) continue;
    
    const lessonTitle = lesson.title.toLowerCase();
    
    // Look for specific sleep environment topics
    if (lessonTitle.includes('sleep environment') || lessonTitle.includes('room temperature') || 
        lessonTitle.includes('lighting') || lessonTitle.includes('noise') || 
        lessonTitle.includes('bedding') || lessonTitle.includes('mattress')) {
      
      for (let i = 0; i < qualityContent.length; i++) {
        if (usedContent.has(i)) continue;
        
        const csvEntry = qualityContent[i];
        const csvTitle = csvEntry.titleOfRichText.toLowerCase();
        const csvContent = csvEntry.text.toLowerCase();
        
        if (lessonTitle.includes('room temperature') && 
            (csvTitle.includes('temperature') || csvContent.includes('18-20°c') || csvContent.includes('room temperature'))) {
          matches.set(lesson.id, csvEntry);
          usedContent.add(i);
          console.log(`✅ TEMP: "${lesson.title}" ↔ "${csvEntry.titleOfRichText}"`);
          break;
        }
        
        if (lessonTitle.includes('lighting') && 
            (csvTitle.includes('lighting') || csvTitle.includes('darkness') || csvContent.includes('blackout'))) {
          matches.set(lesson.id, csvEntry);
          usedContent.add(i);
          console.log(`✅ LIGHT: "${lesson.title}" ↔ "${csvEntry.titleOfRichText}"`);
          break;
        }
        
        if (lessonTitle.includes('noise') && 
            (csvTitle.includes('noise') || csvTitle.includes('white noise') || csvContent.includes('white noise'))) {
          matches.set(lesson.id, csvEntry);
          usedContent.add(i);
          console.log(`✅ NOISE: "${lesson.title}" ↔ "${csvEntry.titleOfRichText}"`);
          break;
        }
        
        if ((lessonTitle.includes('bedding') || lessonTitle.includes('mattress')) && 
            (csvTitle.includes('bedding') || csvTitle.includes('mattress') || csvContent.includes('mattress'))) {
          matches.set(lesson.id, csvEntry);
          usedContent.add(i);
          console.log(`✅ BEDDING: "${lesson.title}" ↔ "${csvEntry.titleOfRichText}"`);
          break;
        }
      }
    }
  }
  
  // Strategy 4: Keyword-based matching
  console.log('\n🎯 STRATEGY 4: Keyword-Based Matching');
  for (const lesson of lessonsWithContext) {
    if (matches.has(lesson.id)) continue;
    
    const lessonTitle = lesson.title.toLowerCase();
    
    for (let i = 0; i < qualityContent.length; i++) {
      if (usedContent.has(i)) continue;
      
      const csvEntry = qualityContent[i];
      const csvTitle = csvEntry.titleOfRichText.toLowerCase();
      const csvContent = csvEntry.text.toLowerCase();
      
      // Extract key terms from lesson title
      const keyTerms = lessonTitle
        .replace(/\d+\.?\d*\s*/, '') // Remove numbers
        .split(/\s+/)
        .filter(term => term.length > 3)
        .slice(0, 3); // Take first 3 significant terms
      
      // Check if CSV entry contains these key terms
      let matchScore = 0;
      for (const term of keyTerms) {
        if (csvTitle.includes(term) || csvContent.includes(term)) {
          matchScore++;
        }
      }
      
      // If 60% or more key terms match, consider it a match
      if (matchScore >= Math.ceil(keyTerms.length * 0.6) && keyTerms.length > 0) {
        matches.set(lesson.id, csvEntry);
        usedContent.add(i);
        console.log(`✅ KEYWORD: "${lesson.title}" ↔ "${csvEntry.titleOfRichText}" (score: ${matchScore}/${keyTerms.length})`);
        break;
      }
    }
  }
  
  // Strategy 5: Content-based matching for specific topics
  console.log('\n🎯 STRATEGY 5: Content-Based Topic Matching');
  const topicMap = new Map<string, string[]>([
    ['mastitis', ['mastitis', 'blocked duct', 'breast infection']],
    ['oversupply', ['oversupply', 'too much milk', 'excess milk']],
    ['engorgement', ['engorgement', 'breast fullness', 'swollen breasts']],
    ['cluster feeding', ['cluster feeding', 'frequent feeding', 'growth spurt']],
    ['sleep cycles', ['sleep cycle', 'rem sleep', 'deep sleep', 'light sleep']],
    ['swaddling', ['swaddling', 'wrap', 'swaddle']],
    ['white noise', ['white noise', 'background noise', 'shushing']],
    ['tummy time', ['tummy time', 'prone position', 'belly time']],
    ['wind', ['wind', 'gas', 'burping', 'trapped air']],
    ['settling', ['settling', 'calming', 'soothing']],
    ['tired signs', ['tired signs', 'sleep cues', 'sleepy signals']],
    ['routine', ['routine', 'schedule', 'pattern']],
    ['night feeds', ['night feed', 'night feeding', 'overnight feed']],
    ['sleep regression', ['sleep regression', 'developmental leap', 'sleep disruption']],
    ['separation anxiety', ['separation anxiety', 'clingy', 'attachment']],
    ['nightmares', ['nightmare', 'bad dream', 'night terror']],
    ['early morning', ['early morning', 'early waking', 'dawn wake']],
    ['nap refusal', ['nap refusal', 'won\'t nap', 'fighting nap']],
    ['short naps', ['short nap', 'cat nap', 'brief sleep']],
    ['bedtime battles', ['bedtime battle', 'bedtime struggle', 'won\'t go to bed']],
    ['toddler sleep', ['toddler sleep', 'big kid bed', 'preschool sleep']],
    ['feeding problems', ['feeding problem', 'bottle refusal', 'breastfeeding difficulty']],
    ['formula feeding', ['formula feeding', 'bottle feeding', 'artificial feeding']],
    ['breastfeeding', ['breastfeeding', 'nursing', 'breast milk']],
    ['weaning', ['weaning', 'stopping breastfeeding', 'transitioning']],
    ['solid foods', ['solid food', 'baby led weaning', 'first foods']],
    ['allergies', ['allergy', 'allergic reaction', 'food sensitivity']],
    ['development', ['development', 'milestone', 'growth']],
    ['mental health', ['mental health', 'postnatal depression', 'anxiety', 'wellbeing']],
    ['partner support', ['partner support', 'dad', 'father', 'non-breastfeeding parent']],
    ['twins', ['twin', 'multiple', 'double']],
    ['newborn', ['newborn', 'first weeks', 'brand new baby']],
    ['premature', ['premature', 'preemie', 'early birth']],
    ['reflux', ['reflux', 'vomit', 'spit up', 'posset']],
    ['colic', ['colic', 'crying', 'unsettled']],
    ['jaundice', ['jaundice', 'yellow', 'bilirubin']],
    ['cradle cap', ['cradle cap', 'seborrheic dermatitis', 'scalp condition']],
    ['eczema', ['eczema', 'atopic dermatitis', 'skin condition']],
    ['teething', ['teething', 'teeth', 'gums']],
    ['dummy', ['dummy', 'pacifier', 'soother']],
    ['car seat', ['car seat', 'travel', 'safety']],
    ['daycare', ['daycare', 'childcare', 'nursery']],
    ['toilet training', ['toilet training', 'potty training', 'toileting']],
    ['discipline', ['discipline', 'behaviour', 'boundaries']],
    ['anxiety', ['anxiety', 'worry', 'stress']],
    ['sleep training', ['sleep training', 'controlled crying', 'self-settling']]
  ]);
  
  for (const lesson of lessonsWithContext) {
    if (matches.has(lesson.id)) continue;
    
    const lessonTitle = lesson.title.toLowerCase();
    
    for (const [topic, keywords] of topicMap) {
      if (keywords.some(keyword => lessonTitle.includes(keyword))) {
        for (let i = 0; i < qualityContent.length; i++) {
          if (usedContent.has(i)) continue;
          
          const csvEntry = qualityContent[i];
          const csvTitle = csvEntry.titleOfRichText.toLowerCase();
          const csvContent = csvEntry.text.toLowerCase();
          
          if (keywords.some(keyword => csvTitle.includes(keyword) || csvContent.includes(keyword))) {
            matches.set(lesson.id, csvEntry);
            usedContent.add(i);
            console.log(`✅ TOPIC: "${lesson.title}" ↔ "${csvEntry.titleOfRichText}" (${topic})`);
            break;
          }
        }
        break;
      }
    }
  }
  
  // Step 5: Apply matches and identify gaps
  console.log('\n🚀 APPLYING PRECISION MATCHES...');
  
  let appliedCount = 0;
  let noContentCount = 0;
  
  for (const lesson of lessonsWithContext) {
    if (matches.has(lesson.id)) {
      const csvEntry = matches.get(lesson.id)!;
      const formattedContent = formatContentFromCSV(csvEntry.text);
      
      await db.update(courseLessons)
        .set({ 
          content: formattedContent,
          updatedAt: new Date()
        })
        .where(eq(courseLessons.id, lesson.id));
      
      appliedCount++;
      console.log(`✅ Applied: "${lesson.title}" (${formattedContent.length} chars)`);
    } else {
      noContentCount++;
      console.log(`⚠️  No match: "${lesson.title}" in ${lesson.courseName}`);
    }
  }
  
  console.log(`\n📊 MATCHING RESULTS:`);
  console.log(`✅ Successfully matched: ${appliedCount} lessons`);
  console.log(`❌ No content found: ${noContentCount} lessons`);
  console.log(`📈 Match rate: ${((appliedCount / lessonsWithContext.length) * 100).toFixed(1)}%`);
  
  // Step 6: List lessons still needing content
  console.log('\n📋 LESSONS STILL NEEDING CONTENT:');
  const lessonsNeedingContent = lessonsWithContext.filter(lesson => !matches.has(lesson.id));
  lessonsNeedingContent.slice(0, 20).forEach((lesson, index) => {
    console.log(`${index + 1}. "${lesson.title}" (${lesson.courseName})`);
  });
  
  if (lessonsNeedingContent.length > 20) {
    console.log(`... and ${lessonsNeedingContent.length - 20} more`);
  }
  
  return {
    totalLessons: lessonsWithContext.length,
    matchedLessons: appliedCount,
    unmatchedLessons: noContentCount,
    matchRate: ((appliedCount / lessonsWithContext.length) * 100)
  };
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

// Run the comprehensive matching
comprehensiveContentMatching()
  .then(result => {
    console.log('\n🎯 COMPREHENSIVE MATCHING COMPLETE!');
    console.log(`✅ Match rate: ${result.matchRate.toFixed(1)}%`);
    console.log(`📊 ${result.matchedLessons}/${result.totalLessons} lessons matched`);
  })
  .catch(console.error);