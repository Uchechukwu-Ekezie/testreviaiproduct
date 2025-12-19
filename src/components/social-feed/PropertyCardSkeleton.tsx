// components/social-feed/PropertyCardSkeleton.tsx
"use client";

import React from "react";

export default function PropertyCardSkeleton() {
  return (
    <div className="bg-[#1A1A1A] rounded-[20px] overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-gray-700"></div>

      <div className="p-4 space-y-3">
        {/* Price skeleton */}
        <div className="h-6 w-32 bg-gray-700 rounded"></div>

        {/* Title skeleton */}
        <div className="h-5 w-full bg-gray-700 rounded"></div>

        {/* Location skeleton */}
        <div className="h-4 w-2/3 bg-gray-700 rounded"></div>

        {/* Features skeleton */}
        <div className="flex gap-4">
          <div className="h-4 w-16 bg-gray-700 rounded"></div>
          <div className="h-4 w-16 bg-gray-700 rounded"></div>
          <div className="h-4 w-16 bg-gray-700 rounded"></div>
        </div>

        {/* Button skeleton */}
        <div className="h-10 w-full bg-gray-700 rounded-full mt-4"></div>
      </div>
    </div>
  );
}
