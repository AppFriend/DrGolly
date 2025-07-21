#!/usr/bin/env tsx

// Script to populate the products table with all course, subscription, and book data
// Including checkout-new links as primary checkout URLs

import { db } from '../server/db.js';
import { products, type InsertProduct } from '../shared/schema.js';

async function populateProductsTable() {
  console.log('🚀 Populating products table with checkout-new links...');
  
  const productsData: InsertProduct[] = [
    // === INDIVIDUAL COURSES ===
    {
      name: "Baby's First Foods",
      description: 'Complete guide to starting solid foods',
      productType: 'course',
      category: 'nutrition',
      price: '120.00',
      currency: 'AUD',
      checkoutLink: '/checkout-new/3',
      legacyCheckoutLink: '/checkout/3',
      stripeProductId: 'prod_baby_first_foods',
      ageRange: '6+ Months',
      duration: 180, // 3 hours
      courseId: 3,
      features: ['Comprehensive solid food introduction', 'Age-appropriate meal plans', 'Allergy prevention strategies'],
      isActive: true,
      isFeatured: false,
      sortOrder: 1
    },
    {
      name: 'Little Baby Sleep Program',
      description: '4-16 Weeks Sleep Program',
      productType: 'course',
      category: 'sleep',
      price: '120.00',
      currency: 'AUD',
      checkoutLink: '/checkout-new/5',
      legacyCheckoutLink: '/checkout/5',
      stripeProductId: 'prod_little_baby',
      ageRange: '4-16 Weeks',
      duration: 240, // 4 hours
      courseId: 5,
      features: ['Newborn sleep patterns', 'Safe sleep practices', 'Sleep routine establishment'],
      isActive: true,
      isFeatured: true,
      sortOrder: 2
    },
    {
      name: 'Big Baby Sleep Program',
      description: '4-8 Months Sleep Program',
      productType: 'course',
      category: 'sleep',
      price: '120.00',
      currency: 'AUD',
      checkoutLink: '/checkout-new/6',
      legacyCheckoutLink: '/checkout/6',
      stripeProductId: 'prod_big_baby',
      ageRange: '4-8 Months',
      duration: 300, // 5 hours
      courseId: 6,
      features: ['Sleep training methods', 'Nap scheduling', 'Night sleep optimization'],
      isActive: true,
      isFeatured: true,
      sortOrder: 3
    },
    {
      name: 'Pre-toddler Sleep Program',
      description: '8-12 Months Sleep Program',
      productType: 'course',
      category: 'sleep',
      price: '120.00',
      currency: 'AUD',
      checkoutLink: '/checkout-new/7',
      legacyCheckoutLink: '/checkout/7',
      stripeProductId: 'prod_pre_toddler',
      ageRange: '8-12 Months',
      duration: 240, // 4 hours
      courseId: 7,
      features: ['Transition to toddler sleep', 'Sleep regression handling', 'Independent sleep skills'],
      isActive: true,
      isFeatured: false,
      sortOrder: 4
    },
    {
      name: 'Toddler Sleep Program',
      description: '1-2 Years Sleep Program',
      productType: 'course',
      category: 'sleep',
      price: '120.00',
      currency: 'AUD',
      checkoutLink: '/checkout-new/8',
      legacyCheckoutLink: '/checkout/8',
      stripeProductId: 'prod_toddler_sleep',
      ageRange: '1-2 Years',
      duration: 270, // 4.5 hours
      courseId: 8,
      features: ['Toddler sleep challenges', 'Bedtime routines', 'Sleep environment optimization'],
      isActive: true,
      isFeatured: false,
      sortOrder: 5
    },
    {
      name: 'Pre-school Sleep Program',
      description: '2-5 Years Sleep Program',
      productType: 'course',
      category: 'sleep',
      price: '120.00',
      currency: 'AUD',
      checkoutLink: '/checkout-new/9',
      legacyCheckoutLink: '/checkout/9',
      stripeProductId: 'prod_preschool_sleep',
      ageRange: '2-5 Years',
      duration: 210, // 3.5 hours
      courseId: 9,
      features: ['Preschooler sleep needs', 'Behavioral strategies', 'Sleep schedule optimization'],
      isActive: true,
      isFeatured: false,
      sortOrder: 6
    },
    {
      name: 'Preparation for Newborns',
      description: 'Complete newborn preparation course',
      productType: 'course',
      category: 'sleep',
      price: '120.00',
      currency: 'AUD',
      checkoutLink: '/checkout-new/10',
      legacyCheckoutLink: '/checkout/10',
      stripeProductId: 'prod_preparation_newborns',
      ageRange: 'Newborn',
      duration: 360, // 6 hours
      courseId: 10,
      features: ['Pregnancy sleep preparation', 'Newborn care basics', 'Hospital to home transition'],
      isActive: true,
      isFeatured: true,
      sortOrder: 7
    },
    {
      name: 'New Sibling Supplement',
      description: 'New Sibling Supplement',
      productType: 'course',
      category: 'sleep',
      price: '25.00',
      currency: 'AUD',
      checkoutLink: '/checkout-new/11',
      legacyCheckoutLink: '/checkout/11',
      stripeProductId: 'prod_new_sibling',
      ageRange: 'New Sibling',
      duration: 60, // 1 hour
      courseId: 11,
      features: ['Sibling sleep coordination', 'Managing multiple bedtimes', 'Room sharing strategies'],
      isActive: true,
      isFeatured: false,
      sortOrder: 8
    },
    {
      name: 'Twins Supplement',
      description: 'Twins Supplement',
      productType: 'course',
      category: 'sleep',
      price: '25.00',
      currency: 'AUD',
      checkoutLink: '/checkout-new/12',
      legacyCheckoutLink: '/checkout/12',
      stripeProductId: 'prod_twins',
      ageRange: 'Twins',
      duration: 90, // 1.5 hours
      courseId: 12,
      features: ['Twin sleep synchronization', 'Individual vs. shared schedules', 'Twin-specific challenges'],
      isActive: true,
      isFeatured: false,
      sortOrder: 9
    },
    {
      name: 'Toddler Toolkit',
      description: 'Toddler Toolkit',
      productType: 'course',
      category: 'health',
      price: '120.00',
      currency: 'AUD',
      checkoutLink: '/checkout-new/13',
      legacyCheckoutLink: '/checkout/13',
      stripeProductId: 'prod_toddler_toolkit',
      ageRange: 'Toddler',
      duration: 240, // 4 hours
      courseId: 13,
      features: ['Toddler development guidance', 'Behavioral management', 'Health and safety tips'],
      isActive: true,
      isFeatured: false,
      sortOrder: 10
    },
    {
      name: 'Testing Allergens',
      description: 'Introduce Allergens with Confidence',
      productType: 'course',
      category: 'nutrition',
      price: '0.00',
      currency: 'AUD',
      checkoutLink: '/checkout-new/14',
      legacyCheckoutLink: '/checkout/14',
      stripeProductId: 'prod_testing_allergens',
      ageRange: 'All Ages',
      duration: 45, // 45 minutes
      courseId: 14,
      features: ['Safe allergen introduction', 'Allergy prevention strategies', 'Emergency response planning'],
      isActive: true,
      isFeatured: true,
      sortOrder: 11
    },

    // === SUBSCRIPTION PLANS ===
    {
      name: 'Gold Plan - Monthly',
      description: 'Unlimited Courses + Free Dr Golly Book',
      productType: 'subscription',
      category: 'subscription',
      price: '199.00',
      currency: 'AUD',
      checkoutLink: '/checkout-new/gold-monthly',
      legacyCheckoutLink: '/checkout/gold-monthly',
      stripeProductId: 'prod_gold_plan_monthly',
      billingPeriod: 'monthly',
      subscriptionTier: 'gold',
      features: ['Unlimited access to all courses', 'Free Dr Golly book', 'Priority customer support', 'Monthly live Q&A sessions'],
      isActive: true,
      isFeatured: true,
      sortOrder: 12
    },
    {
      name: 'Gold Plan - Yearly',
      description: 'Unlimited Courses + Free Dr Golly Book (Save 20%)',
      productType: 'subscription',
      category: 'subscription',
      price: '159.00',
      currency: 'AUD',
      checkoutLink: '/checkout-new/gold-yearly',
      legacyCheckoutLink: '/checkout/gold-yearly',
      stripeProductId: 'prod_gold_plan_yearly',
      billingPeriod: 'yearly',
      subscriptionTier: 'gold',
      features: ['Unlimited access to all courses', 'Free Dr Golly book', 'Priority customer support', 'Monthly live Q&A sessions', '20% annual savings'],
      isActive: true,
      isFeatured: true,
      sortOrder: 13
    },
    {
      name: 'Platinum Plan - Monthly',
      description: 'The Ultimate Dr Golly Program',
      productType: 'subscription',
      category: 'subscription',
      price: '499.00',
      currency: 'AUD',
      checkoutLink: '/checkout-new/platinum-monthly',
      legacyCheckoutLink: '/checkout/platinum-monthly',
      stripeProductId: 'prod_platinum_plan_monthly',
      billingPeriod: 'monthly',
      subscriptionTier: 'platinum',
      features: ['Everything in Gold Plan', '1-on-1 consultation calls', 'Personalized sleep plans', 'Direct messaging with Dr Golly', 'Exclusive platinum content'],
      isActive: true,
      isFeatured: false,
      sortOrder: 14
    },
    {
      name: 'Platinum Plan - Yearly',
      description: 'The Ultimate Dr Golly Program (Save 20%)',
      productType: 'subscription',
      category: 'subscription',
      price: '399.00',
      currency: 'AUD',
      checkoutLink: '/checkout-new/platinum-yearly',
      legacyCheckoutLink: '/checkout/platinum-yearly',
      stripeProductId: 'prod_platinum_plan_yearly',
      billingPeriod: 'yearly',
      subscriptionTier: 'platinum',
      features: ['Everything in Gold Plan', '1-on-1 consultation calls', 'Personalized sleep plans', 'Direct messaging with Dr Golly', 'Exclusive platinum content', '20% annual savings'],
      isActive: true,
      isFeatured: false,
      sortOrder: 15
    },

    // === PHYSICAL BOOKS ===
    {
      name: 'Big Baby Sleep Book',
      description: 'Physical book for 4-8 month sleep solutions',
      productType: 'book',
      category: 'sleep',
      price: '35.00',
      currency: 'AUD',
      checkoutLink: '/checkout-new/big-baby-book',
      legacyCheckoutLink: '/checkout/big-baby-book',
      stripeProductId: 'prod_big_baby_book',
      ageRange: '4-8 Months',
      features: ['Physical paperback book', 'Comprehensive sleep guide', 'Easy reference charts', 'Free shipping within Australia'],
      isActive: true,
      isFeatured: false,
      sortOrder: 16
    },
    {
      name: 'Little Baby Sleep Book',
      description: 'Physical book for 0-4 month sleep solutions',
      productType: 'book',
      category: 'sleep',
      price: '35.00',
      currency: 'AUD',
      checkoutLink: '/checkout-new/little-baby-book',
      legacyCheckoutLink: '/checkout/little-baby-book',
      stripeProductId: 'prod_little_baby_book',
      ageRange: '0-4 Months',
      features: ['Physical paperback book', 'Newborn sleep fundamentals', 'Quick reference guides', 'Free shipping within Australia'],
      isActive: true,
      isFeatured: false,
      sortOrder: 17
    }
  ];

  try {
    // Insert all products (ON CONFLICT DO NOTHING to avoid duplicates)
    const insertedProducts = await db.insert(products).values(productsData).returning();

    console.log('✅ Products table populated successfully!');
    console.log(`📊 Inserted ${insertedProducts.length} products:`);
    
    const categories = {
      course: insertedProducts.filter(p => p.productType === 'course').length,
      subscription: insertedProducts.filter(p => p.productType === 'subscription').length,
      book: insertedProducts.filter(p => p.productType === 'book').length,
    };

    console.log(`   • ${categories.course} courses`);
    console.log(`   • ${categories.subscription} subscription plans`);
    console.log(`   • ${categories.book} physical books`);
    
    console.log('\n🔗 All products now have checkout-new links as primary URLs:');
    insertedProducts.forEach(product => {
      console.log(`   • ${product.name}: ${product.checkoutLink}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating products table:', error);
    process.exit(1);
  }
}

// Run the script
populateProductsTable();