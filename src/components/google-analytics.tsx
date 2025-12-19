"use client";

import { useEffect } from "react";
import Script from "next/script";

interface GoogleAnalyticsProps {
  trackingId: string;
}

export default function GoogleAnalytics({ trackingId }: GoogleAnalyticsProps) {
  useEffect(() => {
    if (!trackingId || typeof window === "undefined") return;

    // console.log(`Google Analytics initialized with ID: ${trackingId}`);
  }, [trackingId]);

  if (!trackingId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${trackingId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${trackingId}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>
    </>
  );
}

// Event tracking functions
export const trackGoogleEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
    console.log(`Google Analytics event tracked: ${action}`, {
      category,
      label,
      value,
    });
  }
};

export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag(
      "config",
      process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
      {
        page_path: url,
        page_title: title,
      }
    );
  }
};
