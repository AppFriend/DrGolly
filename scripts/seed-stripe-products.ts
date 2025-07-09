import { db } from "../server/db";
import { stripeProducts, courses } from "@shared/schema";
import { eq } from "drizzle-orm";

const csvData = [
  {
    priceId: "price_1RgwLSDENq1nVlsZkdFFOGKe",
    productId: "prod_ScAgQdp0BP52x5",
    name: "Dr Golly Gold App Subscription $199 (Annual)",
    statementDescriptor: "Dr Golly Gold App Plan - Annual",
    category: "Gold Plan",
    type: "subscription",
    amount: 19900, // $199 in cents
    billingInterval: "yearly"
  },
  {
    priceId: "price_1RdcQFDENq1nVlsZewnMcYkx",
    productId: "prod_SYjupCohzptIdn",
    name: "Dr Golly Gold App Subscription (New)",
    statementDescriptor: "Dr Golly Gold App Plan - Monthly",
    category: "Gold Plan",
    type: "subscription",
    amount: 19900, // $199 in cents (monthly)
    billingInterval: "monthly"
  },
  {
    priceId: "price_1RU0gqDENq1nVlsZkw3LyjTX",
    productId: "prod_SOoJHJV3Do4nCN",
    name: "Free",
    statementDescriptor: "Free User",
    category: "Free User",
    type: "free",
    amount: 0,
    billingInterval: null
  },
  {
    priceId: "price_1RTW0lDENq1nVlsZnrBgwAjf",
    productId: "prod_SOIbZB6zPw3BCf",
    name: "Dr Golly Gift Card - $250",
    statementDescriptor: "Dr Golly Gift Card $250",
    category: "Gift Card",
    type: "gift_card",
    amount: 25000,
    billingInterval: null
  },
  {
    priceId: "price_1RTW0VDENq1nVlsZo3RlWi5b",
    productId: "prod_SOIbEomNCBzCOK",
    name: "Dr Golly Gift Card - $100",
    statementDescriptor: "Dr Golly Gift Card $100",
    category: "Gift Card",
    type: "gift_card",
    amount: 10000,
    billingInterval: null
  },
  // Course products
  {
    priceId: "price_1RMxPhDENq1nVlsZZ9HrTyfT",
    productId: "prod_SHWS2DPUIyrgx8",
    name: "Dr Golly - Allergens Course",
    statementDescriptor: "Dr Golly - Allergens Course",
    category: "Single Purchase - Course",
    type: "course",
    amount: 12000, // $120 in cents
    billingInterval: null,
    courseName: "Allergens Course"
  },
  {
    priceId: "price_1RMxNbDENq1nVlsZ66xTjPy7",
    productId: "prod_SHWQ4eKvsq6SST",
    name: "Dr Golly - Toddler Toolkit",
    statementDescriptor: "Dr Golly - Toddler Toolkit",
    category: "Single Purchase - Course",
    type: "course",
    amount: 12000,
    billingInterval: null,
    courseName: "Toddler Toolkit"
  },
  {
    priceId: "price_1RMxL6DENq1nVlsZlJHsRyX2",
    productId: "prod_SHWNZxk17hkpxR",
    name: "Preparation For Newborns 0-4 Weeks",
    statementDescriptor: "Dr Golly - Preparation For Newborns 0-4 Weeks",
    category: "Single Purchase - Course",
    type: "course",
    amount: 12000,
    billingInterval: null,
    courseName: "Preparation For Newborns 0-4 Weeks"
  },
  {
    priceId: "price_1RMxKADENq1nVlsZpV39Bd90",
    productId: "prod_SHWMeypc3mtQGU",
    name: "Pre-School Sleep Program",
    statementDescriptor: "Dr Golly Pre-School Sleep Program",
    category: "Single Purchase - Course",
    type: "course",
    amount: 12000,
    billingInterval: null,
    courseName: "Pre-School Sleep Program"
  },
  {
    priceId: "price_1RMxJBDENq1nVlsZsoVPfVFT",
    productId: "prod_SHWLCh0hZUPcjh",
    name: "Toddler Sleep Program",
    statementDescriptor: "Dr Golly - Toddler Sleep Program",
    category: "Single Purchase - Course",
    type: "course",
    amount: 12000,
    billingInterval: null,
    courseName: "Toddler Sleep Program"
  },
  {
    priceId: "price_1RMxCFDENq1nVlsZ1F730Qco",
    productId: "prod_SHWE5oO8RTyb31",
    name: "Pre-Toddler Sleep Program",
    statementDescriptor: "Dr Golly - Pre-Toddler Sleep Program",
    category: "Single Purchase - Course",
    type: "course",
    amount: 12000,
    billingInterval: null,
    courseName: "Pre-Toddler Sleep Program"
  },
  {
    priceId: "price_1RJRnNDENq1nVlsZbms5RqTi",
    productId: "prod_SDtatrd4ZFLBBL",
    name: "Big Baby Sleep Program",
    statementDescriptor: "Dr Golly - Big Baby Sleep Program",
    category: "Single Purchase - Course",
    type: "course",
    amount: 12000,
    billingInterval: null,
    courseName: "Big Baby Sleep Program"
  },
  {
    priceId: "price_1RJRmnDENq1nVlsZIBDC1x17",
    productId: "prod_SDtZKUzta8TGqW",
    name: "Little Baby Sleep Program",
    statementDescriptor: "Dr Golly - Little Baby Sleep Program",
    category: "Single Purchase - Course",
    type: "course",
    amount: 12000,
    billingInterval: null,
    courseName: "Little Baby Sleep Program"
  },
  {
    priceId: "price_1RJRjEDENq1nVlsZopsqPer4",
    productId: "prod_SDtWT21VSBhplz",
    name: "Twins Supplement",
    statementDescriptor: "Dr Golly - Twins Supplement",
    category: "Single Purchase - Course",
    type: "course",
    amount: 12000,
    billingInterval: null,
    courseName: "Twins Supplement"
  },
  {
    priceId: "price_1RJRiNDENq1nVlsZHiLRUS5G",
    productId: "prod_SDtVbbxxaRnbgC",
    name: "New Sibling Supplement",
    statementDescriptor: "Dr Golly - New Sibling Supplement",
    category: "Single Purchase - Course",
    type: "course",
    amount: 12000,
    billingInterval: null,
    courseName: "New Sibling Supplement"
  },
  // Service products
  {
    priceId: "price_1RK6l8DENq1nVlsZGQOFkTRs",
    productId: "prod_SEZuJxXyPmsTt6",
    name: "Lactation Review",
    statementDescriptor: "Lactation Review Booking",
    category: "Single Purchase - Service",
    type: "service",
    amount: 12000,
    billingInterval: null
  },
  {
    priceId: "price_1RK6kUDENq1nVlsZgkrxgdk0",
    productId: "prod_SEZuJjSpaa7y5y",
    name: "Sleep Review",
    statementDescriptor: "Sleep Review Booking",
    category: "Single Purchase - Service",
    type: "service",
    amount: 12000,
    billingInterval: null
  }
];

async function seedStripeProducts() {
  console.log("🔄 Seeding Stripe products...");
  
  try {
    // Clear existing products
    await db.delete(stripeProducts);
    
    // Get all courses to match with products
    const allCourses = await db.select().from(courses);
    
    for (const product of csvData) {
      let courseId: number | null = null;
      
      // For course products, try to match with existing courses
      if (product.type === "course" && product.courseName) {
        const matchingCourse = allCourses.find(course => 
          course.name && product.courseName && (
            course.name.toLowerCase().includes(product.courseName.toLowerCase()) ||
            product.courseName.toLowerCase().includes(course.name.toLowerCase())
          )
        );
        
        if (matchingCourse) {
          courseId = matchingCourse.id;
        } else {
          console.log(`⚠️ No matching course found for: ${product.courseName}`);
        }
      }
      
      await db.insert(stripeProducts).values({
        stripeProductId: product.productId,
        stripePriceId: product.priceId,
        name: product.name,
        statementDescriptor: product.statementDescriptor,
        purchaseCategory: product.category,
        type: product.type,
        amount: product.amount,
        currency: "usd",
        billingInterval: product.billingInterval,
        courseId: courseId,
        isActive: true
      });
    }
    
    console.log(`✅ Successfully seeded ${csvData.length} Stripe products`);
    
    // Show summary
    const productCounts = await db.select().from(stripeProducts);
    const byType = productCounts.reduce((acc, product) => {
      acc[product.type] = (acc[product.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("📊 Product summary:");
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
  } catch (error) {
    console.error("❌ Error seeding Stripe products:", error);
    throw error;
  }
}

export { seedStripeProducts };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedStripeProducts()
    .then(() => {
      console.log("🎉 Stripe products seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Stripe products seeding failed:", error);
      process.exit(1);
    });
}