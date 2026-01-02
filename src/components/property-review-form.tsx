"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { reviewsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

interface PropertyReviewFormProps {
  propertyId: string;
  propertyAddress?: string;
  onReviewSubmitted: () => void;
}

export function PropertyReviewForm({ 
  propertyId, 
  propertyAddress,
  onReviewSubmitted 
}: PropertyReviewFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting",
        variant: "destructive",
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Comment required",
        description: "Please write a review comment",
        variant: "destructive",
      });
      return;
    }

    if (comment.length > 1000) {
      toast({
        title: "Comment too long",
        description: "Please keep your review under 1000 characters",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit a review",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData = {
        rating: rating.toString(),
        address: propertyAddress || "",
        review_text: comment.trim(),
        property_id: propertyId,
        user_id: user.id,
      };

      await reviewsAPI.create(reviewData);

      toast({
        title: "Review submitted",
        description: "Your review has been posted successfully and is pending approval",
      });

      // Reset form
      setRating(0);
      setComment("");
      onReviewSubmitted();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Please try again later";
      toast({
        title: "Failed to submit review",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-lg p-6 border border-border space-y-6">
      <h3 className="text-xl font-semibold text-foreground">Write a Review</h3>

      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium mb-3 text-foreground">Your Rating</label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "w-8 h-8 transition-colors",
                  star <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 hover:text-gray-400"
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {rating} star{rating !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Comment Textarea */}
      <div>
        <label className="block text-sm font-medium mb-3 text-foreground">Your Review</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this property..."
          className="min-h-32 bg-background border-border rounded-lg resize-none"
          maxLength={1000}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-muted-foreground">
            {comment.length}/1000 characters
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || rating === 0 || !comment.trim()}
        className="w-full rounded-lg font-semibold"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Submitting...
          </>
        ) : (
          "Submit Review"
        )}
      </Button>
    </form>
  );
}

