/** Shared Leaflet/OpenStreetMap constants & helpers (Phase 7). */

export const GHANA_CENTER: [number, number] = [7.9465, -1.0232];

export const OSM_TILE_URL =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

/** Escape user content before embedding it in Leaflet popup/icon HTML. */
export function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (char) => entities[char]);
}

/**
 * Teardrop pin drawn with pure CSS (avoids Leaflet's default marker
 * image assets, which bundlers routinely break).
 */
export const PIN_ICON_HTML = `
<div style="position:relative;width:36px;height:44px;">
  <div style="position:absolute;left:50%;top:2px;width:26px;height:26px;margin-left:-13px;background:#047857;border:2px solid #ffffff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>
  <div style="position:absolute;left:50%;top:10px;width:10px;height:10px;margin-left:-5px;background:#ffffff;border-radius:50%;"></div>
</div>`;
