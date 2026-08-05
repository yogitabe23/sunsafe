import React from "react";
import { Thermometer, Droplets, Wind, Gauge, Eye, Cloud, Sun } from "lucide-react";

const WEATHER_METRICS = [
  { key: "temperature", label: "Temperature", icon: Thermometer, unit: "\u00b0C", color: "text-orange-600" },
  { key: "humidity", label: "Humidity", icon: Droplets, unit: "%", color: "text-blue-600" },
  { key: "wind_speed", label: "Wind Speed", icon: Wind, unit: "km/h", color: "text-slate-600" },
  { key: "pressure", label: "Pressure", icon: Gauge, unit: "hPa", color: "text-purple-600" },
  { key: "uv_index", label: "UV Index", icon: Sun, unit: "", color: "text-amber-600" },
  { key: "visibility", label: "Visibility", icon: Eye, unit: "km", color: "text-teal-600" },
  { key: "cloud_cover", label: "Cloud Cover", icon: Cloud, unit: "%", color: "text-gray-600" },
];

const METRIC_MAP = new Map(WEATHER_METRICS.map((m) => [m.key, m]));

export const WeatherCard = ({ metric, value }) => {
  const config = METRIC_MAP.get(metric);
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className="neumorphic-card rounded-2xl p-6 transition-transform hover:-translate-y-1 hover:shadow-lg"
      data-testid={`weather-card-${metric}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-2">
            {config.label}
          </p>
          <p className="text-3xl font-bold text-slate-800">
            {value}
            <span className="text-lg text-slate-500 ml-1">{config.unit}</span>
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center ${config.color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export const WeatherGrid = ({ weatherData }) => {
  if (!weatherData) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {WEATHER_METRICS.map((metric) => (
        <WeatherCard key={metric.key} metric={metric.key} value={weatherData[metric.key]} />
      ))}
    </div>
  );
};
