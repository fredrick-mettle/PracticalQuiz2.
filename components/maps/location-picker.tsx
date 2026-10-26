"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  GHANA_CENTER,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  PIN_ICON_HTML,
} from "./map-utils";

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number | null, longitude: number | null) => void;
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

/**
 * Click-to-drop / draggable pin for the listing form (Phase 7).
 * Stays in sync both ways with the numeric latitude/longitude fields.
 */
export function LocationPicker({
  latitude,
  longitude,
  onChange,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  /** Create or move the pin WITHOUT firing onChange (sync/render path). */
  const placeMarker = useCallback((lat: number, lng: number) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      return;
    }
    markerRef.current = L.marker([lat, lng], {
      draggable: true,
      icon: L.divIcon({
        className: "",
        html: PIN_ICON_HTML,
        iconSize: [36, 44],
        iconAnchor: [18, 42],
      }),
    }).addTo(map);
    markerRef.current.on("dragend", () => {
      const pos = markerRef.current?.getLatLng();
      if (pos) onChangeRef.current(round6(pos.lat), round6(pos.lng));
    });
  }, []);

  // Initialise the map once.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;

      const hasPin = latitude != null && longitude != null;
      const map = L.map(containerRef.current).setView(
        hasPin ? [latitude, longitude] : GHANA_CENTER,
        hasPin ? 14 : 7
      );
      mapRef.current = map;
      L.tileLayer(OSM_TILE_URL, {
        attribution: OSM_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);

      if (hasPin) placeMarker(latitude, longitude);
      map.on("click", (event: import("leaflet").LeafletMouseEvent) => {
        placeMarker(event.latlng.lat, event.latlng.lng);
        onChangeRef.current(
          round6(event.latlng.lat),
          round6(event.latlng.lng)
        );
      });
      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Init only — later value changes are handled by the sync effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the pin in sync when the numeric fields change (or get cleared).
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    if (latitude == null || longitude == null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const current = markerRef.current?.getLatLng();
    if (
      !current ||
      round6(current.lat) !== round6(latitude) ||
      round6(current.lng) !== round6(longitude)
    ) {
      placeMarker(latitude, longitude);
      map.panTo([latitude, longitude]);
    }
  }, [latitude, longitude, ready, placeMarker]);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setGeoError(
        "Your browser doesn't support location — click the map to drop a pin."
      );
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const lat = round6(position.coords.latitude);
        const lng = round6(position.coords.longitude);
        placeMarker(lat, lng);
        mapRef.current?.setView([lat, lng], 15);
        onChange(lat, lng);
      },
      () => {
        setLocating(false);
        setGeoError(
          "Couldn't get your location — click the map to drop a pin instead."
        );
      },
      { timeout: 10_000 }
    );
  }

  function clearPin() {
    markerRef.current?.remove();
    markerRef.current = null;
    onChange(null, null);
  }

  const hasPin = latitude != null && longitude != null;

  return (
    <div>
      <div
        ref={containerRef}
        role="application"
        aria-label="Pick the property location on the map"
        className="z-0 h-72 w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-100"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {locating ? "Locating…" : "📍 Use my current location"}
        </button>
        {hasPin && (
          <button
            type="button"
            onClick={clearPin}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            Clear pin
          </button>
        )}
        <span className="text-xs text-slate-500">
          {hasPin
            ? `Pin: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} — drag it to adjust.`
            : "Click anywhere on the map to drop a pin at the property."}
        </span>
      </div>
      {geoError && <p className="mt-1.5 text-xs text-red-700">{geoError}</p>}
    </div>
  );
}
