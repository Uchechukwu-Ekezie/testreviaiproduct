// types/user.ts

import { GoogleOAuthPayload } from "./auth"

export interface User {
    id?: string
    username: string
    email: string
    password?: string
    first_name: string
    last_name: string
    type: "user" | "admin"
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
    avatar?: string
  }
  
  export interface AuthContextType {
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
    }) => Promise<boolean>
    logout: () => void
    requestPasswordReset: (email: string) => Promise<void>
    updateProfile: (userData: Partial<User>) => Promise<boolean>
    loginWithGoogle: (credentialResponse: GoogleOAuthPayload) => Promise<boolean>
    updateProfileImage: (imageUrl: string) => Promise<boolean>
  }
  