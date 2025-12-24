/**
 * Landlord API Module
 *
 * Handles landlord-specific operations including:
 * - Agent verification requests
 * - Agent role upgrades
 * - Verification document submission
 *
 * @module landlord.api
 */

import { api } from "./axios-config";
import { withAuthErrorHandling } from "./error-handler";

/**
 * Agent request payload structure
 */
export interface AgentRequestPayload {
  /** Contact phone number */
  phone: string;
  /** URL or path to verification document (e.g., business license, ID) */
  verification_document: string;
  /** User ID (optional - will be auto-filled from auth token if not provided) */
  user_id?: string;
}

/**
 * Agent request response
 */
export interface AgentRequestResponse {
  id: string;
  user: string;
  phone: string;
  verification_document: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  reviewer?: string;
  rejection_reason?: string;
}

/**
 * Landlord API
 * Provides landlord and agent-specific functionality
 */
export const landlordAPI = {
  /**
   * Submit a request to become an agent
   *
   * Landlords can request agent status by submitting verification documents.
   * The request will be reviewed by admins before approval.
   *
   * @param data - Agent request data with phone and verification document
   * @returns Agent request details with status
   * @throws {Error} If the request fails or validation fails
   *
   * @example
   * const request = await landlordAPI.postAgentRequest({
   *   phone: '+234-801-234-5678',
   *   verification_document: 'https://storage.example.com/docs/business-license.pdf'
   * });
   * console.log('Request status:', request.status);
   */
  postAgentRequest: async (
    data: AgentRequestPayload
  ): Promise<AgentRequestResponse> => {
    return withAuthErrorHandling(async () => {
      console.log("API: Posting agent request with data:", data);

      // Validate required fields
      if (!data.phone?.trim()) {
        throw new Error("Phone number is required for agent verification");
      }

      if (!data.verification_document?.trim()) {
        throw new Error(
          "Verification document is required for agent verification"
        );
      }

      // Get user ID from token if not provided
      let userId: string | undefined = data.user_id;
      if (!userId) {
        const { getUserIdFromToken } = await import("./utils");
        const userIdFromToken = getUserIdFromToken();
        if (!userIdFromToken) {
          throw new Error("Unable to get user ID. Please ensure you are logged in.");
        }
        userId = userIdFromToken;
      }

      const requestPayload = {
        phone: data.phone,
        verification_document: data.verification_document,
        user_id: userId,
      };

      const response = await api.post<AgentRequestResponse>(
        "/auth/agent-request",
        requestPayload
      );
      console.log(
        "API: Agent request posted successfully, response:",
        response.data
      );
      return response.data;
    });
  },

  /**
   * Get all agent requests for the authenticated user
   *
   * @returns Array of agent request records
   * @throws {Error} If the request fails
   *
   * @example
   * const requests = await landlordAPI.getAgentRequests();
   * const pending = requests.filter(r => r.status === 'pending');
   */
  getAgentRequests: async (): Promise<AgentRequestResponse[]> => {
    return withAuthErrorHandling(async () => {
      console.log("API: Fetching agent requests");
      const response = await api.get<AgentRequestResponse[]>(
        "/auth/agent-requests/"
      );
      console.log(
        "API: Agent requests fetched successfully, count:",
        response.data.length
      );
      return response.data;
    });
  },

  /**
   * Get a specific agent request by ID
   *
   * @param requestId - Agent request ID
   * @returns Agent request details
   * @throws {Error} If the request fails or not found
   *
   * @example
   * const request = await landlordAPI.getAgentRequestById('req-123');
   * if (request.status === 'approved') {
   *   console.log('You are now an agent!');
   * }
   */
  getAgentRequestById: async (
    requestId: string
  ): Promise<AgentRequestResponse> => {
    return withAuthErrorHandling(async () => {
      console.log("API: Fetching agent request by ID:", requestId);
      const response = await api.get<AgentRequestResponse>(
        `/auth/agent-requests/${requestId}/`
      );
      console.log(
        "API: Agent request fetched successfully, response:",
        response.data
      );
      return response.data;
    });
  },

  /**
   * Cancel a pending agent request
   *
   * @param requestId - Agent request ID to cancel
   * @returns Cancellation confirmation
   * @throws {Error} If the request fails or cannot be cancelled
   *
   * @example
   * await landlordAPI.cancelAgentRequest('req-123');
   * console.log('Agent request cancelled');
   */
  cancelAgentRequest: async (
    requestId: string
  ): Promise<{ message: string }> => {
    return withAuthErrorHandling(async () => {
      console.log("API: Cancelling agent request:", requestId);
      const response = await api.delete<{ message: string }>(
        `/auth/agent-requests/${requestId}/`
      );
      console.log(
        "API: Agent request cancelled successfully, response:",
        response.data
      );
      return response.data;
    });
  },

  /**
   * Update an existing agent request (e.g., update phone or document)
   *
   * Only pending requests can be updated
   *
   * @param requestId - Agent request ID
   * @param data - Updated agent request data
   * @returns Updated agent request
   * @throws {Error} If the request fails or cannot be updated
   *
   * @example
   * const updated = await landlordAPI.updateAgentRequest('req-123', {
   *   phone: '+234-801-999-8888',
   *   verification_document: 'https://storage.example.com/docs/updated-license.pdf'
   * });
   */
  updateAgentRequest: async (
    requestId: string,
    data: Partial<AgentRequestPayload>
  ): Promise<AgentRequestResponse> => {
    return withAuthErrorHandling(async () => {
      console.log(
        "API: Updating agent request:",
        requestId,
        "with data:",
        data
      );
      const response = await api.patch<AgentRequestResponse>(
        `/auth/agent-requests/${requestId}/`,
        data
      );
      console.log(
        "API: Agent request updated successfully, response:",
        response.data
      );
      return response.data;
    });
  },
};

export default landlordAPI;
