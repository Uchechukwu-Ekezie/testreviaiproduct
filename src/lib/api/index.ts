/**
 * API Module - Barrel Export
 *
 * This file exports all API-related functionality in a centralized way.
 * It maintains backward compatibility while supporting the new modular structure.
 *
 * Usage:
 * ```typescript
 * // Import everything from the main module
 * import { api, authAPI, userAPI, postAPI, withErrorHandling } from '@/lib/api';
 *
 * // Or import from specific modules
 * import api from '@/lib/api/axios-config';
 * import { User, Property, Post, Comment } from '@/lib/api/types';
 * import { getAuthToken, setAuthToken } from '@/lib/api/utils';
 * ```
 */

// ===========================
// Axios Instance & Config
// ===========================
export { default } from "./axios-config";
export { default as api } from "./axios-config";
export {
  apiFetch,
  refreshAccessToken,
  isTokenOlderThan5Days,
} from "./axios-config";

// ===========================
// Type Definitions
// ===========================
export type {
  // Error types
  ApiError,
  ApiAxiosError,
  // Token types
  TokenData,
  DecodedToken,
  // Auth types
  LoginCredentials,
  SignupData,
  AuthResponse,
  GoogleCredentials,
  PasswordResetData,
  // User types
  User,
  UserProfileUpdate,
  UserPreferences,
  // Chat types
  ChatSession,
  ChatSessionCreate,
  ChatSessionUpdate,
  ChatMessage,
  ChatMessageResponse,
  ChatMessageOptions,
  ReactionType,
  // Property types
  Property,
  PropertyCreate,
  // Review types
  Review,
  ReviewStatus,
  ReviewCreate,
  ReviewUpdate,
  ReviewFilters,
  ReviewReply,
  ReviewStats,
  // Search types
  SearchHistory,
  SearchHistoryCreate,
  // Agent types
  AgentRequest,
  AgentSettings,
  BusinessHours,
  DaySchedule,
  ContactPreferences,
  AgentFilters,
  // Post types
  Post,
  Comment,
  // Pagination & Response types
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
  ApiListResponse,
} from "./types";

// ===========================
// Utility Functions
// ===========================
export {
  getAuthToken,
  getRefreshToken,
  setAuthToken,
  setRefreshToken,
  clearAuthToken,
  isTokenOlderThan5Days as isTokenOlderThan5DaysUtil,
  decodeToken,
  isTokenExpired,
  verifyCurrentToken,
  getUserIdFromToken,
  getTokenData,
  isAuthenticated,
} from "./utils";

// ===========================
// Error Handling
// ===========================
export {
  ApiErrorHandler,
  withErrorHandling,
  withAuthErrorHandling,
  withValidationErrorHandling,
  getErrorMessage,
  shouldRedirectToLogin,
  isRetryableError,
} from "./error-handler";

// ===========================
// API Modules
// ===========================
// Debug API - Simple connectivity test
export { debugAPI } from "./debug.api";

// Auth API - Authentication and user management
export { authAPI } from "./auth.api";

// User API - User profile and preferences
export { userAPI } from "./user.api";

// Chat API - Chat sessions and messages
export { chatAPI } from "./chat.api";

// Properties API - Property listings and management
export { propertiesAPI } from "./properties.api";

// Reviews API - Review management and moderation
export { reviewsAPI } from "./reviews.api";

// Search API - Search history and search functionality
export { searchAPI } from "./search.api";

// Landlord API - Agent verification and requests
export { landlordAPI } from "./landlord.api";

// Agent API - Agent dashboard and management
export { agentAPI } from "./agent.api";

// Dashboard API - Global statistics and analytics
export { dashboardAPI } from "./dashboard.api";

// Settings API - User settings and preferences
export { settingsAPI } from "./settings.api";

// Posts API - Posts and comments management
export { postAPI } from "./post.api";

// ===========================
// Backward Compatibility Aliases
// ===========================
// UserReviews alias for components that use the old naming
export { reviewsAPI as UserReviews } from "./reviews.api";

export { followAPI } from "./follow.api";