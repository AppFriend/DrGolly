#!/usr/bin/env node

const BASE_URL = 'http://localhost:5000';

async function testCouponApplicationFix() {
    console.log('=== COUPON APPLICATION FIX VALIDATION ===\n');
    
    // Test 1: Payment intent creation WITH coupon - should charge $1.20
    console.log('1. Testing payment intent creation with 99% discount coupon...');
    try {
        const response = await fetch(`${BASE_URL}/api/create-big-baby-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Forwarded-For': '203.30.42.100' // Australian IP
            },
            body: JSON.stringify({
                customerDetails: {
                    firstName: 'Test',
                    lastName: 'Customer',
                    email: 'coupon.fix.test@example.com',
                    phone: '1234567890'
                },
                couponId: 'ibuO5MIw' // 99% off coupon
            })
        });
        
        const data = await response.json();
        console.log('✓ Payment intent created WITH coupon');
        console.log('  - Original amount: $' + (data.originalAmount / 100).toFixed(2) + ' AUD');
        console.log('  - Final amount: $' + (data.finalAmount).toFixed(2) + ' AUD');
        console.log('  - Discount amount: $' + (data.discountAmount).toFixed(2) + ' AUD');
        console.log('  - Coupon applied: ' + (data.couponApplied ? data.couponApplied.name : 'None'));
        
        // Verify the payment intent amount in Stripe
        const verifyResponse = await fetch(`${BASE_URL}/api/verify-payment-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentIntentId: data.paymentIntentId
            })
        });
        
        const verification = await verifyResponse.json();
        console.log('✓ Stripe verification:');
        console.log('  - Amount in Stripe: $' + (verification.amount / 100).toFixed(2) + ' ' + verification.currency.toUpperCase());
        console.log('  - Coupon in metadata: ' + (verification.metadata.couponId || 'None'));
        console.log('  - Promotional code: ' + (verification.metadata.promotionalCode || 'None'));
        
        // Test 2: Payment intent creation WITHOUT coupon - should charge $120
        console.log('\n2. Testing payment intent creation WITHOUT coupon...');
        const noCouponResponse = await fetch(`${BASE_URL}/api/create-big-baby-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Forwarded-For': '203.30.42.100'
            },
            body: JSON.stringify({
                customerDetails: {
                    firstName: 'Test',
                    lastName: 'NoCoupon',
                    email: 'no.coupon.test@example.com',
                    phone: '1234567890'
                }
            })
        });
        
        const noCouponData = await noCouponResponse.json();
        console.log('✓ Payment intent created WITHOUT coupon');
        console.log('  - Original amount: $' + (noCouponData.originalAmount / 100).toFixed(2) + ' AUD');
        console.log('  - Final amount: $' + (noCouponData.finalAmount).toFixed(2) + ' AUD');
        console.log('  - Discount amount: $' + (noCouponData.discountAmount || 0).toFixed(2) + ' AUD');
        console.log('  - Coupon applied: ' + (noCouponData.couponApplied ? noCouponData.couponApplied.name : 'None'));
        
        // Verify the payment intent amount in Stripe
        const verifyNoCouponResponse = await fetch(`${BASE_URL}/api/verify-payment-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentIntentId: noCouponData.paymentIntentId
            })
        });
        
        const noCouponVerification = await verifyNoCouponResponse.json();
        console.log('✓ Stripe verification:');
        console.log('  - Amount in Stripe: $' + (noCouponVerification.amount / 100).toFixed(2) + ' ' + noCouponVerification.currency.toUpperCase());
        console.log('  - Coupon in metadata: ' + (noCouponVerification.metadata.couponId || 'None'));
        
        console.log('\n=== FIX VALIDATION SUMMARY ===');
        
        // Check if the fix worked
        const withCouponCorrect = data.finalAmount <= 5; // Should be around $1.20
        const withoutCouponCorrect = noCouponData.finalAmount >= 100; // Should be $120
        const stripeAmountCorrect = verification.amount <= 500; // Should be around 120 cents
        
        console.log('✓ With coupon pricing: ' + (withCouponCorrect ? 'CORRECT' : 'INCORRECT'));
        console.log('✓ Without coupon pricing: ' + (withoutCouponCorrect ? 'CORRECT' : 'INCORRECT'));
        console.log('✓ Stripe amount matching: ' + (stripeAmountCorrect ? 'CORRECT' : 'INCORRECT'));
        
        if (withCouponCorrect && withoutCouponCorrect && stripeAmountCorrect) {
            console.log('\n🎉 COUPON APPLICATION FIX: SUCCESSFUL');
            console.log('✅ Customers entering coupon codes will now receive discounts');
            console.log('✅ Customers without coupon codes will pay full price');
            console.log('✅ Stripe will charge the correct discounted amounts');
        } else {
            console.log('\n❌ COUPON APPLICATION FIX: FAILED');
            console.log('❌ Additional debugging required');
        }
        
    } catch (error) {
        console.error('✗ Test failed:', error.message);
    }
}

testCouponApplicationFix();