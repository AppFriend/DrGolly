import fetch from 'node-fetch';

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = 'test.user@drgolly.com';

async function testKlaviyoEvents() {
  console.log('🧪 Testing Klaviyo Event Integration...\n');

  try {
    // Test 1: App_Purchase Event
    console.log('1️⃣ Testing App_Purchase Event...');
    const purchaseResponse = await fetch(`${BASE_URL}/api/test/klaviyo/direct-purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail: TEST_EMAIL,
        purchaseData: {
          item_names: ["Big Baby Sleep Program"],
          item_ids: ["5"],
          total_value: 120.00,
          currency: "AUD",
          course_count: 1,
          purchase_date: new Date().toISOString()
        }
      })
    });

    const purchaseResult = await purchaseResponse.json();
    console.log('📊 App_Purchase Result:', purchaseResult);
    console.log('✅ Status:', purchaseResponse.status === 200 ? 'SUCCESS' : 'FAILED');
    console.log('');

    // Test 2: Abandoned_Cart Event
    console.log('2️⃣ Testing Abandoned_Cart Event...');
    const cartResponse = await fetch(`${BASE_URL}/api/test/klaviyo/direct-abandonment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail: TEST_EMAIL,
        cartData: {
          cart_items: [
            { id: "5", name: "Big Baby Sleep Program", price: 120.00 },
            { id: "1", name: "Sleep Stories Book", price: 25.00 }
          ],
          cart_value: 145.00,
          cart_course_count: 2
        }
      })
    });

    const cartResult = await cartResponse.json();
    console.log('📊 Abandoned_Cart Result:', cartResult);
    console.log('✅ Status:', cartResponse.status === 200 ? 'SUCCESS' : 'FAILED');
    console.log('');

    // Summary
    console.log('📈 Summary:');
    console.log(`- App_Purchase Event: ${purchaseResponse.status === 200 ? '✅ Sent to Klaviyo' : '❌ Failed'}`);
    console.log(`- Abandoned_Cart Event: ${cartResponse.status === 200 ? '✅ Sent to Klaviyo' : '❌ Failed'}`);
    console.log(`- Test Email: ${TEST_EMAIL}`);
    console.log('\n🔍 Check your Klaviyo dashboard for these events!');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Run the test
testKlaviyoEvents();