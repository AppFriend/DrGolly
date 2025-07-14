import Stripe from 'stripe';
import { storage } from './storage';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export interface StripeProductPricing {
  productId: string;
  prices: {
    aud?: number;
    usd?: number;
    eur?: number;
  };
}

export class StripeSyncService {
  private static instance: StripeSyncService;

  static getInstance(): StripeSyncService {
    if (!StripeSyncService.instance) {
      StripeSyncService.instance = new StripeSyncService();
    }
    return StripeSyncService.instance;
  }

  /**
   * Fetch pricing for a specific Stripe product
   */
  async fetchProductPricing(productId: string): Promise<StripeProductPricing> {
    try {
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
      });

      const pricing: StripeProductPricing = {
        productId,
        prices: {},
      };

      for (const price of prices.data) {
        const amount = price.unit_amount ? price.unit_amount / 100 : 0;
        const currency = price.currency.toUpperCase();
        
        switch (currency) {
          case 'AUD':
            pricing.prices.aud = amount;
            break;
          case 'USD':
            pricing.prices.usd = amount;
            break;
          case 'EUR':
            pricing.prices.eur = amount;
            break;
        }
      }

      return pricing;
    } catch (error) {
      console.error(`Failed to fetch pricing for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Sync book prices from Stripe to regional pricing table
   */
  async syncBookPrices(): Promise<void> {
    try {
      console.log('Starting book price sync from Stripe...');

      // Fetch pricing for both books
      const book1Pricing = await this.fetchProductPricing('prod_SfzaFvJapoxf3g'); // Your Baby Doesn't Come with a Book
      const book2Pricing = await this.fetchProductPricing('prod_SfzbrHMafOFmHI'); // Dr Golly's Guide to Family Illness

      console.log('Book 1 pricing:', book1Pricing);
      console.log('Book 2 pricing:', book2Pricing);

      // Update regional pricing table
      await this.updateRegionalPricing(book1Pricing, book2Pricing);

      console.log('Book price sync completed successfully');
    } catch (error) {
      console.error('Book price sync failed:', error);
      throw error;
    }
  }

  /**
   * Update regional pricing table with Stripe prices
   */
  private async updateRegionalPricing(book1Pricing: StripeProductPricing, book2Pricing: StripeProductPricing): Promise<void> {
    try {
      const regions = ['AU', 'US', 'EU'];
      
      for (const region of regions) {
        let book1Price = 0;
        let book2Price = 0;

        // Map prices based on region
        switch (region) {
          case 'AU':
            book1Price = book1Pricing.prices.aud || 30; // Fallback to 30 AUD
            book2Price = book2Pricing.prices.aud || 30;
            break;
          case 'US':
            book1Price = book1Pricing.prices.usd || 20; // Fallback to 20 USD
            book2Price = book2Pricing.prices.usd || 20;
            break;
          case 'EU':
            book1Price = book1Pricing.prices.eur || 20; // Fallback to 20 EUR
            book2Price = book2Pricing.prices.eur || 20;
            break;
        }

        // Update regional pricing
        await storage.updateRegionalPricingByRegion(region, {
          book1Price: book1Price.toString(),
          book2Price: book2Price.toString(),
        });

        console.log(`Updated ${region} pricing: Book1=${book1Price}, Book2=${book2Price}`);
      }
    } catch (error) {
      console.error('Failed to update regional pricing:', error);
      throw error;
    }
  }

  /**
   * Sync all product prices (books and courses) - can be extended for courses later
   */
  async syncAllPrices(): Promise<void> {
    try {
      await this.syncBookPrices();
      // Can be extended to sync course prices, subscription prices, etc.
    } catch (error) {
      console.error('Failed to sync all prices:', error);
      throw error;
    }
  }
}

export const stripeSyncService = StripeSyncService.getInstance();