"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentReviewCardProps {
  review: {
    id: string;
    reviewer: {
      id: string;
      first_name?: string;
      last_name?: string;
      username?: string;
      avatar?: string;
    };
    rating: number;
    comment: string;
    created_at: string;
  };
}

export function AgentReviewCard({ review }: AgentReviewCardProps) {
  const reviewerName =
    `${review.reviewer.first_name || ""} ${review.reviewer.last_name || ""}`.trim() ||
    review.reviewer.username?.split("@")[0] ||
    "Anonymous";

  const reviewerInitials = reviewerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-[#2E2E2E] rounded-3xl p-6 space-y-4">
      {/* Reviewer Info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={review.reviewer.avatar} alt={reviewerName} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {reviewerInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold">{reviewerName}</h4>
            <p className="text-sm text-muted-foreground">
              {formatDate(review.created_at)}
            </p>
          </div>
        </div>

        {/* Rating Stars */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "w-5 h-5",
                star <= review.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-600"
              )}
            />
          ))}
        </div>
      </div>

      {/* Review Comment */}
      <p className="text-foreground leading-relaxed">{review.comment}</p>
    </div>
  );
}
