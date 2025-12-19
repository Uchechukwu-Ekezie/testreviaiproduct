// components/ui/SafeImage.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  [key: string]: any;
}

export default function SafeImage({
  src,
  alt,
  fill,
  className,
  priority,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false);

  // Guard against invalid URLs
  if (
    !src ||
    error ||
    src.includes("null") ||
    src.includes("undefined") ||
    src.trim() === ""
  ) {
    return (
      <div
        className={cn(
          "bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-500 text-xs p-4",
          fill ? "w-full h-full" : "w-full aspect-video",
          className
        )}
      >
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={cn("object-cover", className)}
      priority={priority}
      onError={(e) => {
        console.error("[SafeImage] Failed to load:", src);
        setError(true);
      }}
      {...props}
    />
  );
}