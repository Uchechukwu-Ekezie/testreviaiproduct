import { Metadata } from "next";
import { Suspense } from "react";
import HeroProperty from "@/components/hero-property";
import PropertyListing from "@/components/PropertyDisplay";
import { PropertySkeletonGrid } from "@/components/property-skeleton";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "AI Property Search | Find Smart Apartments & Houses",
  description:
    "Browse thousands of properties with AI-powered search. Find apartments, houses, and rental properties with intelligent filtering, automated booking, and smart recommendations. Discover your perfect home with ReviAI.",
  keywords: [
    "property search AI",
    "apartment finder",
    "house rental platform",
    "AI property listings",
    "smart apartment search",
    "rental property booking",
    "AI house finder",
    "intelligent property search",
    "apartment booking platform",
    "real estate listings AI",
    "property rental app",
    "automated property search",
    "smart home finder",
    "AI rental platform",
    "property booking system",
  ],
  alternates: {
    canonical: "/properties",
  },
  openGraph: {
    title: "AI Property Search | Find Smart Apartments & Houses",
    description:
      "Browse thousands of properties with AI-powered search. Find apartments, houses, and rental properties with intelligent filtering and smart recommendations.",
    url: `${siteConfig.url}/properties`,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "AI Property Search - ReviAI",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Property Search | Find Smart Apartments & Houses",
    description:
      "Browse thousands of properties with AI-powered search and intelligent recommendations.",
    images: [siteConfig.ogImage],
    creator: "@reviai_tech",
  },
};

export default function Page() {
  return (
    <main className="relative min-h-screen">
      {/* Background Video */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source
          src="https://res.cloudinary.com/dazur1hks/video/upload/o5qqgsanxtldkxluwd77.mp4?_s=vp-2.1.0"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen bg-black/60">
        <HeroProperty />
      </div>

      <div className="relative z-10 bg-[#0A0A0A]">
        <Suspense
          fallback={
            <div className="container mx-auto px-4 py-8">
              <PropertySkeletonGrid count={9} />
            </div>
          }
        >
          <PropertyListing />
        </Suspense>
      </div>
    </main>
  );
}
