// app/metadata.ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Revi.ai - Your AI-Powered Real Estate Assistant",
    template: "%s | Revi.ai",
  },
  description:
    "Transform your real estate experience with Revi.ai. Get instant property insights, market analysis, and personalized recommendations powered by advanced AI technology.",
  keywords: [
    "real estate",
    "AI assistant",
    "property search",
    "market analysis",
    "property management",
    "real estate technology",
    "property insights",
    "revi.ai",
  ],
  authors: [{ name: "Revi.ai Team" }],
  creator: "Revi.ai",
  publisher: "Revi.ai",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/reviloo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/reviloo.svg" }],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://revi.ai",
    siteName: "Revi.ai",
    title: "Revi.ai - Your AI-Powered Real Estate Assistant",
    description:
      "Transform your real estate experience with Revi.ai. Get instant property insights, market analysis, and personalized recommendations powered by advanced AI technology.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Revi.ai - AI-Powered Real Estate Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Revi.ai - Your AI-Powered Real Estate Assistant",
    description:
      "Transform your real estate experience with Revi.ai. Get instant property insights, market analysis, and personalized recommendations powered by advanced AI technology.",
    images: ["/images/twitter-image.jpg"],
    creator: "@ReviAiTech",
    site: "@ReviAiTech",
  },
  alternates: { canonical: "https://revi.ai" },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
  },
};