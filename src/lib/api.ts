"use client";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';

// Define base API URL (replace with your actual backend URL)
const BASE_URL = "https://0gk1uxsrcg.execute-api.eu-north-1.amazonaws.com/prod"

// Create an Axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('authToken')
      ? { Authorization: `Bearer ${window.localStorage.getItem('authToken')}` }
      : {}),
    Accept: 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: { resolve: (value: AxiosResponse<any>) => void; reject: (error: AxiosError) => void }[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null): void => {
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

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Don't attempt to refresh token for login/register endpoints
    const isAuthEndpoint = originalRequest.url?.includes('/auth/token') || 
                          originalRequest.url?.includes('/auth/register');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
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
        const refreshToken = typeof window !== 'undefined' && window.localStorage.getItem('refreshToken');

        if (!refreshToken) {
          // Clear tokens and reject if no refresh token
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          delete api.defaults.headers.common["Authorization"];
          return Promise.reject(error);
        }

        const response = await axios.post<{ access: string }>(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access: newAccessToken } = response.data;

        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', newAccessToken);
          api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError: any) {
        // If refresh fails, clear all tokens and reject
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        delete api.defaults.headers.common["Authorization"];
        
        processQueue(refreshError, null);
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);


// ✅ Function to set auth token in headers
export const setAuthToken = (token: string) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    localStorage.setItem("authToken", token)
  } else {
    delete api.defaults.headers.common["Authorization"]
    localStorage.removeItem("authToken")
  }
}

// ✅ Function to get auth token
export const getAuthToken = () => {
  return localStorage.getItem("authToken")
}

// ✅ Function to clear auth token
export const clearAuthToken = () => {
  localStorage.removeItem("authToken")
  delete api.defaults.headers.common["Authorization"]
}

// ✅ Export resetPassword function for direct import
export const resetPassword = async (data: {
  new_password1: string
  new_password2: string
  uid: string
  token: string
}) => {
  // Map the parameters to match what the backend expects
  const payload = {
    uid: data.uid,
    token: data.token,
    new_password: data.new_password1,
    confirm_password: data.new_password2
  }
  const response = await api.post("/auth/password/reset/confirm", payload)
  return response.data
}

// ✅ Function to check if the current auth token is valid
export const verifyToken = async (): Promise<boolean> => {
  try {
    const token = getAuthToken()
    if (!token) return false

    // Set the token in the headers
    setAuthToken(token)

    // Try to fetch user profile - this will fail if token is invalid
    const response = await api.get("/auth/user")
    return response.status === 200
  } catch (error) {
    console.error("Token verification error:", error)
    clearAuthToken() // Clear invalid token
    return false
  }
}

// ✅ Auth API calls
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      console.log("API: Attempting login with email:", email)

      // Clear any existing tokens before login attempt
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      delete api.defaults.headers.common["Authorization"];

      const response = await api.post("/auth/login/", {
        email: email.trim(),
        password: password.trim()
      });

      console.log("API: Login successful, response:", response.data)
      
      // Handle both possible response formats
      const accessToken = response.data.access_token || response.data.access;
      const refreshToken = response.data.refresh_token || response.data.refresh;
      const userData = response.data.user || response.data;

      if (!accessToken) {
        throw new Error("No access token received from server");
      }

      // Store tokens
      localStorage.setItem('authToken', accessToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      return {
        access: accessToken,
        refresh: refreshToken,
        user: userData
      }
    } catch (error: any) {
      console.error("API: Login failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        detail: error.response?.data?.detail
      })

      // Handle specific error cases
      if (error.response?.status === 500) {
        error.detail = "An internal server error occurred. Please try again later.";
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        const errorDetail = error.response?.data?.detail?.toLowerCase() || '';
        
        if (errorDetail.includes("no active account") || errorDetail.includes("invalid credentials")) {
          error.detail = "The email or password you entered is incorrect. Please check your credentials and try again.";
        } else if (errorDetail.includes("not verified") || errorDetail.includes("verify")) {
          error.detail = "Please verify your email before logging in. If you haven't received a verification email, try signing up again.";
        } else {
          error.detail = "Invalid email or password. Please check your credentials and try again.";
        }
      } else if (error.response?.data?.detail) {
        error.detail = error.response.data.detail;
      } else {
        error.detail = "An error occurred during login. Please try again.";
      }

      throw error;
    }
  },

  signup: async (userData: {
    username: string
    email: string
    first_name: string
    last_name: string
    password: string
  }) => {
    const response = await api.post("/auth/register/", userData)
    // Return the entire response so we can handle different response structures
    return response
  },

  verifyEmail: async (email: string, otp: string) => {
    try {
      console.log("API: Attempting to verify email with payload:", { email, otp });
      const response = await api.post("/auth/email/verify/confirm/", {
        email: email.trim(),
        otp: otp.trim()
      }, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      console.log("API: Email verification successful, response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("API: Email verification failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
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
      console.log("API: Attempting to verify password reset OTP with payload:", { email, otp });
      const response = await api.post("/auth/password/reset/confirm", {
        email: email.trim(),
        otp: otp.trim()
      }, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      console.log("API: Password reset OTP verification successful, response:", response.data);
      
      // Store email, OTP, and any token received from the response
      localStorage.setItem('resetEmail', email.trim());
      localStorage.setItem('resetOtp', otp.trim());
      if (response.data.token) {
        localStorage.setItem('resetToken', response.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      console.error("API: Password reset OTP verification failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        details: error.response?.data?.detail || error.response?.data
      });

      // Include the detailed response in the error
      if (error.response?.data) {
        error.detail = error.response.data.detail || error.response.data;
      }

      throw error;
    }
  },

  logout: async () => {
    const response = await api.post("/auth/logout")
    return response.data
  },
  requestPasswordReset: async (email: string) => {
    try {
      // Ensure email is properly formatted in the request
      const payload = { email: email.trim() }
      console.log("Sending password reset request with payload:", payload)

      // First attempt: standard endpoint without trailing slash
      try {
        console.log("Attempting password reset with standard endpoint");
        const response = await api.post("/auth/password/reset/request/", payload, {
          timeout: 15000, // Increased timeout
          headers: {
            "Content-Type": "application/json",
          }
        });
        console.log("Password reset response:", response.data);
        return response.data;
      } catch (firstError: any) {
        console.error("First attempt failed with error:", {
          status: firstError.response?.status,
          statusText: firstError.response?.statusText,
          data: firstError.response?.data,
          message: firstError.message
        });
      }
    } catch (error: any) {
      console.error("Password reset request failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  

  passwordResetConfirm: async (data: {
    new_password1: string
    new_password2: string
  }) => {
    try {
      // Get email, OTP, and token from localStorage
      const resetEmail = localStorage.getItem('resetEmail');
      const resetOtp = localStorage.getItem('resetOtp');
      const resetToken = localStorage.getItem('resetToken');
      
      if (!resetEmail || !resetOtp) {
        throw new Error("No email or OTP found for password reset. Please restart the password reset process.");
      }

      console.log("API: Attempting to confirm password reset");
      const response = await api.post("/auth/password/reset/change/", {
        email: resetEmail.trim(),
        otp: resetOtp.trim(),
        new_password1: data.new_password1,
        new_password2: data.new_password2
      }, {
        headers: {
          "Content-Type": "application/json",
          ...(resetToken ? { "Authorization": `Bearer ${resetToken}` } : {})
        }
      });
      console.log("API: Password reset confirmation successful");
      
      // Clear all stored values after successful reset
      localStorage.removeItem('resetEmail');
      localStorage.removeItem('resetOtp');
      localStorage.removeItem('resetToken');
      
      return response.data;
    } catch (error: any) {
      console.error("API: Password reset confirmation failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.data) {
        error.detail = error.response.data.detail || error.response.data;
      }
      
      throw error;
    }
  },
  passwordChange: async (new_password1: string, new_password2: string) => {
    try {
      console.log("API: Attempting to change password");
      const response = await api.post("/auth/password/change/", {
        new_password1,
        new_password2
      });
      console.log("API: Password change successful");
      return response.data;
    } catch (error: any) {
      console.error("API: Password change failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.data) {
        error.detail = error.response.data.detail || error.response.data;
      }
      
      throw error;
    }
  },
  deleteUser: async () => {
    try {
      console.log("API: Attempting to delete user account...");
      const response = await api.delete("/auth/user/");
      console.log("API: User account deleted successfully");
      // Clear auth tokens after successful deletion
      clearAuthToken();
      return response.data;
    } catch (error: any) {
      console.error("API: Delete user account failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      // Include the detailed response in the error
      if (error.response?.data) {
        error.detail = error.response.data;
      }

      throw error;
    }
  },
}

// ✅ User API calls
export const userAPI = {
  getProfile: async () => {
    try {
      console.log("API: Attempting to fetch user profile...")
      const token = getAuthToken();
      if (token) {
        setAuthToken(token)
        const response = await api.get("/auth/me")
        console.log("API: Profile fetch successful, response status:", response.status)
        return response.data
      } else {
        console.error("please login first");
      }
    } catch (error: any) {
      console.error("API: Profile fetch failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })

      // Include the detailed response in the error
      if (error.response?.data) {
        error.detail = error.response.data
      }

      throw error
    }
  },

  deleteUserById: async (userId: string) => {
    try {
      console.log("API: Attempting to delete user by ID:", userId);
      const response = await api.delete(`/auth/users/${userId}/`);
      console.log("API: User deletion successful, response status:", response.status);
      return response.data;
    } catch (error: any) {
      console.error("API: Delete user by ID failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
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
      console.log("API: Attempting to update user preferences...")
      const response = await api.put("/user/preferences", data)
      console.log("API: Preferences update successful, response status:", response.status)
      return response.data
    } catch (error: any) {
      console.error("API: Preferences update failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })

      // Include the detailed response in the error
      if (error.response?.data) {
        error.detail = error.response.data
      }

      throw error
    }
  },

  updateProfile: async (userData: {
    first_name?: string
    last_name?: string
    username?: string
  }) => {
    try {
      console.log("API: Attempting profile update with data:", userData)

      // Use PATCH instead of PUT to update only the specified fields instead of replacing the entire resource
      const response = await api.patch("/auth/user", userData)
      console.log("API: Profile update successful, response status:", response.status)

      return response.data
    } catch (error: any) {
      console.error("API: Profile update failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })

      // Include the detailed response in the error
      if (error.response?.data) {
        error.detail = error.response.data
      }

      throw error
    }
  },

  resendVerificationOtp: async (email: string) => {
    console.log("Attempting to resend verification OTP for email:", email)
    try {
      const response = await api.post(`/auth/email/verify/request/`, {
        email: email.trim()
      })
      console.log("Successfully sent verification OTP")
      return response.data
    } catch (error) {
      console.error("Failed to resend verification OTP:", error)
      throw error
    }
  },
}
// Debugging API
export const debugAPI = {
  checkEndpoint: async () => {
    try {
      const response = await api.get('/')
      return {
        status: response.status,
        data: response.data,
        success: true
      }
    } catch (error: any) {
      return {
        status: error.response?.status,
        data: error.response?.data,
        error: error.message,
        success: false
      }
    }
  }
}

// Chat API calls
export const chatAPI = {
// create chat session
  createChatSession: async (data: { 
    chat_title: string; 
    unique_chat_id?: string; 
    user: string;
  }) => {
    try {
      console.log("API: Creating new chat session with data:", data);
      const response = await api.post(`/chat-sessions/`, data);
      console.log("API: Chat session created successfully, response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("API: Create chat session failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      throw error;
    }
  },

  // Get all chat sessions for the current user
  getChatSessions: async () => {
    try {
      // Check if user is authenticated before making the request
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log("User not authenticated, skipping chat sessions fetch");
        return [];
      }

      console.log("API: Fetching all chat sessions");
      const response = await api.get(`/chat-sessions/`);
      console.log("API: Chat sessions fetched successfully, count:", response.data.length);
      return response.data;
    } catch (error: any) {
      // If unauthorized, return empty array instead of throwing error
      if (error.response?.status === 401) {
        console.log("User not authenticated, returning empty chat sessions list");
        return [];
      }

      console.error("API: Fetch chat sessions failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
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
        message: error.message
      });

      throw error;
    }
  },

  // Delete a chat session by ID
  deleteChatSession: async (sessionId: string) => {
    try {
      console.log("API: Deleting chat session:", sessionId);
      const response = await api.delete(`/chat-sessions/${sessionId}/`);
      console.log("API: Chat session deleted successfully, response status:", response.status);
      return response.data;
    } catch (error: any) {
      console.error("API: Delete chat session failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      throw error;
    }
  },

  getChatsBySession: async (sessionId: string) => {
    try {
      const response = await api.get(`/chats/session/${sessionId}/`);
      console.log("uchehe" , sessionId);
      return response.data;
    } catch (error: any) {
      console.error("API: Fetch chats failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
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
        message: error.message
      });
      throw error;
    }
  },

  postNewChat: async (message: string, sessionId?: string) => {
    try {
      console.log("API: Posting new chat message to session:", sessionId, "with message:", message);
      
      // Ensure auth token is set
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token is missing");
      }
      setAuthToken(token);

      // Construct request data
      const data = {
        prompt: message.trim(),
        ...(sessionId && { session_id: sessionId })  // Use session_id instead of session
      };

      console.log("API: Sending chat request with data:", data);
      
      const response = await api.post(`/chats/ai-chat/`, data, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      console.log("API: Chat response received:", response.data);

      // Create a complete message object with both prompt and response
      const messageObj = {
        id: response.data.id,
        prompt: message.trim(),  // Include the original prompt
        response: response.data.response || response.data.message || "",  // Handle different response formats
        session: sessionId || response.data.session_id,
        created_at: response.data.created_at || new Date().toISOString(),
        updated_at: response.data.updated_at || new Date().toISOString()
      };

      return messageObj;
    } catch (error: any) {
      console.error("API: post new chats failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      });

      // Add more specific error handling
      if (error.response?.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      } else if (error.response?.status === 500) {
        throw new Error("Server error occurred. Please try again later.");
      }

      throw error;
    }
  },


  updateChatSession: async (sessionId: string, data: {
    chat_title?: string;
    unique_chat_id?: string;
    user?: string;
  }) => {
    try {
      console.log("API: Updating chat session:", sessionId, "with data:", data);
      const response = await api.patch(`/chat-sessions/${sessionId}/`, data);
      console.log("API: Chat session updated successfully, response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("API: Update chat session failed with detailed error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }
}

export default api

