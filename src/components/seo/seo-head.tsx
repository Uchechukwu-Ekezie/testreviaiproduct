"use client";

import Head from "next/head";
import { useRouter } from "next/navigation";

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile" | "product";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  siteName?: string;
  locale?: string;
  noindex?: boolean;
  nofollow?: boolean;
  canonical?: string;
}

const defaultSEO: Required<
  Omit<SEOProps, "publishedTime" | "modifiedTime" | "author" | "canonical">
> = {
  title: "Revi.ai - Your AI-Powered Real Estate Assistant",
  description:
    "Transform your real estate experience with Revi.ai. Get instant property insights, market analysis, and personalized recommendations powered by advanced AI technology.",
  keywords:
    "real estate, AI assistant, property search, market analysis, property management, real estate technology, property insights, revi.ai",
  image: "/images/og-image.jpg",
  url: "https://revi.ai",
  type: "website",
  siteName: "Revi.ai",
  locale: "en_US",
  noindex: false,
  nofollow: false,
};

export default function SEOHead({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  author,
  publishedTime,
  modifiedTime,
  siteName,
  locale,
  noindex = false,
  nofollow = false,
  canonical,
}: SEOProps) {
  const router = useRouter();
  const currentUrl =
    typeof window !== "undefined" ? window.location.href : defaultSEO.url;

  const seoTitle = title
    ? `${title} | ${defaultSEO.siteName}`
    : defaultSEO.title;
  const seoDescription = description || defaultSEO.description;
  const seoKeywords = keywords || defaultSEO.keywords;
  const seoImage = image || defaultSEO.image;
  const seoUrl = url || canonical || currentUrl;
  const seoSiteName = siteName || defaultSEO.siteName;
  const seoLocale = locale || defaultSEO.locale;

  // Ensure image is absolute URL
  const absoluteImage = seoImage.startsWith("http")
    ? seoImage
    : `${defaultSEO.url}${seoImage}`;

  const robotsContent = `${noindex ? "noindex" : "index"},${
    nofollow ? "nofollow" : "follow"
  }`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      <meta name="robots" content={robotsContent} />

      {/* Canonical URL */}
      <link rel="canonical" href={seoUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:site_name" content={seoSiteName} />
      <meta property="og:locale" content={seoLocale} />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={absoluteImage} />
      <meta name="twitter:site" content="@ReviAiTech" />
      <meta name="twitter:creator" content="@ReviAiTech" />

      {/* Article Meta Tags */}
      {type === "article" && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedTime && (
            <meta property="article:published_time" content={publishedTime} />
          )}
          {modifiedTime && (
            <meta property="article:modified_time" content={modifiedTime} />
          )}
        </>
      )}

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />
      <meta name="theme-color" content="#000000" />
      <meta name="msapplication-TileColor" content="#000000" />

      {/* Favicon and Icons */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/png" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />
    </Head>
  );
}
