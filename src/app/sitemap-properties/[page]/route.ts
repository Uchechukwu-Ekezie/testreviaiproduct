import { NextRequest, NextResponse } from "next/server";
import { propertiesAPI } from "@/lib/api";
import { siteConfig } from "@/lib/site-config";

interface RouteParams {
  params: Promise<{
    page: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const pageNumber = parseInt(resolvedParams.page) || 1;
    const propertiesPerSitemap = 1000;
    const apiPageSize = 50; // Use larger page size for efficiency

    // Generating property sitemap

    // Calculate which API pages we need to fetch for this sitemap page
    const startIndex = (pageNumber - 1) * propertiesPerSitemap;
    const startApiPage = Math.floor(startIndex / apiPageSize) + 1;
    const endApiPage = Math.ceil(
      (startIndex + propertiesPerSitemap) / apiPageSize
    );

    let allProperties: any[] = [];

    // Fetch the required pages from API with better error handling
    for (let apiPage = startApiPage; apiPage <= endApiPage; apiPage++) {
      try {
        // Fetching API page
        const response = (await propertiesAPI.getAll(
          apiPage,
          apiPageSize
        )) as any;

        if (response?.results) {
          allProperties.push(...response.results);
          // Fetched properties from API page
        }
      } catch (pageError) {
        console.error(
          `Error fetching API page ${apiPage} for sitemap ${pageNumber}:`,
          pageError
        );
        // Continue with other pages even if one fails
        continue;
      }
    }

    // Calculate the exact slice we need
    const relativeStartIndex =
      startIndex % (apiPageSize * (endApiPage - startApiPage + 1));
    const propertiesForThisSitemap = allProperties.slice(
      relativeStartIndex,
      relativeStartIndex + propertiesPerSitemap
    );

    // Property sitemap generated

    // Generate sitemap XML
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Add each property
    propertiesForThisSitemap.forEach((property) => {
      if (!property?.id) return;

      const propertyUrl = `${siteConfig.url}/properties/${encodeURIComponent(
        property.id
      )}`;
      const lastModified = property.updated_at
        ? new Date(property.updated_at).toISOString()
        : new Date().toISOString();

      sitemapXml += `  <url>
    <loc>${propertyUrl}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>`;

      // Add property images if available (optimized)
      const images = [];
      if (property.image_url) {
        images.push(property.image_url);
      }
      if (property.image_urls && Array.isArray(property.image_urls)) {
        images.push(
          ...property.image_urls.map((img: any) => img.url).filter(Boolean)
        );
      }

      // Add up to 3 images per property for faster generation
      images.slice(0, 3).forEach((imageUrl, index) => {
        try {
          const fullImageUrl = imageUrl.startsWith("http")
            ? imageUrl
            : `${siteConfig.url}${imageUrl}`;
          const title = property.title
            ? `${property.title} - Image ${index + 1}`
            : `Property Image ${index + 1}`;
          sitemapXml += `
    <image:image>
      <image:loc>${fullImageUrl}</image:loc>
      <image:title>${title}</image:title>
    </image:image>`;
        } catch (imageError) {
          console.warn(
            `Skipping invalid image URL for property ${property.id}:`,
            imageUrl
          );
        }
      });

      sitemapXml += `
  </url>
`;
    });

    sitemapXml += `</urlset>`;

    return new NextResponse(sitemapXml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400", // Cache for 1 hour, revalidate for 24 hours
      },
    });
  } catch (error) {
    const resolvedParams = await params;
    console.error(
      `Error generating property sitemap ${resolvedParams.page}:`,
      error
    );

    // Return empty sitemap on error
    const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

    return new NextResponse(emptySitemap, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  }
}
