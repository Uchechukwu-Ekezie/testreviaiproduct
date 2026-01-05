"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { apiFetch, reviewsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Review interface based on API response
interface Review {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  rating: number;
  address: string;
  review_text: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  evidence: string | null;
  property: string | null;
}

// Mock reviews data

const filterOptions = [
  { value: "all", label: "All Reviews" },
  { value: "5", label: "5 Stars" },
  { value: "4", label: "4 Stars" },
  { value: "3", label: "3 Stars" },
  { value: "2", label: "2 Stars" },
  { value: "1", label: "1 Star" },
];

const sortOptions = [
  { value: "recent", label: "Most Recent" },
  { value: "oldest", label: "Oldest First" },
  { value: "rating-high", label: "Highest Rated" },
  { value: "rating-low", label: "Lowest Rated" },
];

// Helper function to check if evidence is a valid image URL
const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return (
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(urlObj.pathname) ||
      url.startsWith("data:image/") ||
      url.includes("cloudinary") ||
      url.includes("amazonaws") ||
      url.includes("googleapis")
    );
  } catch {
    return false;
  }
};

export default function MyReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showNewReviewModal, setShowNewReviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch reviews from API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!user?.id) {
          throw new Error("User ID is required to fetch reviews");
        }
        
        // Use reviewsAPI.getUserReviews() with user ID
        const apiReviews = await reviewsAPI.getUserReviews(user.id, 0, 100);
        // Transform API reviews to match local Review interface
        // API returns reviews with user as string, but we need user as object
        const transformedReviews = (Array.isArray(apiReviews) ? apiReviews : (apiReviews as any)?.reviews || []).map((review: any) => ({
          id: review.id,
          user: typeof review.user === 'string' 
            ? { id: review.user, name: review.user_name || 'Unknown', email: review.user_email || '' }
            : review.user || { id: '', name: 'Unknown', email: '' },
          rating: review.rating,
          address: review.address || '',
          review_text: review.review_text || review.content || '',
          status: review.status || 'pending',
          created_at: review.created_at,
          updated_at: review.updated_at,
          evidence: review.evidence || null,
          property: review.property || review.property_id || null,
        }));
        setReviews(transformedReviews);
      } catch (err: any) {
        console.error("Error fetching reviews:", err);
        // Handle 422/404 errors gracefully (endpoint might not be available)
        if (err?.response?.status === 422 || err?.response?.status === 404) {
          setError("Reviews endpoint is not available. Please try again later.");
          setReviews([]); // Set empty array instead of showing error
        } else {
          const errorMessage = err?.message || err?.response?.data?.detail || "Failed to load reviews";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchReviews();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  // Handle delete review
  const handleDeleteClick = (reviewId: string) => {
    setReviewToDelete(reviewId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return;
    
    try {
      setIsDeleting(true);
      await reviewsAPI.delete(reviewToDelete);
      
      // Remove the review from the state
      setReviews(reviews.filter(review => review.id !== reviewToDelete));
      
      // Show success toast
      toast.success('Review deleted successfully!');
      
      // Close modal and reset state
      setShowDeleteModal(false);
      setReviewToDelete(null);
    } catch (err: any) {
      console.error('Error deleting review:', err);
      toast.error('Failed to delete review. Please try again.');
      setError('Failed to delete review');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setReviewToDelete(null);
  };

  // Memoize filtered reviews to prevent unnecessary recalculations
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((review) => {
        // Filter by rating
        if (ratingFilter !== "all" && review.rating.toString() !== ratingFilter)
          return false;

        // Filter by search query
        if (
          searchQuery &&
          !review.address.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !review.review_text.toLowerCase().includes(searchQuery.toLowerCase())
        )
          return false;

        return true;
      })
      .sort((a, b) => {
        // Sort logic
        switch (sortBy) {
          case "recent":
            return (
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          case "oldest":
            return (
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          case "rating-high":
            return b.rating - a.rating;
          case "rating-low":
            return a.rating - b.rating;
          default:
            return 0;
        }
      });
  }, [reviews, ratingFilter, searchQuery, sortBy]);

  // Memoize average rating calculation
  const averageRating = useMemo(() => {
    return filteredReviews.length > 0
      ? (
          filteredReviews.reduce((sum, review) => sum + review.rating, 0) /
          filteredReviews.length
        ).toFixed(1)
      : "0.0";
  }, [filteredReviews]);

  // Memoize rating distribution calculation
  const ratingDistribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: filteredReviews.filter((r) => r.rating === rating).length,
      percentage:
        filteredReviews.length > 0
          ? (filteredReviews.filter((r) => r.rating === rating).length /
              filteredReviews.length) *
            100
          : 0,
    }));
  }, [filteredReviews]);

  const renderStars = (rating: number, size: "sm" | "md" = "sm") => {
    const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`${sizeClass} ${
              i < rating ? "text-yellow-400" : "text-gray-500"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-sm text-gray-400">{rating}.0</span>
      </div>
    );
  };

  return (
    <div className="bg-[#222222] p-6 text-white min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Reviews</h1>
            <p className="text-gray-400 mt-1">
              Manage and view all your property reviews
            </p>
          </div>
          <button
            onClick={() => setShowNewReviewModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-[15px] hover:bg-blue-700"
          >
            Write New Review
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="p-6 border rounded-[15px] shadow-inner bg-[#212121] shadow-white/5 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Reviews</p>
              <p className="text-2xl font-bold text-white">
                {filteredReviews.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-[15px] flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-[15px] shadow-inner bg-[#212121] shadow-white/5 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Average Rating</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-white mr-2">
                  {averageRating}
                </p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(Number(averageRating))
                          ? "text-yellow-400"
                          : "text-gray-500"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-[15px] shadow-inner bg-[#212121] shadow-white/5 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Helpful Votes</p>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-[15px] flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V9a5 5 0 00-10 0v1M7 20l-2-1m2 1l2-1m-2 1v-2.5"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-[15px] shadow-inner bg-[#212121] shadow-white/5 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Approved Reviews</p>
              <p className="text-2xl font-bold text-white">
                {filteredReviews.filter((r) => r.status === "approved").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-[15px] flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-[#212121] rounded-[15px] shadow-inner shadow-white/5 border border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Rating Distribution
        </h3>
        <div className="space-y-3">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center gap-4">
              <span className="text-sm text-gray-400 w-8">{rating} ★</span>
              <div className="flex-1 bg-gray-600 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-400 w-8">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search reviews by property, landlord, or content"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#212121] border border-gray-600 rounded-[15px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
          />
        </div>

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="pl-4 pr-10 py-2 bg-[#212121] border border-gray-600 rounded-[15px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white appearance-none"
        >
          {filterOptions.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-[#212121] text-white"
            >
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="pl-4 pr-10 py-2 bg-[#212121] border border-gray-600 rounded-[15px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white appearance-none"
        >
          {sortOptions.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-[#212121] text-white"
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Loading reviews...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-[15px] p-4 mb-6">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {!loading && !error && (
        <div className="space-y-6">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-[#212121] rounded-[15px] shadow-inner shadow-white/5 border border-gray-700 p-6"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(review.rating, "md")}
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        review.status === "approved"
                          ? "bg-green-500/20 text-green-400"
                          : review.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {review.status.charAt(0).toUpperCase() +
                        review.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    <p className="font-medium text-white">{review.address}</p>
                    <p>
                      By {review.user.name} •{" "}
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-gray-400 hover:text-white">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  <button 
                    className="text-gray-400 hover:text-red-400"
                    onClick={() => handleDeleteClick(review.id)}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Review Content */}
              <div className="mb-4">
                <p className="text-gray-300 leading-relaxed">
                  {review.review_text}
                </p>
              </div>

              {/* Evidence */}
              {review.evidence && (
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Evidence:</p>
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

                    const imageUrls = evidenceUrls.filter(isValidImageUrl);
                    const textEvidence = evidenceUrls.filter(
                      (url) => !isValidImageUrl(url)
                    );

                    return (
                      <div className="space-y-3">
                        {/* Display Images */}
                        {imageUrls.length > 0 && (
                          <div
                            className={`grid gap-3 ${
                              imageUrls.length === 1
                                ? "grid-cols-4"
                                : imageUrls.length === 2
                                ? "grid-cols-4"
                                : "grid-cols-2 md:grid-cols-3"
                            }`}
                          >
                            {imageUrls.map((imageUrl, index) => (
                              <div key={index} className="relative">
                                <Image
                                  src={imageUrl}
                                  alt={`Review Evidence ${index + 1}`}
                                  width={600}
                                  height={500}
                                  className="rounded-[10px] w-full h-48 object-cover"
                                  onError={() => {
                                    // console.log(`Image ${index + 1} failed to load`);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Display Text Evidence */}
                        {textEvidence.length > 0 && (
                          <div className="space-y-2">
                            {textEvidence.map((text, index) => (
                              <p
                                key={index}
                                className="text-gray-300 text-sm bg-[#2a2a2a] p-3 rounded-[10px]"
                              >
                                {text}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Review Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-600">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    Status:{" "}
                    <span
                      className={`font-medium ${
                        review.status === "approved"
                          ? "text-green-400"
                          : review.status === "pending"
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {review.status}
                    </span>
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  Review ID: {review.id.substring(0, 8)}...
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredReviews.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-white">
            No reviews found
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {searchQuery
              ? "Try adjusting your search criteria"
              : "You haven't written any reviews yet"}
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowNewReviewModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-[15px] hover:bg-blue-700"
            >
              Write Your First Review
            </button>
          </div>
        </div>
      )}

      {/* New Review Modal */}
      {showNewReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#212121] rounded-[15px] max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-600">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">
                  Write a New Review
                </h3>
                <button
                  onClick={() => setShowNewReviewModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Property
                  </label>
                  <select className="w-full bg-[#2a2a2a] border border-gray-600 rounded-[15px] px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Select a property to review...</option>
                    <option>2-Bedroom Apartment • Lekki Phase 1</option>
                    <option>Studio • Oniru</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="w-8 h-8 text-gray-500 hover:text-yellow-400 focus:text-yellow-400"
                      >
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Review Title
                  </label>
                  <input
                    type="text"
                    placeholder="Give your review a title"
                    className="w-full bg-[#2a2a2a] border border-gray-600 rounded-[15px] px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Review
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Share your experience with this property..."
                    className="w-full bg-[#2a2a2a] border border-gray-600 rounded-[15px] px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewReviewModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-600 rounded-[15px] text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-[15px] hover:bg-blue-700"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#212121] rounded-[15px] max-w-md w-full border border-gray-600">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Delete Review
                </h3>
                <p className="text-gray-400 text-sm">
                  Are you sure you want to delete this review? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-600 rounded-[15px] text-gray-300 hover:bg-[#2a2a2a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-[15px] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
