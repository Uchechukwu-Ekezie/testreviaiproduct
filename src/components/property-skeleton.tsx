"use client";

import { Eye } from "lucide-react";

export default function PropertySkeleton() {
  return (
    <div className="bg-[#121212] backdrop-blur-sm border border-[#262626] rounded-[20px] p-3 overflow-hidden transition-all duration-300 cursor-pointer group animate-pulse" style={{ animationDuration: '2s' }}>
      {/* Property Image Skeleton */}
      <div className="relative h-[240px] overflow-hidden p-5">
        <div className="w-full h-full bg-gray-700 rounded-[15px] group-hover:scale-105 transition-transform duration-300"></div>
        
        {/* Badge Skeleton */}
        <div className="absolute top-3 left-3 bg-gray-600 text-transparent text-xs px-2 py-1 rounded-full w-20 h-6"></div>
      </div>

      {/* Property Details Skeleton */}
      <div className="py-3 space-y-3">
        {/* Title and Location Skeleton */}
        <div>
          <div className="h-5 bg-gray-700 rounded w-3/4 mb-1"></div>
          <div className="h-4 bg-gray-600 rounded w-1/2"></div>
        </div>

        {/* Rating Skeleton */}
        <div className="flex w-[252px] items-center gap-3 bg-white/5 px-3 py-1 rounded-full text-sm">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="w-4 h-4 bg-gray-600 rounded"></div>
            ))}
          </div>
          <div className="h-4 bg-gray-600 rounded w-24"></div>
        </div>

        {/* Price Skeleton */}
        <div className="h-6 bg-gray-700 rounded w-28 py-1"></div>

        {/* Action Buttons Skeleton */}
        <div className="flex gap-2 pt-2">
          <div className="flex-1 rounded-[15px] border border-white/20 py-2 px-4 text-sm flex items-center justify-center gap-2">
            <Eye className="w-4 h-4 text-gray-400" />
            <div className="h-4 bg-gray-600 rounded w-8"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PropertySkeletonGrid({ count = 6 }: { count?: number } = {}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, index) => (
        <PropertySkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
}
