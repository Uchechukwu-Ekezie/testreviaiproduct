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
  is_added_by_agent?: boolean;

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

  // Helper function to transform API property data to Property format
  // API uses image_url, Property interface uses url
  const transformApiPropertyToProperty = useCallback((apiProperty: any): Property => {
    const transformed = { ...apiProperty };
    
    // Transform image_urls from API format (image_url) to Property format (url)
    if (apiProperty.image_urls && Array.isArray(apiProperty.image_urls)) {
      transformed.image_urls = apiProperty.image_urls.map((img: any) => ({
        url: img.image_url || img.url || '',
        image_type: img.image_type,
        alt_text: img.alt_text,
        caption: img.caption,
        is_primary: img.is_primary ?? false,
        display_order: img.display_order ?? 0,
      }));
    }
    
    return transformed as Property;
  }, []);

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
          // Transform API properties to Property format
          const transformedProperties = response.map(transformApiPropertyToProperty);
          setProperties(transformedProperties);
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
        // Clear properties immediately to prevent showing stale data
        setProperties([]);
        const response = (await propertiesAPI.getByUserId(userId)) as any;

        // Based on your API response structure, it looks like it has results array
        if (response && response.results && Array.isArray(response.results)) {
          // Transform API properties to Property format
          const transformedProperties = response.results.map(transformApiPropertyToProperty);
          setProperties(transformedProperties);

          // Update pagination state
          setCurrentPage(1);
          setTotalCount(response.count || response.results.length);
          setTotalPages(
            Math.ceil((response.count || response.results.length) / pageSize)
          );
          setHasNext(!!response.next);
          setHasPrevious(!!response.previous);
        } else if (response && Array.isArray(response)) {
          // Transform API properties to Property format
          const transformedProperties = response.map(transformApiPropertyToProperty);
          setProperties(transformedProperties);

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

        // Use the propertiesAPI.search method which handles the endpoint correctly
        // The /property/by-location endpoint conflicts with /property/{property_id} route
        const response = (await propertiesAPI.search({
          city: params.city,
          state: params.state,
          coordinates: params.coordinates,
          radius: params.radius,
          page: 1,
          pageSize: 100, // Get more results for location-based search
        })) as any;

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

        // Transform API property to Property format
        const transformedProperty = response ? transformApiPropertyToProperty(response) : null;
        
        // Cache the transformed response for 5 minutes
        if (transformedProperty) {
          propertiesCache.set(cacheKey, transformedProperty, 300);
        }

        return transformedProperty;
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

        // Transform property data to match API specification
        const apiPayload: Record<string, unknown> = {
          title: propertyData.title,
          address: propertyData.address,
        };

        // Add optional fields
        if (propertyData.description) apiPayload.description = propertyData.description;
        if (propertyData.price) apiPayload.price = propertyData.price;
        if (propertyData.coordinate) {
          apiPayload.coordinate = typeof propertyData.coordinate === 'string' 
            ? propertyData.coordinate 
            : undefined;
        }
        if (propertyData.property_type) apiPayload.property_type = propertyData.property_type;
        if (propertyData.status) apiPayload.status = propertyData.status;
        if (propertyData.visibility_status) apiPayload.visibility_status = propertyData.visibility_status;
        if (propertyData.bedrooms) apiPayload.bedrooms = propertyData.bedrooms;
        if (propertyData.bathrooms) apiPayload.bathrooms = propertyData.bathrooms;
        if (propertyData.size) apiPayload.size = propertyData.size;
        if (propertyData.year_built) apiPayload.year_built = propertyData.year_built;
        if (propertyData.lot_size) apiPayload.lot_size = propertyData.lot_size;
        if (propertyData.square_footage) apiPayload.square_footage = propertyData.square_footage;
        if (propertyData.state) apiPayload.state = propertyData.state;
        if (propertyData.city) apiPayload.city = propertyData.city;
        if (propertyData.zip_code) apiPayload.zip_code = propertyData.zip_code;
        if (propertyData.property_url) apiPayload.property_url = propertyData.property_url;
        if (propertyData.phone) apiPayload.phone = propertyData.phone;
        if (propertyData.rental_grade) apiPayload.rental_grade = propertyData.rental_grade?.toString();
        
        // Transform listed_by to listed_by_id
        if ((propertyData as any).listed_by) {
          apiPayload.listed_by_id = (propertyData as any).listed_by;
        } else if (propertyData.listed_by) {
          apiPayload.listed_by_id = propertyData.listed_by;
        }
        
        if (propertyData.is_added_by_agent !== undefined) {
          apiPayload.is_added_by_agent = propertyData.is_added_by_agent;
        }

        // Add amenities - required field, always include it
        apiPayload.amenities = propertyData.amenities || {
          indoor: [],
          kitchen: [],
          bathroom: [],
          utility: [],
          outdoor: [],
          security: [],
        };

        // Transform image_urls to match API format
        if (propertyData.image_urls && propertyData.image_urls.length > 0) {
          apiPayload.image_urls = propertyData.image_urls.map((img, index) => {
            // Handle both old format (string URLs) and new format (objects)
            if (typeof img === 'string') {
              return {
                image_url: img,
                image_type: "other" as const,
                is_primary: index === 0,
                display_order: index,
              };
            } else {
              return {
                image_url: img.url || '',     
                image_type: img.image_type || "other" as const,
                alt_text: img.alt_text,
                caption: img.caption,
                is_primary: img.is_primary ?? (index === 0),
                display_order: img.display_order ?? index,
              };
            }
          });
        }

        const response = await propertiesAPI.create(apiPayload as any);

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
      isAddedByAgent?: boolean;
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

        // If filtering by agent, fetch all pages and filter client-side if needed
        if (searchParams.isAddedByAgent) {
          console.log("Fetching all agent properties...");
          
          // First, try with the backend filter
          const searchParamsWithoutAgent = { ...searchParams };
          delete searchParamsWithoutAgent.isAddedByAgent;
          
          const allResults: any[] = [];
          let currentPage = 1;
          let totalCount = 0;
          let hasMore = true;
          const pageSize = 100; // Use larger page size for efficiency
          let backendSupportsFilter = false;

          // Try first page with the filter to see if backend supports it
          const testResponse = (await propertiesAPI.search({
            ...searchParams,
            page: 1,
            pageSize: pageSize,
          })) as any;

          console.log("Test response for is_added_by_agent filter:", {
            hasResults: testResponse?.results?.length > 0,
            totalCount: testResponse?.count || testResponse?.total || 0,
            resultsLength: testResponse?.results?.length || 0
          });

          // Check if backend supports the filter by checking if it returns results OR if total count > 0
          // If backend returns 0 results but we know there are properties, it might not support the filter
          // If backend returns results, it definitely supports it
          if (testResponse && testResponse.results && Array.isArray(testResponse.results) && testResponse.results.length > 0) {
            backendSupportsFilter = true;
            console.log("Backend supports is_added_by_agent filter and returned results");
          } else if (testResponse && (testResponse.count > 0 || testResponse.total > 0)) {
            // Backend returned count > 0 but no results - might be a pagination issue, but assume it supports filter
            backendSupportsFilter = true;
            console.log("Backend supports is_added_by_agent filter (has count but no results on first page)");
          } else {
            console.log("Backend doesn't support is_added_by_agent filter or returned 0 results, using client-side filtering");
            // Backend doesn't support the filter, fetch properties in batches and filter client-side
            // Limit to reasonable number of pages to avoid performance issues
            const allProperties: any[] = [];
            const allFetchedProperties: any[] = [];
            let propPage = 1;
            const MAX_PAGES_TO_FETCH = 10; // Limit to 10 pages (1000 properties max) for performance
            let propHasMore = true;
            let propTotalCount = 0;
            let consecutiveEmptyPages = 0;
            const MAX_CONSECUTIVE_EMPTY = 3; // Stop if 3 consecutive pages have no agent properties

            console.log(`Fetching properties for client-side filtering (limited to ${MAX_PAGES_TO_FETCH} pages)...`);

            while (propHasMore && propPage <= MAX_PAGES_TO_FETCH) {
              try {
                const response = (await propertiesAPI.search({
                  ...searchParamsWithoutAgent,
                  page: propPage,
                  pageSize: pageSize,
                })) as any;

                  if (response && response.results && Array.isArray(response.results)) {
                    if (propPage === 1) {
                      propTotalCount = response.count || 0;
                      console.log(`Total properties available: ${propTotalCount}`);
                    }
                  
                    // Transform API properties to Property format first
                    const transformedResults = response.results.map(transformApiPropertyToProperty);
                    allFetchedProperties.push(...transformedResults);
                  
                    // Filter client-side for is_added_by_agent
                    const agentProperties = transformedResults.filter((prop: any) => {
                    // Check multiple possible formats and field names
                    const isAgent = prop.is_added_by_agent === true || 
                                   prop.is_added_by_agent === "true" ||
                                   prop.is_added_by_agent === 1 ||
                                   prop.is_added_by_agent === "1" ||
                                   prop.isAddedByAgent === true ||
                                   prop.isAddedByAgent === "true" ||
                                   prop.isAddedByAgent === 1 ||
                                   prop.isAddedByAgent === "1";
                    
                    // Debug: log first property structure if on first page
                    if (propPage === 1 && response.results.length > 0 && response.results.indexOf(prop) === 0) {
                      console.log("Sample property structure:", {
                        id: prop.id,
                        title: prop.title,
                        is_added_by_agent: prop.is_added_by_agent,
                        isAddedByAgent: prop.isAddedByAgent,
                        type: typeof prop.is_added_by_agent,
                      });
                    }
                    
                    return isAgent;
                  });
                  
                  if (agentProperties.length > 0) {
                    allProperties.push(...agentProperties);
                    consecutiveEmptyPages = 0; // Reset counter if we found agent properties
                  } else {
                    consecutiveEmptyPages++;
                  }
                  
                  console.log(`Page ${propPage}: Fetched ${response.results.length} properties, ${agentProperties.length} are agent properties. Total agent so far: ${allProperties.length}`);
                  
                  // Early exit if we've checked enough pages and found no agent properties
                  if (consecutiveEmptyPages >= MAX_CONSECUTIVE_EMPTY && allProperties.length === 0) {
                    console.log(`No agent properties found after ${propPage} pages. Stopping search.`);
                    propHasMore = false;
                    break;
                  }
                  
                  const fetchedCount = allFetchedProperties.length;
                  const hasNextPage = !!response.next;
                  
                  // Continue fetching if there's a next page and we haven't hit our limit
                  if (propTotalCount > 0) {
                    propHasMore = fetchedCount < propTotalCount && propPage < MAX_PAGES_TO_FETCH;
                  } else {
                    propHasMore = (hasNextPage && propPage < MAX_PAGES_TO_FETCH) || (response.results.length === pageSize && propPage < MAX_PAGES_TO_FETCH);
                  }
                  
                  // If no next page and we got fewer results than page size, we're done
                  if (!hasNextPage && response.results.length < pageSize) {
                    propHasMore = false;
                  }
                  
                  propPage++;
                } else {
                  propHasMore = false;
                }
              } catch (error) {
                console.warn(`Error fetching page ${propPage}:`, error);
                // If we've found some agent properties, stop here rather than continuing with errors
                if (allProperties.length > 0) {
                  console.log("Stopping pagination due to error, but we have some results.");
                  propHasMore = false;
                } else {
                  // If we haven't found any yet, try a few more pages
                  if (propPage >= 3) {
                    console.log("No agent properties found and encountering errors. Stopping search.");
                    propHasMore = false;
                  } else {
                    propPage++;
                  }
                }
              }
            }

            console.log(`Finished fetching agent properties (client-side filter). Total fetched: ${allFetchedProperties.length}, Agent properties: ${allProperties.length}`);
            
            // Log sample of filtered properties for debugging
            if (allProperties.length > 0) {
              console.log("Sample agent property:", {
                id: allProperties[0].id,
                title: allProperties[0].title,
                is_added_by_agent: allProperties[0].is_added_by_agent
              });
            } else {
              console.warn("No agent properties found after client-side filtering. Checking sample properties...");
              if (allFetchedProperties.length > 0) {
                console.log("Sample of all fetched properties (first 3):", allFetchedProperties.slice(0, 3).map((p: any) => ({
                  id: p.id,
                  title: p.title,
                  is_added_by_agent: p.is_added_by_agent,
                  isAddedByAgent: p.isAddedByAgent
                })));
              }
            }
            
            // Transform API properties to Property format
            const transformedAllProperties = allProperties.map(transformApiPropertyToProperty);
            setSearchResults(transformedAllProperties);
            setIsSearchMode(true);
            setSearchQuery(searchParams.query || searchParams.location || "Agent Properties");
            setCurrentPage(1);
            setTotalCount(allProperties.length);
            setTotalPages(1);
            setHasNext(false);
            setHasPrevious(false);
            setIsLoading(false);
            return; // Exit early since we've handled client-side filtering
          }

          // If backend supports the filter, use it
          if (backendSupportsFilter && testResponse) {
            // Transform API properties to Property format before adding to results
            const transformedTestResults = testResponse.results.map(transformApiPropertyToProperty);
            allResults.push(...transformedTestResults);
            totalCount = testResponse.count || 0;
            console.log(`Total agent properties: ${totalCount}`);
            currentPage = 2; // Start from page 2 since we already fetched page 1
          }

          while (hasMore && backendSupportsFilter) {
            const response = (await propertiesAPI.search({
              ...searchParams,
              page: currentPage,
              pageSize: pageSize,
            })) as any;

            if (response && response.results && Array.isArray(response.results)) {
              allResults.push(...response.results);
              
              const fetchedCount = allResults.length;
              const hasNextPage = !!response.next;
              
              if (totalCount > 0) {
                hasMore = fetchedCount < totalCount;
              } else {
                hasMore = hasNextPage && response.results.length === pageSize;
              }
              
              console.log(`Page ${currentPage}: Fetched ${response.results.length} properties. Total so far: ${fetchedCount}/${totalCount || 'unknown'}. Has more: ${hasMore}`);
              
              currentPage++;
              
              if (currentPage > 100) {
                console.warn("Reached maximum page limit (100). Stopping pagination.");
                hasMore = false;
              }
            } else {
              hasMore = false;
            }
          }

          if (backendSupportsFilter) {
            console.log(`Finished fetching agent properties. Total: ${allResults.length}`);
            // Transform API properties to Property format
            const transformedAllResults = allResults.map(transformApiPropertyToProperty);
            setSearchResults(transformedAllResults);
            setIsSearchMode(true);
            setSearchQuery(searchParams.query || searchParams.location || "Agent Properties");
            setCurrentPage(1);
            setTotalCount(allResults.length);
            setTotalPages(1);
            setHasNext(false);
            setHasPrevious(false);
          }
        } else {
          // Use server-side pagination - fetch only the requested page
        const response = (await propertiesAPI.search(searchParams)) as any;

        if (response && response.results && Array.isArray(response.results)) {
          // Transform API properties to Property format
          const transformedResults = response.results.map(transformApiPropertyToProperty);
          setSearchResults(transformedResults);
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
