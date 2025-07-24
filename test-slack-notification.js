// Test script to verify Slack notification is working
const testSlackNotification = async () => {
  const response = await fetch('http://localhost:5000/api/test-slack-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Test User',
      email: 'test@example.com',
      actualAmountPaid: 120,
      discountAmount: 118.80,
      promotionalCode: 'CHECKOUT-99'
    })
  });
  
  const result = await response.json();
  console.log('Slack notification test result:', result);
};

testSlackNotification();