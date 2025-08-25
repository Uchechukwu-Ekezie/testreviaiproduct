"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Search,
  Upload,
  MapPin,
  Phone,
  Mail,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";
import { useProperties } from "@/contexts/properties-context";

// Declare global google object for TypeScript
declare global {
  interface Window {
    google: typeof google;
    initPropertyMap?: () => void;
  }
}

interface Property {
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
  square_footage?: string;
  state?: string;
  city?: string;
  zip_code?: string;
  image_url?: string;
  property_url?: string;
  phone?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  amenities?: {
    indoor?: string[];
    kitchen?: string[];
    bathroom?: string[];
    utility?: string[];
    outdoor?: string[];
    security?: string[];
  };
  scrape_status: "pending" | "completed" | "no_contact" | "error";
  listed_by?: string;
  image_urls?: Array<{
    url: string;
    image_type?: string;
    alt_text?: string;
    caption?: string;
    is_primary: boolean;
    display_order: number;
  }>;
  images?: Array<{
    id: string;
    image_url: string;
    alt_text?: string;
    caption?: string;
    image_type?: string;
    is_primary: boolean;
    display_order: number;
  }>;
}

// Property Map Component
const PropertyMap = ({
  coordinate,
  address,
  title,
}: {
  coordinate?: string;
  address: string;
  title: string;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google || !coordinate) return;

      try {
        // Parse coordinates
        const [lat, lng] = coordinate
          .split(",")
          .map((coord) => parseFloat(coord.trim()));

        if (isNaN(lat) || isNaN(lng)) {
          setError("Invalid coordinates");
          setIsLoading(false);
          return;
        }

        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 15,
          center: { lat, lng },
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

        // Add marker
        new window.google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: title,
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            scaledSize: new window.google.maps.Size(32, 32),
          },
        });

        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="color: #333; padding: 8px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${title}</h4>
              <p style="margin: 0; font-size: 12px;">${address}</p>
            </div>
          `,
        });

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: title,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        setIsLoading(false);
      } catch (err) {
        console.error("Error initializing map:", err);
        setError("Failed to load map");
        setIsLoading(false);
      }
    };

    // Load Google Maps script if not already loaded
    if (!window.google) {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setError("Google Maps API key is missing");
        setIsLoading(false);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initPropertyMap`;
      script.async = true;

      window.initPropertyMap = initMap;

      script.onerror = () => {
        setError("Failed to load Google Maps");
        setIsLoading(false);
      };

      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (window.initPropertyMap) {
        window.initPropertyMap = undefined;
      }
    };
  }, [coordinate, address, title]);

  if (error) {
    return (
      <div className="h-48 bg-[#373737] rounded-[15px] flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <span className="text-sm text-gray-400">{error}</span>
        </div>
      </div>
    );
  }

  if (!coordinate) {
    return (
      <div className="h-48 bg-[#373737] rounded-[15px] flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <span className="text-sm text-gray-400">
            No location data available
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-48 rounded-[15px] overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 bg-[#373737] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-6 w-6 text-[#780991] animate-spin mx-auto mb-2" />
            <span className="text-sm text-gray-400">Loading map...</span>
          </div>
        </div>
      )}
    </div>
  );
};

const PropertyViewPage = () => {
  const router = useRouter();
  const params = useParams();
  const { getPropertyById, deleteProperty } = useProperties();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [isDeleting, setIsDeleting] = useState(false);

  const tabs = ["All", "Property", "Contact Information", "Booking History"];

  // Fetch property data on component mount
  useEffect(() => {
    const fetchProperty = async () => {
      if (params?.id && typeof params.id === "string") {
        try {
          setIsLoading(true);
          setError(null);
          const propertyData = await getPropertyById(params.id);
          console.log("Fetched property:", propertyData);

          if (propertyData) {
            setProperty(propertyData);
          } else {
            setError("Property not found");
          }
        } catch (err) {
          console.error("Error fetching property:", err);
          setError("Failed to load property");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchProperty();
  }, [params?.id, getPropertyById]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "for_rent":
        return "text-green-500";
      case "for_sale":
        return "text-blue-500";
      case "just_listing":
        return "text-orange-500";
      default:
        return "text-gray-400";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "for_rent":
        return "bg-green-500";
      case "for_sale":
        return "bg-blue-500";
      case "just_listing":
        return "bg-orange-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "for_rent":
        return "For Rent";
      case "for_sale":
        return "For Sale";
      case "just_listing":
        return "Just Listing";
      default:
        return status;
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case "apartment":
        return "Apartment";
      case "house":
        return "House";
      case "condo":
        return "Condo";
      case "land":
        return "Land";
      default:
        return type;
    }
  };

  const formatPrice = (price: string | undefined) => {
    if (!price) return "Not specified";
    if (price.includes("₦") || price.includes("$")) return price;
    const numPrice = parseFloat(price.replace(/[^0-9.]/g, ""));
    return isNaN(numPrice) ? price : `₦${numPrice.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAllAmenities = (amenities: Property["amenities"]) => {
    if (!amenities) return [];

    const allAmenities: string[] = [];
    Object.values(amenities).forEach((categoryAmenities) => {
      if (Array.isArray(categoryAmenities)) {
        allAmenities.push(...categoryAmenities);
      }
    });
    return allAmenities;
  };

  const handleEdit = () => {
    router.push(`/dashboard/properties/${params?.id}/edit`);
  };

  const handleDelete = async () => {
    if (
      !property ||
      !window.confirm(
        "Are you sure you want to delete this property? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      const result = await deleteProperty(property.id);

      if (result.success) {
        alert("Property deleted successfully");
        router.push("/dashboard/properties");
      } else {
        alert(`Failed to delete property: ${result.error}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting the property");
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#222222] text-white">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-[#373737] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">Property / View</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#780991]" />
          <span className="ml-2 text-gray-400">Loading property...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !property) {
    return (
      <div className="min-h-screen bg-[#222222] text-white">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-[#373737] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">Property / View</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-4 text-red-500">Error loading property</div>
          <div className="mb-4 text-gray-400">{error}</div>
          <button
            onClick={() => router.back()}
            className="bg-[#780991] text-white px-4 py-2 rounded-lg hover:bg-[#8b0aa3] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Property Section Component
  const PropertySection = () => (
    <div className="space-y-6">
      {/* Property Overview */}
      <div className="bg-[#212121] rounded-[15px] border border-[#2a2a2a] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Property Overview</h2>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-[15px] hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-[#780991] text-white rounded-[15px] hover:bg-[#8b0aa3] transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Property
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block mb-1 text-sm text-gray-400">
              Property Name
            </label>
            <div className="font-medium text-white">{property.title}</div>
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-400">Status</label>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${getStatusDot(
                  property.status
                )}`}
              ></div>
              <span className={getStatusColor(property.status)}>
                {getStatusLabel(property.status)}
              </span>
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-400">
              Property Type
            </label>
            <div className="font-medium text-white">
              {getPropertyTypeLabel(property.property_type)}
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-400">Price</label>
            <div className="font-medium text-white">
              {formatPrice(property.price)}
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-400">Bedrooms</label>
            <div className="text-white">
              {property.bedrooms || "Not specified"}
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-400">
              Bathrooms
            </label>
            <div className="text-white">
              {property.bathrooms || "Not specified"}
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-400">Size</label>
            <div className="text-white">
              {property.size || property.square_footage || "Not specified"}
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-400">
              Date Listed
            </label>
            <div className="text-white">{formatDate(property.created_at)}</div>
          </div>
        </div>

        {/* Property Images */}
        <div>
          <label className="block mb-3 text-sm text-gray-400">
            Property Images
          </label>
          <div className="grid grid-cols-3 gap-4">
            {property.images && property.images.length > 0 ? (
              property.images.slice(0, 3).map((image, index) => (
                <div
                  key={image.id}
                  className={`${index === 0 ? "col-span-2" : ""}`}
                >
                  <div
                    className={`${
                      index === 0 ? "aspect-video" : "aspect-square"
                    } bg-gradient-to-br from-orange-400 to-orange-600 rounded-[15px] flex items-center justify-center relative overflow-hidden`}
                  >
                    <Image
                      src={image.image_url}
                      alt={image.alt_text || property.title}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const nextElement = e.currentTarget
                          .nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = "flex";
                        }
                      }}
                    />
                    <div className="items-center justify-center hidden w-full h-full">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="col-span-2">
                  <div className="aspect-video bg-gradient-to-br from-orange-400 to-orange-600 rounded-[15px] flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="aspect-square bg-gradient-to-br from-orange-400 to-orange-600 rounded-[15px] flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div className="aspect-square bg-gradient-to-br from-orange-400 to-orange-600 rounded-[15px] flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-[#212121] rounded-[15px] border border-[#2a2a2a] p-6">
        <h3 className="mb-4 text-lg font-semibold">Description</h3>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm text-gray-400">About</label>
            <p className="text-white">
              {property.description ||
                property.ai_refined_description ||
                "No description available"}
            </p>
          </div>
          {property.amenities &&
            getAllAmenities(property.amenities).length > 0 && (
              <div>
                <label className="block mb-2 text-sm text-gray-400">
                  Amenities
                </label>
                <div className="flex flex-wrap gap-2">
                  {getAllAmenities(property.amenities).map((amenity, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#373737] rounded-[15px] text-sm text-white"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          <div>
            <label className="block mb-2 text-sm text-gray-400">
              Visibility
            </label>
            <span
              className={`px-3 py-1 rounded-[15px] text-sm ${
                property.visibility_status === "visible"
                  ? "bg-green-900/30 text-green-400"
                  : "bg-red-900/30 text-red-400"
              }`}
            >
              {property.visibility_status === "visible"
                ? "Visible to public"
                : "Hidden from public"}
            </span>
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="bg-[#212121] rounded-[15px] border border-[#2a2a2a] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Location Info</h3>
          {property.coordinate && (
            <button
              onClick={() => {
                const [lat, lng] = property
                  .coordinate!.split(",")
                  .map((coord) => coord.trim());
                window.open(
                  `https://www.google.com/maps?q=${lat},${lng}`,
                  "_blank"
                );
              }}
              className="flex items-center gap-2 px-3 py-1 text-sm text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <MapPin className="w-4 h-4" />
              Open in Maps
            </button>
          )}
        </div>
        <div>
          <label className="block mb-2 text-sm text-gray-400">
            Full Address
          </label>
          <div className="flex items-start gap-3 mb-4">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <span className="text-white">{property.address}</span>
          </div>
          {property.coordinate && (
            <div className="mb-4">
              <label className="block mb-1 text-sm text-gray-400">
                Coordinates
              </label>
              <div className="font-mono text-sm text-white">
                {property.coordinate}
              </div>
            </div>
          )}
          {(property.city || property.state || property.zip_code) && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              {property.city && (
                <div>
                  <label className="block mb-1 text-sm text-gray-400">
                    City
                  </label>
                  <div className="text-white">{property.city}</div>
                </div>
              )}
              {property.state && (
                <div>
                  <label className="block mb-1 text-sm text-gray-400">
                    State
                  </label>
                  <div className="text-white">{property.state}</div>
                </div>
              )}
              {property.zip_code && (
                <div>
                  <label className="block mb-1 text-sm text-gray-400">
                    Zip Code
                  </label>
                  <div className="text-white">{property.zip_code}</div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Map */}
        <PropertyMap
          coordinate={property.coordinate}
          address={property.address}
          title={property.title}
        />
      </div>
    </div>
  );

  // Contact Information Section Component
  const ContactSection = () => (
    <div className="space-y-6">
      <div className="bg-[#212121] rounded-[15px] border border-[#2a2a2a] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Contact Information</h2>
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-[#780991] text-white rounded-[15px] hover:bg-[#8b0aa3] transition-colors"
          >
            Edit Contact
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block mb-2 text-sm text-gray-400">
              Property ID
            </label>
            <div className="font-medium text-white">{property.id}</div>
          </div>

          {property.phone && (
            <div>
              <label className="block mb-2 text-sm text-gray-400">
                Phone Number
              </label>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-white">{property.phone}</span>
              </div>
            </div>
          )}

          {property.property_url && (
            <div>
              <label className="block mb-2 text-sm text-gray-400">
                Property URL
              </label>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <a
                  href={property.property_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  {property.property_url}
                </a>
              </div>
            </div>
          )}

          <div>
            <label className="block mb-2 text-sm text-gray-400">
              Listed By
            </label>
            <div className="text-white">
              {property.listed_by || "Not specified"}
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-400">Created</label>
            <div className="text-white">{formatDate(property.created_at)}</div>
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-400">
              Last Updated
            </label>
            <div className="text-white">{formatDate(property.updated_at)}</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Booking History Section Component
  const BookingHistorySection = () => (
    <div className="space-y-6">
      <div className="bg-[#212121] rounded-[15px] border border-[#2a2a2a] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Booking History</h2>
          <button className="px-4 py-2 bg-[#780991] text-white rounded-[15px] hover:bg-[#8b0aa3] transition-colors">
            View All Bookings
          </button>
        </div>

        <div className="py-12 text-center">
          <div className="mb-4 text-gray-400">
            Booking functionality coming soon
          </div>
          <div className="text-sm text-gray-500">
            This feature will be available in a future update
          </div>
        </div>
      </div>
    </div>
  );

  // All Section Component (combines everything)
  const AllSection = () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left Column - Property Details */}
      <div className="lg:col-span-2">
        <PropertySection />
      </div>

      {/* Right Column - Contact & Summary */}
      <div className="space-y-6">
        {/* Contact Information Summary */}
        <div className="bg-[#212121] rounded-[15px] border border-[#2a2a2a] p-6">
          <h3 className="mb-4 text-lg font-semibold">Contact Information</h3>
          <div className="space-y-4">
            {property.phone && (
              <div>
                <label className="block mb-1 text-sm text-gray-400">
                  Phone Number
                </label>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{property.phone}</span>
                </div>
              </div>
            )}
            {property.property_url && (
              <div>
                <label className="block mb-1 text-sm text-gray-400">
                  Property URL
                </label>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a
                    href={property.property_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 transition-colors hover:text-blue-300"
                  >
                    View External Link
                  </a>
                </div>
              </div>
            )}
            <div>
              <label className="block mb-1 text-sm text-gray-400">
                Property ID
              </label>
              <span className="font-mono text-sm text-white">
                {property.id}
              </span>
            </div>
          </div>
        </div>

        {/* Property Summary */}
        <div className="bg-[#212121] rounded-[15px] border border-[#2a2a2a] p-6">
          <h3 className="mb-4 text-lg font-semibold">Property Summary</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm text-gray-400">Status</label>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${getStatusDot(
                    property.status
                  )}`}
                ></div>
                <span className={getStatusColor(property.status)}>
                  {getStatusLabel(property.status)}
                </span>
              </div>
            </div>
            <div>
              <label className="block mb-1 text-sm text-gray-400">
                Visibility
              </label>
              <div className="font-medium text-white">
                {property.visibility_status === "visible" ? "Public" : "Hidden"}
              </div>
            </div>
            <div>
              <label className="block mb-1 text-sm text-gray-400">
                Date Created
              </label>
              <div className="text-white">
                {formatDate(property.created_at)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "Property":
        return <PropertySection />;
      case "Contact Information":
        return <ContactSection />;
      case "Booking History":
        return <BookingHistorySection />;
      default:
        return <AllSection />;
    }
  };

  return (
    <div className="min-h-screen bg-[#222222] text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#373737] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Property / {property.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 rounded-[15px] border border-[#2A2A2A] bg-transparent py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#780991]"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 pt-4">
        <div className="flex gap-6 border-b border-[#2a2a2a]">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-[#780991] text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">{renderContent()}</div>
    </div>
  );
};

export default PropertyViewPage;
