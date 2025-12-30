import { Metadata } from "next";
import { siteConfig } from "./site-config";

interface GenerateMetadataProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
  canonical?: string;
  type?: "website" | "article" | "profile";
}

/**
 * Generate metadata for pages using Next.js 13+ Metadata API
 * This function creates comprehensive metadata including OpenGraph and Twitter cards
 */
export function generatePageMetadata({
  title,
  description = siteConfig.description,
  keywords = siteConfig.keywords.slice(0, 10), // Limit keywords for better SEO
  image = siteConfig.ogImage,
  noIndex = false,
  canonical,
  type = "website",
}: GenerateMetadataProps = {}): Metadata {
  const metaTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title;
  const metaImage = image.startsWith("http")
    ? image
    : `${siteConfig.url}${image}`;
  const canonicalUrl = canonical
    ? `${siteConfig.url}${canonical}`
    : siteConfig.url;

  return {
    title: metaTitle,
    description,
    keywords,
    authors: [{ name: "ReviAI Technologies" }],
    creator: "ReviAI Technologies",
    publisher: "ReviAI Technologies",
    applicationName: siteConfig.name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: canonical || "/",
    },
    openGraph: {
      title: metaTitle,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      images: [
        {
          url: metaImage,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
      locale: "en_US",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description,
      images: [metaImage],
      creator: "@ReviAiTech",
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

/**
 * Generate structured data for Organization
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ReviAI Technologies",
    url: siteConfig.url,
    logo: `${siteConfig.url}${siteConfig.ogImage}`,
    description: siteConfig.description,
    foundingDate: "2024",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-XXX-XXX-XXXX",
      contactType: "customer service",
      availableLanguage: "English",
    },
    sameAs: [
      siteConfig.links.instagram,
      siteConfig.links.twitter,
      siteConfig.links.tiktok,
    ],
  };
}

/**
 * Generate structured data for Website
 */
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/properties?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate structured data for Real Estate Service
 */
export function generateServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "AI-Powered Real Estate Platform",
    provider: {
      "@type": "Organization",
      name: "ReviAI Technologies",
    },
    description:
      "Intelligent property search, booking, and review platform powered by artificial intelligence",
    serviceType: "Real Estate Technology",
    areaServed: "Global",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Property Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "AI Property Search",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Automated Property Booking",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "AI Property Reviews",
          },
        },
      ],
    },
  };
}

/**
 * Generate structured data for a Property listing
 * Use this for individual property pages
 */
export function generatePropertySchema(property: {
  name: string;
  description: string;
  address: string;
  price: number;
  currency: string;
  images: string[];
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.name,
    description: property.description,
    url: `${siteConfig.url}/properties/${property.name
      .toLowerCase()
      .replace(/\s+/g, "-")}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
    },
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: property.currency,
      availability: "https://schema.org/InStock",
    },
    image: property.images,
    ...(property.bedrooms && { numberOfBedrooms: property.bedrooms }),
    ...(property.bathrooms && { numberOfBathroomsTotal: property.bathrooms }),
    ...(property.area && {
      floorSize: {
        "@type": "QuantitativeValue",
        value: property.area,
        unitCode: "SQM",
      },
    }),
  };
}
