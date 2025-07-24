#!/usr/bin/env node

/**
 * Test API Courses Endpoint
 * Tests if the /api/courses endpoint returns the publicCheckoutUrl field
 */

const BASE_URL = 'https://dr-golly.replit.app';

async function testCoursesAPI() {
  console.log('🧪 Testing /api/courses endpoint');
  
  try {
    const response = await fetch(`${BASE_URL}/api/courses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.status === 200) {
      const courses = await response.json();
      console.log(`📋 Retrieved ${courses.length} courses`);
      
      // Find courses 5 and 6
      const bigBaby = courses.find(c => c.id === 6);
      const littleBaby = courses.find(c => c.id === 5);
      
      console.log('\n🔍 COURSE 6 (Big Baby):');
      if (bigBaby) {
        console.log(`   Title: ${bigBaby.title}`);
        console.log(`   publicCheckoutUrl: ${bigBaby.publicCheckoutUrl || 'MISSING'}`);
        console.log(`   public_checkout_url: ${bigBaby.public_checkout_url || 'MISSING'}`);
      } else {
        console.log('   ❌ Not found');
      }
      
      console.log('\n🔍 COURSE 5 (Little Baby):');
      if (littleBaby) {
        console.log(`   Title: ${littleBaby.title}`);
        console.log(`   publicCheckoutUrl: ${littleBaby.publicCheckoutUrl || 'MISSING'}`);
        console.log(`   public_checkout_url: ${littleBaby.public_checkout_url || 'MISSING'}`);
      } else {
        console.log('   ❌ Not found');
      }
      
      // Show all fields for first course
      console.log('\n📝 SAMPLE COURSE FIELDS:');
      if (courses.length > 0) {
        console.log(Object.keys(courses[0]).join(', '));
      }
      
    } else {
      console.log(`❌ Failed to fetch courses: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testCoursesAPI();