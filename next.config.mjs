/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev-only: allow the cloud preview proxy origin to reach the dev server.
  allowedDevOrigins: ["*.e2b.app"],
  images: {
    remotePatterns: [
      // Seed placeholder photos
      { protocol: "https", hostname: "images.unsplash.com" },
      // User-uploaded property photos (Phase 4)
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
