"use client";

import { Search } from "lucide-react";
import FadeIn from "./FadeIn";
import LocationSearchInput from "./LocationSearchInput";
import Image from "next/image";
import PriceRangeInput from "./PriceRangeInput";
import SpecificPropertySearch from "./SpecificPropertySearch";
import round from "../../public/Image/Vector.svg";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/contexts/search-context";
import { useProperties } from "@/contexts/properties-context";

export default function HeroSection() {
  const router = useRouter();
  const { setFilters, filters } = useSearch();
  const { searchProperties } = useProperties();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locationCoordinates, setLocationCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [selectedBedrooms, setSelectedBedrooms] = useState("Any");
  const [selectedPropertyType, setSelectedPropertyType] =
    useState("e.g Apartment");
  const [isAddedByAgent, setIsAddedByAgent] = useState(filters.isAddedByAgent || false);
  const [showSpecificSearch, setShowSpecificSearch] = useState(false);
  
  // Sync checkbox with filters context
  useEffect(() => {
    setIsAddedByAgent(filters.isAddedByAgent || false);
  }, [filters.isAddedByAgent]);
  const [specificSearchQuery, setSpecificSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<{
    address: string;
    coordinates: { lat: number; lng: number };
    placeId: string;
    name?: string;
    types?: string[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    const searchData = {
      location: selectedLocation,
      coordinates: locationCoordinates,
      priceRange: selectedPriceRange,
      bedrooms: selectedBedrooms,
      propertyType: selectedPropertyType.startsWith("e.g")
        ? ""
        : selectedPropertyType,
      query: searchQuery,
      isAddedByAgent: isAddedByAgent,
    };

    // Search clicked

    // Update the search context with filters
    setFilters(searchData);

    // Check if we're already on the properties page
    if (window.location.pathname === "/properties") {
      // If already on properties page, just scroll to the properties section
      setTimeout(() => {
        const propertiesSection = document.getElementById("properties");
        if (propertiesSection) {
          propertiesSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    } else {
      // Navigate to dedicated properties page with search results
      router.push("/properties");
    }
  };

  const handleSpecificSearch = async () => {
    if (!specificSearchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    
    try {
      // Update search context with the specific search query
      setFilters({
        query: specificSearchQuery,
        location: "",
        coordinates: null,
        priceRange: "",
        bedrooms: "Any",
        propertyType: "",
      });

      // Perform the search using the properties context
      await searchProperties({
        query: specificSearchQuery,
        page: 1,
        pageSize: 20,
      });

      // Check if we're already on the properties page
      if (window.location.pathname === "/properties") {
        // If already on properties page, just scroll to the properties section
        setTimeout(() => {
          const propertiesSection = document.getElementById("properties");
          if (propertiesSection) {
            propertiesSection.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 100);
      } else {
        // Navigate to dedicated properties page with search results
        router.push("/properties");
      }
    } catch (error) {
      console.error("Error performing specific search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSpecificSearch = () => {
    setShowSpecificSearch(!showSpecificSearch);
    // Clear specific search when switching back to regular search
    if (showSpecificSearch) {
      setSpecificSearchQuery("");
      setSelectedProperty(null);
    }
  };

  const handleLocationChange = (
    location: string,
    coordinates?: { lat: number; lng: number }
  ) => {
    setSelectedLocation(location);
    setLocationCoordinates(coordinates || null);
  };

  const handlePriceRangeChange = (priceRange: string) => {
    setSelectedPriceRange(priceRange);
  };

  const handlePropertySelect = (property: {
    address: string;
    coordinates: { lat: number; lng: number };
    placeId: string;
    name?: string;
    types?: string[];
  }) => {
    setSelectedProperty(property);
    setSpecificSearchQuery(property.address);

    // Automatically trigger search when a property is selected
    setTimeout(() => {
      handleSpecificSearch();
    }, 100);
  };

  const handleSpecificSearchChange = (value: string) => {
    // handleSpecificSearchChange called
    setSpecificSearchQuery(value);
  };

  return (
    <div className="container px-4 md:px-8 lg:px-[115.5px] pt-[80px] md:pt-[160px] pb-6 font-sf-pro">
      <div className="max-w-full mx-auto space-y-6">
        <FadeIn direction="bottom" delay={0.7}>
          {/* Main Content */}
          <div className="text-white text-center space-y-6">
            {/* Tagline */}
            <div className="inline-block px-4 py-2 bg-black/40 backdrop-blur-sm border border-white/20 rounded-full">
              <span className="text-[18px] text-white/80">
                🏡Safe, reviewed, and easy property bookings
              </span>
            </div>

            {/* Title */}
            <h1 className="text-[40px] md:text-[55px] lg:text-[52px] font-bold leading-tight max-w-4xl mx-auto">
              Explore Verified Properties
            </h1>

            {/* Subtitle */}
            <p className="text-[16px] md:text-[20px] text-white/70 font-normal max-w-md mx-auto">
              Browse, review, and book your next home with confidence
            </p>

            {/* Search Interface - Desktop Version */}
            {!showSpecificSearch && (
              <div className="block mt-12">
                <div className="bg-black/40 backdrop-blur-sm border border-[#262626] rounded-[30px] p-4 sm:p-6 md:p-8 lg:p-10 max-w-[1033px] mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Location */}
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <label className="block text-left text-sm text-white/70 font-medium">
                        Location
                      </label>
                      <LocationSearchInput
                        value={selectedLocation}
                        onChange={handleLocationChange}
                        placeholder="e.g Lagos, Nigeria"
                        className="w-full"
                      />
                    </div>

                    {/* Price Range */}
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <label className="block text-left text-sm text-white/70 font-medium">
                        Price Range
                      </label>
                      <PriceRangeInput
                        value={selectedPriceRange}
                        onChange={handlePriceRangeChange}
                        placeholder="e.g ₦100,000"
                        className="w-full"
                      />
                    </div>

                    {/* Bedrooms */}
                    <div className="space-y-2 sm:col-span-1 lg:col-span-1">
                      <label className="block text-left text-sm text-white/70 font-medium">
                        Bedrooms
                      </label>
                      <select
                        value={selectedBedrooms}
                        onChange={(e) => setSelectedBedrooms(e.target.value)}
                        className="w-full bg-transparent text-white border border-white/20 rounded-[15px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 appearance-none"
                      >
                        <option value="Any" className="bg-black">
                          Any
                        </option>
                        <option value="1" className="bg-black">
                          1 Bedroom
                        </option>
                        <option value="2" className="bg-black">
                          2 Bedrooms
                        </option>
                        <option value="3" className="bg-black">
                          3 Bedrooms
                        </option>
                        <option value="4+" className="bg-black">
                          4+ Bedrooms
                        </option>
                      </select>
                    </div>

                    {/* Property Type */}
                    <div className="space-y-2 sm:col-span-1 lg:col-span-1">
                      <label className="block text-left text-sm text-white/70 font-medium">
                        Property Type
                      </label>
                      <select
                        value={selectedPropertyType}
                        onChange={(e) =>
                          setSelectedPropertyType(e.target.value)
                        }
                        className="w-full bg-transparent text-white border border-white/20 rounded-[15px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 appearance-none"
                      >
                        <option value="e.g Apartment" className="bg-black">
                          e.g Apartment
                        </option>
                        <option value="House" className="bg-black">
                          House
                        </option>
                        <option value="Studio" className="bg-black">
                          Studio
                        </option>
                        <option value="Duplex" className="bg-black">
                          Duplex
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Added by Agent Filter */}
                  <div className="mt-4 flex items-center justify-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAddedByAgent}
                        onChange={async (e) => {
                          const newValue = e.target.checked;
                          setIsAddedByAgent(newValue);
                          // Trigger search immediately when checkbox is toggled
                          const searchData = {
                            location: selectedLocation,
                            coordinates: locationCoordinates,
                            priceRange: selectedPriceRange,
                            bedrooms: selectedBedrooms,
                            propertyType: selectedPropertyType.startsWith("e.g")
                              ? ""
                              : selectedPropertyType,
                            query: searchQuery,
                            isAddedByAgent: newValue,
                          };
                          setFilters(searchData);
                          
                          // If on properties page, trigger search immediately
                          if (window.location.pathname === "/properties") {
                            const searchParams: any = {
                              pageSize: 20,
                              page: 1,
                            };
                            
                            if (searchData.location) searchParams.location = searchData.location;
                            if (searchData.query) searchParams.query = searchData.query;
                            if (searchData.priceRange) {
                              const priceMatch = searchData.priceRange.match(/(\d+)/);
                              if (priceMatch) {
                                const price = parseInt(priceMatch[1]);
                                searchParams.priceMin = price;
                              }
                            }
                            if (searchData.bedrooms && searchData.bedrooms !== "Any") {
                              searchParams.bedrooms = searchData.bedrooms;
                            }
                            if (searchData.propertyType) {
                              searchParams.propertyType = searchData.propertyType;
                            }
                            if (newValue) {
                              searchParams.isAddedByAgent = true;
                            }
                            
                            await searchProperties(searchParams);
                            
                            setTimeout(() => {
                              const propertiesSection = document.getElementById("properties");
                              if (propertiesSection) {
                                propertiesSection.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                              }
                            }, 100);
                          }
                        }}
                        className="w-4 h-4 rounded border-white/20 bg-transparent text-[#FFD700] focus:ring-2 focus:ring-[#FFD700]/50 focus:ring-offset-0"
                      />
                      <span className="text-sm text-white/80">
                        Show only properties added by agents
                      </span>
                    </label>
                  </div>

                  {/* Search Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleSearch}
                      className="bg-gradient-to-r from-[#FFD700] to-[#780991]  text-white rounded-[15px] font-semibold px-10 py-2 transition-all duration-300 flex items-center gap-2"
                    >
                      <Search className="w-5 h-5 text-white" />
                      Search
                    </button>
                  </div>
                </div>
              </div>
            )}


            {/* Specific Property Search Interface */}
            {showSpecificSearch && (
              <div className="mt-8 sm:mt-10 md:mt-12">
                <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-[15px] sm:rounded-[20px] md:rounded-2xl p-4 sm:p-5 md:p-6 max-w-full sm:max-w-xl md:max-w-2xl mx-auto space-y-3 sm:space-y-4">
                  <div className="space-y-2 sm:space-y-3">
                    <label className="block text-sm sm:text-base text-white/70 font-medium text-center sm:text-left">
                      Search for property specifically
                    </label>
                    <SpecificPropertySearch
                      value={specificSearchQuery}
                      onChange={handleSpecificSearchChange}
                      onPropertySelect={handlePropertySelect}
                      placeholder="🔍 Search for buildings, complexes, or specific addresses..."
                      className="w-full rounded-[15px]"
                    />

                    {/* Search Button */}
                    <div className="flex justify-center mt-3 sm:mt-4">
                      <button
                        onClick={handleSpecificSearch}
                        disabled={isSearching || !specificSearchQuery.trim()}
                        className="bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-[#780991] hover:to-[#FFD700] disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold px-4 sm:px-6 py-2 sm:py-2.5 rounded-[15px] transition-all duration-300 flex items-center gap-2 text-sm sm:text-base"
                      >
                        {isSearching ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="hidden sm:inline">Searching...</span>
                            <span className="sm:hidden">Searching</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4 text-white" />
                            <span className="hidden sm:inline">Search Property</span>
                            <span className="sm:hidden">Search</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Selected Property Display */}
                    {selectedProperty && (
                      <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white/5 border border-white/20 rounded-[15px]">
                        <h4 className="text-white font-medium mb-2 text-sm sm:text-base">
                          Selected Property:
                        </h4>
                        <p className="text-xs sm:text-sm text-white/80 truncate">
                          {selectedProperty.name || selectedProperty.address}
                        </p>
                        <p className="text-xs text-white/60 mt-1 truncate">
                          {selectedProperty.address}
                        </p>
                        {selectedProperty.types && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedProperty.types
                              .slice(0, 3)
                              .map((type, index) => (
                                <span
                                  key={index}
                                  className="text-xs px-2 py-1 bg-[#FFD700]/20 text-[#FFD700] rounded-full"
                                >
                                  {type.replace(/_/g, " ")}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Link */}
            <div className="mt-8">
              <div className="text-white/60 text-sm">
                {!showSpecificSearch ? (
                  <div className="flex items-center justify-center">
                    <button
                      onClick={toggleSpecificSearch}
                      className="text-white  hover:text-[#FFA500] transition-colors flex items-center gap-1"
                    >
                      <span> Search directly for a specific property </span>
                      <span className="flex items-center gap-1">
                        <Image src={round} alt="yy" />
                      </span>
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={toggleSpecificSearch}
                      className="text-[#FFD700] underline hover:text-[#FFA500] transition-colors"
                    >
                      ← Back to filters
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
