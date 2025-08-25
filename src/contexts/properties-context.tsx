"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { propertiesAPI } from "@/lib/api";

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
  // Methods
  fetchProperties: (page?: number, pageSize?: number) => Promise<void>;
  fetchPropertiesByUserId: (userId: string) => Promise<void>;
  getPropertyById: (id: string) => Promise<Property | null>;
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
  const [pageSize] = useState(10); // Fixed page size

  // Use useCallback to prevent infinite loops
  const fetchProperties = useCallback(
    async (page: number = 1, requestedPageSize: number = pageSize) => {
      try {
        console.log(
          "fetchProperties: Starting with page:",
          page,
          "pageSize:",
          requestedPageSize
        );
        setIsLoading(true);
        setError(null);

        // Use the new getAll method with pagination parameters
        const response = await propertiesAPI.getAll(page, requestedPageSize);
        console.log("fetchProperties: Raw response:", response);

        if (response && response.results && Array.isArray(response.results)) {
          console.log(
            "fetchProperties: Setting properties from results, count:",
            response.results.length
          );
          setProperties(response.results);

          // Update pagination state
          setCurrentPage(page);
          setTotalCount(response.count || 0);
          setTotalPages(Math.ceil((response.count || 0) / requestedPageSize));
          setHasNext(!!response.next);
          setHasPrevious(!!response.previous);

          console.log("Pagination state:", {
            currentPage: page,
            totalCount: response.count,
            totalPages: Math.ceil((response.count || 0) / requestedPageSize),
            hasNext: !!response.next,
            hasPrevious: !!response.previous,
          });
        } else if (response && Array.isArray(response)) {
          console.log(
            "fetchProperties: Setting properties from array (legacy), count:",
            response.length
          );
          setProperties(response);
          setCurrentPage(1);
          setTotalCount(response.length);
          setTotalPages(1);
          setHasNext(false);
          setHasPrevious(false);
        } else {
          console.log("fetchProperties: No valid data, setting empty array");
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
        setProperties([]);
        setCurrentPage(1);
        setTotalCount(0);
        setTotalPages(0);
        setHasNext(false);
        setHasPrevious(false);
      } finally {
        setIsLoading(false);
        console.log("fetchProperties: Completed");
      }
    },
    [pageSize]
  );

  const fetchPropertiesByUserId = useCallback(async (userId: string) => {
    try {
      console.log("fetchPropertiesByUserId: Starting with userId:", userId);
      setIsLoading(true);
      setError(null);
      const response = await propertiesAPI.getByUserId(userId);
      console.log("fetchPropertiesByUserId: Raw response:", response);

      // Based on your API response structure, it looks like it has results array
      if (response && response.results && Array.isArray(response.results)) {
        console.log(
          "fetchPropertiesByUserId: Setting properties from results, count:",
          response.results.length
        );
        setProperties(response.results);
      } else if (response && Array.isArray(response)) {
        console.log(
          "fetchPropertiesByUserId: Setting properties from array, count:",
          response.length
        );
        setProperties(response);
      } else {
        console.log(
          "fetchPropertiesByUserId: No valid array found, setting empty array"
        );
        setProperties([]);
      }
    } catch (error) {
      console.error("fetchPropertiesByUserId: Error occurred:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch properties";
      setError(errorMessage);
      setProperties([]);
    } finally {
      setIsLoading(false);
      console.log("fetchPropertiesByUserId: Completed");
    }
  }, []);

  const getPropertyById = useCallback(
    async (id: string): Promise<Property | null> => {
      try {
        console.log("getPropertyById: Fetching property with id:", id);
        const response = await propertiesAPI.getById(id);
        console.log("getPropertyById: Response:", response);
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
        console.log(
          "createProperty: Creating property with data:",
          propertyData
        );

        const response = await propertiesAPI.create(propertyData);
        console.log("createProperty: Response:", response);

        if (response) {
          console.log(
            "createProperty: Property created successfully:",
            response
          );
          return { success: true };
        } else {
          return { success: false, error: "Failed to create property" };
        }
      } catch (error) {
        console.error("createProperty: Error occurred:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create property";
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
        console.log("updateProperty: Updating property:", id, propertyData);
        const response = await propertiesAPI.update(id, propertyData);
        console.log("updateProperty: Response:", response);

        if (response) {
          setProperties((prevProperties) =>
            prevProperties.map((property) =>
              property.id === id ? { ...property, ...response } : property
            )
          );
          return { success: true };
        } else {
          return { success: false, error: "Failed to update property" };
        }
      } catch (error) {
        console.error("updateProperty: Error occurred:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update property";
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
        console.log("deleteProperty: Deleting property:", id);
        await propertiesAPI.delete(id);

        setProperties((prevProperties) =>
          prevProperties.filter((property) => property.id !== id)
        );

        return { success: true };
      } catch (error) {
        console.error("deleteProperty: Error occurred:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete property";
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const refreshProperties = useCallback(async () => {
    console.log("refreshProperties: Called");
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
    fetchProperties,
    fetchPropertiesByUserId,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty,
    refreshProperties,
    goToPage,
    nextPage,
    previousPage,
  };

  return (
    <PropertiesContext.Provider value={value}>
      {children}
    </PropertiesContext.Provider>
  );
};
