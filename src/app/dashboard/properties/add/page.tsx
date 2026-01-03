"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import {
  X,
  Plus,
  Loader2,
  ImageIcon,
  CheckCircle,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { useProperties } from "@/contexts/properties-context";
import { useAuth } from "@/contexts/auth-context";
import MapPicker from "@/components/agent/MapPicker";

// Import the separate MapPicker component

// Define amenities types
type AmenitiesData = {
  indoor: string[];
  kitchen: string[];
  bathroom: string[];
  utility: string[];
  outdoor: string[];
  security: string[];
};

type FormAmenities = {
  indoor: string[];
  kitchen: string[];
  bathroom: string[];
  utility: string[];
  outdoor: string[];
  security: string[];
};

// Toast notification component
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) => {
  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
        type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="w-5 h-5" />
      ) : (
        <AlertCircle className="w-5 h-5" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="p-1 ml-2 rounded hover:bg-black/20">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const AddPropertyPage = () => {
  const router = useRouter();
  const { createProperty } = useProperties();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Show toast notification
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000); // Auto hide after 5 seconds
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    address: "",
    property_type: "apartment",
    status: "for_rent",
    visibility_status: "visible",
    bedrooms: "",
    bathrooms: "",
    size: "",
    square_footage: "",
    year_built: "",
    lot_size: "",
    state: "",
    city: "",
    zip_code: "",
    phone: "",
    coordinate: "",
    property_url: "",
    amenities: {
      indoor: [],
      kitchen: [],
      bathroom: [],
      utility: [],
      outdoor: [],
      security: [],
    } as FormAmenities,
    // Store selected files for preview
    selectedImages: [] as Array<{
      file: File;
      previewUrl: string;
      is_primary: boolean;
      display_order: number;
    }>,
  });

  const amenitiesData: AmenitiesData = {
    indoor: [
      "Wi-Fi",
      "Air conditioning",
      "Ceiling fan",
      "Flat TV",
      "Wardrobe",
      "High speed internet",
      "Sweet TV",
      "Power backup (gen)",
      "Smoke detector",
      "Fire extinguisher",
    ],
    kitchen: [
      "Refrigerator",
      "Gas",
      "Electric cooker",
      "Microwave",
      "Cutlery",
      "Dishwasher",
    ],
    bathroom: [
      "Bathtub",
      "Air freshener",
      "Clean towel",
      "Toiletries (soap, shampoo)",
      "Hair dryer",
      "Toilet paper",
      "Mirror",
    ],
    utility: ["Washing machine", "Dryer", "Iron", "Hangers"],
    outdoor: [
      "Parking space / Garage",
      "Balcony / Terrace",
      "Swimming pool",
      "Garden or green space",
      "Outdoor furniture",
      "Security gate",
    ],
    security: [
      "Security cameras",
      "Security guard",
      "Gated community",
      "Alarm system",
      "Safe/vault",
    ],
  };

  const propertyTypes = [
    { value: "apartment", label: "Apartment" },
    { value: "house", label: "House" },
    { value: "condo", label: "Condo" },
    { value: "land", label: "Land" },
  ];

  const statusOptions = [
    { value: "for_rent", label: "For Rent" },
    { value: "for_sale", label: "For Sale" },
    { value: "just_listing", label: "Just Listing" },
  ];

  // Cloudinary Upload Function
  interface CloudinaryUploadResponse {
    secure_url: string;
    public_id: string;
    original_filename: string;
  }

  interface CloudinaryUploadResult {
    url: string;
    public_id: string;
    original_filename: string;
  }

  const uploadToCloudinary = async (
    file: File
  ): Promise<CloudinaryUploadResult> => {
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    console.log("Environment variables:", { uploadPreset, cloudName });

    if (!uploadPreset || !cloudName) {
      throw new Error(
        "Missing Cloudinary environment variables. Check your .env.local file"
      );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      console.log("Uploading to:", uploadUrl);

      const response: Response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Cloudinary error response:", errorText);
        throw new Error(
          `Failed to upload image: ${response.status} ${response.statusText}`
        );
      }

      const data: CloudinaryUploadResponse = await response.json();
      console.log("Upload successful:", data.public_id);

      return {
        url: data.secure_url,
        public_id: data.public_id,
        original_filename: data.original_filename,
      };
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      throw error;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAmenityToggle = (
    category: keyof AmenitiesData,
    amenity: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [category]: prev.amenities[category].includes(amenity)
          ? prev.amenities[category].filter((item) => item !== amenity)
          : [...prev.amenities[category], amenity],
      },
    }));
  };

  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        showToast(`${file.name} is not a valid image file`, "error");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Create preview URLs and add to selected images
    const newImages = validFiles.map((file, index) => {
      const previewUrl = URL.createObjectURL(file);
      return {
        file,
        previewUrl,
        is_primary: formData.selectedImages.length + index === 0,
        display_order: formData.selectedImages.length + index + 1,
      };
    });

    setFormData((prev) => ({
      ...prev,
      selectedImages: [...prev.selectedImages, ...newImages],
    }));

    showToast(
      `${validFiles.length} image${
        validFiles.length > 1 ? "s" : ""
      } added for preview`,
      "success"
    );

    // Clear the input so the same files can be selected again if needed
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    // Revoke the preview URL to free memory
    URL.revokeObjectURL(formData.selectedImages[index].previewUrl);

    setFormData((prev) => ({
      ...prev,
      selectedImages: prev.selectedImages
        .filter((_, i) => i !== index)
        .map((img, newIndex) => ({
          ...img,
          is_primary: newIndex === 0,
          display_order: newIndex + 1,
        })),
    }));
  };

  const setPrimaryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedImages: prev.selectedImages.map((img, i) => ({
        ...img,
        is_primary: i === index,
      })),
    }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.title.trim()) {
      showToast("Please enter a property title", "error");
      return;
    }
    if (!formData.price.trim()) {
      showToast("Please enter a price", "error");
      return;
    }
    if (!formData.description.trim()) {
      showToast("Please enter a property description", "error");
      return;
    }
    if (!formData.address.trim()) {
      showToast("Please select a location on the map", "error");
      return;
    }
    if (!selectedLocation) {
      showToast("Please pin the exact location on the map", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrls: Array<{
        url: string;
        alt_text: string;
        caption: string;
        is_primary: boolean;
        display_order: number;
      }> = [];

      // Upload images to Cloudinary if any are selected
      if (formData.selectedImages.length > 0) {
        showToast(
          `Uploading ${formData.selectedImages.length} images to Cloudinary...`,
          "success"
        );

        try {
          const uploadPromises = formData.selectedImages.map(
            (imageData, index) =>
              uploadToCloudinary(imageData.file).then((result) => ({
                url: result.url,
                alt_text: `${formData.title || "Property"} image ${index + 1}`,
                caption: "",
                is_primary: imageData.is_primary,
                display_order: imageData.display_order,
              }))
          );

          uploadedImageUrls = await Promise.all(uploadPromises);
          showToast(
            `Successfully uploaded ${uploadedImageUrls.length} images!`,
            "success"
          );

          // Clean up preview URLs
          formData.selectedImages.forEach((img) => {
            URL.revokeObjectURL(img.previewUrl);
          });
        } catch (uploadError) {
          console.error("Error uploading images:", uploadError);
          showToast("Failed to upload images. Please try again.", "error");
          setIsSubmitting(false);
          return;
        }
      }

      showToast("Creating property...", "success");

      // Prepare the payload according to API specification
      const propertyPayload: Record<string, unknown> = {
        title: formData.title.trim(),
        address: formData.address.trim(),
      };

      // Add required/optional fields only if they have values
      if (formData.description.trim()) propertyPayload.description = formData.description.trim();
      if (formData.price.trim()) propertyPayload.price = formData.price.trim();
      if (formData.property_type) propertyPayload.property_type = formData.property_type as
        | "apartment"
        | "house"
        | "land"
        | "commercial"
        | "warehouse"
        | "office";
      if (formData.status) propertyPayload.status = formData.status as 
        | "just_listing"
        | "for_sale"
        | "for_rent"
        | "sold"
        | "rented"
        | "off_market";
      if (formData.visibility_status) propertyPayload.visibility_status = formData.visibility_status === "visible" 
        ? "public" 
        : formData.visibility_status === "not_visible" 
        ? "private" 
        : formData.visibility_status;
      if (formData.bedrooms.trim()) propertyPayload.bedrooms = formData.bedrooms.trim();
      if (formData.bathrooms.trim()) propertyPayload.bathrooms = formData.bathrooms.trim();
      if (formData.size.trim()) propertyPayload.size = formData.size.trim();
      if (formData.square_footage.trim()) propertyPayload.square_footage = formData.square_footage.trim();
      if (formData.year_built.trim()) propertyPayload.year_built = formData.year_built.trim();
      if (formData.lot_size.trim()) propertyPayload.lot_size = formData.lot_size.trim();
      if (formData.state.trim()) propertyPayload.state = formData.state.trim();
      if (formData.city.trim()) propertyPayload.city = formData.city.trim();
      if (formData.zip_code.trim()) propertyPayload.zip_code = formData.zip_code.trim();
      if (formData.phone.trim()) propertyPayload.phone = formData.phone.trim();
      if (formData.coordinate.trim()) propertyPayload.coordinate = formData.coordinate.trim();
      if (formData.property_url.trim()) propertyPayload.property_url = formData.property_url.trim();
      
      // Add image_urls in the correct format
      if (uploadedImageUrls.length > 0) {
        propertyPayload.image_urls = uploadedImageUrls.map((img) => ({
          image_url: img.url,
          image_type: "other" as const,
          alt_text: img.alt_text || "",
          caption: img.caption || "",
          is_primary: img.is_primary || false,
          display_order: img.display_order || 0,
        }));
      }
      
      if (user?.id) propertyPayload.listed_by_id = user.id;
      propertyPayload.is_added_by_agent = true;
      
      // Add amenities - required field, send empty object if no amenities selected
      propertyPayload.amenities = formData.amenities || {
        indoor: [],
        kitchen: [],
        bathroom: [],
        utility: [],
        outdoor: [],
        security: [],
      };

      console.log("Property payload:", propertyPayload);

      const result = await createProperty(propertyPayload);

      if (result.success) {
        showToast("Property added successfully! 🎉", "success");
        // Wait a moment to show the success message before redirecting
        setTimeout(() => {
          router.push("/dashboard/properties");
        }, 2000);
      } else {
        showToast(`Failed to create property: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Error creating property:", error);
      showToast("An error occurred while creating the property", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#222222] to-[#2a2a2a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1f1f1f]/90 backdrop-blur-md border-b border-[#333333]">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-r from-[#780991] to-[#9d4edd] rounded-xl">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-white to-gray-300 bg-clip-text">
                Add New Property
              </h1>
              <p className="text-sm text-gray-400">
                Create a new property listing
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-3 hover:bg-[#373737] rounded-xl transition-all duration-200 hover:scale-105"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6 max-w-7xl ">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Main Form */}
          <div className="space-y-8 lg:col-span-2">
            {/* Basic Information Card */}
            <div className="bg-gradient-to-br from-[#2a2a2a] to-[#333333] rounded-2xl border border-[#404040] p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold">Basic Information</h2>
              </div>

              <div className="space-y-6">
                {/* Property Title */}
                <div>
                  <label className="block mb-3 text-sm font-medium text-gray-300">
                    Property Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g Cozy Apartment Lekki"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="w-full rounded-xl border border-[#404040] bg-[#1a1a1a] py-4 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#780991] focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Property Type and Status */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-3 text-sm font-medium text-gray-300">
                      Property Type *
                    </label>
                    <select
                      value={formData.property_type}
                      onChange={(e) =>
                        handleInputChange("property_type", e.target.value)
                      }
                      className="w-full rounded-xl border border-[#404040] bg-[#1a1a1a] py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#780991] focus:border-transparent transition-all duration-200"
                    >
                      {propertyTypes.map((type) => (
                        <option
                          key={type.value}
                          value={type.value}
                          className="bg-[#1a1a1a]"
                        >
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-3 text-sm font-medium text-gray-300">
                      Listing Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        handleInputChange("status", e.target.value)
                      }
                      className="w-full rounded-xl border border-[#404040] bg-[#1a1a1a] py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#780991] focus:border-transparent transition-all duration-200"
                    >
                      {statusOptions.map((status) => (
                        <option
                          key={status.value}
                          value={status.value}
                          className="bg-[#1a1a1a]"
                        >
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block mb-3 text-sm font-medium text-gray-300">
                    Price *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g ₦8500 per night / ₦2,500,000"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    className="w-full rounded-xl border border-[#404040] bg-[#1a1a1a] py-4 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#780991] focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-gradient-to-br from-[#2a2a2a] to-[#333333] rounded-2xl border border-[#404040] p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-600">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold">Property Location</h2>
              </div>

              <div>
                <label className="block mb-3 text-sm font-medium text-gray-300">
                  Property Location * 📍
                </label>
                <p className="mb-6 text-sm text-gray-400">
                  Search for your property address or click on the map to pin
                  the exact location
                </p>
                <div className="rounded-xl overflow-hidden border border-[#404040]">
                  <MapPicker
                    onLocationSelect={(lat, lng, address) => {
                      setSelectedLocation({ lat, lng });
                      setFormData((prev) => ({
                        ...prev,
                        address: address,
                        coordinate: `${lat}, ${lng}`,
                      }));
                    }}
                    selectedLocation={selectedLocation}
                    address={formData.address}
                  />
                </div>
              </div>
            </div>

            {/* Property Details Card */}
            <div className="bg-gradient-to-br from-[#2a2a2a] to-[#333333] rounded-2xl border border-[#404040] p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold">Property Details</h2>
              </div>

              <div className="space-y-6">
                {/* Basic Details */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div>
                    <label className="block mb-3 text-sm font-medium text-gray-300">
                      Bedrooms
                    </label>
                    <input
                      type="text"
                      placeholder="e.g 3"
                      value={formData.bedrooms}
                      onChange={(e) =>
                        handleInputChange("bedrooms", e.target.value)
                      }
                      className="w-full rounded-xl border border-[#404040] bg-[#1a1a1a] py-4 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#780991] focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block mb-3 text-sm font-medium text-gray-300">
                      Bathrooms
                    </label>
                    <input
                      type="text"
                      placeholder="e.g 2"
                      value={formData.bathrooms}
                      onChange={(e) =>
                        handleInputChange("bathrooms", e.target.value)
                      }
                      className="w-full rounded-xl border border-[#404040] bg-[#1a1a1a] py-4 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#780991] focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block mb-3 text-sm font-medium text-gray-300">
                      Size
                    </label>
                    <input
                      type="text"
                      placeholder="e.g 1200 sqft"
                      value={formData.size}
                      onChange={(e) =>
                        handleInputChange("size", e.target.value)
                      }
                      className="w-full rounded-xl border border-[#404040] bg-[#1a1a1a] py-4 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#780991] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-3 text-sm font-medium text-gray-300">
                      Square Footage
                    </label>
                    <input
                      type="text"
                      placeholder="e.g 1200"
                      value={formData.square_footage}
                      onChange={(e) =>
                        handleInputChange("square_footage", e.target.value)
                      }
                      className="w-full rounded-xl border border-[#404040] bg-[#1a1a1a] py-4 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#780991] focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block mb-3 text-sm font-medium text-gray-300">
                      Year Built
                    </label>
                    <input
                      type="text"
                      placeholder="e.g 2020"
                      value={formData.year_built}
                      onChange={(e) =>
                        handleInputChange("year_built", e.target.value)
                      }
                      className="w-full rounded-xl border border-[#404040] bg-[#1a1a1a] py-4 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#780991] focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block mb-3 text-sm font-medium text-gray-300">
                      Lot Size
                    </label>
                    <input
                      type="text"
                      placeholder="e.g 0.25 acres"
                      value={formData.lot_size}
                      onChange={(e) =>
                        handleInputChange("lot_size", e.target.value)
                      }
                      className="w-full rounded-xl border border-[#404040] bg-[#1a1a1a] py-4 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#780991] focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block mb-3 text-sm font-medium text-gray-300">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g +234 123 456 7890"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="w-full rounded-xl border border-[#404040] bg-[#1a1a1a] py-4 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#780991] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Property Images Card */}
            <div className="bg-gradient-to-br from-[#2a2a2a] to-[#333333] rounded-2xl border border-[#404040] p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold">Property Images</h2>
              </div>

              <div className="space-y-6">
                {/* Image Upload Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {formData.selectedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-xl overflow-hidden bg-gray-800 relative border border-[#404040]">
                        <Image
                          src={image.previewUrl}
                          alt={`Property image ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        {/* Primary badge */}
                        {image.is_primary && (
                          <div className="absolute px-3 py-1 text-xs font-medium text-white rounded-full top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-600">
                            Primary
                          </div>
                        )}
                        {/* Action buttons */}
                        <div className="absolute flex gap-2 transition-opacity opacity-0 top-2 right-2 group-hover:opacity-100">
                          {!image.is_primary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(index)}
                              className="p-2 transition-colors rounded-lg bg-blue-500/90 backdrop-blur-sm hover:bg-blue-600"
                              title="Set as primary"
                            >
                              <ImageIcon className="w-3 h-3 text-white" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-2 transition-colors rounded-lg bg-red-500/90 backdrop-blur-sm hover:bg-red-600"
                            title="Remove image"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Upload button */}
                  {formData.selectedImages.length < 10 && (
                    <label className="aspect-square border-2 border-dashed border-[#404040] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#780991] hover:bg-[#780991]/5 transition-all duration-200 group">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelection}
                        className="hidden"
                      />
                      <Plus className="h-8 w-8 text-gray-400 group-hover:text-[#780991] transition-colors" />
                      <span className="text-xs text-gray-400 mt-2 group-hover:text-[#780991] transition-colors">
                        Add Image
                      </span>
                    </label>
                  )}
                </div>

                {/* Image count */}
                <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#404040]">
                  <div className="text-sm text-gray-300">
                    {formData.selectedImages.length} image
                    {formData.selectedImages.length !== 1 ? "s" : ""} selected
                    {formData.selectedImages.length > 0 && (
                      <span className="ml-2 text-gray-400">
                        (Primary:{" "}
                        {formData.selectedImages.find((img) => img.is_primary)
                          ?.file.name || "First image"}
                        )
                      </span>
                    )}
                  </div>
                  {formData.selectedImages.length > 0 && (
                    <div className="mt-2 text-xs text-blue-400">
                      📤 Images will be uploaded to Cloudinary when you submit
                      the form
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-gradient-to-br from-[#2a2a2a] to-[#333333] rounded-2xl border border-[#404040] p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold">Property Description</h2>
              </div>

              <div>
                <label className="block mb-3 text-sm font-medium text-gray-300">
                  About Property *
                </label>
                <textarea
                  placeholder="Describe your property in detail..."
                  rows={6}
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="w-full rounded-xl border border-[#404040] bg-[#1a1a1a] py-4 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#780991] focus:border-transparent transition-all duration-200 resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-gray-400">
                    Provide detailed information about your property
                  </div>
                  <div className="text-xs text-gray-400">
                    {formData.description.length}/1000
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Location Details Card */}
            <div className="bg-gradient-to-br from-[#2a2a2a] to-[#333333] rounded-2xl border border-[#404040] p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold">Location Details</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g Lagos"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="w-full rounded-lg border border-[#404040] bg-[#1a1a1a] py-3 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#780991] focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g Lekki"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="w-full rounded-lg border border-[#404040] bg-[#1a1a1a] py-3 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#780991] focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g 101001"
                    value={formData.zip_code}
                    onChange={(e) =>
                      handleInputChange("zip_code", e.target.value)
                    }
                    className="w-full rounded-lg border border-[#404040] bg-[#1a1a1a] py-3 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#780991] focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Property URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="e.g https://example.com/property"
                    value={formData.property_url}
                    onChange={(e) =>
                      handleInputChange("property_url", e.target.value)
                    }
                    className="w-full rounded-lg border border-[#404040] bg-[#1a1a1a] py-3 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#780991] focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="bg-gradient-to-br from-[#2a2a2a] to-[#333333] rounded-2xl border border-[#404040] p-6 shadow-2xl">
              <h3 className="mb-4 text-lg font-semibold">Quick Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Property Type:</span>
                  <span className="text-white capitalize">
                    {formData.property_type || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-white">
                    {statusOptions.find((s) => s.value === formData.status)
                      ?.label || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bedrooms:</span>
                  <span className="text-white">
                    {formData.bedrooms || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bathrooms:</span>
                  <span className="text-white">
                    {formData.bathrooms || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Images:</span>
                  <span className="text-white">
                    {formData.selectedImages.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Location:</span>
                  <span className="text-white">
                    {selectedLocation ? "✓ Set" : "Not set"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gradient-to-br from-[#2a2a2a] to-[#333333] rounded-2xl border border-[#404040] p-6 shadow-2xl">
              <div className="space-y-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#780991] to-[#9d4edd] text-white hover:from-[#8b0aa3] hover:to-[#b454f1] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium shadow-lg"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? "Creating Property..." : "🏠 Add Property"}
                </button>

                <button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-xl border border-[#404040] text-gray-300 hover:bg-[#373737] hover:text-white transition-all duration-200 disabled:opacity-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Amenities Section - Full Width */}
        <div className="mt-8">
          <div className="bg-gradient-to-br from-[#2a2a2a] to-[#333333] rounded-2xl border border-[#404040] p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold">Property Amenities</h2>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(amenitiesData).map(([category, items]) => (
                <div
                  key={category}
                  className="bg-[#1a1a1a] rounded-xl p-6 border border-[#404040]"
                >
                  <h3 className="flex items-center gap-2 mb-4 text-lg font-medium text-gray-200 capitalize">
                    <div className="w-2 h-2 bg-gradient-to-r from-[#780991] to-[#9d4edd] rounded-full"></div>
                    {category} Amenities
                  </h3>
                  <div className="space-y-3">
                    {items.map((amenity) => (
                      <label
                        key={amenity}
                        className="flex items-center space-x-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={formData.amenities[
                            category as keyof AmenitiesData
                          ].includes(amenity)}
                          onChange={() =>
                            handleAmenityToggle(
                              category as keyof AmenitiesData,
                              amenity
                            )
                          }
                          className="w-4 h-4 text-[#780991] bg-[#2a2a2a] border-[#404040] rounded focus:ring-[#780991] focus:ring-2 transition-colors"
                        />
                        <span className="text-sm text-gray-300 transition-colors group-hover:text-white">
                          {amenity}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AddPropertyPage;
