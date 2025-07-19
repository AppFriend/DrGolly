#!/usr/bin/env node

/**
 * LOCAL SUBSCRIPTION SYSTEM TEST
 * Tests the subscription endpoints locally through the development server
 */

const baseUrl = 'http://localhost:5000';

async function testSubscriptionEndpoints() {
  console.log('🧪 TESTING SUBSCRIPTION SYSTEM LOCALLY\n');
  
  // Test 1: Product retrieval for subscription
  console.log('1️⃣ Testing subscription product retrieval...');
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/products/gold-monthly`);
    const product = await response.json();
    
    if (response.ok && product.type === 'subscription') {
      console.log('✅ Gold Monthly product retrieved successfully');
      console.log(`   Name: ${product.name}`);
      console.log(`   Type: ${product.type}`);
      console.log(`   Tier: ${product.planTier}`);
      console.log(`   Billing: ${product.billingPeriod}`);
      console.log(`   Price: $${product.price} ${product.currency}`);
    } else {
      console.log('❌ Failed to retrieve subscription product');
      console.log(`   Response: ${JSON.stringify(product, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ Error testing product retrieval: ${error.message}`);
  }
  
  // Test 2: Subscription creation
  console.log('\n2️⃣ Testing subscription creation...');
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'gold-monthly',
        customerDetails: {
          email: 'test.subscription@example.com',
          firstName: 'Test',
          lastName: 'User'
        },
        couponCode: null
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.clientSecret) {
      console.log('✅ Subscription created successfully');
      console.log(`   Subscription ID: ${data.subscriptionId}`);
      console.log(`   Client Secret: ${data.clientSecret ? 'Present' : 'Missing'}`);
      console.log(`   Amount: $${data.amount} ${data.currency}`);
      console.log(`   Product Type: ${data.productType}`);
    } else {
      console.log('❌ Failed to create subscription');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ Error testing subscription creation: ${error.message}`);
  }
  
  // Test 3: Routing validation
  console.log('\n3️⃣ Testing routing logic...');
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'gold-monthly', // Subscription product should be rejected
        customerDetails: {
          email: 'test@example.com',
          firstName: 'Test'
        }
      })
    });
    
    const data = await response.json();
    
    if (response.status === 400 && data.message.includes('subscription endpoint')) {
      console.log('✅ Subscription products correctly routed to subscription endpoint');
    } else {
      console.log('❌ Routing logic not working as expected');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ Error testing routing: ${error.message}`);
  }
  
  // Test 4: Email check endpoint
  console.log('\n4️⃣ Testing email check functionality...');
  try {
    const response = await fetch(`${baseUrl}/api/checkout-new/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });
    
    const data = await response.json();
    
    if (response.ok && typeof data.exists === 'boolean') {
      console.log('✅ Email check endpoint working');
      console.log(`   Email exists: ${data.exists}`);
    } else {
      console.log('❌ Email check endpoint failed');
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ Error testing email check: ${error.message}`);
  }
  
  console.log('\n🏁 Local subscription system test complete');
}

testSubscriptionEndpoints().catch(console.error);