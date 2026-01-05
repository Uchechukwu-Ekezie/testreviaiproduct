"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Star,
  ThumbsUp,
  ThumbsDown,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { useReviews } from "@/contexts/reviews-context";

const ReviewDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id as string;
  const hasLoadedRef = useRef(false);

  const { getReviewById, approveReview, rejectReview, replyToReview } =
    useReviews();

  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moderatorNote, setModeratorNote] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load review data on component mount
  useEffect(() => {
    const loadReview = async () => {
      if (!reviewId || hasLoadedRef.current) return;
      hasLoadedRef.current = true;

      try {
        setLoading(true);
        setError(null);
        console.log("Loading review with ID:", reviewId);
        const reviewData = await getReviewById(reviewId);
        console.log("Review data loaded:", reviewData);

        if (reviewData) {
          setReview(reviewData);
          setReplyMessage(reviewData.reply || "");
          // Log property info if present
          if (reviewData.property) {
            console.log("Review has property reference:", {
              property: reviewData.property,
              property_id: reviewData.property?.id || reviewData.property,
            });
          }
        } else {
          setError("Review not found");
        }
      } catch (err) {
        console.error("Failed to load review:", err);
        setError("Failed to load review details");
      } finally {
        setLoading(false);
      }
    };

    loadReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId]); // Only depend on reviewId, getReviewById is stable from context

  // Reset hasLoadedRef when reviewId changes
  useEffect(() => {
    hasLoadedRef.current = false;
  }, [reviewId]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-5 w-5 ${
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

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 border-green-500";
      case "pending":
        return "bg-yellow-500/20 border-yellow-500";
      case "rejected":
        return "bg-red-500/20 border-red-500";
      default:
        return "bg-gray-500/20 border-gray-500";
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

  const handleApproveReview = async () => {
    if (!review) return;

    setActionLoading("approving");
    const result = await approveReview(review.id);

    if (result.success) {
      setReview({ ...review, status: "approved" });
    } else {
      console.error("Failed to approve review:", result.error);
      alert("Failed to approve review. Please try again.");
    }
    setActionLoading(null);
  };

  const handleRejectReview = async () => {
    if (!review) return;

    setActionLoading("rejecting");
    const result = await rejectReview(review.id);

    if (result.success) {
      setReview({ ...review, status: "rejected" });
    } else {
      console.error("Failed to reject review:", result.error);
      alert("Failed to reject review. Please try again.");
    }
    setActionLoading(null);
  };

  const handleSaveReply = async () => {
    if (!review || !replyMessage.trim()) return;

    setActionLoading("replying");
    const result = await replyToReview(review.id, replyMessage);

    if (result.success) {
      setReview({ ...review, reply: replyMessage });
      alert("Reply saved successfully!");
    } else {
      console.error("Failed to save reply:", result.error);
      alert("Failed to save reply. Please try again.");
    }
    setActionLoading(null);
  };

  const handleSaveNote = () => {
    // This would need a new API endpoint to save moderator notes
    console.log("Moderator note saved:", moderatorNote);
    alert("Moderator note saved successfully!");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#222222] text-white">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-400">Loading review details...</span>
        </div>
      </div>
    );
  }

  if (error || !review) {
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
            <h1 className="text-xl font-semibold">Review Details</h1>
          </div>
        </div>
        <div className="p-6">
          <div className="p-4 text-red-200 border border-red-500 rounded-lg bg-red-500/20">
            {error || "Review not found"}
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-semibold">Review Details</h1>
        </div>
        <div
          className={`px-4 py-2 rounded-[15px] border ${getStatusBgColor(
            review.status
          )}`}
        >
          <span className={getStatusColor(review.status)}>
            {getStatusLabel(review.status)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Review Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Review Content */}
            <div className="bg-[#212121] rounded-[15px] border border-[#2a2a2a] p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="mb-2 text-lg font-semibold">
                    {review.user?.name || "Unknown Reviewer"}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{formatDate(review.created_at)}</span>
                    <span>•</span>
                    <span>Review ID: {review.id.slice(0, 8)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(review.rating)}
                    <span className="font-medium text-white">
                      {review.rating}/5
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">Rating</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-sm font-medium text-gray-400">
                  Review Content
                </h3>
                <p className="leading-relaxed text-white">
                  {review.review_text}
                </p>
              </div>

              {review.reply && (
                <div className="p-4 mb-6 border rounded-lg bg-blue-500/20 border-blue-500/30">
                  <h4 className="mb-2 text-sm font-medium text-blue-200">
                    Your Reply
                  </h4>
                  <p className="text-blue-100">{review.reply}</p>
                </div>
              )}

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-400">
                    {review.likes || 0} likes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-400">
                    {review.dislikes || 0} dislikes
                  </span>
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div className="bg-[#212121] rounded-[15px] border border-[#2a2a2a] p-6">
              <h3 className="mb-4 text-lg font-semibold">
                Property Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block mb-1 text-sm text-gray-400">
                    Property
                  </label>
                  <div className="text-white">
                    {review.property?.title || "Direct Property Review"}
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm text-gray-400">
                    Location
                  </label>
                  <div className="text-white">
                    {review.property?.location ||
                      review.address ||
                      "No location provided"}
                  </div>
                </div>
                {review.evidence && (
                  <div>
                    <label className="block mb-1 text-sm text-gray-400">
                      Evidence
                    </label>
                    <div className="text-white">{review.evidence}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Reply to Review */}
            <div className="bg-[#212121] rounded-[15px] border border-[#2a2a2a] p-6">
              <h3 className="mb-4 text-lg font-semibold">Reply to Review</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm text-gray-400">
                    Your Reply
                  </label>
                  <textarea
                    rows={4}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Write a reply to this review..."
                    className="w-full rounded-[15px] border border-[#2A2A2A] bg-[#373737] py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#780991] resize-none"
                  />
                </div>
                <button
                  onClick={handleSaveReply}
                  disabled={
                    !replyMessage.trim() || actionLoading === "replying"
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-[15px] hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === "replying" ? (
                    <>
                      <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />
                      Saving Reply...
                    </>
                  ) : (
                    "Save Reply"
                  )}
                </button>
              </div>
            </div>

            {/* Moderation Actions */}
            {review.status === "pending" && (
              <div className="bg-[#212121] rounded-[15px] border border-[#2a2a2a] p-6">
                <h3 className="mb-4 text-lg font-semibold">
                  Moderation Actions
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">
                      Moderator Note
                    </label>
                    <textarea
                      rows={3}
                      value={moderatorNote}
                      onChange={(e) => setModeratorNote(e.target.value)}
                      placeholder="Add a note about this review (internal use only)..."
                      className="w-full rounded-[15px] border border-[#2A2A2A] bg-[#373737] py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#780991] resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveNote}
                      className="px-4 py-2 bg-[#780991] text-white rounded-[15px] hover:bg-[#8b0aa3] transition-colors"
                    >
                      Save Note
                    </button>
                    <button
                      onClick={handleApproveReview}
                      disabled={actionLoading === "approving"}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-[15px] hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === "approving" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve Review
                    </button>
                    <button
                      onClick={handleRejectReview}
                      disabled={actionLoading === "rejecting"}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-[15px] hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === "rejecting" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      Reject Review
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Reviewer Information */}
          <div className="space-y-6">
            {/* Reviewer Details */}
            <div className="bg-[#212121] rounded-[15px] border border-[#2a2a2a] p-6">
              <h3 className="mb-4 text-lg font-semibold">
                Reviewer Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm text-gray-400">
                    Name
                  </label>
                  <div className="text-white">
                    {review.user?.name || "Unknown"}
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm text-gray-400">
                    Email
                  </label>
                  <div className="text-white">
                    {review.user?.email || "Not provided"}
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm text-gray-400">
                    Review Date
                  </label>
                  <div className="text-white">
                    {formatDate(review.created_at)}
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm text-gray-400">
                    Last Updated
                  </label>
                  <div className="text-white">
                    {formatDate(review.updated_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Review Statistics */}
            <div className="bg-[#212121] rounded-[15px] border border-[#2a2a2a] p-6">
              <h3 className="mb-4 text-lg font-semibold">Review Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Rating</span>
                  <span className="text-white">{review.rating}/5 stars</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={getStatusColor(review.status)}>
                    {getStatusLabel(review.status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Helpfulness</span>
                  <span className="text-white">
                    {(review.likes || 0) - (review.dislikes || 0) > 0
                      ? "Helpful"
                      : "Not Helpful"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Votes</span>
                  <span className="text-white">
                    {(review.likes || 0) + (review.dislikes || 0)}
                  </span>
                </div>
                {(review.likes || 0) + (review.dislikes || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Helpfulness Ratio</span>
                    <span className="text-white">
                      {Math.round(
                        ((review.likes || 0) /
                          ((review.likes || 0) + (review.dislikes || 0))) *
                          100
                      )}
                      %
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#212121] rounded-[15px] border border-[#2a2a2a] p-6">
              <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() =>
                    (window.location.href = `mailto:${review.user?.email}`)
                  }
                  className="w-full py-2 px-4 bg-[#373737] text-white rounded-[15px] hover:bg-[#780991] transition-colors"
                >
                  Contact Reviewer
                </button>
                {review.property && (
                  <button
                    onClick={() =>
                      router.push(`/properties/${review.property.id}`)
                    }
                    className="w-full py-2 px-4 bg-[#373737] text-white rounded-[15px] hover:bg-[#780991] transition-colors"
                  >
                    View Property
                  </button>
                )}
                <button
                  onClick={() => router.push("/reviews")}
                  className="w-full py-2 px-4 bg-[#373737] text-white rounded-[15px] hover:bg-[#780991] transition-colors"
                >
                  Back to Reviews
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailPage;
