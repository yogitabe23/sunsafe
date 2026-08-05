import React, { useState, useEffect } from "react";
import { RefreshCw, MapPin, AlertCircle, Clock } from "lucide-react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useWeatherCache } from "../hooks/useWeatherCache";
import { RecommendationCard } from "../components/RecommendationCard";
import { WeatherGrid } from "../components/WeatherCard";
import { MapView } from "../components/MapView";
import { UserProfileForm } from "../components/UserProfileForm";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";

export const Dashboard = () => {
  const { location: geoLocation, loading: geoLoading, error: geoError } = useGeolocation();
  const {
    weatherData,
    loading: weatherLoading,
    error: weatherError,
    fetchWeather,
    refreshWeather,
    getTimeSinceUpdate,
  } = useWeatherCache();

  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    if (!geoLocation || weatherData) return;

    fetchWeather(geoLocation.latitude, geoLocation.longitude)
      .then(() => toast.success("Weather data loaded successfully"))
      .catch((err) => toast.error(`Failed to load weather: ${err.message}`));
    // fetchWeather identity is now stable (see useWeatherCache), so this only
    // re-runs when geoLocation itself changes.
  }, [geoLocation, weatherData, fetchWeather]);

  const handleRefreshWeather = async () => {
    if (!geoLocation) {
      toast.error("Location not available");
      return;
    }
    try {
      await refreshWeather();
      toast.success("Weather data refreshed");
    } catch (err) {
      toast.error(`Failed to refresh: ${err.message}`);
    }
  };

  const handleGetPrediction = async (userProfile) => {
    if (!weatherData || !geoLocation) {
      toast.error("Weather data or location not available");
      return;
    }

    setPredicting(true);
    try {
      const response = await api.post("/predict", {
        weather: weatherData,
        user_profile: userProfile,
        latitude: geoLocation.latitude,
        longitude: geoLocation.longitude,
      });
      setPrediction(response.data);
      toast.success("Recommendation generated!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to get prediction"));
    } finally {
      setPredicting(false);
    }
  };

  if (geoLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="geo-loading">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Detecting your location...</p>
        </div>
      </div>
    );
  }

  if (geoError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4" data-testid="geo-error">
        <div className="neumorphic-card rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Location Access Required</h2>
          <p className="text-slate-600 mb-6">{geoError}</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700" data-testid="retry-location-btn">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="dashboard">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <MapPin className="w-4 h-4" />
          <span data-testid="location-display">
            {geoLocation ? `${geoLocation.latitude.toFixed(4)}, ${geoLocation.longitude.toFixed(4)}` : "Unknown"}
          </span>
          {weatherData && getTimeSinceUpdate() && (
            <>
              <span className="text-slate-400">•</span>
              <Clock className="w-4 h-4" />
              <span data-testid="last-updated">Updated {getTimeSinceUpdate()}</span>
            </>
          )}
        </div>

        <Button
          onClick={handleRefreshWeather}
          variant="outline"
          size="sm"
          disabled={weatherLoading}
          data-testid="refresh-weather-btn"
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${weatherLoading ? "animate-spin" : ""}`} />
          <span>Refresh Weather</span>
        </Button>
      </div>

      {weatherLoading && !weatherData && (
        <div className="text-center py-12" data-testid="weather-loading">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading weather data...</p>
        </div>
      )}

      {weatherError && !weatherData && (
        <div className="neumorphic-card rounded-2xl p-6 mb-6" data-testid="weather-error">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Weather Data Error</p>
              <p className="text-sm text-red-700">{weatherError}</p>
            </div>
            <Button onClick={handleRefreshWeather} variant="outline" size="sm" data-testid="retry-weather-btn">
              Retry
            </Button>
          </div>
        </div>
      )}

      {weatherData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RecommendationCard prediction={prediction} />
            <div className="col-span-1">
              <UserProfileForm onSubmit={handleGetPrediction} loading={predicting} />
            </div>
          </div>

          <div className="neumorphic-card rounded-2xl p-6">
            <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-4">
              Your Location & UV Coverage
            </h3>
            <div className="h-80">
              <MapView latitude={geoLocation?.latitude} longitude={geoLocation?.longitude} uvIndex={weatherData?.uv_index} />
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-4">
              Current Weather Conditions
            </h3>
            <WeatherGrid weatherData={weatherData} />
          </div>
        </div>
      )}
    </div>
  );
};
