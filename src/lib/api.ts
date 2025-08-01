"use client";
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  AxiosResponse,
} from "axios";
import { jwtDecode } from "jwt-decode";
import type { DecodedToken, ChatMessageResponse } from "../types/api";

// Define possible reaction types for chat messages
type ReactionType = "like" | "dislike" | "neutral" | string;

// Define base API URL (replace with your actual backend URL)
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// ✅ Enhanced token storage structure
interface TokenData {
  token: string;
  timestamp: number;
}

// Create an Axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    ...(typeof window !== "undefined" &&
    window.localStorage &&
    window.localStorage.getItem("authToken")
      ? { Authorization: `Bearer ${window.localStorage.getItem("authToken")}` }
      : {}),
    Accept: "application/json",
  },
});

let isRefreshing = false;
let failedQueue: {
  resolve: (value: AxiosResponse<any>) => void;
  reject: (error: AxiosError) => void;
}[] = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      prom.resolve(api as any);
    }
  });

  failedQueue = [];
};

// ✅ Function to check if token is older than 5 days
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

// ✅ Refresh access token function (used by both interceptors)
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    console.log("No refresh token available.");
    return null;
  }

  try {
    console.log("Attempting to refresh access token...");
    const response = await axios.post<{ access: string; refresh?: string }>(
      `${BASE_URL}/auth/token/refresh`,
      {
        refresh: refreshToken,
      }
    );

    const newAccessToken = response.data.refresh || response.data.access;

    if (newAccessToken) {
      // Save the new token with timestamp
      localStorage.setItem("authToken", newAccessToken);

      // Save token with creation timestamp
      const tokenData: TokenData = {
        token: newAccessToken,
        timestamp: Date.now(),
      };

      localStorage.setItem("tokenData", JSON.stringify(tokenData));
      api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;

      console.log("Access token refreshed successfully");
      return newAccessToken;
    }

    return null;
  } catch (error) {
    console.error("Failed to refresh access token", error);
    // In case of failure, clear stored tokens
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenData");
    return null;
  }
};

// ✅ New Request interceptor to check token age BEFORE sending requests
api.interceptors.request.use(
  async (config) => {
    // Skip check for auth endpoints and when already refreshing
    const isAuthEndpoint =
      config.url?.includes("/auth/token") ||
      config.url?.includes("/auth/register") ||
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/signup") ||
      config.url?.includes("/auth/password/reset") ||
      config.url?.includes("/auth/email/verify");

    if (isAuthEndpoint) {
      // For auth endpoints, explicitly remove Authorization header to prevent expired token issues
      if (config.headers) {
        delete config.headers.Authorization;
        delete config.headers.authorization;
      }
      return config;
    }

    if (!isRefreshing) {
      // Check if token is older than 5 days
      if (isTokenOlderThan5Days()) {
        console.log(
          "Token is older than 5 days, proactively refreshing before request"
        );

        // Set flag to prevent concurrent refreshes
        isRefreshing = true;

        try {
          const newToken = await refreshAccessToken();
          if (newToken) {
            config.headers["Authorization"] = `Bearer ${newToken}`;
          }
        } catch (error) {
          console.error("Failed to proactively refresh token:", error);
          // Continue with request even if refresh failed
        } finally {
          isRefreshing = false;
        }
      }
    }
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
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/token") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/signup") ||
      originalRequest.url?.includes("/auth/password/reset") ||
      originalRequest.url?.includes("/auth/email/verify");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        try {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => api(originalRequest));
        } catch (err) {
          return Promise.reject(err);
        }
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

// ✅ Modified function to set auth token in headers with timestamp
export const setAuthToken = (token: string, remember = true) => {
  if (token) {
    // Set token in axios headers
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Store plain token for backward compatibility
    localStorage.setItem("authToken", token);

    // Store token with creation timestamp
    const tokenData: TokenData = {
      token,
      timestamp: Date.now(),
    };

    localStorage.setItem("tokenData", JSON.stringify(tokenData));

    if (remember) {
      sessionStorage.setItem("authToken", token);
    }
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("authToken");
    localStorage.removeItem("tokenData");
    sessionStorage.removeItem("authToken");
  }
};

// ✅ Function to get auth token
export const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// ✅ Function to clear auth token
export const clearAuthToken = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("tokenData");
  localStorage.removeItem("refreshToken");
  delete api.defaults.headers.common["Authorization"];
};

// ✅ Export resetPassword function for direct import
export const resetPassword = async (data: {
  new_password1: string;
  new_password2: string;
  uid: string;
  token: string;
}) => {
  // Map the parameters to match what the backend expects
  const payload = {
    uid: data.uid,
    token: data.token,
    new_password: data.new_password1,
    confirm_password: data.new_password2,
  };
  const response = await api.post("/auth/password/reset/confirm", payload);
  return response.data;
};

// ✅ Function to check if the current auth token is valid
export const verifyToken = async (): Promise<boolean> => {
  try {
    const token = getAuthToken();
    if (!token) return false;

    // Check if the token is expired
    const decodedToken: DecodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Convert to seconds
    if (decodedToken.exp < currentTime) {
      console.error("Token is expired.");
      clearAuthToken(); // Clear expired token
      return false;
    }

    // Set the token in the headers
    setAuthToken(token);

    // Decode the token to extract the user ID
    // console.log(decodedToken)

    // Make sure you import and use a JWT decoding library like 'jwt-decode'
    const userId = decodedToken?.user_id; // Assuming the token contains the 'id' of the user

    if (!userId) {
      console.error("User ID not found in token.");
      return false;
    }

    // Try to fetch user profile - this will fail if token is invalid
    const response = await api.get(`/auth/users/${userId}`);
    return response.status === 200;
  } catch (error) {
    console.error("Token verification error:", error);
    clearAuthToken(); // Clear invalid token
    return false;
  }
};

// ✅ Auth API calls
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      console.log("API: Attempting login with email:", email);

      // Clear any existing tokens before login attempt
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("tokenData");
      delete api.defaults.headers.common["Authorization"];

      const response = await api.post(
        "/auth/login/",
        {
          email: email.trim(),
          password: password.trim(),
        },
        {
          withCredentials: true,
        }
      );

      console.log("API: Login successful, response:", response.data);

      // Handle both possible response formats
      const accessToken = response.data.access_token || response.data.access;
      const refreshToken = response.data.refresh_token || response.data.refresh;
      const userData = response.data.user || response.data;

      if (!accessToken) {
        throw new Error("No access token received from server");
      }

      // Store tokens
      setAuthToken(accessToken);

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      return {
        access: accessToken,
        refresh: refreshToken,
        user: userData,
      };
    } catch (error: any) {
      console.error("API: Login failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        detail: error.response?.data?.detail,
      });

      // Handle specific error cases
      if (error.response?.status === 500) {
        error.detail =
          "An internal server error occurred. Please try again later.";
      } else if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        const errorDetail = error.response?.data?.detail?.toLowerCase() || "";

        if (
          errorDetail.includes("no active account") ||
          errorDetail.includes("invalid credentials")
        ) {
          error.detail =
            "The email or password you entered is incorrect. Please check your credentials and try again.";
        } else if (
          errorDetail.includes("not verified") ||
          errorDetail.includes("verify")
        ) {
          error.detail =
            "Please verify your email before logging in. If you haven't received a verification email, try signing up again.";
        } else {
          error.detail =
            "Invalid email or password. Please check your credentials and try again.";
        }
      } else if (error.response?.data?.detail) {
        error.detail = error.response.data.detail;
      } else {
        error.detail = "An error occurred during login. Please try again.";
      }

      throw error;
    }
  },

  loginWithGoogle: async (credentialResponse: {
    credential?: string; // id_token
    access_token?: string;
    code?: string;
  }) => {
    try {
      console.log(
        "API: Attempting Google login with credential response:",
        credentialResponse
      );

      // Clear any existing tokens before login attempt
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("tokenData");
      delete api.defaults.headers.common["Authorization"];

      // Prepare payload according to your API spec
      const payload = {
        id_token: credentialResponse.credential,
        access_token: credentialResponse.access_token,
        code: credentialResponse.code,
      };

      const response = await api.post("/auth/social/google/login", payload);
      console.log("API: Google login successful, response:", response.data);

      // Handle response format (consistent with your regular login)
      const accessToken = response.data.access_token || response.data.access;
      const refreshToken = response.data.refresh_token || response.data.refresh;
      const userData = response.data.user || response.data;

      if (!accessToken) {
        throw new Error("No access token received from server");
      }

      // Store tokens
      setAuthToken(accessToken);

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      return {
        access: accessToken,
        refresh: refreshToken,
        user: userData,
      };
    } catch (error: any) {
      console.error("API: Google login failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        detail: error.response?.data?.detail,
      });

      // Clear any partial state on error
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("tokenData");
      delete api.defaults.headers.common["Authorization"];

      // Handle specific error cases
      if (error.response?.status === 401 || error.response?.status === 403) {
        const errorDetail = error.response?.data?.detail?.toLowerCase() || "";

        if (
          errorDetail.includes("invalid token") ||
          errorDetail.includes("invalid credential")
        ) {
          error.detail =
            "Google authentication failed. Please try signing in again.";
        } else if (errorDetail.includes("account not found")) {
          error.detail =
            "No account found with this Google login. Please sign up first.";
        } else {
          error.detail = "Authentication failed. Please try again.";
        }
      } else if (error.response?.data?.detail) {
        error.detail = error.response.data.detail;
      } else {
        error.detail =
          "An error occurred during Google authentication. Please try again.";
      }

      throw error;
    }
  },

  signup: async (userData: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
  }) => {
    try {
      console.log("API: Attempting signup with userData:", userData);

      // Clear any existing tokens before signup attempt (same as login)
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("tokenData");
      delete api.defaults.headers.common["Authorization"];

      // Also clear from session storage if it exists
      sessionStorage.removeItem("authToken");

      const response = await api.post("/auth/register/", userData);
      console.log("API: Signup successful, response:", response.data);

      // Return the entire response so we can handle different response structures
      return response;
    } catch (error: any) {
      console.error("API: Signup failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // Handle specific error cases
      if (error.response?.status === 400) {
        // Handle validation errors
        const errorData = error.response.data;
        if (typeof errorData === "object") {
          // Extract field-specific errors
          const fieldErrors = [];
          for (const [field, messages] of Object.entries(errorData)) {
            if (Array.isArray(messages)) {
              fieldErrors.push(`${field}: ${messages.join(", ")}`);
            } else {
              fieldErrors.push(`${field}: ${messages}`);
            }
          }
          error.detail = fieldErrors.join("; ");
        } else {
          error.detail = String(errorData);
        }
      } else if (error.response?.status === 409) {
        error.detail =
          "An account with this email already exists. Please try logging in instead.";
      } else if (error.response?.data?.detail) {
        error.detail = error.response.data.detail;
      } else {
        error.detail = "An error occurred during signup. Please try again.";
      }

      throw error;
    }
  },

  verifyEmail: async (email: string, otp: string) => {
    try {
      // console.log("API: Attempting to verify email with payload:", { email, otp });
      const response = await api.post(
        "/auth/email/verify/confirm/",
        {
          email: email.trim(),
          otp: otp.trim(),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      // console.log("API: Email verification successful, response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("API: Email verification failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // Include the detailed response in the error
      if (error.response?.data) {
        error.detail = error.response.data.detail || error.response.data;
      }

      throw error;
    }
  },

  verifyEmailOtp: async (email: string, otp: string) => {
    try {
      // console.log("API: Attempting to verify password reset OTP with payload:", { email, otp });
      const response = await api.post(
        "/auth/password/reset/confirm",
        {
          email: email.trim(),
          otp: otp.trim(),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      // console.log("API: Password reset OTP verification successful, response:", response.data);

      // Store email, OTP, and any token received from the response
      localStorage.setItem("resetEmail", email.trim());
      localStorage.setItem("resetOtp", otp.trim());
      if (response.data.token) {
        localStorage.setItem("resetToken", response.data.token);
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "API: Password reset OTP verification failed with detailed error:",
        {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          details: error.response?.data?.detail || error.response?.data,
        }
      );

      // Include the detailed response in the error
      if (error.response?.data) {
        error.detail = error.response.data.detail || error.response.data;
      }

      throw error;
    }
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  requestPasswordReset: async (email: string) => {
    try {
      // Ensure email is properly formatted in the request
      const payload = { email: email.trim() };
      console.log("Sending password reset request with payload:", payload);

      // First attempt: standard endpoint without trailing slash
      try {
        console.log("Attempting password reset with standard endpoint");

        // clear local stirage
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenData");
        delete api.defaults.headers.common["Authorization"];

        const response = await api.post(
          "/auth/password/reset/request/",
          payload,
          {
            timeout: 15000, // Increased timeout
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Password reset response:", response.data);
        return response.data;
      } catch (firstError: any) {
        console.error("First attempt failed with error:", {
          status: firstError.response?.status,
          statusText: firstError.response?.statusText,
          data: firstError.response?.data,
          message: firstError.message,
        });
      }
    } catch (error: any) {
      console.error("Password reset request failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  passwordResetConfirm: async (data: {
    new_password1: string;
    new_password2: string;
  }) => {
    try {
      // Get email, OTP, and token from localStorage
      const resetEmail = localStorage.getItem("resetEmail");
      const resetOtp = localStorage.getItem("resetOtp");
      const resetToken = localStorage.getItem("resetToken");

      if (!resetEmail || !resetOtp) {
        throw new Error(
          "No email or OTP found for password reset. Please restart the password reset process."
        );
      }

      console.log("API: Attempting to confirm password reset");
      const response = await api.post(
        "/auth/password/reset/change/",
        {
          email: resetEmail.trim(),
          otp: resetOtp.trim(),
          new_password1: data.new_password1,
          new_password2: data.new_password2,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(resetToken ? { Authorization: `Bearer ${resetToken}` } : {}),
          },
        }
      );
      console.log("API: Password reset confirmation successful");

      // Clear all stored values after successful reset
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("resetOtp");
      localStorage.removeItem("resetToken");

      return response.data;
    } catch (error: any) {
      console.error(
        "API: Password reset confirmation failed with detailed error:",
        {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        }
      );

      if (error.response?.data) {
        error.detail = error.response.data.detail || error.response.data;
      }

      throw error;
    }
  },

  passwordChange: async (new_password1: string, new_password2: string) => {
    try {
      // console.log("API: Attempting to change password");
      const response = await api.post("/auth/password/change/", {
        new_password1,
        new_password2,
      });
      // console.log("API: Password change successful");
      return response.data;
    } catch (error: any) {
      console.error("API: Password change failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      if (error.response?.data) {
        error.detail = error.response.data.detail || error.response.data;
      }

      throw error;
    }
  },

  deleteUser: async () => {
    try {
      // console.log("API: Attempting to delete user account...");
      const response = await api.delete("/auth/user/");
      // console.log("API: User account deleted successfully");
      // Clear auth tokens after successful deletion
      clearAuthToken();
      return response.data;
    } catch (error: any) {
      console.error("API: Delete user account failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // Include the detailed response in the error
      if (error.response?.data) {
        error.detail = error.response.data;
      }

      throw error;
    }
  },
};

// ✅ User API calls
export const userAPI = {
  getProfile: async () => {
    try {
      // console.log("API: Attempting to fetch user profile...")
      const token = getAuthToken();
      if (token) {
        setAuthToken(token);
        const response = await api.get("/auth/me");
        // console.log("API: Profile fetch successful, response status:", response.status)
        return response.data;
      } else {
        console.error("please login first");
      }
    } catch (error: any) {
      console.error("API: Profile fetch failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // Include the detailed response in the error
      if (error.response?.data) {
        error.detail = error.response.data;
      }

      throw error;
    }
  },

  deleteUserById: async (userId: string) => {
    try {
      console.log("API: Attempting to delete user by ID:", userId);
      const response = await api.delete(`/auth/users/${userId}/`);
      console.log(
        "API: User deletion successful, response status:",
        response.status
      );
      return response.data;
    } catch (error: any) {
      console.error("API: Delete user by ID failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // Include the detailed response in the error
      if (error.response?.data) {
        error.detail = error.response.data;
      }

      throw error;
    }
  },

  updatePreferences: async (data: { role: string }) => {
    try {
      // console.log("API: Attempting to update user preferences...")
      const response = await api.put("/user/preferences", data);
      // console.log("API: Preferences update successful, response status:", response.status)
      return response.data;
    } catch (error: any) {
      console.error("API: Preferences update failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // Include the detailed response in the error
      if (error.response?.data) {
        error.detail = error.response.data;
      }

      throw error;
    }
  },

  updateProfile: async (userData: {
    first_name?: string;
    last_name?: string;
    username?: string;
    avatar?: string;
  }) => {
    try {
      // console.log("API: Attempting profile update with data:", userData)

      // Get the current user's ID from the auth token
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token is missing");
      }
      setAuthToken(token);

      // Get current user profile to get the ID
      const currentUser = await api.get("/auth/me");
      const userId = currentUser.data.id;

      if (!userId) {
        throw new Error("User ID not found");
      }

      // Use the correct endpoint with user ID
      const response = await api.patch(`/auth/users/${userId}/`, userData);
      // console.log("API: Profile update successful, response status:", response.status)

      return response.data;
    } catch (error: any) {
      console.error("API: Profile update failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // Include the detailed response in the error
      if (error.response?.data) {
        error.detail = error.response.data;
      }

      throw error;
    }
  },
  // upload avatar image with patch /auth/user/update-avatar/ save as string

  uploadAvatar: async (avatarUrl: string) => {
    try {
      console.log("API: Attempting to upload avatar with URL:", avatarUrl);
      const response = await api.patch("/auth/update-user-avatar/", {
        avatar_url: avatarUrl,
      });
      console.log(
        "API: Avatar upload successful, response status:",
        response.status
      );
      return response.data.avatar_url;
    } catch (error: any) {
      console.error("API: Avatar upload failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // Include the detailed response in the error
      if (error.response?.data) {
        error.detail = error.response.data;
      }

      throw error;
    }
  },

  resendVerificationOtp: async (email: string) => {
    // console.log("Attempting to resend verification OTP for email:", email)
    try {
      const response = await api.post(`/auth/email/verify/request/`, {
        email: email.trim(),
      });
      // console.log("Successfully sent verification OTP")
      return response.data;
    } catch (error) {
      console.error("Failed to resend verification OTP:", error);
      throw error;
    }
  },
};

// Debugging API
export const debugAPI = {
  checkEndpoint: async () => {
    try {
      const response = await api.get("/");
      return {
        status: response.status,
        data: response.data,
        success: true,
      };
    } catch (error: any) {
      return {
        status: error.response?.status,
        data: error.response?.data,
        error: error.message,
        success: false,
      };
    }
  },
};

// Chat API calls
export const chatAPI = {
  // create chat session
  createChatSession: async (data: {
    chat_title: string;
    unique_chat_id?: string;
    user: string;
  }) => {
    try {
      // console.log("API: Creating new chat session with data:", data);
      const response = await api.post(`/chat-sessions/`, data);
      // console.log("API: Chat session created successfully, response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("API: Create chat session failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      throw error;
    }
  },

  // Get all chat sessions for the current user
  getChatSessions: async () => {
    try {
      // Check if user is authenticated before making the request
      const token = localStorage.getItem("authToken");
      if (!token) {
        // console.log("User not authenticated, skipping chat sessions fetch");
        return [];
      }

      // console.log("API: Fetching all chat sessions");
      const response = await api.get(`/chat-sessions/`);
      // console.log("API: Chat sessions fetched successfully, count:", response.data.length);
      return response.data;
    } catch (error: any) {
      // If unauthorized, return empty array instead of throwing error
      if (error.response?.status === 401) {
        // console.log("User not authenticated, returning empty chat sessions list");
        return [];
      }

      console.error("API: Fetch chat sessions failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      throw error;
    }
  },

  getChatSession: async (sessionId: string) => {
    try {
      const response = await api.get(`/chat-sessions/${sessionId}/`);
      return response.data;
    } catch (error: any) {
      console.error("API: Fetch chat session failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      throw error;
    }
  },

  // Delete a chat session by ID
  deleteChatSession: async (sessionId: string) => {
    try {
      console.log("API: Deleting chat session:", sessionId);
      const response = await api.delete(`/chat-sessions/${sessionId}/`);
      console.log(
        "API: Chat session deleted successfully, response status:",
        response.status
      );
      return response.data;
    } catch (error: any) {
      console.error("API: Delete chat session failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      throw error;
    }
  },

  // delete all chat session for the current user
  deleteAllChatSessions: async () => {
    try {
      console.log("API: Deleting all chat sessions for the current user");
      const response = await api.delete(
        `/chat-sessions/delete_all_my_sessions/`
      );
      console.log(
        "API: All chat sessions deleted successfully, response status:",
        response.status
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "API: Delete all chat sessions failed with detailed error:",
        {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        }
      );
      throw error;
    }
  },

  getChatsBySession: async (sessionId: string) => {
    try {
      const response = await api.get(`/chats/session/${sessionId}/`);
      // console.log("uchehe" , sessionId);
      return response.data;
    } catch (error: any) {
      console.error("API: Fetch chats failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  getSessionsMine: async () => {
    try {
      const response = await api.get(`/chat-sessions/mine/`);
      return response.data;
    } catch (error: any) {
      console.error("API: fetch sessions failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  postNewChat: async (
    message: string,
    sessionId?: string,
    options?: {
      imageUrls?: string[];
      image_url?: string;
      file?: File | string;
      properties?: string;
      classification?: string;
      signal?: AbortSignal;
      config?: AxiosRequestConfig;
    }
  ): Promise<ChatMessageResponse> => {
    try {
      console.log(
        "API: Posting new chat message to session:",
        sessionId,
        "with message:",
        message
      );
      console.log("API: Received options:", options);

      // Ensure auth token is set
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token is missing");
      }
      setAuthToken(token);

      // Use FormData for multipart/form-data when we have files
      const hasFile = options?.file instanceof File;
      let requestData: FormData | Record<string, unknown>;
      let requestConfig: AxiosRequestConfig;

      if (hasFile) {
        // Use FormData for file uploads
        requestData = new FormData();
        requestData.append("prompt", message.trim());
        requestData.append("original_prompt", message.trim());

        if (sessionId) {
          requestData.append("session", sessionId);
        }

        // Add image URL if provided
        if (options?.image_url) {
          requestData.append("image_url", options.image_url);
        } else if (options?.imageUrls && options.imageUrls.length > 0) {
          requestData.append("image_url", options.imageUrls[0]); // Use first image URL
        }

        // Add file if provided
        if (options?.file instanceof File) {
          requestData.append("file", options.file);
        }

        // Add other optional fields
        if (options?.properties) {
          requestData.append("properties", options.properties);
        }
        if (options?.classification) {
          requestData.append("classification", options.classification);
        }

        requestConfig = {
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type, let browser set it with boundary for FormData
          },
          ...(options?.signal && { signal: options.signal }),
          ...options?.config,
        };
      } else {
        // Use JSON for regular requests without files
        requestData = {
          prompt: message.trim(),
          original_prompt: message.trim(),
          ...(sessionId && { session: sessionId }),
        };

        // Add image URL if provided
        if (options?.image_url) {
          requestData.image_url = options.image_url;
        } else if (options?.imageUrls && options.imageUrls.length > 0) {
          requestData.image_url = options.imageUrls[0]; // Use first image URL
        }

        // Add other optional fields
        if (options?.properties) {
          requestData.properties = options.properties;
        }
        if (options?.classification) {
          requestData.classification = options.classification;
        }

        requestConfig = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          ...(options?.signal && { signal: options.signal }),
          ...options?.config,
        };
      }

      console.log(
        "API: Final request data:",
        hasFile ? "FormData with file" : requestData
      );

      const response = await api.post(
        `/chats/ai-chat/`,
        requestData,
        requestConfig
      );

      console.log("API: Chat response received:", response.data);

      // Create a complete message object with both prompt and response
      const messageObj: ChatMessageResponse = {
        id: response.data.id,
        prompt: message.trim(), // Include the original prompt
        original_prompt: response.data.original_prompt || message.trim(), // Include original prompt
        response: response.data.response || response.data.message || "", // Handle different response formats
        session: sessionId || response.data.session, // Use the original session ID if provided
        context: response.data.context || [], // Include context if available
        classification: response.data.classification || "", // Include classification if available
        created_at: response.data.created_at || new Date().toISOString(),
        updated_at: response.data.updated_at || new Date().toISOString(),
        file: response.data.file || null, // Include file if available
        image_url: response.data.image_url || null, // Include image URL if available
        imageUrls:
          options?.imageUrls ||
          (response.data.image_url ? [response.data.image_url] : undefined), // Preserve imageUrls array
        properties: response.data.properties || null, // Include properties if available
        reaction: response.data.reaction || null, // Include reaction if available
        embeddings: response.data.embeddings || null, // Include embeddings if available
      };

      console.log("API: New chat message posted successfully:", messageObj);

      return messageObj;
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error("API: post new chats failed with detailed error:", {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message,
        stack: axiosError.stack,
      });

      // Add more specific error handling
      if (axiosError.response?.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      } else if (axiosError.response?.status === 500) {
        throw new Error("Server error occurred. Please try again later.");
      }

      throw error;
    }
  },

  //chat ai edit the endpoint is /chat/ai-chat/{id}/ and it is put it accept prommpt and sessionid are compulsory

  editChat: async (
    chatId: string,
    prompt: string,
    session: string
  ): Promise<ChatMessageResponse> => {
    try {
      // Validate required parameters
      if (!chatId) throw new Error("Message ID is required");
      if (!session) throw new Error("Session ID is required");
      if (!prompt.trim()) throw new Error("Message cannot be empty");

      const token = getAuthToken();
      if (!token) throw new Error("Authentication token missing");

      console.log("Editing chat", { chatId, session, prompt });

      const response = await api.put(
        `/chats/ai-chat/${chatId}/`,
        {
          prompt: prompt.trim(),
          session: session,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Chat edit success", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Edit failed", {
        chatId,
        error: error.response?.data || error.message,
        session,
      });
      throw error;
    }
  },

  // delete chat by id
  deleteChat: async (chatId: string): Promise<any> => {
    try {
      console.log("API: Deleting chat with ID:", chatId);

      const response = await api.delete(`/chats/${chatId}/delete/`);

      console.log("API: Chat deleted successfully");
      return response.data;
    } catch (error: any) {
      console.error("API: Delete chat failed:", {
        status: error.response?.status,
        error: error.response?.data?.error,
        message: error.response?.data?.message || error.message,
      });

      throw new Error(error.response?.data?.error || "Failed to delete chat");
    }
  },

  // update reaction from user
  updateReaction: async (
    chatId: string,
    reaction: ReactionType,
    sessionId: string
  ): Promise<any> => {
    try {
      console.log(
        "API: Updating reaction for chat ID:",
        chatId,
        "session:",
        sessionId,
        "reaction:",
        reaction
      );

      const response = await api.put(`/chats/ai-chat/${chatId}/`, {
        reaction,
        session: sessionId, // Now including the required session field
      });

      console.log("API: Reaction updated successfully");
      return response.data;
    } catch (error: any) {
      console.error("API: Update reaction failed:", {
        status: error.response?.status,
        error: error.response?.data?.error,
        message: error.response?.data?.message || error.message,
      });

      throw new Error(
        error.response?.data?.error || "Failed to update reaction"
      );
    }
  },

  updateChatSession: async (
    sessionId: string,
    data: {
      chat_title?: string;
      unique_chat_id?: string;
      user?: string;
    }
  ) => {
    try {
      console.log("API: Updating chat session:", sessionId, "with data:", data);
      const response = await api.patch(`/chat-sessions/${sessionId}/`, data);
      console.log(
        "API: Chat session updated successfully, response:",
        response.data
      );
      return response.data;
    } catch (error: any) {
      console.error("API: Update chat session failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },
};

export const searchAPI = {
  // Client-side search implementation
  searchChatSessions: (query: string, sessions: any[]) => {
    if (!Array.isArray(sessions)) {
      console.error("searchChatSessions: sessions is not an array", sessions);
      return []; // Return empty array if sessions is not an array
    }

    if (!query.trim()) return sessions;

    const searchTerm = query.toLowerCase();
    return sessions.filter((session) => {
      // Make sure session exists and has chat_title
      if (!session) return false;
      const title = session.chat_title || "Untitled Chat";
      return title.toLowerCase().includes(searchTerm);
    });
  },

  postSearchHistory: async (data: {
    user: string;
    query: string;
    chat_session: string;
  }) => {
    try {
      console.log("API: Posting search history with data:", data);
      const response = await api.post(`/search-histories/`, data);
      console.log(
        "API: Search history posted successfully, response:",
        response.data
      );
      return response.data;
    } catch (error: any) {
      console.error("API: Post search history failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  getSearchHistories: async () => {
    try {
      console.log("API: Fetching all search histories");
      const response = await api.get(`/search-histories/`);
      console.log(
        "API: Search histories fetched successfully, count:",
        response.data.length
      );
      return response.data;
    } catch (error: any) {
      console.error("API: Fetch search histories failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  getSearchHistoryById: async (searchHistoryId: string) => {
    try {
      console.log("API: Fetching search history by ID:", searchHistoryId);
      const response = await api.get(`/search-histories/${searchHistoryId}/`);
      console.log(
        "API: Search history fetched successfully, response:",
        response.data
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "API: Fetch search history by ID failed with detailed error:",
        {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        }
      );
      throw error;
    }
  },

  deleteSearchHistory: async (searchHistoryId: string) => {
    try {
      console.log("API: Deleting search history:", searchHistoryId);
      const response = await api.delete(
        `/search-histories/${searchHistoryId}/`
      );
      console.log(
        "API: Search history deleted successfully, response:",
        response.data
      );
      return response.data;
    } catch (error: any) {
      console.error("API: Delete search history failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },
};

export const UserReviews = {
  // post reviews
  postReview: async (data: {
    address: string;
    review_text: string;
    user: string;
    rating: number;
    chat_session: string;
    evidence: string;
  }) => {
    try {
      console.log("API: Posting review with data:", data);
      const response = await api.post(`/reviews/`, data);
      console.log("API: Review posted successfully, response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("API: Post review failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },
};

export const landlordAPI = {
  // post agent reviews
  // the payload is just the user id, so i wam sending just the authenticated user id as payload to the backend

postAgentRequest: async (data: {
  phone: string;
  verification_document: string;
}) => {
  try {
    console.log("API: Posting agent request with data:", data);
    const response = await api.post(`/auth/agent-requests/`, data);
    console.log("API: Agent request posted successfully, response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("API: Post agent request failed with detailed error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
},
};

export default api;
