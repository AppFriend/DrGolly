#!/usr/bin/env node

/**
 * PRODUCT URL AUDIT SCRIPT
 * Comprehensive audit of all product checkout URLs to verify correct loading
 */

const baseUrl = 'http://localhost:5000';

// Define all product configurations based on the system
const allProducts = [
  // One-time course purchases
  { id: 1, name: 'Big Baby Sleep Program', type: 'course', url: '/checkout-new/1' },
  { id: 2, name: 'Little Baby Sleep Program', type: 'course', url: '/checkout-new/2' },
  { id: 3, name: 'Preparation for Newborns', type: 'course', url: '/checkout-new/3' },
  { id: 4, name: 'Testing Allergens', type: 'course', url: '/checkout-new/4' },
  { id: 5, name: 'How to Sleep Train', type: 'course', url: '/checkout-new/5' },
  { id: 6, name: 'Baby Led Weaning', type: 'course', url: '/checkout-new/6' },
  { id: 7, name: 'Toddler Sleep & Behaviour', type: 'course', url: '/checkout-new/7' },
  { id: 8, name: 'Dr Golly Health Advice', type: 'course', url: '/checkout-new/8' },
  { id: 9, name: 'Partner Discounts', type: 'course', url: '/checkout-new/9' },
  { id: 10, name: 'Returning to Work', type: 'course', url: '/checkout-new/10' },
  { id: 11, name: 'Sleep & Mental Health', type: 'course', url: '/checkout-new/11' },
  
  // Subscription products
  { id: 'gold-monthly', name: 'Gold Plan - Monthly', type: 'subscription', url: '/checkout-new/gold-monthly' },
  { id: 'gold-yearly', name: 'Gold Plan - Yearly', type: 'subscription', url: '/checkout-new/gold-yearly' },
  { id: 'platinum-monthly', name: 'Platinum Plan - Monthly', type: 'subscription', url: '/checkout-new/platinum-monthly' },
  
  // Books and additional products
  { id: 'big-baby-book', name: 'Big Baby Sleep Book', type: 'book', url: '/checkout-new/big-baby-book' },
  { id: 'little-baby-book', name: 'Little Baby Sleep Book', type: 'book', url: '/checkout-new/little-baby-book' }
];

async function auditProductUrls() {
  console.log('🔍 COMPREHENSIVE PRODUCT URL AUDIT\n');
  console.log('Testing all product checkout URLs for correct loading...\n');
  
  // Create results table
  console.log('| Product ID | Product Name | Type | URL | Status | Response |');
  console.log('|------------|--------------|------|-----|--------|----------|');
  
  let totalUrls = 0;
  let workingUrls = 0;
  let failedUrls = [];
  
  for (const product of allProducts) {
    totalUrls++;
    
    try {
      // Test the product endpoint first
      const productResponse = await fetch(`${baseUrl}/api/checkout-new/products/${product.id}`);
      
      let status = '';
      let response = '';
      
      if (productResponse.ok) {
        const productData = await productResponse.json();
        status = '✅ WORKING';
        response = `$${productData.price} ${productData.currency || 'AUD'}`;
        workingUrls++;
      } else if (productResponse.status === 404) {
        status = '❌ NOT FOUND';
        response = 'Product not in database';
        failedUrls.push({
          ...product,
          error: 'Product not found in database'
        });
      } else {
        status = '⚠️ ERROR';
        response = `HTTP ${productResponse.status}`;
        failedUrls.push({
          ...product,
          error: `HTTP ${productResponse.status}`
        });
      }
      
      console.log(`| ${product.id} | ${product.name} | ${product.type} | ${product.url} | ${status} | ${response} |`);
      
    } catch (error) {
      console.log(`| ${product.id} | ${product.name} | ${product.type} | ${product.url} | ❌ ERROR | ${error.message} |`);
      failedUrls.push({
        ...product,
        error: error.message
      });
    }
  }
  
  console.log('\n' + '='.repeat(100));
  console.log('📊 PRODUCT URL AUDIT SUMMARY');
  console.log('='.repeat(100));
  
  console.log(`Total URLs Tested: ${totalUrls}`);
  console.log(`Working URLs: ${workingUrls}`);
  console.log(`Failed URLs: ${failedUrls.length}`);
  console.log(`Success Rate: ${Math.round((workingUrls / totalUrls) * 100)}%`);
  
  if (failedUrls.length > 0) {
    console.log('\n⚠️ FAILED URLS REQUIRING ATTENTION:');
    failedUrls.forEach(item => {
      console.log(`   - ${item.url} (${item.name}): ${item.error}`);
    });
    
    console.log('\n🔧 RECOMMENDATIONS:');
    console.log('1. Add missing products to database');
    console.log('2. Verify product configurations in server/routes/checkout-new.ts');
    console.log('3. Check database seeding for missing course/subscription products');
  } else {
    console.log('\n✅ ALL PRODUCT CHECKOUT URLS ARE WORKING CORRECTLY!');
  }
}

auditProductUrls().catch(console.error);