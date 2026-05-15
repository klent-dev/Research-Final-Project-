import { useCallback, useState } from 'react';
import { validateBrowserLocation } from '../utils/gpsValidation.js';

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const result = validateBrowserLocation(position.coords);
        setLocation(result.location);
        setError(result.error ?? '');
        setIsLocating(false);
      },
      (geoError) => {
        setError(geoError.message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000
      }
    );
  }, []);

  return { location, error, isLocating, requestLocation };
}

