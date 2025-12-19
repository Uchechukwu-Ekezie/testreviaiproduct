// Analytics tracking utilities

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Google Analytics Events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Facebook Pixel Events
export const trackFacebookEvent = (
  event: string,
  parameters?: Record<string, any>
) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, parameters);
  }
};

// Custom Events for Real Estate App
export const analytics = {
  // Property Events
  viewProperty: (propertyId: string, propertyValue?: number) => {
    trackEvent("view_property", "property", propertyId, propertyValue);
    trackFacebookEvent("ViewContent", {
      content_type: "property",
      content_ids: [propertyId],
      value: propertyValue,
      currency: "USD",
    });
  },

  searchProperties: (searchQuery: string, location?: string) => {
    trackEvent("search_properties", "search", `${searchQuery}|${location}`);
    trackFacebookEvent("Search", {
      search_string: searchQuery,
      content_category: "property",
    });
  },

  contactAgent: (
    propertyId: string,
    contactMethod: "phone" | "email" | "form"
  ) => {
    trackEvent("contact_agent", "engagement", `${propertyId}|${contactMethod}`);
    trackFacebookEvent("Contact", {
      content_type: "property",
      content_ids: [propertyId],
    });
  },

  scheduleViewing: (propertyId: string) => {
    trackEvent("schedule_viewing", "conversion", propertyId);
    trackFacebookEvent("Schedule", {
      content_type: "property_viewing",
      content_ids: [propertyId],
    });
  },

  // User Events
  signUp: (method: "email" | "google" | "facebook") => {
    trackEvent("sign_up", "user", method);
    trackFacebookEvent("CompleteRegistration", {
      registration_method: method,
    });
  },

  login: (method: "email" | "google" | "facebook") => {
    trackEvent("login", "user", method);
    trackFacebookEvent("Login", {
      login_method: method,
    });
  },

  // AI Chat Events
  startChat: (chatType: "property_inquiry" | "general" | "market_analysis") => {
    trackEvent("start_chat", "ai_interaction", chatType);
    trackFacebookEvent("InitiateCheckout", {
      content_type: "ai_service",
      content_category: chatType,
    });
  },

  completeChat: (chatId: string, messageCount: number) => {
    trackEvent("complete_chat", "ai_interaction", chatId, messageCount);
    trackFacebookEvent("Purchase", {
      content_type: "ai_consultation",
      value: messageCount,
      currency: "USD",
    });
  },

  // Subscription Events
  viewPricing: () => {
    trackEvent("view_pricing", "subscription");
    trackFacebookEvent("ViewContent", {
      content_type: "pricing_page",
    });
  },

  startSubscription: (plan: string, value: number) => {
    trackEvent("start_subscription", "conversion", plan, value);
    trackFacebookEvent("InitiateCheckout", {
      content_type: "subscription",
      content_category: plan,
      value: value,
      currency: "USD",
    });
  },

  completeSubscription: (
    plan: string,
    value: number,
    transactionId: string
  ) => {
    trackEvent("purchase", "conversion", plan, value);
    trackFacebookEvent("Purchase", {
      content_type: "subscription",
      content_category: plan,
      value: value,
      currency: "USD",
      transaction_id: transactionId,
    });
  },

  // Page Views
  pageView: (pageName: string, category?: string) => {
    trackEvent("page_view", category || "navigation", pageName);
  },

  // File Upload Events
  uploadDocument: (fileType: string, fileSize: number) => {
    trackEvent("upload_document", "file_interaction", fileType, fileSize);
    trackFacebookEvent("Upload", {
      content_type: "document",
      content_category: fileType,
      value: fileSize,
    });
  },

  // Dashboard Events
  viewDashboard: (userType: "user" | "agent" | "admin" | "landlord") => {
    trackEvent("view_dashboard", "dashboard", userType);
    trackFacebookEvent("ViewContent", {
      content_type: "dashboard",
      content_category: userType,
    });
  },

  // Property Management Events
  addProperty: (propertyType: string) => {
    trackEvent("add_property", "property_management", propertyType);
    trackFacebookEvent("AddToCart", {
      content_type: "property_listing",
      content_category: propertyType,
    });
  },

  editProperty: (propertyId: string) => {
    trackEvent("edit_property", "property_management", propertyId);
  },

  deleteProperty: (propertyId: string) => {
    trackEvent("delete_property", "property_management", propertyId);
  },
};

// Enhanced error tracking
export const trackError = (error: Error, context?: string) => {
  trackEvent(
    "error",
    "error",
    `${error.name}: ${error.message}`,
    context ? 1 : 0
  );

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "exception", {
      description: error.message,
      fatal: false,
      custom_map: {
        context: context || "unknown",
      },
    });
  }
};

// Performance tracking
export const trackPerformance = (
  metric: string,
  value: number,
  unit?: string
) => {
  trackEvent("performance", "metrics", `${metric}|${unit || "ms"}`, value);
};

export default analytics;
