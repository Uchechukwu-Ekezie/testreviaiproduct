"use client";

import React, { useEffect } from "react";
import { useProperties } from "@/contexts/properties-context";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin, Bed, Bath, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyCardSkeleton from "@/components/social-feed/PropertyCardSkeleton";

export default function FeaturedProperties() {
  const router = useRouter();
  const {
    properties,
    isLoading,
    error,
    fetchProperties,
    hasNext,
    hasPrevious,
    currentPage,
    totalPages,
    nextPage,
    previousPage,
  } = useProperties();

  // Load first page on mount (or when switching tabs)
  useEffect(() => {
    fetchProperties(1, 12); // 12 per page – nice grid on desktop
  }, [fetchProperties]);

  if (isLoading && properties.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <PropertyCardSkeleton />
        <PropertyCardSkeleton />
        <PropertyCardSkeleton />
        <PropertyCardSkeleton />
        <PropertyCardSkeleton />
        <PropertyCardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        {error}
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => fetchProperties(1, 12)}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No featured properties yet.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className=""></div>
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 px-2 sm:gap-6 sm:px-0">
        {properties.map((p) => {
          const primaryImg =
            p.images?.find((i) => i.is_primary)?.image_url ||
            p.image_url ||
            "/placeholder.svg";

          return (
            <div
              key={p.id}
              className="group cursor-pointer overflow-hidden border-[#2A2A2A] hover:border-white/30 transition-colors"
              onClick={() => router.push(`/social-feed/property/${p.id}`)}
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden rounded-2xl">
                <Image
                  src={primaryImg}
                  alt={p.title}
                  fill
                  className="object-cover rounded-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <div className="absolute bottom-2 left-2 text-white text-xs font-medium bg-black/60 px-2 py-1 rounded">
                  {p.status.replace("_", " ")}
                </div>
              </div>

              {/* Content */}
              <div className="p-3 sm:p-4 space-y-2">
                <h3 className="font-semibold text-white line-clamp-1">
                  {p.title}
                </h3>

                <div className="flex items-center gap-1 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{p.address}</span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  {p.bedrooms && (
                    <div className="flex items-center gap-1 bg-[#2A2A2A] px-2 py-1 rounded">
                      <Bed className="w-3 h-3" />
                      <span>{p.bedrooms}</span>
                    </div>
                  )}
                  {p.bathrooms && (
                    <div className="flex items-center gap-1 bg-[#2A2A2A] px-2 py-1 rounded">
                      <Bath className="w-3 h-3" />
                      <span>{p.bathrooms}</span>
                    </div>
                  )}
                  {p.size && (
                    <div className="flex items-center gap-1 bg-[#2A2A2A] px-2 py-1 rounded">
                      <Square className="w-3 h-3" />
                      <span>{p.size}</span>
                    </div>
                  )}
                </div>

                <div className="text-lg font-bold text-white">
                  {p.price || "Price on request"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {(hasPrevious || hasNext) && (
        <div className="flex justify-center items-center gap-4 mt-8 px-2 sm:px-0">
          <Button
            variant="outline"
            disabled={!hasPrevious}
            onClick={previousPage}
            className="text-white border-[#2A2A2A] hover:bg-[#2A2A2A]"
          >
            Previous
          </Button>

          <span className="text-gray-400 text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            disabled={!hasNext}
            onClick={nextPage}
            className="text-white border-[#2A2A2A] hover:bg-[#2A2A2A]"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
