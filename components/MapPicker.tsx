"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L, { type LatLngExpression, type LeafletEvent, type LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: LatLngExpression = [-25.2744, 133.7751]; // Australia
const DEFAULT_ZOOM = 4;
const TARGET_ZOOM = 17;

export interface MapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onLocationChange: (coords: { lat: number; lng: number }) => void;
}

export default function MapPicker({ latitude, longitude, onLocationChange }: MapPickerProps) {
  const markerPosition = useMemo(() => {
    if (typeof latitude === "number" && typeof longitude === "number") {
      return [latitude, longitude] as LatLngExpression;
    }
    return null;
  }, [latitude, longitude]);

  const markerIcon = useMemo(() => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
        <path fill="#ea580c" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="3" fill="#fff" />
      </svg>
    `;
    return L.icon({
      iconUrl: `data:image/svg+xml,${encodeURIComponent(svg)}`,
      iconSize: [32, 32],
      iconAnchor: [16, 30],
      popupAnchor: [0, -28],
    });
  }, []);

  function ClickCapture() {
    useMapEvents({
      click(event: LeafletMouseEvent) {
        onLocationChange({ lat: event.latlng.lat, lng: event.latlng.lng });
      },
    });
    return null;
  }

  function ViewUpdater() {
    const map = useMap();
    useEffect(() => {
      if (markerPosition) {
        map.flyTo(markerPosition, TARGET_ZOOM, { duration: 0.3 });
      }
    }, [markerPosition, map]);
    return null;
  }

  return (
    <div className="space-y-2">
      <MapContainer
        center={(markerPosition as LatLngExpression) || DEFAULT_CENTER}
        zoom={markerPosition ? TARGET_ZOOM : DEFAULT_ZOOM}
        scrollWheelZoom
        className="h-80 w-full overflow-hidden rounded-lg border border-input shadow-sm"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ClickCapture />
        {markerPosition && (
          <>
            <Marker
              position={markerPosition}
              draggable
              icon={markerIcon}
              eventHandlers={{
                dragend(event: LeafletEvent) {
                  const marker = event.target as L.Marker;
                  const { lat, lng } = marker.getLatLng();
                  onLocationChange({ lat, lng });
                },
              }}
            />
            <ViewUpdater />
          </>
        )}
      </MapContainer>
      <p className="text-xs text-neutral-dark">Click anywhere on the map or drag the marker to fine-tune the location.</p>
    </div>
  );
}
