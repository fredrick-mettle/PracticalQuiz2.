/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev-only: allow the cloud preview proxy origin to reach the dev server.
  allowedDevOrigins: ["*.e2b.app"],
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
