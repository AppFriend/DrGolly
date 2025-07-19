#!/usr/bin/env node

/**
 * DATABASE-ALIGNED URL TEST
 * Testing URLs with exact database course IDs and correct pricing
 */

const baseUrl = 'http://localhost:5000';

// Database courses with exact IDs and pricing from the database
const databaseCourses = [
  { id: 3, name: "Baby's First Foods", expectedPrice: 120, category: 'nutrition' },
  { id: 5, name: 'Little Baby Sleep Program', expectedPrice: 120, category: 'sleep' },
  { id: 6, name: 'Big Baby Sleep Program', expectedPrice: 120, category: 'sleep' },
  { id: 7, name: 'Pre-toddler Sleep Program', expectedPrice: 120, category: 'sleep' },
  { id: 8, name: 'Toddler Sleep Program', expectedPrice: 120, category: 'sleep' },
  { id: 9, name: 'Pre-school Sleep Program', expectedPrice: 120, category: 'sleep' },
  { id: 10, name: 'Preparation for Newborns', expectedPrice: 120, category: 'sleep' },
  { id: 11, name: 'New Sibling Supplement', expectedPrice: 25, category: 'sleep' },
  { id: 12, name: 'Twins Supplement', expectedPrice: 25, category: 'sleep' },
  { id: 13, name: 'Toddler Toolkit', expectedPrice: 120, category: 'health' },
  { id: 14, name: 'Testing Allergens', expectedPrice: 0, category: 'nutrition' }
];

// Subscription products (still working)
const subscriptionProducts = [
  { id: 'gold-monthly', name: 'Gold Plan - Monthly', expectedPrice: 199 },
  { id: 'gold-yearly', name: 'Gold Plan - Yearly', expectedPrice: 159 },
  { id: 'platinum-monthly', name: 'Platinum Plan - Monthly', expectedPrice: 499 },
  { id: 'platinum-yearly', name: 'Platinum Plan - Yearly', expectedPrice: 399 }
];

async function testDatabaseAlignedUrls() {
  console.log('📊 DATABASE-ALIGNED URL VALIDATION\n');
  console.log('Testing checkout URLs with exact database course IDs and pricing\n');
  
  console.log('| ID | Product Name | Category | URL | Status | Price | Expected | Match |');
  console.log('|----|--------------|----------|-----|--------|-------|----------|-------|');
  
  let totalTests = 0;
  let passingTests = 0;
  let priceMatches = 0;
  
  // Test database courses
  for (const course of databaseCourses) {
    totalTests++;
    
    try {
      const response = await fetch(`${baseUrl}/api/checkout-new/products/${course.id}`);
      
      if (response.ok) {
        const data = await response.json();
        const priceMatch = data.price === course.expectedPrice;
        
        if (priceMatch) priceMatches++;
        
        console.log(`| ${course.id} | ${course.name} | ${course.category} | /checkout-new/${course.id} | ✅ WORKING | $${data.price} | $${course.expectedPrice} | ${priceMatch ? '✅' : '❌'} |`);
        passingTests++;
      } else {
        console.log(`| ${course.id} | ${course.name} | ${course.category} | /checkout-new/${course.id} | ❌ FAILED | - | $${course.expectedPrice} | ❌ |`);
      }
    } catch (error) {
      console.log(`| ${course.id} | ${course.name} | ${course.category} | /checkout-new/${course.id} | ❌ ERROR | - | $${course.expectedPrice} | ❌ |`);
    }
  }
  
  // Test subscription products
  for (const sub of subscriptionProducts) {
    totalTests++;
    
    try {
      const response = await fetch(`${baseUrl}/api/checkout-new/products/${sub.id}`);
      
      if (response.ok) {
        const data = await response.json();
        const priceMatch = data.price === sub.expectedPrice;
        
        if (priceMatch) priceMatches++;
        
        console.log(`| ${sub.id} | ${sub.name} | subscription | /checkout-new/${sub.id} | ✅ WORKING | $${data.price} | $${sub.expectedPrice} | ${priceMatch ? '✅' : '❌'} |`);
        passingTests++;
      } else {
        console.log(`| ${sub.id} | ${sub.name} | subscription | /checkout-new/${sub.id} | ❌ FAILED | - | $${sub.expectedPrice} | ❌ |`);
      }
    } catch (error) {
      console.log(`| ${sub.id} | ${sub.name} | subscription | /checkout-new/${sub.id} | ❌ ERROR | - | $${sub.expectedPrice} | ❌ |`);
    }
  }
  
  console.log('\n' + '='.repeat(100));
  console.log('📊 DATABASE ALIGNMENT SUMMARY');
  console.log('='.repeat(100));
  console.log(`Total Products Tested: ${totalTests}`);
  console.log(`Working URLs: ${passingTests}/${totalTests} (${Math.round(passingTests/totalTests*100)}%)`);
  console.log(`Correct Pricing: ${priceMatches}/${totalTests} (${Math.round(priceMatches/totalTests*100)}%)`);
  
  if (passingTests === totalTests && priceMatches === totalTests) {
    console.log('\n✅ PERFECT ALIGNMENT: All URLs working with correct database pricing!');
  } else {
    console.log(`\n⚠️ ALIGNMENT ISSUES: ${totalTests - passingTests} URLs failing, ${totalTests - priceMatches} price mismatches`);
  }
}

testDatabaseAlignedUrls().catch(console.error);