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

  // Remove trailing slash from BASE_URL if present, and ensure url doesn't start with /
  const baseUrl = BASE_URL?.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = `${baseUrl}${cleanUrl}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  try {
    const response = await fetch(fullUrl, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage = error.message || error.detail || `HTTP error! status: ${response.status}`;
      console.error(`API Error [${response.status}]: ${fullUrl}`, errorMessage);
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    console.error(`Fetch error for ${fullUrl}:`, error);
    throw error;
  }
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
      return await apiFetch(`/property/by-user/${userId}`);
    });
  },

  /**
   * Create a new property (regular user)
   * @param propertyData - Property data matching API specification
   * @returns Created property
   */
  create: async (propertyData: {
    title: string;
    description?: string;
    price?: string;
    address: string;
    coordinate?: string;
    property_type?: "apartment" | "house" | "land" | "commercial" | "warehouse" | "office";
    status?: "just_listing" | "for_sale" | "for_rent" | "sold" | "rented" | "off_market";
    visibility_status?: "public" | "private" | "draft" | "archived";
    bedrooms?: string;
    bathrooms?: string;
    size?: string;
    year_built?: string;
    lot_size?: string;
    square_footage?: string;
    state?: string;
    city?: string;
    zip_code?: string;
    property_url?: string;
    phone?: string;
    rental_grade?: string;
    listed_by_id?: string;
    is_added_by_agent?: boolean;
    amenities?: {
      indoor?: string[];
      kitchen?: string[];
      bathroom?: string[];
      utility?: string[];
      outdoor?: string[];
      security?: string[];
    };
    image_urls?: Array<{
      image_url: string;
      image_type?: "exterior" | "interior" | "kitchen" | "bathroom" | "bedroom" | "living_room" | "other";
      alt_text?: string;
      caption?: string;
      is_primary?: boolean;
      display_order?: number;
    }>;
  }): Promise<unknown> => {
    return withErrorHandling(async () => {
      // Format the payload according to API specification
      const payload: Record<string, unknown> = {
        title: propertyData.title,
        address: propertyData.address,
      };

      // Add optional fields only if they have values
      if (propertyData.description) payload.description = propertyData.description;
      if (propertyData.price) payload.price = propertyData.price;
      if (propertyData.coordinate) payload.coordinate = propertyData.coordinate;
      if (propertyData.property_type) payload.property_type = propertyData.property_type;
      if (propertyData.status) payload.status = propertyData.status;
      if (propertyData.visibility_status) payload.visibility_status = propertyData.visibility_status;
      if (propertyData.bedrooms) payload.bedrooms = propertyData.bedrooms;
      if (propertyData.bathrooms) payload.bathrooms = propertyData.bathrooms;
      if (propertyData.size) payload.size = propertyData.size;
      if (propertyData.year_built) payload.year_built = propertyData.year_built;
      if (propertyData.lot_size) payload.lot_size = propertyData.lot_size;
      if (propertyData.square_footage) payload.square_footage = propertyData.square_footage;
      if (propertyData.state) payload.state = propertyData.state;
      if (propertyData.city) payload.city = propertyData.city;
      if (propertyData.zip_code) payload.zip_code = propertyData.zip_code;
      if (propertyData.property_url) payload.property_url = propertyData.property_url;
      if (propertyData.phone) payload.phone = propertyData.phone;
      if (propertyData.rental_grade) payload.rental_grade = propertyData.rental_grade;
      if (propertyData.listed_by_id) payload.listed_by_id = propertyData.listed_by_id;
      if (propertyData.is_added_by_agent !== undefined) payload.is_added_by_agent = propertyData.is_added_by_agent;
      
      // Add amenities - required field, always include it
      payload.amenities = propertyData.amenities || {
        indoor: [],
        kitchen: [],
        bathroom: [],
        utility: [],
        outdoor: [],
        security: [],
      };
      
      if (propertyData.image_urls && propertyData.image_urls.length > 0) {
        payload.image_urls = propertyData.image_urls;
      }

      console.log("propertiesAPI.create: Final payload being sent:", JSON.stringify(payload, null, 2));
      console.log("propertiesAPI.create: Amenities in payload:", payload.amenities);

      return await apiFetch("/property/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    });
  },

  /**
   * Create a new property as an agent
   * Automatically sets is_added_by_agent flag to true
   * @param propertyData - Property data matching API specification
   * @returns Created property with agent flag
   */
  createByAgent: async (
    propertyData: {
      title: string;
      description?: string;
      price?: string;
      address: string;
      coordinate?: string;
      property_type?: "apartment" | "house" | "land" | "commercial" | "warehouse" | "office";
      status?: "just_listing" | "for_sale" | "for_rent" | "sold" | "rented" | "off_market";
      visibility_status?: "public" | "private" | "draft" | "archived";
      bedrooms?: string;
      bathrooms?: string;
      size?: string;
      year_built?: string;
      lot_size?: string;
      square_footage?: string;
      state?: string;
      city?: string;
      zip_code?: string;
      property_url?: string;
      phone?: string;
      rental_grade?: string;
      listed_by_id?: string;
      amenities?: {
        indoor?: string[];
        kitchen?: string[];
        bathroom?: string[];
        utility?: string[];
        outdoor?: string[];
        security?: string[];
      };
      image_urls?: Array<{
        image_url: string;
        image_type?: "exterior" | "interior" | "kitchen" | "bathroom" | "bedroom" | "living_room" | "other";
        alt_text?: string;
        caption?: string;
        is_primary?: boolean;
        display_order?: number;
      }>;
    }
  ): Promise<unknown> => {
    return withErrorHandling(async () => {
      // Format the payload and set is_added_by_agent to true
      const payload: Record<string, unknown> = {
        title: propertyData.title,
        address: propertyData.address,
        is_added_by_agent: true,
      };

      // Add optional fields only if they have values
      if (propertyData.description) payload.description = propertyData.description;
      if (propertyData.price) payload.price = propertyData.price;
      if (propertyData.coordinate) payload.coordinate = propertyData.coordinate;
      if (propertyData.property_type) payload.property_type = propertyData.property_type;
      if (propertyData.status) payload.status = propertyData.status;
      if (propertyData.visibility_status) payload.visibility_status = propertyData.visibility_status;
      if (propertyData.bedrooms) payload.bedrooms = propertyData.bedrooms;
      if (propertyData.bathrooms) payload.bathrooms = propertyData.bathrooms;
      if (propertyData.size) payload.size = propertyData.size;
      if (propertyData.year_built) payload.year_built = propertyData.year_built;
      if (propertyData.lot_size) payload.lot_size = propertyData.lot_size;
      if (propertyData.square_footage) payload.square_footage = propertyData.square_footage;
      if (propertyData.state) payload.state = propertyData.state;
      if (propertyData.city) payload.city = propertyData.city;
      if (propertyData.zip_code) payload.zip_code = propertyData.zip_code;
      if (propertyData.property_url) payload.property_url = propertyData.property_url;
      if (propertyData.phone) payload.phone = propertyData.phone;
      if (propertyData.rental_grade) payload.rental_grade = propertyData.rental_grade;
      if (propertyData.listed_by_id) payload.listed_by_id = propertyData.listed_by_id;
      
      // Add amenities - required field, always include it
      payload.amenities = propertyData.amenities || {
        indoor: [],
        kitchen: [],
        bathroom: [],
        utility: [],
        outdoor: [],
        security: [],
      };
      
      if (propertyData.image_urls && propertyData.image_urls.length > 0) {
        payload.image_urls = propertyData.image_urls;
      }

      console.log(
        "propertiesAPI.createByAgent: Creating property with agent flag:",
        payload
      );

      return await apiFetch("/property/", {
        method: "POST",
        body: JSON.stringify(payload),
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
      return await apiFetch(`/property/${id}`);
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
      return await apiFetch(`/property/${id}`, {
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
      return await apiFetch(`/property/${id}`, {
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
    isAddedByAgent?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<unknown> => {
    return withErrorHandling(async () => {
      // Build query parameters
      const queryParams = new URLSearchParams();

      if (searchParams.query) queryParams.append("search", searchParams.query);
      if (searchParams.location)
        queryParams.append("location", searchParams.location);
      if (searchParams.city) queryParams.append("city", searchParams.city);
      if (searchParams.state) queryParams.append("state", searchParams.state);
      if (searchParams.coordinates)
        queryParams.append("coordinates", searchParams.coordinates);
      if (searchParams.radius !== undefined)
        queryParams.append("radius", searchParams.radius.toString());
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
      if (searchParams.isAddedByAgent)
        queryParams.append("is_added_by_agent", "true");

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
