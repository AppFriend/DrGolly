// Regional pricing utilities for checkout-new
export interface RegionalPrice {
  amount: number;
  currency: string;
  region: string;
  symbol: string;
}

export const REGIONAL_PRICING: Record<string, RegionalPrice> = {
  AU: { amount: 120, currency: 'AUD', region: 'AU', symbol: '$' },
  US: { amount: 120, currency: 'USD', region: 'US', symbol: '$' },
  GB: { amount: 60, currency: 'GBP', region: 'GB', symbol: '£' },
  EU: { amount: 60, currency: 'EUR', region: 'EU', symbol: '€' },
  CA: { amount: 120, currency: 'CAD', region: 'CA', symbol: '$' },
  NZ: { amount: 120, currency: 'NZD', region: 'NZ', symbol: '$' },
};

export async function detectUserRegion(): Promise<string> {
  try {
    // Try to get region from API first
    const response = await fetch('/api/detect-region');
    if (response.ok) {
      const data = await response.json();
      return data.region || 'AU';
    }
  } catch (error) {
    console.log('Could not detect region from API, using default');
  }

  // Fallback to browser timezone detection
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes('Australia')) return 'AU';
    if (timezone.includes('America') && (timezone.includes('New_York') || timezone.includes('Los_Angeles'))) return 'US';
    if (timezone.includes('Europe')) return 'EU';
    if (timezone.includes('London')) return 'GB';
    if (timezone.includes('Canada')) return 'CA';
    if (timezone.includes('Auckland')) return 'NZ';
  } catch (error) {
    console.log('Browser timezone detection failed');
  }

  // Default to Australia
  return 'AU';
}

export function getRegionalPrice(region: string): RegionalPrice {
  return REGIONAL_PRICING[region] || REGIONAL_PRICING.AU;
}

export function formatPrice(amount: number, currency: string): string {
  const price = getRegionalPrice(currency);
  return `${price.symbol}${amount.toFixed(2)} ${currency}`;
}