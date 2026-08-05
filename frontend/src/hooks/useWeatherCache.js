import { useState, useCallback, useEffect, useRef } from "react";
import { api, getErrorMessage } from "@/lib/api";

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export const useWeatherCache = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);

  // Refs mirror state so fetchWeather can read latest values without
  // needing them in its dependency array (avoids stale-closure re-fetch loops).
  const weatherDataRef = useRef(weatherData);
  const lastUpdatedRef = useRef(lastUpdated);
  useEffect(() => { weatherDataRef.current = weatherData; }, [weatherData]);
  useEffect(() => { lastUpdatedRef.current = lastUpdated; }, [lastUpdated]);

  const isCacheValid = useCallback(() => {
    const updated = lastUpdatedRef.current;
    return !!updated && Date.now() - updated < CACHE_DURATION_MS;
  }, []);

  const fetchWeather = useCallback(async (lat, lon, forceRefresh = false) => {
    if (!forceRefresh && isCacheValid() && weatherDataRef.current) {
      return weatherDataRef.current;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/weather", { params: { lat, lon } });
      setWeatherData(response.data);
      setLastUpdated(Date.now());
      setLocation({ lat, lon });
      return response.data;
    } catch (err) {
      const message = getErrorMessage(err, "Failed to fetch weather data");
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [isCacheValid]);

  const refreshWeather = useCallback(async () => {
    if (!location) throw new Error("No location available");
    return fetchWeather(location.lat, location.lon, true);
  }, [location, fetchWeather]);

  const getTimeSinceUpdate = useCallback(() => {
    if (!lastUpdated) return null;
    const secondsAgo = Math.floor((Date.now() - lastUpdated) / 1000);
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    return `${Math.floor(minutesAgo / 60)}h ago`;
  }, [lastUpdated]);

  return {
    weatherData,
    lastUpdated,
    loading,
    error,
    fetchWeather,
    refreshWeather,
    isCacheValid: isCacheValid(),
    getTimeSinceUpdate,
  };
};
