"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq: (...args: any[]) => void;
  }
}

interface FacebookPixelProps {
  pixelId: string;
}

/** Initialize Meta Pixel */
export const initFacebookPixel = (pixelId: string) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
    // console.log(`Facebook Pixel initialized with ID: ${pixelId}`);
  }
};

/** Track Custom Events */
export const trackFacebookEvent = (
  event: string,
  params: Record<string, unknown> = {}
) => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, params);
    console.log(`Facebook Pixel event tracked: ${event}`, params);
  }
};

export default function FacebookPixel({ pixelId }: FacebookPixelProps) {
  useEffect(() => {
    if (!pixelId) return;

    // Wait for Facebook Pixel script to load and initialize
    const checkAndInit = () => {
      if (
        typeof window !== "undefined" &&
        window.fbq &&
        typeof window.fbq === "function"
      ) {
        initFacebookPixel(pixelId);
        return true;
      }
      return false;
    };

    // Try to initialize immediately
    if (!checkAndInit()) {
      // If not ready, poll until it's available
      const interval = setInterval(() => {
        if (checkAndInit()) {
          clearInterval(interval);
        }
      }, 100);

      // Cleanup after 10 seconds
      setTimeout(() => clearInterval(interval), 10000);
    }
  }, [pixelId]);

  if (!pixelId) return null;

  return (
    <>
      <Script
        id="facebook-pixel"
        src="https://connect.facebook.net/en_US/fbevents.js"
        strategy="afterInteractive"
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

// Real estate specific events using the main trackFacebookEvent function
export const trackPropertyView = (
  propertyId: string,
  propertyName: string,
  price?: number
) => {
  trackFacebookEvent("ViewContent", {
    content_type: "property",
    content_ids: [propertyId],
    content_name: propertyName,
    value: price,
    currency: "USD",
  });
};

export const trackPropertySearch = (
  searchQuery: string,
  filters?: Record<string, unknown>
) => {
  trackFacebookEvent("Search", {
    search_string: searchQuery,
    ...filters,
  });
};

export const trackContactAgent = (propertyId?: string) => {
  trackFacebookEvent("Contact", {
    content_type: "agent_contact",
    content_ids: propertyId ? [propertyId] : undefined,
  });
};

export const trackSignUp = (method?: string) => {
  trackFacebookEvent("CompleteRegistration", {
    method: method || "email",
  });
};

export const trackLogin = (method?: string) => {
  trackFacebookEvent("Login", {
    method: method || "email",
  });
};
