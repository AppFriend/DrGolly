import { db } from '../server/db';
import { courseLessons } from '../shared/schema';

async function checkDuplicates() {
  console.log('🔍 CHECKING FOR DUPLICATE CONTENT...');
  
  const allLessons = await db.select().from(courseLessons);
  console.log(`📚 Checking ${allLessons.length} lessons for duplicates...`);
  
  const contentMap = new Map<string, {id: number, title: string, content: string}[]>();
  
  for (const lesson of allLessons) {
    if (!lesson.content) continue;
    
    // Create a hash of the first 200 characters (normalized)
    const contentHash = lesson.content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);
    
    if (contentMap.has(contentHash)) {
      contentMap.get(contentHash)?.push({
        id: lesson.id,
        title: lesson.title,
        content: lesson.content.slice(0, 300)
      });
    } else {
      contentMap.set(contentHash, [{
        id: lesson.id,
        title: lesson.title,
        content: lesson.content.slice(0, 300)
      }]);
    }
  }
  
  // Find duplicates
  const duplicates = Array.from(contentMap.entries())
    .filter(([_, lessons]) => lessons.length > 1);
  
  console.log(`\n📊 DUPLICATE CONTENT REPORT:`);
  console.log(`✅ Unique lessons: ${contentMap.size - duplicates.length}`);
  console.log(`❌ Duplicate content groups: ${duplicates.length}`);
  
  if (duplicates.length === 0) {
    console.log('🎉 ZERO DUPLICATE CONTENT FOUND - All lessons are unique!');
  } else {
    let totalDuplicateLessons = 0;
    duplicates.forEach(([contentHash, lessons], index) => {
      totalDuplicateLessons += lessons.length;
      console.log(`\n${index + 1}. Duplicate content found in ${lessons.length} lessons:`);
      lessons.forEach(lesson => console.log(`   - ID ${lesson.id}: "${lesson.title}"`));
      console.log(`   Content preview: "${contentHash.slice(0, 100)}..."`);
    });
    
    console.log(`\n❌ TOTAL LESSONS WITH DUPLICATE CONTENT: ${totalDuplicateLessons}`);
    console.log(`📈 DUPLICATE PERCENTAGE: ${((totalDuplicateLessons / allLessons.length) * 100).toFixed(1)}%`);
  }
  
  // Check specifically for "Creating the Optimal Sleep Environment" contamination
  console.log('\n🔍 CHECKING FOR AI-GENERATED CONTENT...');
  const aiContaminated = allLessons.filter(lesson => 
    lesson.content && 
    lesson.content.includes('Creating the Optimal Sleep Environment')
  );
  
  console.log(`❌ AI-CONTAMINATED LESSONS: ${aiContaminated.length}`);
  if (aiContaminated.length > 0) {
    console.log('First 10 AI-contaminated lessons:');
    aiContaminated.slice(0, 10).forEach((lesson, index) => {
      console.log(`${index + 1}. ID ${lesson.id}: "${lesson.title}"`);
    });
  }
  
  return {
    totalLessons: allLessons.length,
    duplicateGroups: duplicates.length,
    aiContaminated: aiContaminated.length
  };
}

checkDuplicates().catch(console.error);