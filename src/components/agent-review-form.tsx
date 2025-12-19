"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AgentReviewFormProps {
  agentId: string;
  onReviewSubmitted: () => void;
}

export function AgentReviewForm({ agentId, onReviewSubmitted }: AgentReviewFormProps) {
  const { toast } = useToast();
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

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth/agent-reviews/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            agent: agentId,
            rating,
            comment: comment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to submit review");
      }

      toast({
        title: "Review submitted",
        description: "Your review has been posted successfully",
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
    <form onSubmit={handleSubmit} className="bg-[#2E2E2E] rounded-3xl p-6 space-y-6">
      <h3 className="text-xl font-bold">Write a Review</h3>

      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium mb-3">Your Rating</label>
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
                    : "text-gray-600 hover:text-gray-500"
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
        <label className="block text-sm font-medium mb-3">Your Review</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience working with this agent..."
          className="min-h-32 bg-[#1E1E1E] border-[#3E3E3E] rounded-2xl resize-none"
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
        className="w-full rounded-full font-semibold"
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
