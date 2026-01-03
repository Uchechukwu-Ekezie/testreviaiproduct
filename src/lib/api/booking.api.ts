/**
 * Booking API Module
 *
 * Handles all booking-related operations:
 * - Booking creation and management
 * - Payment initialization and verification
 * - Booking status updates
 * - Wallet and transaction management
 * - Agent and admin booking queries
 */

import { withErrorHandling } from "./error-handler";

/**
 * Custom fetch wrapper for bookings API
 * This maintains backward compatibility with the original apiFetch pattern
 */
const apiFetch = async (
  url: string,
  options?: RequestInit
): Promise<unknown> => {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  const response = await fetch(`${BASE_URL}${url}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Booking API
 */
export const bookingAPI = {
  /**
   * Create a new booking
   * @param bookingData - Booking data including property_id, guest info, dates, etc.
   * @returns Created booking with payment_reference
   */
  create: async (bookingData: {
    property_id: string;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    check_in_date: string;
    check_out_date: string;
    number_of_guests: number;
    special_requests?: string;
  }): Promise<unknown> => {
    return withErrorHandling(async () => {
      return await apiFetch("/bookings", {
        method: "POST",
        body: JSON.stringify(bookingData),
      });
    });
  },

  /**
   * Initialize payment for a booking
   * Generates Paystack payment link
   * @param bookingId - Booking ID
   * @returns Payment authorization URL and access code
   */
  initializePayment: async (bookingId: string): Promise<unknown> => {
    return withErrorHandling(async () => {
      return await apiFetch("/bookings/initialize-payment", {
        method: "POST",
        body: JSON.stringify({ booking_id: bookingId }),
      });
    });
  },

  /**
   * Verify payment with Paystack
   * Verifies payment and processes wallet funding
   * @param reference - Payment reference from Paystack
   * @returns Payment verification result
   */
  verifyPayment: async (reference: string): Promise<unknown> => {
    return withErrorHandling(async () => {
      return await apiFetch("/bookings/verify-payment", {
        method: "POST",
        body: JSON.stringify({ reference }),
      });
    });
  },

  /**
   * Confirm a booking
   * Behavior depends on payment status
   * @param bookingId - Booking ID
   * @returns Updated booking
   */
  confirm: async (bookingId: string): Promise<unknown> => {
    return withErrorHandling(async () => {
      return await apiFetch(`/bookings/${bookingId}/confirm`, {
        method: "POST",
      });
    });
  },

  /**
   * Get all bookings for the authenticated user
   * @param params - Query parameters for pagination and filtering
   * @returns Paginated list of user bookings
   */
  getMine: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<unknown> => {
    return withErrorHandling(async () => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.page_size)
        queryParams.append("page_size", params.page_size.toString());
      if (params?.status) queryParams.append("status", params.status);

      const queryString = queryParams.toString();
      const url = queryString
        ? `/bookings?${queryString}`
        : "/bookings";
      return await apiFetch(url);
    });
  },

  /**
   * Get all bookings for an agent's properties
   * @param agentId - Agent ID
   * @param params - Query parameters for pagination and filtering
   * @returns Paginated list of agent bookings
   */
  getAgentBookings: async (
    agentId: string,
    params?: {
      page?: number;
      page_size?: number;
      status?: string;
    }
  ): Promise<unknown> => {
    return withErrorHandling(async () => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.page_size)
        queryParams.append("page_size", params.page_size.toString());
      if (params?.status) queryParams.append("status", params.status);

      const queryString = queryParams.toString();
      const url = queryString
        ? `/bookings/agent/${agentId}/bookings?${queryString}`
        : `/bookings/agent/${agentId}/bookings`;
      return await apiFetch(url);
    });
  },

  /**
   * Get a specific booking by ID
   * @param bookingId - Booking ID
   * @returns Booking details
   */
  getById: async (bookingId: string): Promise<unknown> => {
    return withErrorHandling(async () => {
      return await apiFetch(`/bookings/${bookingId}`);
    });
  },

  /**
   * Update booking status (agent/admin only)
   * @param bookingId - Booking ID
   * @param status - New status (pending, paid, confirmed, cancelled, completed)
   * @returns Updated booking
   */
  updateStatus: async (
    bookingId: string,
    status: string
  ): Promise<unknown> => {
    return withErrorHandling(async () => {
      return await apiFetch(`/bookings/${bookingId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    });
  },

  /**
   * Cancel a booking
   * @param bookingId - Booking ID
   * @returns Cancelled booking
   */
  cancel: async (bookingId: string): Promise<unknown> => {
    return withErrorHandling(async () => {
      return await apiFetch(`/bookings/${bookingId}/cancel`, {
        method: "POST",
      });
    });
  },

  /**
   * Get agent wallet balance
   * @param agentId - Agent ID
   * @returns Wallet balance and details
   */
  getAgentWallet: async (agentId: string): Promise<unknown> => {
    return withErrorHandling(async () => {
      return await apiFetch(`/bookings/agents/${agentId}/wallet`);
    });
  },

  /**
   * Get agent transaction history
   * @param agentId - Agent ID
   * @param params - Query parameters for pagination and filtering
   * @returns Paginated list of wallet transactions
   */
  getAgentTransactions: async (
    agentId: string,
    params?: {
      page?: number;
      page_size?: number;
      status?: string;
    }
  ): Promise<unknown> => {
    return withErrorHandling(async () => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.page_size)
        queryParams.append("page_size", params.page_size.toString());
      if (params?.status) queryParams.append("status", params.status);

      const queryString = queryParams.toString();
      const url = queryString
        ? `/bookings/agents/${agentId}/transactions?${queryString}`
        : `/bookings/agents/${agentId}/transactions`;
      return await apiFetch(url);
    });
  },

  /**
   * Get user transaction history
   * @param userId - User ID
   * @param params - Query parameters for pagination and filtering
   * @returns Paginated list of user transactions
   */
  getUserTransactions: async (
    userId: string,
    params?: {
      page?: number;
      page_size?: number;
      status?: string;
    }
  ): Promise<unknown> => {
    return withErrorHandling(async () => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.page_size)
        queryParams.append("page_size", params.page_size.toString());
      if (params?.status) queryParams.append("status", params.status);

      const queryString = queryParams.toString();
      const url = queryString
        ? `/bookings/users/${userId}/transactions?${queryString}`
        : `/bookings/users/${userId}/transactions`;
      return await apiFetch(url);
    });
  },

  /**
   * Get all bookings (admin only)
   * @param params - Query parameters for pagination and filtering
   * @returns Paginated list of all bookings
   */
  getAllAdmin: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    agent_id?: string;
    property_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<unknown> => {
    return withErrorHandling(async () => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.page_size)
        queryParams.append("page_size", params.page_size.toString());
      if (params?.status) queryParams.append("status", params.status);
      if (params?.agent_id) queryParams.append("agent_id", params.agent_id);
      if (params?.property_id)
        queryParams.append("property_id", params.property_id);
      if (params?.date_from) queryParams.append("date_from", params.date_from);
      if (params?.date_to) queryParams.append("date_to", params.date_to);

      const queryString = queryParams.toString();
      const url = queryString
        ? `/bookings/admin/all?${queryString}`
        : "/bookings/admin/all";
      return await apiFetch(url);
    });
  },

  /**
   * Get all transactions (admin only)
   * @param params - Query parameters for pagination and filtering
   * @returns Paginated list of all transactions
   */
  getAllTransactions: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    transaction_type?: string;
    date_from?: string;
    date_to?: string;
    user_id?: string;
    booking_id?: string;
  }): Promise<unknown> => {
    return withErrorHandling(async () => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.page_size)
        queryParams.append("page_size", params.page_size.toString());
      if (params?.status) queryParams.append("status", params.status);
      if (params?.transaction_type)
        queryParams.append("transaction_type", params.transaction_type);
      if (params?.date_from) queryParams.append("date_from", params.date_from);
      if (params?.date_to) queryParams.append("date_to", params.date_to);
      if (params?.user_id) queryParams.append("user_id", params.user_id);
      if (params?.booking_id)
        queryParams.append("booking_id", params.booking_id);

      const queryString = queryParams.toString();
      const url = queryString
        ? `/bookings/transactions?${queryString}`
        : "/bookings/transactions";
      return await apiFetch(url);
    });
  },

  /**
   * Update booking (admin only)
   * @param bookingId - Booking ID
   * @param bookingData - Updated booking data
   * @returns Updated booking
   */
  updateAdmin: async (
    bookingId: string,
    bookingData: Record<string, unknown>
  ): Promise<unknown> => {
    return withErrorHandling(async () => {
      return await apiFetch(`/bookings/admin/${bookingId}`, {
        method: "PATCH",
        body: JSON.stringify(bookingData),
      });
    });
  },

  /**
   * Reverse a transaction (admin only)
   * @param transactionId - Transaction ID
   * @returns Reversed transaction
   */
  reverseTransaction: async (transactionId: string): Promise<unknown> => {
    return withErrorHandling(async () => {
      return await apiFetch(`/bookings/transactions/${transactionId}/reverse`, {
        method: "POST",
      });
    });
  },

  /**
   * Get cancelled bookings (admin only)
   * @param params - Query parameters for pagination and filtering
   * @returns Paginated list of cancelled bookings
   */
  getCancelled: async (params?: {
    page?: number;
    page_size?: number;
  }): Promise<unknown> => {
    return withErrorHandling(async () => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.page_size)
        queryParams.append("page_size", params.page_size.toString());

      const queryString = queryParams.toString();
      const url = queryString
        ? `/bookings/admin/cancelled?${queryString}`
        : "/bookings/admin/cancelled";
      return await apiFetch(url);
    });
  },

  /**
   * Generate booking reports (admin only)
   * @param params - Report parameters
   * @returns Booking reports and analytics
   */
  getReports: async (params?: {
    date_from?: string;
    date_to?: string;
    agent_id?: string;
  }): Promise<unknown> => {
    return withErrorHandling(async () => {
      const queryParams = new URLSearchParams();
      if (params?.date_from) queryParams.append("date_from", params.date_from);
      if (params?.date_to) queryParams.append("date_to", params.date_to);
      if (params?.agent_id) queryParams.append("agent_id", params.agent_id);

      const queryString = queryParams.toString();
      const url = queryString
        ? `/bookings/admin/reports?${queryString}`
        : "/bookings/admin/reports";
      return await apiFetch(url);
    });
  },
};

export default bookingAPI;


