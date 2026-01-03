"use client";

import { useMemo, useEffect } from "react";
import { Star, Eye, Filter, MapPin, Search } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSearch } from "@/contexts/search-context";
import { useProperties } from "@/contexts/properties-context";

// Extend Property type to include reviews and match backend amenities structure
type Property = {
  id: string;
  title: string;
  address: string;
  coordinate?: string;
  rental_grade?: number;
  price?: string;
  bedrooms?: string;
  property_type?: string;
  image_url?: string;
  status?: string;
  description?: string;
  ai_refined_description?: string;
  bathrooms?: string;
  size?: string;
  square_footage?: string;
  phone?: string;
  created_by?: string;
  is_added_by_agent?: boolean;
  amenities?: {
    indoor?: string[];
    kitchen?: string[];
    bathroom?: string[];
    utility?: string[];
    outdoor?: string[];
    security?: string[];
  }; // match backend type
  property_url?: string;
  // Add reviews field
  reviews?: Array<{
    id: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
    rating: number;
    review_text: string;
    status: string;
    created_at: string;
    address?: string;
    evidence?: string;
  }>;
};
import LoadingSpinner from "./loading-spinner";
import { PropertySkeletonGrid } from "./property-skeleton";
import Pagination from "./Pagination";

// Transform backend property to component format
const transformProperty = (backendProperty: Property) => {
  // Parse coordinates from string format or use default
  let coordinates = { lat: 6.5244, lng: 3.3792 }; // Default Lagos coordinates

  if (backendProperty.coordinate) {
    try {
      // If coordinate is a string like "lat,lng" or JSON
      if (typeof backendProperty.coordinate === "string") {
        if (backendProperty.coordinate.includes(",")) {
          const [lat, lng] = backendProperty.coordinate.split(",").map(Number);
          if (!isNaN(lat) && !isNaN(lng)) {
            coordinates = { lat, lng };
          }
        } else {
          const parsed = JSON.parse(backendProperty.coordinate);
          if (parsed.lat && parsed.lng) {
            coordinates = { lat: parsed.lat, lng: parsed.lng };
          }
        }
      }
    } catch {
      // console.warn("Failed to parse coordinates:", backendProperty.coordinate);
    }
  }

  // Add some variance to coordinates if they're the default
  if (coordinates.lat === 6.5244 && coordinates.lng === 3.3792) {
    coordinates = {
      lat: 6.5244 + (Math.random() - 0.5) * 0.1,
      lng: 3.3792 + (Math.random() - 0.5) * 0.1,
    };
  }

  // Use rental_grade or generate mock rating and reviews
  const rating = backendProperty.rental_grade || 4.0 + Math.random() * 1.0; // Use rental_grade if available, otherwise 4.0 to 5.0

  // Calculate actual review count from nested reviews array
  const actualReviewCount = Array.isArray(backendProperty.reviews)
    ? backendProperty.reviews.length
    : 0;

  // Calculate average rating from reviews if available
  let calculatedRating = rating;
  if (actualReviewCount > 0 && Array.isArray(backendProperty.reviews)) {
    const totalRating = backendProperty.reviews.reduce(
      (sum: number, review: any) => sum + (review.rating || 0),
      0
    );
    calculatedRating = totalRating / actualReviewCount;
  }

  return {
    id: backendProperty.id,
    title: backendProperty.title,
    location: backendProperty.address,
    coordinates,
    rating: Math.round((calculatedRating || 0) * 10) / 10, // Round to 1 decimal, use calculated rating
    reviews: actualReviewCount, // Use actual review count from nested reviews
    price: backendProperty.price || "₦0",
    bedrooms: parseInt(backendProperty.bedrooms || "0") || 0,
    propertyType: backendProperty.property_type || "apartment",
    images: backendProperty.image_url || "/Image/house.jpeg", // fallback to default image
    badge:
      backendProperty.status === "just_listing"
        ? "New Listing"
        : backendProperty.status === "sold"
        ? "Sold"
        : backendProperty.status === "rented"
        ? "Rented"
        : "Available",
    description: backendProperty.description || "",
    ai_refined_description: backendProperty.ai_refined_description || "",
    bathrooms: backendProperty.bathrooms || "0",
    size: backendProperty.size || backendProperty.square_footage || "",
    phone: backendProperty.phone || "",
    created_by: backendProperty.created_by || "",
    is_added_by_agent: backendProperty.is_added_by_agent || false,
    amenities: Array.isArray(backendProperty.amenities)
      ? backendProperty.amenities
      : backendProperty.amenities &&
        typeof backendProperty.amenities === "object"
      ? Object.values(backendProperty.amenities).flat().filter(Boolean)
      : [],
    property_url: backendProperty.property_url || "",
    // Include nested reviews data
    reviewsData: Array.isArray(backendProperty.reviews)
      ? backendProperty.reviews.map((review: any) => ({
          id: review.id,
          user: review.user,
          rating: review.rating,
          review_text: review.review_text,
          status: review.status,
          created_at: review.created_at,
          address: review.address,
          evidence: review.evidence,
        }))
      : [],
  };
};

// Transformed property type for component use
interface ComponentProperty {
  id: string;
  title: string;
  location: string;
  coordinates: { lat: number; lng: number };
  rating: number;
  reviews: number;
  price: string;
  bedrooms: number;
  propertyType: string;
  images: string;
  badge: string;
  description: string;
  ai_refined_description: string;
  bathrooms: string;
  size: string;
  phone: string;
  created_by: string;
  is_added_by_agent: boolean;
  amenities: string[];
  property_url: string;
  // Additional fields for review handling
  reviewsData?: Array<{
    id: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
    rating: number;
    review_text: string;
    status: string;
    created_at: string;
    address?: string;
    evidence?: string;
  }>;
}

export default function PropertyListing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filters, isFiltered, clearFilters } = useSearch();
  const {
    properties: backendProperties,
    isLoading: loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    hasNext,
    hasPrevious,
    fetchProperties,
    goToPage,
    nextPage,
    previousPage,
    // Search functionality
    isSearchMode,
    searchResults,
    searchQuery,
    isUsingFallbackResults,
    fallbackSearchTerm,
    searchProperties,
    clearSearch,
    // Search pagination methods
    goToSearchPage,
    nextSearchPage,
    previousSearchPage,
    getPaginatedSearchResults,
  } = useProperties();

  // Transform backend properties to component format
  const properties: ComponentProperty[] = useMemo(() => {
    // Use paginated search results if in search mode, otherwise use regular properties
    const sourceProperties = isSearchMode ? getPaginatedSearchResults() : backendProperties;
    return sourceProperties.map(transformProperty);
  }, [backendProperties, getPaginatedSearchResults, isSearchMode]);

  // Extract search parameters from URL
  const getSearchParamsFromURL = () => {
    const params: any = {
      pageSize: 20, // Use optimized page size for fast loading
      page: 1, // Always start with page 1 when filters change
    };

    // Get search parameters from URL
    const location = searchParams.get('location');
    const query = searchParams.get('query');
    const propertyType = searchParams.get('property_type');
    const status = searchParams.get('status');
    const priceMin = searchParams.get('price_min');
    const priceMax = searchParams.get('price_max');
    const bedrooms = searchParams.get('bedrooms');
    const environmentalScoreMin = searchParams.get('environmental_score_min');
    const amenitiesContains = searchParams.get('amenities_contains');
    const createdAfter = searchParams.get('created_at_after');
    const isAddedByAgent = searchParams.get('is_added_by_agent');

    // Set search parameters based on URL values
    if (location) params.location = location;
    if (query) params.query = query;
    if (propertyType) params.propertyType = propertyType;
    if (status) params.status = status;
    if (priceMin) params.priceMin = parseInt(priceMin);
    if (priceMax) params.priceMax = parseInt(priceMax);
    if (bedrooms && bedrooms !== 'Any') params.bedrooms = bedrooms;
    if (environmentalScoreMin) params.environmentalScoreMin = parseFloat(environmentalScoreMin);
    if (amenitiesContains) params.amenitiesContains = amenitiesContains;
    if (createdAfter) params.createdAfter = createdAfter;
    if (isAddedByAgent === 'true') params.isAddedByAgent = true;

    return params;
  };

  // Check if URL has search parameters
  const hasURLSearchParams = () => {
    return searchParams.toString().length > 0;
  };

  // Load properties on component mount
  useEffect(() => {
    fetchProperties(1, 20); // Load first page with 20 items per page
  }, [fetchProperties]);

  // Handle search when URL search parameters change
  // Priority System:
  // 1. URL Search Parameters (highest priority) - for direct links, bookmarks, sharing
  // 2. Filter-based Search (fallback) - for user interactions with filter components
  useEffect(() => {
    // Prevent duplicate searches
    if (loading) return;
    
    if (hasURLSearchParams()) {
      // Priority 1: Use URL search parameters
      const urlSearchParams = getSearchParamsFromURL();
      // console.log("URL search parameters detected:", urlSearchParams);
      searchProperties(urlSearchParams);
    } else if (isFiltered) {
             // Priority 2: Use filter-based search (fallback)
       const filterSearchParams: any = {
         pageSize: 20, // Use optimized page size for fast loading
         page: 1,
       };

      // Determine if this is primarily a location/address search
      const isLocationSearch = filters.location && !filters.query;
      const isGeneralSearch = filters.query && !filters.location;
      const isCombinedSearch = filters.query && filters.location;

      if (isCombinedSearch) {
        filterSearchParams.query = filters.query;
        filterSearchParams.location = filters.location;
      } else if (isLocationSearch) {
        filterSearchParams.location = filters.location;
        // console.log("Location-only search for:", filters.location);
      } else if (isGeneralSearch) {
        filterSearchParams.query = filters.query;
      }

      if (filters.priceRange) {
        const { min, max } = parsePriceRange(filters.priceRange);
        if (min > 0) filterSearchParams.priceMin = min;
        if (max < Infinity) filterSearchParams.priceMax = max;
      }

      if (filters.bedrooms && filters.bedrooms !== "Any") {
        filterSearchParams.bedrooms = filters.bedrooms;
      }

      if (filters.propertyType) {
        filterSearchParams.propertyType = filters.propertyType;
      }

      if (filters.isAddedByAgent) {
        filterSearchParams.isAddedByAgent = true;
      }

      // If only agent filter is selected, still trigger search
      const hasOtherFilters = filters.location || filters.query || filters.priceRange || 
                              (filters.bedrooms && filters.bedrooms !== "Any") || filters.propertyType;
      
      if (filters.isAddedByAgent || hasOtherFilters) {
        console.log("Filter-based search triggered:", filterSearchParams);
        searchProperties(filterSearchParams);
      }
    } else {
      // Clear search when no parameters
      if (isSearchMode) {
        clearSearch();
      }
    }
  }, [searchParams, filters, isFiltered, searchProperties, clearSearch, isSearchMode]);

  // Auto-scroll to properties section when filters are applied or on page load with filters
  useEffect(() => {
    if (isFiltered) {
      const timer = setTimeout(() => {
        const propertiesSection = document.getElementById("properties");
        if (propertiesSection) {
          propertiesSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 800); // Delay to ensure page/content is fully loaded

      return () => clearTimeout(timer);
    }
  }, [isFiltered]); // Trigger when isFiltered changes (includes initial load and filter changes)

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  // Parse price range
  const parsePriceRange = (priceRange: string) => {
    if (!priceRange) return { min: 0, max: Infinity };

    // Remove currency symbol and commas
    const cleanPrice = priceRange.replace(/₦|,/g, "");

    if (cleanPrice.includes("-")) {
      const [min, max] = cleanPrice.split("-").map((p) => parseInt(p.trim()));
      return { min: min || 0, max: max || Infinity };
    } else if (cleanPrice.includes("+")) {
      const min = parseInt(cleanPrice.replace("+", ""));
      return { min: min || 0, max: Infinity };
    } else {
      const price = parseInt(cleanPrice);
      return { min: price || 0, max: price || Infinity };
    }
  };

  // Parse property price
  const parsePropertyPrice = (price: string) => {
    return parseInt(price.replace(/₦|,/g, ""));
  };

  // Display properties (server-side search results or all properties)
  const filteredProperties = useMemo(() => {
    // Server-side search handles most filtering, but we apply client-side filters as fallback
    let result = properties;

    // Client-side filter for is_added_by_agent (fallback if backend doesn't support it)
    if (filters.isAddedByAgent) {
      result = result.filter((property) => property.is_added_by_agent === true);
    }

    if (isFiltered && filters.coordinates) {
      result = [...result].sort((a, b) => {
        const distanceA = calculateDistance(
          filters.coordinates!.lat,
          filters.coordinates!.lng,
          a.coordinates.lat,
          a.coordinates.lng
        );
        const distanceB = calculateDistance(
          filters.coordinates!.lat,
          filters.coordinates!.lng,
          b.coordinates.lat,
          b.coordinates.lng
        );
        return distanceA - distanceB;
      });
    }

    return result;
  }, [filters, isFiltered, properties]);

  const handlePropertyClick = (propertyId: string) => {
    // Store current page as navigation source
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('navigationSource', window.location.pathname);
    }
    router.push(`/properties/${propertyId}`);
  };

  const handleViewClick = (e: React.MouseEvent, propertyId: string) => {
    e.stopPropagation();
    // Store current page as navigation source
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('navigationSource', window.location.pathname);
    }
    // console.log("View property:", propertyId);
    router.push(`/properties/${propertyId}`);
  };

  // const handleBookingClick = (
  //   e: React.MouseEvent,
  //   property: ComponentProperty
  // ) => {
  //   e.stopPropagation();
  //   router.push(`/booking/${property.id}`);
  // };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < Math.floor(rating)
            ? "text-yellow-400 fill-yellow-400"
            : index < rating
            ? "text-yellow-400 fill-yellow-400/50"
            : "text-gray-400"
        }`}
      />
    ));
  };

  return (
    <div id="properties" className="container mx-auto px-4 md:px-8 lg:px-[115.5px] py-8">
      {/* Loading State */}
      {loading && <PropertySkeletonGrid count={9} />}

      {/* Error State */}
      {error && !loading && (
        <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-lg">
          <div className="text-red-400 text-center">
            <p className="font-medium">Error loading properties</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Only show content when not loading */}
      {!loading && !error && (
        <>
                     {/* Filter Status */}
           {(isFiltered || hasURLSearchParams()) && (
             <div className="mb-6 p-4 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Filter className="w-5 h-5 text-[#FFD700]" />
                   <span className="text-white font-medium">
                     Showing {filteredProperties.length} filtered results
                   </span>
                   {isUsingFallbackResults && fallbackSearchTerm && (
                     <span className="text-[#FFA500] text-sm ml-2">
                       (Fallback: {fallbackSearchTerm})
                     </span>
                   )}
                 </div>
                 <button
                   onClick={() => {
                     clearFilters();
                     // Also clear URL search parameters
                     router.push(window.location.pathname);
                   }}
                   className="text-[#FFD700] hover:text-[#FFA500] transition-colors text-sm"
                 >
                   Clear filters
                 </button>
               </div>

               {/* Active Filters Display */}
               <div className="mt-3 flex flex-wrap gap-2">
                 {/* Show URL search parameters first */}
                 {searchParams.get('location') && (
                   <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-sm text-white">
                     <MapPin className="w-3 h-3" />
                     {searchParams.get('location')}
                   </div>
                 )}
                 {searchParams.get('query') && (
                   <div className="bg-white/10 px-3 py-1 rounded-full text-sm text-white">
                     &quot;{searchParams.get('query')}&quot;
                   </div>
                 )}
                 {searchParams.get('property_type') && (
                   <div className="bg-white/10 px-3 py-1 rounded-full text-sm text-white">
                     {searchParams.get('property_type')}
                   </div>
                 )}
                 {searchParams.get('status') && (
                   <div className="bg-white/10 px-3 py-1 rounded-full text-sm text-white">
                     {searchParams.get('status')}
                   </div>
                 )}
                 {searchParams.get('bedrooms') && (
                   <div className="bg-white/10 px-3 py-1 rounded-full text-sm text-white">
                     {searchParams.get('bedrooms')} bedrooms
                   </div>
                 )}
                 {searchParams.get('price_min') && searchParams.get('price_max') && (
                   <div className="bg-white/10 px-3 py-1 rounded-full text-sm text-white">
                     ₦{searchParams.get('price_min')} - ₦{searchParams.get('price_max')}
                   </div>
                 )}
                 {searchParams.get('environmental_score_min') && (
                   <div className="bg-white/10 px-3 py-1 rounded-full text-sm text-white">
                     Score: {searchParams.get('environmental_score_min')}+
                   </div>
                 )}
                 {searchParams.get('amenities_contains') && (
                   <div className="bg-white/10 px-3 py-1 rounded-full text-sm text-white">
                     {searchParams.get('amenities_contains')}
                   </div>
                 )}
                 {searchParams.get('is_added_by_agent') === 'true' && (
                   <div className="bg-[#FFD700]/20 px-3 py-1 rounded-full text-sm text-[#FFD700]">
                     ✓ Agent Properties
                   </div>
                 )}
                 
                 {/* Fallback to filter-based display if no URL params */}
                 {!hasURLSearchParams() && (
                   <>
                     {filters.location && (
                       <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-sm text-white">
                         <MapPin className="w-3 h-3" />
                         {filters.location}
                       </div>
                     )}
                     {filters.priceRange && (
                       <div className="bg-white/10 px-3 py-1 rounded-full text-sm text-white">
                         {filters.priceRange}
                       </div>
                     )}
                     {filters.bedrooms && filters.bedrooms !== "Any" && (
                       <div className="bg-white/10 px-3 py-1 rounded-full text-sm text-white">
                         {filters.bedrooms} bedrooms
                       </div>
                     )}
                     {filters.propertyType && (
                       <div className="bg-white/10 px-3 py-1 rounded-full text-sm text-white">
                         {filters.propertyType}
                       </div>
                     )}
                     {filters.query && (
                       <div className="bg-white/10 px-3 py-1 rounded-full text-sm text-white">
                         &quot;{filters.query}&quot;
                       </div>
                     )}
                     {filters.isAddedByAgent && (
                       <div className="bg-[#FFD700]/20 px-3 py-1 rounded-full text-sm text-[#FFD700]">
                         ✓ Agent Properties
                       </div>
                     )}
                   </>
                 )}
               </div>
             </div>
           )}

          {/* Search Query Display */}
          {isSearchMode && searchQuery && (
            <div className="mb-6 p-4 bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-400" />
                <span className="text-blue-300 font-medium">
                  {searchQuery}
                </span>
              </div>
            </div>
          )}

          {/* Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {filteredProperties.length > 0 ? (
              filteredProperties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => handlePropertyClick(property.id)}
                  className="bg-[#121212] backdrop-blur-sm border border-[#262626] rounded-[20px] p-3 overflow-hidden  transition-all duration-300 cursor-pointer group"
                >
                  {/* Property Image */}
                  <div className="relative h-[240px] overflow-hidden p-5">
                    <Image
                      src={
                        property.images.startsWith("http")
                          ? property.images
                          : "/Image/house.jpeg"
                      }
                      alt={property.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300 rounded-[15px]"
                      unoptimized={property.images.startsWith("http")}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/Image/house.jpeg";
                      }}
                    />

                    {/* Badge */}
                    {property.badge && (
                      <div className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        {property.badge}
                      </div>
                    )}

                    {/* Favorite Button */}
                    {/* <button
                  onClick={(e) => handleFavoriteClick(e, property.id)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      favorites.has(property.id)
                        ? "text-red-500 fill-red-500"
                        : "text-white"
                    }`}
                  />
                </button> */}
                  </div>

                  {/* Property Details */}
                  <div className="py-3 space-y-3 ">
                    {/* Title and Location */}
                    <div>
                      <h3 className="text-white font-medium text-base mb-1">
                        {property.title}
                      </h3>
                      <p className="text-white/70 text-sm font-normal">
                        {property.location}
                      </p>
                    </div>

                    {/* Rating */}
                    <div className="flex w-[252px] items-center gap-3 bg-white/5 px-3 py-1 rounded-full text-sm text-white">
                      <div className="flex items-center gap-1">
                        {renderStars(property.rating)}
                      </div>
                      <span className="text-white/70 text-sm">
                        {property.rating > 0
                          ? property.rating.toFixed(1)
                          : "No rating"}{" "}
                        • {property.reviews} Review
                        {property.reviews !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="text-white font-bold text-xl py-1">
                      {property.price}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {property.is_added_by_agent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/booking/${property.id}`);
                          }}
                          className="flex-2 bg-white w-[60%] text-black font-semibold rounded-[15px] py-2 px-4 text-sm transition-all duration-300 hover:bg-white/90"
                        >
                          Book Now
                        </button>
                      )}
                      <button
                        onClick={(e) => handleViewClick(e, property.id)}
                        className={`rounded-[15px] text-white border border-white/20 py-2 px-4 text-sm transition-colors flex items-center justify-center gap-2 ${
                          property.is_added_by_agent ? "flex-1" : "flex-1"
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-white/60" />
                  </div>
                  <div className="text-white/80">
                    <h3 className="text-lg font-semibold mb-2">
                      No properties found
                    </h3>
                    <p className="text-sm">
                      Try adjusting your search criteria or clear the filters to
                      see all properties.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {/* 
            Pagination Strategy:
            - Regular properties: 10 per page (API-based pagination)
            - Search results: 20 per page (server-side pagination for fast loading)
            - Each page fetch only loads 20 properties instead of all results
          */}
          {!loading && properties.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
                             onPageChange={async (page: number) => {
                 if (isSearchMode && (isFiltered || hasURLSearchParams())) {
                   // Use server-side pagination for search results
                   await goToSearchPage(page);
                 } else {
                   await goToPage(page);
                 }
               }}
               onNext={async () => {
                 if (isSearchMode && (isFiltered || hasURLSearchParams())) {
                   // Use server-side pagination for search results
                   await nextSearchPage();
                 } else {
                   await nextPage();
                 }
               }}
               onPrevious={async () => {
                 if (isSearchMode && (isFiltered || hasURLSearchParams())) {
                   // Use server-side pagination for search results
                   await previousSearchPage();
                 } else {
                   await previousPage();
                 }
               }}
              isLoading={loading}
            />
          )}
        </>
      )}
    </div>
  );
}
