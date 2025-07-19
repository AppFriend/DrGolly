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
    
    // Validate coupon if provided - EXACT COPY from validate-coupon endpoint logic
    if (couponCode) {
      try {
        console.log(`Validating coupon: ${couponCode} for payment intent`);
        
        let coupon = null;
        let promotionCode = null;
        
        // First try to find as promotion code (exact same logic as validate-coupon)
        const promotionCodes = await stripe.promotionCodes.list({
          code: couponCode,
          limit: 1,
        });
        
        if (promotionCodes.data.length > 0) {
          promotionCode = promotionCodes.data[0];
          if (promotionCode.active) {
            coupon = await stripe.coupons.retrieve(promotionCode.coupon.id);
          }
        } else {
          // Try direct coupon lookup
          try {
            coupon = await stripe.coupons.retrieve(couponCode);
          } catch (directCouponError) {
            console.log('No direct coupon found with code:', couponCode);
          }
        }
        
        if (coupon && coupon.valid) {
          appliedCoupon = coupon;
          
          if (coupon.percent_off) {
            discountAmount = Math.round(amount * (coupon.percent_off / 100));
          } else if (coupon.amount_off) {
            discountAmount = coupon.amount_off; // Already in cents
          }
          
          amount = Math.max(amount - discountAmount, 50); // Minimum 50 cents
          
          console.log(`✓ Valid coupon: ${coupon.id}, discount: ${discountAmount} cents, final: ${amount} cents`);
        } else {
          console.log(`No valid coupon found for code: ${couponCode}`);
        }
      } catch (couponError) {
        console.error('Coupon validation error:', couponError.message);
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

// Validate coupon code with comprehensive Stripe integration
router.post('/api/checkout-new/validate-coupon', async (req, res) => {
  try {
    const { couponCode, amount } = req.body;
    
    if (!couponCode || !amount) {
      return res.status(400).json({
        valid: false,
        message: 'Coupon code and amount are required'
      });
    }
    
    console.log(`Validating coupon: ${couponCode} for amount: $${amount}`);
    
    let coupon = null;
    let promotionCode = null;
    
    try {
      // First try to find as promotion code
      const promotionCodes = await stripe.promotionCodes.list({
        code: couponCode,
        limit: 1,
      });
      
      if (promotionCodes.data.length > 0) {
        promotionCode = promotionCodes.data[0];
        if (promotionCode.active) {
          coupon = await stripe.coupons.retrieve(promotionCode.coupon.id);
        }
      } else {
        // Try direct coupon lookup
        try {
          coupon = await stripe.coupons.retrieve(couponCode);
        } catch (directCouponError) {
          console.log('No direct coupon found with code:', couponCode);
        }
      }
      
      if (coupon && coupon.valid) {
        let discountAmount = 0;
        if (coupon.percent_off) {
          discountAmount = (amount * coupon.percent_off) / 100;
        } else if (coupon.amount_off) {
          discountAmount = coupon.amount_off / 100; // Convert cents to dollars
        }
        
        const finalAmount = Math.max(amount - discountAmount, 0.5); // Minimum 50 cents
        
        console.log(`✓ Valid coupon: ${coupon.id}, discount: $${discountAmount}, final: $${finalAmount}`);
        
        res.json({
          valid: true,
          coupon: {
            id: coupon.id,
            name: coupon.name || coupon.id,
            percent_off: coupon.percent_off,
            amount_off: coupon.amount_off,
          },
          discountAmount,
          finalAmount
        });
      } else {
        console.log('❌ Invalid or inactive coupon:', couponCode);
        res.json({
          valid: false,
          message: 'Invalid or expired coupon code'
        });
      }
    } catch (stripeError: any) {
      console.log('❌ Stripe coupon validation error:', stripeError.message);
      res.json({
        valid: false,
        message: 'Invalid coupon code'
      });
    }
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    res.status(500).json({
      valid: false,
      message: 'Failed to validate coupon code'
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

// Check if email exists in system for user flow logic
router.post('/api/checkout-new/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Check if user exists in system (using existing storage)
    // This would need to be implemented based on your user storage system
    // For now, return false to default to new user flow
    const userExists = false; // TODO: Implement actual user lookup
    
    res.json({
      exists: userExists,
      email
    });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ message: 'Failed to check email' });
  }
});

// Create account with purchase for new users
router.post('/api/checkout-new/create-account', async (req, res) => {
  try {
    const { customerDetails, paymentIntentId, productId } = req.body;
    
    // Verify payment was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }
    
    // TODO: Implement account creation logic
    // This would create user account and add course purchase
    
    console.log('Creating account for:', customerDetails.email);
    console.log('Payment intent:', paymentIntentId);
    console.log('Product ID:', productId);
    
    res.json({
      success: true,
      message: 'Account created successfully',
      userId: 'new-user-id' // TODO: Return actual user ID
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ message: 'Failed to create account' });
  }
});

// Add purchase to existing user
router.post('/api/checkout-new/add-purchase', async (req, res) => {
  try {
    const { email, paymentIntentId, productId } = req.body;
    
    // Verify payment was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }
    
    // TODO: Implement adding purchase to existing user
    
    console.log('Adding purchase for existing user:', email);
    console.log('Payment intent:', paymentIntentId);
    console.log('Product ID:', productId);
    
    res.json({
      success: true,
      message: 'Purchase added to account'
    });
  } catch (error) {
    console.error('Error adding purchase:', error);
    res.status(500).json({ message: 'Failed to add purchase' });
  }
});

// Webhook for payment success notifications
router.post('/api/checkout-new/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ message: 'Missing signature or webhook secret' });
    }
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ message: 'Invalid signature' });
    }
    
    // Handle payment success events
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      console.log('Payment succeeded:', paymentIntent.id);
      console.log('Customer email:', paymentIntent.metadata?.customerEmail);
      console.log('Product:', paymentIntent.metadata?.productName);
      
      // TODO: Implement notification logic (Slack, email, etc.)
      // TODO: Update user purchase records
      // TODO: Send welcome emails
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

export default router;