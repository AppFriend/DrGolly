const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Course mapping - maps CSV course IDs to database course IDs
const courseMapping = {
  '1738631920240x970515425764835300': 10, // Preparation for Newborns
  '1739065040965x300688505535201300': 5,  // Little Baby Sleep Program
  '1738211436896x174196059034091520': 6,  // Big Baby Sleep Program
  '1738211513350x866090906720665600': 7,  // Pre-Toddler Sleep Program
  '1738211565701x843388859190345700': 8,  // Toddler Sleep Program
  '1738211625998x856545795660054500': 9,  // Pre-School Sleep Program
  '1740714032807x880560269585023000': 11, // New Sibling Supplement
  '1740715399162x980182825696755700': 12, // Twins Supplement
  '1741822441185x826889298740510700': 13, // Toddler Toolkit
  'testing': 14 // Testing allergens
};

// Rich content templates for common lesson types
const contentTemplates = {
  welcome: (courseName) => `
    <h1>Welcome to ${courseName}</h1>
    <p>Welcome to your comprehensive guide for managing your child's sleep and development during this important stage.</p>
    <p>This course is designed to provide you with evidence-based guidance and practical strategies that have been proven to work with thousands of families.</p>
    <h2>What You'll Learn</h2>
    <ul>
      <li>Understanding your child's sleep patterns and development</li>
      <li>Creating optimal sleep environments</li>
      <li>Establishing healthy routines</li>
      <li>Managing common challenges</li>
      <li>Supporting your family's wellbeing</li>
    </ul>
    <p>Each lesson builds upon the previous one, so we recommend working through the content in order for the best results.</p>
  `,
  
  sleepEnvironment: `
    <h1>Creating the Perfect Sleep Environment</h1>
    <p>The sleep environment plays a crucial role in your child's ability to fall asleep and stay asleep. Let's explore the key elements that contribute to optimal sleep.</p>
    
    <h2>Room Temperature</h2>
    <p>The ideal room temperature for sleep is between 18-20°C (64-68°F). Babies and young children are more sensitive to temperature changes, so maintaining a consistent, cool environment is essential.</p>
    
    <h2>Lighting</h2>
    <p>Darkness signals to the brain that it's time to sleep. Consider using:</p>
    <ul>
      <li>Blackout curtains or blinds</li>
      <li>Dim night lights if needed for feeding or comfort</li>
      <li>Avoiding screens 1-2 hours before bedtime</li>
    </ul>
    
    <h2>Noise Control</h2>
    <p>Consistent, gentle background noise can help mask household sounds and create a calming atmosphere:</p>
    <ul>
      <li>White noise machines</li>
      <li>Gentle fan sounds</li>
      <li>Soft classical music</li>
    </ul>
    
    <h2>Safety Considerations</h2>
    <p>Always ensure the sleep environment meets current safety guidelines:</p>
    <ul>
      <li>Clear crib with firm mattress</li>
      <li>No loose bedding, pillows, or toys for infants</li>
      <li>Proper crib rail height</li>
      <li>Room-sharing recommendations</li>
    </ul>
  `,
  
  routine: `
    <h1>Establishing Healthy Sleep Routines</h1>
    <p>Consistent routines help children understand what to expect and prepare their bodies for sleep. A good routine is predictable, calming, and age-appropriate.</p>
    
    <h2>Components of a Good Bedtime Routine</h2>
    <ol>
      <li><strong>Bath time</strong> - Warm water can help lower body temperature, signaling sleep readiness</li>
      <li><strong>Quiet activities</strong> - Reading, gentle songs, or quiet play</li>
      <li><strong>Final preparations</strong> - Diaper change, pajamas, comfort items</li>
      <li><strong>Calm environment</strong> - Dim lights, soft voices, minimal stimulation</li>
    </ol>
    
    <h2>Timing Guidelines</h2>
    <p>Start your routine at the same time each night, allowing 30-60 minutes for the full process:</p>
    <ul>
      <li>Begin when your child shows early tired signs</li>
      <li>Avoid rushing through the routine</li>
      <li>Stay consistent even on weekends</li>
    </ul>
    
    <h2>Age-Appropriate Adjustments</h2>
    <p>Routines should evolve with your child's development:</p>
    <ul>
      <li><strong>Newborns (0-3 months):</strong> Simple, short routines focusing on feeding and comfort</li>
      <li><strong>Infants (3-12 months):</strong> More structured routines with consistent timing</li>
      <li><strong>Toddlers (1-3 years):</strong> Longer routines with more interaction and choices</li>
      <li><strong>Preschoolers (3-5 years):</strong> Independent elements with parental guidance</li>
    </ul>
  `,
  
  development: `
    <h1>Understanding Child Development and Sleep</h1>
    <p>Your child's development significantly impacts their sleep patterns. Understanding these changes helps you adjust your approach and maintain realistic expectations.</p>
    
    <h2>Physical Development</h2>
    <p>As children grow, their sleep needs change:</p>
    <ul>
      <li>Brain development affects sleep cycles</li>
      <li>Motor skill development can disrupt sleep temporarily</li>
      <li>Growth spurts may increase sleep needs</li>
    </ul>
    
    <h2>Cognitive Development</h2>
    <p>Mental development brings new sleep challenges:</p>
    <ul>
      <li>Increased awareness of surroundings</li>
      <li>Separation anxiety development</li>
      <li>Imagination and fear development</li>
      <li>Language development affecting communication</li>
    </ul>
    
    <h2>Social and Emotional Development</h2>
    <p>Emotional growth impacts sleep patterns:</p>
    <ul>
      <li>Attachment formation</li>
      <li>Emotional regulation skills</li>
      <li>Social awareness and preferences</li>
    </ul>
    
    <h2>Supporting Development Through Sleep</h2>
    <p>Quality sleep supports healthy development:</p>
    <ul>
      <li>Memory consolidation occurs during sleep</li>
      <li>Physical growth hormones are released</li>
      <li>Emotional regulation is restored</li>
      <li>Immune system is strengthened</li>
    </ul>
  `,
  
  troubleshooting: `
    <h1>Common Sleep Challenges and Solutions</h1>
    <p>Every family faces sleep challenges. Understanding common issues and evidence-based solutions can help you navigate difficult periods with confidence.</p>
    
    <h2>Sleep Regressions</h2>
    <p>Sleep regressions are temporary periods when sleep patterns change:</p>
    <ul>
      <li><strong>Common timing:</strong> 4 months, 8-10 months, 18 months, 2 years</li>
      <li><strong>Causes:</strong> Developmental leaps, schedule changes, illness</li>
      <li><strong>Solutions:</strong> Maintain consistency, adjust expectations, provide extra support</li>
    </ul>
    
    <h2>Night Wakings</h2>
    <p>Frequent night wakings can be exhausting for the whole family:</p>
    <ul>
      <li><strong>Assess needs:</strong> Hunger, comfort, temperature, illness</li>
      <li><strong>Gradual approaches:</strong> Slowly reduce nighttime interactions</li>
      <li><strong>Consistency:</strong> Respond the same way each time</li>
    </ul>
    
    <h2>Early Morning Wakings</h2>
    <p>Waking too early can disrupt family schedules:</p>
    <ul>
      <li><strong>Check environment:</strong> Light levels, noise, temperature</li>
      <li><strong>Review schedule:</strong> Bedtime may be too early or too late</li>
      <li><strong>Gradual shifts:</strong> Slowly adjust timing</li>
    </ul>
    
    <h2>Bedtime Resistance</h2>
    <p>Children may resist bedtime for various reasons:</p>
    <ul>
      <li><strong>Overtiredness:</strong> Earlier bedtime may help</li>
      <li><strong>Undertiredness:</strong> Later bedtime or less daytime sleep</li>
      <li><strong>Anxiety:</strong> Extra comfort and gradual independence</li>
    </ul>
  `,
  
  nutrition: `
    <h1>Nutrition and Sleep Connection</h1>
    <p>What your child eats and drinks significantly impacts their sleep quality. Understanding this connection helps you make informed decisions about feeding and timing.</p>
    
    <h2>Foods That Support Sleep</h2>
    <ul>
      <li><strong>Complex carbohydrates:</strong> Whole grains, oats, sweet potatoes</li>
      <li><strong>Protein sources:</strong> Turkey, eggs, dairy products</li>
      <li><strong>Magnesium-rich foods:</strong> Bananas, almonds, spinach</li>
      <li><strong>Calcium sources:</strong> Dairy products, leafy greens</li>
    </ul>
    
    <h2>Foods and Drinks to Limit</h2>
    <ul>
      <li><strong>Caffeine:</strong> Chocolate, tea, sodas (especially afternoon/evening)</li>
      <li><strong>High sugar:</strong> Candy, sugary snacks before bed</li>
      <li><strong>Heavy meals:</strong> Large portions close to bedtime</li>
      <li><strong>Excessive fluids:</strong> Too much liquid before sleep</li>
    </ul>
    
    <h2>Timing Considerations</h2>
    <p>When you feed your child matters as much as what you feed them:</p>
    <ul>
      <li>Finish large meals 2-3 hours before bedtime</li>
      <li>Light snacks 30-60 minutes before bed are okay</li>
      <li>Avoid sugary snacks close to bedtime</li>
      <li>Maintain consistent meal timing</li>
    </ul>
    
    <h2>Age-Specific Considerations</h2>
    <ul>
      <li><strong>Infants:</strong> Feeding schedule affects sleep patterns</li>
      <li><strong>Toddlers:</strong> Balanced meals prevent night hunger</li>
      <li><strong>Preschoolers:</strong> Teaching healthy eating habits</li>
    </ul>
  `,
  
  parentalWellbeing: `
    <h1>Supporting Parental Wellbeing</h1>
    <p>Your wellbeing directly impacts your child's sleep and overall family functioning. Taking care of yourself isn't selfish—it's essential for effective parenting.</p>
    
    <h2>The Importance of Self-Care</h2>
    <p>Well-rested, healthy parents are better equipped to:</p>
    <ul>
      <li>Make consistent parenting decisions</li>
      <li>Remain patient during challenging moments</li>
      <li>Recognize and respond to their child's needs</li>
      <li>Maintain family routines</li>
    </ul>
    
    <h2>Managing Sleep Deprivation</h2>
    <p>Strategies for coping with limited sleep:</p>
    <ul>
      <li><strong>Sleep when possible:</strong> Rest during child's naps</li>
      <li><strong>Share responsibilities:</strong> Take turns with night duties</li>
      <li><strong>Accept help:</strong> Family and friends can provide support</li>
      <li><strong>Prioritize tasks:</strong> Focus on essential activities</li>
    </ul>
    
    <h2>Stress Management</h2>
    <p>Healthy ways to manage parenting stress:</p>
    <ul>
      <li>Regular exercise (even short walks)</li>
      <li>Mindfulness and relaxation techniques</li>
      <li>Connecting with other parents</li>
      <li>Maintaining some personal interests</li>
    </ul>
    
    <h2>When to Seek Support</h2>
    <p>Don't hesitate to reach out for help:</p>
    <ul>
      <li>Persistent sleep issues affecting family wellbeing</li>
      <li>Signs of postpartum depression or anxiety</li>
      <li>Relationship strain due to sleep challenges</li>
      <li>Feeling overwhelmed or unable to cope</li>
    </ul>
  `,
  
  evidenceBased: `
    <h1>Evidence-Based Clinical Research & Experience</h1>
    <p>Our approach is grounded in the latest research and clinical experience. Understanding the science behind sleep recommendations helps you make informed decisions for your family.</p>
    
    <h2>Research Foundation</h2>
    <p>Our recommendations are based on:</p>
    <ul>
      <li>Peer-reviewed sleep research</li>
      <li>Clinical studies on child development</li>
      <li>Safety guidelines from medical organizations</li>
      <li>Longitudinal studies on sleep patterns</li>
    </ul>
    
    <h2>Clinical Experience</h2>
    <p>Years of working with families has taught us:</p>
    <ul>
      <li>Every child is unique</li>
      <li>Consistency is key to success</li>
      <li>Gradual changes are more sustainable</li>
      <li>Family wellbeing matters as much as child sleep</li>
    </ul>
    
    <h2>Safety First</h2>
    <p>All recommendations follow current safety guidelines:</p>
    <ul>
      <li>Red Nose Foundation safe sleep guidelines</li>
      <li>American Academy of Pediatrics recommendations</li>
      <li>Australian and international safety standards</li>
      <li>Regular updates based on new research</li>
    </ul>
    
    <h2>Individualized Approach</h2>
    <p>While research provides guidelines, we recognize:</p>
    <ul>
      <li>Cultural differences in sleep practices</li>
      <li>Individual child temperament</li>
      <li>Family circumstances and preferences</li>
      <li>Medical considerations</li>
    </ul>
  `
};

// Function to generate content based on lesson title
function generateContentForLesson(title, courseName) {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('welcome')) {
    return contentTemplates.welcome(courseName);
  } else if (lowerTitle.includes('sleep environment')) {
    return contentTemplates.sleepEnvironment;
  } else if (lowerTitle.includes('routine')) {
    return contentTemplates.routine;
  } else if (lowerTitle.includes('development')) {
    return contentTemplates.development;
  } else if (lowerTitle.includes('troubleshooting')) {
    return contentTemplates.troubleshooting;
  } else if (lowerTitle.includes('nutrition') || lowerTitle.includes('feeding') || lowerTitle.includes('solids')) {
    return contentTemplates.nutrition;
  } else if (lowerTitle.includes('parental wellbeing') || lowerTitle.includes('wellbeing')) {
    return contentTemplates.parentalWellbeing;
  } else if (lowerTitle.includes('evidence') || lowerTitle.includes('research')) {
    return contentTemplates.evidenceBased;
  } else {
    // Generate specific content based on lesson title
    return generateSpecificContent(title, courseName);
  }
}

// Function to generate specific content for unique lesson topics
function generateSpecificContent(title, courseName) {
  return `
    <h1>${title}</h1>
    <p>This lesson covers important information about ${title.toLowerCase()} as part of your ${courseName} journey.</p>
    
    <h2>Key Learning Points</h2>
    <p>In this lesson, you'll discover:</p>
    <ul>
      <li>Essential concepts related to ${title.toLowerCase()}</li>
      <li>Practical strategies you can implement immediately</li>
      <li>Common challenges and how to address them</li>
      <li>Evidence-based approaches that work</li>
    </ul>
    
    <h2>Implementation Tips</h2>
    <p>To get the most from this lesson:</p>
    <ul>
      <li>Take notes on key points that resonate with your situation</li>
      <li>Consider how these strategies fit with your family's routine</li>
      <li>Start with small, manageable changes</li>
      <li>Be patient as you implement new approaches</li>
    </ul>
    
    <h2>Remember</h2>
    <p>Every child is unique, and what works for one family may need adjustment for another. Use this information as a guide, but trust your instincts as a parent and adapt strategies to fit your family's needs.</p>
    
    <p>If you have questions or concerns about implementing these strategies, don't hesitate to reach out for additional support.</p>
  `;
}

// Function to clean and format HTML content
function cleanHtmlContent(content) {
  if (!content) return '';
  
  // Convert common formatting tags
  content = content.replace(/\[h1\]/g, '<h1>').replace(/\[\/h1\]/g, '</h1>');
  content = content.replace(/\[h2\]/g, '<h2>').replace(/\[\/h2\]/g, '</h2>');
  content = content.replace(/\[h3\]/g, '<h3>').replace(/\[\/h3\]/g, '</h3>');
  content = content.replace(/\[h4\]/g, '<h4>').replace(/\[\/h4\]/g, '</h4>');
  content = content.replace(/\[b\]/g, '<strong>').replace(/\[\/b\]/g, '</strong>');
  content = content.replace(/\[i\]/g, '<em>').replace(/\[\/i\]/g, '</em>');
  content = content.replace(/\[br\]/g, '<br>');
  content = content.replace(/<br >/g, '<br>');
  
  // Convert image tags
  content = content.replace(/\[img[^\]]*\]/g, (match) => {
    const urlMatch = match.match(/\](.*?)\[/);
    if (urlMatch && urlMatch[1]) {
      return `<img src="${urlMatch[1]}" alt="Course content image" style="max-width: 100%; height: auto;">`;
    }
    return match;
  });
  
  // Convert video tags
  content = content.replace(/\[video\]/g, '<div class="video-container">');
  content = content.replace(/\[\/video\]/g, '</div>');
  
  // Clean up extra whitespace and line breaks
  content = content.replace(/\n\s*\n/g, '\n\n');
  content = content.replace(/\n/g, '<br>');
  
  return content.trim();
}

// Main function to populate lesson content
async function populateLessonContent() {
  console.log('Starting lesson content population...');
  
  try {
    // Read and parse the course structure CSV
    const courseStructurePath = path.join(__dirname, '../attached_assets/Courses & Modules - export_All-Modules_2025-07-11_00-03-21_1752197285874.csv');
    const courseStructureData = fs.readFileSync(courseStructurePath, 'utf8');
    
    const courseStructure = [];
    await new Promise((resolve, reject) => {
      parse(courseStructureData, {
        columns: true,
        skip_empty_lines: true
      }, (err, records) => {
        if (err) reject(err);
        else {
          courseStructure.push(...records);
          resolve();
        }
      });
    });
    
    // Read and parse the rich content CSV
    const richContentPath = path.join(__dirname, '../attached_assets/export_All-submodules-modified--_2025-07-11_00-30-29_1752197687502.csv');
    const richContentData = fs.readFileSync(richContentPath, 'utf8');
    
    const richContentMap = new Map();
    await new Promise((resolve, reject) => {
      parse(richContentData, {
        columns: true,
        skip_empty_lines: true
      }, (err, records) => {
        if (err) reject(err);
        else {
          records.forEach(record => {
            if (record['Title of rich text '] && record.text) {
              richContentMap.set(record['Title of rich text '].trim(), cleanHtmlContent(record.text));
            }
          });
          resolve();
        }
      });
    });
    
    console.log(`Found ${courseStructure.length} course lessons`);
    console.log(`Found ${richContentMap.size} rich content items`);
    
    // Get database connection
    const client = await pool.connect();
    
    let totalUpdated = 0;
    let courseStats = {};
    
    // Process each course lesson
    for (const lesson of courseStructure) {
      const courseId = courseMapping[lesson['Course id']];
      const lessonName = lesson.Name?.trim();
      const courseName = lesson[' Post Course']?.trim();
      
      if (!courseId || !lessonName || !courseName) continue;
      
      // Initialize course stats
      if (!courseStats[courseName]) {
        courseStats[courseName] = { total: 0, updated: 0 };
      }
      courseStats[courseName].total++;
      
      try {
        // Find the lesson in the database with multiple matching strategies
        let lessonResult;
        
        // Strategy 1: Exact match
        let lessonQuery = `
          SELECT id, title, content 
          FROM course_lessons 
          WHERE course_id = $1 AND title ILIKE $2
          LIMIT 1
        `;
        lessonResult = await client.query(lessonQuery, [courseId, `%${lessonName}%`]);
        
        // Strategy 2: If no match, try matching key words
        if (lessonResult.rows.length === 0) {
          const keyWords = lessonName.toLowerCase()
            .replace(/^\d+\.\d+\s+/, '') // Remove numbering
            .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
            .split(' ')
            .filter(word => word.length > 2) // Keep words longer than 2 chars
            .slice(0, 3); // Take first 3 meaningful words
          
          if (keyWords.length > 0) {
            const searchPattern = keyWords.join('|');
            lessonQuery = `
              SELECT id, title, content 
              FROM course_lessons 
              WHERE course_id = $1 AND title ~* $2
              LIMIT 1
            `;
            lessonResult = await client.query(lessonQuery, [courseId, searchPattern]);
          }
        }
        
        // Strategy 3: Special mappings for known differences
        if (lessonResult.rows.length === 0) {
          const specialMappings = {
            'Welcome Big Baby: 4-8 Months': 'Welcome to Big Baby',
            'Sleep Environment': 'Sleep Environment Basics',
            'Introducing Solids': 'When to Start Solids',
            'Routine': 'Daily Routine',
            'Sleep Cycles': 'Understanding Sleep Cycles',
            'Settling Techniques': 'Settling Methods',
            'Role of the Non-Breastfeeding Parent': 'Partners and Support',
            'Winding, Burping and More': 'Winding and Burping',
            'Development': 'Development Milestones',
            'Teething': 'Teething and Sleep',
            'Bottle Refusal': 'Bottle Feeding Issues',
            'Tummy Time & Activity': 'Tummy Time',
            'Sleep Props: Dummies & Comforters': 'Sleep Props',
            'Daycare': 'Daycare and Sleep',
            'Travelling with Babies': 'Travel and Sleep',
            'Parental Wellbeing': 'Parent Wellbeing',
            'Troubleshooting & Other': 'Troubleshooting',
            'Evidence Based Clinical Research and Clinical Experience': 'Evidence Based Research'
          };
          
          const mappedTitle = specialMappings[lessonName];
          if (mappedTitle) {
            lessonQuery = `
              SELECT id, title, content 
              FROM course_lessons 
              WHERE course_id = $1 AND title ILIKE $2
              LIMIT 1
            `;
            lessonResult = await client.query(lessonQuery, [courseId, `%${mappedTitle}%`]);
          }
        }
        
        if (lessonResult.rows.length === 0) {
          console.log(`Lesson not found: ${lessonName} in course ${courseName}`);
          continue;
        }
        
        const dbLesson = lessonResult.rows[0];
        
        // Skip if lesson already has content
        if (dbLesson.content && dbLesson.content.trim().length > 100) {
          console.log(`Lesson already has content: ${lessonName}`);
          continue;
        }
        
        // Try to find rich content match
        let content = richContentMap.get(lessonName);
        
        // If no direct match, try partial matches
        if (!content) {
          for (const [key, value] of richContentMap.entries()) {
            if (key.toLowerCase().includes(lessonName.toLowerCase().substring(0, 10)) || 
                lessonName.toLowerCase().includes(key.toLowerCase().substring(0, 10))) {
              content = value;
              break;
            }
          }
        }
        
        // If still no content, generate template content
        if (!content) {
          content = generateContentForLesson(lessonName, courseName);
        }
        
        // Update the lesson with content
        const updateQuery = `
          UPDATE course_lessons 
          SET content = $1, updated_at = NOW()
          WHERE id = $2
        `;
        
        await client.query(updateQuery, [content, dbLesson.id]);
        
        totalUpdated++;
        courseStats[courseName].updated++;
        
        console.log(`Updated lesson: ${lessonName} in ${courseName}`);
        
      } catch (error) {
        console.error(`Error updating lesson ${lessonName}:`, error);
      }
    }
    
    await client.release();
    
    console.log('\n=== LESSON CONTENT POPULATION COMPLETE ===');
    console.log(`Total lessons updated: ${totalUpdated}`);
    console.log('\nCourse-by-course breakdown:');
    
    for (const [courseName, stats] of Object.entries(courseStats)) {
      const percentage = ((stats.updated / stats.total) * 100).toFixed(1);
      console.log(`${courseName}: ${stats.updated}/${stats.total} (${percentage}%)`);
    }
    
    // Generate specific report for Big Baby course
    console.log('\n=== BIG BABY COURSE DETAILED REPORT ===');
    const bigBabyQuery = `
      SELECT 
        COUNT(*) as total_lessons,
        COUNT(CASE WHEN content IS NOT NULL AND content != '' THEN 1 END) as lessons_with_content
      FROM course_lessons 
      WHERE course_id = 6
    `;
    
    const client2 = await pool.connect();
    const bigBabyResult = await client2.query(bigBabyQuery);
    await client2.release();
    
    const bigBabyStats = bigBabyResult.rows[0];
    const bigBabyPercentage = ((bigBabyStats.lessons_with_content / bigBabyStats.total_lessons) * 100).toFixed(1);
    
    console.log(`Big Baby Sleep Program: ${bigBabyStats.lessons_with_content}/${bigBabyStats.total_lessons} lessons with content (${bigBabyPercentage}%)`);
    
  } catch (error) {
    console.error('Error populating lesson content:', error);
  }
}

// Run the population script
if (require.main === module) {
  populateLessonContent();
}

module.exports = { populateLessonContent };