import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const getUVColor = (uv) => {
  if (uv >= 8) return "#991B1B";
  if (uv >= 6) return "#EF4444";
  if (uv >= 3) return "#F59E0B";
  return "#10B981";
};

export const MapView = ({ latitude, longitude, uvIndex }) => {
  if (latitude == null || longitude == null) return null;

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden" data-testid="map-view">
     <MapContainer
  key={`${latitude}-${longitude}`}
  center={[latitude, longitude]}
  zoom={13}
  style={{ height: "100%", width: "100%", zIndex: 0 }}
>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          <Popup>
            <div className="text-center">
              <p className="font-semibold">Your Location</p>
              <p className="text-sm text-slate-600">Lat: {latitude.toFixed(4)}</p>
              <p className="text-sm text-slate-600">Lon: {longitude.toFixed(4)}</p>
              {uvIndex != null && <p className="text-sm font-semibold mt-2">UV Index: {uvIndex}</p>}
            </div>
          </Popup>
        </Marker>
        {uvIndex != null && (
          <Circle
            center={[latitude, longitude]}
            radius={1000}
            pathOptions={{ color: getUVColor(uvIndex), fillColor: getUVColor(uvIndex), fillOpacity: 0.2 }}
          />
        )}
      </MapContainer>
    </div>
  );
};
