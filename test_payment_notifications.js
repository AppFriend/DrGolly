// Comprehensive Test for Payment Notifications and Klaviyo Integration
// Tests the public checkout flow for Slack notifications and Klaviyo data parsing

import axios from 'axios';

async function testPaymentNotifications() {
    console.log('🔔 TESTING PAYMENT NOTIFICATIONS & KLAVIYO INTEGRATION');
    console.log('====================================================');
    
    const baseUrl = 'http://localhost:5000';
    
    // Test 1: Direct Slack Payment Notification Test
    console.log('\n📧 Test 1: Direct Slack Payment Notification');
    try {
        const slackTestResponse = await axios.post(`${baseUrl}/api/test/slack-payment-notification`, {
            name: 'Test User - Payment Check',
            email: 'test.payment@drgolly.com',
            purchaseDetails: 'Single Course Purchase (Big baby sleep program)',
            paymentAmount: '$120.00 AUD',
            promotionalCode: 'TEST99',
            discountAmount: '$118.80 AUD'
        });
        
        console.log('   ✅ Direct Slack notification response:', slackTestResponse.data);
    } catch (error) {
        console.log('   ❌ Direct Slack notification failed:', error.response?.data || error.message);
    }
    
    // Test 2: Test Payment Notification Endpoint (More detailed)
    console.log('\n📧 Test 2: Payment Notification Test Endpoint');
    try {
        const paymentTestResponse = await axios.post(`${baseUrl}/api/test/payment-notification`, {
            type: 'course_purchase'
        });
        
        console.log('   ✅ Payment notification test response:', paymentTestResponse.data);
    } catch (error) {
        console.log('   ❌ Payment notification test failed:', error.response?.data || error.message);
    }
    
    // Test 3: Check Environment Variables
    console.log('\n🔧 Test 3: Environment Variables Check');
    try {
        // Test a simple endpoint to verify server is running and variables are loaded
        const healthResponse = await axios.get(`${baseUrl}/api/courses`);
        console.log('   ✅ Server is running and responding (courses endpoint active)');
    } catch (error) {
        console.log('   ❌ Server connectivity issue:', error.message);
    }
    
    // Test 4: Create Public Checkout Payment Intent (Simulates Real Flow)
    console.log('\n💳 Test 4: Public Checkout Payment Intent Creation');
    try {
        const paymentIntentResponse = await axios.post(`${baseUrl}/api/create-course-payment`, {
            courseId: 6, // Big Baby course
            customerDetails: {
                email: 'notification.test@drgolly.com',
                firstName: 'Notification',
                lastName: 'Test User'
            },
            couponId: null,
            isDirectPurchase: true // This enables public checkout
        });
        
        if (paymentIntentResponse.data.clientSecret) {
            console.log('   ✅ Payment intent created successfully');
            console.log('   📧 Check logs for payment notification attempts');
        } else {
            console.log('   ❌ Payment intent creation failed - no client secret');
        }
    } catch (error) {
        console.log('   ❌ Payment intent creation failed:', error.response?.data || error.message);
    }
    
    // Test 5: Test Big Baby Payment Intent (Alternative endpoint)
    console.log('\n💳 Test 5: Big Baby Payment Intent Creation');
    try {
        const bigBabyResponse = await axios.post(`${baseUrl}/api/create-big-baby-payment-intent`, {
            customerDetails: {
                email: 'bigbaby.test@drgolly.com',
                firstName: 'BigBaby',
                lastName: 'Test User'
            },
            couponId: null
        });
        
        if (bigBabyResponse.data.clientSecret) {
            console.log('   ✅ Big Baby payment intent created successfully');
            console.log('   📧 Check logs for payment notification attempts');
        } else {
            console.log('   ❌ Big Baby payment intent creation failed');
        }
    } catch (error) {
        console.log('   ❌ Big Baby payment intent creation failed:', error.response?.data || error.message);
    }
    
    // Test 6: Klaviyo Integration Test
    console.log('\n📊 Test 6: Klaviyo Integration Test');
    try {
        const klaviyoTestResponse = await axios.post(`${baseUrl}/api/test/klaviyo-sync`, {
            email: 'klaviyo.test@drgolly.com',
            firstName: 'Klaviyo',
            lastName: 'Test'
        });
        
        console.log('   ✅ Klaviyo test response:', klaviyoTestResponse.data);
    } catch (error) {
        console.log('   ❌ Klaviyo test endpoint not found or failed:', error.response?.data || error.message);
        console.log('   ℹ️  This may be expected if no test endpoint exists');
    }
    
    console.log('\n🔍 DIAGNOSTIC INFORMATION');
    console.log('=======================');
    console.log('If payment notifications are NOT appearing in Slack:');
    console.log('1. Check SLACK_WEBHOOK_PAYMENT2 environment variable');
    console.log('2. Verify webhook URL is correct for #payment-upgrade-downgrade channel');
    console.log('3. Check server logs for "Slack payment notification called with:" messages');
    console.log('4. Ensure payment completion flow is triggering notifications');
    console.log('');
    console.log('If Klaviyo data is NOT syncing:');
    console.log('1. Check KLAVIYO_API_KEY environment variable');
    console.log('2. Verify customer creation and event tracking in server logs');
    console.log('3. Check for "Klaviyo sync" messages in logs');
    console.log('4. Ensure public checkout triggers Klaviyo integration');
    
    console.log('\n✅ NOTIFICATION TESTING COMPLETE');
    console.log('Check server logs and Slack channels for results');
}

// Run test if called directly
testPaymentNotifications().catch(console.error);

export { testPaymentNotifications };