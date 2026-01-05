"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import type { Story } from "@/hooks/useStories";

interface StoriesBarProps {
  stories: Story[];
  currentUserId?: string;
  currentUserAvatar?: string | null;
  currentUserName?: string;
  onStoryClick: (userId: string, storyIndex: number) => void;
  onCreateStory: () => void;
  isLoading?: boolean;
}

export default function StoriesBar({
  stories,
  currentUserId,
  currentUserAvatar,
  currentUserName,
  onStoryClick,
  onCreateStory,
  isLoading = false,
}: StoriesBarProps) {
  console.log("[StoriesBar] Rendering with:", {
    storiesCount: stories.length,
    stories,
    currentUserId,
    isLoading,
  });
  
  // Check if current user has stories
  const currentUserStory = stories.find(
    (story) => story.user_id === currentUserId
  );
  
  const otherUsersStories = stories.filter(
    (story) => story.user_id !== currentUserId
  );
  
  console.log("[StoriesBar] Filtered stories:", {
    currentUserStory: !!currentUserStory,
    otherUsersStoriesCount: otherUsersStories.length,
    otherUsersStories,
  });

  const getDisplayName = (story: Story) => {
    if (story.first_name || story.last_name) {
      const fullName = `${story.first_name || ""} ${story.last_name || ""}`.trim();
      return fullName;
    }
    return story.username;
  };

  if (isLoading) {
    return (
      <div className="w-full bg-background border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gray-800 animate-pulse" />
                <div className="w-14 h-3 bg-gray-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background border-b border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {/* Create Story Button - Always visible */}
          <button
            onClick={onCreateStory}
            className="flex flex-col items-center gap-2 flex-shrink-0 group hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <div
                className={`w-16 h-16 rounded-full ${
                  currentUserStory
                    ? "p-[3px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500"
                    : "bg-gray-800"
                }`}
              >
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={currentUserAvatar || undefined} />
                    <AvatarFallback className="bg-gray-700 text-white text-sm">
                      {currentUserName?.[0]?.toUpperCase() || "Y"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              {/* Always show + icon for creating new story */}
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-background">
                <Plus className="w-3 h-3 text-white" />
              </div>
            </div>
            <span className="text-xs text-gray-300 max-w-[64px] truncate">
              {currentUserStory ? "Add story" : "Create"}
            </span>
          </button>

          {/* Current User's Story - Show if they have one */}
          {currentUserStory && (
            <button
              onClick={() => {
                // Find the index of current user's story in the full stories array
                const storyIndex = stories.findIndex(
                  (s) => s.user_id === currentUserId
                );
                onStoryClick(currentUserStory.user_id, storyIndex);
              }}
              className="flex flex-col items-center gap-2 flex-shrink-0 group hover:opacity-80 transition-opacity"
            >
              <div
                className={`w-16 h-16 rounded-full p-[3px] ${
                  currentUserStory.has_unviewed
                    ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500"
                    : "bg-gray-700"
                }`}
              >
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={currentUserStory.avatar || currentUserAvatar || undefined} />
                    <AvatarFallback className="bg-gray-700 text-white text-sm">
                      {getDisplayName(currentUserStory)[0]?.toUpperCase() || "Y"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-xs text-gray-300 max-w-[64px] truncate">
                Your story
              </span>
            </button>
          )}

          {/* Other Users' Stories */}
          {otherUsersStories.length === 0 && !isLoading && !currentUserStory && (
            <div className="text-xs text-gray-500 px-2 flex items-center">No stories available</div>
          )}
          {otherUsersStories.map((story, index) => {
            // Adjust index to account for current user's story if it exists
            const adjustedIndex = currentUserStory ? index + 1 : index;
            return (
              <button
                key={story.user_id}
                onClick={() => onStoryClick(story.user_id, adjustedIndex)}
                className="flex flex-col items-center gap-2 flex-shrink-0 group hover:opacity-80 transition-opacity"
              >
                <div
                  className={`w-16 h-16 rounded-full p-[3px] ${
                    story.has_unviewed
                      ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500"
                      : "bg-gray-700"
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={story.avatar} />
                      <AvatarFallback className="bg-gray-700 text-white text-sm">
                        {getDisplayName(story)[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <span className="text-xs text-gray-300 max-w-[64px] truncate">
                  {getDisplayName(story)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
