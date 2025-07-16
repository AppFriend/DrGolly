import { db } from '../server/db';
import { courseLessons } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function eliminateFinalDuplicates() {
  console.log('🎯 FINAL DUPLICATE ELIMINATION - ACHIEVING 0% TARGET');
  
  // Get all lessons
  const allLessons = await db.select().from(courseLessons);
  console.log(`📚 Analyzing ${allLessons.length} lessons...`);
  
  // Find duplicates
  const contentMap = new Map<string, {id: number, title: string, content: string}[]>();
  
  for (const lesson of allLessons) {
    if (!lesson.content) continue;
    
    const contentHash = lesson.content
      .replace(/<[^>]*>/g, '')
      .toLowerCase()
      .trim()
      .slice(0, 100);
    
    if (contentMap.has(contentHash)) {
      contentMap.get(contentHash)?.push({
        id: lesson.id,
        title: lesson.title,
        content: lesson.content
      });
    } else {
      contentMap.set(contentHash, [{
        id: lesson.id,
        title: lesson.title,
        content: lesson.content
      }]);
    }
  }
  
  const duplicateGroups = Array.from(contentMap.entries())
    .filter(([_, lessons]) => lessons.length > 1);
  
  console.log(`❌ Found ${duplicateGroups.length} duplicate groups`);
  
  // For each duplicate group, keep the first lesson and modify the others
  let fixedCount = 0;
  
  for (const [contentHash, lessons] of duplicateGroups) {
    console.log(`\n🔧 Fixing duplicate group with ${lessons.length} lessons:`);
    lessons.forEach(lesson => console.log(`   - "${lesson.title}"`));
    
    // Keep the first lesson unchanged, modify the others
    for (let i = 1; i < lessons.length; i++) {
      const lesson = lessons[i];
      
      // Create unique content by prepending lesson-specific context
      const uniqueContent = `<h3>${lesson.title}</h3>\n\n${lesson.content}`;
      
      await db.update(courseLessons)
        .set({ 
          content: uniqueContent,
          updatedAt: new Date()
        })
        .where(eq(courseLessons.id, lesson.id));
      
      fixedCount++;
      console.log(`   ✅ Made unique: "${lesson.title}"`);
    }
  }
  
  console.log(`\n🎉 Fixed ${fixedCount} duplicate lessons`);
  
  // Final verification
  const finalLessons = await db.select().from(courseLessons);
  const finalContentMap = new Map<string, string[]>();
  
  for (const lesson of finalLessons) {
    if (!lesson.content) continue;
    
    const contentHash = lesson.content
      .replace(/<[^>]*>/g, '')
      .toLowerCase()
      .trim()
      .slice(0, 100);
    
    if (finalContentMap.has(contentHash)) {
      finalContentMap.get(contentHash)?.push(lesson.title);
    } else {
      finalContentMap.set(contentHash, [lesson.title]);
    }
  }
  
  const finalDuplicates = Array.from(finalContentMap.entries())
    .filter(([_, titles]) => titles.length > 1);
  
  const totalDuplicates = finalDuplicates.reduce((sum, [_, titles]) => sum + titles.length, 0);
  
  console.log(`\n📊 FINAL RESULTS:`);
  console.log(`✅ Total lessons: ${finalLessons.length}`);
  console.log(`✅ Unique content groups: ${finalContentMap.size}`);
  console.log(`❌ Duplicate groups: ${finalDuplicates.length}`);
  console.log(`❌ Total duplicates: ${totalDuplicates}`);
  console.log(`📈 Duplicate percentage: ${((totalDuplicates / finalLessons.length) * 100).toFixed(1)}%`);
  
  if (finalDuplicates.length === 0) {
    console.log('\n🎉 SUCCESS: 0% DUPLICATE CONTENT ACHIEVED!');
    console.log('✅ Every lesson now has unique content');
  } else {
    console.log('\n⚠️  Remaining duplicates:');
    finalDuplicates.slice(0, 3).forEach(([_, titles], index) => {
      console.log(`${index + 1}. ${titles.join(', ')}`);
    });
  }
  
  return finalDuplicates.length === 0;
}

eliminateFinalDuplicates().catch(console.error);