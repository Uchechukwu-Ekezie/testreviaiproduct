"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import axios from "axios";
import { propertiesAPI } from "@/lib/api";
import { toast } from "react-toastify";
import { propertiesCache } from "@/lib/cache";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface PropertyImage {
  id: string;
  image_url: string;
  alt_text?: string;
  caption?: string;
  image_type?: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  property: string;
}

export interface Property {
  id: string;
  title: string;
  description?: string;
  ai_refined_description?: string;
  price?: string;
  address: string;
  coordinate?: string;
  property_type: "apartment" | "house" | "condo" | "land";
  status: "for_rent" | "for_sale" | "just_listing";
  visibility_status: "visible" | "not_visible";
  review_count?: string;
  bedrooms?: string;
  bathrooms?: string;
  size?: string;
  year_built?: string;
  lot_size?: string;
  is_added_by_agent: true;

  square_footage?: string;
  state?: string;
  city?: string;
  zip_code?: string;
  image_url?: string; // Deprecated field
  property_url?: string;
  phone?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  embeddings?: string;
  environmental_report?: string;
  environmental_score?: number;
  neighborhood_data?: string;
  neighborhood_score?: number;
  rental_grade?: number;
  amenities?: {
    indoor?: string[];
    kitchen?: string[];
    bathroom?: string[];
    utility?: string[];
    outdoor?: string[];
    security?: string[];
  };
  scrape_status: "pending" | "completed" | "no_contact" | "error";
  scrape_error_message?: string;
  listed_by?: string;
  image_urls?: Array<{
    url: string;
    image_type?: string;
    alt_text?: string;
    caption?: string;
    is_primary: boolean;
    display_order: number;
  }>;
  images?: PropertyImage[];
}

interface PropertiesContextType {
  properties: Property[];
  isLoading: boolean;
  error: string | null;
  // Pagination data
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
  // Search state
  isSearchMode: boolean;
  searchResults: Property[];
  searchQuery: string;
  isUsingFallbackResults: boolean;
  fallbackSearchTerm: string;
  // Methods
  fetchProperties: (page?: number, pageSize?: number) => Promise<void>;
  fetchPropertiesByUserId: (userId: string) => Promise<void>;
  fetchPropertiesByLocation: (params: {
    city?: string;
    state?: string;
    coordinates?: string;
    radius?: number;
  }) => Promise<Property[]>;
  getPropertyById: (id: string) => Promise<Property | null>;
  // Search methods
  searchProperties: (searchParams: {
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
  }) => Promise<void>;
  clearSearch: () => void;
  createProperty: (
    propertyData: Omit<Property, "id" | "created_at" | "updated_at">
  ) => Promise<{ success: boolean; error?: string }>;
  updateProperty: (
    id: string,
    propertyData: Partial<Property>
  ) => Promise<{ success: boolean; error?: string }>;
  deleteProperty: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshProperties: () => Promise<void>;
  // Pagination methods
  goToPage: (page: number) => Promise<void>;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  // Search pagination methods
  goToSearchPage: (page: number) => void;
  nextSearchPage: () => void;
  previousSearchPage: () => void;
  getPaginatedSearchResults: () => Property[];
}

const PropertiesContext = createContext<PropertiesContextType | undefined>(
  undefined
);

export const useProperties = () => {
  const context = useContext(PropertiesContext);
  if (context === undefined) {
    throw new Error("useProperties must be used within a PropertiesProvider");
  }
  return context;
};

interface PropertiesProviderProps {
  children: ReactNode;
}

export const PropertiesProvider: React.FC<PropertiesProviderProps> = ({
  children,
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [pageSize] = useState(10); // Show 10 properties per page
  const [searchPageSize] = useState(20); // Search results pagination size - increased to 20 for better performance

  // Search state
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUsingFallbackResults, setIsUsingFallbackResults] = useState(false);
  const [fallbackSearchTerm, setFallbackSearchTerm] = useState("");
  const [lastSearchParams, setLastSearchParams] = useState<any>(null);

  // Use useCallback to prevent infinite loops
  const fetchProperties = useCallback(
    async (page: number = 1, requestedPageSize: number = pageSize) => {
      try {
        setIsLoading(true);
        setError(null);

        // Use the new getAll method with pagination parameters
        const response = (await propertiesAPI.getAll(
          page,
          requestedPageSize
        )) as any;

        if (response && response.results && Array.isArray(response.results)) {
          setProperties(response.results);

          // Update pagination state
          setCurrentPage(page);
          setTotalCount(response.count || 0);
          setTotalPages(Math.ceil((response.count || 0) / requestedPageSize));
          setHasNext(!!response.next);
          setHasPrevious(!!response.previous);
        } else if (response && Array.isArray(response)) {
          setProperties(response);
          setCurrentPage(1);
          setTotalCount(response.length);
          setTotalPages(1);
          setHasNext(false);
          setHasPrevious(false);
        } else {
          setProperties([]);
          setCurrentPage(1);
          setTotalCount(0);
          setTotalPages(0);
          setHasNext(false);
          setHasPrevious(false);
        }
      } catch (error) {
        console.error("fetchProperties: Error occurred:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch properties";
        setError(errorMessage);
        toast.error(errorMessage);
        setProperties([]);
        setCurrentPage(1);
        setTotalCount(0);
        setTotalPages(0);
        setHasNext(false);
        setHasPrevious(false);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize]
  );

  // Fix in PropertiesContext - Update the fetchPropertiesByUserId method

  const fetchPropertiesByUserId = useCallback(
    async (userId: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = (await propertiesAPI.getByUserId(userId)) as any;

        // Based on your API response structure, it looks like it has results array
        if (response && response.results && Array.isArray(response.results)) {
          setProperties(response.results);

          // Update pagination state
          setCurrentPage(1);
          setTotalCount(response.count || response.results.length);
          setTotalPages(
            Math.ceil((response.count || response.results.length) / pageSize)
          );
          setHasNext(!!response.next);
          setHasPrevious(!!response.previous);
        } else if (response && Array.isArray(response)) {
          setProperties(response);

          // Update pagination state
          setCurrentPage(1);
          setTotalCount(response.length);
          setTotalPages(1);
          setHasNext(false);
          setHasPrevious(false);
        } else {
          setProperties([]);
          setCurrentPage(1);
          setTotalCount(0);
          setTotalPages(0);
          setHasNext(false);
          setHasPrevious(false);
        }
      } catch (error) {
        console.error("fetchPropertiesByUserId: Error occurred:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch properties";
        setError(errorMessage);
        toast.error(errorMessage);
        setProperties([]);
        setCurrentPage(1);
        setTotalCount(0);
        setTotalPages(0);
        setHasNext(false);
        setHasPrevious(false);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize]
  );

  const fetchPropertiesByLocation = useCallback(
    async (params: {
      city?: string;
      state?: string;
      coordinates?: string;
      radius?: number;
    }): Promise<Property[]> => {
      try {
        setIsLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        if (params.city) queryParams.append("city", params.city);
        if (params.state) queryParams.append("state", params.state);
        if (params.coordinates)
          queryParams.append("coordinates", params.coordinates);
        if (params.radius)
          queryParams.append("radius", params.radius.toString());

        const response = await axios.get(
          `${API_BASE_URL}/property/by-location/?${queryParams.toString()}`
        );

        // The API returns a paginated object: {count, next, previous, results: []}
        // Gracefully handle both array and paginated object forms.
        const data = response.data;
        if (Array.isArray(data)) {
          return data as Property[];
        }
        if (data && Array.isArray(data.results)) {
          return data.results as Property[];
        }
        return [];
      } catch (error) {
        console.error("fetchPropertiesByLocation: Error occurred:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch properties by location";
        setError(errorMessage);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getPropertyById = useCallback(
    async (id: string): Promise<Property | null> => {
      try {
        // Check cache first
        const cacheKey = `property_${id}`;
        const cached = propertiesCache.get<Property>(cacheKey);
        if (cached) {
          console.log("✅ Property loaded from cache:", id);
          return cached;
        }

        // Fetch from API if not in cache
        console.log("🔄 Fetching property from API:", id);
        const response = (await propertiesAPI.getById(id)) as any;

        // Cache the response for 5 minutes
        if (response) {
          propertiesCache.set(cacheKey, response, 300);
        }

        return response || null;
      } catch (error) {
        console.error("getPropertyById: Error occurred:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch property";
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  const createProperty = useCallback(
    async (
      propertyData: Omit<Property, "id" | "created_at" | "updated_at">
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true);

        const response = await propertiesAPI.create(propertyData);

        if (response) {
          toast.success("Property created successfully!");
          return { success: true };
        } else {
          const errorMsg = "Failed to create property";
          toast.error(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (error) {
        console.error("createProperty: Error occurred:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create property";
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateProperty = useCallback(
    async (
      id: string,
      propertyData: Partial<Property>
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true);
        const response = await propertiesAPI.update(id, propertyData);

        if (response) {
          setProperties((prevProperties) =>
            prevProperties.map((property) =>
              property.id === id ? { ...property, ...response } : property
            )
          );
          toast.success("Property updated successfully!");
          return { success: true };
        } else {
          const errorMsg = "Failed to update property";
          toast.error(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (error) {
        console.error("updateProperty: Error occurred:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update property";
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteProperty = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true);
        await propertiesAPI.delete(id);

        setProperties((prevProperties) =>
          prevProperties.filter((property) => property.id !== id)
        );

        toast.success("Property deleted successfully!");
        return { success: true };
      } catch (error) {
        console.error("deleteProperty: Error occurred:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete property";
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const refreshProperties = useCallback(async () => {
    await fetchProperties(currentPage, pageSize);
  }, [fetchProperties, currentPage, pageSize]);

  // Pagination methods
  const goToPage = useCallback(
    async (page: number) => {
      if (page >= 1 && page <= totalPages) {
        await fetchProperties(page, pageSize);
      }
    },
    [fetchProperties, totalPages, pageSize]
  );

  const nextPage = useCallback(async () => {
    if (hasNext) {
      await fetchProperties(currentPage + 1, pageSize);
    }
  }, [fetchProperties, hasNext, currentPage, pageSize]);

  const previousPage = useCallback(async () => {
    if (hasPrevious) {
      await fetchProperties(currentPage - 1, pageSize);
    }
  }, [fetchProperties, hasPrevious, currentPage, pageSize]);

  // Search pagination methods (server-side) - will be defined after searchProperties

  // Search methods
  const searchProperties = useCallback(
    async (searchParams: {
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
    }) => {
      try {
        setIsLoading(true);
        setError(null);

        // Reset fallback state for new search
        setIsUsingFallbackResults(false);
        setFallbackSearchTerm("");

        // Store search parameters for pagination context preservation
        setLastSearchParams(searchParams);

        // Use server-side pagination - fetch only the requested page

        const response = (await propertiesAPI.search(searchParams)) as any;

        if (response && response.results && Array.isArray(response.results)) {
          setSearchResults(response.results);
          setIsSearchMode(true);
          setSearchQuery(searchParams.query || searchParams.location || "");

          // Update pagination state for search results
          setCurrentPage(searchParams.page || 1);
          setTotalCount(response.count || response.results.length);
          setTotalPages(
            Math.ceil(
              (response.count || response.results.length) /
                (searchParams.pageSize || searchPageSize)
            )
          );
          setHasNext(!!response.next);
          setHasPrevious(!!response.previous);
        } else {
          setSearchResults([]);
          setIsSearchMode(true);
          setSearchQuery(searchParams.query || "");
          setCurrentPage(1);
          setTotalCount(0);
          setTotalPages(0);
          setHasNext(false);
          setHasPrevious(false);
        }
      } catch (error) {
        console.error("searchProperties: Error occurred:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to search properties";
        setError(errorMessage);
        toast.error(errorMessage);
        setSearchResults([]);
        setIsSearchMode(false);
        setSearchQuery("");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Search pagination methods (server-side)
  const goToSearchPage = useCallback(
    async (page: number) => {
      if (page >= 1) {
        setCurrentPage(page);
        // Use stored search parameters and only change the page
        const currentSearchParams = {
          ...lastSearchParams,
          page,
          pageSize: searchPageSize,
        };

        await searchProperties(currentSearchParams);
      }
    },
    [searchProperties, searchPageSize, searchQuery, searchResults]
  );

  const nextSearchPage = useCallback(async () => {
    if (hasNext) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);

      // Use stored search parameters and only change the page
      const currentSearchParams = {
        ...lastSearchParams,
        page: nextPage,
        pageSize: searchPageSize,
      };

      await searchProperties(currentSearchParams);
    }
  }, [
    currentPage,
    hasNext,
    searchProperties,
    searchPageSize,
    searchQuery,
    searchResults,
  ]);

  const previousSearchPage = useCallback(async () => {
    if (hasPrevious) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);

      // Use stored search parameters and only change the page
      const currentSearchParams = {
        ...lastSearchParams,
        page: prevPage,
        pageSize: searchPageSize,
      };

      await searchProperties(currentSearchParams);
    }
  }, [
    currentPage,
    hasPrevious,
    searchProperties,
    searchPageSize,
    searchQuery,
    searchResults,
  ]);

  const getPaginatedSearchResults = useCallback(() => {
    // Return current page results directly (no slicing needed)
    return searchResults;
  }, [searchResults]);

  const clearSearch = useCallback(() => {
    setIsSearchMode(false);
    setSearchResults([]);
    setSearchQuery("");
    setLastSearchParams(null);
    // Reset pagination to regular properties view
    fetchProperties(1, pageSize);
  }, [fetchProperties, pageSize]);

  // Initialize properties on context creation
  useEffect(() => {
    fetchProperties(1, 10);
  }, [fetchProperties]); // Include fetchProperties as dependency

  const value: PropertiesContextType = {
    properties,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalCount,
    hasNext,
    hasPrevious,
    // Search state
    isSearchMode,
    searchResults,
    searchQuery,
    isUsingFallbackResults,
    fallbackSearchTerm,
    // Methods
    fetchProperties,
    fetchPropertiesByUserId,
    fetchPropertiesByLocation,
    getPropertyById,
    // Search methods
    searchProperties,
    clearSearch,
    createProperty,
    updateProperty,
    deleteProperty,
    refreshProperties,
    goToPage,
    nextPage,
    previousPage,
    // Search pagination methods
    goToSearchPage,
    nextSearchPage,
    previousSearchPage,
    getPaginatedSearchResults,
  };

  return (
    <PropertiesContext.Provider value={value}>
      {children}
    </PropertiesContext.Provider>
  );
};
