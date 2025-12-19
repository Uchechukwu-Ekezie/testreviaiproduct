"use client";

import React, { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export default function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrev,
}: ImageLightboxProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Arrow key navigation
  useEffect(() => {
    const handleArrows = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleArrows);
    }

    return () => {
      document.removeEventListener("keydown", handleArrows);
    };
  }, [isOpen, onNext, onPrev]);

  if (!isOpen) return null;

  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Image counter */}
      {hasMultiple && (
        <div className="absolute top-4 left-4 z-50 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Previous button */}
      {hasMultiple && onPrev && currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>
      )}

      {/* Next button */}
      {hasMultiple && onNext && currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      )}

      {/* Image */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full max-w-7xl max-h-[90vh]">
          <Image
            src={currentImage}
            alt={`Image ${currentIndex + 1}`}
            fill
            className="object-contain"
            unoptimized={currentImage?.startsWith("http")}
            priority
          />
        </div>
      </div>

      {/* Thumbnails */}
      {hasMultiple && images.length <= 10 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 p-2 rounded-lg bg-black/50 backdrop-blur-sm">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                // Use onNext/onPrev to navigate to specific index
                const diff = idx - currentIndex;
                if (diff > 0 && onNext) {
                  for (let i = 0; i < diff; i++) onNext();
                } else if (diff < 0 && onPrev) {
                  for (let i = 0; i < Math.abs(diff); i++) onPrev();
                }
              }}
              className={cn(
                "relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                idx === currentIndex
                  ? "border-white scale-110"
                  : "border-transparent opacity-50 hover:opacity-100"
              )}
            >
              <Image
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                unoptimized={img?.startsWith("http")}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
