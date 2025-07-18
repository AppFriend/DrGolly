import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

interface GoogleMapsAddressAutocompleteProps {
  onAddressSelect: (address: {
    address: string;
    city: string;
    postcode: string;
    country: string;
  }) => void;
  initialValue?: string;
  className?: string;
}

export default function GoogleMapsAddressAutocomplete({ 
  onAddressSelect, 
  initialValue = "",
  className = ""
}: GoogleMapsAddressAutocompleteProps) {
  const [address, setAddress] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMapsAPI = async () => {
      try {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsLoaded(true);
          return;
        }

        // Check if API key is available
        if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
          console.error('VITE_GOOGLE_MAPS_API_KEY is not set');
          setError('Google Maps API key not configured. Please enter your address manually.');
          return;
        }

        // Check if script is already being loaded
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          // Wait for existing script to load
          existingScript.addEventListener('load', () => {
            setIsLoaded(true);
            setError(null);
          });
          existingScript.addEventListener('error', () => {
            setError('Failed to load address autocomplete. Please enter your address manually.');
            setIsLoaded(false);
          });
          return;
        }

        // Load Google Maps JavaScript API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;
        
        // Add global callback function
        (window as any).initGoogleMaps = () => {
          setIsLoaded(true);
          setError(null);
        };
        
        script.onerror = (error) => {
          console.error('Failed to load Google Maps API:', error);
          setError('Failed to load address autocomplete. Please enter your address manually.');
          setIsLoaded(false);
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Google Maps API:', error);
        setError('Failed to load address autocomplete. Please enter your address manually.');
      }
    };

    loadGoogleMapsAPI();
  }, []);

  // Initialize autocomplete when Google Maps is loaded
  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      try {
        // Initialize autocomplete
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['address'],
            componentRestrictions: { country: ['au', 'us', 'ca', 'gb', 'nz'] },
            fields: ['address_components', 'formatted_address', 'place_id']
          }
        );

        // Add place changed listener
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place && place.address_components) {
            const addressComponents = place.address_components;
            
            // Extract address components
            let streetNumber = '';
            let streetName = '';
            let city = '';
            let postcode = '';
            let country = '';
            
            addressComponents.forEach((component) => {
              const types = component.types;
              
              if (types.includes('street_number')) {
                streetNumber = component.long_name;
              }
              if (types.includes('route')) {
                streetName = component.long_name;
              }
              if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                city = component.long_name;
              }
              if (types.includes('postal_code')) {
                postcode = component.long_name;
              }
              if (types.includes('country')) {
                country = component.short_name; // Use short_name for 2-character country code (AU, US, etc.)
              }
            });
            
            const fullAddress = `${streetNumber} ${streetName}`.trim();
            setAddress(place.formatted_address || fullAddress);
            
            // Call parent callback with parsed address
            onAddressSelect({
              address: fullAddress,
              city: city,
              postcode: postcode,
              country: country
            });
          }
        });
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
        setError('Address autocomplete unavailable. Please enter your address manually.');
      }
    }
  }, [isLoaded, onAddressSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    
    // If user is typing manually (not from autocomplete), clear structured data
    if (!autocompleteRef.current) {
      onAddressSelect({
        address: value,
        city: '',
        postcode: '',
        country: ''
      });
    }
  };

  return (
    <div className={className}>
      <Label htmlFor="address">Address</Label>
      <Input
        ref={inputRef}
        id="address"
        type="text"
        placeholder="Start typing your address..."
        value={address}
        onChange={handleInputChange}
        className="mt-1"
      />
      {error && (
        <p className="text-sm text-orange-600 mt-1">{error}</p>
      )}
      {!isLoaded && !error && (
        <p className="text-sm text-gray-500 mt-1">Loading address autocomplete...</p>
      )}
    </div>
  );
}