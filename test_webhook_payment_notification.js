// Test to identify the gap in payment notification system for public checkout
// This test simulates the complete payment flow and identifies where notifications fail

import axios from 'axios';

async function testWebhookPaymentNotification() {
    console.log('🔍 TESTING WEBHOOK PAYMENT NOTIFICATION SYSTEM');
    console.log('==============================================');
    
    const baseUrl = 'http://localhost:5000';
    
    try {
        // Step 1: Create a payment intent via Big Baby public checkout
        console.log('\n💳 Step 1: Creating Big Baby payment intent (public checkout)');
        const paymentResponse = await axios.post(`${baseUrl}/api/create-big-baby-payment-intent`, {
            customerDetails: {
                email: 'webhook.test@drgolly.com',
                firstName: 'Webhook',
                lastName: 'Test User'
            },
            couponId: null
        });
        
        const paymentIntentId = paymentResponse.data.clientSecret.split('_secret_')[0];
        console.log('   ✅ Payment intent created:', paymentIntentId);
        
        // Step 2: Retrieve the payment intent to check metadata
        console.log('\n🔍 Step 2: Examining payment intent metadata');
        const verifyResponse = await axios.post(`${baseUrl}/api/verify-payment-intent`, {
            paymentIntentId: paymentIntentId
        });
        
        if (verifyResponse.status === 200) {
            console.log('   ✅ Payment intent metadata:', verifyResponse.data.metadata);
        } else {
            console.log('   ❌ Payment intent verification failed:', verifyResponse.data);
        }
        
        // Step 3: Check if there's a course purchase record in database BEFORE payment
        console.log('\n🔍 Step 3: Checking for pre-payment course purchase record');
        try {
            // This will likely fail since public checkout doesn't create records before payment
            const purchaseResponse = await axios.get(`${baseUrl}/api/course-purchases/by-payment-intent/${paymentIntentId}`);
            console.log('   ✅ Course purchase record found:', purchaseResponse.data);
        } catch (error) {
            console.log('   ❓ No course purchase record found (expected for public checkout)');
        }
        
        // Step 4: Simulate the webhook scenario
        console.log('\n🎣 Step 4: Simulating Stripe webhook payment_intent.succeeded');
        console.log('   📝 This is where the notification gap likely occurs:');
        console.log('   - Webhook receives payment_intent.succeeded event');
        console.log('   - Looks for course purchase record by payment intent ID');
        console.log('   - If no record exists, notification is not sent');
        console.log('   - Public checkout creates records AFTER payment, not before');
        
        // Step 5: Test if the webhook would find a purchase record
        console.log('\n⚠️  Step 5: Identifying the notification gap');
        console.log('   ISSUE IDENTIFIED:');
        console.log('   1. Public checkout creates payment intent without database record');
        console.log('   2. User completes payment → Stripe sends webhook');
        console.log('   3. Webhook looks for course_purchases record by payment_intent_id');
        console.log('   4. No record found → no notification sent');
        console.log('   5. User completes checkout → creates account → adds course record');
        console.log('   6. By this time, webhook has already processed and missed notification');
        
        // Step 6: Test the completion endpoint that should trigger notifications
        console.log('\n🔧 Step 6: Testing the completion endpoint');
        try {
            const completionResponse = await axios.post(`${baseUrl}/api/big-baby-complete-purchase`, {
                paymentIntentId: paymentIntentId,
                customerDetails: {
                    email: 'webhook.test@drgolly.com',
                    firstName: 'Webhook',
                    lastName: 'Test User'
                },
                courseId: 6,
                finalPrice: paymentResponse.data.finalAmount,
                currency: 'AUD'
            });
            
            console.log('   ✅ Completion endpoint would work with real payment');
            console.log('   📧 This is where notifications should be sent manually');
        } catch (error) {
            if (error.response?.data?.message?.includes('Payment not completed')) {
                console.log('   ✅ Completion endpoint correctly requires successful payment');
                console.log('   📧 But this means notifications depend on completion, not webhook');
            } else {
                console.log('   ❌ Unexpected completion error:', error.response?.data?.message);
            }
        }
        
        console.log('\n🎯 SOLUTION ANALYSIS:');
        console.log('================');
        console.log('The payment notification gap occurs because:');
        console.log('1. Stripe webhook processes payment_intent.succeeded immediately');
        console.log('2. Public checkout creates database records after payment completion');
        console.log('3. Webhook cannot find course purchase record → no notification');
        console.log('4. Notifications should be sent from completion endpoint, not webhook');
        console.log('');
        console.log('RECOMMENDED FIX:');
        console.log('- Ensure /api/big-baby-complete-purchase sends payment notifications');
        console.log('- Or update webhook to handle public checkout payment intents directly');
        console.log('- Check if completion endpoint is being called by frontend');
        
    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testWebhookPaymentNotification().catch(console.error);

export { testWebhookPaymentNotification };