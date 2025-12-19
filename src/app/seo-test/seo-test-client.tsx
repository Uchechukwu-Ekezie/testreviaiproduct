"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq: (...args: any[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag: (...args: any[]) => void;
  }
}

export default function SEOTestClient() {
  const [pixelLoaded, setPixelLoaded] = useState(false);
  const [gaLoaded, setGaLoaded] = useState(false);

  useEffect(() => {
    // Check if Facebook Pixel is loaded
    const checkPixel = () => {
      if (
        typeof window !== "undefined" &&
        window.fbq &&
        typeof window.fbq === "function"
      ) {
        setPixelLoaded(true);
        console.log("✅ Facebook Pixel detected! ID: 623108027133958");
      }
    };

    // Check if Google Analytics is loaded
    const checkGA = () => {
      if (
        typeof window !== "undefined" &&
        (window as { gtag?: (...args: unknown[]) => void }).gtag
      ) {
        setGaLoaded(true);
        console.log("✅ Google Analytics detected!");
      }
    };

    // Check immediately and then every second for 10 seconds
    const interval = setInterval(() => {
      checkPixel();
      checkGA();
    }, 1000);

    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(interval), 10000);

    return () => clearInterval(interval);
  }, []);

  const testPixelEvent = () => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "ViewContent", {
        content_name: "SEO Test Page",
        content_category: "Testing",
      });
      console.log("🔥 Facebook Pixel event fired: ViewContent");
    } else {
      console.warn("❌ Facebook Pixel not available");
    }
  };

  const testGAEvent = () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "seo_test_interaction", {
        event_category: "engagement",
        event_label: "test_button_click",
      });
      console.log("📊 Google Analytics event fired: seo_test_interaction");
    } else {
      console.warn("❌ Google Analytics not available");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SEO & Analytics Test Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Testing Facebook Pixel, Google Analytics, and SEO implementation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Facebook Pixel Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Facebook Pixel
                {pixelLoaded ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Loaded
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Not Loaded
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Pixel ID: 623108027133958
              </p>
              <Button
                onClick={testPixelEvent}
                disabled={!pixelLoaded}
                className="w-full"
              >
                Test Pixel Event
              </Button>
            </CardContent>
          </Card>

          {/* Google Analytics Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Google Analytics
                {gaLoaded ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Loaded
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Not Loaded
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Check browser console for GA events
              </p>
              <Button
                onClick={testGAEvent}
                disabled={!gaLoaded}
                className="w-full"
              >
                Test GA Event
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* SEO Meta Tags Preview */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Meta Tags Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <strong className="text-sm">Title:</strong>
                <p className="text-sm text-gray-600">SEO Test - REVIAI</p>
              </div>
              <div>
                <strong className="text-sm">Description:</strong>
                <p className="text-sm text-gray-600">
                  Test page for SEO implementation, Facebook Pixel, and Google
                  Analytics integration
                </p>
              </div>
              <div>
                <strong className="text-sm">Open Graph Type:</strong>
                <p className="text-sm text-gray-600">website</p>
              </div>
              <div>
                <strong className="text-sm">Robots:</strong>
                <p className="text-sm text-gray-600">noindex, nofollow</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testing Tools */}
        <Card>
          <CardHeader>
            <CardTitle>External Testing Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" asChild>
                <a
                  href="https://www.facebook.com/business/help/952192354843755"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  Facebook Pixel Helper
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="https://tagassistant.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  Google Tag Assistant
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="https://developers.facebook.com/tools/debug/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  Facebook Debugger
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Open browser developer tools (F12)</li>
              <li>Check the Console tab for loading confirmations</li>
              <li>Use Facebook Pixel Helper browser extension</li>
              <li>Test events by clicking the buttons above</li>
              <li>Verify meta tags in the page source (Ctrl+U)</li>
              <li>Use Google Tag Assistant for GA verification</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
