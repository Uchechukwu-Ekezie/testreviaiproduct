// app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, Public_Sans } from "next/font/google";
import Script from "next/script";

import { AuthProvider } from "@/contexts/auth-context";
import { ChatProvider } from "@/contexts/chat-context";
import { SearchHistoryProvider } from "@/contexts/search-history-context";
import { SearchProvider } from "@/contexts/search-context";
import { PropertiesProvider } from "@/contexts/properties-context";
import { UsersProvider } from "@/contexts/users-context";
import { ThemeProvider } from "@/contexts/theme-context";

import { Toaster } from "@/components/toaster";
import ConditionalLayout from "@/components/ConditionalLayout";
import { GoogleOAuthProvider } from "@react-oauth/google";

import Analytics from "@/components/analytics";
import StructuredData from "@/components/seo/structured-data";
import FacebookPixel from "@/components/facebook-pixel";
import GoogleAnalytics from "@/components/google-analytics";
import { ReviewsProvider } from "@/contexts/reviews-context";
import ClientLayout from "./ClientLayout"; // Import ClientLayout

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "Revi.ai - Your AI-Powered Real Estate Assistant",
    template: "%s | Revi.ai",
  },
  description:
    "Transform your real estate experience with Revi.ai. Get instant property insights, market analysis, and personalized recommendations powered by advanced AI technology.",
  keywords: [
    "real estate",
    "AI assistant",
    "property search",
    "market analysis",
    "property management",
    "real estate technology",
    "property insights",
    "revi.ai",
  ],
  authors: [{ name: "Revi.ai Team" }],
  creator: "Revi.ai",
  publisher: "Revi.ai",
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
  icons: {
    icon: [{ url: "/reviloo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/reviloo.svg" }],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://revi.ai",
    siteName: "Revi.ai",
    title: "Revi.ai - Your AI-Powered Real Estate Assistant",
    description:
      "Transform your real estate experience with Revi.ai. Get instant property insights, market analysis, and personalized recommendations powered by advanced AI technology.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Revi.ai - AI-Powered Real Estate Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Revi.ai - Your AI-Powered Real Estate Assistant",
    description:
      "Transform your real estate experience with Revi.ai. Get instant property insights, market analysis, and personalized recommendations powered by advanced AI technology.",
    images: ["/images/twitter-image.jpg"],
    creator: "@reviai",
    site: "@reviai",
  },
  alternates: {
    canonical: "https://revi.ai",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${publicSans.variable}`}>
      <body
        className="font-sans text-muted-foreground min-h-screen flex flex-col"
        suppressHydrationWarning
      >
        <GoogleOAuthProvider
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
        >
          <ThemeProvider>
            <AuthProvider>
              <UsersProvider>
                <SearchProvider>
                  <PropertiesProvider>
                    <ReviewsProvider>
                      <ChatProvider>
                        <SearchHistoryProvider>
                          {/* ClientLayout wraps ConditionalLayout + children */}
                          <ClientLayout>
                            <ConditionalLayout>{children}</ConditionalLayout>
                          </ClientLayout>

                          {/* Global components outside ClientLayout */}
                          <Toaster />
                          <Analytics />
                          <FacebookPixel
                            pixelId={
                              process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || ""
                            }
                          />
                          <GoogleAnalytics
                            trackingId={
                              process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || ""
                            }
                          />
                          <StructuredData
                            organization={{
                              name: "Revi.ai",
                              url: "https://revi.ai",
                              logo: "https://revi.ai/images/logo.png",
                              description:
                                "AI-powered real estate assistant providing instant property insights, market analysis, and personalized recommendations.",
                              sameAs: [
                                "https://twitter.com/reviai",
                                "https://linkedin.com/company/reviai",
                                "https://facebook.com/reviai",
                              ],
                            }}
                            website={{
                              name: "Revi.ai",
                              url: "https://revi.ai",
                              description:
                                "Transform your real estate experience with AI-powered insights and personalized recommendations.",
                              publisher: {
                                name: "Revi.ai",
                                logo: "https://revi.ai/images/logo.png",
                              },
                            }}
                          />
                          <Script id="tiktok-pixel" strategy="afterInteractive">
                            {`!function (w, d, t) {
  w.TiktokAnalyticsObject = t;
  var ttq = w[t] = w[t] || [];
  ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
  ttq.setAndDefer = function (t, e) {
    t[e] = function () {
      t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
    };
  };
  for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
  ttq.instance = function (t) {
    for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
    return e;
  };
  ttq.load = function (e, n) {
    var r = "https://analytics.tiktok.com/i18n/pixel/events.js",
      o = n && n.partner;
    ttq._i = ttq._i || {};
    ttq._i[e] = [];
    ttq._i[e]._u = r;
    ttq._t = ttq._t || {};
    ttq._t[e] = +new Date();
    ttq._o = ttq._o || {};
    ttq._o[e] = n || {};
    var a = document.createElement("script");
    a.type = "text/javascript";
    a.async = !0;
    a.src = r + "?sdkid=" + e + "&lib=" + t;
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(a, s);
  };
  ttq.load('D49G33RC77U505N95RVG');
  ttq.page();
}(window, document, 'ttq');`}
                          </Script>
                        </SearchHistoryProvider>
                      </ChatProvider>
                    </ReviewsProvider>
                  </PropertiesProvider>
                </SearchProvider>
              </UsersProvider>
            </AuthProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
