import { propertiesAPI } from "./api";
import { siteConfig } from "./site-config";
import { Property } from "@/contexts/properties-context";

export interface SitemapUrl {
  url: string;
  lastModified?: Date;
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
}

export interface PropertySitemapData {
  url: string;
  lastModified: string;
  title: string;
  images: string[];
}

/**
 * Fetch all properties for sitemap generation with pagination
 */
export async function fetchAllPropertiesForSitemap(): Promise<
  PropertySitemapData[]
> {
  const allProperties: PropertySitemapData[] = [];
  let currentPage = 1;
  let totalPages = 1;
  const pageSize = 50; // Larger page size for sitemap generation

  try {
    do {
      // Fetching sitemap properties page

      const response = (await propertiesAPI.getAll(
        currentPage,
        pageSize
      )) as any;

      if (response?.results) {
        const propertyData = response.results
          .filter((property: Property) => property?.id && property?.title) // Only valid properties
          .map((property: Property) => ({
            url: `${siteConfig.url}/properties/${encodeURIComponent(
              property.id
            )}`,
            lastModified: property.updated_at
              ? new Date(property.updated_at).toISOString()
              : new Date().toISOString(),
            title: property.title || "Property",
            images: [
              property.image_url,
              ...(property.image_urls?.map((img: any) => img.url) || []),
            ]
              .filter(Boolean)
              .slice(0, 5), // Max 5 images per property
          }));

        allProperties.push(...propertyData);

        // Calculate total pages
        if (response.count && response.count > 0) {
          totalPages = Math.ceil(response.count / pageSize);
        }
      }

      currentPage++;
    } while (currentPage <= totalPages && currentPage <= 100); // Safety limit

    // Fetched properties for sitemap
    return allProperties;
  } catch (error) {
    console.error("Error fetching properties for sitemap:", error);
    return [];
  }
}

/**
 * Generate XML sitemap content
 */
export function generateSitemapXml(
  urls: PropertySitemapData[],
  includeImages = true
): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`;

  if (includeImages) {
    xml += `
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`;
  }

  xml += `>
`;

  urls.forEach((urlData) => {
    xml += `  <url>
    <loc>${urlData.url}</loc>
    <lastmod>${urlData.lastModified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>`;

    if (includeImages && urlData.images.length > 0) {
      urlData.images.forEach((imageUrl) => {
        const fullImageUrl = imageUrl.startsWith("http")
          ? imageUrl
          : `${siteConfig.url}${imageUrl}`;
        xml += `
    <image:image>
      <image:loc>${fullImageUrl}</image:loc>
      <image:title>${urlData.title}</image:title>
    </image:image>`;
      });
    }

    xml += `
  </url>
`;
  });

  xml += `</urlset>`;
  return xml;
}

/**
 * Generate sitemap index XML
 */
export function generateSitemapIndexXml(
  sitemaps: Array<{ url: string; lastModified: string }>
): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  sitemaps.forEach((sitemap) => {
    xml += `  <sitemap>
    <loc>${sitemap.url}</loc>
    <lastmod>${sitemap.lastModified}</lastmod>
  </sitemap>
`;
  });

  xml += `</sitemapindex>`;
  return xml;
}

/**
 * Calculate pagination info for property sitemaps
 */
export function calculateSitemapPagination(
  totalProperties: number,
  propertiesPerSitemap = 1000
) {
  const totalSitemaps = Math.ceil(totalProperties / propertiesPerSitemap);
  const sitemaps = [];

  for (let i = 1; i <= totalSitemaps; i++) {
    sitemaps.push({
      page: i,
      url: `${siteConfig.url}/sitemap-properties-${i}.xml`,
      startIndex: (i - 1) * propertiesPerSitemap,
      endIndex: Math.min(i * propertiesPerSitemap, totalProperties),
    });
  }

  return sitemaps;
}

/**
 * Get static routes for sitemap
 */
export function getStaticRoutes(): SitemapUrl[] {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteConfig.url}/properties`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/ai-model`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/reviews`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/experience`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/blogs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteConfig.url}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
