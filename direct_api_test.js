#!/usr/bin/env node

/**
 * Direct API Test - Calls /api/courses with detailed logging
 */

async function directAPITest() {
  console.log('🧪 Calling /api/courses directly');
  
  try {
    const response = await fetch('https://dr-golly.replit.app/api/courses', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DirectTest/1.0'
      }
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Got ${data.length} courses`);
      
      // Find courses 5 and 6 and check for the field
      const course5 = data.find(c => c.id === 5);
      const course6 = data.find(c => c.id === 6);
      
      if (course5) {
        console.log('Course 5 fields:', Object.keys(course5));
        console.log('Course 5 publicCheckoutUrl:', course5.publicCheckoutUrl);
        console.log('Course 5 public_checkout_url:', course5.public_checkout_url);
      }
      
      if (course6) {
        console.log('Course 6 fields:', Object.keys(course6));
        console.log('Course 6 publicCheckoutUrl:', course6.publicCheckoutUrl);
        console.log('Course 6 public_checkout_url:', course6.public_checkout_url);
      }
    } else {
      console.log('API call failed with status:', response.status);
    }
    
  } catch (error) {
    console.error('API call failed:', error.message);
  }
}

directAPITest();