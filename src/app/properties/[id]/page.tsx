import * as React from "react";
import type { Metadata } from "next";
import { propertiesAPI } from "@/lib/api";
import { siteConfig } from "@/lib/site-config";
import PropertyDetailClient from "./PropertyDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Helper function to generate consistent title and description
function generatePropertyMetadata(property: any) {
  const title = `${property.title} - ${property.address}`;
  const description =
    property.ai_refined_description ||
    property.description ||
    `View detailed information about ${property.title} located at ${property.address}. Find property specifications, reviews, and booking information.`;

  const images = [];
  if (property.image_url) {
    images.push(property.image_url);
  }
  if (property.image_urls && Array.isArray(property.image_urls)) {
    images.push(
      ...property.image_urls.map((img: any) => img.url).filter(Boolean)
    );
  }

  return { title, description, images };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const propertyId = decodeURIComponent(resolvedParams.id);

  try {
    const property = (await propertiesAPI.getById(propertyId)) as any;

    if (!property) {
      return {
        title: "Property Not Found | ReviAI",
        description: "The requested property could not be found.",
        robots: "noindex,nofollow",
      };
    }

    const { title, description, images } = generatePropertyMetadata(property);

    // Generate property-specific keywords
    const propertyKeywords = [
      property.title?.toLowerCase().replace(/[^a-z0-9\s]/gi, ""),
      property.address?.toLowerCase(),
      property.city?.toLowerCase(),
      property.state?.toLowerCase(),
      property.property_type?.toLowerCase(),
      `${property.bedrooms} bedroom`,
      `${property.bathrooms} bathroom`,
      property.status?.toLowerCase(),
      `${property.price?.toLowerCase()} property`,
      "real estate Nigeria",
      "property rental Nigeria",
      "apartment booking",
      "house rental",
      "property reviews",
    ].filter(Boolean);

    return {
      title,
      description: description.slice(0, 160), // Optimal length for search results
      keywords: propertyKeywords.join(", "),
      authors: [{ name: "ReviAI Technologies" }],
      openGraph: {
        title,
        description: description.slice(0, 160),
        url: `${siteConfig.url}/properties/${propertyId}`,
        siteName: siteConfig.name,
        images: images.slice(0, 4).map((imageUrl) => ({
          url: imageUrl.startsWith("http")
            ? imageUrl
            : `${siteConfig.url}${imageUrl}`,
          width: 1200,
          height: 630,
          alt: `${property.title} - Property Image`,
        })),
        locale: "en_US",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: title.slice(0, 70), // Twitter title limit
        description: description.slice(0, 200), // Twitter description limit
        creator: "@ReviAiTech",
        images: images
          .slice(0, 1)
          .map((imageUrl) =>
            imageUrl.startsWith("http")
              ? imageUrl
              : `${siteConfig.url}${imageUrl}`
          ),
      },
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
      alternates: {
        canonical: `${siteConfig.url}/properties/${propertyId}`,
      },
      other: {
        "property:id": property.id,
        "property:type": property.property_type || "",
        "property:price": property.price || "",
        "property:bedrooms": property.bedrooms || "",
        "property:bathrooms": property.bathrooms || "",
        "property:location": property.address || "",
        "property:status": property.status || "",
      },
    };
  } catch (error) {
    console.error("Error generating metadata for property:", propertyId, error);

    return {
      title: "Property Details | ReviAI",
      description:
        "View detailed property information with AI-powered insights and smart recommendations.",
      robots: "noindex,nofollow",
    };
  }
}

export default async function PropertyPage({ params }: PageProps) {
  const resolvedParams = await params;
  const propertyId = decodeURIComponent(resolvedParams.id);

  // Generate structured data for the property
  let structuredData = null;
  try {
    const property = (await propertiesAPI.getById(propertyId)) as any;

    if (property) {
      // Use the same helper function to ensure consistency with metadata
      const { title, description, images } = generatePropertyMetadata(property);

      // Generating structured data for property

      structuredData = {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        "@id": `${siteConfig.url}/properties/${propertyId}#property`,
        name: title, // Now matches the metadata title: "Property Title - Address"
        description: description.slice(0, 160), // Matches metadata description length
        url: `${siteConfig.url}/properties/${propertyId}`,
        image: images
          .slice(0, 5)
          .map((img) =>
            img.startsWith("http") ? img : `${siteConfig.url}${img}`
          ),
        address: {
          "@type": "PostalAddress",
          streetAddress: property.address,
          addressLocality: property.city,
          addressRegion: property.state,
          addressCountry: "NG",
        },
        offers: {
          "@type": "Offer",
          price: property.price?.replace(/[^\d]/g, "") || "0",
          priceCurrency: "NGN",
          availability:
            property.status === "for_rent"
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          priceSpecification: {
            "@type": "PriceSpecification",
            price: property.price?.replace(/[^\d]/g, "") || "0",
            priceCurrency: "NGN",
          },
        },
        numberOfRooms: property.bedrooms
          ? parseInt(property.bedrooms)
          : undefined,
        numberOfBathroomsTotal: property.bathrooms
          ? parseInt(property.bathrooms)
          : undefined,
        // Additional dynamic property information
        ...(property.property_type && {
          additionalType: `https://schema.org/${property.property_type.replace(
            /\s+/g,
            ""
          )}`,
        }),
        ...(property.status && {
          availability:
            property.status === "for_rent"
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        }),
        floorSize:
          property.size || property.square_footage
            ? {
                "@type": "QuantitativeValue",
                value: property.size || property.square_footage,
                unitText: property.size ? "square meters" : "square feet",
              }
            : undefined,
        datePosted: property.created_at,
        dateModified: property.updated_at,
        // Dynamic amenities from property data
        ...(property.amenities && {
          amenityFeature: Object.entries(property.amenities)
            .filter(([key, value]) => Array.isArray(value) && value.length > 0)
            .flatMap(([category, features]) =>
              (features as string[]).map((feature) => ({
                "@type": "LocationFeatureSpecification",
                name: feature,
                category: category,
              }))
            ),
        }),
        aggregateRating: property.rental_grade
          ? {
              "@type": "AggregateRating",
              ratingValue: property.rental_grade,
              bestRating: 5,
              worstRating: 1,
              reviewCount: property.reviews?.length || 0,
            }
          : undefined,
        review:
          property.reviews?.map((review: any) => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: review.rating,
              bestRating: 5,
              worstRating: 1,
            },
            author: {
              "@type": "Person",
              name: review.user?.name || review.username || "Anonymous",
            },
            reviewBody: review.comment || review.review_text,
            datePublished: review.created_at || review.date,
          })) || [],
      };
    }
  } catch (error) {
    console.error(
      "Error generating structured data for property:",
      propertyId,
      error
    );
  }

  return (
    <>
      {structuredData && (
        <>
          {/* Primary property-specific structured data */}
          <script
            id={`property-structured-data-${propertyId}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData, null, 2),
            }}
          />
          {/* Property-specific WebPage schema */}
          <script
            id={`property-webpage-${propertyId}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                {
                  "@context": "https://schema.org",
                  "@type": "WebPage",
                  name: structuredData.name,
                  url: structuredData.url,
                  description: structuredData.description,
                  mainEntity: {
                    "@id": structuredData.url + "#property",
                  },
                  breadcrumb: {
                    "@type": "BreadcrumbList",
                    itemListElement: [
                      {
                        "@type": "ListItem",
                        position: 1,
                        name: "Properties",
                        item: `${siteConfig.url}/properties`,
                      },
                      {
                        "@type": "ListItem",
                        position: 2,
                        name: structuredData.name,
                        item: structuredData.url,
                      },
                    ],
                  },
                },
                null,
                2
              ),
            }}
          />
        </>
      )}
      <PropertyDetailClient propertyId={propertyId} />
    </>
  );
}
