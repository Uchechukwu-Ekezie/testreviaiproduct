"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Pause, Play, Volume2, VolumeX, MoreVertical } from "lucide-react";
import Image from "next/image";
import type { Story, StoryItem } from "@/hooks/useStories";

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  initialItemIndex?: number;
  currentUserId?: string;
  onClose: () => void;
  onStoryView: (storyId: string) => void;
  onDeleteStory?: (storyId: string) => void;
}

export default function StoryViewer({
  stories,
  initialStoryIndex,
  initialItemIndex = 0,
  currentUserId,
  onClose,
  onStoryView,
  onDeleteStory,
}: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [currentItemIndex, setCurrentItemIndex] = useState(initialItemIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  const currentStory = stories[currentStoryIndex];
  const currentItem = currentStory?.stories[currentItemIndex];
  const isVideo = currentItem?.media_type === "video";
  const isOwnStory = currentStory?.user_id === currentUserId;

  const duration = isVideo ? (currentItem?.duration || 15) * 1000 : 5000;

  const getDisplayName = (story: Story) => {
    if (story.first_name || story.last_name) {
      return `${story.first_name || ""} ${story.last_name || ""}`.trim();
    }
    return story.username;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const resetProgress = useCallback(() => {
    setProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, []);

  const goToNext = useCallback(() => {
    resetProgress();

    // Check if there's a next item in current story
    if (currentItemIndex < currentStory.stories.length - 1) {
      setCurrentItemIndex((prev) => prev + 1);
    }
    // Check if there's a next story
    else if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setCurrentItemIndex(0);
    }
    // End of all stories
    else {
      onClose();
    }
  }, [currentItemIndex, currentStory, currentStoryIndex, stories.length, onClose, resetProgress]);

  const goToPrevious = useCallback(() => {
    resetProgress();

    // If progress > 0, restart current story
    if (progress > 0) {
      setProgress(0);
    }
    // Go to previous item in current story
    else if (currentItemIndex > 0) {
      setCurrentItemIndex((prev) => prev - 1);
    }
    // Go to previous story
    else if (currentStoryIndex > 0) {
      const prevStory = stories[currentStoryIndex - 1];
      setCurrentStoryIndex((prev) => prev - 1);
      setCurrentItemIndex(prevStory.stories.length - 1);
    }
  }, [currentItemIndex, currentStoryIndex, stories, progress, resetProgress]);

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const third = rect.width / 3;

      if (x < third) {
        goToPrevious();
      } else if (x > third * 2) {
        goToNext();
      } else {
        setIsPaused((prev) => !prev);
      }
    },
    [goToNext, goToPrevious]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartXRef.current;
    const diffY = touchEndY - touchStartYRef.current;

    // Vertical swipe to close
    if (Math.abs(diffY) > 100 && Math.abs(diffY) > Math.abs(diffX)) {
      onClose();
    }
    // Horizontal swipe
    else if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    }
  };

  // Mark story as viewed
  useEffect(() => {
    if (currentItem && !currentItem.is_viewed) {
      onStoryView(currentItem.id);
    }
  }, [currentItem, onStoryView]);

  // Progress timer
  useEffect(() => {
    if (isPaused || !currentItem) return;

    resetProgress();

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 100 / (duration / 100);
        if (next >= 100) {
          goToNext();
          return 0;
        }
        return next;
      });
    }, 100);

    progressIntervalRef.current = interval;

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentItem, isPaused, duration, goToNext, resetProgress]);

  // Video handling
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.muted = isMuted;
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [isVideo, isPaused, isMuted]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrevious, onClose]);

  // Helper function to validate URLs
  const isValidUrl = (url: string | undefined | null): boolean => {
    if (!url || typeof url !== 'string' || url.trim() === '' || url === 'string') {
      return false;
    }
    try {
      // For relative URLs, check if they start with /
      if (url.startsWith('/')) {
        return true;
      }
      // For absolute URLs, validate with URL constructor
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (!currentStory || !currentItem) {
    return null;
  }

  // Validate media URL
  const mediaUrl = currentItem.media_url;
  const isValidMediaUrl = isValidUrl(mediaUrl);
  const avatarUrl = currentStory.avatar;
  const isValidAvatarUrl = isValidUrl(avatarUrl);

  if (!isValidMediaUrl) {
    console.error("Invalid media URL:", mediaUrl);
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
      {/* Background blur */}
      <div className="absolute inset-0 bg-black/95" />

      {/* Story Container */}
      <div
        className="relative w-full h-full max-w-[500px] mx-auto"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
          {currentStory.stories.map((_, index) => (
            <div key={index} className="flex-1 h-[2px] bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width:
                    index < currentItemIndex
                      ? "100%"
                      : index === currentItemIndex
                      ? `${progress}%`
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-4 mt-4">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 border-2 border-white">
              <AvatarImage src={isValidAvatarUrl ? avatarUrl : undefined} />
              <AvatarFallback className="bg-gray-700 text-white text-xs">
                {getDisplayName(currentStory)[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white text-sm font-semibold">
                {getDisplayName(currentStory)}
              </p>
              <p className="text-white/80 text-xs">
                {getTimeAgo(currentItem.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused((prev) => !prev);
              }}
              className="text-white p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>

            {isVideo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted((prev) => !prev);
                }}
                className="text-white p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            )}

            {isOwnStory && onDeleteStory && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu((prev) => !prev);
                  }}
                  className="text-white p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteStory(currentItem.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-white p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Content */}
        <div className="relative w-full h-full flex items-center justify-center">
          {isVideo ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="max-w-full max-h-full object-contain"
              playsInline
              loop={false}
              muted={isMuted}
              onEnded={goToNext}
            />
          ) : (
            <Image
              src={mediaUrl}
              alt="Story"
              fill
              className="object-contain"
              priority
              unoptimized={mediaUrl?.startsWith("http")}
              onError={(e) => {
                console.error("Failed to load story image:", mediaUrl);
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
          )}
        </div>

        {/* Caption */}
        {currentItem.caption && (
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
            <p className="text-white text-sm leading-relaxed break-words">
              {currentItem.caption}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
