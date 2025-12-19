"use client";

import React, { useState, useEffect, useRef } from "react";
import {
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
  ArrowLeft,
  Plus,
  Trash2,
  MapPin,
} from "lucide-react";
import { reviewsAPI } from "@/lib/api";
import type { Review } from "@/lib/api/types";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import LoginPopup from "@/components/LoginPopup";
import { useAuthError } from "@/hooks/useAuthError";

interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

type FilterType = "all" | "pending" | "approved" | "rejected";

export default function ReviewsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { showLoginPopup, handleAuthError, closeLoginPopup } = useAuthError();
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
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveLoading, setSaveLoading] = useState<string | null>(null);

  // Cloudinary configuration
  const CLOUDINARY_CLOUD_NAME =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "your-cloud-name";
  const CLOUDINARY_UPLOAD_PRESET =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_TWO ||
    "your-upload-preset";

  // File upload functions
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "review-evidence");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      throw error;
    }
  };

  const uploadEvidenceFiles = async (): Promise<string[]> => {
    if (evidenceFiles.length === 0) return [];

    setIsUploadingFiles(true);
    const urls: string[] = [];

    try {
      for (const file of evidenceFiles) {
        try {
          const url = await uploadToCloudinary(file);
          urls.push(url);
          console.log(`Uploaded ${file.name}:`, url);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}. Please try again.`);
        }
      }

      if (urls.length > 0) {
        toast.success(
          `${urls.length} file${
            urls.length !== 1 ? "s" : ""
          } uploaded successfully!`
        );
      }

      return urls;
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setEvidenceFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Fetch reviews and stats
  const fetchReviews = async () => {
    // Don't fetch if user is not authenticated
    if (!isAuthenticated) {
      handleAuthError({ response: { status: 401 } });
      return;
    }

    setLoading(true);
    try {
      const [reviewsData, statsData] = await Promise.all([
        reviewsAPI.getUserReviews(),
        reviewsAPI.getUserReviewStats(),
      ]);

      setReviews(reviewsData);
      setStats(statsData);
      filterReviews(reviewsData, activeFilter);
    } catch (error: any) {
      console.error("Error fetching reviews:", error);

      // Use the auth error handler
      if (handleAuthError(error)) {
        toast.error("Please log in to view your reviews");
      } else {
        toast.error("Failed to load reviews");
      }
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
    setEvidenceFiles([]);
  };

  // Save edited review
  const saveReview = async (reviewId: string) => {
    setSaveLoading(reviewId);
    try {
      // Upload files first if any are selected
      let uploadedFileUrls: string[] = [];
      if (evidenceFiles.length > 0) {
        uploadedFileUrls = await uploadEvidenceFiles();
      }

      // Combine existing evidence with new evidence and uploaded files
      const currentReview = reviews.find((r) => r.id === reviewId);
      let combinedEvidence = editForm.evidence;

      // Add text evidence if provided
      if (newEvidence.trim()) {
        if (currentReview?.evidence) {
          combinedEvidence = `${
            currentReview.evidence
          }\n\n--- Additional Evidence ---\n${newEvidence.trim()}`;
        } else {
          combinedEvidence = newEvidence.trim();
        }
      }

      // Add uploaded file URLs if any
      if (uploadedFileUrls.length > 0) {
        const fileUrlsText = uploadedFileUrls.join("\n");
        if (combinedEvidence) {
          combinedEvidence = `${combinedEvidence}\n\n--- Uploaded Files ---\n${fileUrlsText}`;
        } else {
          combinedEvidence = fileUrlsText;
        }
      }

      const updateData = {
        review_text: editForm.review_text,
        rating: editForm.rating,
        evidence: combinedEvidence || "",
      };

      console.log("Sending update data:", updateData);
      console.log("Combined evidence:", combinedEvidence);

      await reviewsAPI.updateUserReview(reviewId, updateData);
      toast.success("Review updated successfully!");
      setEditingReview(null);
      setNewEvidence("");
      setEvidenceFiles([]);
      await fetchReviews(); // Refresh the list
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("Failed to update review");
    } finally {
      setSaveLoading(null);
    }
  };

  // Get status icon and color - using design system colors
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bg: "bg-yellow-50 dark:bg-yellow-900/20",
          text: "Pending",
        };
      case "approved":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          text: "Approved",
        };
      case "rejected":
        return {
          icon: XCircle,
          color: "text-red-600",
          bg: "bg-red-50 dark:bg-red-900/20",
          text: "Rejected",
        };
      default:
        return {
          icon: Clock,
          color: "text-muted-foreground",
          bg: "bg-muted",
          text: "Unknown",
        };
    }
  };

  // Get rating text label
  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1:
        return "Bad";
      case 2:
        return "Poor";
      case 3:
        return "Fair";
      case 4:
        return "Good";
      case 5:
        return "Excellent";
      default:
        return "Unknown";
    }
  };

  // Render star rating
  const renderStars = (
    rating: number,
    editable = false,
    onChange?: (rating: number) => void
  ) => {
    return (
      <div className="flex items-center space-x-1">
        <div className="flex space-x-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-3 h-3 ${
                star <= rating
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300"
              } ${editable ? "cursor-pointer hover:text-yellow-500" : ""}`}
              onClick={editable && onChange ? () => onChange(star) : undefined}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-muted-foreground ml-1">
          {getRatingLabel(rating)}
        </span>
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

  // Load reviews when component mounts or authentication state changes
  useEffect(() => {
    // Only fetch if authentication is loaded and user is authenticated
    if (!authLoading && isAuthenticated) {
      fetchReviews();
    } else if (!authLoading && !isAuthenticated) {
      handleAuthError({ response: { status: 401 } });
    }
  }, [isAuthenticated, authLoading, handleAuthError]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup object URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      evidenceFiles.forEach((file) => {
        URL.revokeObjectURL(URL.createObjectURL(file));
      });
    };
  }, [evidenceFiles]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">\n      {/* Login Popup */}
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={closeLoginPopup}
        title="Authentication Required"
        message="Please log in to view and manage your reviews."
      />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-accent rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">
                My Reviews
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                Manage and edit your property reviews
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats and Filters */}
      <div className="p-4 sm:p-6 border-b border-border bg-gradient-to-r from-card/50 to-card">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-card to-card/80 border border-border rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                {stats.total}
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground font-medium">
              Total Reviews
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.pending}
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 font-medium">
              Pending
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.approved}
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-green-700 dark:text-green-300 font-medium">
              Approved
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 dark:text-red-400">
                {stats.rejected}
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-red-700 dark:text-red-300 font-medium">
              Rejected
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {(["all", "pending", "approved", "rejected"] as FilterType[]).map(
            (filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange(filter)}
                className={`h-8 sm:h-10 px-3 sm:px-4 rounded-full font-medium transition-all duration-200 text-xs sm:text-sm ${
                  activeFilter === filter
                    ? "shadow-md"
                    : "hover:shadow-sm hover:scale-105"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12 sm:py-20">
            <div className="text-center px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                Loading reviews...
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Please wait while we fetch your reviews
              </p>
            </div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12 sm:py-20 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-muted to-muted/50 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-sm">
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
              No reviews found
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
              {activeFilter === "all"
                ? "You haven't written any reviews yet. Start by reviewing a property you've stayed at!"
                : `No ${activeFilter} reviews found. Try selecting a different filter.`}
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredReviews.map((review) => {
              const statusDisplay = getStatusDisplay(review.status);
              const StatusIcon = statusDisplay.icon;

              return (
                <div
                  key={review.id}
                  className="bg-gradient-to-br from-card to-card/80 border border-border rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  onClick={() => router.push(`/reviews/${review.id}`)}
                >
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div
                            className={cn(
                              "flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border shadow-sm",
                              statusDisplay.bg,
                              "border-border"
                            )}
                          >
                            <StatusIcon
                              className={cn(
                                "w-3 h-3 sm:w-3.5 sm:h-3.5",
                                statusDisplay.color
                              )}
                            />
                            <span
                              className={cn(
                                "text-xs font-semibold",
                                statusDisplay.color
                              )}
                            >
                              {statusDisplay.text}
                            </span>
                          </div>
                          <div className="flex items-center">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs font-medium text-muted-foreground">
                            {formatDate(review.created_at)}
                          </p>
                        </div>
                      </div>
                      {review.address && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                          <p className="text-muted-foreground text-xs font-medium truncate">
                            {review.address}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {review.moderator_note && (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-amber-200 dark:border-amber-800 shadow-sm">
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1 sm:mb-2 space-y-1 sm:space-y-0">
                              <h4 className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-200">
                                Moderator Feedback
                              </h4>
                              <div className="hidden sm:block h-1 w-1 bg-amber-400 rounded-full"></div>
                              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                Important
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                              {review.moderator_note}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
