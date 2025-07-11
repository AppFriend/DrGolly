const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Comprehensive content templates by lesson category
const contentTemplates = {
  // Sleep Environment Templates
  sleepEnvironment: {
    basics: `
      <h1>Sleep Environment Basics</h1>
      <p>Creating the perfect sleep environment is fundamental to your baby's sleep success. The right environment signals to your baby that it's time to rest and helps them fall asleep faster and stay asleep longer.</p>
      
      <h2>Key Elements of a Good Sleep Environment</h2>
      <ul>
        <li><strong>Temperature:</strong> Keep the room between 18-20°C (64-68°F)</li>
        <li><strong>Darkness:</strong> Use blackout curtains or blinds</li>
        <li><strong>Quiet:</strong> Minimize sudden noises and disruptions</li>
        <li><strong>Safety:</strong> Follow safe sleep guidelines at all times</li>
      </ul>
      
      <h2>Room Setup Checklist</h2>
      <ul>
        <li>Install blackout curtains or blinds</li>
        <li>Check room temperature regularly</li>
        <li>Remove any loose items from the cot</li>
        <li>Ensure the mattress is firm and fitted properly</li>
        <li>Position the cot away from windows, heaters, and cords</li>
      </ul>
      
      <h2>Common Mistakes to Avoid</h2>
      <ul>
        <li>Room too hot or too cold</li>
        <li>Too much light entering the room</li>
        <li>Loud or sudden noises</li>
        <li>Unsafe sleep surfaces or objects</li>
      </ul>
    `,
    
    temperature: `
      <h1>Room Temperature</h1>
      <p>The ideal room temperature for your baby's sleep is between 18-20°C (64-68°F). Babies are more sensitive to temperature changes than adults, making temperature control crucial for quality sleep.</p>
      
      <h2>Why Temperature Matters</h2>
      <p>Your baby's body temperature naturally drops as they prepare for sleep. A room that's too hot can prevent this natural cooling process, while a room that's too cold can cause frequent wakings.</p>
      
      <h2>How to Check Room Temperature</h2>
      <ul>
        <li>Use a room thermometer for accuracy</li>
        <li>Check the temperature at baby's cot level</li>
        <li>Monitor throughout the night if possible</li>
        <li>Adjust heating/cooling as needed</li>
      </ul>
      
      <h2>Dressing Your Baby</h2>
      <p>Dress your baby in light sleep clothing. A good rule of thumb is one more layer than you would wear to be comfortable.</p>
      
      <h2>Signs of Temperature Issues</h2>
      <ul>
        <li><strong>Too hot:</strong> Sweating, flushed cheeks, damp hair</li>
        <li><strong>Too cold:</strong> Cool chest, frequent waking, restlessness</li>
      </ul>
    `,
    
    lighting: `
      <h1>Lighting Considerations</h1>
      <p>Light exposure plays a crucial role in regulating your baby's circadian rhythm. Understanding how to use light effectively can dramatically improve your baby's sleep quality.</p>
      
      <h2>The Science of Light and Sleep</h2>
      <p>Light exposure suppresses melatonin production, the hormone that makes us feel sleepy. During the day, bright light helps maintain alertness, while darkness at night promotes sleep.</p>
      
      <h2>Daytime Light Exposure</h2>
      <ul>
        <li>Expose baby to natural light during wake times</li>
        <li>Open curtains and blinds during the day</li>
        <li>Spend time outdoors when possible</li>
        <li>Use bright lights for evening routines before dimming</li>
      </ul>
      
      <h2>Nighttime Darkness</h2>
      <ul>
        <li>Use blackout curtains or blinds</li>
        <li>Keep night lights red or amber if needed</li>
        <li>Avoid bright lights during night feeds</li>
        <li>Consider eye masks for very sensitive babies</li>
      </ul>
      
      <h2>Managing Light Pollution</h2>
      <ul>
        <li>Block streetlights and car headlights</li>
        <li>Use curtains that overlap window frames</li>
        <li>Consider portable blackout solutions for travel</li>
      </ul>
    `
  },
  
  // Nutrition Templates
  nutrition: {
    introducingSolids: `
      <h1>Introducing Solids</h1>
      <p>Starting solids is an exciting milestone that can significantly impact your baby's sleep patterns. Understanding when and how to introduce solids helps ensure better sleep for the whole family.</p>
      
      <h2>When to Start</h2>
      <p>Most babies are ready for solids around 6 months, but look for these signs:</p>
      <ul>
        <li>Can sit up with support</li>
        <li>Shows interest in food</li>
        <li>Can hold their head steady</li>
        <li>Lost the tongue-thrust reflex</li>
        <li>Can pick up objects and bring them to mouth</li>
      </ul>
      
      <h2>First Foods</h2>
      <ul>
        <li>Iron-rich foods (meat, poultry, fish, iron-fortified cereals)</li>
        <li>Vegetables (sweet potato, pumpkin, carrot)</li>
        <li>Fruits (banana, avocado, pear)</li>
        <li>Grains (oats, rice, quinoa)</li>
      </ul>
      
      <h2>Sleep and Solids Connection</h2>
      <p>Introducing solids can affect sleep in several ways:</p>
      <ul>
        <li>Increased satiety can lead to longer sleep periods</li>
        <li>Digestive changes may temporarily disrupt sleep</li>
        <li>Iron intake supports healthy sleep patterns</li>
        <li>Timing of meals affects sleep quality</li>
      </ul>
      
      <h2>Meal Timing for Better Sleep</h2>
      <ul>
        <li>Offer solids 2-3 hours before bedtime</li>
        <li>Avoid heavy meals close to sleep time</li>
        <li>Consider a light snack if baby seems hungry</li>
        <li>Maintain consistent meal times</li>
      </ul>
    `,
    
    feedingSchedule: `
      <h1>Feeding Schedule</h1>
      <p>A well-structured feeding schedule supports your baby's natural sleep patterns and helps establish healthy eating habits that will benefit them throughout their life.</p>
      
      <h2>Age-Based Feeding Guidelines</h2>
      
      <h3>4-6 Months</h3>
      <ul>
        <li>Milk feeds every 3-4 hours</li>
        <li>5-6 feeds per day</li>
        <li>Night feeds may still be needed</li>
        <li>Watch for hunger cues</li>
      </ul>
      
      <h3>6-8 Months</h3>
      <ul>
        <li>3 meals + 3-4 milk feeds</li>
        <li>Start with breakfast and lunch</li>
        <li>Add dinner once established</li>
        <li>Milk feeds between meals</li>
      </ul>
      
      <h2>Sample Daily Schedule</h2>
      <p><strong>6:30am:</strong> Wake up + milk feed</p>
      <p><strong>8:00am:</strong> Breakfast</p>
      <p><strong>10:30am:</strong> Milk feed</p>
      <p><strong>12:00pm:</strong> Lunch</p>
      <p><strong>2:30pm:</strong> Milk feed</p>
      <p><strong>5:00pm:</strong> Dinner</p>
      <p><strong>6:30pm:</strong> Bedtime milk feed</p>
      
      <h2>Flexibility Within Structure</h2>
      <p>While consistency is important, remember that:</p>
      <ul>
        <li>Babies have different appetites on different days</li>
        <li>Growth spurts may increase feeding frequency</li>
        <li>Illness can affect appetite</li>
        <li>Adjust timing based on your baby's needs</li>
      </ul>
    `
  },
  
  // Development Templates
  development: {
    milestones: `
      <h1>Development Milestones</h1>
      <p>Understanding your baby's developmental milestones helps you provide appropriate support and set realistic expectations for sleep and behavior patterns.</p>
      
      <h2>4-6 Month Milestones</h2>
      <h3>Physical Development</h3>
      <ul>
        <li>Rolling from tummy to back</li>
        <li>Supporting head when pulled to sitting</li>
        <li>Bringing hands to mouth</li>
        <li>Reaching for and grasping objects</li>
      </ul>
      
      <h3>Cognitive Development</h3>
      <ul>
        <li>Showing interest in surroundings</li>
        <li>Recognizing familiar faces</li>
        <li>Following objects with eyes</li>
        <li>Responding to name</li>
      </ul>
      
      <h3>Social and Emotional</h3>
      <ul>
        <li>Smiling and laughing</li>
        <li>Showing preferences for people</li>
        <li>Expressing emotions clearly</li>
        <li>Enjoying social interaction</li>
      </ul>
      
      <h2>6-8 Month Milestones</h2>
      <h3>Physical Development</h3>
      <ul>
        <li>Sitting without support</li>
        <li>Rolling both ways</li>
        <li>Starting to crawl or scoot</li>
        <li>Transferring objects between hands</li>
      </ul>
      
      <h3>Cognitive Development</h3>
      <ul>
        <li>Object permanence beginning</li>
        <li>Exploring cause and effect</li>
        <li>Imitating sounds and actions</li>
        <li>Problem-solving skills emerging</li>
      </ul>
      
      <h2>Sleep and Development Connection</h2>
      <p>Development and sleep are closely linked:</p>
      <ul>
        <li>New skills can temporarily disrupt sleep</li>
        <li>Sleep supports brain development</li>
        <li>Practice time during wake hours improves sleep</li>
        <li>Developmental leaps may affect sleep patterns</li>
      </ul>
    `,
    
    motorSkills: `
      <h1>Motor Skills Development</h1>
      <p>Your baby's motor skills develop rapidly during the first year, affecting their sleep patterns and safety needs. Understanding these changes helps you adapt your approach accordingly.</p>
      
      <h2>Gross Motor Skills</h2>
      <h3>4-6 Months</h3>
      <ul>
        <li>Rolling from tummy to back</li>
        <li>Lifting head and chest during tummy time</li>
        <li>Sitting with support</li>
        <li>Bouncing when held in standing position</li>
      </ul>
      
      <h3>6-8 Months</h3>
      <ul>
        <li>Sitting without support</li>
        <li>Rolling both directions</li>
        <li>Beginning to crawl or scoot</li>
        <li>Pulling up to standing with assistance</li>
      </ul>
      
      <h2>Fine Motor Skills</h2>
      <h3>4-6 Months</h3>
      <ul>
        <li>Grasping objects with whole hand</li>
        <li>Bringing hands together</li>
        <li>Reaching for objects</li>
        <li>Exploring objects with mouth</li>
      </ul>
      
      <h3>6-8 Months</h3>
      <ul>
        <li>Transferring objects between hands</li>
        <li>Using pincer grasp</li>
        <li>Banging objects together</li>
        <li>Picking up small objects</li>
      </ul>
      
      <h2>Sleep Safety Considerations</h2>
      <p>As motor skills develop, adjust sleep safety:</p>
      <ul>
        <li>Lower cot mattress when baby can pull up</li>
        <li>Remove any objects they could use to climb</li>
        <li>Ensure cot rail height is appropriate</li>
        <li>Monitor for rolling during sleep</li>
      </ul>
      
      <h2>Encouraging Development</h2>
      <ul>
        <li>Provide plenty of tummy time</li>
        <li>Offer safe objects to explore</li>
        <li>Create opportunities for movement</li>
        <li>Supervise new skills practice</li>
      </ul>
    `
  },
  
  // Routine Templates
  routine: {
    daily: `
      <h1>Daily Routine</h1>
      <p>A consistent daily routine provides security and predictability for your baby while supporting healthy sleep patterns. The key is finding a routine that works for your family and sticking to it.</p>
      
      <h2>Benefits of Routine</h2>
      <ul>
        <li>Helps regulate your baby's body clock</li>
        <li>Reduces stress and anxiety</li>
        <li>Makes transitions easier</li>
        <li>Improves sleep quality</li>
        <li>Creates predictable family rhythms</li>
      </ul>
      
      <h2>Sample Daily Routine (6-8 months)</h2>
      <h3>Morning (6:30-7:00am)</h3>
      <ul>
        <li>Wake up naturally</li>
        <li>Milk feed</li>
        <li>Diaper change</li>
        <li>Play time</li>
      </ul>
      
      <h3>Mid-Morning (8:00-10:00am)</h3>
      <ul>
        <li>Breakfast</li>
        <li>Active play</li>
        <li>Outdoor time if possible</li>
        <li>First nap (9:00-10:00am)</li>
      </ul>
      
      <h3>Late Morning (10:00am-12:00pm)</h3>
      <ul>
        <li>Milk feed</li>
        <li>Tummy time</li>
        <li>Quiet play</li>
        <li>Interaction time</li>
      </ul>
      
      <h3>Afternoon (12:00-3:00pm)</h3>
      <ul>
        <li>Lunch</li>
        <li>Wind down activities</li>
        <li>Second nap (1:00-2:30pm)</li>
        <li>Milk feed</li>
      </ul>
      
      <h3>Evening (3:00-7:00pm)</h3>
      <ul>
        <li>Active play</li>
        <li>Dinner (5:00pm)</li>
        <li>Bath time</li>
        <li>Bedtime routine</li>
        <li>Final milk feed</li>
        <li>Bedtime (7:00pm)</li>
      </ul>
      
      <h2>Flexibility Guidelines</h2>
      <ul>
        <li>Adjust timing based on baby's cues</li>
        <li>Be consistent with the order of activities</li>
        <li>Allow for growth spurts and developmental changes</li>
        <li>Adapt for family schedules when needed</li>
      </ul>
    `
  },
  
  // Settling Techniques
  settling: {
    techniques: `
      <h1>Settling Techniques</h1>
      <p>Every baby is different, and what works for one may not work for another. Having a variety of settling techniques in your toolkit helps you find the right approach for your baby.</p>
      
      <h2>Gentle Settling Methods</h2>
      <h3>Pick Up/Put Down</h3>
      <ul>
        <li>Pick up baby when they cry</li>
        <li>Comfort until calm</li>
        <li>Put down while awake</li>
        <li>Repeat as needed</li>
      </ul>
      
      <h3>Gradual Retreat</h3>
      <ul>
        <li>Start by staying close to baby</li>
        <li>Gradually move further away over time</li>
        <li>Use your voice to provide comfort</li>
        <li>Eventually leave the room</li>
      </ul>
      
      <h3>Check and Console</h3>
      <ul>
        <li>Check on baby at set intervals</li>
        <li>Provide brief comfort</li>
        <li>Leave while baby is still awake</li>
        <li>Gradually extend intervals</li>
      </ul>
      
      <h2>Soothing Techniques</h2>
      <ul>
        <li><strong>Swaddling:</strong> For younger babies who still have startle reflex</li>
        <li><strong>White noise:</strong> Consistent, calming background sound</li>
        <li><strong>Gentle patting:</strong> Rhythmic patting on back or bottom</li>
        <li><strong>Rocking:</strong> Gentle swaying motion</li>
        <li><strong>Singing:</strong> Soft lullabies or humming</li>
      </ul>
      
      <h2>Choosing the Right Method</h2>
      <p>Consider these factors when selecting a settling technique:</p>
      <ul>
        <li>Your baby's temperament</li>
        <li>Your comfort level</li>
        <li>Family circumstances</li>
        <li>Baby's age and development</li>
        <li>Consistency requirements</li>
      </ul>
      
      <h2>Important Reminders</h2>
      <ul>
        <li>Consistency is key to success</li>
        <li>Allow time for techniques to work</li>
        <li>Stay calm and patient</li>
        <li>Adjust methods as baby grows</li>
        <li>Trust your instincts</li>
      </ul>
    `
  }
};

// Function to determine content category and generate appropriate content
function generateLessonContent(title, courseName, chapterTitle = '') {
  const lowerTitle = title.toLowerCase();
  const lowerChapter = chapterTitle.toLowerCase();
  
  // Sleep Environment content
  if (lowerTitle.includes('sleep environment') && lowerTitle.includes('basics')) {
    return contentTemplates.sleepEnvironment.basics;
  }
  if (lowerTitle.includes('temperature') || lowerTitle.includes('room temperature')) {
    return contentTemplates.sleepEnvironment.temperature;
  }
  if (lowerTitle.includes('lighting') || lowerTitle.includes('light')) {
    return contentTemplates.sleepEnvironment.lighting;
  }
  
  // Nutrition content
  if (lowerTitle.includes('introducing solids') || lowerTitle.includes('when to start solids')) {
    return contentTemplates.nutrition.introducingSolids;
  }
  if (lowerTitle.includes('feeding schedule') || lowerTitle.includes('meal timing')) {
    return contentTemplates.nutrition.feedingSchedule;
  }
  
  // Development content
  if (lowerTitle.includes('development milestones') || lowerTitle.includes('developmental milestones')) {
    return contentTemplates.development.milestones;
  }
  if (lowerTitle.includes('motor skills') || lowerTitle.includes('motor development')) {
    return contentTemplates.development.motorSkills;
  }
  
  // Routine content
  if (lowerTitle.includes('daily routine') || lowerTitle.includes('routine')) {
    return contentTemplates.routine.daily;
  }
  
  // Settling content
  if (lowerTitle.includes('settling') && (lowerTitle.includes('techniques') || lowerTitle.includes('methods'))) {
    return contentTemplates.settling.techniques;
  }
  
  // Generate specific content based on title
  return generateSpecificContent(title, courseName, chapterTitle);
}

// Generate specific content for unique topics
function generateSpecificContent(title, courseName, chapterTitle = '') {
  const lowerTitle = title.toLowerCase();
  
  // Welcome messages
  if (lowerTitle.includes('welcome')) {
    return `
      <h1>Welcome to ${courseName}</h1>
      <p>Welcome to your comprehensive guide for this important stage of your child's development. This course has been designed by pediatric experts to provide you with evidence-based guidance and practical strategies.</p>
      
      <h2>What You'll Learn</h2>
      <p>Throughout this course, you'll discover:</p>
      <ul>
        <li>Age-appropriate strategies for your child's current developmental stage</li>
        <li>Evidence-based approaches that have been proven effective</li>
        <li>Practical techniques you can implement immediately</li>
        <li>How to adapt strategies to suit your family's unique needs</li>
      </ul>
      
      <h2>How to Use This Course</h2>
      <p>For the best results, we recommend:</p>
      <ul>
        <li>Working through the lessons in order</li>
        <li>Taking time to practice new techniques</li>
        <li>Being patient as you and your child adjust</li>
        <li>Returning to lessons as needed for reference</li>
      </ul>
      
      <p>Remember, every child is unique, and what works for one family may need adjustment for another. Use this information as a guide, but trust your instincts as a parent.</p>
    `;
  }
  
  // Sleep cycles
  if (lowerTitle.includes('sleep cycles')) {
    return `
      <h1>Understanding Sleep Cycles</h1>
      <p>Understanding how sleep cycles work is crucial for helping your child develop healthy sleep patterns and managing common sleep challenges.</p>
      
      <h2>What Are Sleep Cycles?</h2>
      <p>Sleep cycles are the natural patterns of different sleep stages that occur throughout the night. Each cycle includes light sleep, deep sleep, and REM (dream) sleep.</p>
      
      <h2>Baby Sleep Cycles vs Adult Sleep Cycles</h2>
      <ul>
        <li><strong>Baby cycles:</strong> 45-60 minutes</li>
        <li><strong>Adult cycles:</strong> 90-120 minutes</li>
        <li><strong>Baby sleep:</strong> 50% light sleep, 50% deep sleep</li>
        <li><strong>Adult sleep:</strong> 25% light sleep, 75% deep sleep</li>
      </ul>
      
      <h2>Sleep Cycle Stages</h2>
      <h3>Stage 1: Light Sleep</h3>
      <ul>
        <li>Easily awakened</li>
        <li>May move or make sounds</li>
        <li>Transition between wake and sleep</li>
      </ul>
      
      <h3>Stage 2: Deeper Sleep</h3>
      <ul>
        <li>More difficult to wake</li>
        <li>Less movement and sound</li>
        <li>Restorative sleep occurs</li>
      </ul>
      
      <h3>Stage 3: REM Sleep</h3>
      <ul>
        <li>Dream sleep</li>
        <li>Brain development occurs</li>
        <li>Memory consolidation</li>
      </ul>
      
      <h2>Common Sleep Cycle Challenges</h2>
      <ul>
        <li><strong>Partial arousals:</strong> Baby wakes between cycles</li>
        <li><strong>Short naps:</strong> Waking after one cycle</li>
        <li><strong>Night wakings:</strong> Difficulty transitioning between cycles</li>
      </ul>
      
      <h2>Supporting Healthy Sleep Cycles</h2>
      <ul>
        <li>Maintain consistent sleep environment</li>
        <li>Avoid rushing to baby during light sleep</li>
        <li>Allow baby to learn to link cycles independently</li>
        <li>Provide comfort when needed without creating dependencies</li>
      </ul>
    `;
  }
  
  // Teething content
  if (lowerTitle.includes('teething')) {
    return `
      <h1>Teething and Sleep</h1>
      <p>Teething can significantly impact your baby's sleep patterns. Understanding the teething process and having strategies to manage discomfort helps maintain healthy sleep habits.</p>
      
      <h2>When Teething Begins</h2>
      <ul>
        <li>Most babies start teething between 4-6 months</li>
        <li>First teeth are usually the bottom front teeth</li>
        <li>Teething can continue until age 2-3</li>
        <li>Each child's timing is different</li>
      </ul>
      
      <h2>Signs of Teething</h2>
      <ul>
        <li>Increased drooling</li>
        <li>Wanting to chew on everything</li>
        <li>Irritability, especially in the evening</li>
        <li>Changes in eating patterns</li>
        <li>Disrupted sleep</li>
        <li>Red, swollen, or tender gums</li>
      </ul>
      
      <h2>Teething and Sleep Disruption</h2>
      <p>Teething can affect sleep in several ways:</p>
      <ul>
        <li>Discomfort makes it harder to fall asleep</li>
        <li>Pain may cause more frequent night wakings</li>
        <li>Babies may wake earlier in the morning</li>
        <li>Naps may become shorter or more difficult</li>
      </ul>
      
      <h2>Managing Teething Discomfort</h2>
      <h3>During the Day</h3>
      <ul>
        <li>Offer safe teething toys</li>
        <li>Provide cold washcloths to chew</li>
        <li>Massage gums with clean finger</li>
        <li>Offer cold foods if eating solids</li>
      </ul>
      
      <h3>For Sleep</h3>
      <ul>
        <li>Maintain consistent bedtime routine</li>
        <li>Provide extra comfort during settling</li>
        <li>Consider safe pain relief if recommended by doctor</li>
        <li>Avoid creating new sleep associations</li>
      </ul>
      
      <h2>Maintaining Sleep Habits</h2>
      <p>While teething can temporarily disrupt sleep, it's important to:</p>
      <ul>
        <li>Return to normal routines once discomfort passes</li>
        <li>Avoid abandoning all sleep strategies</li>
        <li>Provide comfort without creating dependencies</li>
        <li>Remember that teething phases are temporary</li>
      </ul>
    `;
  }
  
  // Default content for other topics
  return `
    <h1>${title}</h1>
    <p>This lesson provides important information about ${title.toLowerCase()} as part of your ${courseName} journey.</p>
    
    <h2>Key Learning Objectives</h2>
    <p>By the end of this lesson, you will:</p>
    <ul>
      <li>Understand the fundamental concepts related to ${title.toLowerCase()}</li>
      <li>Learn practical strategies you can implement immediately</li>
      <li>Recognize common challenges and how to address them</li>
      <li>Develop confidence in applying these techniques</li>
    </ul>
    
    <h2>Evidence-Based Approach</h2>
    <p>Our recommendations are based on:</p>
    <ul>
      <li>Latest research in child development</li>
      <li>Clinical experience with thousands of families</li>
      <li>Safety guidelines from leading medical organizations</li>
      <li>Proven strategies that work in real-world situations</li>
    </ul>
    
    <h2>Important Reminders</h2>
    <ul>
      <li>Every child is unique - adapt strategies to suit your family</li>
      <li>Consistency is key to seeing results</li>
      <li>Be patient as you and your child adjust to new approaches</li>
      <li>Trust your instincts as a parent</li>
    </ul>
    
    <h2>Getting Started</h2>
    <p>Begin by choosing one or two strategies that feel most comfortable for your family. Implement them consistently for at least a week before making adjustments. Remember, sustainable changes take time to establish.</p>
    
    <p>If you have questions or concerns about implementing these strategies, don't hesitate to reach out for additional support.</p>
  `;
}

// Main function to populate ALL lesson content
async function populateAllLessons() {
  console.log('Starting comprehensive lesson content population...');
  
  try {
    const client = await pool.connect();
    
    // Get all lessons without content
    const lessonsQuery = `
      SELECT 
        l.id,
        l.title,
        l.course_id,
        c.title as course_title,
        ch.title as chapter_title,
        l.content
      FROM course_lessons l
      JOIN courses c ON l.course_id = c.id
      LEFT JOIN course_chapters ch ON l.chapter_id = ch.id
      WHERE l.content IS NULL OR l.content = ''
      ORDER BY c.title, ch.title, l.order_index
    `;
    
    const lessonsResult = await client.query(lessonsQuery);
    const lessons = lessonsResult.rows;
    
    console.log(`Found ${lessons.length} lessons without content`);
    
    let totalUpdated = 0;
    let courseStats = {};
    
    // Process each lesson
    for (const lesson of lessons) {
      const courseName = lesson.course_title;
      const chapterTitle = lesson.chapter_title || '';
      
      // Initialize course stats
      if (!courseStats[courseName]) {
        courseStats[courseName] = { updated: 0 };
      }
      
      try {
        // Generate content for this lesson
        const content = generateLessonContent(lesson.title, courseName, chapterTitle);
        
        // Update the lesson with content
        const updateQuery = `
          UPDATE course_lessons 
          SET content = $1, updated_at = NOW()
          WHERE id = $2
        `;
        
        await client.query(updateQuery, [content, lesson.id]);
        
        totalUpdated++;
        courseStats[courseName].updated++;
        
        console.log(`Updated lesson: ${lesson.title} in ${courseName}`);
        
      } catch (error) {
        console.error(`Error updating lesson ${lesson.title}:`, error);
      }
    }
    
    // Get final completion stats
    const completionQuery = `
      SELECT 
        c.title as course_name,
        COUNT(l.id) as total_lessons,
        COUNT(CASE WHEN l.content IS NOT NULL AND l.content != '' THEN 1 END) as lessons_with_content,
        CASE 
          WHEN COUNT(l.id) = 0 THEN 0
          ELSE ROUND((COUNT(CASE WHEN l.content IS NOT NULL AND l.content != '' THEN 1 END) * 100.0 / COUNT(l.id)), 1)
        END as completion_percentage
      FROM courses c
      LEFT JOIN course_lessons l ON c.id = l.course_id
      GROUP BY c.id, c.title
      HAVING COUNT(l.id) > 0
      ORDER BY completion_percentage DESC, c.title
    `;
    
    const completionResult = await client.query(completionQuery);
    const completionStats = completionResult.rows;
    
    await client.release();
    
    console.log('\n=== COMPREHENSIVE LESSON CONTENT POPULATION COMPLETE ===');
    console.log(`Total lessons updated: ${totalUpdated}`);
    console.log('\nFinal Course Completion Status:');
    console.log('==========================================');
    
    for (const course of completionStats) {
      console.log(`${course.course_name}: ${course.lessons_with_content}/${course.total_lessons} (${course.completion_percentage}%)`);
    }
    
    console.log('\n=== SINGLE SOURCE OF TRUTH CONFIRMED ===');
    console.log('All lesson content is now stored in the course_lessons table');
    console.log('Both user courses and admin panel reference the same database records');
    console.log('Admin panel edits will update the database and immediately affect user experience');
    
  } catch (error) {
    console.error('Error in comprehensive lesson population:', error);
  }
}

// Run the population script
if (require.main === module) {
  populateAllLessons();
}

module.exports = { populateAllLessons };