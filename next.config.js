/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites(){
    return [
      {
        source: '/api/:id',
        destination: '/chats/:id*',
      },
    ]
  },


  images:{
    domains: ["res.cloudinary.com", "lh3.googleusercontent.com"],
  },
  // Add this to suppress hydration warnings related to browser extensions
  onDemandEntries: {
    // Makes Next.js more tolerant of browser extensions that modify the DOM
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },


}

module.exports = nextConfig 