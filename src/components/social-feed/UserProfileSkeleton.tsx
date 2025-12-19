// components/social-feed/UserProfileSkeleton.tsx
"use client";

import React from "react";
import PostCardSkeleton from "./PostCardSkeleton";

export default function UserProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#141414] font-sans pt-10 animate-pulse">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#141414]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="w-20 h-10 bg-gray-700 rounded"></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="text-center mb-8">
          {/* Avatar skeleton */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gray-700 border-2 sm:border-4 border-gray-800"></div>
          </div>

          {/* Name skeleton */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-8 w-48 bg-gray-700 rounded"></div>
          </div>

          {/* Username skeleton */}
          <div className="flex justify-center mb-6">
            <div className="h-4 w-32 bg-gray-700 rounded"></div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-3 gap-6 mb-8 max-w-md mx-auto">
            <div className="space-y-2">
              <div className="h-8 w-12 bg-gray-700 rounded mx-auto"></div>
              <div className="h-4 w-16 bg-gray-700 rounded mx-auto"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 w-12 bg-gray-700 rounded mx-auto"></div>
              <div className="h-4 w-20 bg-gray-700 rounded mx-auto"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 w-12 bg-gray-700 rounded mx-auto"></div>
              <div className="h-4 w-20 bg-gray-700 rounded mx-auto"></div>
            </div>
          </div>

          {/* Button skeleton */}
          <div className="flex justify-center mb-8">
            <div className="h-12 w-32 bg-gray-700 rounded-full"></div>
          </div>

          {/* Tabs skeleton */}
          <div className="flex gap-2 border-2 border-gray-800 rounded-full p-1 max-w-md mx-auto mb-8">
            <div className="h-10 flex-1 bg-gray-700 rounded-full"></div>
            <div className="h-10 flex-1 bg-gray-700 rounded-full"></div>
          </div>
        </div>

        {/* Posts skeleton */}
        <div className="space-y-4">
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      </div>
    </div>
  );
}
