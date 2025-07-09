import geoip from 'geoip-lite';
import { storage } from './storage';

export interface RegionInfo {
  region: string;
  currency: string;
  coursePrice: number;
  goldMonthly: number;
  goldYearly: number;
  platinumMonthly: number;
  platinumYearly: number;
}

export class RegionalPricingService {
  private static instance: RegionalPricingService;
  private pricingCache: Map<string, RegionInfo> = new Map();

  static getInstance(): RegionalPricingService {
    if (!RegionalPricingService.instance) {
      RegionalPricingService.instance = new RegionalPricingService();
    }
    return RegionalPricingService.instance;
  }

  async initializeRegionalPricing(): Promise<void> {
    // Clear existing cache
    this.pricingCache.clear();

    // Get all regional pricing from database
    const allPricing = await storage.getRegionalPricing();
    
    // If no pricing exists, initialize with default values
    if (allPricing.length === 0) {
      await this.seedDefaultRegionalPricing();
      const newPricing = await storage.getRegionalPricing();
      this.buildCache(newPricing);
    } else {
      this.buildCache(allPricing);
    }
  }

  private buildCache(pricingData: any[]): void {
    for (const pricing of pricingData) {
      this.pricingCache.set(pricing.region, {
        region: pricing.region,
        currency: pricing.currency,
        coursePrice: parseFloat(pricing.coursePrice),
        goldMonthly: parseFloat(pricing.goldMonthly),
        goldYearly: parseFloat(pricing.goldYearly),
        platinumMonthly: parseFloat(pricing.platinumMonthly),
        platinumYearly: parseFloat(pricing.platinumYearly),
      });
    }
  }

  private async seedDefaultRegionalPricing(): Promise<void> {
    const defaultPricing = [
      {
        region: 'AU',
        currency: 'AUD',
        coursePrice: '120.00',
        goldMonthly: '199.00',
        goldYearly: '99.00',
        platinumMonthly: '499.00',
        platinumYearly: '249.00',
        countryList: ['AU', 'NZ', 'FJ', 'PG', 'SB', 'VU', 'NC', 'PF'],
        isActive: true,
      },
      {
        region: 'US',
        currency: 'USD',
        coursePrice: '120.00',
        goldMonthly: '199.00',
        goldYearly: '99.00',
        platinumMonthly: '499.00',
        platinumYearly: '249.00',
        countryList: ['US', 'CA', 'MX'],
        isActive: true,
      },
      {
        region: 'EU',
        currency: 'EUR',
        coursePrice: '120.00',
        goldMonthly: '199.00',
        goldYearly: '99.00',
        platinumMonthly: '499.00',
        platinumYearly: '249.00',
        countryList: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'FI', 'SE', 'NO', 'DK', 'IE', 'LU', 'MT', 'CY', 'EE', 'LV', 'LT', 'SK', 'SI', 'BG', 'RO', 'HR', 'CZ', 'HU', 'PL', 'GR'],
        isActive: true,
      },
    ];

    for (const pricing of defaultPricing) {
      await storage.createRegionalPricing(pricing);
    }
  }

  detectRegionFromIP(ipAddress: string): string {
    // Handle localhost and private IPs - default to AU for development
    if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
      return 'AU'; // Default to AU for development
    }

    const geo = geoip.lookup(ipAddress);
    if (!geo) {
      return 'US'; // Default fallback
    }

    const country = geo.country;
    
    // Check each region's country list
    for (const [region, pricing] of this.pricingCache) {
      const regionData = this.pricingCache.get(region);
      if (regionData) {
        // We need to get the country list from database since it's not in the cache
        // For now, use hardcoded logic
        if (region === 'AU' && ['AU', 'NZ', 'FJ', 'PG', 'SB', 'VU', 'NC', 'PF'].includes(country)) {
          return 'AU';
        }
        if (region === 'US' && ['US', 'CA', 'MX'].includes(country)) {
          return 'US';
        }
        if (region === 'EU' && ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'FI', 'SE', 'NO', 'DK', 'IE', 'LU', 'MT', 'CY', 'EE', 'LV', 'LT', 'SK', 'SI', 'BG', 'RO', 'HR', 'CZ', 'HU', 'PL', 'GR'].includes(country)) {
          return 'EU';
        }
      }
    }

    return 'US'; // Default fallback
  }

  getPricingForRegion(region: string): RegionInfo | null {
    return this.pricingCache.get(region) || null;
  }

  async getPricingForIP(ipAddress: string): Promise<RegionInfo> {
    const region = this.detectRegionFromIP(ipAddress);
    const pricing = this.getPricingForRegion(region);
    
    if (!pricing) {
      // Fallback to US pricing if region not found
      return this.getPricingForRegion('US') || {
        region: 'US',
        currency: 'USD',
        coursePrice: 120,
        goldMonthly: 199,
        goldYearly: 99,
        platinumMonthly: 499,
        platinumYearly: 249,
      };
    }
    
    return pricing;
  }

  getAllRegions(): string[] {
    return Array.from(this.pricingCache.keys());
  }

  async refreshCache(): Promise<void> {
    await this.initializeRegionalPricing();
  }
}

export const regionalPricingService = RegionalPricingService.getInstance();