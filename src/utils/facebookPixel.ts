declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

/** Initialize Meta Pixel */
export const initFacebookPixel = () => {
  if (typeof window !== "undefined") {
    window.fbq("init", "623108027133958");
    window.fbq("track", "PageView");
  }
};

/** Track Custom Events */
export const trackFacebookEvent = (event: string, params = {}) => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, params);
  }
};
