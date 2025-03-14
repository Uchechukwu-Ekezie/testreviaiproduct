"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

// Define user type
export interface User {
  id: string;
  name: string;
  email: string;
  role?: "tenant" | "landlord" | "agent" | "buyer";
  avatar?: string;
  phone?: string;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserRole: (role: "tenant" | "landlord" | "agent" | "buyer") => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (token) {
          // Mock user data (Replace with actual API call)
          const mockUser: User = {
            id: "1",
            name: "John Doe",
            email: "john@example.com",
            role: "tenant",
            avatar: "/placeholder.svg?height=32&width=32",
          };
          setUser(mockUser);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string,) => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful login
      const mockUser: User = {
        id: "1",
        name: email.split("@")[0],
        email,
        role: "tenant",
        avatar: "/placeholder.svg?height=32&width=32",
      };

      // Store token
      localStorage.setItem("auth_token", "mock_token_12345");

      // Update state
      setUser(mockUser);

      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (email: string) => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful signup
      const mockUser: User = {
        id: "2",
        name: email.split("@")[0],
        email,
        role: "tenant",
        avatar: "/placeholder.svg?height=32&width=32",
      };

      // Store token (in a real app, this should come from API response)
      localStorage.setItem("auth_token", "mock_token_signup");

      // Update state
      setUser(mockUser);

      // Redirect to verification page
      router.push("/verify");
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    router.push("/signin");
  };

  // Update user role
  const updateUserRole = (role: "tenant" | "landlord" | "agent" | "buyer") => {
    setUser((prevUser) => (prevUser ? { ...prevUser, role } : prevUser));
  };

  // Compute isAuthenticated
  const isAuthenticated = !!user;

  // Context value
  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    updateUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
