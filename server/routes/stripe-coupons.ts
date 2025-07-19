import express, { Router } from 'express';
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Create test coupon CHECKOUT-99 for testing
export const createTestCoupons = async () => {
  try {
    // Check if CHECKOUT-99 coupon exists
    let testCoupon;
    try {
      testCoupon = await stripe.coupons.retrieve('CHECKOUT-99');
      console.log('✓ Test coupon CHECKOUT-99 already exists');
    } catch (error) {
      // Create the test coupon
      testCoupon = await stripe.coupons.create({
        id: 'CHECKOUT-99',
        percent_off: 99,
        duration: 'forever',
        name: 'Test 99% Off Coupon',
        valid: true
      });
      console.log('✓ Created test coupon CHECKOUT-99 (99% off)');
    }
    
    return testCoupon;
  } catch (error) {
    console.error('Error setting up test coupons:', error);
    return null;
  }
};

export default router;