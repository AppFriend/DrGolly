import express, { Router } from 'express';
import geoip from 'geoip-lite';

const router = Router();

interface RegionalPrice {
  amount: number;
  currency: string;
  region: string;
  symbol: string;
}

const REGIONAL_PRICING: Record<string, RegionalPrice> = {
  AU: { amount: 120, currency: 'AUD', region: 'AU', symbol: '$' },
  US: { amount: 120, currency: 'USD', region: 'US', symbol: '$' },
  GB: { amount: 60, currency: 'GBP', region: 'GB', symbol: '£' },
  EU: { amount: 60, currency: 'EUR', region: 'EU', symbol: '€' },
  CA: { amount: 120, currency: 'CAD', region: 'CA', symbol: '$' },
  NZ: { amount: 120, currency: 'NZD', region: 'NZ', symbol: '$' },
};

// Detect user region based on IP
router.get('/api/detect-region', (req, res) => {
  try {
    let ip = req.ip || req.connection.remoteAddress;
    
    // Handle X-Forwarded-For header for production deployments
    if (req.headers['x-forwarded-for']) {
      ip = (req.headers['x-forwarded-for'] as string).split(',')[0].trim();
    }
    
    console.log('Detecting region for IP:', ip);
    
    // Skip localhost/development IPs
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      console.log('Local/development IP detected, using AU default');
      return res.json({
        region: 'AU',
        country: 'AU',
        pricing: REGIONAL_PRICING.AU,
        ip: ip || 'unknown'
      });
    }
    
    const geo = geoip.lookup(ip);
    
    if (geo) {
      let region = 'AU'; // Default
      
      // Map countries to regions
      switch (geo.country) {
        case 'AU':
          region = 'AU';
          break;
        case 'US':
          region = 'US';
          break;
        case 'GB':
          region = 'GB';
          break;
        case 'CA':
          region = 'CA';
          break;
        case 'NZ':
          region = 'NZ';
          break;
        // European countries
        case 'DE':
        case 'FR':
        case 'IT':
        case 'ES':
        case 'NL':
        case 'SE':
        case 'NO':
        case 'DK':
        case 'FI':
        case 'AT':
        case 'BE':
        case 'CH':
        case 'IE':
          region = 'EU';
          break;
        default:
          // For other countries, use geographic proximity
          if (geo.ll) {
            const [lat, lon] = geo.ll;
            // Australia/Oceania region
            if (lat < -10 && lon > 110 && lon < 180) {
              region = 'AU';
            }
            // Americas
            else if (lon < -30) {
              region = lat > 50 ? 'CA' : 'US';
            }
            // Europe/Africa
            else if (lon > -10 && lon < 50) {
              region = lat > 35 ? 'EU' : 'AU'; // Default for Africa
            }
            // Asia (default to AU pricing for now)
            else {
              region = 'AU';
            }
          }
      }
      
      console.log(`✓ Region detected: ${region} for country: ${geo.country}`);
      
      res.json({
        region,
        country: geo.country,
        pricing: REGIONAL_PRICING[region],
        ip,
        geo: {
          city: geo.city,
          timezone: geo.timezone,
          coordinates: geo.ll
        }
      });
    } else {
      console.log('No geo data found, using AU default');
      res.json({
        region: 'AU',
        country: 'AU',
        pricing: REGIONAL_PRICING.AU,
        ip,
        geo: null
      });
    }
  } catch (error) {
    console.error('Error detecting region:', error);
    res.json({
      region: 'AU',
      country: 'AU',
      pricing: REGIONAL_PRICING.AU,
      ip: req.ip || 'unknown',
      error: 'Detection failed'
    });
  }
});

// Get pricing for specific region
router.get('/api/regional-pricing/:region', (req, res) => {
  const { region } = req.params;
  const pricing = REGIONAL_PRICING[region.toUpperCase()];
  
  if (pricing) {
    res.json(pricing);
  } else {
    res.status(404).json({ 
      message: 'Region not found',
      availableRegions: Object.keys(REGIONAL_PRICING)
    });
  }
});

// Get all available regions and pricing
router.get('/api/regional-pricing', (req, res) => {
  res.json({
    regions: REGIONAL_PRICING,
    defaultRegion: 'AU'
  });
});

export default router;