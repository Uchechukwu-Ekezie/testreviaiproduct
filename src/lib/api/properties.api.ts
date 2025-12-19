/**
 * Properties API Module
 *
 * Handles all property-related operations:
 * - Property listings with pagination
 * - Property CRUD operations (create, read, update, delete)
 * - Property search and filtering
 * - Agent-specific property creation
 * - User-specific property queries
 */

import { withErrorHandling } from "./error-handler";

/**
 * Custom fetch wrapper for properties API
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
 * Properties API
 */
export const propertiesAPI = {
  /**
   * Get all properties with pagination
   * @param page - Page number (default: 1)
   * @param pageSize - Number of items per page (default: 10)
   * @returns Paginated property list
   */
  getAll: async (page: number = 1, pageSize: number = 10): Promise<unknown> => {
    return withErrorHandling(async () => {
      return await apiFetch(`/property/?page=${page}&page_size=${pageSize}`);
    });
  },

  /**
   * Get properties by user ID
   * @param userId - User ID
   * @returns Array of properties owned by the user
   */
  getByUserId: async (userId: string): Promise<unknown> => {
    return withErrorHandling(async () => {
      return await apiFetch(`/property/by-user/${userId}/`);
    });
  },

  /**
   * Create a new property (regular user)
   * @param propertyData - Property data
   * @returns Created property
   */
  create: async (propertyData: unknown): Promise<unknown> => {
    return withErrorHandling(async () => {
      return await apiFetch("/property/", {
        method: "POST",
        body: JSON.stringify(propertyData),
      });
    });
  },

  /**
   * Create a new property as an agent
   * Automatically sets is_added_by_agent flag to true
   * @param propertyData - Property data
   * @returns Created property with agent flag
   */
  createByAgent: async (
    propertyData: Record<string, unknown>
  ): Promise<unknown> => {
    return withErrorHandling(async () => {
      const agentPropertyData = {
        ...propertyData,
        is_added_by_agent: true,
      };

      console.log(
        "propertiesAPI.createByAgent: Creating property with agent flag:",
        agentPropertyData
      );

      return await apiFetch("/property/", {
        method: "POST",
        body: JSON.stringify(agentPropertyData),
      });
    });
  },

  /**
   * Get a single property by ID
   * @param id - Property ID
   * @returns Property details
   */
  getById: async (id: string): Promise<unknown> => {
    return withErrorHandling(async () => {
      return await apiFetch(`/property/${id}/`);
    });
  },

  /**
   * Update a property
   * @param id - Property ID
   * @param propertyData - Updated property data
   * @returns Updated property
   */
  update: async (id: string, propertyData: unknown): Promise<unknown> => {
    return withErrorHandling(async () => {
      return await apiFetch(`/property/${id}/`, {
        method: "PUT",
        body: JSON.stringify(propertyData),
      });
    });
  },

  /**
   * Delete a property
   * @param id - Property ID
   * @returns Deletion confirmation
   */
  delete: async (id: string): Promise<unknown> => {
    return withErrorHandling(async () => {
      return await apiFetch(`/property/${id}/`, {
        method: "DELETE",
      });
    });
  },

  /**
   * Search properties with filters and pagination
   * @param searchParams - Search parameters including query, location, price range, etc.
   * @returns Paginated search results
   */
  search: async (searchParams: {
    query?: string;
    location?: string;
    priceMin?: number;
    priceMax?: number;
    bedrooms?: string;
    propertyType?: string;
    status?: string;
    environmentalScoreMin?: number;
    amenitiesContains?: string;
    createdAfter?: string;
    page?: number;
    pageSize?: number;
  }): Promise<unknown> => {
    return withErrorHandling(async () => {
      // Build query parameters
      const queryParams = new URLSearchParams();

      if (searchParams.query) queryParams.append("search", searchParams.query);
      if (searchParams.location)
        queryParams.append("location", searchParams.location);
      if (searchParams.priceMin !== undefined)
        queryParams.append("price_min", searchParams.priceMin.toString());
      if (searchParams.priceMax !== undefined)
        queryParams.append("price_max", searchParams.priceMax.toString());
      if (searchParams.bedrooms)
        queryParams.append("bedrooms", searchParams.bedrooms);
      if (searchParams.propertyType)
        queryParams.append("property_type", searchParams.propertyType);
      if (searchParams.status)
        queryParams.append("status", searchParams.status);
      if (searchParams.environmentalScoreMin !== undefined) {
        queryParams.append(
          "environmental_score_min",
          searchParams.environmentalScoreMin.toString()
        );
      }
      if (searchParams.amenitiesContains) {
        queryParams.append(
          "amenities_contains",
          searchParams.amenitiesContains
        );
      }
      if (searchParams.createdAfter)
        queryParams.append("created_after", searchParams.createdAfter);

      // Pagination
      const page = searchParams.page || 1;
      const pageSize = searchParams.pageSize || 10;
      queryParams.append("page", page.toString());
      queryParams.append("page_size", pageSize.toString());

      const queryString = queryParams.toString();
      console.log("propertiesAPI.search: Searching with params:", queryString);

      return await apiFetch(`/property/?${queryString}`);
    });
  },
};

export default propertiesAPI;
