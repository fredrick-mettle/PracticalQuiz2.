"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import {
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  PIN_ICON_HTML,
  escapeHtml,
} from "./map-utils";

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  label: string;
}

/**
 * Single-property map for the detail page (Phase 7). Leaflet is imported
 * inside the effect so it never evaluates during SSR. Scroll-zoom stays
 * off until the map is clicked, so it never traps page scrolling.
 */
export function PropertyMap({ latitude, longitude, label }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | null = null;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
        [latitude, longitude],
        14
      );
      L.tileLayer(OSM_TILE_URL, {
        attribution: OSM_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: PIN_ICON_HTML,
        iconSize: [36, 44],
        iconAnchor: [18, 42],
      });
      L.marker([latitude, longitude], { icon })
        .addTo(map)
        .bindPopup(escapeHtml(label));

      map.on("click", () => map?.scrollWheelZoom.enable());
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [latitude, longitude, label]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`Map showing the location of ${label}`}
      className="z-0 h-72 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:h-80"
    />
  );
}
