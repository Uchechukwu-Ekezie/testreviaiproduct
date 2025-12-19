"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchAndFilterProps {
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
}

export default function SearchAndFilter({
  selectedFilter,
  setSelectedFilter,
}: SearchAndFilterProps) {
  const tabs = [
    { id: "trending", label: "Trending Posts" },
    { id: "featured", label: "Featured Properties" },
    { id: "neighborhood", label: "Neighborhood Highlights" },
    { id: "agents", label: "Top Agents" },
  ];

  return (
    <div className="mb-4 sm:mb-6">
      {/* Mobile: Compact horizontal scroll */}
      <div className="md:hidden">
        <div
          className="flex gap-2 overflow-x-auto px-4 pb-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setSelectedFilter(tab.id)}
              className={cn(
                "px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-200",
                selectedFilter === tab.id
                  ? "text-white bg-gradient-to-r from-yellow-500 to-pink-500 shadow-lg "
                  : "text-gray-400 bg-transparent hover:text-white hover:bg-gray-700/70 border border-gray-700/50"
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tablet & Desktop: Full width tabs */}
      <div className="hidden md:block">
        <div className="flex border-b border-gray-800/50  rounded-t-lg backdrop-blur-sm">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setSelectedFilter(tab.id)}
              className={cn(
                "flex-1 px-4 lg:px-6 py-3 text-sm font-medium border-b-2 rounded-none whitespace-nowrap transition-all duration-200",
                selectedFilter === tab.id
                  ? "text-white border-white bg-blue-transparent hover:rounded-t-xl"
                  : "text-gray-400 hover:text-gray-200 hover:border-gray-500/50 border-transparent hover:rounded-t-xl"
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
