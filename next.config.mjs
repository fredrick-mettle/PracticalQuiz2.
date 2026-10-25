/** @type {import('next').NextConfig} */
const nextConfig = {
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
