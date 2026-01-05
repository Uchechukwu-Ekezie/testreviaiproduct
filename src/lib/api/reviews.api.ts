/**
 * Reviews API Module
 *
 * Handles all review-related operations:
 * - Review CRUD operations (create, read, update, delete)
 * - Review approval and rejection (admin/landlord)
 * - Review replies
 * - User review management
 * - Review filtering and statistics
 */

import { withErrorHandling } from "./error-handler";
import type {
  ReviewFilters,
  Review,
  ReviewCreate,
  ReviewUpdate,
  ReviewStats,
} from "./types";
import type { ApiAxiosError } from "./types";

/**
 * Custom fetch wrapper for reviews API
 * Maintains backward compatibility with original apiFetch pattern
 */
const apiFetch = async (
  url: string,
  options?: RequestInit
): Promise<unknown> => {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  // Normalize BASE_URL and URL to prevent double slashes
  const baseUrl = BASE_URL?.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = `${baseUrl}${cleanUrl}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  const response = await fetch(fullUrl, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => undefined) as Record<string, unknown> | undefined;

    const errorMessage =
      (typeof errorBody?.detail === "string" && errorBody.detail) ||
      (typeof errorBody?.message === "string" && errorBody.message) ||
      `Request failed with status ${response.status}`;

    const simulatedAxiosError = {
      name: "AxiosError",
      message: errorMessage,
      config: {
        headers: {},
      },
      isAxiosError: true,
      toJSON: () => ({
        message: errorMessage,
        status: response.status,
      }),
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: {},
        config: {},
        data: errorBody,
      },
    } as unknown as ApiAxiosError;

    throw simulatedAxiosError;
  }

  return response.json();
};

/**
 * Reviews API
 */
export const reviewsAPI = {
  /**
   * Get all reviews (admin endpoint)
   * @returns Array of all reviews
   */
  getAll: async (): Promise<Review[]> => {
    return withErrorHandling(async () => {
      console.log("reviewsAPI.getAll: Starting request to reviews/");
      const response = await apiFetch("/reviews/");
      console.log("reviewsAPI.getAll: Response:", response);
      return response as Review[];
    });
  },

  /**
   * Get reviews for user's properties (landlord view)
   * @param userId - User ID
   * @param filters - Optional filters (status, rating, property, pagination)
   * @returns Filtered reviews
   */
  getByUserId: async (
    userId: string,
    filters?: ReviewFilters
  ): Promise<unknown> => {
    return withErrorHandling(async () => {
      console.log(
        "reviewsAPI.getByUserId: Starting request for userId:",
        userId,
        "with filters:",
        filters
      );

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append("status", filters.status);
      if (filters?.rating)
        queryParams.append("rating", filters.rating.toString());
      if (filters?.property_id)
        queryParams.append("property_id", filters.property_id);
      if (filters?.page) queryParams.append("page", filters.page.toString());
      if (filters?.page_size)
        queryParams.append("page_size", filters.page_size.toString());

      const queryString = queryParams.toString();
      const url = `/property/reviews-by-user/${userId}${
        queryString ? `?${queryString}` : ""
      }`;

      console.log("reviewsAPI.getByUserId: URL will be:", url);

      const response = await apiFetch(url);
      console.log("reviewsAPI.getByUserId: Success response:", response);
      return response;
    });
  },

  /**
   * Get a single review by ID
   * @param id - Review ID
   * @returns Review details
   */
  getById: async (id: string): Promise<Review> => {
    return withErrorHandling(async () => {
      console.log("reviewsAPI.getById: Starting request for id:", id);
      const response = await apiFetch(`/reviews/${id}/`);
      console.log("reviewsAPI.getById: Response:", response);
      return response as Review;
    });
  },

  /**
   * Approve a review (admin/landlord)
   * @param id - Review ID
   * @returns Approval response
   */
  approve: async (id: string): Promise<Review> => {
    return withErrorHandling(async () => {
      console.log("reviewsAPI.approve: Starting request for id:", id);
      const response = await apiFetch(`/reviews/${id}/approve/`, {
        method: "POST",
      });
      console.log("reviewsAPI.approve: Success response:", response);
      return response as Review;
    });
  },

  /**
   * Reject a review (admin/landlord)
   * @param id - Review ID
   * @returns Rejection response
   */
  reject: async (id: string): Promise<Review> => {
    return withErrorHandling(async () => {
      console.log("reviewsAPI.reject: Starting request for id:", id);
      const response = await apiFetch(`/reviews/${id}/reject/`, {
        method: "POST",
      });
      console.log("reviewsAPI.reject: Success response:", response);
      return response as Review;
    });
  },

  /**
   * Delete a review
   * @param id - Review ID
   * @returns Deletion confirmation
   */
  delete: async (id: string): Promise<unknown> => {
    return withErrorHandling(async () => {
      console.log("reviewsAPI.delete: Starting request for id:", id);
      const response = await apiFetch(`/reviews/${id}/`, {
        method: "DELETE",
      });
      console.log("reviewsAPI.delete: Success response:", response);
      return response;
    });
  },

  /**
   * Reply to a review (landlord)
   * @param id - Review ID
   * @param message - Reply message
   * @returns Reply response
   */
  reply: async (id: string, message: string): Promise<unknown> => {
    return withErrorHandling(async () => {
      console.log(
        "reviewsAPI.reply: Starting request for id:",
        id,
        "with message:",
        message
      );
      const response = await apiFetch(`/reviews/${id}/reply/`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      console.log("reviewsAPI.reply: Success response:", response);
      return response;
    });
  },

  /**
   * Create a new review
   * @param reviewData - Review data
   * @returns Created review
   */
  create: async (reviewData: ReviewCreate): Promise<Review> => {
    return withErrorHandling(async () => {
      // Transform data to match API requirements
      const transformedData: any = {
        ...reviewData,
        // Ensure rating is a string
        rating: typeof reviewData.rating === 'number' 
          ? reviewData.rating.toString() 
          : reviewData.rating,
        // Ensure evidence is an array
        evidence: Array.isArray(reviewData.evidence)
          ? reviewData.evidence
          : typeof reviewData.evidence === 'string' && reviewData.evidence.trim()
          ? [reviewData.evidence]
          : [],
        // Use property_id if property is provided
        property_id: reviewData.property_id || reviewData.property,
      };
      
      // Remove property if property_id is set
      if (transformedData.property_id && transformedData.property) {
        delete transformedData.property;
      }

      console.log("reviewsAPI.create: Starting request with data:", transformedData);
      const response = await apiFetch("/reviews/", {
        method: "POST",
        body: JSON.stringify(transformedData),
      });
      console.log("reviewsAPI.create: Success response:", response);
      return response as Review;
    });
  },

  /**
   * Get reviews for a specific property
   * @param propertyId - Property ID
   * @returns Array of property reviews
   */
  getByProperty: async (propertyId: string): Promise<Review[]> => {
    return withErrorHandling(async () => {
      console.log(
        "reviewsAPI.getByProperty: Starting request for propertyId:",
        propertyId
      );
      const response = await apiFetch(`/reviews/?property=${propertyId}`);
      console.log("reviewsAPI.getByProperty: Success response:", response);
      return response as Review[];
    });
  },

  /**
   * Get all reviews for the authenticated user
   * @param userId - User ID (optional, will use current user if not provided)
   * @param skip - Number of reviews to skip (default: 0)
   * @param limit - Maximum number of reviews to return (default: 20, max: 100)
   * @returns Array of user's reviews
   */
  getUserReviews: async (
    userId?: string,
    skip: number = 0,
    limit: number = 20
  ): Promise<Review[]> => {
    return withErrorHandling(async () => {
      // If userId is not provided, try to get it from token
      let targetUserId = userId;
      if (!targetUserId && typeof window !== "undefined") {
        const token = localStorage.getItem("authToken");
        if (token) {
          try {
            const decoded = JSON.parse(atob(token.split('.')[1])) as any;
            targetUserId = decoded.user_id || decoded.userId || decoded.sub || decoded.id;
          } catch (error) {
            console.warn("Could not extract user ID from token:", error);
          }
        }
      }

      if (!targetUserId) {
        throw new Error("User ID is required to fetch reviews");
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (skip > 0) queryParams.append("skip", skip.toString());
      if (limit !== 20) queryParams.append("limit", Math.min(limit, 100).toString());

      const queryString = queryParams.toString();
      const url = `/reviews/user/${targetUserId}${queryString ? `?${queryString}` : ""}`;

      console.log(
        "reviewsAPI.getUserReviews: Starting request to",
        url
      );
      const response = await apiFetch(url);
      
      // The API returns { reviews: [...] } format
      if (response && typeof response === 'object' && 'reviews' in response) {
        return (response as { reviews: Review[] }).reviews;
      }
      
      // Fallback: if response is already an array, return it
      return Array.isArray(response) ? response : [];
    });
  },

  /**
   * Get user reviews with status filtering
   * @param status - Optional status filter (pending, approved, rejected)
   * @returns Filtered user reviews
   */
  getUserReviewsFiltered: async (
    status?: "pending" | "approved" | "rejected"
  ): Promise<Review[]> => {
    return withErrorHandling(async () => {
      console.log(
        "reviewsAPI.getUserReviewsFiltered: Starting request with status:",
        status
      );
      const url = status ? `reviews/mine/?status=${status}` : "reviews/mine/";
      const response = await apiFetch(url);
      console.log(
        "reviewsAPI.getUserReviewsFiltered: Success response:",
        response
      );
      return response as Review[];
    });
  },

  /**
   * Get review counts and statistics for the user
   * @returns Review statistics (total, pending, approved, rejected)
   */
  getUserReviewStats: async (): Promise<ReviewStats> => {
    return withErrorHandling(async () => {
      const reviews = (await apiFetch("/reviews/mine/")) as Review[];
      const stats: ReviewStats = {
        total: reviews.length,
        pending: reviews.filter((r: Review) => r.status === "pending").length,
        approved: reviews.filter((r: Review) => r.status === "approved").length,
        rejected: reviews.filter((r: Review) => r.status === "rejected").length,
        average_rating:
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0,
      };
      return stats;
    });
  },

  /**
   * Update a user's review
   * @param reviewId - Review ID
   * @param reviewData - Updated review data
   * @returns Updated review
   */
  updateUserReview: async (
    reviewId: string,
    reviewData: ReviewUpdate
  ): Promise<Review> => {
    return withErrorHandling(async () => {
      console.log(
        "reviewsAPI.updateUserReview: Starting request for id:",
        reviewId,
        "with data:",
        reviewData
      );
      const response = await apiFetch(`reviews/${reviewId}/`, {
        method: "PATCH",
        body: JSON.stringify(reviewData),
      });
      console.log("reviewsAPI.updateUserReview: Success response:", response);
      return response as Review;
    });
  },

  /**
   * Update a review with rejection flag
   * Useful when user is resubmitting after rejection
   * @param reviewId - Review ID
   * @param reviewData - Updated review data
   * @param isRejected - Whether this is an update after rejection
   * @returns Updated review
   */
  updateUserReviewWithRejectionFlag: async (
    reviewId: string,
    reviewData: ReviewUpdate,
    isRejected: boolean = false
  ): Promise<Review> => {
    return withErrorHandling(async () => {
      console.log(
        "reviewsAPI.updateUserReviewWithRejectionFlag: Starting request for id:",
        reviewId,
        "with data:",
        reviewData,
        "isRejected:",
        isRejected
      );

      // Add rejection flag if needed
      const updateData = {
        ...reviewData,
        ...(isRejected && {
          updated_after_rejection: true,
        }),
      };

      console.log(
        "reviewsAPI.updateUserReviewWithRejectionFlag: Trying with data:",
        updateData
      );

      const response = await apiFetch(`reviews/${reviewId}/`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
      console.log(
        "reviewsAPI.updateUserReviewWithRejectionFlag: Success response:",
        response
      );
      return response as Review;
    });
  },
};

export default reviewsAPI;
