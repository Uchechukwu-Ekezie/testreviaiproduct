/**
 * Type definitions for API layer
 * This file defines all TypeScript interfaces used across API modules
 */

import { AxiosError } from "axios";

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Standardized API error structure
 */
export interface ApiError {
  status?: number;
  statusText?: string;
  message: string;
  detail?: string | Record<string, unknown>;
  data?: unknown;
}

/**
 * Axios error with API error data
 */
export type ApiAxiosError = AxiosError<ApiError>;

// ============================================================================
// TOKEN TYPES
// ============================================================================

/**
 * Token storage structure with timestamp
 */
export interface TokenData {
  token: string;
  timestamp: number;
}

/**
 * Decoded JWT token payload
 */
export interface DecodedToken {
  user_id: string;
  exp: number;
  iat: number;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * User signup data
 */
export interface SignupData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

/**
 * Authentication response from server
 */
export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  access_token?: string; // Alternative naming
  refresh_token?: string; // Alternative naming
}

/**
 * Google authentication credentials
 */
export interface GoogleCredentials {
  credential?: string; // id_token
  access_token?: string;
  code?: string;
}

/**
 * Password reset data
 */
export interface PasswordResetData {
  new_password1: string;
  new_password2: string;
  uid?: string;
  token?: string;
}

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * User profile data
 */
export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  type?: "user" | "admin" | "landlord";
  is_superuser?: boolean;
  is_staff?: boolean;
  is_active?: boolean;
  last_login?: string;
  date_joined?: string;
  subscription_type?: "free" | "premium" | "pro";
  subscription_start_date?: string;
  subscription_end_date?: string;
  subscription_status?: "active" | "inactive" | "cancelled" | "expired";
  groups?: number[];
  user_permissions?: number[];
  verification_status?: "none" | "pending" | "verified" | "rejected";
  phone?: string;
  email_verified?: boolean;
  agent_request?: {
    id: string;
    status: "pending" | "approved" | "rejected";
    phone?: string;
    verification_document?: string;
    created_at: string;
    updated_at: string;
  };
  agent_info?: {
    status: "pending" | "approved" | "rejected";
    request_date: string;
    verification_document?: string;
    phone?: string;
  };
}

/**
 * User profile update payload
 */
export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar?: string;
}

/**
 * User preferences update payload
 */
export interface UserPreferences {
  role?: string;
  [key: string]: unknown;
}

// ============================================================================
// CHAT TYPES
// ============================================================================

/**
 * Chat session
 */
export interface ChatSession {
  id: string;
  chat_title: string;
  unique_chat_id?: string;
  user: string;
  created_at: string;
  updated_at: string;
}

/**
 * Chat session creation payload
 */
export interface ChatSessionCreate {
  chat_title: string;
  unique_chat_id?: string;
  user: string;
}

/**
 * Chat session update payload
 */
export interface ChatSessionUpdate {
  chat_title?: string;
  unique_chat_id?: string;
  user?: string;
}

/**
 * Chat message
 */
export interface ChatMessage {
  id: string;
  prompt: string;
  original_prompt: string;
  response: string;
  session: string;
  context?: unknown[];
  classification?: string;
  created_at: string;
  updated_at: string;
  file?: string | null;
  image_url?: string | null;
  imageUrls?: string[];
  properties?: string | null;
  reaction?: ReactionType | null;
  embeddings?: string | null;
}

/**
 * Chat message response (alias for backward compatibility)
 */
export type ChatMessageResponse = ChatMessage;

/**
 * Reaction types for chat messages
 */
export type ReactionType = "like" | "dislike" | "neutral" | string;

/**
 * Chat message creation options
 */
export interface ChatMessageOptions {
  imageUrls?: string[];
  image_url?: string;
  file?: File | string;
  properties?: string;
  classification?: string;
  signal?: AbortSignal;
  config?: Record<string, unknown>;
  user_latitude?: number;
  user_longitude?: number;
  location?: string; // City-level location fallback (e.g., "Lekki, Lagos, Nigeria")
  stream?: boolean; // Enable streaming responses
}

// ============================================================================
// PROPERTY TYPES
// ============================================================================

/**
 * Property data
 */
export interface Property {
  id: string;
  address: string;
  title?: string;
  description?: string;
  price?: number;
  images?: string[];
  type?: string;
  status?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  created_at: string;
  updated_at: string;
  is_added_by_agent?: boolean;
  agent?: string;
}

/**
 * Property creation payload
 */
export interface PropertyCreate {
  address: string;
  title?: string;
  description?: string;
  price?: number;
  images?: string[];
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  is_added_by_agent?: boolean;
}

// ============================================================================
// REVIEW TYPES
// ============================================================================

/**
 * Review status
 */
export type ReviewStatus = "pending" | "approved" | "rejected";

/**
 * Review data
 */
export interface Review {
  id: string;
  rating: number;
  review_text: string;
  address: string;
  property: string;
  user: string;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
  evidence?: string | string[];
  embeddings?: string;
  updated_after_rejection?: boolean;
  replies?: ReviewReply[];
  moderator_note?: string;
  rejected_at?: string;
}

/**
 * Review creation payload
 */
export interface ReviewCreate {
  rating: number;
  address: string;
  review_text: string;
  status?: ReviewStatus;
  evidence?: string | string[];
  property?: string;
  embeddings?: string;
}

/**
 * Review update payload
 */
export interface ReviewUpdate {
  review_text?: string;
  rating?: number;
  evidence?: string | string[];
  updated_after_rejection?: boolean;
}

/**
 * Review filters
 */
export interface ReviewFilters {
  status?: ReviewStatus;
  rating?: number;
  property_id?: string;
  page?: number;
  page_size?: number;
}

/**
 * Review reply
 */
export interface ReviewReply {
  id: string;
  review: string;
  message: string;
  created_at: string;
  user: string;
}

/**
 * Review statistics
 */
export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  average_rating?: number;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

/**
 * Search history entry
 */
export interface SearchHistory {
  id: string;
  user: string;
  query: string;
  chat_session: string;
  created_at: string;
}

/**
 * Search history creation payload
 */
export interface SearchHistoryCreate {
  user: string;
  query: string;
  chat_session: string;
}

// ============================================================================
// AGENT TYPES
// ============================================================================

/**
 * Agent request payload
 */
export interface AgentRequest {
  phone: string;
  verification_document: string;
}

/**
 * Agent settings
 */
export interface AgentSettings {
  notification_preferences?: Record<string, boolean>;
  business_hours?: BusinessHours;
  contact_preferences?: ContactPreferences;
}

/**
 * Business hours configuration
 */
export interface BusinessHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

/**
 * Day schedule
 */
export interface DaySchedule {
  start: string;
  end: string;
  available: boolean;
}

/**
 * Contact preferences
 */
export interface ContactPreferences {
  email?: boolean;
  sms?: boolean;
  whatsapp?: boolean;
}

/**
 * Agent filters
 */
export interface AgentFilters {
  status?: string;
  type?: string;
  search?: string;
  rating?: number;
  property_id?: string;
}

// ============================================================================
// POST TYPES
// ============================================================================

/**
 * Post data
 */
export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  like_count: number;
  view_count: number;
  comment_count: number;
  images?: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Comment data
 */
export interface Comment {
  id: string;
  post: string;
  author: string;
  content: string;
  parent?: string;
  like_count: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  page_size?: number; // Alternative naming
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
  total_pages?: number;
  current_page?: number;
}

// ============================================================================
// GENERIC API RESPONSE TYPES
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
  success?: boolean;
}

/**
 * Generic API list response
 */
export interface ApiListResponse<T> {
  data: T[];
  count: number;
  next?: string | null;
  previous?: string | null;
}