// components/social-feed/AgentCardSkeleton.tsx
"use client";

import React from "react";

export default function AgentCardSkeleton() {
  return (
    <div className="bg-[#1A1A1A] rounded-[20px] p-4 sm:p-6 animate-pulse">
      {/* Avatar skeleton */}
      <div className="flex justify-center mb-4">
        <div className="w-20 h-20 rounded-full bg-gray-700"></div>
      </div>

      {/* Name skeleton */}
      <div className="flex justify-center mb-2">
        <div className="h-5 w-32 bg-gray-700 rounded"></div>
      </div>

      {/* Stats skeleton */}
      <div className="flex justify-center gap-4 mb-4">
        <div className="text-center space-y-1">
          <div className="h-4 w-8 bg-gray-700 rounded mx-auto"></div>
          <div className="h-3 w-16 bg-gray-700 rounded"></div>
        </div>
        <div className="text-center space-y-1">
          <div className="h-4 w-8 bg-gray-700 rounded mx-auto"></div>
          <div className="h-3 w-16 bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* Location skeleton */}
      <div className="flex justify-center mb-4">
        <div className="h-3 w-24 bg-gray-700 rounded"></div>
      </div>

      {/* Button skeleton */}
      <div className="h-10 w-full bg-gray-700 rounded-full"></div>
    </div>
  );
}
