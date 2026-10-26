const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy (Phase 11). Whitelists exactly what the app
 * loads: our own origin, Unsplash (seed photos), Cloudinary (uploads +
 * user photos) and OpenStreetMap tiles (Leaflet).
 *
 * `script-src 'unsafe-inline'` is required by Next.js's inline flight
 * scripts (nonce-based CSP is a documented future hardening), and dev
 * additionally needs 'unsafe-eval' + websockets for HMR.
 * Frame-ancestors/X-Frame-Options are production-only so the cloud dev
 * preview (iframe-embedded) keeps working while developing.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://res.cloudinary.com https://*.tile.openstreetmap.org",
  "font-src 'self' data:",
  `connect-src 'self' https://api.cloudinary.com${isDev ? " ws: wss:" : ""}`,
  ...(isDev ? [] : ["frame-ancestors 'none'"]),
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  ...(isDev
    ? []
    : [
        { key: "X-Frame-Options", value: "DENY" },
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev-only: allow the cloud preview proxy origin to reach the dev server.
  allowedDevOrigins: ["*.e2b.app"],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    // Dev sandboxes without outbound internet can't run the image
    // optimizer's server-side fetch. Set NEXT_IMAGE_UNOPTIMIZED=1 there
    // so browsers load images directly. Leave unset in production.
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === "1",
    remotePatterns: [
      // Seed placeholder photos
      { protocol: "https", hostname: "images.unsplash.com" },
      // User-uploaded property photos (Phase 4)
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
