import Stripe from 'stripe';
import { db } from '../server/db';
import { regionalPricing, shoppingProducts } from '../shared/schema';
import { eq } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function createStripeProducts() {
  console.log('Creating Stripe products for books...');

  // Book 1: Your Baby Doesn't Come with a Book
  const book1Product = await stripe.products.create({
    name: "Your Baby Doesn't Come with a Book",
    description: "A comprehensive guide to navigating the first year with your baby, written by sleep expert Dr. Daniel Golshevsky.",
    metadata: {
      type: 'book',
      category: 'book',
      author: 'Dr. Daniel Golshevsky',
    },
  });

  // Create prices for Book 1
  const book1PriceAud = await stripe.prices.create({
    product: book1Product.id,
    unit_amount: 3000, // $30 AUD in cents
    currency: 'aud',
    metadata: {
      region: 'AU',
    },
  });

  const book1PriceUsd = await stripe.prices.create({
    product: book1Product.id,
    unit_amount: 2000, // $20 USD in cents
    currency: 'usd',
    metadata: {
      region: 'US',
    },
  });

  // Book 2: Dr Golly's Guide to Family Illness
  const book2Product = await stripe.products.create({
    name: "Dr Golly's Guide to Family Illness",
    description: "Essential guide for managing family health and illness, providing practical advice for parents and caregivers.",
    metadata: {
      type: 'book',
      category: 'book',
      author: 'Dr. Daniel Golshevsky',
    },
  });

  // Create prices for Book 2
  const book2PriceAud = await stripe.prices.create({
    product: book2Product.id,
    unit_amount: 3000, // $30 AUD in cents
    currency: 'aud',
    metadata: {
      region: 'AU',
    },
  });

  const book2PriceUsd = await stripe.prices.create({
    product: book2Product.id,
    unit_amount: 2000, // $20 USD in cents
    currency: 'usd',
    metadata: {
      region: 'US',
    },
  });

  console.log('Stripe products created successfully');
  console.log('Book 1 Product ID:', book1Product.id);
  console.log('Book 1 AUD Price ID:', book1PriceAud.id);
  console.log('Book 1 USD Price ID:', book1PriceUsd.id);
  console.log('Book 2 Product ID:', book2Product.id);
  console.log('Book 2 AUD Price ID:', book2PriceAud.id);
  console.log('Book 2 USD Price ID:', book2PriceUsd.id);

  // Update regional pricing to include book prices
  console.log('Updating regional pricing...');
  
  // Update AU pricing
  await db
    .update(regionalPricing)
    .set({
      book1Price: '30.00',
      book2Price: '30.00',
    })
    .where(eq(regionalPricing.region, 'AU'));

  // Update US pricing
  await db
    .update(regionalPricing)
    .set({
      book1Price: '20.00',
      book2Price: '20.00',
    })
    .where(eq(regionalPricing.region, 'US'));

  // Update EU pricing (same as US for now)
  await db
    .update(regionalPricing)
    .set({
      book1Price: '20.00',
      book2Price: '20.00',
    })
    .where(eq(regionalPricing.region, 'EU'));

  // Insert shopping products
  console.log('Creating shopping products in database...');
  
  await db.insert(shoppingProducts).values([
    {
      title: "Your Baby Doesn't Come with a Book",
      author: "Dr. Daniel Golshevsky",
      description: "A comprehensive guide to navigating the first year with your baby, written by sleep expert Dr. Daniel Golshevsky.",
      category: "book",
      stripeProductId: book1Product.id,
      stripePriceAudId: book1PriceAud.id,
      stripePriceUsdId: book1PriceUsd.id,
      priceField: "book1Price",
      rating: "4.8",
      reviewCount: 127,
      amazonUrl: "https://www.amazon.com.au/Your-Baby-Doesnt-Come-Book/dp/1761212885/ref=asc_df_1761212885?mcid=3fad30ed30f63eaea899eb454e9764d0&tag=googleshopmob-22&linkCode=df0&hvadid=712358788289&hvpos=&hvnetw=g&hvrand=15313830547994388509&hvpone=&hvptwo=&hvqmt=&hvdev=m&hvdvcmdl=&hvlocint=&hvlocphy=9112781&hvtargid=pla-2201729947671&psc=1&gad_source=1&dplnkId=a7c77b94-6a4b-4378-8e30-979046fdf615&nodl=1",
      isActive: true,
      isFeatured: true,
      inStock: true,
    },
    {
      title: "Dr Golly's Guide to Family Illness",
      author: "Dr. Daniel Golshevsky", 
      description: "Essential guide for managing family health and illness, providing practical advice for parents and caregivers.",
      category: "book",
      stripeProductId: book2Product.id,
      stripePriceAudId: book2PriceAud.id,
      stripePriceUsdId: book2PriceUsd.id,
      priceField: "book2Price",
      rating: "4.7",
      reviewCount: 89,
      amazonUrl: "https://www.amazon.com.au/Dr-Gollys-Guide-Family-Illness/dp/1761215337/ref=asc_df_1761215337?mcid=5fa13d733a113d21bba7852ac1616b4e&tag=googleshopmob-22&linkCode=df0&hvadid=712379283545&hvpos=&hvnetw=g&hvrand=15313830547994388509&hvpone=&hvptwo=&hvqmt=&hvdev=m&hvdvcmdl=&hvlocint=&hvlocphy=9112781&hvtargid=pla-2422313977118&psc=1&gad_source=1&dplnkId=209a3a52-d644-40ef-a3d7-50f9fc92116d&nodl=1",
      isActive: true,
      isFeatured: false,
      inStock: true,
    },
  ]);

  console.log('Shopping products created successfully in database');
  console.log('Setup complete!');
}

createStripeProducts().catch(console.error);