"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { authAPI, userAPI, clearAuthToken, getAuthToken, setAuthToken, verifyToken } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"

// ✅ Define user type
export interface User {
  id?: string
  username: string
  email: string
  password?: string
  first_name: string
  last_name: string
  type: "user" | "admin"  // Required field with limited options
  is_superuser?: boolean
  is_staff?: boolean
  is_active?: boolean
  last_login?: string
  date_joined?: string
  subscription_type?: "free" | "premium" | "pro"
  subscription_start_date?: string
  subscription_end_date?: string
  created_at?: string
  updated_at?: string
  groups?: number[]
  user_permissions?: number[]
  avatar?: string  // Custom field for UI purposes
}

// ✅ Define auth context type
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (userData: {
    username: string
    email: string
    first_name: string
    last_name: string
    password: string
  }) => Promise<boolean> // Return success status
  logout: () => void
  requestPasswordReset: (email: string) => Promise<void>
  updateProfile: (userData: Partial<User>) => Promise<boolean>
  signupWithProvider?: (provider: "google" | "apple") => Promise<void>
}

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

  // 🔹 Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Auth context: Checking authentication status...")
      setIsLoading(true)

      try {
        const token = getAuthToken()
        if (!token) {
          console.log("Auth context: No token found")
          setIsLoading(false)
          return
        }

        console.log("Auth context: Token found, verifying...")

        // Verify token before setting it
        const isValid = await verifyToken()

        if (!isValid) {
          console.log("Auth context: Token is invalid, clearing session")
          clearAuthToken()
          setUser(null)
          setIsLoading(false)
          return
        }

        // Token is valid, get user data
        console.log("Auth context: Token is valid, fetching user profile...")
        setAuthToken(token)
        const userData = await userAPI.getProfile()

        if (userData) {
          console.log("Auth context: User profile retrieved successfully")
          setUser({
            id: userData.id,
            username: userData.username || userData.email.split("@")[0],
            email: userData.email,
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            type: userData.type || "user" as "user" | "admin",
            subscription_type: userData.subscription_type,
            subscription_start_date: userData.subscription_start_date,
            subscription_end_date: userData.subscription_end_date,
            is_active: userData.is_active,
            avatar: userData.avatar || "/placeholder.svg",
            date_joined: userData.date_joined,
            last_login: userData.last_login
          })
        } else {
          console.log("Auth context: User profile is empty or invalid")
          clearAuthToken()
          setUser(null)
        }
      } catch (error) {
        console.error("Auth context: Authentication error:", error)
        clearAuthToken()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    // Run the auth check
    checkAuth()
  }, [])

  // 🔹 Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    let success = false

    try {
      console.log("Auth context: Attempting login...")

      // Clear any existing tokens before attempting login
      clearAuthToken()

      const response = await authAPI.login(email, password)
      console.log("Auth context: Login response:", response)

      // Extract data from the response based on the actual API structure
      // The response might contain access, refresh tokens and user info
      const responseData = response

      if (!responseData || !responseData.access) {
        console.error("Auth context: Invalid login response structure:", responseData)
        throw new Error("Invalid login response structure")
      }

      // Extract the access token and user data
      const token = responseData.access
      const refresh = responseData.refresh
      const apiUser = responseData.user

      localStorage.setItem("authToken", token);
      localStorage.setItem("refreshToken", refresh);

      console.log("Auth context: Login successful, fetching user profile...")

      if (!apiUser) {
        setAuthToken(token)
        try {
          const userData = await userAPI.getProfile()
          console.log("Auth context: Fetched user profile after login:", userData)
          const userObj: User = {
            id: userData.id || userData.pk,
            username: userData.username || userData.email.split("@")[0],
            email: userData.email,
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            type: userData.type,
            subscription_type: userData.subscription_type,
            subscription_start_date: userData.subscription_start_date,
            subscription_end_date: userData.subscription_end_date,
            is_active: userData.is_active,
            avatar: userData.avatar || "/placeholder.svg",
            date_joined: userData.date_joined,
            last_login: userData.last_login
          }

          setUser(userObj)
        } catch (profileError: any) {
          console.error("Auth context: Failed to fetch user profile after login:", profileError)
          // Clear token if profile fetch fails
          clearAuthToken()
          throw new Error("Could not fetch user profile: " + (profileError.message || "Unknown error"))
        }
      } else {
        // If user data is included in login response
        setAuthToken(token)

        // Create a user object from the login API response
        const userObj: User = {
          id: apiUser.id || apiUser.pk,
          username: apiUser.username || apiUser.email.split("@")[0],
          email: apiUser.email,
          first_name: apiUser.first_name || "",
          last_name: apiUser.last_name || "",
          type: apiUser.type || "user",
          subscription_type: apiUser.subscription_type,
          subscription_start_date: apiUser.subscription_start_date,
          subscription_end_date: apiUser.subscription_end_date,
          is_active: apiUser.is_active,
          avatar: apiUser.avatar || "/placeholder.svg",
          date_joined: apiUser.date_joined,
          last_login: apiUser.last_login
        }

        setUser(userObj)
      }

      // Mark as successful
      success = true
      console.log("Auth context: Login successful, will navigate to dashboard")

      // Navigate to dashboard
      router.push("/")
      return true
    } catch (error: any) {
      // Log the full error for debugging
      console.error("Auth context: Login error details:", {
        error,
        response: error.response,
        data: error.response?.data || error.detail, // Include the detail we added
        status: error.response?.status,
        message: error.message
      })

      // Display a toast with the error message
      let errorMessage = "Invalid email or password. Please try again."

      if (error.response?.status === 401) {
        errorMessage = "Invalid credentials. Please check your email and password."
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.detail) {
        errorMessage = typeof error.detail === 'string' ? error.detail : 'Authentication failed'
      }

      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive"
      })

      // Re-throw the error to be caught by the component
      throw error
    } finally {
      setIsLoading(false)
    }

    return success
  }

  // 🔹 Signup function - FIXED to handle the specific API response format
  const signup = async (userData: {
    username: string
    email: string
    first_name: string
    last_name: string
    password: string
  }): Promise<boolean> => {
    setIsLoading(true)
    let success = false

    try {
      console.log("Auth context: Attempting signup...")
      const response = await authAPI.signup(userData)
      console.log("Auth context: Signup response:", response)

      // Extract data from the response based on the actual API structure
      // The response contains data.data which has access, refresh tokens and user info
      const responseData = response.data

      if (!responseData || !responseData.access || !responseData.user) {
        console.error("Auth context: Invalid signup response structure:", responseData)
        throw new Error("Invalid signup response structure")
      }

      // Extract the access token and user data
      const token = responseData.access
      const apiUser = responseData.user

      // Create a user object from the API response
      const userObj: User = {
        id: apiUser.pk || apiUser.id,
        username: apiUser.username || apiUser.email.split("@")[0],
        email: apiUser.email,
        first_name: apiUser.first_name || "",
        last_name: apiUser.last_name || "",
        type: apiUser.type,
        subscription_type: apiUser.subscription_type,
        subscription_start_date: apiUser.subscription_start_date,
        subscription_end_date: apiUser.subscription_end_date,
        is_active: apiUser.is_active,
        avatar: apiUser.avatar || "/placeholder.svg",
        date_joined: apiUser.date_joined,
        last_login: apiUser.last_login
      }

      // Set user and token
      setUser(userObj)
      setAuthToken(token)

      // Mark as successful
      success = true
      console.log("Auth context: Signup successful, will navigate to verify")

      // Navigate to verify page
      router.push("/signin")
      return true
    } catch (error: any) {
      // Log the full error for debugging
      console.error("Auth context: Signup error details:", {
        error,
        response: error.response,
        data: error.response?.data.username,
        status: error.response?.status,
      })

      // Re-throw the error to be caught by the component
      throw error
    } finally {
      setIsLoading(false)
    }

    return success
  }

  const requestPasswordReset = async (email: string) => {
    try {
      const response = await authAPI.requestPasswordReset(email);
      console.log("Password reset response:", response);
      return response;
    } catch (error: any) {
      console.error("Password reset request failed:", error);

      // Log the exact server response
      if (error.response) {
        console.error("Error Response Data:", error.response.data);
      }

      throw error;
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    setIsLoading(true)
    let success = false

    try {
      console.log("Auth context: Attempting update profile...")

      // We're only allowing updates to basic profile fields
      const allowedFields: Partial<User> = {
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name
      };

      // Remove undefined fields
      Object.keys(allowedFields).forEach(key => {
        if (allowedFields[key as keyof Partial<User>] === undefined) {
          delete allowedFields[key as keyof Partial<User>];
        }
      });

      console.log("Auth context: Updating profile with fields:", allowedFields);

      const response = await userAPI.updateProfile(allowedFields)
      console.log("Auth context: Update profile response:", response)

      // Safely update the user state with the response data
      if (!response) {
        console.error("Auth context: Updated user data is null")
        throw new Error("Updated user data is null")
      }

      // Update only the fields that were returned in the response
      // This ensures we don't lose existing data
      setUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          ...response,
          // Make sure these fields aren't accidentally removed
          avatar: response.avatar || prevUser.avatar,
          subscription_type: response.subscription_type || prevUser.subscription_type,
          subscription_start_date: response.subscription_start_date || prevUser.subscription_start_date,
          subscription_end_date: response.subscription_end_date || prevUser.subscription_end_date,
          is_active: response.is_active !== undefined ? response.is_active : prevUser.is_active,
        };
      });

      // Mark as successful
      success = true
      console.log("Auth context: Update profile successful")

      return success
    } catch (error: any) {
      // Log the full error for debugging
      console.error("Auth context: Update profile error details:", {
        error,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
      })

      // Re-throw the error to be caught by the component
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // 🔹 Logout function
  const logout = () => {
    clearAuthToken()
    setUser(null)
    router.push("/")
  }

  // 🔹 Compute isAuthenticated
  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, signup, logout, requestPasswordReset, updateProfile }}>
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

