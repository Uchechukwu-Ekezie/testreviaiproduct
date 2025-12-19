// components/social-feed/PostCardSkeleton.tsx
"use client";

import React from "react";

export default function PostCardSkeleton() {
  return (
    <div className="bg-[#1A1A1A] rounded-[20px] p-4 sm:p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar skeleton */}
          <div className="w-10 h-10 rounded-full bg-gray-700"></div>
          <div className="space-y-2">
            {/* Name skeleton */}
            <div className="h-4 w-32 bg-gray-700 rounded"></div>
            {/* Time skeleton */}
            <div className="h-3 w-20 bg-gray-700 rounded"></div>
          </div>
        </div>
        {/* More button skeleton */}
        <div className="w-6 h-6 bg-gray-700 rounded"></div>
      </div>

      {/* Caption skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-gray-700 rounded"></div>
        <div className="h-4 w-3/4 bg-gray-700 rounded"></div>
      </div>

      {/* Image skeleton */}
      <div className="w-full h-[400px] bg-gray-700 rounded-[12px] mb-4"></div>

      {/* Action buttons skeleton */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-700 rounded-full"></div>
          <div className="h-3 w-8 bg-gray-700 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-700 rounded-full"></div>
          <div className="h-3 w-8 bg-gray-700 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-700 rounded-full"></div>
          <div className="h-3 w-8 bg-gray-700 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-700 rounded-full"></div>
          <div className="h-3 w-8 bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* Views skeleton */}
      <div className="h-3 w-24 bg-gray-700 rounded"></div>
    </div>
  );
}
