// components/social-feed/AgentProfileSkeleton.tsx
"use client";

import React from "react";
import PropertyCardSkeleton from "./PropertyCardSkeleton";

export default function AgentProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background font-sans pt-10 animate-pulse">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="w-10 h-10 bg-gray-700 rounded"></div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-[#1A1A1A] rounded-[20px] p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar skeleton */}
            <div className="w-32 h-32 rounded-full bg-gray-700"></div>

            <div className="flex-1 text-center md:text-left space-y-4 w-full">
              {/* Name skeleton */}
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <div className="h-8 w-48 bg-gray-700 rounded"></div>
              </div>

              {/* Stats skeleton */}
              <div className="flex justify-center md:justify-start gap-8 mb-4">
                <div className="space-y-2">
                  <div className="h-6 w-16 bg-gray-700 rounded mx-auto md:mx-0"></div>
                  <div className="h-4 w-20 bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-16 bg-gray-700 rounded mx-auto md:mx-0"></div>
                  <div className="h-4 w-20 bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-16 bg-gray-700 rounded mx-auto md:mx-0"></div>
                  <div className="h-4 w-20 bg-gray-700 rounded"></div>
                </div>
              </div>

              {/* Buttons skeleton */}
              <div className="flex gap-3 justify-center md:justify-start">
                <div className="h-10 w-32 bg-gray-700 rounded-full"></div>
                <div className="h-10 w-32 bg-gray-700 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-6 border-b border-border mb-6">
          <div className="h-10 w-24 bg-gray-700 rounded"></div>
          <div className="h-10 w-24 bg-gray-700 rounded"></div>
          <div className="h-10 w-24 bg-gray-700 rounded"></div>
        </div>

        {/* Content skeleton - Property cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
        </div>
      </div>
    </div>
  );
}
