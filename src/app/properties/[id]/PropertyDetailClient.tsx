"use client";

import * as React from "react";
import type { JSX } from "react";
import { useState, useEffect } from "react";
import {
  Star,
  Heart,
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Square,
  Shield,
  Loader2,
  ThumbsDown,
  Meh,
  ThumbsUp,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useProperties } from "@/contexts/properties-context";
import { useAuth } from "@/contexts/auth-context";
import type { Property } from "@/contexts/properties-context";
import { reviewsAPI } from "@/lib/api";
import BookingModal from "@/components/BookingModal";
import imgg from "../../../../public/Image/house.jpeg";

// Enhanced markdown renderer component
const MarkdownRenderer = ({ content }: { content: string }) => {
  const renderMarkdown = (text: string) => {
    if (!text) return null;

    // Split by double newlines for paragraphs, but preserve single newlines within sections
    const sections = text.split("\n\n");

    return sections
      .map((section, index) => {
        const trimmedSection = section.trim();
        if (!trimmedSection) return null;

        // Handle main headers (##, ###, etc.)
        if (trimmedSection.match(/^#{1,6}\s/)) {
          const level = trimmedSection.match(/^(#{1,6})/)?.[1].length || 2;
          const headerText = trimmedSection.replace(/^#{1,6}\s+/, "");
          const headerTag = `h${Math.min(
            level + 1,
            6
          )}` as keyof JSX.IntrinsicElements;
          return React.createElement(
            headerTag,
            {
              key: index,
              className: "text-xl font-bold text-white mb-4 mt-6 first:mt-0",
            },
            headerText
          );
        }

        // Handle bold headers (lines that are entirely bold)
        if (trimmedSection.match(/^\*\*[^*]+\*\*:?\s*$/)) {
          const headerText = trimmedSection
            .replace(/\*\*/g, "")
            .replace(/:$/, "");
          return (
            <h4
              key={index}
              className="text-lg font-semibold text-white mb-3 mt-4 first:mt-0"
            >
              {headerText}
            </h4>
          );
        }

        // Handle numbered lists
        if (trimmedSection.match(/^\d+\./m)) {
          const listItems = trimmedSection
            .split("\n")
            .filter((line) => line.trim().match(/^\d+\./));
          return (
            <ol
              key={index}
              className="list-decimal list-inside space-y-2 text-white/80 mb-4 ml-4"
            >
              {listItems.map((item, itemIndex) => {
                const itemText = item.replace(/^\d+\.\s*/, "");
                return (
                  <li key={itemIndex} className="leading-relaxed">
                    {processInlineMarkdown(itemText)}
                  </li>
                );
              })}
            </ol>
          );
        }

        // Handle bullet lists (*, -, +)
        if (
          trimmedSection.match(/^[\*\-\+]\s/m) ||
          trimmedSection.includes("*   ")
        ) {
          const listItems = trimmedSection
            .split("\n")
            .filter(
              (line) =>
                line.trim().match(/^[\*\-\+]\s/) ||
                line.trim().startsWith("*   ")
            );
          return (
            <ul
              key={index}
              className="list-disc list-inside space-y-2 text-white/80 mb-4 ml-4"
            >
              {listItems.map((item, itemIndex) => {
                const itemText = item.replace(/^[\*\-\+]\s+|^\*\s+/, "").trim();
                return (
                  <li key={itemIndex} className="leading-relaxed">
                    {processInlineMarkdown(itemText)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Handle regular paragraphs
        return (
          <div
            key={index}
            className="text-white/80 leading-relaxed mb-4 last:mb-0"
          >
            {trimmedSection.split("\n").map((line, lineIndex) => (
              <p key={lineIndex} className={lineIndex > 0 ? "mt-2" : ""}>
                {processInlineMarkdown(line)}
              </p>
            ))}
          </div>
        );
      })
      .filter(Boolean);
  };

  // Process inline markdown (bold, italic, etc.)
  const processInlineMarkdown = (text: string) => {
    if (!text) return "";

    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/);

    return parts.map((part, partIndex) => {
      // Bold text
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={partIndex} className="text-white font-semibold">
            {part.replace(/\*\*/g, "")}
          </strong>
        );
      }
      // Italic text
      if (part.startsWith("*") && part.endsWith("*") && !part.includes("**")) {
        return (
          <em key={partIndex} className="text-white/90 italic">
            {part.replace(/\*/g, "")}
          </em>
        );
      }
      // Code text
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={partIndex}
            className="bg-white/10 text-[#FFD700] px-1 py-0.5 rounded text-sm font-mono"
          >
            {part.replace(/`/g, "")}
          </code>
        );
      }
      return part;
    });
  };

  return <div className="markdown-content">{renderMarkdown(content)}</div>;
};

// Define interfaces for the UI data structure
interface Review {
  id: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  username?: string;
  rating: number;
  date?: string;
  created_at?: string;
  comment?: string;
  review_text?: string;
  avatar?: string;
  status?: string;
  property?: string;
  property_id?: string;
  address?: string;
  evidence?: string;
}

interface PropertyDetailData {
  id: string;
  placeId: string;
  title: string;
  location: string;
  rating: number;
  reviewCount: number;
  price: string;
  images: string[];
  description: string;
  amenities: string[];
  specifications: {
    bedrooms: number;
    bathrooms: number;
    area: string;
  };
  // Additional fields from your data structure
  phone: string;
  created_by: string;
  property_url: string;
  status: string;
  property_type: string;
  year_built: number | null;
  is_added_by_agent?: boolean;
  reviews: {
    id: number | string;
    name: string;
    rating: number;
    date: string;
    comment: string;
    avatar: string;
  }[];
}

// Transform API property data to match the UI structure
const transformApiDataToUI = (property: Property) => ({
  id: property.id,
  placeId: property.id,
  title: property.title,
  location: property.address,
  rating: typeof property.rental_grade === "number" ? property.rental_grade : 0,
  reviewCount: Math.floor(Math.random() * 50) + 5, // Mock review count
  price: property.price || "₦0",
  images: [
    property.image_url || imgg.src,
    ...(property.image_urls?.map((img) => img.url) || []),
  ].filter(Boolean) as string[],
  description:
    property.ai_refined_description ||
    property.description ||
    `Property with ID: ${property.id}. This is a beautiful property located at ${property.address}.`,
  amenities:
    Array.isArray(property.amenities) && property.amenities.length > 0
      ? property.amenities
      : property.amenities && typeof property.amenities === "object"
      ? Object.values(property.amenities).flat()
      : [
          "Swimming Pool",
          "Gym/Fitness Center",
          "24/7 Security",
          "Parking Space",
          "Generator",
          "Elevator",
        ],
  specifications: {
    bedrooms: parseInt(property.bedrooms || "2"),
    bathrooms: parseInt(property.bathrooms || "2"),
    area: property.size || property.square_footage || "1,200 sq ft",
  },
  // Additional fields from your data structure
  phone: property.phone || "",
  created_by: property.created_by || "",
  property_url: property.property_url || "",
  status: property.status || "available",
  property_type: property.property_type || "apartment",
  is_added_by_agent: property.is_added_by_agent || false,
  year_built:
    property.year_built === undefined || property.year_built === null
      ? null
      : typeof property.year_built === "number"
      ? property.year_built
      : !isNaN(Number(property.year_built))
      ? Number(property.year_built)
      : null,
  reviews: [], // Only show backend reviews
});

interface PropertyDetailClientProps {
  propertyId: string;
}

export default function PropertyDetailClient({
  propertyId,
}: PropertyDetailClientProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { getPropertyById } = useProperties();
  const [isFavorite, setIsFavorite] = useState(false);
  const [propertyDetailData, setPropertyDetailData] =
    useState<PropertyDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [backendReviews, setBackendReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: "good",
    reviewText: "",
    userName: "",
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmissionStatus, setReviewSubmissionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  // Fetch property data on component mount
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching property with ID:", propertyId);

        const property = await getPropertyById(propertyId);
        if (property) {
          const transformedData = transformApiDataToUI(property);
          setPropertyDetailData(transformedData);
          console.log("Property data loaded:", transformedData);

          // Process reviews from the property data
          fetchReviews(property);
        } else {
          setError("Property not found");
        }
      } catch (err) {
        console.error("Error fetching property:", err);
        setError("Failed to load property data");
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyData();
  }, [propertyId, getPropertyById]);

  const fetchReviews = async (property: any) => {
    try {
      setReviewsLoading(true);
      console.log("Processing property reviews:", property?.reviews);

      // Use reviews from the property data directly
      if (property && Array.isArray(property.reviews)) {
        const processedReviews = property.reviews.map((review: any) => ({
          id: review.id,
          user: review.user,
          username: review.user?.name || review.username || "Anonymous",
          rating: review.rating,
          date: review.date,
          created_at: review.created_at,
          comment: review.comment || review.review_text,
          review_text: review.review_text,
          status: review.status,
          property: review.property,
          address: review.address,
          evidence: review.evidence,
        }));

        console.log("Processed reviews:", processedReviews);
        setBackendReviews(processedReviews);
      } else {
        console.log("No reviews found in property data");
        setBackendReviews([]);
      }
    } catch (err) {
      console.error("Error processing reviews:", err);
      setBackendReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleBack = () => {
    try {
      if (typeof window !== "undefined") {
        // Check for stored navigation source
        const navigationSource =
          sessionStorage.getItem("navigationSource") || "/";

        // Check if we have a referrer from the same origin
        const referrer = document.referrer;
        const currentOrigin = window.location.origin;

        // If we came from within the app and have navigation history
        if (referrer && referrer.startsWith(currentOrigin)) {
          // Use router.back() for smooth navigation
          window.history.back();
        } else {
          // Navigate to stored source or home page
          router.push(navigationSource);
        }
      } else {
        // Server-side fallback
        router.push("/");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      // Ultimate fallback
      router.push("/");
    }
  };

  const handleFavoriteClick = () => {
    setIsFavorite(!isFavorite);
  };

  const handleStarClick = (rating: string) => {
    setReviewForm((prev) => ({ ...prev, rating }));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!isAuthenticated) {
      alert("Please log in to submit a review");
      router.push("/login");
      return;
    }

    if (
      !reviewForm.rating ||
      !reviewForm.reviewText.trim() ||
      !reviewForm.userName.trim()
    ) {
      alert("Please fill in all fields and select a rating");
      return;
    }

    setIsSubmittingReview(true);
    setReviewSubmissionStatus("idle");

    try {
      // Convert categorical rating to numeric for API
      const numericRating =
        reviewForm.rating === "bad"
          ? 1
          : reviewForm.rating === "average"
          ? 3
          : 5;

      const reviewData = {
        rating: numericRating,
        address: propertyDetailData?.location || "",
        review_text: reviewForm.reviewText,
        property: propertyId,
        status: "pending" as const,
        evidence: "",
      };

      console.log("Submitting review:", reviewData);

      const response = await reviewsAPI.create(reviewData);
      console.log("Review submitted successfully:", response);

      setReviewSubmissionStatus("success");
      setReviewForm({ rating: "good", reviewText: "", userName: "" });

      // Optionally refresh the reviews or show success message
      setTimeout(() => {
        setReviewSubmissionStatus("idle");
      }, 3000);
    } catch (error: unknown) {
      console.error("Error submitting review:", error);

      // Handle specific authentication errors
      const errorObj = error as {
        response?: { status?: number; data?: { detail?: string } };
        message?: string;
      };
      if (
        errorObj?.response?.status === 401 ||
        errorObj?.message?.includes("Authentication")
      ) {
        alert("Your session has expired. Please log in again.");
        router.push("/login");
        return;
      }

      // Handle other errors
      const errorMessage =
        errorObj?.response?.data?.detail ||
        errorObj?.message ||
        "Failed to submit review";
      alert(`Error: ${errorMessage}`);

      setReviewSubmissionStatus("error");

      setTimeout(() => {
        setReviewSubmissionStatus("idle");
      }, 3000);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading property details...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !propertyDetailData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <p className="text-white/60 mb-6">
            {error || "The requested property could not be found."}
          </p>
          <button
            onClick={handleBack}
            className="bg-[#FFD700] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#FFA500] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

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

  const averageRating =
    backendReviews.length > 0
      ? backendReviews.reduce(
          (acc: number, review: Review) => acc + review.rating,
          0
        ) / backendReviews.length
      : propertyDetailData?.rating && propertyDetailData.rating > 0
      ? propertyDetailData.rating
      : null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-6 pt-40">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="space-y-8">
          {/* First Section - Image and Title Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-28 max-w-[955px]">
            {/* Left Column - First Property Image */}
            <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden w-[500px]">
              <Image
                src={propertyDetailData.images[0]}
                alt={propertyDetailData.title}
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = imgg.src;
                }}
              />

              {/* Favorite Button */}
              <button
                onClick={handleFavoriteClick}
                className="absolute top-4 right-4 p-3 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isFavorite ? "text-red-500 fill-red-500" : "text-white"
                  }`}
                />
              </button>
            </div>

            {/* Right Column - Property Title and Details */}
            <div className="space-y-6 mt-16 lg:mt-20">
              <div>
                <h1 className="text-[28px] font-medium mb-2">
                  {propertyDetailData.title}
                </h1>
                <div className="flex items-center gap-2 text-white/70 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span className="font-normal text-[18px]">
                    {propertyDetailData.location}
                  </span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex p-2 items-center  max-w-[300px] gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl ">
                <div className="flex items-center gap-2">
                  {renderStars(averageRating || 0)}
                  <span className="text-white font-semibold px-3">
                    {averageRating ? averageRating.toFixed(1) : "No rating"}
                  </span>
                </div>
                <span className="text-white/70">
                  {backendReviews.length} Review
                  {backendReviews.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Price */}
              <div className="text-3xl font-bold text-white mb-6">
                {propertyDetailData.price}
              </div>

              {/* Book Now Button - Only show for agent-added properties */}
              {propertyDetailData.is_added_by_agent && (
                <button
                  onClick={() => router.push(`/booking/${propertyId}`)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Book Now
                </button>
              )}
            </div>
          </div>

          {/* Second Section - Second Image Below */}
          {propertyDetailData.images.length > 1 && (
            <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden">
              <Image
                src={propertyDetailData.images[1]}
                alt={`${propertyDetailData.title} - Image 2`}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* About This Property */}
          <div className="mt-12 space-y-8 max-w-[1157px]">
            <div>
              <h2 className="text-2xl font-bold mb-4">About This Property</h2>
              <div className="text-white/80 leading-relaxed">
                <MarkdownRenderer content={propertyDetailData.description} />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Amenities</h3>
              <div className="flex flex-wrap gap-4">
                {propertyDetailData.amenities.map(
                  (amenity: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-white/80"
                    >
                      <Shield className="w-4 h-4 text-green-500" />
                      <span>{amenity}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Specifications */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Specifications</h3>
              <div className="flex flex-wrap gap-6 text-white/80">
                <div className="flex items-center gap-3">
                  <Bed className="w-6 h-6 text-[#FFD700]" />
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">
                      {propertyDetailData.specifications.bedrooms}
                    </div>
                    <div className="text-sm text-white/70">Bedrooms</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Bath className="w-6 h-6 text-[#FFD700]" />
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">
                      {propertyDetailData.specifications.bathrooms}
                    </div>
                    <div className="text-sm text-white/70">Bathrooms</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Square className="w-6 h-6 text-[#FFD700]" />
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">
                      {propertyDetailData.specifications.area}
                    </div>
                    <div className="text-sm text-white/70">Area</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {(propertyDetailData.phone || propertyDetailData.created_by) && (
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Contact Information
                </h3>
                <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
                  {propertyDetailData.created_by && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FFD700] rounded-full flex items-center justify-center">
                        <span className="text-black font-semibold text-sm">
                          {propertyDetailData.created_by
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-medium">Listed by</div>
                        <div className="text-white/70 text-sm">
                          {propertyDetailData.created_by}
                        </div>
                      </div>
                    </div>
                  )}
                  {propertyDetailData.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">📞</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">Phone</div>
                        <a
                          href={`tel:${propertyDetailData.phone}`}
                          className="text-[#FFD700] hover:text-[#FFA500] transition-colors text-sm"
                        >
                          {propertyDetailData.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {propertyDetailData.property_url && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">🔗</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          Original Listing
                        </div>
                        {/* <a
                          href={propertyDetailData.property_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FFD700] hover:text-[#FFA500] transition-colors text-sm"
                        >
                          View on Original Site
                        </a> */}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reviews & Ratings */}
            <div className="mt-12 border-t border-white/10 pt-8">
              <h3 className="text-xl font-semibold">Reviews & Ratings</h3>

              {/* Overall Rating */}
              <div className="bg-black/40 backdrop-blur-sm pt-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold">
                      {averageRating ? averageRating.toFixed(1) : "No rating"}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {renderStars(averageRating || 0)}
                    </div>
                    <div className="text-white/70 mt-1">
                      {backendReviews.length > 0
                        ? `Based on ${backendReviews.length} review${
                            backendReviews.length !== 1 ? "s" : ""
                          }`
                        : "No reviews yet"}
                      {reviewsLoading && (
                        <span className="ml-2 text-xs">(Loading...)</span>
                      )}
                    </div>
                  </div>
                  <div className="text-center"></div>
                </div>
              </div>

              {/* Individual Reviews */}
              {backendReviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                    <div className="text-white/60 text-lg mb-2">
                      No reviews yet
                    </div>
                    <p className="text-white/40 text-sm">
                      Be the first to share your experience with this property
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {/* Backend Reviews */}
                  {backendReviews.map((review: Review) => (
                    <div
                      key={review.id}
                      className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {(review.user?.name || review.username || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-sm mb-1">
                            {review.user?.name ||
                              review.username ||
                              "Anonymous"}
                          </h4>
                          <span className="text-white/70 text-xs">
                            {review.date ||
                              (review.created_at
                                ? new Date(
                                    review.created_at
                                  ).toLocaleDateString()
                                : "Recently")}
                          </span>
                          {review.address && (
                            <div className="text-white/50 text-xs mt-1">
                              📍 {review.address}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {review.comment ||
                          review.review_text ||
                          "No comment provided"}
                      </p>
                      {review.evidence && (
                        <div className="mt-3 p-2 bg-white/5 rounded-lg">
                          <div className="text-white/60 text-xs mb-2">
                            Evidence:
                          </div>
                          {(() => {
                            // Parse evidence - it could be a string (single URL) or array of URLs
                            let evidenceUrls: string[] = [];
                            try {
                              // If it's a JSON string, parse it
                              evidenceUrls = JSON.parse(review.evidence);
                              if (!Array.isArray(evidenceUrls)) {
                                evidenceUrls = [review.evidence];
                              }
                            } catch {
                              // If parsing fails, treat as single URL
                              evidenceUrls = [review.evidence];
                            }

                            const imageUrls = evidenceUrls.filter((url) => {
                              try {
                                const urlObj = new URL(url);
                                return (
                                  /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(
                                    urlObj.pathname
                                  ) ||
                                  url.startsWith("data:image/") ||
                                  url.includes("cloudinary") ||
                                  url.includes("amazonaws") ||
                                  url.includes("googleapis")
                                );
                              } catch {
                                return false;
                              }
                            });
                            const textEvidence = evidenceUrls.filter((url) => {
                              try {
                                const urlObj = new URL(url);
                                return !(
                                  /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(
                                    urlObj.pathname
                                  ) ||
                                  url.startsWith("data:image/") ||
                                  url.includes("cloudinary") ||
                                  url.includes("amazonaws") ||
                                  url.includes("googleapis")
                                );
                              } catch {
                                return true; // If can't parse as URL, treat as text
                              }
                            });

                            return (
                              <div className="space-y-2">
                                {/* Display Images */}
                                {imageUrls.length > 0 && (
                                  <div
                                    className={`grid gap-2 ${
                                      imageUrls.length === 1
                                        ? "grid-cols-1"
                                        : "grid-cols-2"
                                    }`}
                                  >
                                    {imageUrls.map((imageUrl, index) => (
                                      <div key={index} className="relative">
                                        <Image
                                          src={imageUrl}
                                          alt={`Review Evidence ${index + 1}`}
                                          width={150}
                                          height={100}
                                          className="rounded-lg w-full h-20 object-cover"
                                          onError={(e) => {
                                            console.log(
                                              `Evidence image ${
                                                index + 1
                                              } failed to load:`,
                                              imageUrl
                                            );
                                            // Hide the image if it fails to load
                                            (
                                              e.target as HTMLImageElement
                                            ).style.display = "none";
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* Display Text Evidence */}
                                {textEvidence.length > 0 && (
                                  <div className="space-y-1">
                                    {textEvidence.map((text, index) => (
                                      <div
                                        key={index}
                                        className="text-white/80 text-sm"
                                      >
                                        {text}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      {review.status && review.status !== "approved" && (
                        <div className="mt-2 text-xs flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              review.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : review.status === "rejected"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {review.status.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Share Your Experience */}
            <div className="bg-[#0D0D0D] rounded-2xl p-10 text-center max-w-[1083px] mx-auto">
              <h3 className="text-xl font-semibold mb-2 text-white">
                Share Your Experience
              </h3>
              <p className="text-white/60 text-sm mb-6">Rate this property</p>

              {!isAuthenticated ? (
                <div className="text-center py-8">
                  <p className="text-white/70 mb-4">
                    Please log in to share your review
                  </p>
                  <button
                    onClick={() => router.push("/login")}
                    className="bg-gradient-to-r from-[#FFD700] to-[#780991] hover:opacity-90 text-white px-6 py-3 rounded-lg font-semibold transition-opacity"
                  >
                    Log In to Review
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview}>
                  {/* Categorical Rating */}
                  <div className="flex justify-center gap-4 mb-6">
                    <button
                      type="button"
                      onClick={() => handleStarClick("bad")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        reviewForm.rating === "bad"
                          ? "bg-red-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-red-500 hover:text-white"
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Bad
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStarClick("average")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        reviewForm.rating === "average"
                          ? "bg-yellow-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-yellow-500 hover:text-white"
                      }`}
                    >
                      <Meh className="w-4 h-4" />
                      Average
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStarClick("good")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        reviewForm.rating === "good"
                          ? "bg-green-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-green-500 hover:text-white"
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Good
                    </button>
                  </div>

                  <p className="text-white/60 text-sm mb-6 text-center">
                    {reviewForm.rating
                      ? `You rated: ${
                          reviewForm.rating.charAt(0).toUpperCase() +
                          reviewForm.rating.slice(1)
                        }`
                      : "Select a rating"}
                  </p>

                  {/* Name Input */}
                  <div className="flex flex-col items-center mb-4 w-[458px] mx-auto">
                    <div className="mb-4 text-left">
                      <label className="block text-white/70 text-sm mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={reviewForm.userName}
                        onChange={(e) =>
                          setReviewForm((prev) => ({
                            ...prev,
                            userName: e.target.value,
                          }))
                        }
                        className="w-[458px] bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Review Textarea */}
                    <div className="mb-6 text-left">
                      <label className="block text-white/70 text-sm mb-2">
                        Your Review
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Share your experience with this property..."
                        value={reviewForm.reviewText}
                        onChange={(e) =>
                          setReviewForm((prev) => ({
                            ...prev,
                            reviewText: e.target.value,
                          }))
                        }
                        className="w-[458px] bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 focus:border-transparent resize-none"
                        required
                      ></textarea>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmittingReview ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Review"
                      )}
                    </button>

                    {/* Status Messages */}
                    {reviewSubmissionStatus === "success" && (
                      <div className="mt-4 p-3 bg-green-900/50 border border-green-500/50 rounded-lg text-green-200 text-sm">
                        ✅ Review submitted successfully! It will be reviewed
                        before being published.
                      </div>
                    )}

                    {reviewSubmissionStatus === "error" && (
                      <div className="mt-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm">
                        ❌ Error submitting review. Please try again.
                      </div>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        property={
          propertyDetailData
            ? {
                id: propertyDetailData.id,
                title: propertyDetailData.title,
                location: propertyDetailData.location,
                price: propertyDetailData.price,
                image: propertyDetailData.images[0] || "",
              }
            : null
        }
      />
    </div>
  );
}
