/**
 * Utility functions for API layer
 * Handles token management, storage, and validation
 */

import { jwtDecode } from "jwt-decode";
import type { TokenData, DecodedToken } from "./types";

// ============================================================================
// TOKEN STORAGE FUNCTIONS
// ============================================================================

/**
 * Get authentication token from localStorage
 * @returns Token string or null if not found
 */
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
};

/**
 * Get refresh token from localStorage
 * @returns Refresh token string or null if not found
 */
export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
};

/**
 * Set authentication token in localStorage, sessionStorage, AND cookies
 * @param token - JWT token to store
 * @param remember - Whether to store in sessionStorage (default: true)
 */
export const setAuthToken = (token: string, remember = true): void => {
  if (typeof window === "undefined") return;

  if (token) {
    // Store plain token for backward compatibility
    localStorage.setItem("authToken", token);

    // Store token with creation timestamp
    const tokenData: TokenData = {
      token,
      timestamp: Date.now(),
    };
    localStorage.setItem("tokenData", JSON.stringify(tokenData));

    // Store in cookie for middleware access
    document.cookie = `authToken=${token}; path=/; max-age=${
      30 * 24 * 60 * 60
    }; SameSite=Lax`;

    if (remember) {
      sessionStorage.setItem("authToken", token);
    }
  } else {
    clearAuthToken();
  }
};

/**
 * Set refresh token in localStorage
 * @param token - Refresh token to store
 */
export const setRefreshToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("refreshToken", token);
};

/**
 * Clear all authentication tokens from storage AND cookies
 */
export const clearAuthToken = (): void => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("authToken");
  localStorage.removeItem("tokenData");
  localStorage.removeItem("refreshToken");
  sessionStorage.removeItem("authToken");

  // Clear cookie
  document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
};

// ============================================================================
// TOKEN VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if token is older than 5 days (actually 10 days based on config)
 * @returns True if token is older than the threshold
 */
export const isTokenOlderThan5Days = (): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const tokenDataString = localStorage.getItem("tokenData");
    if (!tokenDataString) return false;

    const tokenData = JSON.parse(tokenDataString) as TokenData;
    const tokenTimestamp = tokenData.timestamp;
    const currentTime = Date.now();

    // Calculate difference in milliseconds (10 days = 864,000,000 ms)
    const fiveDaysInMs = 10 * 24 * 60 * 60 * 1000;
    const diff = currentTime - tokenTimestamp;

    return diff > fiveDaysInMs;
  } catch (error) {
    console.error("Error checking token age:", error);
    return false;
  }
};

/**
 * Decode JWT token to extract payload
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 * @param token - JWT token string
 * @returns True if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;

  const currentTime = Date.now() / 1000; // Convert to seconds
  // Check if token is expired or expires in less than 60 seconds
  return decoded.exp < currentTime + 60;
};

/**
 * Verify if current token is valid and not expired
 * @returns True if token exists and is valid
 */
export const verifyCurrentToken = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;

  return !isTokenExpired(token);
};

/**
 * Get user ID from current token
 * @returns User ID or null if not found
 */
export const getUserIdFromToken = (): string | null => {
  const token = getAuthToken();
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  // Try different possible field names for user ID
  // Common JWT claims: user_id, userId, sub (subject), id
  const userId = (decoded as any).user_id || 
                 (decoded as any).userId || 
                 (decoded as any).sub || 
                 (decoded as any).id;

  if (!userId) {
    console.warn('No user ID found in token. Available fields:', Object.keys(decoded));
  }

  return userId || null;
};

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * Get token data object with timestamp from localStorage
 * @returns TokenData object or null if not found
 */
export const getTokenData = (): TokenData | null => {
  if (typeof window === "undefined") return null;

  try {
    const tokenDataString = localStorage.getItem("tokenData");
    if (!tokenDataString) return null;

    return JSON.parse(tokenDataString) as TokenData;
  } catch (error) {
    console.error("Error parsing token data:", error);
    return null;
  }
};

/**
 * Check if user is authenticated (has valid token)
 * @returns True if user has valid token
 */
export const isAuthenticated = (): boolean => {
  return verifyCurrentToken();
};
