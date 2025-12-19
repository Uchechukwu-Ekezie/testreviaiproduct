/**
 * Settings API Module
 *
 * Handles user settings and preferences including:
 * - Profile settings
 * - Password management
 * - Account preferences
 *
 * @module settings.api
 */

import { apiFetch } from "./axios-config";

/**
 * User profile settings
 */
export interface ProfileSettings {
  id?: string;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  language?: string;
  timezone?: string;
  date_format?: string;
  notification_preferences?: {
    email_notifications?: boolean;
    push_notifications?: boolean;
    sms_notifications?: boolean;
    marketing_emails?: boolean;
  };
  privacy_settings?: {
    profile_visibility?: "public" | "private" | "friends";
    show_email?: boolean;
    show_phone?: boolean;
  };
}

/**
 * Password change data
 */
export interface PasswordChangeData {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

/**
 * Password change response
 */
export interface PasswordChangeResponse {
  message: string;
  success: boolean;
}

/**
 * Settings API
 * Provides user settings and preferences management
 */
export const settingsAPI = {
  /**
   * Get user profile settings
   *
   * @returns User profile settings
   * @throws {Error} If the request fails
   *
   * @example
   * const profile = await settingsAPI.getProfile();
   * console.log('Email:', profile.email);
   * console.log('Language:', profile.language);
   */
  getProfile: async (): Promise<ProfileSettings> => {
    return apiFetch("settings/profile/");
  },

  /**
   * Update user profile settings
   *
   * @param profileData - Updated profile data
   * @returns Updated profile settings
   * @throws {Error} If the request fails or validation fails
   *
   * @example
   * const updated = await settingsAPI.updateProfile({
   *   first_name: 'John',
   *   last_name: 'Doe',
   *   bio: 'Real estate enthusiast',
   *   notification_preferences: {
   *     email_notifications: true,
   *     push_notifications: false
   *   }
   * });
   * console.log('Profile updated:', updated);
   */
  updateProfile: async (
    profileData: Partial<ProfileSettings>
  ): Promise<ProfileSettings> => {
    return apiFetch("settings/profile/", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },

  /**
   * Change user password
   *
   * Validates old password and updates to new password.
   * New password must match confirm password.
   *
   * @param passwordData - Password change data
   * @returns Password change confirmation
   * @throws {Error} If the request fails, old password is incorrect, or passwords don't match
   *
   * @example
   * const result = await settingsAPI.changePassword({
   *   old_password: 'current-password-123',
   *   new_password: 'new-secure-password-456',
   *   confirm_password: 'new-secure-password-456'
   * });
   * if (result.success) {
   *   console.log('Password changed successfully');
   * }
   */
  changePassword: async (
    passwordData: PasswordChangeData
  ): Promise<PasswordChangeResponse> => {
    // Validate passwords match
    if (passwordData.new_password !== passwordData.confirm_password) {
      throw new Error("New password and confirm password do not match");
    }

    // Validate password strength (basic check)
    if (passwordData.new_password.length < 8) {
      throw new Error("New password must be at least 8 characters long");
    }

    return apiFetch("settings/change-password/", {
      method: "POST",
      body: JSON.stringify(passwordData),
    });
  },

  /**
   * Update notification preferences
   *
   * @param preferences - Notification preference settings
   * @returns Updated profile with new preferences
   * @throws {Error} If the request fails
   *
   * @example
   * const updated = await settingsAPI.updateNotificationPreferences({
   *   email_notifications: true,
   *   push_notifications: false,
   *   sms_notifications: true,
   *   marketing_emails: false
   * });
   */
  updateNotificationPreferences: async (
    preferences: ProfileSettings["notification_preferences"]
  ): Promise<ProfileSettings> => {
    return apiFetch("settings/profile/", {
      method: "PATCH",
      body: JSON.stringify({ notification_preferences: preferences }),
    });
  },

  /**
   * Update privacy settings
   *
   * @param privacy - Privacy settings
   * @returns Updated profile with new privacy settings
   * @throws {Error} If the request fails
   *
   * @example
   * const updated = await settingsAPI.updatePrivacySettings({
   *   profile_visibility: 'private',
   *   show_email: false,
   *   show_phone: false
   * });
   */
  updatePrivacySettings: async (
    privacy: ProfileSettings["privacy_settings"]
  ): Promise<ProfileSettings> => {
    return apiFetch("settings/profile/", {
      method: "PATCH",
      body: JSON.stringify({ privacy_settings: privacy }),
    });
  },
};

export default settingsAPI;
