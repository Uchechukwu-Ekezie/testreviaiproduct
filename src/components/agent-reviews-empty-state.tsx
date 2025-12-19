"use client";

import React from "react";
import { Star } from "lucide-react";

export function AgentReviewsEmptyState() {
  return (
    <div className="text-center py-20 space-y-6">
      <div className="flex justify-center">
        <div className="bg-[#2E2E2E] rounded-full p-6">
          <Star className="w-16 h-16 text-muted-foreground" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold">No Reviews Yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          This agent hasn't received any reviews yet. Be the first to share your experience!
        </p>
      </div>
    </div>
  );
}
