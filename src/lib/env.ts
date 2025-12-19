// Environment configuration

export const MEDIUM_URL = `https://medium.com/feed/@${process.env.NEXT_PUBLIC_MEDIUM_USERNAME}`;
export const MEDIUM_API_KEY = process.env.NEXT_PUBLIC_MEDIUM_API_KEY || "";
export const BASEURL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://backend.reviai.ai";
