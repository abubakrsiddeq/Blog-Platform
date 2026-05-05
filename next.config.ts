import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next.js 16: qualities must be explicitly configured (default is [75] only)
    qualities: [75, 100],
    // Allow external image URLs (used by post cover images stored in Cloudinary or elsewhere)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
