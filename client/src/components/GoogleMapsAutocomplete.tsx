import React, { useRef, useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Input } from './ui/input';

interface GoogleMapsAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected?: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const GoogleMapsAutocomplete: React.FC<GoogleMapsAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Enter your address",
  className = "",
  disabled = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        const apiKey = 'AIzaSyA4Gi5BbGccEo-x8vm7jmWqwQ6tOEaqHYY';
        
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places'],
        });

        await loader.load();
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps API:', error);
        // If Google Maps fails to load, still allow the component to render as a regular input
        // This is fine - the component will still work as a basic text input
      }
    };

    if (!isLoaded) {
      loadGoogleMaps();
    }
  }, [isLoaded]);

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      // Initialize autocomplete
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        fields: ['formatted_address', 'address_components', 'geometry'],
      });

      // Add place selection listener
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.formatted_address) {
          onChange(place.formatted_address);
          if (onPlaceSelected) {
            onPlaceSelected(place);
          }
        }
      });
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onChange, onPlaceSelected]);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
};

export default GoogleMapsAutocomplete;