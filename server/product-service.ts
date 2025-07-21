// Product service for database operations with checkout links

import { db } from './db.js';
import { products, type Product, type InsertProduct } from '../shared/schema.js';
import { eq, and, desc, asc } from 'drizzle-orm';

export class ProductService {
  // Get all active products
  async getAllProducts(): Promise<Product[]> {
    return await db.select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(asc(products.sortOrder));
  }

  // Get products by type
  async getProductsByType(productType: 'course' | 'subscription' | 'book' | 'service'): Promise<Product[]> {
    return await db.select()
      .from(products)
      .where(and(
        eq(products.productType, productType),
        eq(products.isActive, true)
      ))
      .orderBy(asc(products.sortOrder));
  }

  // Get products by category
  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select()
      .from(products)
      .where(and(
        eq(products.category, category),
        eq(products.isActive, true)
      ))
      .orderBy(asc(products.sortOrder));
  }

  // Get product by checkout link
  async getProductByCheckoutLink(checkoutLink: string): Promise<Product | undefined> {
    const [product] = await db.select()
      .from(products)
      .where(eq(products.checkoutLink, checkoutLink))
      .limit(1);
    return product;
  }

  // Get product by ID
  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return product;
  }

  // Get product by course ID (for course products)
  async getProductByCourseId(courseId: number): Promise<Product | undefined> {
    const [product] = await db.select()
      .from(products)
      .where(and(
        eq(products.courseId, courseId),
        eq(products.productType, 'course')
      ))
      .limit(1);
    return product;
  }

  // Get product by Stripe product ID
  async getProductByStripeId(stripeProductId: string): Promise<Product | undefined> {
    const [product] = await db.select()
      .from(products)
      .where(eq(products.stripeProductId, stripeProductId))
      .limit(1);
    return product;
  }

  // Get featured products
  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select()
      .from(products)
      .where(and(
        eq(products.isFeatured, true),
        eq(products.isActive, true)
      ))
      .orderBy(asc(products.sortOrder));
  }

  // Get subscription plans
  async getSubscriptionPlans(): Promise<Product[]> {
    return await db.select()
      .from(products)
      .where(and(
        eq(products.productType, 'subscription'),
        eq(products.isActive, true)
      ))
      .orderBy(asc(products.sortOrder));
  }

  // Get courses
  async getCourses(): Promise<Product[]> {
    return await db.select()
      .from(products)
      .where(and(
        eq(products.productType, 'course'),
        eq(products.isActive, true)
      ))
      .orderBy(asc(products.sortOrder));
  }

  // Get books
  async getBooks(): Promise<Product[]> {
    return await db.select()
      .from(products)
      .where(and(
        eq(products.productType, 'book'),
        eq(products.isActive, true)
      ))
      .orderBy(asc(products.sortOrder));
  }

  // Create new product
  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products)
      .values(productData)
      .returning();
    return product;
  }

  // Update product
  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  // Deactivate product (soft delete)
  async deactivateProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  // Get checkout link mapping for easy reference
  async getCheckoutLinkMapping(): Promise<Record<string, Product>> {
    const allProducts = await this.getAllProducts();
    const mapping: Record<string, Product> = {};
    
    allProducts.forEach(product => {
      // Map by checkout link (without leading slash)
      const checkoutKey = product.checkoutLink.replace('/checkout-new/', '');
      mapping[checkoutKey] = product;
    });
    
    return mapping;
  }

  // Get product summary for admin dashboard
  async getProductSummary(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const allProducts = await db.select().from(products);
    
    const summary = {
      total: allProducts.length,
      active: allProducts.filter(p => p.isActive).length,
      inactive: allProducts.filter(p => !p.isActive).length,
      byType: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
    };

    // Count by type
    allProducts.forEach(product => {
      summary.byType[product.productType] = (summary.byType[product.productType] || 0) + 1;
      if (product.category) {
        summary.byCategory[product.category] = (summary.byCategory[product.category] || 0) + 1;
      }
    });

    return summary;
  }
}

// Export singleton instance
export const productService = new ProductService();