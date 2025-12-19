"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  MapPin,
  FileText,
  Edit3,
  Save,
  RefreshCw,
  Upload,
  Plus,
  Trash2,
} from "lucide-react";
import { reviewsAPI } from "@/lib/api";
import type { Review } from "@/lib/api/types";
import { toast } from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import LoginPopup from "@/components/LoginPopup";
import { useAuthError } from "@/hooks/useAuthError";

export default function EditReviewPage() {
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { showLoginPopup, handleAuthError, closeLoginPopup } = useAuthError();

  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [evidence, setEvidence] = useState("");
  const [newEvidence, setNewEvidence] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

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

  // Fetch review data
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      handleAuthError({ response: { status: 401 } });
      return;
    }

    if (!authLoading && isAuthenticated && reviewId) {
      fetchReview();
    }
  }, [reviewId, isAuthenticated, authLoading, handleAuthError]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const reviews = await reviewsAPI.getUserReviews();
      const foundReview = reviews.find((r: Review) => r.id === reviewId);

      if (foundReview) {
        setReview(foundReview);
        setReviewText(foundReview.review_text || "");
        setRating(foundReview.rating || 5);
        // Handle evidence - it can be string or string[]
        const evidenceValue = foundReview.evidence || "";
        setEvidence(
          Array.isArray(evidenceValue)
            ? evidenceValue.join(", ")
            : evidenceValue
        );

        // Check if review can be edited (only if it's rejected or pending)
        if (foundReview.status === "approved") {
          setError(
            "This review has already been approved and cannot be edited."
          );
        }
      } else {
        setError("Review not found");
      }
    } catch (error: any) {
      console.error("Error fetching review:", error);

      if (handleAuthError(error)) {
        toast.error("Please log in to edit your review");
      } else {
        setError("Failed to load review");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reviewText.trim()) {
      toast.error("Please enter your review text");
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5 stars");
      return;
    }

    setSaving(true);
    try {
      // Upload files first if any are selected
      let uploadedFileUrls: string[] = [];
      if (evidenceFiles.length > 0) {
        uploadedFileUrls = await uploadEvidenceFiles();
      }

      // Extract URLs from existing evidence
      let existingUrls: string[] = [];
      if (evidence && typeof evidence === "string") {
        const evidenceLines = evidence.split("\n");
        existingUrls = evidenceLines
          .filter((line) => {
            const trimmedLine = line.trim();
            return (
              trimmedLine.startsWith("http") &&
              trimmedLine.includes("cloudinary")
            );
          })
          .map((url) => url.trim());
      }

      console.log("Edit Page - Existing URLs:", existingUrls);
      console.log("Edit Page - New uploaded URLs:", uploadedFileUrls);

      // Combine all URLs (existing + new uploads)
      const allUrls = [...existingUrls, ...uploadedFileUrls];

      // Create evidence array with URLs and text evidence
      let evidenceArray: string[] = [...allUrls];

      // Add text evidence if provided
      if (newEvidence.trim()) {
        evidenceArray.push(
          `--- Additional Evidence ---\n${newEvidence.trim()}`
        );
      }

      console.log("Edit Page - Final evidence array:", evidenceArray);

      const updateData = {
        review_text: reviewText.trim(),
        rating: rating,
        evidence: evidenceArray, // Send as array instead of string
        // Set updated_after_rejection to true if the review was rejected
        ...(review?.status === "rejected" && { updated_after_rejection: true }),
      };

      console.log("Edit Page - Sending update data:", updateData);
      console.log("Edit Page - Review status:", review?.status);
      console.log(
        "Edit Page - Will set updated_after_rejection:",
        review?.status === "rejected"
      );

      // Use the new API function that tries multiple field names
      const response = await reviewsAPI.updateUserReviewWithRejectionFlag(
        reviewId,
        {
          review_text: reviewText.trim(),
          rating: rating,
          evidence: evidenceArray,
        },
        review?.status === "rejected"
      );
      console.log("Edit Page - Update response:", response);

      toast.success(
        "Review updated successfully! It will be reviewed by our moderation team."
      );

      // Redirect to the review page
      setTimeout(() => {
        router.push(`/reviews/${reviewId}`);
      }, 2000);
    } catch (error: any) {
      console.error("Failed to update review:", error);

      if (handleAuthError(error)) {
        toast.error("Please log in to update your review");
      } else {
        toast.error(
          error?.message || "Failed to update review. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // Get status icon and color
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

  // Render star rating selector
  const renderStarRating = () => {
    return (
      <div className="flex items-center space-x-1">
        <div className="flex space-x-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-6 h-6 ${
                star <= rating
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300"
              } cursor-pointer hover:text-yellow-500 transition-colors`}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-muted-foreground ml-2">
          {getRatingLabel(rating)}
        </span>
      </div>
    );
  };

  // Show loading state while fetching review
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
            Loading review...
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Please wait while we fetch your review
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 dark:bg-red-900/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-sm">
            <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">
            Error
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            {error}
          </p>
          <Button
            onClick={() => router.back()}
            className="bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 text-white border-0 text-sm"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            Review Not Found
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            The review you're looking for doesn't exist.
          </p>
          <Button
            onClick={() => router.push("/reviews")}
            className="bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 text-white border-0 text-sm"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Back to Reviews
          </Button>
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(review.status);
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Login Popup */}
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={closeLoginPopup}
        title="Authentication Required"
        message="Please log in to edit your review."
      />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="hover:bg-accent"
              >
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                  Edit Review
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Update your review based on feedback
                </p>
              </div>
            </div>
            <div
              className={cn(
                "flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border shadow-sm",
                statusDisplay.bg,
                "border-border"
              )}
            >
              <StatusIcon
                className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", statusDisplay.color)}
              />
              <span
                className={cn("text-xs font-semibold", statusDisplay.color)}
              >
                {statusDisplay.text}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Moderator Feedback (if review was rejected) */}
          {review.status === "rejected" && review.moderator_note && (
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-xl shadow-sm">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1 sm:mb-2 space-y-1 sm:space-y-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-red-800 dark:text-red-200">
                      Moderator Feedback
                    </h4>
                    <div className="hidden sm:block h-1 w-1 bg-red-400 rounded-full"></div>
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                      Important
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 leading-relaxed mb-2 sm:mb-3">
                    {review.moderator_note}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Please address the feedback above when updating your review.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Rating */}
            <div className="bg-gradient-to-br from-card to-card/80 border border-border rounded-xl p-4 sm:p-6 shadow-sm">
              <label className="block text-base sm:text-lg font-medium text-foreground mb-3 sm:mb-4">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2 sm:space-x-4">
                {renderStarRating()}
                <span className="text-muted-foreground text-sm">
                  ({rating} star{rating !== 1 ? "s" : ""})
                </span>
              </div>
            </div>

            {/* Review Text */}
            <div className="bg-gradient-to-br from-card to-card/80 border border-border rounded-xl p-4 sm:p-6 shadow-sm">
              <label
                htmlFor="reviewText"
                className="block text-base sm:text-lg font-medium text-foreground mb-3 sm:mb-4"
              >
                Your Review <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reviewText"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={6}
                className="w-full p-3 sm:p-4 border border-input rounded-md bg-background text-foreground resize-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm sm:text-base"
                placeholder="Share your detailed experience..."
                required
              />
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 space-y-1 sm:space-y-0">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Be specific and helpful to other users
                </p>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {reviewText.length} characters
                </span>
              </div>
            </div>

            {/* Evidence Section */}
            <div className="bg-gradient-to-br from-card to-card/80 border border-border rounded-xl p-4 sm:p-6 shadow-sm">
              <label className="block text-base sm:text-lg font-medium text-foreground mb-3 sm:mb-4">
                Evidence (Optional)
              </label>

              {/* Existing Evidence (Read-only) */}
              {review.evidence && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-muted rounded-lg border border-border">
                  <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Existing Evidence:
                    </span>
                  </div>
                  <div className="space-y-3">
                    {(() => {
                      // Parse evidence - handle both string and array formats
                      let evidenceLines: string[] = [];
                      let textLines: string[] = [];
                      let urlLines: string[] = [];

                      if (Array.isArray(review.evidence)) {
                        // New array format
                        evidenceLines = review.evidence;
                        textLines = evidenceLines.filter((line) => {
                          const trimmedLine = line.trim();
                          return (
                            !trimmedLine.startsWith("http") &&
                            !trimmedLine.startsWith("https") &&
                            !trimmedLine.startsWith("---") &&
                            trimmedLine !== ""
                          );
                        });

                        urlLines = evidenceLines.filter((line) => {
                          const trimmedLine = line.trim();
                          return (
                            trimmedLine.startsWith("http://") ||
                            trimmedLine.startsWith("https://") ||
                            trimmedLine.startsWith("www.")
                          );
                        });
                      } else if (typeof review.evidence === "string") {
                        // Legacy string format
                        evidenceLines = review.evidence.split("\n");
                        textLines = evidenceLines.filter((line) => {
                          const trimmedLine = line.trim();
                          const cleanLine = trimmedLine.replace(
                            /^File:\s*/,
                            ""
                          );
                          return (
                            !cleanLine.startsWith("http") &&
                            !cleanLine.startsWith("https") &&
                            !trimmedLine.startsWith("---") &&
                            trimmedLine !== ""
                          );
                        });

                        urlLines = evidenceLines
                          .filter((line) => {
                            const trimmedLine = line.trim();
                            const cleanLine = trimmedLine.replace(
                              /^File:\s*/,
                              ""
                            );
                            return (
                              cleanLine.startsWith("http://") ||
                              cleanLine.startsWith("https://") ||
                              cleanLine.startsWith("www.")
                            );
                          })
                          .map((line) => line.replace(/^File:\s*/, "").trim());
                      }

                      return (
                        <>
                          {/* Text Evidence */}
                          {textLines.length > 0 && (
                            <div className="text-sm text-foreground">
                              {textLines.join("\n")}
                            </div>
                          )}

                          {/* Image/File Evidence */}
                          {urlLines.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-foreground mb-2">
                                Uploaded Files:
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                                {urlLines.map((url, index) => {
                                  let cleanUrl = url.trim();
                                  if (cleanUrl.startsWith("www.")) {
                                    cleanUrl = "https://" + cleanUrl;
                                  }

                                  const isImage = cleanUrl.match(
                                    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i
                                  );

                                  return (
                                    <div key={index} className="relative group">
                                      <div className="aspect-square bg-background rounded-lg border border-border overflow-hidden">
                                        {isImage ? (
                                          <img
                                            src={cleanUrl}
                                            alt={`Evidence ${index + 1}`}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                            onClick={() =>
                                              window.open(cleanUrl, "_blank")
                                            }
                                            onError={(e) => {
                                              e.currentTarget.style.display =
                                                "none";
                                              e.currentTarget.nextElementSibling?.classList.remove(
                                                "hidden"
                                              );
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <FileText className="w-8 h-8 text-muted-foreground" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <button
                                          onClick={() =>
                                            window.open(cleanUrl, "_blank")
                                          }
                                          className="px-3 py-1 bg-white/90 text-black text-xs rounded-md hover:bg-white transition-colors"
                                        >
                                          {isImage ? "View" : "Open"}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Add New Evidence */}
              <div className="space-y-3 sm:space-y-4">
                {/* Text Evidence */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Additional Text Evidence
                  </label>
                  <textarea
                    value={newEvidence}
                    onChange={(e) => setNewEvidence(e.target.value)}
                    className="w-full p-3 border border-input rounded-md bg-background text-foreground resize-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm sm:text-base"
                    rows={3}
                    placeholder="Add additional evidence (URLs, descriptions, etc.)..."
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Upload Files (Photos/Documents)
                  </label>
                  <label
                    htmlFor="evidence-files"
                    className="flex items-center justify-center w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-foreground transition border rounded-md cursor-pointer border-input hover:bg-accent hover:text-accent-foreground focus-within:ring-2 focus-within:ring-ring"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Add files
                  </label>
                  <input
                    type="file"
                    id="evidence-files"
                    accept="image/*,.pdf,.doc,.docx,.txt,.rtf"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Display selected files */}
                  {evidenceFiles.length > 0 && (
                    <div className="mt-3 sm:mt-4 space-y-2">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {evidenceFiles.length} file
                        {evidenceFiles.length !== 1 ? "s" : ""} selected
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                        {evidenceFiles.map((file, index) => {
                          const isImage = file.type.startsWith("image/");
                          const fileUrl = URL.createObjectURL(file);

                          return (
                            <div
                              key={index}
                              className="relative group bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                            >
                              <div className="h-24 sm:h-32 bg-muted">
                                {isImage ? (
                                  <img
                                    src={fileUrl}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                    onLoad={() => URL.revokeObjectURL(fileUrl)}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FileText className="w-8 h-8 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="p-2">
                                <p
                                  className="text-xs font-medium text-foreground truncate"
                                  title={file.name}
                                >
                                  {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  URL.revokeObjectURL(fileUrl);
                                  removeFile(index);
                                }}
                                className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="bg-gradient-to-br from-card to-card/80 border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-medium text-foreground mb-3">
                Review Status
              </h3>
              <div className="flex items-center space-x-2 mb-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    review.status === "approved"
                      ? "bg-green-500"
                      : review.status === "pending"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
                <span className="capitalize font-medium text-foreground">
                  {review.status}
                </span>
              </div>

              {review.status === "rejected" && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Your review was rejected and needs updates before it can be
                    approved.
                  </p>
                  {review.updated_after_rejection && (
                    <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                        Updated after rejection - ready for re-review
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
                className="text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || isUploadingFiles || !reviewText.trim()}
                className="bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 text-white border-0 disabled:opacity-50 text-sm"
              >
                {saving ? (
                  isUploadingFiles ? (
                    <>
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">
                        Uploading files...
                      </span>
                      <span className="sm:hidden">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Updating...</span>
                      <span className="sm:hidden">Update</span>
                    </>
                  )
                ) : (
                  <>
                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Update Review</span>
                    <span className="sm:hidden">Update</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
