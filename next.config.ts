import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images: {
    domains: [
      "hebbkx1anhila5yf.public.blob.vercel-storage.com",
      "cdn-images-1.medium.com",
      "res.cloudinary.com",
      "pictures-nigeria.jijistatic.net",
      "backend.reviai.ai",
    ],
  },
  remotePatterns: [
    {
      protocol: "https",
      hostname: "cdn-images-1.medium.com",
    },
    {
      protocol: "https",
      hostname: "res.cloudinary.com",
    },
    {
      protocol: "https",
      hostname: "pictures-nigeria.jijistatic.net",
    },
    {
      protocol: "https",
      hostname: "backend.reviai.ai",
    },
  ],

    eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
