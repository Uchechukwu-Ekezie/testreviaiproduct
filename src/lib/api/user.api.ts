/**
 * User API Module
 *
 * Handles user-related operations:
 * - User profile management
 * - User preferences
 * - Avatar upload
 * - Email verification
 * - User deletion
 */

import api from "./axios-config";
import { withErrorHandling } from "./error-handler";
import { getAuthToken, setAuthToken } from "./utils";
import type { User, UserProfileUpdate, UserPreferences } from "./types";

/**
 * User API
 */
export const userAPI = {
  /**
   * Get current user profile
   * @returns User profile data
   */
  getProfile: async (): Promise<User> => {
    return withErrorHandling(async () => {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Please login first");
      }

      setAuthToken(token);
      const response = await api.get<User>("/auth/me");
      return response.data;
    });
  },

  /**
   * Delete user by ID (admin function)
   * @param userId - User ID to delete
   * @returns Deletion response
   */
  deleteUserById: async (userId: string): Promise<unknown> => {
    return withErrorHandling(async () => {
      const response = await api.delete(`/auth/users/${userId}/`);
      return response.data;
    });
  },

  /**
   * Update user preferences
   * @param data - Preferences data (role, etc.)
   * @returns Updated preferences
   */
  updatePreferences: async (data: UserPreferences): Promise<unknown> => {
    return withErrorHandling(async () => {
      const response = await api.put("/user/preferences", data);
      return response.data;
    });
  },

  /**
   * Update user profile
   * @param userData - Profile data to update
   * @returns Updated user profile
   */
  updateProfile: async (userData: UserProfileUpdate): Promise<User> => {
    return withErrorHandling(async () => {
      // Get the current user's ID from the auth token
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token is missing");
      }
      setAuthToken(token);

      // Get current user profile to get the ID
      const currentUser = await api.get<User>("/auth/me");
      const userId = currentUser.data.id;

      if (!userId) {
        throw new Error("User ID not found");
      }

      // Use the correct endpoint with user ID
      const response = await api.patch<User>(
        `/auth/users/${userId}/`,
        userData
      );
      return response.data;
    });
  },

  /**
   * Upload user avatar
   * @param avatarUrl - Avatar URL to upload
   * @returns Updated avatar URL
   */
  uploadAvatar: async (avatarUrl: string): Promise<string> => {
    return withErrorHandling(async () => {
      const response = await api.patch<{ avatar_url: string }>(
        "/auth/update-user-avatar/",
        {
          avatar_url: avatarUrl,
        }
      );
      return response.data.avatar_url;
    });
  },

  /**
   * Resend email verification OTP
   * @param email - User email
   * @returns Verification OTP response
   */
  resendVerificationOtp: async (email: string): Promise<unknown> => {
    return withErrorHandling(async () => {
      const response = await api.post(`/auth/email/verify/request/`, {
        email: email.trim(),
      });
      return response.data;
    });
  },
};

export default userAPI;
