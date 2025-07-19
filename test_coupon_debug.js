// Debug the exact coupon structure to fix the payment intent issue

const testCouponStructure = async () => {
  console.log('=== DEBUGGING COUPON STRUCTURE ===\n');
  
  try {
    // Test the validate coupon endpoint to see the working structure
    const validateResponse = await fetch('http://localhost:5000/api/checkout-new/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        couponCode: 'CHECKOUT-99',
        amount: 120
      })
    });
    
    const validateData = await validateResponse.json();
    console.log('VALIDATE COUPON RESPONSE (working):');
    console.log(JSON.stringify(validateData, null, 2));
    
    // Test the payment intent endpoint to see what's failing
    const paymentResponse = await fetch('http://localhost:5000/api/checkout-new/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 2,
        customerDetails: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        },
        couponCode: 'CHECKOUT-99'
      })
    });
    
    const paymentData = await paymentResponse.json();
    console.log('\nPAYMENT INTENT RESPONSE (failing):');
    console.log(JSON.stringify(paymentData, null, 2));
    
    console.log('\n=== COMPARISON ===');
    console.log(`Validate endpoint discount: $${validateData.discountAmount}`);
    console.log(`Payment intent discount: $${paymentData.discountAmount}`);
    console.log(`Expected working: discount applied correctly`);
    console.log(`Actual result: ${paymentData.discountAmount > 0 ? 'Working' : 'Not working'}`);
    
  } catch (error) {
    console.error('Debug error:', error.message);
  }
};

testCouponStructure();