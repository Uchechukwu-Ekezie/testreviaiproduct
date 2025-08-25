"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  BathIcon,
  BedIcon,
  Flag,
  Phone,
  User,
  Mail,
  Copy,
  Check,
} from "lucide-react";
import { Context } from "@/types/chatMessage";

interface Property {
  id?: string;
  title?: string;
  image_url?: string | null;
  property_type?: string;
  location?: string; // This should match the required location field from Context
  price?: number | string;
  description?: string;
  coordinate?: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: string;
  listed_by?: string;
  year_built?: string;
  lot_size?: string;
  square_footage?: string;
  state?: string;
  city?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  created_by?: string;
  photos?: string[];
  rental_grade?: number | string;
  environmental_score?: number | string;
  neighborhood_score?: number | string;
  ai_refined_description?: string;
  status?: string;
}

interface ModalContent {
  title: string;
  content: React.ReactNode;
}

interface PropertyActionsProps {
  property: Context;
  location?: string; // Made optional since we can derive from property
  description?: string;
  status?: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: string;
  listed_by?: string;
  year_built?: string;
  lot_size?: string;
  square_footage?: string;
  state?: string;
  city?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  created_by?: string;
  rental_grade?: number | string;
  environmental_score?: number | string;
  neighborhood_score?: number | string;
  ai_refined_description?: string;
}

const TextRating: React.FC<{
  rating: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
}> = ({ rating, size = "md", showNumber = true }) => {
  const getRatingText = (rating: number): string => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 3.5) return "Very Good";
    if (rating >= 2.5) return "Good";
    if (rating >= 1.5) return "Average";
    if (rating >= 0.5) return "Fair";
    return "Poor";
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return "text-green-400";
    if (rating >= 3.5) return "text-blue-400";
    if (rating >= 2.5) return "text-yellow-400";
    if (rating >= 1.5) return "text-orange-400";
    if (rating >= 0.5) return "text-red-400";
    return "text-gray-400";
  };

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const textClass = sizeClasses[size];
  const ratingText = getRatingText(rating);
  const colorClass = getRatingColor(rating);

  return (
    <div className="flex items-center gap-2">
      <span className={`${textClass} font-medium ${colorClass}`}>
        {ratingText}
      </span>
      {showNumber && (
        <span className="text-xs text-gray-400">({rating.toFixed(1)}/5)</span>
      )}
    </div>
  );
};

const CopyButton: React.FC<{
  text: string;
  label: string;
}> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 ml-2 transition-colors rounded-md hover:bg-gray-700/50 group"
      title={`Copy ${label}`}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-300" />
      )}
    </button>
  );
};

const convertToRating = (score: number): number => {
  return Math.min(Math.max(score * 5, 0), 5);
};

const getScoreDescription = (score: number): string => {
  if (score >= 0.9) return "Excellent";
  if (score >= 0.7) return "Very Good";
  if (score >= 0.5) return "Good";
  if (score >= 0.3) return "Average";
  if (score >= 0.1) return "Fair";
  return "Poor";
};

const getRatingDescription = (rating: number): string => {
  if (rating >= 4.5) return "Excellent";
  if (rating >= 3.5) return "Very Good";
  if (rating >= 2.5) return "Good";
  if (rating >= 1.5) return "Average";
  if (rating >= 0.5) return "Fair";
  return "Poor";
};

const PropertyActions: React.FC<PropertyActionsProps> = ({
  property,
  location: locationProp,
  description: ai_refined_description,
  status: statusProp,
  phone: phoneProp,
  email: emailProp,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContent>({
    title: "",
    content: "",
  });

  // Helper function to safely get location
  const getLocation = (): string => {
    return (
      property.location ||
      property.address ||
      locationProp ||
      property.coordinate ||
      "Location not available"
    );
  };

  // Helper function to safely get description
  const getDescription = (): string => {
    return (
      property.ai_refined_description ||
      ai_refined_description ||
      property.description ||
      ""
    );
  };

  // Helper function to safely get status
  const getStatus = (): string => {
    return property.status || statusProp || "Status not available";
  };

  // Helper function to safely parse numeric values
  const safeParseNumber = (
    value: number | string | undefined,
    defaultValue: number = 0
  ): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  };

  // Helper function to safely format price
  const formatPrice = (price: number | string | undefined): string => {
    if (!price) return "Price on request";

    if (typeof price === "string") {
      // If it's already formatted, return as is
      if (price.toLowerCase().includes("request") || price.includes("$")) {
        return price;
      }
      // Try to parse as number
      const numPrice = parseFloat(price);
      if (isNaN(numPrice)) return price;
      return `$${numPrice.toLocaleString()}`;
    }

    if (typeof price === "number") {
      return `$${price.toLocaleString()}`;
    }

    return "Price on request";
  };

  const location = getLocation();
  const description = getDescription();
  const status = getStatus();

  const rentalGrade = safeParseNumber(property.rental_grade, 3);
  const environmentalScore = safeParseNumber(property.environmental_score, 0.7);
  const neighborhoodScore = safeParseNumber(property.neighborhood_score, 0.8);

  // Parse contact info from JSON string or use direct values
  const parseContactInfo = (contactData: string | undefined) => {
    if (!contactData) return { phone_numbers: [], emails: [] };

    try {
      // Try to parse as JSON string first
      const parsed = JSON.parse(contactData);

      // Check if it's an array (simple phone numbers array)
      if (Array.isArray(parsed)) {
        return {
          phone_numbers: parsed,
          emails: [],
        };
      }

      // Check if it's an object with phone_numbers and emails
      if (typeof parsed === "object" && parsed !== null) {
        return {
          phone_numbers: parsed.phone_numbers || [],
          emails: parsed.emails || [],
        };
      }

      // If it's neither array nor object, treat as single phone
      return {
        phone_numbers: [parsed],
        emails: [],
      };
    } catch (error) {
      // If parsing fails, treat as single phone number
      return {
        phone_numbers: contactData ? [contactData] : [],
        emails: [],
      };
    }
  };

  const contactData = parseContactInfo(property.phone || phoneProp);
  const phoneNumbers = contactData.phone_numbers;
  const emailAddresses = contactData.emails;

  // Also include any direct email prop
  const allEmails = [...emailAddresses];
  const directEmail = (property as any).email || emailProp;
  if (directEmail && !allEmails.includes(directEmail)) {
    allEmails.push(directEmail);
  }

  const handleButtonClick = (action: string) => {
    const actions: Record<string, ModalContent> = {
      details: {
        title: "Rental Details",
        content: (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {property.property_type || "Property"} at {location}
            </h3>

            {rentalGrade > 0 && (
              <div className="p-4 rounded-lg bg-gray-800/50">
                <h4 className="mb-3 font-semibold">Rental Grade:</h4>
                <div className="flex items-center gap-3">
                  <TextRating rating={rentalGrade} size="md" />
                  <span className="text-sm text-gray-400">
                    ({getRatingDescription(rentalGrade)})
                  </span>
                </div>
              </div>
            )}

            {description && (
              <div className="p-4 rounded-lg bg-gray-800/50">
                <h4 className="mb-2 font-semibold">Description:</h4>
                <p className="whitespace-pre-line">{description}</p>
              </div>
            )}

            <div className="flex flex-col gap-2 p-4 rounded-lg bg-gray-800/50">
              <span className="flex gap-1 text-lg">
                <div className="flex gap-1">
                  <span className="font-semibold">
                    <Flag />
                  </span>
                  <span>Status:</span>
                </div>
                <p>{status}</p>
              </span>

              {property.bedrooms && (
                <span className="flex gap-1 text-lg">
                  <div className="flex gap-1">
                    <span className="font-semibold">
                      <BedIcon />
                    </span>
                    <span>Bedrooms:</span>
                  </div>
                  <p>{property.bedrooms}</p>
                </span>
              )}

              {property.bathrooms && (
                <span className="flex gap-1 text-lg">
                  <div className="flex gap-1">
                    <span className="font-semibold">
                      <BathIcon />
                    </span>
                    <span>Bathrooms:</span>
                  </div>
                  <p>{property.bathrooms}</p>
                </span>
              )}

              {property.size && (
                <p className="text-lg">
                  <span className="font-semibold">Size:</span> {property.size}
                </p>
              )}

              {property.listed_by && (
                <span className="flex gap-1 text-lg">
                  <div className="flex gap-1">
                    <span className="font-semibold">
                      <User />
                    </span>
                    <span>Agent:</span>
                  </div>
                  <p>{property.listed_by}</p>
                </span>
              )}

              {property.year_built && (
                <span className="flex gap-1 text-lg">
                  <div className="flex gap-1">
                    <span className="font-semibold">
                      <User />
                    </span>
                    <span>Year Built:</span>
                  </div>
                  <p>{property.year_built}</p>
                </span>
              )}
            </div>

            <p className="text-lg">
              <span className="font-semibold">Price:</span>
              {formatPrice(property.price)}
            </p>
          </div>
        ),
      },
      contact: {
        title: "Contact Agent",
        content: (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {property.property_type || "Property"} at {location}
            </h3>

            {phoneNumbers.length > 0 || allEmails.length > 0 ? (
              <div className="space-y-3">
                {/* Phone Numbers */}
                {phoneNumbers.length > 0 && (
                  <div className="p-4 rounded-lg bg-gray-800/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Phone className="w-5 h-5 text-blue-400" />
                      <span className="font-semibold">
                        Phone Number{phoneNumbers.length > 1 ? "s" : ""}:
                      </span>
                    </div>
                    <div className="space-y-2">
                      {phoneNumbers.map((phoneNum: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded-md bg-gray-700/30"
                        >
                          <a
                            href={`tel:${phoneNum}`}
                            className="text-blue-400 transition-colors hover:text-blue-300"
                          >
                            {phoneNum}
                          </a>
                          <CopyButton text={phoneNum} label="phone number" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email Addresses */}
                {allEmails.length > 0 && (
                  <div className="p-4 rounded-lg bg-gray-800/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Mail className="w-5 h-5 text-green-400" />
                      <span className="font-semibold">
                        Email Address{allEmails.length > 1 ? "es" : ""}:
                      </span>
                    </div>
                    <div className="space-y-2">
                      {allEmails.map((emailAddr: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded-md bg-gray-700/30"
                        >
                          <a
                            href={`mailto:${emailAddr}`}
                            className="text-green-400 break-all transition-colors hover:text-green-300"
                          >
                            {emailAddr}
                          </a>
                          <CopyButton text={emailAddr} label="email address" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Instructions */}
                <div className="p-3 border rounded-lg bg-blue-900/20 border-blue-700/30">
                  <p className="text-sm text-blue-300">
                    💡 <strong>Tip:</strong> Click on any contact detail to call
                    or email directly, or use the copy button to save the
                    information.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-gray-800/50">
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Phone className="w-12 h-12 mb-3 text-gray-500" />
                  <p className="text-lg font-medium">
                    No contact information available
                  </p>
                  <p className="text-sm text-center">
                    Contact details will be provided by the agent soon
                  </p>
                </div>
              </div>
            )}
          </div>
        ),
      },
      photos: {
        title: "Property Photos",
        content: (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {property.property_type || "Property"} at {location}
            </h3>
            <div className="flex flex-col gap-2 p-4 rounded-lg bg-gray-800/50">
              {property.photos && property.photos.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {property.photos.map((photo: string, index: number) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Property Photo ${index + 1}`}
                        className="object-cover w-full h-48 transition-opacity rounded-lg cursor-pointer hover:opacity-90"
                        onClick={() => window.open(photo, "_blank")}
                      />
                      <div className="absolute px-2 py-1 text-sm text-white rounded bottom-2 right-2 bg-black/50">
                        {index + 1} of {(property.photos as string[]).length}
                      </div>
                    </div>
                  ))}
                </div>
              ) : property.image_url ? (
                <div className="relative group">
                  <img
                    src={property.image_url}
                    alt="Property Image"
                    className="object-cover w-full h-64 transition-opacity rounded-lg cursor-pointer hover:opacity-90"
                    onClick={() => window.open(property.image_url!, "_blank")}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <span className="mb-4 text-4xl">📷</span>
                  <p className="text-lg">No photos available</p>
                  <p className="text-sm">Photos will be added soon</p>
                </div>
              )}
            </div>
          </div>
        ),
      },
      rating: {
        title: "Property Rating",
        content: (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Rating for {property.property_type || "Property"} at {location}
            </h3>

            {rentalGrade > 0 ? (
              <div className="p-4 rounded-lg bg-gray-800/50">
                <h4 className="mb-3 font-semibold">Overall Rental Grade:</h4>
                <div className="flex items-center gap-3 mb-3">
                  <TextRating rating={rentalGrade} size="lg" />
                  {/* <span className="text-lg font-medium text-white">
                    {getRatingDescription(rentalGrade)}
                  </span> */}
                </div>
                <p className="text-sm text-gray-400">
                  Based on environmental factors, neighborhood quality, and
                  property data
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-gray-800/50">
                <p className="text-gray-400">
                  No rating available for this property yet.
                </p>
              </div>
            )}

            {rentalGrade > 0 && (
              <div className="p-4 rounded-lg bg-gray-800/50">
                <h4 className="mb-3 font-semibold">Rating Breakdown:</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        Overall Rental Grade
                      </span>
                      <span className="text-xs text-gray-400">
                        Based on all available data
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TextRating
                        rating={rentalGrade}
                        size="sm"
                        showNumber={false}
                      />
                      <span className="text-xs text-gray-400">
                        {rentalGrade.toFixed(1)}/5
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        Environmental Score
                      </span>
                      <span className="text-xs text-gray-400">
                        Air quality, noise, green spaces
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TextRating
                        rating={convertToRating(environmentalScore)}
                        size="sm"
                        showNumber={false}
                      />
                      <span className="text-xs text-gray-400">
                        {environmentalScore.toFixed(1)}/1.0
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        Neighborhood Score
                      </span>
                      <span className="text-xs text-gray-400">
                        Safety, amenities, accessibility
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TextRating
                        rating={convertToRating(neighborhoodScore)}
                        size="sm"
                        showNumber={false}
                      />
                      <span className="text-xs text-gray-400">
                        {neighborhoodScore.toFixed(1)}/1.0
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 mt-4 rounded-lg bg-gray-700/30">
                  <h5 className="mb-2 text-xs font-medium text-gray-300">
                    Score Details:
                  </h5>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>
                      <strong>Environmental:</strong>{" "}
                      {getScoreDescription(environmentalScore)} (
                      {(environmentalScore * 100).toFixed(0)}%)
                    </p>
                    <p>
                      <strong>Neighborhood:</strong>{" "}
                      {getScoreDescription(neighborhoodScore)} (
                      {(neighborhoodScore * 100).toFixed(0)}%)
                    </p>
                    <p className="mt-2 text-gray-500">
                      📊 Environmental & Neighborhood scores: 0.0-1.0 scale
                      converted to text ratings
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ),
      },
      reviews: {
        title: "Property Reviews",
        content: (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Reviews for {property.property_type || "property"} at {location}
            </h3>

            <div className="p-4 rounded-lg bg-gray-800/50">
              <p className="text-gray-400">
                Detailed reviews and tenant feedback will be displayed here.
              </p>
            </div>
          </div>
        ),
      },
      default: {
        title: "Property Information",
        content: "Loading property details...",
      },
    };

    setModalContent(actions[action] || actions.default);
    setIsModalOpen(true);
  };

  const handleMapClick = () => {
    // Try different location sources in order of preference
    const mapLocation =
      property.coordinate ||
      property.address ||
      property.location ||
      locationProp;

    if (
      mapLocation &&
      mapLocation.trim() !== "" &&
      mapLocation !== "Location not available"
    ) {
      const encodedAddress = encodeURIComponent(mapLocation);
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
        "_blank",
        "noopener,noreferrer"
      );
    } else {
      alert("Address not available for this property");
    }
  };

  return (
    <>
      <div className="grid md:grid-cols-3 grid-cols-2 gap-3 mt-4 md:w-[530px] w-[347px]">
        {/* Rental Details */}
        <div className="">
          <button
            onClick={() => handleButtonClick("details")}
            className="w-[163px] h-[35px] px-1 border-border border-2 rounded-[15px] gap-1 text-[#CBCBCB] flex items-center justify-center hover:bg-gray-800/50 transition-colors "
          >
            <span className="text-[18px]">🏡</span>
            <span className="text-center text-[14px]">See rental details</span>
          </button>
        </div>

        {/* Contact Agent */}
        <button
          onClick={() => handleButtonClick("contact")}
          className="w-[144px] h-[35px] border-border border-2 rounded-[15px] gap-1 text-[#CBCBCB] flex items-center justify-center hover:bg-gray-800/50 transition-colors"
        >
          <span className="text-[18px]">💬</span>
          <span className="text-center text-[14px]">Contact Agent</span>
        </button>

        {/* See on Map */}
        <button
          onClick={handleMapClick}
          className="ml-[-20px] hidden md:flex w-[126px] h-[35px] border-border border-2 rounded-[15px] gap-1 text-[#CBCBCB] items-center justify-center hover:bg-gray-800/50 transition-colors"
        >
          <span className="text-[18px]">🗺</span>
          <span className="text-center text-[14px]">See on map</span>
        </button>

        {/* View Photos */}
        <button
          onClick={() => handleButtonClick("photos")}
          className="w-[167px] h-[35px] border-border border-2 rounded-[15px] gap-1 text-[#CBCBCB] flex items-center justify-center hover:bg-gray-800/50 transition-colors"
        >
          <span className="text-[18px]">📸</span>
          <span className="text-center text-[14px]">View more photos</span>
        </button>

        {/* View Rating */}
        <button
          onClick={() => handleButtonClick("rating")}
          className="w-[134px] h-[35px] border-border border-2 rounded-[15px] gap-1 text-[#CBCBCB] flex items-center justify-center hover:bg-gray-800/50 transition-colors"
        >
          <span className="text-[18px]">⭐</span>
          <span className="text-center text-[14px]">View rating</span>
        </button>

        {/* View Reviews */}
        <button
          onClick={() => handleButtonClick("reviews")}
          className="ml-[-20px] hidden md:flex w-[126px] h-[35px] border-border border-2 rounded-[15px] gap-1 text-[#CBCBCB] items-center justify-center hover:bg-gray-800/50 transition-colors"
        >
          <span className="text-[18px]">📝</span>
          <span className="text-center text-[14px]">View reviews</span>
        </button>

        <button
          onClick={handleMapClick}
          className="flex md:hidden w-[126px] h-[35px] border-border border-2 rounded-[15px] gap-1 text-[#CBCBCB] items-center justify-center hover:bg-gray-800/50 transition-colors"
        >
          <span className="text-[18px]">🗺</span>
          <span className="text-center text-[14px]">See on map</span>
        </button>
      </div>

      {/* Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[600px] bg-[#212121] border-border md:max-h-[80vh] max-h-[60vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white">
              {modalContent.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 py-4 overflow-y-auto text-gray-300">
            {modalContent.content}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PropertyActions;
