"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Edit3,
  Save,
  RefreshCw,
  Upload,
  FileText,
  Eye,
} from "lucide-react";
import { reviewsAPI } from "@/lib/api";
import type { Review } from "@/lib/api/types";
import { toast } from "react-hot-toast";

interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewUpdated?: () => void;
}

type FilterType = "all" | "pending" | "approved" | "rejected";

const ReviewsModal: React.FC<ReviewsModalProps> = ({
  isOpen,
  onClose,
  onReviewUpdated,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    review_text: "",
    rating: 5,
    evidence: "",
  });
  const [newEvidence, setNewEvidence] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveLoading, setSaveLoading] = useState<string | null>(null);

  // Fetch reviews and stats
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const [reviewsData, statsData] = await Promise.all([
        reviewsAPI.getUserReviews(),
        reviewsAPI.getUserReviewStats(),
      ]);

      setReviews(reviewsData);
      setStats(statsData);
      filterReviews(reviewsData, activeFilter);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  // Filter reviews based on status
  const filterReviews = (reviewsList: Review[], filter: FilterType) => {
    if (filter === "all") {
      setFilteredReviews(reviewsList);
    } else {
      setFilteredReviews(
        reviewsList.filter((review) => review.status === filter)
      );
    }
  };

  // Handle filter change
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    filterReviews(reviews, filter);
  };

  // Start editing a review
  const startEditing = (review: Review) => {
    setEditingReview(review.id);
    setEditForm({
      review_text: review.review_text,
      rating: review.rating,
      evidence: Array.isArray(review.evidence)
        ? review.evidence.join("\n")
        : review.evidence || "",
    });
    setNewEvidence("");
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingReview(null);
    setEditForm({ review_text: "", rating: 5, evidence: "" });
    setNewEvidence("");
  };

  // Save edited review
  const saveReview = async (reviewId: string) => {
    setSaveLoading(reviewId);
    try {
      // Combine existing evidence with new evidence (if provided)
      const currentReview = reviews.find((r) => r.id === reviewId);
      let combinedEvidence = editForm.evidence;

      if (newEvidence.trim()) {
        if (currentReview?.evidence) {
          combinedEvidence = `${
            currentReview.evidence
          }\n\n--- Additional Evidence ---\n${newEvidence.trim()}`;
        } else {
          combinedEvidence = newEvidence.trim();
        }
      }

      const updateData = {
        review_text: editForm.review_text,
        rating: editForm.rating,
        ...(combinedEvidence && { evidence: combinedEvidence }),
      };

      await reviewsAPI.updateUserReview(reviewId, updateData);
      toast.success("Review updated successfully!");
      setEditingReview(null);
      setNewEvidence("");
      await fetchReviews(); // Refresh the list
      onReviewUpdated?.(); // Notify parent component
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("Failed to update review");
    } finally {
      setSaveLoading(null);
    }
  };

  // Get status icon and color - using more subtle, consistent colors
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: Clock,
          color: "text-slate-600 dark:text-slate-400",
          bg: "bg-slate-100 dark:bg-slate-800",
          text: "Pending",
        };
      case "approved":
        return {
          icon: CheckCircle,
          color: "text-slate-600 dark:text-slate-400",
          bg: "bg-slate-100 dark:bg-slate-800",
          text: "Approved",
        };
      case "rejected":
        return {
          icon: XCircle,
          color: "text-slate-600 dark:text-slate-400",
          bg: "bg-slate-100 dark:bg-slate-800",
          text: "Rejected",
        };
      default:
        return {
          icon: Clock,
          color: "text-slate-500 dark:text-slate-500",
          bg: "bg-slate-100 dark:bg-slate-800",
          text: "Unknown",
        };
    }
  };

  // Render star rating
  const renderStars = (
    rating: number,
    editable = false,
    onChange?: (rating: number) => void
  ) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            } ${editable ? "cursor-pointer hover:text-yellow-500" : ""}`}
            onClick={editable && onChange ? () => onChange(star) : undefined}
          />
        ))}
      </div>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Load reviews when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchReviews();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Reviews
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and edit your property reviews
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Stats and Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-800 dark:text-slate-200 font-semibold">
                {stats.total}
              </span>
              <span className="text-slate-600 dark:text-slate-400 ml-2 text-sm">
                Total
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-800 dark:text-slate-200 font-semibold">
                {stats.pending}
              </span>
              <span className="text-slate-600 dark:text-slate-400 ml-2 text-sm">
                Pending
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-800 dark:text-slate-200 font-semibold">
                {stats.approved}
              </span>
              <span className="text-slate-600 dark:text-slate-400 ml-2 text-sm">
                Approved
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-800 dark:text-slate-200 font-semibold">
                {stats.rejected}
              </span>
              <span className="text-slate-600 dark:text-slate-400 ml-2 text-sm">
                Rejected
              </span>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "approved", "rejected"] as FilterType[]).map(
              (filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === filter
                      ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {filter !== "all" && ` (${stats[filter]})`}
                </button>
              )
            )}
          </div>
        </div>

        {/* Reviews List */}
        <div className="flex-1 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
              <span className="ml-3 text-slate-600 dark:text-slate-400">
                Loading reviews...
              </span>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No reviews found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {activeFilter === "all"
                  ? "You haven't written any reviews yet."
                  : `No ${activeFilter} reviews found.`}
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {filteredReviews.map((review) => {
                const statusDisplay = getStatusDisplay(review.status);
                const StatusIcon = statusDisplay.icon;
                const isEditing = editingReview === review.id;

                return (
                  <div
                    key={review.id}
                    className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
                  >
                    {/* Review Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <div
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${statusDisplay.bg} border border-slate-200 dark:border-slate-600`}
                          >
                            <StatusIcon
                              className={`w-4 h-4 ${statusDisplay.color}`}
                            />
                            <span
                              className={`text-sm font-medium ${statusDisplay.color}`}
                            >
                              {statusDisplay.text}
                            </span>
                          </div>
                          {isEditing ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                Rating:
                              </span>
                              {renderStars(editForm.rating, true, (rating) =>
                                setEditForm((prev) => ({ ...prev, rating }))
                              )}
                            </div>
                          ) : (
                            renderStars(review.rating)
                          )}
                        </div>
                        {review.address && (
                          <p className="text-slate-600 dark:text-slate-400 text-sm flex items-center">
                            <span className="w-2 h-2 bg-slate-400 rounded-full mr-2"></span>
                            {review.address}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        {review.status === "rejected" && !isEditing && (
                          <button
                            onClick={() => startEditing(review)}
                            className="p-2 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Edit review"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Review Content */}
                    {isEditing ? (
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            Review Text
                          </label>
                          <textarea
                            value={editForm.review_text}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                review_text: e.target.value,
                              }))
                            }
                            className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                            rows={4}
                            placeholder="Write your review..."
                          />
                        </div>

                        {/* Evidence Section - Show existing evidence (non-editable) and allow adding new */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            Evidence
                          </label>

                          {/* Existing Evidence (Read-only) */}
                          {review.evidence && (
                            <div className="mb-3 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                              <div className="flex items-center space-x-2 mb-2">
                                <FileText className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                  Existing Evidence:
                                </span>
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300 break-all">
                                {review.evidence}
                              </p>
                            </div>
                          )}

                          {/* Add New Evidence */}
                          <div className="space-y-2">
                            <textarea
                              value={newEvidence}
                              onChange={(e) => setNewEvidence(e.target.value)}
                              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                              rows={2}
                              placeholder="Add additional evidence (URLs, file paths, etc.)..."
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Note: Existing evidence cannot be removed, but you
                              can add more supporting documentation.
                            </p>
                          </div>
                        </div>

                        <div className="flex space-x-3 pt-2">
                          <button
                            onClick={() => saveReview(review.id)}
                            disabled={saveLoading === review.id}
                            className="flex items-center space-x-2 px-5 py-2.5 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {saveLoading === review.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            <span>Save Changes</span>
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                          <p className="text-slate-900 dark:text-white leading-relaxed">
                            {review.review_text}
                          </p>
                        </div>

                        {review.evidence && (
                          <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                            <div className="flex items-center space-x-2 mb-2">
                              <FileText className="w-4 h-4 text-slate-500" />
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Supporting Evidence:
                              </p>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm break-all">
                              {review.evidence}
                            </p>
                          </div>
                        )}

                        {review.moderator_note && (
                          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                              Moderator Feedback:
                            </p>
                            <p className="text-amber-700 dark:text-amber-400 text-sm">
                              {review.moderator_note}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {filteredReviews.length} of {stats.total} reviews shown
            </p>
            <button
              onClick={fetchReviews}
              className="flex items-center space-x-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsModal;
