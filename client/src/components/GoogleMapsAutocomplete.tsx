import React, { useRef, useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface GoogleMapsAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
}

const GoogleMapsAutocomplete: React.FC<GoogleMapsAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter your address",
  className = ""
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        const loader = new Loader({
          apiKey: "AIzaSyA4Gi5BbGccEo-x8vm7jmWqwQ6tOEaqHYY",
          version: "weekly",
          libraries: ["places"]
        });

        await loader.load();
        setIsLoaded(true);

        if (inputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            types: ['address'],
            fields: ['formatted_address', 'address_components', 'geometry']
          });

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.formatted_address) {
              onChange(place.formatted_address);
              onPlaceSelect?.(place);
            }
          });

          autocompleteRef.current = autocomplete;
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initializeAutocomplete();

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent ${className}`}
    />
  );
};

export default GoogleMapsAutocomplete;