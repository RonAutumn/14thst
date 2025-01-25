'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

interface GooglePlacesScriptProps {
  onLoad?: () => void;
  apiKey: string;
}

export default function GooglePlacesScript({ onLoad, apiKey }: GooglePlacesScriptProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('GooglePlacesScript mounted, checking for existing Google Places...');
    // Check if the script is already loaded
    if (window.google?.maps?.places) {
      console.log('Google Places already loaded');
      setIsLoaded(true);
      onLoad?.();
      return;
    }
    console.log('Google Places not found, waiting for script to load...');
  }, [onLoad]);

  const handleScriptLoad = () => {
    console.log('Google Places script tag loaded, checking for Places library...');
    
    // Check immediately
    if (window.google?.maps?.places) {
      console.log('Places library available immediately');
      setIsLoaded(true);
      onLoad?.();
      return;
    }

    // If not available immediately, wait a bit and check again
    const checkInterval = setInterval(() => {
      console.log('Checking for Places library...');
      if (window.google?.maps?.places) {
        console.log('Places library now available');
        clearInterval(checkInterval);
        setIsLoaded(true);
        onLoad?.();
      }
    }, 100);

    // Stop checking after 5 seconds
    setTimeout(() => {
      if (!window.google?.maps?.places) {
        console.error('Places library failed to initialize after 5 seconds');
        clearInterval(checkInterval);
        setError('Failed to initialize Google Places');
      }
    }, 5000);
  };

  const handleScriptError = (e: Error) => {
    console.error('Failed to load Google Places script:', e);
    setError(e.message);
  };

  if (!apiKey) {
    console.error('Google Places API key is missing');
    return null;
  }

  console.log('Rendering Google Places script with API key:', apiKey.substring(0, 8) + '...');

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
        onLoad={handleScriptLoad}
        onError={handleScriptError}
        strategy="afterInteractive"
      />
      {error && (
        <div style={{ display: 'none' }} data-testid="google-places-error">
          {error}
        </div>
      )}
    </>
  );
} 