"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { Loader2, AlertCircle, MapPin, Search } from "lucide-react";

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  selectedLocation: { lat: number; lng: number } | null;
  address: string;
}

// Map Component
const Map = ({
  onLocationSelect,
  selectedLocation,
  address,
}: MapPickerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [searchInput, setSearchInput] = useState(address);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const defaultCenter = { lat: 6.5244, lng: 3.3792 }; // Lagos, Nigeria
    const center = selectedLocation || defaultCenter;

    const map = new google.maps.Map(mapRef.current, {
      zoom: selectedLocation ? 15 : 11,
      center: center,
      styles: [
        {
          featureType: "all",
          elementType: "geometry.fill",
          stylers: [{ color: "#2a2a2a" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.fill",
          stylers: [{ color: "#ffffff" }],
        },
        {
          featureType: "water",
          elementType: "geometry.fill",
          stylers: [{ color: "#1a1a1a" }],
        },
        {
          featureType: "road",
          elementType: "geometry.fill",
          stylers: [{ color: "#404040" }],
        },
      ],
    });

    mapInstanceRef.current = map;

    // Add click listener
    map.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        addMarker(lat, lng);
        handleLocationSelect(lat, lng);
      }
    });

    // Initialize autocomplete
    if (searchInputRef.current && !autocompleteRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          types: ["address"],
          componentRestrictions: { country: "ng" },
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || "";

          setSearchInput(address);
          map.setCenter({ lat, lng });
          map.setZoom(15);
          addMarker(lat, lng);
          onLocationSelect(lat, lng, address);
        }
      });

      autocompleteRef.current = autocomplete;
    }

    // Add initial marker if location is selected
    if (selectedLocation) {
      addMarker(selectedLocation.lat, selectedLocation.lng);
    }
  }, []);

  // Update search input when address prop changes
  useEffect(() => {
    setSearchInput(address);
  }, [address]);

  // Handle location selection with reverse geocoding
  const handleLocationSelect = useCallback(
    async (lat: number, lng: number, providedAddress?: string) => {
      if (providedAddress) {
        onLocationSelect(lat, lng, providedAddress);
        return;
      }

      // If no address provided, perform reverse geocoding
      const geocoder = new google.maps.Geocoder();
      try {
        const result = await geocoder.geocode({ location: { lat, lng } });
        const formattedAddress =
          result.results[0]?.formatted_address ||
          `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setSearchInput(formattedAddress);
        onLocationSelect(lat, lng, formattedAddress);
      } catch (error) {
        console.error("Geocoding error:", error);
        const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setSearchInput(fallbackAddress);
        onLocationSelect(lat, lng, fallbackAddress);
      }
    },
    [onLocationSelect]
  );

  // Add marker function
  const addMarker = useCallback(
    (lat: number, lng: number) => {
      if (!mapInstanceRef.current) return;

      // Remove existing marker
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      // Create new marker
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        draggable: true,
        animation: google.maps.Animation.DROP,
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
          scaledSize: new google.maps.Size(32, 32),
        },
      });

      // Add drag listener
      marker.addListener("dragend", () => {
        const position = marker.getPosition();
        if (position) {
          const dragLat = position.lat();
          const dragLng = position.lng();
          handleLocationSelect(dragLat, dragLng);
        }
      });

      markerRef.current = marker;
    },
    [handleLocationSelect]
  );

  // Handle manual address search
  const handleAddressSearch = useCallback(
    async (searchAddress: string) => {
      if (!searchAddress.trim()) return;

      const geocoder = new google.maps.Geocoder();

      try {
        const result = await geocoder.geocode({
          address: searchAddress,
          componentRestrictions: { country: "ng" },
        });

        if (result.results && result.results.length > 0) {
          const location = result.results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          const formattedAddress = result.results[0].formatted_address;

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({ lat, lng });
            mapInstanceRef.current.setZoom(15);
            addMarker(lat, lng);
            setSearchInput(formattedAddress);
            onLocationSelect(lat, lng, formattedAddress);
          }
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      }
    },
    [addMarker, onLocationSelect]
  );

  // Handle Enter key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddressSearch(searchInput);
      }
    },
    [searchInput, handleAddressSearch]
  );

  // Handle current location
  const handleCurrentLocation = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          mapInstanceRef.current!.setCenter({ lat, lng });
          mapInstanceRef.current!.setZoom(15);
          addMarker(lat, lng);
          handleLocationSelect(lat, lng);
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert(
            "Unable to get your current location. Please search for your address or click on the map."
          );
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search for an address... (Press Enter to search)"
          className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#780991]"
        />
      </div>

      {/* Map Container */}
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-96 rounded-lg border border-[#2A2A2A] bg-[#1a1a1a]"
        />

        {/* Current Location Button */}
        <button
          type="button"
          onClick={handleCurrentLocation}
          className="absolute top-4 right-4 p-2 bg-[#780991] text-white rounded-lg shadow-lg hover:bg-[#8b0aa3] transition-colors"
          title="Use current location"
        >
          <MapPin className="h-4 w-4" />
        </button>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg text-sm max-w-xs">
          <p className="font-medium mb-1">📍 Select Location</p>
          <p>• Type address and press Enter</p>
          <p>• Select from dropdown suggestions</p>
          <p>• Click anywhere on the map</p>
          <p>• Drag the red marker to adjust</p>
        </div>
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="bg-[#212121] border border-[#2A2A2A] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-green-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-500">Location Selected</p>
              <p className="text-sm text-gray-400 mt-1">{address}</p>
              <p className="text-xs text-gray-500 mt-1">
                Coordinates: {selectedLocation.lat.toFixed(6)},{" "}
                {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Loading component
const LoadingComponent = () => (
  <div className="w-full h-96 rounded-lg border border-[#2A2A2A] bg-[#1a1a1a] flex items-center justify-center">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-[#780991]" />
      <p className="text-gray-400">Loading Google Maps...</p>
    </div>
  </div>
);

// Error component
const ErrorComponent = ({ status }: { status: Status }) => (
  <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
    <div className="flex items-center gap-2">
      <AlertCircle className="h-5 w-5 text-red-500" />
      <p className="text-red-200">
        {status === Status.FAILURE
          ? "Failed to load Google Maps. Please check your API key."
          : `Google Maps error: ${status}`}
      </p>
    </div>
  </div>
);

// Main MapPicker component with Wrapper
const MapPicker = (props: MapPickerProps) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-200">
            Google Maps API key is missing. Please add
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.
          </p>
        </div>
      </div>
    );
  }

  const render = (status: Status) => {
    switch (status) {
      case Status.LOADING:
        return <LoadingComponent />;
      case Status.FAILURE:
        return <ErrorComponent status={status} />;
      case Status.SUCCESS:
        return <Map {...props} />;
      default:
        return <LoadingComponent />;
    }
  };

  return <Wrapper apiKey={apiKey} libraries={["places"]} render={render} />;
};

export default MapPicker;
