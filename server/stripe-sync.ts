import Stripe from "stripe";
import { db } from "./db";
import { stripeProducts, courses, type InsertStripeProduct } from "@shared/schema";
import { eq, and } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export class StripeProductSync {
  
  /**
   * Fetch a product from Stripe by product ID
   */
  async getStripeProduct(productId: string) {
    try {
      const product = await stripe.products.retrieve(productId);
      return product;
    } catch (error) {
      console.error(`Error fetching Stripe product ${productId}:`, error);
      return null;
    }
  }

  /**
   * Fetch a price from Stripe by price ID
   */
  async getStripePrice(priceId: string) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      return price;
    } catch (error) {
      console.error(`Error fetching Stripe price ${priceId}:`, error);
      return null;
    }
  }

  /**
   * Sync a single product from Stripe to our database
   */
  async syncProductFromStripe(productId: string, priceId: string): Promise<boolean> {
    try {
      const [product, price] = await Promise.all([
        this.getStripeProduct(productId),
        this.getStripePrice(priceId)
      ]);

      if (!product || !price) {
        console.error(`Failed to fetch product or price: ${productId}, ${priceId}`);
        return false;
      }

      // Determine product type and category based on product name
      let type: string = "course";
      let category: string = "Single Purchase - Course";
      
      if (product.name.toLowerCase().includes("subscription") || product.name.toLowerCase().includes("gold")) {
        type = "subscription";
        category = "Gold Plan";
      } else if (product.name.toLowerCase().includes("gift")) {
        type = "gift_card";
        category = "Gift Card";
      } else if (product.name.toLowerCase().includes("review") || product.name.toLowerCase().includes("booking")) {
        type = "service";
        category = "Single Purchase - Service";
      } else if (product.name.toLowerCase().includes("free")) {
        type = "free";
        category = "Free User";
      }

      // Try to match with existing course
      let courseId: number | null = null;
      if (type === "course") {
        const allCourses = await db.select().from(courses);
        const matchingCourse = allCourses.find(course => 
          course.name.toLowerCase().includes(product.name.toLowerCase()) ||
          product.name.toLowerCase().includes(course.name.toLowerCase())
        );
        
        if (matchingCourse) {
          courseId = matchingCourse.id;
        }
      }

      // Upsert the product in our database
      await db.insert(stripeProducts).values({
        stripeProductId: productId,
        stripePriceId: priceId,
        name: product.name,
        description: product.description,
        statementDescriptor: product.statement_descriptor,
        purchaseCategory: category,
        type: type,
        amount: price.unit_amount,
        currency: price.currency,
        billingInterval: price.recurring?.interval || null,
        courseId: courseId,
        isActive: product.active
      }).onConflictDoUpdate({
        target: stripeProducts.stripeProductId,
        set: {
          name: product.name,
          description: product.description,
          statementDescriptor: product.statement_descriptor,
          amount: price.unit_amount,
          currency: price.currency,
          billingInterval: price.recurring?.interval || null,
          isActive: product.active,
          updatedAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error(`Error syncing product ${productId}:`, error);
      return false;
    }
  }

  /**
   * Create a new product in Stripe when a course is created
   */
  async createStripeProductForCourse(courseId: number, courseName: string): Promise<string | null> {
    try {
      // Create the product in Stripe
      const product = await stripe.products.create({
        name: `Dr Golly - ${courseName}`,
        description: `Individual course purchase: ${courseName}`,
        statement_descriptor: `Dr Golly - ${courseName}`,
        active: true,
        metadata: {
          courseId: courseId.toString(),
          type: "course",
          app: "dr-golly"
        }
      });

      // Create the price in Stripe
      const price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: 12000, // $120 in cents
        product: product.id,
        metadata: {
          courseId: courseId.toString(),
          type: "course"
        }
      });

      // Add to our database
      await db.insert(stripeProducts).values({
        stripeProductId: product.id,
        stripePriceId: price.id,
        name: product.name,
        description: product.description,
        statementDescriptor: product.statement_descriptor,
        purchaseCategory: "Single Purchase - Course",
        type: "course",
        amount: price.unit_amount,
        currency: price.currency,
        billingInterval: null,
        courseId: courseId,
        isActive: true
      });

      console.log(`✅ Created Stripe product ${product.id} for course ${courseName}`);
      return product.id;
    } catch (error) {
      console.error(`Error creating Stripe product for course ${courseName}:`, error);
      return null;
    }
  }

  /**
   * Get current pricing for a course from Stripe
   */
  async getCoursePrice(courseId: number): Promise<number | null> {
    try {
      const [product] = await db.select()
        .from(stripeProducts)
        .where(and(
          eq(stripeProducts.courseId, courseId),
          eq(stripeProducts.type, "course"),
          eq(stripeProducts.isActive, true)
        ));

      if (!product) {
        return null;
      }

      // Fetch latest price from Stripe
      const price = await this.getStripePrice(product.stripePriceId);
      if (!price) {
        return product.amount; // Fallback to database amount
      }

      // Update database if price changed
      if (price.unit_amount !== product.amount) {
        await db.update(stripeProducts)
          .set({ 
            amount: price.unit_amount,
            updatedAt: new Date()
          })
          .where(eq(stripeProducts.id, product.id));
      }

      return price.unit_amount;
    } catch (error) {
      console.error(`Error getting course price for course ${courseId}:`, error);
      return null;
    }
  }

  /**
   * Get subscription pricing from Stripe
   */
  async getSubscriptionPricing(): Promise<{
    monthly: { priceId: string; amount: number } | null;
    yearly: { priceId: string; amount: number } | null;
  }> {
    try {
      const subscriptionProducts = await db.select()
        .from(stripeProducts)
        .where(and(
          eq(stripeProducts.type, "subscription"),
          eq(stripeProducts.isActive, true)
        ));

      const result = {
        monthly: null as { priceId: string; amount: number } | null,
        yearly: null as { priceId: string; amount: number } | null
      };

      for (const product of subscriptionProducts) {
        const price = await this.getStripePrice(product.stripePriceId);
        if (!price) continue;

        // Update database if price changed
        if (price.unit_amount !== product.amount) {
          await db.update(stripeProducts)
            .set({ 
              amount: price.unit_amount,
              updatedAt: new Date()
            })
            .where(eq(stripeProducts.id, product.id));
        }

        if (product.billingInterval === "month") {
          result.monthly = {
            priceId: product.stripePriceId,
            amount: price.unit_amount || 0
          };
        } else if (product.billingInterval === "year") {
          result.yearly = {
            priceId: product.stripePriceId,
            amount: price.unit_amount || 0
          };
        }
      }

      return result;
    } catch (error) {
      console.error("Error getting subscription pricing:", error);
      return { monthly: null, yearly: null };
    }
  }

  /**
   * Sync all products from our database with Stripe
   */
  async syncAllProducts(): Promise<void> {
    console.log("🔄 Starting full Stripe product sync...");
    
    try {
      const allProducts = await db.select().from(stripeProducts);
      
      for (const product of allProducts) {
        const success = await this.syncProductFromStripe(
          product.stripeProductId, 
          product.stripePriceId
        );
        
        if (success) {
          console.log(`✅ Synced product: ${product.name}`);
        } else {
          console.log(`❌ Failed to sync product: ${product.name}`);
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log("✅ Full Stripe product sync completed");
    } catch (error) {
      console.error("❌ Error during full sync:", error);
      throw error;
    }
  }
}

export const stripeSync = new StripeProductSync();