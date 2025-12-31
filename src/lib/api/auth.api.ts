/**
 * Authentication API Module
 *
 * Handles all authentication-related operations:
 * - Login (email/password and Google OAuth)
 * - Signup/Registration
 * - Email verification
 * - Password reset and change
 * - User account deletion
 * - Logout
 */

import api from "./axios-config";
import { setAuthToken, clearAuthToken } from "./utils";
import type {
  SignupData,
  AuthResponse,
  GoogleCredentials,
  PasswordResetData,
} from "./types";

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * Login with email and password
   * @param email - User email
   * @param password - User password
   * @returns Authentication response with tokens and user data
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    // Don't use withAuthErrorHandling to preserve raw server errors
    // Clear any existing tokens before login attempt
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenData");
    delete api.defaults.headers.common["Authorization"];

    const response = await api.post<AuthResponse>(
      "/auth/login/",
      {
        email: email.trim(),
        password: password.trim(),
      },
      {
        withCredentials: true,
      }
    );

    // Handle both possible response formats
    const accessToken = response.data.access_token || response.data.access;
    const refreshToken = response.data.refresh_token || response.data.refresh;
    const userData = response.data.user;

    if (!accessToken) {
      throw new Error("No access token received from server");
    }

    // Store tokens
    setAuthToken(accessToken);

    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }

    return {
      access: accessToken,
      refresh: refreshToken,
      user: userData,
    } as AuthResponse;
  },

  /**
   * Login with Google OAuth
   * @param credentialResponse - Google credential response
   * @returns Authentication response with tokens and user data
   */
  loginWithGoogle: async (
    credentialResponse: GoogleCredentials
  ): Promise<AuthResponse> => {
    // Don't use withAuthErrorHandling to preserve raw server errors
    // Clear any existing tokens before login attempt
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenData");
    delete api.defaults.headers.common["Authorization"];

    // Prepare payload according to your API spec
    const payload = {
      id_token: credentialResponse.credential,
      access_token: credentialResponse.access_token,
      code: credentialResponse.code,
    };

    const response = await api.post<AuthResponse>(
      "/auth/social/google/login",
      payload
    );

    // Handle response format (consistent with your regular login)
    const accessToken = response.data.access_token || response.data.access;
    const refreshToken = response.data.refresh_token || response.data.refresh;
    const userData = response.data.user;

    if (!accessToken) {
      throw new Error("No access token received from server");
    }

    // Store tokens
    setAuthToken(accessToken);

    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }

    return {
      access: accessToken,
      refresh: refreshToken,
      user: userData,
    } as AuthResponse;
  },

  /**
   * Register a new user account
   * @param userData - User registration data
   * @returns Registration response
   */
  signup: async (userData: SignupData): Promise<unknown> => {
    // Don't use withAuthErrorHandling to preserve raw server errors
    // Clear any existing tokens before signup attempt (same as login)
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenData");
    delete api.defaults.headers.common["Authorization"];

    // Also clear from session storage if it exists
    sessionStorage.removeItem("authToken");

    const response = await api.post("/auth/register/", userData);

    // Return the entire response so we can handle different response structures
    return response;
  },

  /**
   * Verify email address with OTP
   * @param email - User email
   * @param otp - One-time password
   * @returns Verification response
   */
  verifyEmail: async (email: string, otp: string): Promise<unknown> => {
    // Don't use withAuthErrorHandling to preserve raw server errors
    const response = await api.post(
      "/auth/email/verify/confirm/",
      {
        email: email.trim(),
        otp: otp.trim(),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  /**
   * Verify password reset OTP
   * @param email - User email
   * @param otp - One-time password
   * @returns OTP verification response
   */
  verifyEmailOtp: async (
    email: string,
    otp: string
  ): Promise<{ token?: string; uid?: string }> => {
    // Don't use withAuthErrorHandling to preserve raw server errors
    const response = await api.post<{ token?: string; uid?: string }>(
      "/auth/password/reset/confirm",
      {
        email: email.trim(),
        otp: otp.trim(),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Store email, OTP, and any token received from the response
    localStorage.setItem("resetEmail", email.trim());
    localStorage.setItem("resetOtp", otp.trim());
    if (response.data.token) {
      localStorage.setItem("resetToken", response.data.token);
    }

    return response.data;
  },

  /**
   * Verify human verification code
   * @param verificationCode - Human verification code
   * @returns Verification response
   */
  verifyHuman: async (verificationCode: string): Promise<unknown> => {
    // Don't use withAuthErrorHandling to preserve raw server errors
    const response = await api.post(
      "/auth/verify-human/",
      {
        verification_code: verificationCode.trim(),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  /**
   * Logout current user
   * @returns Logout response
   */
  logout: async (): Promise<unknown> => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  /**
   * Request password reset email
   * @param email - User email
   * @returns Password reset request response
   */
  requestPasswordReset: async (email: string): Promise<unknown> => {
    // Don't use withAuthErrorHandling to preserve raw server errors
    // Ensure email is properly formatted in the request
    const payload = { email: email.trim() };

    // Clear local storage
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenData");
    delete api.defaults.headers.common["Authorization"];

    const response = await api.post(
      "/auth/password/reset/request/",
      payload,
      {
        timeout: 15000, // Increased timeout
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  /**
   * Confirm password reset with new password
   * @param data - Password reset data
   * @returns Password reset confirmation response
   */
  passwordResetConfirm: async (data: PasswordResetData): Promise<unknown> => {
    // Don't use withAuthErrorHandling to preserve raw server errors
    // Get email, OTP, and token from localStorage
    const resetEmail = localStorage.getItem("resetEmail");
    const resetOtp = localStorage.getItem("resetOtp");
    const resetToken = localStorage.getItem("resetToken");

    if (!resetEmail || !resetOtp) {
      throw new Error(
        "No email or OTP found for password reset. Please restart the password reset process."
      );
    }

    const response = await api.post(
      "/auth/password/reset/change/",
      {
        email: resetEmail.trim(),
        otp: resetOtp.trim(),
        new_password1: data.new_password1,
        new_password2: data.new_password2,
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...(resetToken ? { Authorization: `Bearer ${resetToken}` } : {}),
        },
      }
    );

    // Clear all stored values after successful reset
    localStorage.removeItem("resetEmail");
    localStorage.removeItem("resetOtp");
    localStorage.removeItem("resetToken");

    return response.data;
  },

  /**
   * Change password for authenticated user
   * @param old_password - Current password
   * @param new_password - New password
   * @returns Password change response
   */
  passwordChange: async (
    old_password: string,
    new_password: string
  ): Promise<unknown> => {
    // Don't use withAuthErrorHandling to preserve raw server errors
    const response = await api.post("/auth/password/change/", {
      old_password,
      new_password,
    });
    return response.data;
  },

  /**
   * Delete user account
   * @returns Account deletion response
   */
  deleteUser: async (): Promise<unknown> => {
    // Don't use withAuthErrorHandling to preserve raw server errors
    const response = await api.delete("/auth/user/");
    // Clear auth tokens after successful deletion
    clearAuthToken();
    return response.data;
  },
};

export default authAPI;
