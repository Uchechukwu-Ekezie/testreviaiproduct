"use client";
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  AxiosResponse,
} from "axios";
import { TokenData } from "./types";

// Define base API URL (replace with your actual backend URL)
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// Create an Axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    // ✅ DON'T set Content-Type globally - let each request set it as needed
    // "Content-Type": "application/json", // ❌ REMOVED - this was forcing all requests to be JSON
    ...(typeof window !== "undefined" &&
    window.localStorage &&
    window.localStorage.getItem("authToken")
      ? { Authorization: `Bearer ${window.localStorage.getItem("authToken")}` }
      : {}),
    Accept: "application/json",
  },
});

// Token refresh state management
let isRefreshing = false;
let failedQueue: {
  resolve: (value: AxiosResponse<unknown>) => void;
  reject: (error: AxiosError) => void;
  config: AxiosRequestConfig; // Store original request config for retry
}[] = [];

/**
 * Process queued requests after token refresh
 */
const processQueue = (
  error: AxiosError | null,
  token: string | null = null
): void => {
  console.log(`🔄 Processing ${failedQueue.length} queued requests...`);
  
  failedQueue.forEach((prom, index) => {
    if (error) {
      console.log(`❌ Rejecting queued request ${index + 1}`);
      prom.reject(error);
    } else if (token) {
      // Ensure headers object exists and update with new token
      const headers = prom.config.headers || {};
      headers.Authorization = `Bearer ${token}`;
      prom.config.headers = headers as any;
      
      console.log(`🔄 Retrying queued request ${index + 1} with new token`);
      
      // Retry the original request with the new token
      api(prom.config)
        .then((response) => {
          console.log(`✅ Queued request ${index + 1} succeeded`);
          prom.resolve(response);
        })
        .catch((err) => {
          console.log(`❌ Queued request ${index + 1} failed:`, err.response?.status);
          prom.reject(err);
        });
    }
  });

  failedQueue = [];
};

/**
 * Check if token is older than 5 days
 * @returns true if token is older than 5 days, false otherwise
 */
const isTokenOlderThan5Days = (): boolean => {
  try {
    // Get token data from localStorage
    const tokenDataString = localStorage.getItem("tokenData");
    if (!tokenDataString) return false;

    const tokenData = JSON.parse(tokenDataString) as TokenData;
    const tokenTimestamp = tokenData.timestamp;
    const currentTime = Date.now();

    // Calculate difference in milliseconds
    const fiveDaysInMs = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds
    const diff = currentTime - tokenTimestamp;

    return diff > fiveDaysInMs;
  } catch (error) {
    console.error("Error checking token age:", error);
    return false;
  }
};

/**
 * Refresh access token using refresh token
 * @returns New access token or null if refresh failed
 */
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post<{ 
      access_token: string; 
      refresh_token?: string;
      token_type?: string;
    }>(
      `${BASE_URL}/auth/refresh`,
      {
        refresh_token: refreshToken,
      }
    );

    const newAccessToken = response.data.access_token;

    if (newAccessToken) {
      console.log('🔄 Token refresh successful, updating tokens...');
      
      // Save the new token with timestamp
      localStorage.setItem("authToken", newAccessToken);

      // Save token with creation timestamp
      const tokenData: TokenData = {
        token: newAccessToken,
        timestamp: Date.now(),
      };

      localStorage.setItem("tokenData", JSON.stringify(tokenData));
      
      // Update axios default headers
      api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
      
      console.log('✅ Axios headers updated with new token');
      
      // Update refresh token if provided
      if (response.data.refresh_token) {
        localStorage.setItem("refreshToken", response.data.refresh_token);
      }

      return newAccessToken;
    }

    return null;
  } catch (error) {
    console.error("❌ Failed to refresh access token", error);
    // In case of failure, clear stored tokens
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenData");
    return null;
  }
};

/**
 * Check if the request is for an auth endpoint
 */
const isAuthEndpoint = (url?: string): boolean => {
  if (!url) return false;

  return (
    url.includes("/auth/token") ||
    url.includes("/auth/register") ||
    url.includes("/auth/login") ||
    url.includes("/auth/signup") ||
    url.includes("/auth/password/reset") ||
    url.includes("/auth/email/verify")
  );
};

// ✅ Request interceptor to add auth token and check token age BEFORE sending requests
api.interceptors.request.use(
  async (config) => {
    // Skip check for auth endpoints
    if (isAuthEndpoint(config.url)) {
      // For auth endpoints, explicitly remove Authorization header to prevent expired token issues
      if (config.headers) {
        delete config.headers.Authorization;
        delete config.headers.authorization;
      }
      return config;
    }

    // Get the current token from localStorage
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    // Add token to request headers if available
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Skip proactive token refresh for better performance
    // Token will be refreshed on 401 response if needed

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Response interceptor for handling 401 errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Don't attempt to refresh token for login/register endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      if (isRefreshing) {
        // Queue this request to be retried after token refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ 
            resolve, 
            reject,
            config: originalRequest // Store the original request config
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();

        if (!newAccessToken) {
          return Promise.reject(error);
        }

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Generic API fetch function using the configured axios instance
 *
 * Provides a simplified interface for making HTTP requests with automatic
 * authentication, error handling, and JSON parsing.
 *
 * @param url - API endpoint URL (relative to BASE_URL)
 * @param options - Request options including method, body, and headers
 * @returns Response data from the server
 * @throws {Error} If the request fails
 *
 * @example
 * // GET request
 * const data = await apiFetch('users/profile/');
 *
 * @example
 * // POST request
 * const result = await apiFetch('properties/', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'New Property' })
 * });
 */
export const apiFetch = async (
  url: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: string;
    headers?: Record<string, string>;
  } = {}
) => {
  try {
    const { method = "GET", body, headers = {} } = options;

    const config: AxiosRequestConfig = {
      method: method.toLowerCase() as
        | "get"
        | "post"
        | "put"
        | "delete"
        | "patch",
      url,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      config.data = body;
    }

    const response = await api(config);
    return response.data;
  } catch (error) {
    console.error(
      `apiFetch error for ${options.method || "GET"} ${url}:`,
      error
    );
    throw error;
  }
};

export default api;
export { api, refreshAccessToken, isTokenOlderThan5Days };
