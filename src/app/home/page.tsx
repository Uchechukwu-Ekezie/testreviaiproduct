import { Metadata } from "next";
import HeroSection from "@/components/hero-section";
import NewsletterSection from "@/components/newletter";
// import ExperienceForm from "@/componenty ms/shareyourexperience";
import TestimonialsSection from "@/components/testimoialsSectio";
import WhatWeDo from "@/components/what-we-do";
import Whychooseus from "@/components/whychooseus";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "AI-Powered Real Estate Platform | Smart Property Booking & Reviews",
  description:
    "Transform your property search with ReviAI's AI technology. Find, book, and review apartments using intelligent insights, automated booking systems, and smart home recommendations. Discover the future of real estate.",
  keywords: [
    "AI real estate platform",
    "smart property booking",
    "AI apartment search",
    "intelligent housing platform",
    "automated property booking",
    "AI property recommendations",
    "smart home finder",
    "real estate AI technology",
    "property booking app",
    "AI housing marketplace",
    "intelligent property search",
    "automated real estate platform",
    "smart apartment booking",
    "AI-powered property insights",
    "real estate automation",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AI-Powered Real Estate Platform | Smart Property Booking & Reviews",
    description:
      "Transform your property search with ReviAI's AI technology. Find, book, and review apartments using intelligent insights, automated booking systems, and smart home recommendations.",
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "ReviAI - AI-Powered Real Estate Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-Powered Real Estate Platform | Smart Property Booking & Reviews",
    description:
      "Transform your property search with ReviAI's AI technology. Discover intelligent property insights and automated booking systems.",
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
        <HeroSection />
      </div>

      <div className="relative z-10 bg-[#0A0A0A]">
        <Whychooseus />
        <WhatWeDo />
        {/* <ExperienceForm /> */}
        <TestimonialsSection />
        {/* <NewsletterSection /> */}
      </div>
    </main>
  );
}
