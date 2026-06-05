"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  lat: number;
  lon: number;
  label: string;
}

export default function Map({ lat, lon, label }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize Leaflet map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([lat, lon], 12);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(mapInstanceRef.current);

      // Fix default marker icon issues in Leaflet (Webpack/build path issues)
      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      });
      L.Marker.prototype.options.icon = DefaultIcon;

      markerInstanceRef.current = L.marker([lat, lon]).addTo(mapInstanceRef.current);
      markerInstanceRef.current.bindPopup(`<strong>${label}</strong>`).openPopup();
    } else {
      mapInstanceRef.current.setView([lat, lon], 12);
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([lat, lon]);
        markerInstanceRef.current.setPopupContent(`<strong>${label}</strong>`);
      }
    }

    // Force redraw to align tile seams
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      // Clean up on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, [lat, lon, label]);

  return (
    <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-zinc-800/60 shadow-inner">
      <div ref={mapRef} className="w-full h-full z-10" />
    </div>
  );
}
