"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { formatGHS, pricePeriodSuffix } from "@/lib/utils";
import type { PropertyMapPin } from "@/lib/services/public-properties";
import {
  GHANA_CENTER,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  escapeHtml,
} from "./map-utils";

/** Price-pill marker, centered above the exact point. */
function pricePillHtml(price: number): string {
  return `<div style="transform:translate(-50%,-110%);background:#047857;color:#ffffff;font:600 12px/1 system-ui,sans-serif;padding:7px 9px;border-radius:999px;border:2px solid #ffffff;box-shadow:0 1px 5px rgba(0,0,0,0.4);white-space:nowrap;cursor:pointer;">${escapeHtml(
    formatGHS(price)
  )}</div>`;
}

function popupHtml(pin: PropertyMapPin): string {
  const cover = pin.images[0]?.url;
  const where = `${pin.area ? `${pin.area}, ` : ""}${pin.city}`;
  return `
<div style="min-width:200px;max-width:230px;font-family:system-ui,sans-serif;">
  ${
    cover
      ? `<img src="${escapeHtml(cover)}" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />`
      : ""
  }
  <p style="margin:0;font-size:16px;font-weight:700;color:#065f46;">
    ${escapeHtml(formatGHS(pin.price))}<span style="font-size:12px;font-weight:400;color:#64748b;">${escapeHtml(
      pricePeriodSuffix(pin.pricePeriod)
    )}</span>
  </p>
  <p style="margin:4px 0 2px;font-size:13px;font-weight:600;color:#0f172a;line-height:1.35;">${escapeHtml(
    pin.title
  )}</p>
  <p style="margin:0 0 8px;font-size:12px;color:#64748b;">${escapeHtml(where)}</p>
  <a href="/properties/${encodeURIComponent(pin.id)}" style="font-size:13px;font-weight:600;color:#047857;text-decoration:none;">View details →</a>
</div>`;
}

/**
 * Search-results map (Phase 7): one price pill per listing with a popup
 * card. Leaflet loads inside the effect (browser-only).
 */
export function PropertiesMap({ pins }: { pins: PropertyMapPin[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | null = null;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current).setView(GHANA_CENTER, 7);
      L.tileLayer(OSM_TILE_URL, {
        attribution: OSM_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);

      for (const pin of pins) {
        const icon = L.divIcon({ className: "", html: pricePillHtml(pin.price) });
        L.marker([pin.latitude, pin.longitude], { icon })
          .addTo(map)
          .bindPopup(popupHtml(pin));
      }

      if (pins.length === 1) {
        map.setView([pins[0].latitude, pins[0].longitude], 13);
      } else if (pins.length > 1) {
        const bounds = L.latLngBounds(
          pins.map((p) => [p.latitude, p.longitude] as [number, number])
        );
        map.fitBounds(bounds.pad(0.08));
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [pins]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Map of matching properties"
      className="z-0 h-[480px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm sm:h-[560px]"
    />
  );
}
