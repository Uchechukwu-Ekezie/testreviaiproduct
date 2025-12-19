import { NextRequest, NextResponse } from "next/server";
import { propertiesAPI } from "@/lib/api";
import { siteConfig } from "@/lib/site-config";

export async function GET(request: NextRequest) {
  try {
    // Testing sitemap system

    // Get total count
    const response = (await propertiesAPI.getAll(1, 1)) as any;
    const totalProperties = response?.count || 0;

    if (totalProperties === 0) {
      return NextResponse.json({
        error: "No properties found",
        totalProperties: 0,
      });
    }

    const propertiesPerSitemap = 1000;
    const totalSitemaps = Math.ceil(totalProperties / propertiesPerSitemap);

    // Generate sitemap URLs that should be available
    const sitemapUrls = [];
    for (let i = 1; i <= totalSitemaps; i++) {
      sitemapUrls.push(`${siteConfig.url}/sitemap-properties/${i}.xml`);
    }

    const testResults = {
      totalProperties,
      propertiesPerSitemap,
      totalSitemaps,
      mainSitemap: `${siteConfig.url}/sitemap.xml`,
      sitemapIndex: `${siteConfig.url}/sitemap-index.xml`,
      propertySitemaps: sitemapUrls,
      estimatedCoverage: {
        properties: totalProperties,
        sitemaps: totalSitemaps,
        maxPropertiesPerSitemap: propertiesPerSitemap,
        lastSitemapProperties:
          totalProperties % propertiesPerSitemap || propertiesPerSitemap,
      },
      testUrls: [
        `${siteConfig.url}/sitemap-properties/1.xml`, // First sitemap
        `${siteConfig.url}/sitemap-properties/${Math.ceil(
          totalSitemaps / 2
        )}.xml`, // Middle sitemap
        `${siteConfig.url}/sitemap-properties/${totalSitemaps}.xml`, // Last sitemap
      ],
    };

    // Sitemap system test completed

    return NextResponse.json(testResults, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error testing sitemap system:", error);
    return NextResponse.json(
      {
        error: "Failed to test sitemap system",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
