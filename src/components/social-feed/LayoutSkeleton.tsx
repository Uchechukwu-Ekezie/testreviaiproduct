// components/social-feed/LayoutSkeleton.tsx
"use client";

import React from "react";

export default function LayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-[#141414] animate-pulse">
      {/* Sidebar skeleton */}
      <div className="hidden lg:block w-64 border-r border-gray-800">
        <div className="fixed h-screen w-64 p-4 space-y-6">
          {/* Logo skeleton */}
          <div className="h-10 w-32 bg-gray-700 rounded mb-8"></div>

          {/* Nav items skeleton */}
          <div className="space-y-4">
            <div className="h-12 w-full bg-gray-700 rounded"></div>
            <div className="h-12 w-full bg-gray-700 rounded"></div>
            <div className="h-12 w-full bg-gray-700 rounded"></div>
            <div className="h-12 w-full bg-gray-700 rounded"></div>
            <div className="h-12 w-full bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1">
        {/* Header skeleton */}
        <div className="sticky top-0 z-10 bg-[#141414] border-b border-gray-800 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="h-12 w-full bg-gray-700 rounded-full"></div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          <div className="h-32 w-full bg-gray-700 rounded-[20px]"></div>
          <div className="h-96 w-full bg-gray-700 rounded-[20px]"></div>
          <div className="h-96 w-full bg-gray-700 rounded-[20px]"></div>
        </div>
      </div>

      {/* Right sidebar skeleton */}
      <div className="hidden xl:block w-80 border-l border-gray-800">
        <div className="fixed h-screen w-80 p-4 space-y-6">
          <div className="h-64 w-full bg-gray-700 rounded-[20px]"></div>
          <div className="h-48 w-full bg-gray-700 rounded-[20px]"></div>
        </div>
      </div>
    </div>
  );
}
