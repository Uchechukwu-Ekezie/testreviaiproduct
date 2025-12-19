"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Wrapper, Status } from "@googlemaps/react-wrapper";

interface LocationSearchInputProps {
  value: string;
  onChange: (
    location: string,
    coordinates?: { lat: number; lng: number }
  ) => void;
  placeholder?: string;
  className?: string;
}

// The actual input component that uses Google Maps
const LocationInput = ({
  value,
  onChange,
  placeholder = "Search location...",
  className = "",
}: LocationSearchInputProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null
  );
  const mapRef = useRef<google.maps.Map | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Google Maps services
  useEffect(() => {
    const initializeServices = () => {
      try {
        console.log("Initializing Google Maps services for LocationInput...");

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
        console.log(
          "Google Maps services initialized successfully for LocationInput"
        );
      } catch (error) {
        console.error("Error initializing Google Maps services:", error);
      }
    };

    // Initialize immediately since we're inside the Wrapper
    initializeServices();
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Search for location suggestions
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!autocompleteServiceRef.current) {
      console.warn("Google Maps Autocomplete service not available");
      return;
    }

    setIsLoading(true);

    try {
      const request = {
        input: query,
        componentRestrictions: { country: "ng" }, // Restrict to Nigeria
        types: ["geocode"], // Include all geocoding results
      };

      console.log("Searching for:", query);

      autocompleteServiceRef.current.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsLoading(false);
          console.log("Search results:", { predictions, status });

          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions &&
            predictions.length > 0
          ) {
            setSuggestions(predictions.slice(0, 5)); // Limit to 5 suggestions
            setShowSuggestions(true);
          } else {
            console.log("No predictions found or error:", status);
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    } catch (error) {
      console.error("Error searching locations:", error);
      setIsLoading(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce the search
    searchTimeoutRef.current = setTimeout(() => {
      if (newValue.trim().length > 2) {
        // Only search if more than 2 characters
        searchLocations(newValue);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (prediction: google.maps.places.AutocompletePrediction) => {
      console.log("LocationSearchInput: handleSuggestionSelect called with:", prediction.description);
      
      // Immediately update input value
      const selectedText = prediction.description;
      setInputValue(selectedText);
      setShowSuggestions(false);

      if (!placesServiceRef.current) {
        // If places service not available, just use the text
        onChange(selectedText);
        return;
      }

      setIsLoading(true);

      // Get detailed place information including coordinates
      const request = {
        placeId: prediction.place_id,
        fields: ["geometry", "formatted_address", "name"],
      };

      placesServiceRef.current.getDetails(request, (place, status) => {
        setIsLoading(false);

        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place &&
          place.geometry
        ) {
          const location = place.geometry.location;
          if (location) {
            const coordinates = {
              lat: location.lat(),
              lng: location.lng(),
            };
            const address = place.formatted_address || prediction.description;
            console.log("LocationSearchInput: Calling onChange with address:", address);
            onChange(address, coordinates);
          }
        } else {
          console.log("LocationSearchInput: Using fallback description");
          onChange(prediction.description);
        }
      });
    },
    [onChange]
  );

  // Handle manual input without suggestion
  const handleInputBlur = () => {
    // Give more time for click events to register
    setTimeout(() => {
      setShowSuggestions(false);
      if (inputValue !== value) {
        onChange(inputValue);
      }
    }, 300); // Increased delay to allow suggestion click
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (suggestions.length > 0) {
        // Select the first suggestion if available
        handleSuggestionSelect(suggestions[0]);
      } else if (inputValue.trim()) {
        // Use the typed location even without coordinates
        onChange(inputValue.trim());
        setShowSuggestions(false);
      }
    }
  };

  // Handle current location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder();

        try {
          const result = await geocoder.geocode({
            location: { lat: latitude, lng: longitude },
          });

          if (result.results && result.results.length > 0) {
            const address = result.results[0].formatted_address;
            setInputValue(address);
            onChange(address, { lat: latitude, lng: longitude });
          } else {
            const fallbackAddress = `${latitude.toFixed(
              6
            )}, ${longitude.toFixed(6)}`;
            setInputValue(fallbackAddress);
            onChange(fallbackAddress, { lat: latitude, lng: longitude });
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(
            6
          )}`;
          setInputValue(fallbackAddress);
          onChange(fallbackAddress, { lat: latitude, lng: longitude });
        }

        setIsLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLoading(false);
        alert(
          "Unable to get your current location. Please type your location manually."
        );
      }
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => inputValue && searchLocations(inputValue)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full bg-transparent text-white border rounded-[15px] border-white/20 pl-10 pr-12 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 placeholder:text-white/50"
        />

        {/* Current Location Button */}
        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={isLoading}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-white/50 hover:text-[#FFD700] transition-colors disabled:opacity-50"
          title="Use current location"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("LocationSearchInput: Suggestion clicked:", prediction.description);
                handleSuggestionSelect(prediction);
              }}
              onClick={(e) => {
                // Also handle regular click as backup
                e.preventDefault();
                e.stopPropagation();
              }}
              className="w-full text-left px-4 py-3 text-white hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-[#FFD700] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {prediction.structured_formatting.main_text}
                  </p>
                  {prediction.structured_formatting.secondary_text && (
                    <p className="text-xs text-white/70 truncate">
                      {prediction.structured_formatting.secondary_text}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Loading component
const LoadingComponent = () => (
  <div className="relative">
    <div className="w-full bg-transparent text-white border rounded-[15px] border-white/20 px-3 py-2">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-[#FFD700]" />
        <span className="text-white/70">Loading location search...</span>
      </div>
    </div>
  </div>
);

// Error component
const ErrorComponent = () => (
  <div className="relative">
    <input
      type="text"
      placeholder="Google Maps unavailable - type manually"
      className="w-full bg-transparent text-white border rounded-[15px] border-red-500/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-red-300/70"
      disabled
    />
  </div>
);

// Main LocationSearchInput component with Wrapper
const LocationSearchInput = (props: LocationSearchInputProps) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Google Maps API key is missing");
    return <ErrorComponent />;
  }

  const render = (status: Status) => {
    switch (status) {
      case Status.LOADING:
        return <LoadingComponent />;
      case Status.FAILURE:
        console.error("Google Maps failed to load");
        return <ErrorComponent />;
      case Status.SUCCESS:
        return <LocationInput {...props} />;
      default:
        return <LoadingComponent />;
    }
  };

  return <Wrapper apiKey={apiKey} libraries={["places"]} render={render} />;
};

export default LocationSearchInput;
