/**
 * Centralized error handling for API layer
 * Eliminates duplicate error handling code across all API modules
 */

import { AxiosError } from "axios";
import type { ApiError, ApiAxiosError } from "./types";

// ============================================================================
// ERROR HANDLER CLASS
// ============================================================================

/**
 * Centralized API error handler
 * Transforms Axios errors into standardized ApiError format
 */
export class ApiErrorHandler {
  /**
   * Convert any error to standardized ApiError format
   * @param error - Error object (usually AxiosError)
   * @returns Standardized ApiError object
   */
  static toApiError(error: unknown): ApiError {
    // Handle different error types
    if (error instanceof Error) {
      // Check if it's an Axios error
      const axiosError = error as ApiAxiosError;
      const responseData = axiosError.response?.data;

      // Handle detail field - prefer specific detail over entire data object
      let detail: string | Record<string, unknown> | undefined;
      if (responseData && typeof responseData === "object") {
        const dataObj = responseData as unknown as Record<string, unknown>;
        if (dataObj.detail !== undefined) {
          detail = dataObj.detail as string | Record<string, unknown>;
        } else {
          detail = dataObj;
        }
      }

      return {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        message: axiosError.message || "An unexpected error occurred",
        detail,
        data: responseData,
      };
    }

    // Handle non-Error objects (e.g., plain objects, strings, etc.)
    if (typeof error === "object" && error !== null) {
      const errorObj = error as Record<string, unknown>;
      return {
        status: errorObj.status as number | undefined,
        statusText: errorObj.statusText as string | undefined,
        message: (errorObj.message as string) || "An unexpected error occurred",
        detail: errorObj.detail as string | Record<string, unknown> | undefined,
        data: errorObj.data as unknown,
      };
    }

    // Handle string errors
    if (typeof error === "string") {
      return {
        status: undefined,
        statusText: undefined,
        message: error,
        detail: undefined,
        data: undefined,
      };
    }

    // Fallback for unknown error types
    return {
      status: undefined,
      statusText: undefined,
      message: "An unexpected error occurred",
      detail: String(error),
      data: undefined,
    };
  }

  /**
   * Handle error and throw standardized ApiError
   * Logs error details in development mode
   * @param error - Error to handle
   * @throws ApiError
   */
  static handle(error: unknown): never {
    const apiError = this.toApiError(error);

    // Log detailed error in development
    if (process.env.NODE_ENV === "development") {
      const errorInfo: Record<string, unknown> = {};
      if (apiError.status !== undefined) errorInfo.status = apiError.status;
      if (apiError.statusText) errorInfo.statusText = apiError.statusText;
      if (apiError.message) errorInfo.message = apiError.message;
      if (apiError.detail !== undefined) errorInfo.detail = apiError.detail;
      if (apiError.data !== undefined) errorInfo.data = apiError.data;
      
      console.error("API Error:", errorInfo);
      
      // Also log the original error for debugging
      if (error instanceof Error) {
        console.error("Original error:", error);
      }
    } else {
      // Log minimal info in production
      console.error("API Error:", apiError.status, apiError.message);
    }

    throw apiError;
  }

  /**
   * Handle authentication errors with user-friendly messages
   * Provides specific error messages based on status codes and response data
   * @param error - Authentication error
   * @throws Error with user-friendly message
   */
  static handleAuthError(error: unknown): never {
    const axiosError = error as ApiAxiosError;
    const status = axiosError.response?.status;
    const detail = axiosError.response?.data?.detail;
    const detailLower = typeof detail === "string" ? detail.toLowerCase() : "";

    let message = "Authentication failed. Please try again.";

    // Handle specific error cases
    if (status === 401 || status === 403) {
      if (
        detailLower.includes("no active account") ||
        detailLower.includes("invalid credentials")
      ) {
        message =
          "The email or password you entered is incorrect. Please check your credentials and try again.";
      } else if (
        detailLower.includes("not verified") ||
        detailLower.includes("verify")
      ) {
        message =
          "Please verify your email before logging in. If you haven't received a verification email, try signing up again.";
      } else {
        message =
          "Invalid email or password. Please check your credentials and try again.";
      }
    } else if (status === 500) {
      message = "An internal server error occurred. Please try again later.";
    } else if (status === 409) {
      message =
        "An account with this email already exists. Please try logging in instead.";
    } else if (status === 400) {
      // Handle validation errors
      const errorData = axiosError.response?.data;
      if (typeof errorData === "object" && errorData !== null) {
        const fieldErrors: string[] = [];
        for (const [field, messages] of Object.entries(errorData)) {
          if (Array.isArray(messages)) {
            fieldErrors.push(`${field}: ${messages.join(", ")}`);
          } else if (typeof messages === "string") {
            fieldErrors.push(`${field}: ${messages}`);
          }
        }
        if (fieldErrors.length > 0) {
          message = fieldErrors.join("; ");
        }
      }
    }

    const apiError = this.toApiError(error);
    apiError.message = message;

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.error("Auth Error:", {
        status,
        originalDetail: detail,
        friendlyMessage: message,
      });
    }

    throw apiError;
  }

  /**
   * Handle validation errors with field-specific messages
   * @param error - Validation error
   * @throws Error with validation details
   */
  static handleValidationError(error: unknown): never {
    const axiosError = error as ApiAxiosError;
    const status = axiosError.response?.status;

    if (status === 400) {
      const errorData = axiosError.response?.data;

      if (typeof errorData === "object" && errorData !== null) {
        // Extract field-specific errors
        const fieldErrors: string[] = [];
        for (const [field, messages] of Object.entries(errorData)) {
          if (Array.isArray(messages)) {
            fieldErrors.push(`${field}: ${messages.join(", ")}`);
          } else if (typeof messages === "string") {
            fieldErrors.push(`${field}: ${messages}`);
          }
        }

        if (fieldErrors.length > 0) {
          const apiError = this.toApiError(error);
          apiError.message = fieldErrors.join("; ");
          throw apiError;
        }
      }
    }

    // Fall back to standard error handling
    return this.handle(error);
  }

  /**
   * Check if error is a network error (no response from server)
   * @param error - Error to check
   * @returns True if network error
   */
  static isNetworkError(error: unknown): boolean {
    const axiosError = error as AxiosError;
    return axiosError.isAxiosError && !axiosError.response;
  }

  /**
   * Check if error is a timeout error
   * @param error - Error to check
   * @returns True if timeout error
   */
  static isTimeoutError(error: unknown): boolean {
    const axiosError = error as AxiosError;
    return (
      axiosError.code === "ECONNABORTED" ||
      axiosError.message?.includes("timeout")
    );
  }

  /**
   * Check if error is a server error (5xx)
   * @param error - Error to check
   * @returns True if server error
   */
  static isServerError(error: unknown): boolean {
    const axiosError = error as ApiAxiosError;
    const status = axiosError.response?.status;
    return status !== undefined && status >= 500 && status < 600;
  }

  /**
   * Check if error is a client error (4xx)
   * @param error - Error to check
   * @returns True if client error
   */
  static isClientError(error: unknown): boolean {
    const axiosError = error as ApiAxiosError;
    const status = axiosError.response?.status;
    return status !== undefined && status >= 400 && status < 500;
  }
}

// ============================================================================
// UTILITY WRAPPERS
// ============================================================================

/**
 * Wrapper for async API calls with automatic error handling
 * Use this to wrap any API call that might throw an error
 *
 * @example
 * ```typescript
 * const data = await withErrorHandling(async () => {
 *   const response = await api.get('/users');
 *   return response.data;
 * });
 * ```
 *
 * @param apiCall - Async function that makes the API call
 * @param customErrorHandler - Optional custom error handler
 * @returns Promise that resolves to the API call result
 * @throws ApiError
 */
export const withErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  customErrorHandler?: (error: unknown) => never
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    if (customErrorHandler) {
      return customErrorHandler(error);
    }
    return ApiErrorHandler.handle(error);
  }
};

/**
 * Wrapper for authentication API calls with auth-specific error handling
 *
 * @example
 * ```typescript
 * const authData = await withAuthErrorHandling(async () => {
 *   const response = await api.post('/auth/login', credentials);
 *   return response.data;
 * });
 * ```
 *
 * @param apiCall - Async function that makes the authentication API call
 * @returns Promise that resolves to the API call result
 * @throws ApiError with user-friendly authentication message
 */
export const withAuthErrorHandling = async <T>(
  apiCall: () => Promise<T>
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    return ApiErrorHandler.handleAuthError(error);
  }
};

/**
 * Wrapper for validation-heavy API calls
 *
 * @example
 * ```typescript
 * const validData = await withValidationErrorHandling(async () => {
 *   const response = await api.post('/users', userData);
 *   return response.data;
 * });
 * ```
 *
 * @param apiCall - Async function that makes the API call
 * @returns Promise that resolves to the API call result
 * @throws ApiError with validation details
 */
export const withValidationErrorHandling = async <T>(
  apiCall: () => Promise<T>
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    return ApiErrorHandler.handleValidationError(error);
  }
};

// ============================================================================
// ERROR MESSAGE HELPERS
// ============================================================================

/**
 * Get user-friendly error message from ApiError
 * @param error - ApiError object
 * @returns User-friendly error message
 */
export const getErrorMessage = (error: ApiError): string => {
  // Check for specific error detail
  if (error.detail && typeof error.detail === "string") {
    return error.detail;
  }

  // Check for status-specific messages
  if (error.status === 404) {
    return "The requested resource was not found.";
  }
  if (error.status === 403) {
    return "You do not have permission to perform this action.";
  }
  if (error.status === 401) {
    return "Your session has expired. Please log in again.";
  }
  if (error.status && error.status >= 500) {
    return "A server error occurred. Please try again later.";
  }

  // Fall back to generic message
  return error.message || "An unexpected error occurred. Please try again.";
};

/**
 * Check if error indicates user needs to re-authenticate
 * @param error - ApiError object
 * @returns True if user should be redirected to login
 */
export const shouldRedirectToLogin = (error: ApiError): boolean => {
  return error.status === 401 || error.status === 403;
};

/**
 * Check if error is retryable (network or timeout error)
 * @param error - ApiError object
 * @returns True if error can be retried
 */
export const isRetryableError = (error: unknown): boolean => {
  return (
    ApiErrorHandler.isNetworkError(error) ||
    ApiErrorHandler.isTimeoutError(error) ||
    ApiErrorHandler.isServerError(error)
  );
};
