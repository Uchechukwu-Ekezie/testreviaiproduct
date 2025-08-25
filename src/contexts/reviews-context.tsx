"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { reviewsAPI } from "@/lib/api";

interface Review {
  id: string;
  property: {
    id: string;
    title: string;
    location: string;
  } | null; // Can be null as shown in your response
  user: {
    id: string;
    name: string; // Changed from first_name/last_name
    email: string;
  };
  rating: number;
  review_text: string; // Changed from comment
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  address: string; // Add this field
  evidence: string;
  embeddings: string;
  reply?: string;
}

interface ReviewFilters {
  status?: "pending" | "approved" | "rejected";
  rating?: number;
  property_id?: string;
  page?: number;
  page_size?: number;
}

interface ReviewsContextType {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  fetchReviews: () => Promise<void>;
  fetchReviewsByUserId: (
    userId: string,
    filters?: ReviewFilters
  ) => Promise<void>;
  getReviewById: (id: string) => Promise<Review | null>;
  approveReview: (id: string) => Promise<{ success: boolean; error?: string }>;
  rejectReview: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteReview: (id: string) => Promise<{ success: boolean; error?: string }>;
  replyToReview: (
    id: string,
    message: string
  ) => Promise<{ success: boolean; error?: string }>;
  refreshReviews: () => Promise<void>;
  getReviewStats: () => {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    averageRating: number;
  };
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (context === undefined) {
    throw new Error("useReviews must be used within a ReviewsProvider");
  }
  return context;
};

interface ReviewsProviderProps {
  children: ReactNode;
}

export const ReviewsProvider: React.FC<ReviewsProviderProps> = ({
  children,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      console.log("fetchReviews: Starting...");
      setIsLoading(true);
      setError(null);
      const response = await reviewsAPI.getAll();
      console.log("fetchReviews: Raw response:", response);

      if (response && Array.isArray(response)) {
        console.log(
          "fetchReviews: Setting reviews from array, count:",
          response.length
        );
        setReviews(response);
      } else if (response && response.results) {
        console.log(
          "fetchReviews: Setting reviews from results, count:",
          response.results.length
        );
        setReviews(response.results);
      } else {
        console.log("fetchReviews: No valid data, setting empty array");
        setReviews([]);
      }
    } catch (error) {
      console.error("fetchReviews: Error occurred:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch reviews";
      setError(errorMessage);
      setReviews([]);
    } finally {
      setIsLoading(false);
      console.log("fetchReviews: Completed");
    }
  }, []);

  const fetchReviewsByUserId = useCallback(
    async (userId: string, filters?: ReviewFilters) => {
      try {
        console.log(
          "fetchReviewsByUserId: Starting with userId:",
          userId,
          "filters:",
          filters
        );
        setIsLoading(true);
        setError(null);
        const response = await reviewsAPI.getByUserId(userId, filters);
        console.log("fetchReviewsByUserId: Raw response:", response);

        if (response && Array.isArray(response)) {
          console.log(
            "fetchReviewsByUserId: Setting reviews from array, count:",
            response.length
          );
          setReviews(response);
        } else if (response && response.results) {
          console.log(
            "fetchReviewsByUserId: Setting reviews from results, count:",
            response.results.length
          );
          setReviews(response.results);
        } else if (response && response.data) {
          console.log(
            "fetchReviewsByUserId: Setting reviews from data, count:",
            response.data.length
          );
          setReviews(response.data);
        } else {
          console.log(
            "fetchReviewsByUserId: No valid data, setting empty array"
          );
          setReviews([]);
        }
      } catch (error) {
        console.error("fetchReviewsByUserId: Error occurred:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch reviews";
        setError(errorMessage);
        setReviews([]);
      } finally {
        setIsLoading(false);
        console.log("fetchReviewsByUserId: Completed");
      }
    },
    []
  );

  const getReviewById = useCallback(
    async (id: string): Promise<Review | null> => {
      try {
        console.log("getReviewById: Fetching review with id:", id);
        const response = await reviewsAPI.getById(id);
        console.log("getReviewById: Response:", response);
        return response || null;
      } catch (error) {
        console.error("getReviewById: Error occurred:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch review";
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  const approveReview = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true);
        console.log("approveReview: Approving review:", id);
        await reviewsAPI.approve(id);

        // Update local state
        setReviews((prevReviews) =>
          prevReviews.map((review) =>
            review.id === id
              ? { ...review, status: "approved" as const }
              : review
          )
        );

        return { success: true };
      } catch (error) {
        console.error("approveReview: Error occurred:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to approve review";
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const rejectReview = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true);
        console.log("rejectReview: Rejecting review:", id);
        await reviewsAPI.reject(id);

        // Update local state
        setReviews((prevReviews) =>
          prevReviews.map((review) =>
            review.id === id
              ? { ...review, status: "rejected" as const }
              : review
          )
        );

        return { success: true };
      } catch (error) {
        console.error("rejectReview: Error occurred:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to reject review";
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteReview = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true);
        console.log("deleteReview: Deleting review:", id);
        await reviewsAPI.delete(id);

        // Remove from local state
        setReviews((prevReviews) =>
          prevReviews.filter((review) => review.id !== id)
        );

        return { success: true };
      } catch (error) {
        console.error("deleteReview: Error occurred:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete review";
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const replyToReview = useCallback(
    async (
      id: string,
      message: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true);
        console.log(
          "replyToReview: Replying to review:",
          id,
          "with message:",
          message
        );
        const response = await reviewsAPI.reply(id, message);

        if (response) {
          // Update local state
          setReviews((prevReviews) =>
            prevReviews.map((review) =>
              review.id === id ? { ...review, reply: message } : review
            )
          );
          return { success: true };
        } else {
          return { success: false, error: "Failed to reply to review" };
        }
      } catch (error) {
        console.error("replyToReview: Error occurred:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to reply to review";
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const refreshReviews = useCallback(async () => {
    console.log("refreshReviews: Called");
    await fetchReviews();
  }, [fetchReviews]);

  const getReviewStats = useCallback(() => {
    const total = reviews.length;
    const pending = reviews.filter(
      (review) => review.status === "pending"
    ).length;
    const approved = reviews.filter(
      (review) => review.status === "approved"
    ).length;
    const rejected = reviews.filter(
      (review) => review.status === "rejected"
    ).length;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = total > 0 ? totalRating / total : 0;

    return {
      total,
      pending,
      approved,
      rejected,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }, [reviews]);

  // Debug effect to log state changes
  useEffect(() => {
    console.log(
      "ReviewsContext: State changed - Reviews count:",
      reviews.length,
      "Loading:",
      isLoading,
      "Error:",
      error
    );
  }, [reviews, isLoading, error]);

  const value: ReviewsContextType = {
    reviews,
    isLoading,
    error,
    fetchReviews,
    fetchReviewsByUserId,
    getReviewById,
    approveReview,
    rejectReview,
    deleteReview,
    replyToReview,
    refreshReviews,
    getReviewStats,
  };

  return (
    <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>
  );
};
