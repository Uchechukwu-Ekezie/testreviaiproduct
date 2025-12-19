"use client";

import Script from "next/script";

export interface OrganizationSchema {
  name: string;
  url: string;
  logo: string;
  description: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  contactPoint?: {
    telephone: string;
    contactType: string;
    email?: string;
  };
  sameAs?: string[];
}

export interface WebsiteSchema {
  name: string;
  url: string;
  description: string;
  publisher: {
    name: string;
    logo: string;
  };
}

export interface PropertySchema {
  name: string;
  description: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  price?: {
    value: number;
    currency: string;
  };
  propertyType?: string;
  numberOfRooms?: number;
  floorSize?: {
    value: number;
    unitCode: string;
  };
  images?: string[];
}

export interface ArticleSchema {
  headline: string;
  description: string;
  image: string;
  author: {
    name: string;
    url?: string;
  };
  publisher: {
    name: string;
    logo: string;
  };
  datePublished: string;
  dateModified?: string;
  url: string;
}

interface StructuredDataProps {
  organization?: OrganizationSchema;
  website?: WebsiteSchema;
  property?: PropertySchema;
  article?: ArticleSchema;
}

export default function StructuredData({
  organization,
  website,
  property,
  article,
}: StructuredDataProps) {
  const generateOrganizationSchema = (org: OrganizationSchema) => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    url: org.url,
    logo: {
      "@type": "ImageObject",
      url: org.logo,
    },
    description: org.description,
    ...(org.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: org.address.streetAddress,
        addressLocality: org.address.addressLocality,
        addressRegion: org.address.addressRegion,
        postalCode: org.address.postalCode,
        addressCountry: org.address.addressCountry,
      },
    }),
    ...(org.contactPoint && {
      contactPoint: {
        "@type": "ContactPoint",
        telephone: org.contactPoint.telephone,
        contactType: org.contactPoint.contactType,
        ...(org.contactPoint.email && { email: org.contactPoint.email }),
      },
    }),
    ...(org.sameAs && { sameAs: org.sameAs }),
  });

  const generateWebsiteSchema = (site: WebsiteSchema) => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    description: site.description,
    publisher: {
      "@type": "Organization",
      name: site.publisher.name,
      logo: {
        "@type": "ImageObject",
        url: site.publisher.logo,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  });

  const generatePropertySchema = (prop: PropertySchema) => ({
    "@context": "https://schema.org",
    "@type": "Accommodation", // or "RealEstateListing"
    name: prop.name,
    description: prop.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: prop.address.streetAddress,
      addressLocality: prop.address.addressLocality,
      addressRegion: prop.address.addressRegion,
      postalCode: prop.address.postalCode,
      addressCountry: prop.address.addressCountry,
    },
    ...(prop.geo && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: prop.geo.latitude,
        longitude: prop.geo.longitude,
      },
    }),
    ...(prop.price && {
      priceRange: `${prop.price.currency}${prop.price.value}`,
    }),
    ...(prop.propertyType && { accommodationType: prop.propertyType }),
    ...(prop.numberOfRooms && { numberOfRooms: prop.numberOfRooms }),
    ...(prop.floorSize && {
      floorSize: {
        "@type": "QuantitativeValue",
        value: prop.floorSize.value,
        unitCode: prop.floorSize.unitCode,
      },
    }),
    ...(prop.images && {
      image: prop.images.map((img) => ({
        "@type": "ImageObject",
        url: img,
      })),
    }),
  });

  const generateArticleSchema = (art: ArticleSchema) => ({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: art.headline,
    description: art.description,
    image: {
      "@type": "ImageObject",
      url: art.image,
    },
    author: {
      "@type": "Person",
      name: art.author.name,
      ...(art.author.url && { url: art.author.url }),
    },
    publisher: {
      "@type": "Organization",
      name: art.publisher.name,
      logo: {
        "@type": "ImageObject",
        url: art.publisher.logo,
      },
    },
    datePublished: art.datePublished,
    ...(art.dateModified && { dateModified: art.dateModified }),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": art.url,
    },
  });

  const schemas = [];

  if (organization) {
    schemas.push(generateOrganizationSchema(organization));
  }

  if (website) {
    schemas.push(generateWebsiteSchema(website));
  }

  if (property) {
    schemas.push(generatePropertySchema(property));
  }

  if (article) {
    schemas.push(generateArticleSchema(article));
  }

  if (schemas.length === 0) return null;

  return (
    <>
      {schemas.map((schema, index) => (
        <Script
          key={index}
          id={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}
    </>
  );
}
