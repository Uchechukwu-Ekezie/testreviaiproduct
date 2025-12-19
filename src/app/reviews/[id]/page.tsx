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

const ReviewPage = () => {
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id as string;

  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    review_text: "",
    rating: 5,
  });
  const [newEvidence, setNewEvidence] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Cloudinary configuration
  const CLOUDINARY_CLOUD_NAME = "dtyvgqppg";
  const CLOUDINARY_UPLOAD_PRESET = "review-evidence";

  useEffect(() => {
    if (reviewId) {
      fetchReview();
    }
  }, [reviewId]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const reviews = await reviewsAPI.getUserReviews();
      const foundReview = reviews.find((r: Review) => r.id === reviewId);
      if (foundReview) {
        setReview(foundReview);
        setEditForm({
          review_text: foundReview.review_text,
          rating: foundReview.rating,
        });
      } else {
        toast.error("Review not found");
        router.push("/reviews/user");
      }
    } catch (error) {
      console.error("Error fetching review:", error);
      toast.error("Failed to load review");
      router.push("/reviews/user");
    } finally {
      setLoading(false);
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
              className={`w-4 h-4 ${
                star <= rating
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300"
              } ${editable ? "cursor-pointer hover:text-yellow-500" : ""}`}
              onClick={editable && onChange ? () => onChange(star) : undefined}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-muted-foreground ml-2">
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
    });
  };

  // Upload file to Cloudinary
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "review-evidence");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    return data.secure_url;
  };

  // Upload all evidence files
  const uploadEvidenceFiles = async (): Promise<string[]> => {
    if (evidenceFiles.length === 0) return [];

    setIsUploadingFiles(true);
    try {
      const uploadPromises = evidenceFiles.map((file) =>
        uploadToCloudinary(file)
      );
      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading files:", error);
      throw error;
    } finally {
      setIsUploadingFiles(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEvidenceFiles((prev) => [...prev, ...files]);
  };

  // Remove file from selection
  const removeFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove existing evidence URL
  const removeEvidenceUrl = async (urlToRemove: string) => {
    if (!review || !review.evidence) return;

    try {
      // Parse current evidence and remove the specific URL
      console.log(
        "Evidence type:",
        typeof review.evidence,
        "Evidence value:",
        review.evidence
      );
      const evidenceLines =
        review.evidence && typeof review.evidence === "string"
          ? review.evidence.split("\n")
          : [];
      const filteredLines = evidenceLines.filter((line) => {
        const trimmedLine = line.trim();
        const cleanLine = trimmedLine.replace(/^File:\s*/, "");
        return cleanLine !== urlToRemove;
      });

      const updatedEvidence = filteredLines.join("\n");

      // Update the review with the new evidence
      await reviewsAPI.updateUserReview(review.id, {
        evidence: updatedEvidence,
      });

      toast.success("Evidence removed successfully!");
      await fetchReview(); // Refresh the review
    } catch (error) {
      console.error("Error removing evidence:", error);
      toast.error("Failed to remove evidence");
    }
  };

  // Save review changes
  const saveReview = async () => {
    if (!review) return;

    try {
      setSaveLoading(true);

      // Upload files if any
      const uploadedFileUrls = await uploadEvidenceFiles();

      // Combine evidence
      let combinedEvidence = "";
      if (review.evidence) {
        // Handle evidence - it can be string or string[]
        combinedEvidence = Array.isArray(review.evidence)
          ? review.evidence.join("\n")
          : review.evidence;
      }

      if (newEvidence.trim()) {
        if (combinedEvidence) {
          combinedEvidence = `${combinedEvidence}\n\n--- Additional Evidence ---\n${newEvidence.trim()}`;
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

      // Extract URLs from combinedEvidence and create array
      let evidenceArray: string[] = [];
      if (combinedEvidence && typeof combinedEvidence === "string") {
        const evidenceLines = combinedEvidence.split("\n");
        evidenceArray = evidenceLines
          .filter((line) => {
            const trimmedLine = line.trim();
            return (
              trimmedLine.startsWith("http") &&
              trimmedLine.includes("cloudinary")
            );
          })
          .map((url) => url.trim());
      }

      const updateData = {
        review_text: editForm.review_text,
        rating: editForm.rating,
        evidence: evidenceArray, // Send as array instead of string
        // Set updated_after_rejection to true if the review was rejected
        ...(review.status === "rejected" && { updated_after_rejection: true }),
      };

      console.log("Review Page - Sending update data:", updateData);
      console.log("Review Page - Review status:", review.status);
      console.log(
        "Review Page - Will set updated_after_rejection:",
        review.status === "rejected"
      );

      // Use the new API function that tries multiple field names
      const response = await reviewsAPI.updateUserReviewWithRejectionFlag(
        review.id,
        {
          review_text: editForm.review_text,
          rating: editForm.rating,
          evidence: combinedEvidence || "",
        },
        review.status === "rejected"
      );
      console.log("Review Page - Update response:", response);
      toast.success("Review updated successfully!");
      setEditing(false);
      setNewEvidence("");
      setEvidenceFiles([]);
      await fetchReview(); // Refresh the review
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("Failed to update review");
    } finally {
      setSaveLoading(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditing(false);
    setNewEvidence("");
    setEvidenceFiles([]);
    if (review) {
      setEditForm({
        review_text: review.review_text,
        rating: review.rating,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center px-4">
          <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-3 sm:mb-4 text-primary" />
          <p className="text-sm sm:text-base text-muted-foreground">
            Loading review...
          </p>
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

  // Debug logging
  console.log("Review status:", review.status);
  console.log("Editing state:", editing);
  console.log(
    "Should show edit button:",
    review.status === "rejected" && !editing
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
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
                  Review Details
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {formatDate(review.created_at)}
                </p>
              </div>
            </div>
            {(review.status === "rejected" || review.status === "pending") &&
              !editing && (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button
                    onClick={() => {
                      console.log(
                        "Edit button clicked, setting editing to true"
                      );
                      setEditing(true);
                    }}
                    variant="outline"
                    className="flex items-center justify-center space-x-2 text-xs sm:text-sm"
                  >
                    <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Quick Edit</span>
                    <span className="sm:hidden">Quick</span>
                  </Button>
                  <Button
                    onClick={() => router.push(`/reviews/${reviewId}/edit`)}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 text-white border-0 text-xs sm:text-sm"
                  >
                    <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Full Edit</span>
                    <span className="sm:hidden">Full</span>
                  </Button>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Review Card */}
          <div className="bg-gradient-to-br from-card to-card/80 border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
            {/* Header */}
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-3 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div
                      className={cn(
                        "flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border shadow-sm",
                        statusDisplay.bg,
                        "border-border"
                      )}
                    >
                      <StatusIcon
                        className={cn(
                          "w-3 h-3 sm:w-4 sm:h-4",
                          statusDisplay.color
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-semibold",
                          statusDisplay.color
                        )}
                      >
                        {statusDisplay.text}
                      </span>
                    </div>
                    {editing ? (
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                          Rating:
                        </span>
                        {renderStars(editForm.rating, true, (rating) =>
                          setEditForm((prev) => ({ ...prev, rating }))
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        {renderStars(review.rating)}
                      </div>
                    )}
                  </div>
                </div>
                {review.address && (
                  <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground text-xs sm:text-sm font-medium truncate">
                      {review.address}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Review Content */}
            {editing ? (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 sm:mb-3">
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
                    className="w-full p-3 sm:p-4 border border-input rounded-md bg-background text-foreground resize-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm sm:text-base"
                    rows={6}
                    placeholder="Write your review..."
                  />
                </div>

                {/* Evidence Section */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 sm:mb-3">
                    Evidence
                  </label>

                  {/* Existing Evidence (Read-only) */}
                  {review.evidence && (
                    <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-muted rounded-lg border border-border">
                      <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Existing Evidence:
                        </span>
                      </div>

                      {(() => {
                        // Parse evidence to separate text and URLs
                        const evidenceLines =
                          review.evidence && typeof review.evidence === "string"
                            ? review.evidence.split("\n")
                            : [];
                        console.log(
                          "Edit mode - Evidence lines:",
                          evidenceLines
                        );

                        const textLines = evidenceLines.filter((line) => {
                          const trimmedLine = line.trim();
                          // Remove "File: " prefix if present for checking
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

                        // More comprehensive URL detection - handle JSON arrays, "File: " prefix and section separators
                        const urlLines = evidenceLines
                          .filter((line) => {
                            const trimmedLine = line.trim();
                            // Remove "File: " prefix if present
                            const cleanLine = trimmedLine.replace(
                              /^File:\s*/,
                              ""
                            );
                            return (
                              cleanLine.startsWith("http://") ||
                              cleanLine.startsWith("https://") ||
                              cleanLine.startsWith("www.") ||
                              cleanLine.match(
                                /\.(jpg|jpeg|png|gif|webp|bmp|svg|pdf|doc|docx|txt|rtf)$/i
                              ) ||
                              cleanLine.startsWith('["') || // JSON array format
                              cleanLine.startsWith("['") // JSON array format with single quotes
                            );
                          })
                          .map((line) => {
                            // Remove "File: " prefix and clean the URL
                            let cleanLine = line
                              .replace(/^File:\s*/, "")
                              .trim();

                            // Handle JSON array format
                            if (
                              cleanLine.startsWith('["') ||
                              cleanLine.startsWith("['")
                            ) {
                              try {
                                const parsed = JSON.parse(cleanLine);
                                if (Array.isArray(parsed)) {
                                  return parsed; // Return array of URLs
                                }
                              } catch (e) {
                                console.log(
                                  "Failed to parse JSON array:",
                                  cleanLine
                                );
                              }
                            }

                            return cleanLine;
                          })
                          .flat(); // Flatten arrays to get individual URLs

                        console.log("Edit mode - URL lines found:", urlLines);

                        return (
                          <div className="space-y-3">
                            {/* Text Evidence */}
                            {textLines.length > 0 && (
                              <div>
                                <p className="text-sm text-foreground">
                                  {textLines.join("\n")}
                                </p>
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
                                    // Clean and format URL
                                    let cleanUrl = url.trim();
                                    if (cleanUrl.startsWith("www.")) {
                                      cleanUrl = "https://" + cleanUrl;
                                    }

                                    const isImage = cleanUrl.match(
                                      /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i
                                    );
                                    const isDocument = cleanUrl.match(
                                      /\.(pdf|doc|docx|txt|rtf)$/i
                                    );

                                    return (
                                      <div
                                        key={index}
                                        className="relative group"
                                      >
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
                                                console.error(
                                                  "Image failed to load:",
                                                  cleanUrl
                                                );
                                                e.currentTarget.style.display =
                                                  "none";
                                                e.currentTarget.nextElementSibling?.classList.remove(
                                                  "hidden"
                                                );
                                              }}
                                            />
                                          ) : null}

                                          {!isImage && (
                                            <div className="w-full h-full flex items-center justify-center">
                                              {isDocument ? (
                                                <FileText className="w-8 h-8 text-muted-foreground" />
                                              ) : (
                                                <div className="text-center">
                                                  <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                                                  <p className="text-xs text-muted-foreground">
                                                    File
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                          <div className="flex space-x-2">
                                            <button
                                              onClick={() =>
                                                window.open(cleanUrl, "_blank")
                                              }
                                              className="px-3 py-1 bg-white/90 text-black text-xs rounded-md hover:bg-white transition-colors"
                                            >
                                              {isImage ? "View" : "Open"}
                                            </button>
                                            <button
                                              onClick={() =>
                                                removeEvidenceUrl(cleanUrl)
                                              }
                                              className="px-3 py-1 bg-red-500/90 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
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
                                        onLoad={() =>
                                          URL.revokeObjectURL(fileUrl)
                                        }
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

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                  <Button
                    onClick={saveReview}
                    disabled={saveLoading || isUploadingFiles}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 text-white border-0 disabled:opacity-50 text-sm"
                  >
                    {saveLoading ? (
                      isUploadingFiles ? (
                        <>
                          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                          <span className="text-xs sm:text-sm">
                            Uploading files...
                          </span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                          <span className="text-xs sm:text-sm">Saving...</span>
                        </>
                      )
                    ) : (
                      <>
                        <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">Save Changes</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={cancelEditing}
                    className="text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {/* Review Text */}
                <div className="bg-gradient-to-r from-background to-background/50 p-4 sm:p-6 rounded-xl border border-border shadow-sm">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                    Review
                  </h4>
                  <p className="text-foreground leading-relaxed text-base">
                    {review.review_text}
                  </p>
                </div>

                {/* Evidence */}
                {review.evidence && (
                  <div className="bg-gradient-to-br from-muted/50 to-muted/30 p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                        Supporting Evidence
                      </h4>
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
                          console.log(
                            "View mode - Evidence array:",
                            evidenceLines
                          );

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
                              trimmedLine.startsWith("www.") ||
                              trimmedLine.match(
                                /\.(jpg|jpeg|png|gif|webp|bmp|svg|pdf|doc|docx|txt|rtf)$/i
                              )
                            );
                          });
                        } else if (typeof review.evidence === "string") {
                          // Legacy string format
                          evidenceLines = review.evidence.split("\n");
                          console.log(
                            "View mode - Evidence lines:",
                            evidenceLines
                          );
                          console.log("Full evidence:", review.evidence);

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

                          // More comprehensive URL detection - handle JSON arrays, "File: " prefix and section separators
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
                                cleanLine.startsWith("www.") ||
                                cleanLine.match(
                                  /\.(jpg|jpeg|png|gif|webp|bmp|svg|pdf|doc|docx|txt|rtf)$/i
                                ) ||
                                cleanLine.startsWith('["') || // JSON array format
                                cleanLine.startsWith("['") // JSON array format with single quotes
                              );
                            })
                            .map((line) => {
                              let cleanLine = line
                                .replace(/^File:\s*/, "")
                                .trim();

                              // Handle JSON array format
                              if (
                                cleanLine.startsWith('["') ||
                                cleanLine.startsWith("['")
                              ) {
                                try {
                                  const parsed = JSON.parse(cleanLine);
                                  if (Array.isArray(parsed)) {
                                    return parsed; // Return array of URLs
                                  }
                                } catch (e) {
                                  console.log(
                                    "Failed to parse JSON array:",
                                    cleanLine
                                  );
                                }
                              }

                              return cleanLine;
                            })
                            .flat(); // Flatten arrays to get individual URLs
                        }

                        console.log("View mode - URL lines found:", urlLines);
                        console.log("Text lines found:", textLines);

                        return (
                          <>
                            {/* Text Evidence */}
                            {/* {textLines.length > 0 && (
                              <div>
                                <p className="text-muted-foreground text-sm">
                                  {textLines.join('\n')}
                                </p>
                              </div>
                            )} */}

                            {/* Image/File Evidence */}
                            {urlLines.length > 0 ? (
                              <div>
                                <p className="text-sm font-medium text-foreground mb-2">
                                  Uploaded Files:
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                                  {urlLines.map((url, index) => {
                                    // Clean and format URL
                                    let cleanUrl = url.trim();
                                    if (cleanUrl.startsWith("www.")) {
                                      cleanUrl = "https://" + cleanUrl;
                                    }

                                    const isImage = cleanUrl.match(
                                      /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i
                                    );
                                    const isDocument = cleanUrl.match(
                                      /\.(pdf|doc|docx|txt|rtf)$/i
                                    );

                                    console.log(
                                      `Processing URL ${index + 1}:`,
                                      cleanUrl,
                                      "isImage:",
                                      isImage,
                                      "isDocument:",
                                      isDocument
                                    );

                                    return (
                                      <div
                                        key={index}
                                        className="relative group"
                                      >
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
                                                console.error(
                                                  "Image failed to load:",
                                                  cleanUrl
                                                );
                                                e.currentTarget.style.display =
                                                  "none";
                                                e.currentTarget.nextElementSibling?.classList.remove(
                                                  "hidden"
                                                );
                                              }}
                                            />
                                          ) : null}

                                          {!isImage && (
                                            <div className="w-full h-full flex items-center justify-center">
                                              {isDocument ? (
                                                <FileText className="w-8 h-8 text-muted-foreground" />
                                              ) : (
                                                <div className="text-center">
                                                  <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                                                  <p className="text-xs text-muted-foreground">
                                                    File
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                          <div className="flex space-x-2">
                                            <button
                                              onClick={() =>
                                                window.open(cleanUrl, "_blank")
                                              }
                                              className="px-3 py-1 bg-white/90 text-black text-xs rounded-md hover:bg-white transition-colors"
                                            >
                                              {isImage ? "View" : "Open"}
                                            </button>
                                            <button
                                              onClick={() =>
                                                removeEvidenceUrl(cleanUrl)
                                              }
                                              className="px-3 py-1 bg-red-500/90 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Evidence content:
                                </p>
                                <pre className="text-xs text-foreground bg-muted p-3 rounded border overflow-auto">
                                  {review.evidence}
                                </pre>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Moderator Feedback */}
                {review.moderator_note && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 sm:p-6 rounded-xl border border-amber-200 dark:border-amber-800 shadow-sm">
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
                        <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 leading-relaxed mb-2 sm:mb-3">
                          {review.moderator_note}
                        </p>
                        {review.updated_after_rejection && (
                          <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs sm:text-sm text-green-700 dark:text-green-300 font-medium">
                              Updated after rejection - ready for re-review
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
