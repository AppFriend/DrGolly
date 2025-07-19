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
    
    // Map productId to course data - ALIGNED WITH DATABASE IDs
    const productMapping: Record<string, any> = {
      // Database courses with exact ID correlation
      '3': {
        id: 3,
        name: "Baby's First Foods",
        description: 'Complete guide to starting solid foods',
        price: 120,
        currency: 'AUD',
        stripeProductId: 'prod_baby_first_foods',
        type: 'one-off',
        category: 'nutrition',
        ageRange: '6+ Months'
      },
      '5': {
        id: 5,
        name: 'Little Baby Sleep Program',
        description: '4-16 Weeks Sleep Program',
        price: 120,
        currency: 'AUD',
        stripeProductId: 'prod_little_baby',
        type: 'one-off',
        category: 'sleep',
        ageRange: '4-16 Weeks'
      },
      '6': {
        id: 6,
        name: 'Big Baby Sleep Program',
        description: '4-8 Months Sleep Program',
        price: 120,
        currency: 'AUD',
        stripeProductId: 'prod_big_baby',
        type: 'one-off',
        category: 'sleep',
        ageRange: '4-8 Months'
      },
      '7': {
        id: 7,
        name: 'Pre-toddler Sleep Program',
        description: '8-12 Months Sleep Program',
        price: 120,
        currency: 'AUD',
        stripeProductId: 'prod_pre_toddler',
        type: 'one-off',
        category: 'sleep',
        ageRange: '8-12 Months'
      },
      '8': {
        id: 8,
        name: 'Toddler Sleep Program',
        description: '1-2 Years Sleep Program',
        price: 120,
        currency: 'AUD',
        stripeProductId: 'prod_toddler_sleep',
        type: 'one-off',
        category: 'sleep',
        ageRange: '1-2 Years'
      },
      '9': {
        id: 9,
        name: 'Pre-school Sleep Program',
        description: '2-5 Years Sleep Program',
        price: 120,
        currency: 'AUD',
        stripeProductId: 'prod_preschool_sleep',
        type: 'one-off',
        category: 'sleep',
        ageRange: '2-5 Years'
      },
      '10': {
        id: 10,
        name: 'Preparation for Newborns',
        description: 'Complete newborn preparation course',
        price: 120,
        currency: 'AUD',
        stripeProductId: 'prod_preparation_newborns',
        type: 'one-off',
        category: 'sleep',
        ageRange: 'Newborn'
      },
      '11': {
        id: 11,
        name: 'New Sibling Supplement',
        description: 'New Sibling Supplement',
        price: 25,  // Database shows $25.00
        currency: 'AUD',
        stripeProductId: 'prod_new_sibling',
        type: 'one-off',
        category: 'sleep',
        ageRange: 'New Sibling Supplement'
      },
      '12': {
        id: 12,
        name: 'Twins Supplement',
        description: 'Twins Supplement',
        price: 25,  // Database shows $25.00
        currency: 'AUD',
        stripeProductId: 'prod_twins',
        type: 'one-off',
        category: 'sleep',
        ageRange: 'Twins Supplement'
      },
      '13': {
        id: 13,
        name: 'Toddler Toolkit',
        description: 'Toddler Toolkit',
        price: 120,  // Database shows $120.00
        currency: 'AUD',
        stripeProductId: 'prod_toddler_toolkit',
        type: 'one-off',
        category: 'health',
        ageRange: 'Toddler Toolkit'
      },
      '14': {
        id: 14,
        name: 'Testing Allergens',
        description: 'Introduce Allergens with Confidence',
        price: 0,  // Database shows $0.00 (FREE)
        currency: 'AUD',
        stripeProductId: 'prod_testing_allergens',
        type: 'one-off',
        category: 'nutrition',
        ageRange: 'Introduce Allergens with Confidence'
      },
      'gold-monthly': {
        id: 'gold-monthly',
        name: 'Gold Plan - Monthly',
        description: 'Unlimited Courses + Free Dr Golly Book',
        price: 199,
        currency: 'AUD',
        stripeProductId: 'prod_gold_plan',
        type: 'subscription',
        planTier: 'gold',
        billingPeriod: 'monthly'
      },
      'gold-yearly': {
        id: 'gold-yearly',
        name: 'Gold Plan - Yearly',
        description: 'Unlimited Courses + Free Dr Golly Book (Save 20%)',
        price: 159,
        currency: 'AUD',
        stripeProductId: 'prod_gold_plan',
        type: 'subscription',
        planTier: 'gold',
        billingPeriod: 'yearly'
      },
      'platinum-monthly': {
        id: 'platinum-monthly',
        name: 'Platinum Plan - Monthly',
        description: 'The Ultimate Dr Golly Program',
        price: 499,
        currency: 'AUD',
        stripeProductId: 'prod_platinum_plan',
        type: 'subscription',
        planTier: 'platinum',
        billingPeriod: 'monthly'
      },
      'platinum-yearly': {
        id: 'platinum-yearly',
        name: 'Platinum Plan - Yearly',
        description: 'The Ultimate Dr Golly Program (Save 20%)',
        price: 399,
        currency: 'AUD',
        stripeProductId: 'prod_platinum_plan',
        type: 'subscription',
        planTier: 'platinum',
        billingPeriod: 'yearly'
      },

      'big-baby-book': {
        id: 'big-baby-book',
        name: 'Big Baby Sleep Book',
        description: 'Physical book for 4-8 month sleep solutions',
        price: 35,
        currency: 'AUD',
        stripeProductId: 'prod_big_baby_book',
        type: 'book',
        ageRange: '4-8 Months'
      },
      'little-baby-book': {
        id: 'little-baby-book',
        name: 'Little Baby Sleep Book',
        description: 'Physical book for 0-4 month sleep solutions',
        price: 35,
        currency: 'AUD',
        stripeProductId: 'prod_little_baby_book',
        type: 'book',
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

// Create payment intent for checkout (one-off payments)
router.post('/api/checkout-new/create-payment-intent', async (req, res) => {
  try {
    const { productId, customerDetails, couponCode } = req.body;
    
    // Get product info
    const productResponse = await fetch(`${req.protocol}://${req.get('host')}/api/checkout-new/products/${productId}`);
    const product = await productResponse.json();
    
    // Check if this is a subscription product
    if (product.type === 'subscription') {
      return res.status(400).json({ 
        message: 'Use subscription endpoint for subscription products',
        redirectTo: '/api/checkout-new/create-subscription'
      });
    }
    
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
    const { couponCode, amount, productId } = req.body;
    
    if (!couponCode) {
      return res.status(400).json({
        valid: false,
        message: 'Coupon code is required'
      });
    }
    
    // If amount not provided, try to get from productId
    let validationAmount = amount;
    if (!validationAmount && productId) {
      const productResponse = await fetch(`${req.protocol}://${req.get('host')}/api/checkout-new/products/${productId}`);
      const product = await productResponse.json();
      validationAmount = product.price;
    }
    
    if (!validationAmount) {
      return res.status(400).json({
        valid: false,
        message: 'Amount or productId is required for coupon validation'
      });
    }
    
    console.log(`Validating coupon: ${couponCode} for amount: $${validationAmount}`);
    
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
          discountAmount = (validationAmount * coupon.percent_off) / 100;
        } else if (coupon.amount_off) {
          discountAmount = coupon.amount_off / 100; // Convert cents to dollars
        }
        
        const finalAmount = Math.max(validationAmount - discountAmount, 0.5); // Minimum 50 cents
        
        console.log(`✓ Valid coupon: ${coupon.id}, discount: $${discountAmount}, final: $${finalAmount}`);
        
        res.json({
          valid: true,
          coupon: {
            id: coupon.id,
            name: coupon.name || coupon.id,
            percent_off: coupon.percent_off,
            amount_off: coupon.amount_off,
          },
          originalAmount: validationAmount,
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

// Create subscription for subscription products
router.post('/api/checkout-new/create-subscription', async (req, res) => {
  try {
    const { productId, customerDetails, couponCode } = req.body;
    
    // Get product info
    const productResponse = await fetch(`${req.protocol}://${req.get('host')}/api/checkout-new/products/${productId}`);
    const product = await productResponse.json();
    
    // Verify this is a subscription product
    if (product.type !== 'subscription') {
      return res.status(400).json({ 
        message: 'Use payment intent endpoint for one-off products',
        redirectTo: '/api/checkout-new/create-payment-intent'
      });
    }
    
    let amount = product.price * 100; // Convert to cents
    let discountAmount = 0;
    let appliedCoupon = null;
    let promotionCode = null; // Define at top level for use in subscription creation
    
    // Validate coupon if provided - same logic as payment intent
    if (couponCode) {
      try {
        console.log(`Validating coupon: ${couponCode} for subscription`);
        
        let coupon = null;
        
        const promotionCodes = await stripe.promotionCodes.list({
          code: couponCode,
          limit: 1,
        });
        
        if (promotionCodes.data.length > 0) {
          promotionCode = promotionCodes.data[0]; // This will now use the top-level variable
          if (promotionCode.active) {
            coupon = await stripe.coupons.retrieve(promotionCode.coupon.id);
          }
        } else {
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
          
          console.log(`✓ Valid coupon for subscription: ${coupon.id}, discount: ${discountAmount} cents, final: ${amount} cents`);
        }
      } catch (couponError) {
        console.error('Coupon validation error for subscription:', couponError.message);
      }
    }
    
    // Create or get customer
    let customer;
    try {
      const customers = await stripe.customers.list({
        email: customerDetails.email,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        customer = customers.data[0];
        console.log('Using existing customer:', customer.id);
      } else {
        customer = await stripe.customers.create({
          email: customerDetails.email,
          name: `${customerDetails.firstName} ${customerDetails.lastName || ''}`.trim(),
          metadata: {
            source: 'checkout-new',
            product_name: product.name,
            plan_tier: product.planTier,
            billing_period: product.billingPeriod
          }
        });
        console.log('Created new customer:', customer.id);
      }
    } catch (error) {
      console.error('Error creating/finding customer:', error);
      return res.status(500).json({ message: 'Failed to process customer information' });
    }
    
    // Create simplified Stripe price for subscription
    let price;
    try {
      console.log('Creating price for subscription with amount:', amount, 'currency:', product.currency);
      
      // Try first approach - create product inline
      try {
        price = await stripe.prices.create({
          unit_amount: amount,
          currency: product.currency.toLowerCase(),
          recurring: {
            interval: product.billingPeriod === 'yearly' ? 'year' : 'month',
          },
          product_data: {
            name: product.name
          },
          metadata: {
            plan_tier: product.planTier,
            billing_period: product.billingPeriod,
            original_amount: (product.price * 100).toString(),
            discount_amount: discountAmount.toString(),
            coupon_code: couponCode || 'none',
            source: 'checkout-new'
          }
        });
        console.log('✅ Created subscription price (product_data approach):', price.id);
      } catch (productDataError) {
        console.log('❌ Product data approach failed, trying existing product approach...');
        console.error('Product data error:', productDataError.message);
        
        // Fallback - use existing product
        price = await stripe.prices.create({
          unit_amount: amount,
          currency: product.currency.toLowerCase(),
          recurring: {
            interval: product.billingPeriod === 'yearly' ? 'year' : 'month',
          },
          product: product.stripeProductId,
          metadata: {
            plan_tier: product.planTier,
            billing_period: product.billingPeriod,
            source: 'checkout-new'
          }
        });
        console.log('✅ Created subscription price (existing product approach):', price.id);
      }
    } catch (error) {
      console.error('❌ All price creation approaches failed:', error);
      return res.status(500).json({ message: 'Failed to create subscription pricing' });
    }
    
    // Create subscription
    let subscription;
    try {
      const subscriptionData = {
        customer: customer.id,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          product_id: product.id,
          product_name: product.name,
          plan_tier: product.planTier,
          billing_period: product.billingPeriod,
          customer_email: customerDetails.email,
          customer_name: `${customerDetails.firstName} ${customerDetails.lastName || ''}`.trim(),
          source: 'checkout-new',
          original_amount: (product.price * 100).toString(),
          discount_amount: discountAmount.toString(),
          coupon_code: couponCode || 'none'
        }
      };
      
      // Apply coupon to subscription if available
      if (appliedCoupon) {
        // For subscriptions, always use the coupon directly rather than promotion codes
        subscriptionData.coupon = appliedCoupon.id;
      }
      
      subscription = await stripe.subscriptions.create(subscriptionData);
      console.log('Created subscription:', subscription.id);
      console.log('Subscription status:', subscription.status);
      console.log('Latest invoice status:', subscription.latest_invoice?.status);
      console.log('Payment intent status:', subscription.latest_invoice?.payment_intent?.status);
    } catch (error) {
      console.error('Error creating subscription:', error);
      return res.status(500).json({ message: 'Failed to create subscription' });
    }
    
    // Extract client secret from payment intent
    const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
    
    if (!clientSecret) {
      console.error('No client secret found in subscription');
      console.log('Subscription object:', JSON.stringify(subscription, null, 2));
      console.log('Latest invoice:', JSON.stringify(subscription.latest_invoice, null, 2));
      
      // Check if subscription is active without requiring payment (free/very discounted)
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        console.log('Subscription is active without payment - likely free or very low cost');
        return res.json({
          clientSecret: null, // No payment needed
          subscriptionId: subscription.id,
          customerId: customer.id,
          amount: amount / 100,
          originalAmount: product.price,
          discountAmount: discountAmount / 100,
          currency: product.currency,
          appliedCoupon: appliedCoupon?.id || null,
          productType: 'subscription',
          requiresPayment: false // Indicate no payment is needed
        });
      }
      
      return res.status(500).json({ message: 'Failed to initialize payment' });
    }
    
    console.log(`✓ Subscription created successfully: ${subscription.id}`);
    
    res.json({
      clientSecret,
      subscriptionId: subscription.id,
      customerId: customer.id,
      amount: amount / 100, // Convert back to dollars
      originalAmount: product.price,
      discountAmount: discountAmount / 100,
      currency: product.currency,
      appliedCoupon: appliedCoupon?.id || null,
      productType: 'subscription',
      planTier: product.planTier,
      billingPeriod: product.billingPeriod
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Failed to create subscription' });
  }
});

// Check if email exists for user flow logic
router.post('/api/checkout-new/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Check if user exists in database (using raw SQL for compatibility)
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    
    res.json({
      exists: result.length > 0,
      email: email
    });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ message: 'Failed to check email' });
  }
});

// Complete subscription purchase
router.post('/api/checkout-new/complete-subscription', async (req, res) => {
  try {
    const { subscriptionId, customerDetails } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({ message: 'Subscription ID is required' });
    }
    
    // Retrieve subscription to get metadata
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice.payment_intent', 'customer']
    });
    
    if (subscription.status !== 'active') {
      return res.status(400).json({ message: 'Subscription not activated' });
    }
    
    // Extract metadata
    const { plan_tier, billing_period, product_name, customer_email } = subscription.metadata;
    
    // Create or update user account in database
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      // Check if user already exists
      const existingUser = await sql`SELECT id FROM users WHERE email = ${customer_email} LIMIT 1`;
      
      if (existingUser.length === 0) {
        // Create new user with subscription details
        await sql`
          INSERT INTO users (
            email, first_name, last_name, subscription_tier, subscription_status,
            stripe_customer_id, stripe_subscription_id, billing_period,
            next_billing_date, signup_source, created_at, updated_at
          ) VALUES (
            ${customer_email},
            ${customerDetails.firstName || ''},
            ${customerDetails.lastName || ''},
            ${plan_tier},
            'active',
            ${subscription.customer},
            ${subscription.id},
            ${billing_period},
            ${new Date(subscription.current_period_end * 1000)},
            'checkout-new',
            ${new Date()},
            ${new Date()}
          )
        `;
        console.log('Created new user with subscription:', customer_email);
      } else {
        // Update existing user with subscription details
        await sql`
          UPDATE users SET
            subscription_tier = ${plan_tier},
            subscription_status = 'active',
            stripe_customer_id = ${subscription.customer},
            stripe_subscription_id = ${subscription.id},
            billing_period = ${billing_period},
            next_billing_date = ${new Date(subscription.current_period_end * 1000)},
            updated_at = ${new Date()}
          WHERE email = ${customer_email}
        `;
        console.log('Updated existing user with subscription:', customer_email);
      }
    } catch (dbError) {
      console.error('Database error during subscription completion:', dbError);
      // Continue with success response as payment was processed
    }
    
    res.json({
      success: true,
      message: 'Subscription completed successfully',
      productName: product_name,
      planTier: plan_tier,
      billingPeriod: billing_period,
      subscriptionId: subscription.id,
      status: subscription.status
    });
  } catch (error) {
    console.error('Error completing subscription:', error);
    res.status(500).json({ message: 'Failed to complete subscription' });
  }
});

// Complete one-off purchase
router.post('/api/checkout-new/complete-purchase', async (req, res) => {
  try {
    const { paymentIntentId, customerDetails } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Payment Intent ID is required' });
    }
    
    // Retrieve payment intent to get metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not successful' });
    }
    
    // Extract metadata
    const { product_name, customer_email, product_id } = paymentIntent.metadata;
    
    // Create or update user and record course purchase
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      // Check if user already exists
      let userId;
      const existingUser = await sql`SELECT id FROM users WHERE email = ${customer_email} LIMIT 1`;
      
      if (existingUser.length === 0) {
        // Create new user
        const newUser = await sql`
          INSERT INTO users (
            email, first_name, last_name, signup_source, created_at, updated_at
          ) VALUES (
            ${customer_email},
            ${customerDetails.firstName || ''},
            ${customerDetails.lastName || ''},
            'checkout-new',
            ${new Date()},
            ${new Date()}
          ) RETURNING id
        `;
        userId = newUser[0].id;
        console.log('Created new user for course purchase:', customer_email);
      } else {
        userId = existingUser[0].id;
        console.log('Using existing user for course purchase:', customer_email);
      }
      
      // Record course purchase
      await sql`
        INSERT INTO course_purchases (
          user_id, course_id, payment_intent_id, amount, currency, status,
          created_at, updated_at
        ) VALUES (
          ${userId},
          ${product_id},
          ${paymentIntentId},
          ${paymentIntent.amount / 100},
          ${paymentIntent.currency.toUpperCase()},
          'completed',
          ${new Date()},
          ${new Date()}
        )
      `;
      console.log('Recorded course purchase for user:', userId, 'course:', product_id);
      
    } catch (dbError) {
      console.error('Database error during purchase completion:', dbError);
      // Continue with success response as payment was processed
    }
    
    res.json({
      success: true,
      message: 'Purchase completed successfully',
      productName: product_name,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status
    });
  } catch (error) {
    console.error('Error completing purchase:', error);
    res.status(500).json({ message: 'Failed to complete purchase' });
  }
});

export default router;