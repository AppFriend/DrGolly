// Manual content entry script for Preparation for Newborns course
// This will help populate the course content directly from the CSV course data

import { db } from '../server/db';
import { courseModules } from '../shared/schema';
import { eq } from 'drizzle-orm';

interface CourseContent {
  moduleId: number;
  title: string;
  content: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
}

// Content extracted from the "Preparation for Newborns" course
const preparationForNewbornsContent: CourseContent[] = [
  {
    moduleId: 80,
    title: "1.1 Sleep Environment",
    content: `
      <h2>Creating the Perfect Sleep Environment for Your Baby</h2>
      
      <h3>Room Setup</h3>
      <p>Your baby's sleep environment is crucial for quality rest. Here are the key elements:</p>
      
      <ul>
        <li><strong>Room Temperature:</strong> Maintain 16-20°C (61-68°F)</li>
        <li><strong>Lighting:</strong> Keep the room dark during sleep times</li>
        <li><strong>Noise Level:</strong> Use white noise or keep ambient noise low</li>
        <li><strong>Air Quality:</strong> Ensure good ventilation and avoid strong scents</li>
      </ul>
      
      <h3>Safe Sleep Guidelines</h3>
      <p>Follow these essential safety guidelines:</p>
      
      <ul>
        <li>Always place baby on their back to sleep</li>
        <li>Use a firm sleep surface</li>
        <li>Keep the crib bare - no blankets, pillows, or toys</li>
        <li>Ensure proper crib mattress fit</li>
        <li>Use a sleep sack or swaddle for warmth</li>
      </ul>
      
      <h3>Sleep Equipment</h3>
      <p>Essential items for creating a safe sleep environment:</p>
      
      <ul>
        <li><strong>Crib or bassinet:</strong> Meets current safety standards</li>
        <li><strong>Firm mattress:</strong> Fits snugly in the crib</li>
        <li><strong>Fitted sheet:</strong> Designed for your mattress size</li>
        <li><strong>Sleep sack:</strong> Appropriate for room temperature</li>
        <li><strong>White noise machine:</strong> Consistent, soothing sound</li>
      </ul>
      
      <h3>Common Sleep Environment Mistakes</h3>
      <p>Avoid these common pitfalls:</p>
      
      <ul>
        <li>Room too warm or too cold</li>
        <li>Too much stimulation in the room</li>
        <li>Inconsistent sleep space</li>
        <li>Unsafe sleep accessories</li>
        <li>Bright lights during night feeds</li>
      </ul>
      
      <h3>Key Takeaways</h3>
      <p>Remember these important points:</p>
      
      <ul>
        <li>Consistency is key - use the same sleep environment each time</li>
        <li>Safety always comes first</li>
        <li>Temperature and lighting significantly impact sleep quality</li>
        <li>Simple is better - avoid overcomplicating the sleep space</li>
      </ul>
    `,
    videoUrl: "https://example.com/sleep-environment-video.mp4",
    thumbnailUrl: "https://example.com/sleep-environment-thumb.jpg",
    duration: 8
  },
  {
    moduleId: 81,
    title: "1.2 Safe Sleep Practices",
    content: `
      <h2>Safe Sleep Practices for Newborns</h2>
      
      <h3>The ABCs of Safe Sleep</h3>
      <p>Remember these three critical elements:</p>
      
      <ul>
        <li><strong>A</strong>lone - Baby sleeps alone in their crib</li>
        <li><strong>B</strong>ack - Always place baby on their back</li>
        <li><strong>C</strong>rib - Use a safe sleep surface</li>
      </ul>
      
      <h3>Sleep Position</h3>
      <p>Proper sleep positioning is essential:</p>
      
      <ul>
        <li>Back sleeping reduces SIDS risk by 50%</li>
        <li>Side sleeping is not safe</li>
        <li>Once baby can roll both ways, they can choose their position</li>
        <li>Never place baby on their stomach to sleep</li>
      </ul>
      
      <h3>Sleep Surface Safety</h3>
      <p>The sleep surface must be:</p>
      
      <ul>
        <li><strong>Firm:</strong> Mattress should not indent when baby is placed on it</li>
        <li><strong>Flat:</strong> No inclined or angled surfaces</li>
        <li><strong>Covered:</strong> Only with a fitted sheet</li>
        <li><strong>Size-appropriate:</strong> Fits properly in the crib</li>
      </ul>
      
      <h3>What to Avoid</h3>
      <p>Never include these items in baby's sleep area:</p>
      
      <ul>
        <li>Blankets, quilts, or comforters</li>
        <li>Pillows or pillow-like items</li>
        <li>Bumper pads or crib liners</li>
        <li>Stuffed animals or toys</li>
        <li>Positioning devices</li>
      </ul>
      
      <h3>Safe Sleep Timeline</h3>
      <p>Follow these guidelines by age:</p>
      
      <ul>
        <li><strong>Birth to 4 months:</strong> Back sleeping is critical</li>
        <li><strong>4-6 months:</strong> Continue back sleeping, baby may start rolling</li>
        <li><strong>6+ months:</strong> Baby can sleep in position they choose after rolling</li>
      </ul>
      
      <h3>Room Sharing vs. Bed Sharing</h3>
      <p>Understanding the difference:</p>
      
      <ul>
        <li><strong>Room sharing:</strong> Recommended for first 6 months</li>
        <li><strong>Bed sharing:</strong> Not recommended due to safety risks</li>
        <li>Use a bassinet or crib in your room</li>
        <li>Keep baby's sleep surface separate from yours</li>
      </ul>
    `,
    videoUrl: "https://example.com/safe-sleep-video.mp4",
    thumbnailUrl: "https://example.com/safe-sleep-thumb.jpg",
    duration: 12
  },
  {
    moduleId: 82,
    title: "1.3 Swaddling Techniques",
    content: `
      <h2>Master Swaddling Techniques</h2>
      
      <h3>Benefits of Swaddling</h3>
      <p>Swaddling can help your newborn by:</p>
      
      <ul>
        <li>Mimicking the womb environment</li>
        <li>Preventing startling reflexes</li>
        <li>Promoting longer sleep periods</li>
        <li>Providing comfort and security</li>
        <li>Reducing crying and fussiness</li>
      </ul>
      
      <h3>When to Swaddle</h3>
      <p>Appropriate times for swaddling:</p>
      
      <ul>
        <li><strong>Sleep times:</strong> Naps and nighttime</li>
        <li><strong>Fussy periods:</strong> When baby needs comfort</li>
        <li><strong>Early weeks:</strong> Most beneficial in first 2-3 months</li>
        <li><strong>Transition period:</strong> When moving from womb to world</li>
      </ul>
      
      <h3>Step-by-Step Swaddling</h3>
      <p>Follow these steps for proper swaddling:</p>
      
      <ol>
        <li><strong>Prepare the blanket:</strong> Lay out a square blanket in diamond shape</li>
        <li><strong>Fold the top corner:</strong> Create a straight edge for baby's neck</li>
        <li><strong>Place baby:</strong> Shoulders just below the fold</li>
        <li><strong>Secure one arm:</strong> Wrap one side across baby's body</li>
        <li><strong>Tuck the bottom:</strong> Fold up the bottom corner</li>
        <li><strong>Secure the other arm:</strong> Wrap the remaining side</li>
        <li><strong>Check the fit:</strong> Ensure it's snug but not too tight</li>
      </ol>
      
      <h3>Safety Considerations</h3>
      <p>Important safety guidelines:</p>
      
      <ul>
        <li><strong>Hip positioning:</strong> Allow room for hip movement</li>
        <li><strong>Chest room:</strong> Should be able to fit 2-3 fingers</li>
        <li><strong>Overheating:</strong> Monitor baby's temperature</li>
        <li><strong>Rolling signs:</strong> Stop swaddling when baby shows signs of rolling</li>
        <li><strong>Loose fabric:</strong> Ensure no loose material near face</li>
      </ul>
      
      <h3>Types of Swaddles</h3>
      <p>Different swaddling options:</p>
      
      <ul>
        <li><strong>Traditional blanket:</strong> Muslin or cotton receiving blanket</li>
        <li><strong>Velcro swaddles:</strong> Easy-to-use with secure fastening</li>
        <li><strong>Zip swaddles:</strong> Sleep sacks with swaddle wings</li>
        <li><strong>Transition swaddles:</strong> Allow one or both arms free</li>
      </ul>
      
      <h3>When to Stop Swaddling</h3>
      <p>Signs it's time to transition:</p>
      
      <ul>
        <li>Baby shows signs of rolling</li>
        <li>Breaks out of swaddle frequently</li>
        <li>Seems restricted or frustrated</li>
        <li>Around 3-4 months of age</li>
        <li>Startling reflex has diminished</li>
      </ul>
      
      <h3>Troubleshooting Common Issues</h3>
      <p>Solutions for swaddling challenges:</p>
      
      <ul>
        <li><strong>Breaking out:</strong> Ensure swaddle is snug enough</li>
        <li><strong>Crying when swaddled:</strong> Try different technique or timing</li>
        <li><strong>Overheating:</strong> Use lighter fabric or loosen swaddle</li>
        <li><strong>Hip issues:</strong> Ensure proper hip positioning</li>
      </ul>
    `,
    videoUrl: "https://example.com/swaddling-video.mp4",
    thumbnailUrl: "https://example.com/swaddling-thumb.jpg",
    duration: 15
  }
];

export async function populateCourseContent() {
  try {
    console.log('Starting course content population...');
    
    for (const content of preparationForNewbornsContent) {
      try {
        // Update the module with the content
        await db
          .update(courseModules)
          .set({
            content: content.content,
            videoUrl: content.videoUrl,
            thumbnailUrl: content.thumbnailUrl,
            duration: content.duration,
            updatedAt: new Date()
          })
          .where(eq(courseModules.id, content.moduleId));
        
        console.log(`✅ Updated module ${content.moduleId}: ${content.title}`);
      } catch (error) {
        console.error(`❌ Error updating module ${content.moduleId}:`, error);
      }
    }
    
    console.log('Course content population completed!');
  } catch (error) {
    console.error('Error in course content population:', error);
  }
}

// Run the script if called directly
if (require.main === module) {
  populateCourseContent()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}