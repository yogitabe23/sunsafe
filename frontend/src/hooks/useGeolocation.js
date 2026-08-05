import { useState, useEffect } from "react";

export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    const successHandler = (position) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setLoading(false);
      setError(null);
    };

    const errorHandler = (err) => {
      const messages = {
        [err.PERMISSION_DENIED]: "Location permission denied. Please enable location access in your browser settings.",
        [err.POSITION_UNAVAILABLE]: "Location information is unavailable.",
        [err.TIMEOUT]: "Location request timed out.",
      };
      setError(messages[err.code] || "An unknown error occurred.");
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  }, []);

  return { location, loading, error };
};
