import { Metadata } from "next";
import SEOTestClient from "./seo-test-client";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: "SEO Test - REVIAI",
  description:
    "Test page for SEO implementation, Facebook Pixel, and Google Analytics integration",
  keywords: "SEO, Facebook Pixel, Google Analytics, REVIAI, testing",
  openGraph: {
    title: "SEO Test - REVIAI",
    description:
      "Test page for SEO implementation, Facebook Pixel, and Google Analytics integration",
    type: "website",
    siteName: "REVIAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "SEO Test - REVIAI",
    description:
      "Test page for SEO implementation, Facebook Pixel, and Google Analytics integration",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SEOTestPage() {
  return <SEOTestClient />;
}
