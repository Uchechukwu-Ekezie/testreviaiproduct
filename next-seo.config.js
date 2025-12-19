/** @type {import('next-seo').DefaultSeoProps} */
const defaultSEOConfig = {
  title: 'Revi.ai - AI-Powered Real Estate Platform',
  description: 'Transform your real estate experience with AI-powered insights, property search, landlord verification, and personalized recommendations.',
  canonical: 'https://www.reviai.ai',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.reviai.ai',
    siteName: 'Revi.ai',
    title: 'Revi.ai - AI-Powered Real Estate Platform',
    description: 'Transform your real estate experience with AI-powered insights, property search, landlord verification, and personalized recommendations.',
    images: [
      {
        url: 'https://www.reviai.ai/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Revi.ai - AI-Powered Real Estate Platform',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    handle: '@reviai',
    site: '@reviai',
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'keywords',
      content: 'real estate, AI, property search, landlord verification, rental, buying, selling, property management, real estate insights',
    },
    {
      name: 'author',
      content: 'Revi.ai',
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    {
      name: 'theme-color',
      content: '#000000',
    },
    {
      httpEquiv: 'x-ua-compatible',
      content: 'IE=edge',
    },
  ],
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon.png',
      sizes: '180x180',
    },
    {
      rel: 'manifest',
      href: '/manifest.json',
    },
  ],
}

export default defaultSEOConfig
