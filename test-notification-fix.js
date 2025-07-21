#!/usr/bin/env node

/**
 * Test the Slack notification fix for promotional codes and discount amounts
 */

const BASE_URL = 'http://localhost:5000';

async function testSlackNotificationFix() {
  console.log('🧪 Testing Slack Notification Fix');
  console.log('=' .repeat(50));
  
  try {
    // Test data with coupon applied
    const testData = {
      name: 'Test User',
      email: 'test.user@example.com',
      purchaseDetails: 'Single Course Purchase (Big Baby Sleep Program)',
      paymentAmount: '$1.20 AUD',
      promotionalCode: 'App_Checkout-Test$1',
      discountAmount: '$118.80 AUD'
    };
    
    console.log('Test data being sent:');
    console.log('- Name:', testData.name);
    console.log('- Email:', testData.email);
    console.log('- Amount:', testData.paymentAmount);
    console.log('- Promotional Code:', testData.promotionalCode);
    console.log('- Discount Amount:', testData.discountAmount);
    
    const response = await fetch(`${BASE_URL}/api/test/slack-payment-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('\\n✅ Test notification sent successfully!');
      console.log('Check your Slack channel for the notification');
      console.log('Expected to see:');
      console.log('- Promotional Code: App_Checkout-Test$1');
      console.log('- Discount Amount: $118.80 AUD');
      console.log('- Payment Amount: $1.20 AUD');
      
      return true;
    } else {
      console.log('❌ Test notification failed:', response.status);
      const error = await response.text();
      console.log('Error:', error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testSlackNotificationFix().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);