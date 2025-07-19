import { RegionalPricing } from '@/types/product';

export const getRegionalPricing = (): RegionalPricing => {
  return {
    AUD: 12000, // $120 AUD in cents
    USD: 12000, // $120 USD in cents  
    EUR: 6000,  // €60 EUR in cents
  };
};

export const detectUserRegion = async (): Promise<string> => {
  try {
    // Use IP geolocation to detect region
    const response = await fetch('/api/detect-region');
    const data = await response.json();
    return data.currency || 'AUD';
  } catch {
    return 'AUD'; // Default to AUD
  }
};

export const formatCurrency = (amount: number, currency: string): string => {
  const symbols = {
    AUD: '$',
    USD: '$', 
    EUR: '€'
  };
  
  return `${symbols[currency as keyof typeof symbols] || '$'}${(amount / 100).toFixed(2)}`;
};