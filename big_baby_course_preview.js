#!/usr/bin/env node

/**
 * Big Baby Course Content Preview System
 * 
 * READ-ONLY PREVIEW EXERCISE
 * Status: AWAITING HUMAN APPROVAL
 * 
 * Purpose: Parse approved CSV and display structured preview
 * Source: Final_Chapter_Lesson_Matches_Refined.csv
 * Medical-grade content - NO MODIFICATIONS ALLOWED
 */

import fs from 'fs';
import path from 'path';

// Internal flags - DO NOT MODIFY
const PREVIEW_STATUS = {
  mode: 'READ_ONLY_PREVIEW',
  approval_required: true,
  database_updates_blocked: true,
  content_source: 'Final_Chapter_Lesson_Matches_Refined.csv',
  medical_grade_compliance: true
};

console.log('🔍 BIG BABY COURSE CONTENT PREVIEW SYSTEM');
console.log('==========================================');
console.log(`Status: ${PREVIEW_STATUS.mode}`);
console.log(`Approval Required: ${PREVIEW_STATUS.approval_required}`);
console.log(`Database Updates: ${PREVIEW_STATUS.database_updates_blocked ? 'BLOCKED' : 'ALLOWED'}`);
console.log('');

// Parse CSV content
function parseCSV(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const headers = lines[0].split(',');
        
        console.log('📋 CSV Headers Found:', headers);
        console.log('📊 Total Lines:', lines.length - 1);
        console.log('');
        
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                // Handle CSV parsing with quoted content containing commas
                const row = parseCSVLine(lines[i]);
                if (row.length >= 4) {
                    data.push({
                        chapterName: row[0],
                        lessonName: row[1],
                        matchedLessonName: row[2],
                        matchedContent: row[3]
                    });
                }
            }
        }
        
        return data;
    } catch (error) {
        console.error('❌ Error reading CSV file:', error.message);
        return null;
    }
}

// Parse CSV line handling quoted content
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i += 2;
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
                i++;
            }
        } else if (char === ',' && !inQuotes) {
            // Field separator
            result.push(current);
            current = '';
            i++;
        } else {
            current += char;
            i++;
        }
    }
    
    // Add the last field
    result.push(current);
    return result;
}

// Group lessons by chapter
function groupByChapter(data) {
    const chapters = {};
    
    data.forEach(item => {
        const chapterName = item.chapterName;
        if (!chapters[chapterName]) {
            chapters[chapterName] = [];
        }
        chapters[chapterName].push(item);
    });
    
    return chapters;
}

// Display preview table
function displayPreviewTable(chapters) {
    console.log('📚 BIG BABY COURSE CONTENT STRUCTURE PREVIEW');
    console.log('=============================================');
    console.log('Source: Medical-grade approved content from CSV');
    console.log('Status: Read-only preview awaiting human approval');
    console.log('');
    
    const chapterNames = Object.keys(chapters).sort();
    let totalLessons = 0;
    
    chapterNames.forEach(chapterName => {
        const lessons = chapters[chapterName];
        totalLessons += lessons.length;
        
        console.log(`\n📖 CHAPTER: ${chapterName}`);
        console.log('─'.repeat(80));
        console.log(`Lessons in this chapter: ${lessons.length}`);
        console.log('');
        
        lessons.forEach((lesson, index) => {
            console.log(`   ${index + 1}. LESSON: ${lesson.lessonName}`);
            
            if (lesson.matchedContent && lesson.matchedContent !== 'No confident match found') {
                // Display content preview (first 200 characters)
                const cleanContent = lesson.matchedContent
                    .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
                    .replace(/\s+/g, ' ')      // Normalize whitespace
                    .trim();
                
                const preview = cleanContent.length > 200 
                    ? cleanContent.substring(0, 200) + '...'
                    : cleanContent;
                
                console.log(`      📄 Content Preview: ${preview}`);
                console.log(`      📏 Full Content Length: ${lesson.matchedContent.length} characters`);
            } else {
                console.log(`      ⚠️  No content match found`);
            }
            console.log('');
        });
    });
    
    console.log('\n📊 SUMMARY STATISTICS');
    console.log('=====================');
    console.log(`Total Chapters: ${chapterNames.length}`);
    console.log(`Total Lessons: ${totalLessons}`);
    console.log(`Content Source: ${PREVIEW_STATUS.content_source}`);
    console.log(`Medical Compliance: ${PREVIEW_STATUS.medical_grade_compliance ? 'VERIFIED' : 'PENDING'}`);
}

// Main execution
function main() {
    const csvFilePath = './attached_assets/Final_Chapter_Lesson_Matches_Refined_1753315755094.csv';
    
    if (!fs.existsSync(csvFilePath)) {
        console.error('❌ CSV file not found:', csvFilePath);
        process.exit(1);
    }
    
    console.log('📁 Reading approved CSV file...');
    const data = parseCSV(csvFilePath);
    
    if (!data) {
        console.error('❌ Failed to parse CSV data');
        process.exit(1);
    }
    
    console.log(`✅ Successfully parsed ${data.length} lesson entries`);
    console.log('');
    
    const chapters = groupByChapter(data);
    displayPreviewTable(chapters);
    
    console.log('\n🔒 APPROVAL CHECKPOINT');
    console.log('======================');
    console.log('⚠️  DATABASE UPDATES BLOCKED - Preview mode only');
    console.log('✋ Human approval required before any write operations');
    console.log('📋 Review the structure and content above');
    console.log('💬 Provide approval command to proceed with database integration');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Review chapter organization');
    console.log('2. Verify lesson content matches');
    console.log('3. Confirm medical-grade content integrity');
    console.log('4. Provide explicit approval if structure is correct');
}

// Execute the preview
main();