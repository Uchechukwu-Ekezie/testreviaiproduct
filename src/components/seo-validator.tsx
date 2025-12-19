"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react";

interface SEOCheck {
  name: string;
  status: "pass" | "warning" | "fail";
  message: string;
  value?: string;
}

export default function SEOValidator() {
  const [checks, setChecks] = useState<SEOCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(window.location.origin);
    }
  }, []);

  const validateSEO = async () => {
    setLoading(true);
    const newChecks: SEOCheck[] = [];

    try {
      // Check meta tags
      const title = document.querySelector("title")?.textContent;
      const description = document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content");
      const ogTitle = document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content");
      const ogDescription = document
        .querySelector('meta[property="og:description"]')
        ?.getAttribute("content");
      const ogImage = document
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content");
      const twitterCard = document
        .querySelector('meta[name="twitter:card"]')
        ?.getAttribute("content");
      const canonical = document
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href");

      // Title check
      newChecks.push({
        name: "Page Title",
        status:
          title && title.length > 0 && title.length <= 60 ? "pass" : "warning",
        message: title
          ? `Length: ${title.length} characters`
          : "Missing title tag",
        value: title || "Not found",
      });

      // Meta description check
      newChecks.push({
        name: "Meta Description",
        status:
          description && description.length > 0 && description.length <= 160
            ? "pass"
            : "warning",
        message: description
          ? `Length: ${description.length} characters`
          : "Missing meta description",
        value: description || "Not found",
      });

      // Open Graph checks
      newChecks.push({
        name: "Open Graph Title",
        status: ogTitle ? "pass" : "fail",
        message: ogTitle ? "Present" : "Missing og:title",
        value: ogTitle || "Not found",
      });

      newChecks.push({
        name: "Open Graph Description",
        status: ogDescription ? "pass" : "fail",
        message: ogDescription ? "Present" : "Missing og:description",
        value: ogDescription || "Not found",
      });

      newChecks.push({
        name: "Open Graph Image",
        status: ogImage ? "pass" : "warning",
        message: ogImage ? "Present" : "Missing og:image",
        value: ogImage || "Not found",
      });

      // Twitter Card check
      newChecks.push({
        name: "Twitter Card",
        status: twitterCard ? "pass" : "warning",
        message: twitterCard ? `Type: ${twitterCard}` : "Missing twitter:card",
        value: twitterCard || "Not found",
      });

      // Canonical URL check
      newChecks.push({
        name: "Canonical URL",
        status: canonical ? "pass" : "warning",
        message: canonical ? "Present" : "Missing canonical URL",
        value: canonical || "Not found",
      });

      // Analytics checks
      const gtag =
        typeof window !== "undefined"
          ? (window as unknown as { gtag?: unknown }).gtag
          : undefined;
      const fbq =
        typeof window !== "undefined"
          ? (window as unknown as { fbq?: unknown }).fbq
          : undefined;

      newChecks.push({
        name: "Google Analytics",
        status: gtag ? "pass" : "warning",
        message: gtag ? "Loaded" : "Not detected",
        value: gtag ? "Active" : "Not found",
      });

      newChecks.push({
        name: "Facebook Pixel",
        status: fbq ? "pass" : "warning",
        message: fbq ? "Loaded" : "Not detected",
        value: fbq ? "Active" : "Not found",
      });

      // Structured data check
      const structuredData = document.querySelector(
        'script[type="application/ld+json"]'
      );
      newChecks.push({
        name: "Structured Data",
        status: structuredData ? "pass" : "warning",
        message: structuredData ? "Present" : "No structured data found",
        value: structuredData ? "JSON-LD found" : "Not found",
      });
    } catch (error) {
      console.error("SEO validation error:", error);
    }

    setChecks(newChecks);
    setLoading(false);
  };

  useEffect(() => {
    validateSEO();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status: SEOCheck["status"]) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "fail":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: SEOCheck["status"]) => {
    const colors = {
      pass: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      fail: "bg-red-100 text-red-800",
    };

    return <Badge className={colors[status]}>{status.toUpperCase()}</Badge>;
  };

  const testingUrls = [
    {
      name: "Google Rich Results Test",
      url: `https://search.google.com/test/rich-results?url=${encodeURIComponent(
        url
      )}`,
    },
    {
      name: "Facebook Sharing Debugger",
      url: `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(
        url
      )}`,
    },
    {
      name: "Twitter Card Validator",
      url: `https://cards-dev.twitter.com/validator?url=${encodeURIComponent(
        url
      )}`,
    },
    {
      name: "LinkedIn Post Inspector",
      url: `https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(
        url
      )}`,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SEO Validator</h2>
          <p className="text-gray-600">
            Check your page&apos;s SEO implementation
          </p>
        </div>
        <Button onClick={validateSEO} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh Check
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SEO Health Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {checks.map((check, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <div className="font-medium">{check.name}</div>
                    <div className="text-sm text-gray-600">{check.message}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(check.status)}
                  {check.value && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(check.value!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>External Validation Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testingUrls.map((tool, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-between h-auto p-4"
                onClick={() => window.open(tool.url, "_blank")}
              >
                <span>{tool.name}</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => window.open("/sitemap.xml", "_blank")}
            >
              View Sitemap
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open("/robots.txt", "_blank")}
            >
              View Robots.txt
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open("/manifest.json", "_blank")}
            >
              View Manifest
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
