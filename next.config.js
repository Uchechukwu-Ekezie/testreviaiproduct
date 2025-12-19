/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: '/api/:id',
        destination: '/chats/:id*',
      },
    ];
  },

  images: {
    remotePatterns: [
      // ----- YOUR ORIGINAL LIST -----
      { protocol: "https", hostname: "cdn-images-1.medium.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "pictures-nigeria.jijistatic.net" },
      { protocol: "https", hostname: "backend.reviai.ai" },
      { protocol: "https", hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "http",  hostname: "localhost" },
      { protocol: "https", hostname: "localhost" },
      { protocol: "https", hostname: "images.nigeriapropertycentre.com" },
      // ----- NEW WILDCARD -----
      {
        protocol: "https",
        hostname: "**",               // <-- accepts ANY hostname
      },
      {
        protocol: "http",
        hostname: "**",               // <-- also accept http (dev only)
      },
    ],
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;