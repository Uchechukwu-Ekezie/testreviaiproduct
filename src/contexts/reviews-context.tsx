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
import { reviewsCache } from "@/lib/cache";

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
  getReviewsByPropertyId: (propertyId: string) => Promise<Review[]>;
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
      setIsLoading(true);
      setError(null);
      const response = (await reviewsAPI.getAll()) as any;

      if (response && Array.isArray(response)) {
        setReviews(response);
      } else if (response && response.results) {
        setReviews(response.results);
      } else {
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
    }
  }, []);

  const fetchReviewsByUserId = useCallback(
    async (userId: string, filters?: ReviewFilters) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = (await reviewsAPI.getByUserId(userId, filters)) as any;

        if (response && Array.isArray(response)) {
          setReviews(response);
        } else if (response && response.results) {
          setReviews(response.results);
        } else if (response && response.data) {
          setReviews(response.data);
        } else {
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
      }
    },
    []
  );

  const getReviewById = useCallback(
    async (id: string): Promise<Review | null> => {
      try {
        const response = (await reviewsAPI.getById(id)) as any;
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

  const getReviewsByPropertyId = useCallback(
    async (propertyId: string): Promise<Review[]> => {
      try {
        // Check cache first
        const cacheKey = `reviews_property_${propertyId}`;
        const cached = reviewsCache.get<Review[]>(cacheKey);
        if (cached) {
          console.log("✅ Reviews loaded from cache for property:", propertyId);
          return cached;
        }

        console.log("🔄 Fetching reviews from API for property:", propertyId);
        const response = (await reviewsAPI.getByProperty(propertyId)) as any;

        let reviews: Review[] = [];
        if (Array.isArray(response)) {
          console.log(
            "getReviewsByPropertyId: Got array response:",
            response.length
          );
          reviews = response;
        } else if (response && Array.isArray(response.results)) {
          console.log(
            "getReviewsByPropertyId: Got paginated response:",
            response.results.length
          );
          reviews = response.results;
        } else {
          console.log(
            "getReviewsByPropertyId: Unexpected response format:",
            response
          );
        }

        // Cache for 3 minutes
        reviewsCache.set(cacheKey, reviews, 180);

        return reviews;
      } catch (error) {
        console.error("getReviewsByPropertyId: Error occurred:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch reviews for property";
        setError(errorMessage);
        return [];
      }
    },
    []
  );

  const approveReview = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true);
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
    // State change monitoring removed
  }, [reviews, isLoading, error]);

  const value: ReviewsContextType = {
    reviews,
    isLoading,
    error,
    fetchReviews,
    fetchReviewsByUserId,
    getReviewById,
    getReviewsByPropertyId,
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
