"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import api, { authAPI, userAPI, clearAuthToken, getAuthToken, setAuthToken, verifyToken } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import type { AuthContextType, User } from "@/types/user"
import { GoogleOAuthPayload } from "@/types/auth"

// ✅ Create auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  signup: async () => false,
  logout: () => { },
  requestPasswordReset: async () => { },
  updateProfile: async () => false,
  loginWithGoogle: async () => false,
  updateProfileImage: async () => false,
  refreshAccessToken: async () => null, // Add this to your AuthContextType
})

// ✅ Auth provider props
interface AuthProviderProps {
  children: ReactNode
}

// ✅ Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // 🔹 Refresh access token function
  const refreshAccessToken = async(): Promise<string | null> => {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      // console.log("No refresh token available.");
      return null;
    }
  
    try {
      const response = await api.post('/auth/token/refresh/', { refresh: refreshToken }, {
        withCredentials: true,
      });
  
      const newAccessToken = response.data.access_token || response.data.access;
  
      if (newAccessToken) {
        // Save the new access token
        setAuthToken(newAccessToken);
        // console.log("Access token refreshed successfully");
        return newAccessToken;
      }
  
      return null;
    } catch (error) {
      console.error("Failed to refresh access token", error);
      // In case of failure, clear stored tokens and logout
      clearAuthToken();
      localStorage.removeItem('refreshToken');
      setUser(null);
      router.push('/login');
      return null;
    }
  };

  // 🔹 Setup API interceptor for automatic token refresh
  useEffect(() => {
    const setupInterceptors = () => {
      // Request interceptor to add auth token
      const requestInterceptor = api.interceptors.request.use(
        (config) => {
          const token = getAuthToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      // Response interceptor to handle 401 errors and refresh tokens
      const responseInterceptor = api.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;

          if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
              const newToken = await refreshAccessToken();
              if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              // Redirect to login if refresh fails
              logout();
              return Promise.reject(refreshError);
            }
          }

          return Promise.reject(error);
        }
      );

      // Cleanup function
      return () => {
        api.interceptors.request.eject(requestInterceptor);
        api.interceptors.response.eject(responseInterceptor);
      };
    };

    const cleanup = setupInterceptors();
    return cleanup;
  }, []);

  // 🔹 Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      // console.log("Auth context: Checking authentication status...")
      setIsLoading(true)

      try {
        const token = getAuthToken()
        if (!token) {
          console.log("Auth context: No token found")
          setIsLoading(false)
          return
        }

        // console.log("Auth context: Token found, verifying...")

        // Verify token before setting it
        const isValid = await verifyToken()

        if (!isValid) {
          // console.log("Auth context: Token is invalid, trying to refresh...")
          
          // Try to refresh the token
          const newToken = await refreshAccessToken()
          if (!newToken) {
            // console.log("Auth context: Token refresh failed, clearing session")
            clearAuthToken()
            setUser(null)
            setIsLoading(false)
            return
          }
        }

        // Token is valid (or refreshed), get user data
        // console.log("Auth context: Token is valid, fetching user profile...")
        const userData = await userAPI.getProfile()

        if (userData) {
          // console.log("Auth context: User profile retrieved successfully")
          setUser({
            id: userData.id,
            username: userData.username || userData.email.split("@")[0],
            email: userData.email,
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            type: userData.type || "user",
            subscription_type: userData.subscription_type,
            subscription_start_date: userData.subscription_start_date,
            subscription_end_date: userData.subscription_end_date,
            is_active: userData.is_active,
            avatar: userData.avatar || "/placeholder.svg",
            date_joined: userData.date_joined,
            last_login: userData.last_login
          })
        } else {
          // console.log("Auth context: User profile is empty or invalid")
          clearAuthToken()
          localStorage.removeItem('refreshToken')
          setUser(null)
        }
      } catch (error) {
        console.error("Auth context: Authentication error:", error)
        clearAuthToken()
        localStorage.removeItem('refreshToken')
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // 🔹 Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    let success = false

    try {
      console.log("Auth context: Attempting login...")

      // Clear any existing tokens before login attempt
      clearAuthToken()
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('tokenData')
      delete api.defaults.headers.common["Authorization"]
      

      const response = await authAPI.login(email, password)
      // console.log("Auth context: Login response:", response)

      if (!response || !response.access) {
        console.error("Auth context: Invalid login response structure:", response)
        throw new Error("Invalid login response structure")
      }

      // Set both access and refresh tokens
      const token = response.access
      setAuthToken(token)
      
      // Store refresh token if provided
      if (response.refresh) {
        localStorage.setItem('refreshToken', response.refresh)
      }

      // Then fetch user profile
      let userObj: User;
      if (response.user) {
        userObj = {
          id: response.user.id || response.user.pk,
          username: response.user.username || response.user.email.split("@")[0],
          email: response.user.email,
          first_name: response.user.first_name || "",
          last_name: response.user.last_name || "",
          type: response.user.type || "user",
          subscription_type: response.user.subscription_type,
          subscription_start_date: response.user.subscription_start_date,
          subscription_end_date: response.user.subscription_end_date,
          is_active: response.user.is_active,
          avatar: response.user.avatar || "/placeholder.svg",
          date_joined: response.user.date_joined,
          last_login: response.user.last_login
        }
      } else {
        const userData = await userAPI.getProfile()
        userObj = {
          id: userData.id || userData.pk,
          username: userData.username || userData.email.split("@")[0],
          email: userData.email,
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          type: userData.type || "user",
          subscription_type: userData.subscription_type,
          subscription_start_date: userData.subscription_start_date,
          subscription_end_date: userData.subscription_end_date,
          is_active: userData.is_active,
          avatar: userData.avatar || "/placeholder.svg",
          date_joined: userData.date_joined,
          last_login: userData.last_login
        }
      }

      setUser(userObj)
      success = true
      router.push("/")
    } catch (error: any) {
      console.error("Auth context: Login error details:", {
        error,
        response: error.response,
        data: error.response?.data || error.detail,
        status: error.response?.status,
        message: error.message
      })

      clearAuthToken()
      localStorage.removeItem('refreshToken')
      setUser(null)
      throw error
    } finally {
      setIsLoading(false)
    }

    return success
  }

  const loginWithGoogle = async (credentialResponse: GoogleOAuthPayload): Promise<boolean> => {
    setIsLoading(true)
    let success = false

    try {
      console.log("Auth context: Attempting Google login...")

      clearAuthToken()
      localStorage.removeItem('refreshToken')

      const response = await authAPI.loginWithGoogle(credentialResponse)
      console.log("Auth context: Google login response:", response)

      if (!response || !response.access) {
        console.error("Auth context: Invalid Google login response structure:", response)
        throw new Error("Invalid Google login response structure")
      }

      // Set both access and refresh tokens
      const token = response.access
      setAuthToken(token)
      
      // Store refresh token if provided
      if (response.refresh) {
        localStorage.setItem('refreshToken', response.refresh)
      }

      // Then fetch user profile
      let userObj: User;
      if (response.user) {
        userObj = {
          id: response.user.id || response.user.pk,
          username: response.user.username || response.user.email.split("@")[0],
          email: response.user.email,
          first_name: response.user.first_name || "",
          last_name: response.user.last_name || "",
          type: response.user.type || "user",
          subscription_type: response.user.subscription_type,
          subscription_start_date: response.user.subscription_start_date,
          subscription_end_date: response.user.subscription_end_date,
          is_active: response.user.is_active,
          avatar: response.user.avatar || "/placeholder.svg",
          date_joined: response.user.date_joined,
          last_login: response.user.last_login
        }
      } else {
        const userData = await userAPI.getProfile()
        userObj = {
          id: userData.id || userData.pk,
          username: userData.username || userData.email.split("@")[0],
          email: userData.email,
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          type: userData.type || "user",
          subscription_type: userData.subscription_type,
          subscription_start_date: userData.subscription_start_date,
          subscription_end_date: userData.subscription_end_date,
          is_active: userData.is_active,
          avatar: userData.avatar || "/placeholder.svg",
          date_joined: userData.date_joined,
          last_login: userData.last_login
        }
      }

      setUser(userObj)
      success = true
      router.push("/")
    } catch (error: any) {
      console.error("Auth context: Google login error details:", {
        error,
        response: error.response,
        data: error.response?.data || error.detail,
        status: error.response?.status,
        message: error.message
      })

      clearAuthToken()
      localStorage.removeItem('refreshToken')
      setUser(null)
      throw error
    } finally {
      setIsLoading(false)
    }

    return success
  }

  // 🔹 Signup function
  const signup = async (userData: {
    email: string
    first_name: string
    last_name: string
    password: string
  }): Promise<boolean> => {
    setIsLoading(true)
    let success = false

    // Clear any existing tokens before signup attempt (same as login)
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenData');
    delete api.defaults.headers.common["Authorization"];

    try {
      console.log("Auth context: Attempting signup...")
      const signupData = {
        ...userData,
        username: userData.email.split("@")[0]
      }
      const response = await authAPI.signup(signupData)
      console.log("Auth context: Signup response:", response)

      const responseData = response.data

      const userObj: User = {
        id: responseData.id || responseData.pk,
        username: responseData.username,
        email: responseData.email || userData.email,
        first_name: responseData.first_name || userData.first_name,
        last_name: responseData.last_name || userData.last_name,
        type: responseData.type || "user",
        is_active: responseData.is_active !== undefined ? responseData.is_active : true,
        avatar: responseData.avatar || "/placeholder.svg",
        date_joined: responseData.date_joined || new Date().toISOString(),
      }

      setUser(userObj)

      // If there's an access token in the response, set it
      if (responseData.access) {
        setAuthToken(responseData.access)
        
        // Store refresh token if provided
        if (responseData.refresh) {
          localStorage.setItem('refreshToken', responseData.refresh)
        }
      }

      success = true
      console.log("Auth context: Signup successful, will navigate to verify")

      toast({
        title: "Account created",
        description: "Please verify your email to continue.",
      })

      router.push("/verify")
    } catch (error: any) {
      console.error("Auth context: Signup error details:", {
        error,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
      })

      throw error
    } finally {
      setIsLoading(false)
    }

    return success
  }

  const requestPasswordReset = async (email: string) => {
    try {
      const response = await authAPI.requestPasswordReset(email)
      console.log("Password reset response:", response)
      return response
    } catch (error: any) {
      console.error("Password reset request failed:", error)

      if (error.response) {
        console.error("Error Response Data:", error.response.data)
      }

      throw error
    }
  }

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    setIsLoading(true)
    let success = false

    try {
      console.log("Auth context: Attempting update profile...")

      const allowedFields: Partial<User> = {
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        avatar: userData.avatar
      }

      Object.keys(allowedFields).forEach(key => {
        if (allowedFields[key as keyof Partial<User>] === undefined) {
          delete allowedFields[key as keyof Partial<User>]
        }
      })

      console.log("Auth context: Updating profile with fields:", allowedFields)

      const response = await userAPI.updateProfile(allowedFields)
      console.log("Auth context: Update profile response:", response)

      if (!response) {
        console.error("Auth context: Updated user data is null")
        throw new Error("Updated user data is null")
      }

      setUser(prevUser => {
        if (!prevUser) return null
        return {
          ...prevUser,
          ...response,
          avatar: response.avatar || prevUser.avatar,
          subscription_type: response.subscription_type || prevUser.subscription_type,
          subscription_start_date: response.subscription_start_date || prevUser.subscription_start_date,
          subscription_end_date: response.subscription_end_date || prevUser.subscription_end_date,
          is_active: response.is_active !== undefined ? response.is_active : prevUser.is_active,
        }
      })

      success = true
      console.log("Auth context: Update profile successful")
    } catch (error: any) {
      console.error("Auth context: Update profile error details:", {
        error,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
      })

      throw error
    } finally {
      setIsLoading(false)
    }

    return success
  }

  const updateProfileImage = async (avatarUrl: string): Promise<boolean> => {
    setIsLoading(true);
    let success = false;
  
    try {
      console.log("Auth context: Attempting to update profile image...");
  
      const uploadedAvatarUrl = await userAPI.uploadAvatar(avatarUrl);
      console.log("Auth context: Uploaded avatar URL:", uploadedAvatarUrl);
  
      const response = await userAPI.updateProfile({ avatar: uploadedAvatarUrl });
      console.log("Auth context: Update profile image response:", response);
  
      if (!response) {
        console.error("Auth context: Updated user data is null");
        throw new Error("Updated user data is null");
      }
  
      setUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          avatar: uploadedAvatarUrl,
        };
      });
  
      success = true;
      console.log("Auth context: Update profile image successful");
    } catch (error: any) {
      console.error("Auth context: Update profile image error details:", {
        error,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
      });
  
      throw error;
    } finally {
      setIsLoading(false);
    }
  
    return success;
  };

  // 🔹 Logout function
  const logout = () => {
    clearAuthToken()
    localStorage.removeItem('refreshToken')
    setUser(null)
    router.push("/")
  }

  // 🔹 Compute isAuthenticated
  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoading, 
      login, 
      signup, 
      logout, 
      requestPasswordReset, 
      updateProfile, 
      updateProfileImage,
      loginWithGoogle,
      refreshAccessToken  // ✅ Expose refresh function
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ✅ Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}