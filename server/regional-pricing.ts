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
  book1Price: number;
  book2Price: number;
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
        book1Price: parseFloat(pricing.book1Price),
        book2Price: parseFloat(pricing.book2Price),
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
        book1Price: '30.00',
        book2Price: '30.00',
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
        book1Price: '20.00',
        book2Price: '20.00',
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
        book1Price: '20.00',
        book2Price: '20.00',
        countryList: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'FI', 'SE', 'NO', 'DK', 'IE', 'LU', 'MT', 'CY', 'EE', 'LV', 'LT', 'SK', 'SI', 'BG', 'RO', 'HR', 'CZ', 'HU', 'PL', 'GR'],
        isActive: true,
      },
    ];

    for (const pricing of defaultPricing) {
      await storage.createRegionalPricing(pricing);
    }
  }

  detectRegionFromIP(ipAddress: string): string {
    console.log('Detecting region for IP:', ipAddress);
    
    // Handle localhost and private IPs - default to AU for development
    if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
      console.log('Local IP detected, defaulting to AU');
      return 'AU'; // Default to AU for development
    }

    const geo = geoip.lookup(ipAddress);
    console.log('GeoIP lookup result:', geo);
    
    if (!geo) {
      console.log('No geo data found, defaulting to US');
      return 'US'; // Default fallback
    }

    const country = geo.country;
    console.log('Country detected:', country);
    
    // Check each region's country list with detailed logging
    const auCountries = ['AU', 'NZ', 'FJ', 'PG', 'SB', 'VU', 'NC', 'PF'];
    const usCountries = ['US', 'CA', 'MX'];
    const euCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'FI', 'SE', 'NO', 'DK', 'IE', 'LU', 'MT', 'CY', 'EE', 'LV', 'LT', 'SK', 'SI', 'BG', 'RO', 'HR', 'CZ', 'HU', 'PL', 'GR'];
    
    if (auCountries.includes(country)) {
      console.log('Country matches AU region');
      return 'AU';
    }
    
    if (usCountries.includes(country)) {
      console.log('Country matches US region');
      return 'US';
    }
    
    if (euCountries.includes(country)) {
      console.log('Country matches EU region');
      return 'EU';
    }

    console.log('Country not found in any region, defaulting to US');
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
        book1Price: 20,
        book2Price: 20,
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