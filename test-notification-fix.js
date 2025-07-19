// Direct test using the working checkout infrastructure
async function testSlackNotificationDirectly() {
  console.log('🔔 Testing Slack Notification via Existing Infrastructure\n');
  
  const baseUrl = 'http://localhost:5000';
  
  try {
    console.log('Testing via existing checkout completion endpoint...');
    
    // Use the existing purchase completion endpoint which triggers Slack notifications
    const response = await fetch(`${baseUrl}/api/checkout-new/complete-purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testcustomer@example.com',
        firstName: 'Test',
        lastName: 'Customer',
        phone: '+61400000000',
        address: '123 Test Street',
        city: 'Sydney',
        postcode: '2000',
        country: 'AU',
        productId: '6', // Big Baby Sleep Program
        finalAmount: 1.20,
        originalAmount: 120.00,
        couponCode: 'CHECKOUT-99',
        stripePaymentIntentId: 'pi_test_1234567890'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Purchase completion successful!');
      console.log('Response:', result);
      
      console.log('\n📊 This should trigger:');
      console.log('• Course purchase recording in database');
      console.log('• Slack notification with transaction details');
      console.log('• User creation or update');
      console.log('• Session setup for authentication');
      
      if (result.redirect) {
        console.log(`• User redirect to: ${result.redirect}`);
      }
      
    } else {
      console.log('❌ Purchase completion failed');
      const error = await response.text();
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSlackNotificationDirectly();