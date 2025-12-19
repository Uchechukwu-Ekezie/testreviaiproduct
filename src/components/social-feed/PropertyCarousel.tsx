"use client";

import React, { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Property } from "@/contexts/properties-context";

interface PropertyCarouselProps {
  property: Property;
  heightClass?: string; // allow override e.g. h-72 etc.
}

// Collect all image candidates from images[], image_urls[], fallback image_url.
function extractImageUrls(property: Property): string[] {
  if (property.images && property.images.length > 0) {
    return property.images
      .sort((a, b) => a.display_order - b.display_order)
      .map((img) => img.image_url)
      .filter(Boolean);
  }
  if (property.image_urls && property.image_urls.length > 0) {
    return property.image_urls
      .sort((a, b) => a.display_order - b.display_order)
      .map((img) => img.url)
      .filter(Boolean);
  }
  if (property.image_url) return [property.image_url];
  return [];
}

const SWIPE_THRESHOLD = 40; // px

export const PropertyCarousel: React.FC<PropertyCarouselProps> = ({
  property,
  heightClass = "h-56",
}) => {
  const images = extractImageUrls(property);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      if (delta < 0) next(); else prev();
    }
    touchStartX.current = null;
  };

  if (images.length === 0) {
    return (
      <div
        className={`${heightClass} w-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-xs text-gray-400`}
      >
        No image available
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${heightClass} select-none overflow-hidden group`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {images.map((src, i) => (
        <Image
          key={src + i}
          src={src}
          alt={property.title}
          fill
          priority={i === index}
          sizes="(max-width: 768px) 100vw, 600px"
          className={`object-cover transition-opacity duration-300 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition-all ${
                  i === index ? "bg-white scale-110" : "bg-white/40"
                }`}
              />
            ))}
          </div>
          {/* Counter */}
          <div className="absolute top-2 right-2 bg-black/50 text-[11px] px-2 py-0.5 rounded-full text-white">
            {index + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
};

export default PropertyCarousel;