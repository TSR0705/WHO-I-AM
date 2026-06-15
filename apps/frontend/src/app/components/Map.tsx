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
      }).setView([lat, lon], 14);

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
      mapInstanceRef.current.setView([lat, lon], 14);
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
      <style>{`
        /* Make dark tile map elements (roads, text) pop with high contrast */
        .leaflet-tile-pane {
          filter: brightness(1.6) contrast(1.2) saturate(1.4);
        }
        /* Style Leaflet Zoom Control for Premium Cyber Dark Mode */
        .leaflet-bar {
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
        }
        .leaflet-bar a {
          background-color: rgba(8, 12, 20, 0.95) !important;
          color: rgba(255, 255, 255, 0.8) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          transition: all 0.2s ease;
        }
        .leaflet-bar a:hover {
          background-color: var(--primary) !important;
          color: #000 !important;
        }
        /* Style Popup container */
        .leaflet-popup-content-wrapper {
          background: rgba(8, 12, 20, 0.95) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(12px) !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6) !important;
        }
        .leaflet-popup-tip {
          background: rgba(8, 12, 20, 0.95) !important;
          border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .leaflet-popup-content {
          font-family: var(--font-sans), sans-serif !important;
          font-size: 11px !important;
          font-weight: 500 !important;
          margin: 12px 16px !important;
          color: rgba(255, 255, 255, 0.9) !important;
        }
        .leaflet-popup-close-button {
          color: rgba(255, 255, 255, 0.4) !important;
          padding: 8px !important;
        }
        .leaflet-popup-close-button:hover {
          color: var(--primary) !important;
        }
      `}</style>
      <div ref={mapRef} className="w-full h-full z-10" />
    </div>
  );
}
