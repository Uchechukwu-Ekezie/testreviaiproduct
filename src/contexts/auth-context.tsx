"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  authAPI,
  setAuthToken,
  getAuthToken,
  refreshAccessToken,
  userAPI,
} from "@/lib/api";
import type { SignupData } from "@/lib/api/types";

// ✅ User interface matching the API response
export interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  email_verified?: boolean;
  type?: string;
  avatar?: string;
  user_type?: string;
  phone?: string;
  verification_status?: "none" | "pending" | "verified" | "rejected";
  agent_request?: {
    id: string;
    status: "pending" | "approved" | "rejected";
    phone?: string;
    verification_document?: string;
    approved_by?: string | null;
    created_at: string;
    updated_at: string;
  };
  agent_info?: {
    status: "pending" | "approved" | "rejected";
    request_date: string;
    verification_document?: string;
    phone?: string;
  };
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  date_joined?: string;
  subscription_type?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  subscription_status?: string;
  followers_count?: number;
  following_count?: number;
  rating?: number;
  reviews_count?: number;
  location?: string;

  is_following?: (user: User) => boolean;
  follow?: (user: User) => Promise<void>;
  unfollow?: (user: User) => Promise<void>;
}

// ✅ Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    user_type?: "agent" | "landlord";
  }) => Promise<boolean>;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
}

// ✅ Create auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
  refreshAccessToken: async () => null,
});

// ✅ Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// ✅ Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const hasCheckedAuth = useRef(false); // Prevent re-checking auth on navigation

  // ✅ Refresh access token function (working version from your code)
  const refreshAccessTokenFunc = async (): Promise<string | null> => {
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null;

    if (!refreshToken) {
      return null;
    }

    try {
      // Use the refreshAccessToken function from axios-config
      const newAccessToken = await refreshAccessToken();

      if (newAccessToken) {
        // Save the new token with timestamp
        if (typeof window !== "undefined") {
          localStorage.setItem("authToken", newAccessToken);
        }

        // Save token with creation timestamp
        const tokenData = {
          token: newAccessToken,
          timestamp: Date.now(),
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("tokenData", JSON.stringify(tokenData));
        }
        setAuthToken(newAccessToken);

        return newAccessToken;
      }

      return null;
    } catch (error) {
      console.error("Failed to refresh access token", error);
      // In case of failure, clear stored tokens and redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenData");
        localStorage.removeItem("authUser");
        
        // Show a toast or message that session expired
        console.log("Session expired. Please login again.");
      }
      setUser(null);
      
      // Redirect to signin page
      router.push("/signin");
      
      return null;
    }
  };

  // 🔹 Check for existing session on mount (immediate synchronous restoration)
  useEffect(() => {
    // Only check once per app lifetime - prevents re-checking on navigation
    if (hasCheckedAuth.current) {
      return;
    }
    hasCheckedAuth.current = true;

    const checkAuth = async () => {
      setIsLoading(true);

      try {
        // Immediate synchronous restoration
        const savedToken =
          typeof window !== "undefined"
            ? localStorage.getItem("authToken")
            : null;
        const savedUser =
          typeof window !== "undefined"
            ? localStorage.getItem("authUser")
            : null;
        const refreshToken =
          typeof window !== "undefined"
            ? localStorage.getItem("refreshToken")
            : null;

        // New users with no tokens - immediately stop loading
        if (!savedToken && !refreshToken) {
          console.log("Auth context: No tokens found, user not authenticated");
          setUser(null);
          setIsLoading(false);
          return;
        }

        if (savedToken && savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setAuthToken(savedToken);
            setIsLoading(false);
            return; // Exit early if we have saved data
          } catch (error) {
            console.error("Failed to immediately restore auth:", error);
          }
        }

        // Only try server verification if we have a token but no saved user data
        if (savedToken && !savedUser) {
          try {
            setAuthToken(savedToken);

            const userData = await userAPI.getProfile();

            setUser(userData);
            if (typeof window !== "undefined") {
              localStorage.setItem("authUser", JSON.stringify(userData));
            }
          } catch (error) {
            console.error(
              "Auth context: Token verification failed, trying to refresh...",
              error
            );

            // Try to refresh the token only if we have a refresh token
            if (refreshToken) {
              const newToken = await refreshAccessTokenFunc();
              if (newToken) {
                try {
                  const userData = await userAPI.getProfile();
                  setUser(userData);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("authUser", JSON.stringify(userData));
                  }
                } catch (profileError) {
                  console.error(
                    "Auth context: Profile fetch failed after refresh:",
                    profileError
                  );
                  // Clear everything if refresh doesn't help
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("tokenData");
                    localStorage.removeItem("authUser");
                  }
                  setUser(null);
                }
              } else {
                // Token refresh failed - clear everything
                console.log("Token refresh failed. Clearing auth data.");
                if (typeof window !== "undefined") {
                  localStorage.removeItem("authToken");
                  localStorage.removeItem("refreshToken");
                  localStorage.removeItem("tokenData");
                  localStorage.removeItem("authUser");
                }
                setUser(null);
                
                // Redirect to signin page
                router.push("/signin");
              }
            } else {
              // No refresh token, just clear everything
              if (typeof window !== "undefined") {
                localStorage.removeItem("authToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("tokenData");
                localStorage.removeItem("authUser");
              }
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error("Auth context: Authentication error:", error);
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("tokenData");
          localStorage.removeItem("authUser");
        }
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Re-check auth state when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;
      const savedUser =
        typeof window !== "undefined" ? localStorage.getItem("authUser") : null;

      if (token && savedUser && !user) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setAuthToken(token);
        } catch (error) {
          console.error("Failed to restore auth state:", error);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleFocus);
      }
    };
  }, [user]);

  // Periodic check to ensure auth state consistency
  useEffect(() => {
    const interval = setInterval(() => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;
      const savedUser =
        typeof window !== "undefined" ? localStorage.getItem("authUser") : null;
      const isAuthenticated = !!user;

      // If we have tokens in localStorage but not in state, restore them
      if (token && savedUser && !isAuthenticated) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setAuthToken(token);
        } catch (error) {
          console.error(
            "Failed to restore auth state during periodic check:",
            error
          );
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [user]);

  // 🔹 Login function (working version)
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    let success = false;

    try {
      // Clear any existing tokens before login attempt
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenData");
        localStorage.removeItem("authUser");
      }

      const response = await authAPI.login(email, password);

      if (!response || !response.access) {
        console.error(
          "Auth context: Invalid login response structure:",
          response
        );
        throw new Error("Invalid login response structure");
      }

      // Set both access and refresh tokens
      const token = response.access;
      setAuthToken(token);

      // Store refresh token if provided
      if (response.refresh && typeof window !== "undefined") {
        localStorage.setItem("refreshToken", response.refresh);
      }

      // Then fetch user profile
      let userObj: User;
      if (response.user) {
        userObj = {
          id: response.user.id,
          username: response.user.username || response.user.email.split("@")[0],
          email: response.user.email,
          first_name: response.user.first_name || "",
          last_name: response.user.last_name || "",
          type: response.user.type || "user",
          is_active: response.user.is_active,
          avatar: response.user.avatar || "/placeholder.svg",
          date_joined: response.user.date_joined,
          last_login: response.user.last_login,
          agent_request: response.user.agent_request || undefined,
        };
      } else {
        const userData = await userAPI.getProfile();
        userObj = {
          id: userData.id,
          username: userData.username || userData.email.split("@")[0],
          email: userData.email,
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          type: userData.type || "user",
          is_active: userData.is_active,
          avatar: userData.avatar || "/placeholder.svg",
          date_joined: userData.date_joined,
          last_login: userData.last_login,
          agent_request: userData.agent_request || undefined,
        };
      }

      setUser(userObj);
      if (typeof window !== "undefined") {
        localStorage.setItem("authUser", JSON.stringify(userObj));
      }
      success = true;
      router.push("/");
    } catch (error: unknown) {
      console.error("Auth context: Login error details:", {
        error,
        response: (error as any).response,
        data: (error as any).response?.data || (error as any).detail,
        status: (error as any).response?.status,
        message: (error as any).message,
      });

      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenData");
        localStorage.removeItem("authUser");
      }
      setUser(null);

      // Re-throw the error so the signin page can handle the toast display
      throw error;
    } finally {
      setIsLoading(false);
    }

    return success;
  };

  // 🔹 Signup function (compatible with existing API)
  const signup = async (userData: {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    user_type?: "agent" | "landlord";
  }): Promise<boolean> => {
    setIsLoading(true);
    let success = false;

    try {
      const signupData: SignupData = {
        username: userData.email.split("@")[0], // Generate username from email
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        password: userData.password,
      };

      const response = (await authAPI.signup(signupData)) as any;

      const userObj: User = {
        id: response.id || "temp-id",
        username: response.username || userData.email.split("@")[0],
        email: response.email || userData.email,
        first_name: response.first_name || userData.first_name,
        last_name: response.last_name || userData.last_name,
        type: response.type || "user",
        is_active: response.is_active !== undefined ? response.is_active : true,
        avatar: response.avatar || "/placeholder.svg",
        date_joined: response.date_joined || new Date().toISOString(),
        agent_request: response.agent_request || undefined,
      };

      setUser(userObj);
      if (typeof window !== "undefined") {
        localStorage.setItem("authUser", JSON.stringify(userObj));
      }

      // If there's an access token in the response, set it
      if (response.access) {
        setAuthToken(response.access);

        // Store refresh token if provided
        if (response.refresh && typeof window !== "undefined") {
          localStorage.setItem("refreshToken", response.refresh);
        }
      }

      success = true;

      router.push("/verify");
    } catch (error: unknown) {
      console.error("Auth context: Signup error details:", {
        error,
        response: (error as any).response,
        data: (error as any).response?.data,
        status: (error as any).response?.status,
      });

      throw error;
    } finally {
      setIsLoading(false);
    }

    return success;
  };

  // 🔹 Logout function
  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("tokenData");
      localStorage.removeItem("authUser");
    }
    setUser(null);
    router.push("/");
  };

  // 🔹 Compute isAuthenticated
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        refreshAccessToken: refreshAccessTokenFunc,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ✅ Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
