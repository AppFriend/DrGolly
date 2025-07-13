// Comprehensive authentication flow test
const fetch = require('node-fetch');

async function testAuthFlow() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('=== COMPREHENSIVE AUTH FLOW TEST ===');
  
  // Test 1: Check if user endpoint returns data
  console.log('\n1. Testing /api/user endpoint:');
  try {
    const response = await fetch(`${baseUrl}/api/user`);
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('User data:', {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      subscriptionTier: data.subscriptionTier,
      profileImageUrl: data.profileImageUrl
    });
  } catch (error) {
    console.log('Error:', error.message);
  }
  
  // Test 2: Check children endpoint
  console.log('\n2. Testing /api/children endpoint:');
  try {
    const response = await fetch(`${baseUrl}/api/children`);
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Children data:', data);
  } catch (error) {
    console.log('Error:', error.message);
  }
  
  // Test 3: Check courses endpoint
  console.log('\n3. Testing /api/courses endpoint:');
  try {
    const response = await fetch(`${baseUrl}/api/courses`);
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Courses count:', data.length);
    console.log('Sample course:', data[0] ? {
      id: data[0].id,
      title: data[0].title,
      thumbnailUrl: data[0].thumbnailUrl
    } : 'No courses found');
  } catch (error) {
    console.log('Error:', error.message);
  }
  
  // Test 4: Check profile endpoint
  console.log('\n4. Testing /api/profile endpoint:');
  try {
    const response = await fetch(`${baseUrl}/api/profile`);
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Profile data:', {
      firstName: data.firstName,
      lastName: data.lastName,
      subscriptionTier: data.subscriptionTier
    });
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testAuthFlow();