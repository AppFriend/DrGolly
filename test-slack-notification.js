// Test script to send a Slack notification for demonstration
// This simulates a successful purchase completion

async function sendTestSlackNotification() {
  console.log('🔔 Testing Slack Notification System\n');
  
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Send a test notification via the backend endpoint
    console.log('Sending test payment notification...');
    
    const response = await fetch(`${baseUrl}/api/test-slack-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Test Customer',
        customerEmail: 'testcustomer@example.com',
        courseName: 'Big Baby Sleep Program',
        originalAmount: 120.00,
        finalAmount: 1.20,
        discountAmount: 118.80,
        couponCode: 'CHECKOUT-99',
        currency: 'AUD',
        transactionType: 'course_purchase'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Slack notification sent successfully!');
      console.log('Response:', result);
      
      console.log('\n📊 Notification Details:');
      console.log('• Customer: Test Customer (testcustomer@example.com)');
      console.log('• Course: Big Baby Sleep Program');
      console.log('• Original Amount: $120.00 AUD');
      console.log('• Final Amount: $1.20 AUD');
      console.log('• Discount: $118.80 AUD (99% off)');
      console.log('• Coupon Code: CHECKOUT-99');
      console.log('• Channel: Payment notifications');
      
    } else {
      console.log('❌ Failed to send notification');
      const error = await response.text();
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
sendTestSlackNotification();