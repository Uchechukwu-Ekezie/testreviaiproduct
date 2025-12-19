/**
 * Debug API Module
 *
 * Simple API endpoint for testing backend connectivity.
 * This demonstrates the new modular API pattern.
 */

import api from "./axios-config";
import { ApiErrorHandler } from "./error-handler";

/**
 * Debug endpoint response
 */
interface DebugResponse {
  status: number;
  data: unknown;
  success: boolean;
  error?: string;
}

/**
 * Debug API - Test backend connectivity
 */
export const debugAPI = {
  /**
   * Check if the API endpoint is accessible
   * @returns Debug response with status and data
   */
  checkEndpoint: async (): Promise<DebugResponse> => {
    try {
      const response = await api.get<unknown>("/");
      return {
        status: response.status,
        data: response.data,
        success: true,
      };
    } catch (error: unknown) {
      const apiError = ApiErrorHandler.toApiError(error);
      return {
        status: apiError.status || 0,
        data: apiError.data,
        error: apiError.message,
        success: false,
      };
    }
  },
};

export default debugAPI;
