import { useState, useEffect } from 'react';

// Import all freebie assets
import sleepTips from '@/assets/freebies/sleep-tips.svg';
import fussyEaters from '@/assets/freebies/fussy-eaters.svg';
import startingSolids from '@/assets/freebies/starting-solids.svg';
import breastmilkStorage from '@/assets/freebies/breastmilk-storage.svg';
import bedtimeRoutineChart from '@/assets/freebies/bedtime-routine-chart.svg';
import colicsVideo from '@/assets/freebies/colic-video.svg';
import earlyMorningWaking from '@/assets/freebies/early-morning-waking.svg';

// Asset mapping for admin panel management
export const FREEBIE_ASSETS = {
  '@/assets/freebies/sleep-tips.svg': sleepTips,
  '@/assets/freebies/fussy-eaters.svg': fussyEaters,
  '@/assets/freebies/starting-solids.svg': startingSolids,
  '@/assets/freebies/breastmilk-storage.svg': breastmilkStorage,
  '@/assets/freebies/bedtime-routine-chart.svg': bedtimeRoutineChart,
  '@/assets/freebies/colic-video.svg': colicsVideo,
  '@/assets/freebies/early-morning-waking.svg': earlyMorningWaking,
};

interface FreebieImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function FreebieImage({ src, alt, className = '' }: FreebieImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    // Check if the src is a freebie asset path
    if (src.startsWith('@/assets/freebies/')) {
      const assetSrc = FREEBIE_ASSETS[src as keyof typeof FREEBIE_ASSETS];
      if (assetSrc) {
        setImageSrc(assetSrc);
      } else {
        // Fallback to a default image or the original src
        setImageSrc(src);
      }
    } else {
      // Use the original src for non-freebie images
      setImageSrc(src);
    }
  }, [src]);

  if (!imageSrc) {
    return (
      <div className={`bg-gray-200 animate-pulse ${className}`}>
        <div className="flex items-center justify-center h-full">
          <span className="text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}

// Asset management function for admin panel
export function getFreebieAssetOptions() {
  return Object.keys(FREEBIE_ASSETS).map(path => ({
    value: path,
    label: path.replace('@/assets/freebies/', '').replace('.svg', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }));
}