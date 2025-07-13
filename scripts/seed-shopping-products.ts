import { storage } from '../server/storage';
import type { InsertShoppingProduct } from '@shared/schema';

export async function seedShoppingProducts() {
  try {
    // Check if products already exist
    const existingProducts = await storage.getShoppingProducts();
    if (existingProducts.length > 0) {
      console.log('Shopping products already exist, skipping seed.');
      return;
    }

    const products: InsertShoppingProduct[] = [
      {
        title: "Your Baby Doesn't Come with a Book",
        author: "Dr. Daniel Golshevsky",
        description: "A comprehensive guide to navigating the first year with your baby, written by sleep expert Dr. Daniel Golshevsky.",
        priceField: "book1Price",
        stripePriceAudId: "price_book1_aud", // Will be updated when Stripe products are created
        stripePriceUsdId: "price_book1_usd",
        stripePriceEurId: "price_book1_eur",
        amazonUrl: "https://www.amazon.com.au/Your-Baby-Doesnt-Come-Book/dp/1761212885/ref=asc_df_1761212885?mcid=3fad30ed30f63eaea899eb454e9764d0&tag=googleshopmob-22&linkCode=df0&hvadid=712358788289&hvpos=&hvnetw=g&hvrand=15313830547994388509&hvpone=&hvptwo=&hvqmt=&hvdev=m&hvdvcmdl=&hvlocint=&hvlocphy=9112781&hvtargid=pla-2201729947671&psc=1&gad_source=1&dplnkId=a7c77b94-6a4b-4378-8e30-979046fdf615&nodl=1",
        category: "Book",
        inStock: true,
        isFeatured: true,
        rating: 4.8,
        reviewCount: 127,
      },
      {
        title: "Dr Golly's Guide to Family Illness",
        author: "Dr. Daniel Golshevsky",
        description: "Essential guide for managing family health and illness, providing practical advice for parents and caregivers.",
        priceField: "book2Price",
        stripePriceAudId: "price_book2_aud",
        stripePriceUsdId: "price_book2_usd",
        stripePriceEurId: "price_book2_eur",
        amazonUrl: "https://www.amazon.com.au/Dr-Gollys-Guide-Family-Illness/dp/1761215337/ref=asc_df_1761215337?mcid=5fa13d733a113d21bba7852ac1616b4e&tag=googleshopmob-22&linkCode=df0&hvadid=712379283545&hvpos=&hvnetw=g&hvrand=15313830547994388509&hvpone=&hvptwo=&hvqmt=&hvdev=m&hvdvcmdl=&hvlocint=&hvlocphy=9112781&hvtargid=pla-2422313977118&psc=1&gad_source=1&dplnkId=209a3a52-d644-40ef-a3d7-50f9fc92116d&nodl=1",
        category: "Book",
        inStock: true,
        isFeatured: false,
        rating: 4.7,
        reviewCount: 89,
      },
    ];

    // Create products in database
    for (const product of products) {
      await storage.createShoppingProduct(product);
    }

    console.log('Shopping products seeded successfully!');
  } catch (error) {
    console.error('Error seeding shopping products:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedShoppingProducts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}