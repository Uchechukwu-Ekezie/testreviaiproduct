"use client";
import { useState, useEffect } from "react";

import { userAPI } from "@/lib/api";

import {
  Star,
  Reply,
  Search,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { useReviews } from "@/contexts/reviews-context";

export default function ReviewsPage() {
  const {
    reviews,
    isLoading,
    error,
    fetchReviewsByUserId,
    approveReview,
    rejectReview,

    replyToReview,
    getReviewStats,
  } = useReviews();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [filterRating, setFilterRating] = useState("All Ratings");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [actionLoading, setActionLoading] = useState<{ [key: string]: string }>(
    {}
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Get user profile and userId on component mount
  useEffect(() => {
    const getUserProfile = async () => {
      try {
        setProfileLoading(true);
        const profile = await userAPI.getProfile();
        console.log("User profile:", profile);

        if (profile && profile.id) {
          setUserId(profile.id);
        } else {
          console.error("No user ID found in profile");
        }
      } catch (error) {
        console.error("Failed to get user profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    getUserProfile();
  }, []);

  // Load reviews when userId is available
  useEffect(() => {
    if (userId) {
      console.log("Loading reviews for userId:", userId);
      fetchReviewsByUserId(userId);
    }
  }, [fetchReviewsByUserId, userId]);

  // Filter reviews based on search and filters
  const filteredReviews = reviews.filter((review) => {
    // Safety checks for undefined/null values
    if (!review) return false;

    const reviewerName = review.user?.name || "Unknown Reviewer";
    const reviewComment = review.review_text || "";
    const propertyTitle = review.property?.title || "";
    const address = review.address || "";

    const matchesSearch =
      reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reviewComment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "All Status" ||
      (filterStatus === "Verified" && review.status === "approved") ||
      (filterStatus === "In Review" && review.status === "pending") ||
      (filterStatus === "Rejected" && review.status === "rejected");

    const matchesRating =
      filterRating === "All Ratings" ||
      (review.rating && review.rating.toString() === filterRating);
    return matchesSearch && matchesStatus && matchesRating;
  });

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = getReviewStats();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "text-yellow-500 fill-current" : "text-gray-400"
        }`}
      />
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-500";
      case "pending":
        return "text-yellow-500";
      case "rejected":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Verified";
      case "pending":
        return "In Review";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const handleApprove = async (reviewId: string) => {
    setActionLoading((prev) => ({ ...prev, [reviewId]: "approving" }));
    const result = await approveReview(reviewId);
    if (!result.success) {
      console.error("Failed to approve review:", result.error);
    }
    setActionLoading((prev) => {
      const newState = { ...prev };
      delete newState[reviewId];
      return newState;
    });
  };

  const handleReject = async (reviewId: string) => {
    setActionLoading((prev) => ({ ...prev, [reviewId]: "rejecting" }));
    const result = await rejectReview(reviewId);
    if (!result.success) {
      console.error("Failed to reject review:", result.error);
    }
    setActionLoading((prev) => {
      const newState = { ...prev };
      delete newState[reviewId];
      return newState;
    });
  };

  const handleReply = async (reviewId: string) => {
    if (!replyMessage.trim()) return;

    setActionLoading((prev) => ({ ...prev, [reviewId]: "replying" }));
    const result = await replyToReview(reviewId, replyMessage);
    if (result.success) {
      setReplyingTo(null);
      setReplyMessage("");
    } else {
      console.error("Failed to reply to review:", result.error);
    }
    setActionLoading((prev) => {
      const newState = { ...prev };
      delete newState[reviewId];
      return newState;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#222222] text-white">
        <Header title="My Reviews" />
        <main className="p-6">
          <div className="p-4 text-red-200 border border-red-500 rounded-lg bg-red-500/20">
            Error loading reviews: {error}
          </div>
        </main>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#222222] text-white">
        <Header title="My Reviews" />
        <main className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            <span className="ml-2 text-gray-400">Loading user profile...</span>
          </div>
        </main>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#222222] text-white">
        <Header title="My Reviews" />
        <main className="p-6">
          <div className="p-4 text-yellow-200 border border-yellow-500 rounded-lg bg-yellow-500/20">
            Unable to load user information. Please try logging in again.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#222222] text-white">
      <Header title="My Reviews" />

      <main className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-[#212121] p-6 rounded-[15px] border border-[#2a2a2a] shadow-inner shadow-gray-800">
            <h3 className="mb-2 text-sm text-gray-400">Total Reviews</h3>
            <p className="text-3xl font-bold">{stats.total.toLocaleString()}</p>
            <p className="text-sm text-green-500">+12% this month</p>
          </div>
          <div className="bg-[#212121] p-6 rounded-[15px] border border-[#2a2a2a] shadow-inner shadow-gray-800">
            <h3 className="mb-2 text-sm text-gray-400">Approved Reviews</h3>
            <p className="text-3xl font-bold">{stats.approved}</p>
            <p className="text-sm text-green-500">+5% this month</p>
          </div>
          <div className="bg-[#212121] p-6 rounded-[15px] border border-[#2a2a2a] shadow-inner shadow-gray-800">
            <h3 className="mb-2 text-sm text-gray-400">Average Rating</h3>
            <p className="flex items-center gap-2 text-3xl font-bold">
              {stats.averageRating.toFixed(1)}
              <div className="flex">
                {renderStars(Math.round(stats.averageRating))}
              </div>
            </p>
            <p className="text-sm text-green-500">+1.5% this month</p>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">
            Manage and moderate user-submitted reviews about your properties
          </h2>
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 rounded-lg bg-[#2A2A2A] py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#780991] border border-gray-700"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center gap-2 bg-[#2A2A2A] py-2 px-4 rounded-lg border border-gray-700 hover:bg-gray-700"
              >
                <span className="text-sm text-gray-400">{filterStatus}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full mt-1 right-0 bg-[#2A2A2A] border border-gray-700 rounded-lg shadow-lg z-10">
                  {["All Status", "Verified", "In Review", "Rejected"].map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setFilterStatus(status);
                          setShowStatusDropdown(false);
                        }}
                        className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-700"
                      >
                        {status}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Rating Filter */}
            <div className="relative">
              <button
                onClick={() => setShowRatingDropdown(!showRatingDropdown)}
                className="flex items-center gap-2 bg-[#2A2A2A] py-2 px-4 rounded-lg border border-gray-700 hover:bg-gray-700"
              >
                <span className="text-sm text-gray-400">{filterRating}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showRatingDropdown && (
                <div className="absolute top-full mt-1 right-0 bg-[#2A2A2A] border border-gray-700 rounded-lg shadow-lg z-10">
                  {["All Ratings", "5", "4", "3", "2", "1"].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => {
                        setFilterRating(rating);
                        setShowRatingDropdown(false);
                      }}
                      className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-700"
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#212121] rounded-[15px] border border-[#2a2a2a] p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              <span className="ml-2 text-gray-400">Loading reviews...</span>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="py-3 font-medium text-left text-gray-400">
                        Reviewer
                      </th>
                      <th className="py-3 font-medium text-left text-gray-400">
                        Property
                      </th>
                      <th className="py-3 font-medium text-left text-gray-400">
                        Review
                      </th>
                      <th className="py-3 font-medium text-left text-gray-400">
                        Rating
                      </th>
                      <th className="py-3 font-medium text-left text-gray-400">
                        Date
                      </th>
                      <th className="py-3 font-medium text-left text-gray-400">
                        Status
                      </th>
                      <th className="py-3 font-medium text-left text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReviews.map((review) => (
                      <tr
                        key={review.id}
                        className="border-b border-gray-800 hover:bg-gray-800/50"
                      >
                        <td className="py-4">
                          <div className="font-medium">
                            {review.user?.name || "Unknown Reviewer"}
                          </div>
                          <div className="text-sm text-gray-400">
                            {review.user?.email || "No email provided"}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="font-medium">
                            {review.property?.title || "Direct Property Review"}
                          </div>
                          <div className="text-sm text-gray-400">
                            {review.property?.location ||
                              review.address ||
                              "No location"}
                          </div>
                        </td>
                        <td className="max-w-xs py-4 text-gray-400">
                          <div className="truncate">
                            {review.review_text || "No comment"}
                          </div>
                          {review.reply && (
                            <div className="p-2 mt-2 text-sm text-blue-200 rounded bg-blue-500/20">
                              <strong>Reply:</strong> {review.reply}
                            </div>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="flex">
                            {renderStars(review.rating || 0)}
                          </div>
                        </td>
                        <td className="py-4 text-gray-400">
                          {review.created_at
                            ? formatDate(review.created_at)
                            : "No date"}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${getStatusDot(
                                review.status
                              )}`}
                            ></div>
                            <span className={getStatusColor(review.status)}>
                              {getStatusLabel(review.status)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            {review.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(review.id)}
                                  disabled={!!actionLoading[review.id]}
                                  className="text-green-500 hover:text-green-400 disabled:opacity-50"
                                  title="Approve"
                                >
                                  {actionLoading[review.id] === "approving" ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleReject(review.id)}
                                  disabled={!!actionLoading[review.id]}
                                  className="text-red-500 hover:text-red-400 disabled:opacity-50"
                                  title="Reject"
                                >
                                  {actionLoading[review.id] === "rejecting" ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <X className="w-4 h-4" />
                                  )}
                                </button>
                              </>
                            )}
                            <button
                              onClick={() =>
                                setReplyingTo(
                                  replyingTo === review.id ? null : review.id
                                )
                              }
                              className="text-blue-500 hover:text-blue-400"
                              title="Reply"
                            >
                              <Reply className="w-4 h-4" />
                            </button>
                            <button
                              className="text-gray-400 hover:text-white"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Reply Input */}
                          {replyingTo === review.id && (
                            <div className="p-3 mt-2 bg-gray-800 rounded-lg">
                              <textarea
                                value={replyMessage}
                                onChange={(e) =>
                                  setReplyMessage(e.target.value)
                                }
                                placeholder="Write a reply..."
                                className="w-full p-2 text-white bg-gray-700 border-none rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleReply(review.id)}
                                  disabled={
                                    !replyMessage.trim() ||
                                    !!actionLoading[review.id]
                                  }
                                  className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {actionLoading[review.id] === "replying" ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    "Send Reply"
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyMessage("");
                                  }}
                                  className="px-3 py-1 text-sm text-white bg-gray-600 rounded hover:bg-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages} ({filteredReviews.length}{" "}
                  reviews)
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 text-gray-400 hover:text-white disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
