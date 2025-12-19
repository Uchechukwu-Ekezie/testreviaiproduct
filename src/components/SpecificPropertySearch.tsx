"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, MapPin, Loader2, Building2 } from "lucide-react";

interface SpecificPropertySearchProps {
  onPropertySelect: (property: {
    address: string;
    coordinates: { lat: number; lng: number };
    placeId: string;
    name?: string;
    types?: string[];
  }) => void;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SpecificPropertySearch = ({
  onPropertySelect,
  value,
  onChange,
  placeholder = "Search for specific property...",
  className = "",
}: SpecificPropertySearchProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null
  );
  const mapRef = useRef<google.maps.Map | null>(null);

  // Initialize Google Maps services
  useEffect(() => {
    const initializeServices = async () => {
      if (typeof google !== "undefined" && google.maps && google.maps.places) {
        autocompleteServiceRef.current =
          new google.maps.places.AutocompleteService();

        // Create a hidden map for PlacesService
        const hiddenMapDiv = document.createElement("div");
        hiddenMapDiv.style.display = "none";
        document.body.appendChild(hiddenMapDiv);

        mapRef.current = new google.maps.Map(hiddenMapDiv, {
          center: { lat: 6.5244, lng: 3.3792 }, // Lagos, Nigeria
          zoom: 10,
        });

        placesServiceRef.current = new google.maps.places.PlacesService(
          mapRef.current
        );
      }
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeServices();
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          initializeServices();
        } else {
          setTimeout(checkGoogleMaps, 100);
        }
      };
      checkGoogleMaps();
    }
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value, inputValue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Search for property suggestions with focus on buildings and establishments
  const searchProperties = useCallback(async (query: string) => {
    if (!query.trim() || !autocompleteServiceRef.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    try {
      const request = {
        input: query,
        componentRestrictions: { country: "ng" }, // Restrict to Nigeria
        types: ["establishment", "geocode"], // Focus on buildings and addresses
        fields: ["place_id", "formatted_address", "name", "types", "geometry"],
      };

      autocompleteServiceRef.current.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsLoading(false);

          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            // Filter for more property-relevant results
            const filteredPredictions = predictions.filter((prediction) => {
              const description = prediction.description.toLowerCase();
              const types = prediction.types || [];

              // Prioritize addresses, buildings, and establishments
              return (
                types.some((type) =>
                  [
                    "street_address",
                    "premise",
                    "subpremise",
                    "establishment",
                    "point_of_interest",
                  ].includes(type)
                ) ||
                description.includes("apartment") ||
                description.includes("house") ||
                description.includes("building") ||
                description.includes("estate") ||
                description.includes("complex") ||
                description.includes("tower")
              );
            });

            setSuggestions(filteredPredictions.slice(0, 8)); // Show more results for properties
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    } catch (error) {
      console.error("Error searching properties:", error);
      setIsLoading(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // Add timeout ref for debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Input changed
    setInputValue(newValue);
    onChange(newValue);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce the search
    searchTimeoutRef.current = setTimeout(() => {
      searchProperties(newValue);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (prediction: google.maps.places.AutocompletePrediction) => {
      console.log("handleSuggestionSelect called with:", prediction);
      
      // Immediately update the input value and hide suggestions
      const selectedText = prediction.description;
      setInputValue(selectedText);
      setShowSuggestions(false);
      onChange(selectedText);
      
      console.log("Input value set to:", selectedText);

      if (!placesServiceRef.current) {
        console.error("Places service not available");
        return;
      }

      setIsLoading(true);

      // Get detailed place information including coordinates
      const request = {
        placeId: prediction.place_id,
        fields: [
          "geometry",
          "formatted_address",
          "name",
          "types",
          "place_id",
          "address_components",
        ],
      };

      placesServiceRef.current.getDetails(request, (place, status) => {
        console.log("Places service response:", { place, status });
        setIsLoading(false);

        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place &&
          place.geometry
        ) {
          const location = place.geometry.location;
          if (location) {
            const propertyData = {
              address: place.formatted_address || prediction.description,
              coordinates: {
                lat: location.lat(),
                lng: location.lng(),
              },
              placeId: place.place_id || prediction.place_id,
              name: place.name,
              types: place.types,
            };

            console.log("Selected property:", propertyData);
            onPropertySelect(propertyData);
          }
        } else {
          console.error("Failed to get place details:", status);
          // Still call onPropertySelect with basic info even if details fail
          const basicPropertyData = {
            address: prediction.description,
            coordinates: { lat: 0, lng: 0 }, // Default coordinates
            placeId: prediction.place_id,
            name: prediction.structured_formatting.main_text,
            types: prediction.types,
          };
          onPropertySelect(basicPropertyData);
        }
      });
    },
    [onChange, onPropertySelect]
  );

  // Handle manual search without suggestion
  const handleInputBlur = () => {
    // Don't hide if user is selecting a suggestion
    if (isSelectingSuggestion) return;
    
    // Increase timeout to give more time for click events
    setTimeout(() => {
      if (!isSelectingSuggestion) {
        setShowSuggestions(false);
      }
    }, 400); // Even longer delay to ensure click events complete
  };

  // Handle Enter key press for search
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSuggestionSelect(suggestions[0]);
      } else if (inputValue.trim()) {
        // Perform a general search if no suggestions
        searchProperties(inputValue);
      }
    }
  };

  // Get icon for property type
  const getPropertyIcon = (types: string[] = []) => {
    if (
      types.some((type) => ["lodging", "real_estate_agency"].includes(type))
    ) {
      return <Building2 className="h-4 w-4 text-[#FFD700]" />;
    }
    if (
      types.some((type) =>
        ["establishment", "point_of_interest"].includes(type)
      )
    ) {
      return <Building2 className="h-4 w-4 text-blue-400" />;
    }
    return <MapPin className="h-4 w-4 text-[#FFD700]" />;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => inputValue && searchProperties(inputValue)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full bg-black/60 text-white placeholder:text-white/50 border border-white/20 rounded-lg pl-12 pr-16 py-3 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-5 w-5 animate-spin text-[#FFD700]" />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg z-[99999] max-h-80 overflow-y-auto">
          {suggestions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("SpecificPropertySearch: Suggestion clicked:", prediction.description);
                setIsSelectingSuggestion(true);
                
                // Call the handler immediately
                handleSuggestionSelect(prediction);
                
                // Reset the flag after a longer delay
                setTimeout(() => {
                  setIsSelectingSuggestion(false);
                }, 400);
              }}
              onClick={(e) => {
                // Also handle regular click as backup
                e.preventDefault();
                e.stopPropagation();
              }}
              className="w-full text-left px-4 py-3 text-white hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                {getPropertyIcon(prediction.types)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {prediction.structured_formatting.main_text}
                  </p>
                  {prediction.structured_formatting.secondary_text && (
                    <p className="text-xs text-white/70 truncate">
                      {prediction.structured_formatting.secondary_text}
                    </p>
                  )}
                  {prediction.types && prediction.types.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {prediction.types.slice(0, 2).map((type, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-white/10 rounded-full text-white/60"
                        >
                          {type.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}

          {/* Search tip */}
          <div className="px-4 py-2 text-xs text-white/50 border-t border-white/10">
            💡 Tip: Search for specific buildings, complexes, or addresses
          </div>
        </div>
      )}

      {/* No results message */}
      {showSuggestions &&
        suggestions.length === 0 &&
        !isLoading &&
        inputValue.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg z-[99999] p-4">
            <div className="text-center text-white/70">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-white/50" />
              <p className="text-sm">
                No properties found for &ldquo;{inputValue}&rdquo;
              </p>
              <p className="text-xs text-white/50 mt-1">
                Try searching for a building name, address, or area
              </p>
            </div>
          </div>
        )}
    </div>
  );
};

export default SpecificPropertySearch;
