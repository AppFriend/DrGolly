import express, { Router } from 'express';
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Get product information for checkout
router.get('/api/checkout-new/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Map productId to course data (for now using hardcoded mapping)
    const productMapping: Record<string, any> = {
      '1': {
        id: 1,
        name: 'Big Baby Sleep Program',
        description: '4-8 Months Sleep Program',
        price: 120,
        currency: 'AUD',
        stripeProductId: 'prod_big_baby',
        type: 'one-off',
        ageRange: '4-8 Months'
      },
      '2': {
        id: 2,
        name: 'Little Baby Sleep Program', 
        description: '0-4 Months Sleep Program',
        price: 120,
        currency: 'AUD',
        stripeProductId: 'prod_little_baby',
        type: 'one-off',
        ageRange: '0-4 Months'
      }
    };
    
    const product = productMapping[productId];
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Simple regional pricing for now
    const regionalPrice = {
      amount: product.price,
      currency: product.currency,
      region: 'AU'
    };
    
    res.json({
      ...product,
      price: regionalPrice.amount,
      currency: regionalPrice.currency,
      regionalPricing: regionalPrice
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Create payment intent for checkout
router.post('/api/checkout-new/create-payment-intent', async (req, res) => {
  try {
    const { productId, customerDetails, couponCode } = req.body;
    
    // Get product info
    const productResponse = await fetch(`${req.protocol}://${req.get('host')}/api/checkout-new/products/${productId}`);
    const product = await productResponse.json();
    
    let amount = product.price * 100; // Convert to cents
    let discountAmount = 0;
    let appliedCoupon = null;
    
    // Validate coupon if provided
    if (couponCode) {
      try {
        const coupon = await stripe.coupons.retrieve(couponCode);
        appliedCoupon = coupon;
        
        if (coupon.percent_off) {
          discountAmount = Math.round(amount * (coupon.percent_off / 100));
        } else if (coupon.amount_off) {
          discountAmount = coupon.amount_off; // Already in cents
        }
        
        amount = Math.max(amount - discountAmount, 50); // Minimum 50 cents
      } catch (couponError) {
        console.log('Invalid coupon:', couponCode);
        // Continue without discount
      }
    }
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: product.currency.toLowerCase(),
      description: product.name,
      metadata: {
        productId: productId.toString(),
        productName: product.name,
        customerEmail: customerDetails.email,
        customerFirstName: customerDetails.firstName || '',
        customerLastName: customerDetails.lastName || '',
        originalAmount: (product.price * 100).toString(),
        discountAmount: discountAmount.toString(),
        couponCode: couponCode || ''
      }
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: amount / 100,
      originalAmount: product.price,
      discountAmount: discountAmount / 100,
      currency: product.currency,
      appliedCoupon: appliedCoupon?.id || null
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
});

// Validate coupon code
router.post('/api/checkout-new/validate-coupon', async (req, res) => {
  try {
    const { couponCode, amount } = req.body;
    
    const coupon = await stripe.coupons.retrieve(couponCode);
    
    let discountAmount = 0;
    if (coupon.percent_off) {
      discountAmount = (amount * coupon.percent_off) / 100;
    } else if (coupon.amount_off) {
      discountAmount = coupon.amount_off / 100; // Convert cents to dollars
    }
    
    res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        name: coupon.name,
        percent_off: coupon.percent_off,
        amount_off: coupon.amount_off,
      },
      discountAmount,
      finalAmount: Math.max(amount - discountAmount, 0.5) // Minimum 50 cents
    });
  } catch (error) {
    res.json({
      valid: false,
      message: 'Invalid coupon code'
    });
  }
});

// Complete purchase
router.post('/api/checkout-new/complete-purchase', async (req, res) => {
  try {
    const { paymentIntentId, customerDetails } = req.body;
    
    // Retrieve payment intent to get metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }
    
    // Extract metadata
    const { productId, productName } = paymentIntent.metadata;
    
    // Handle user creation/login logic here
    // For now, return success
    
    res.json({
      success: true,
      message: 'Purchase completed successfully',
      productName,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase()
    });
  } catch (error) {
    console.error('Error completing purchase:', error);
    res.status(500).json({ message: 'Failed to complete purchase' });
  }
});

export default router;