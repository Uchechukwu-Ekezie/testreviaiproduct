import { useState, useCallback, useEffect } from "react";
import { storiesAPI, type StoryResponse, type StoryCreatePayload } from "@/lib/api/stories.api";

export interface StoryItem {
  id: string;
  media_url: string;
  media_type: "image" | "video";
  created_at: string;
  duration?: number;
  is_viewed?: boolean;
  caption?: string;
}

export interface Story {
  user_id: string;
  username: string;
  avatar: string;
  first_name?: string;
  last_name?: string;
  stories: StoryItem[];
  has_unviewed: boolean;
  latest_story_time: string;
}

interface StoryError {
  detail?: string;
  error?: string;
  non_field_errors?: string[];
}

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform API stories to internal format
  const transformStories = (apiStories: StoryResponse[]): Story[] => {
    console.log("[useStories] Transforming API stories:", apiStories);
    const storyMap = new Map<string, Story>();

    apiStories.forEach((apiStory) => {
      console.log("[useStories] Processing story:", {
        id: apiStory.id,
        author_id: apiStory.author_id,
        media_url: apiStory.media_url,
        author_username: apiStory.author_username,
        is_viewed: apiStory.is_viewed,
      });

      const userId = apiStory.author_id;
      if (!userId) {
        console.log("[useStories] Skipping story - no author_id:", apiStory.id);
        return;
      }

      const mediaUrl = apiStory.media_url || "";
      // Skip if media_url is empty (but allow "string" placeholder for testing)
      if (!mediaUrl || mediaUrl.trim() === "") {
        console.log("[useStories] Skipping story - empty media_url:", apiStory.id);
        return;
      }
      
      // Log if media_url is "string" placeholder
      if (mediaUrl === "string") {
        console.warn("[useStories] Story has placeholder media_url:", apiStory.id, "- will show in bar but may not display in viewer");
      }

      const storyItem: StoryItem = {
        id: apiStory.id,
        media_url: mediaUrl,
        media_type: mediaUrl.match(/\.(mp4|webm|mov)$/i) ? "video" : "image",
        created_at: apiStory.created_at,
        is_viewed: apiStory.is_viewed || false,
        caption: apiStory.caption,
      };

      if (storyMap.has(userId)) {
        const existingStory = storyMap.get(userId)!;
        existingStory.stories.push(storyItem);
        existingStory.has_unviewed =
          existingStory.has_unviewed || !storyItem.is_viewed;
        // Update latest time if this story is newer
        if (
          new Date(apiStory.created_at) >
          new Date(existingStory.latest_story_time)
        ) {
          existingStory.latest_story_time = apiStory.created_at;
        }
      } else {
        storyMap.set(userId, {
          user_id: userId,
          username: apiStory.author_username || "Unknown",
          avatar: apiStory.author_avatar || "",
          first_name: apiStory.author_first_name,
          last_name: apiStory.author_last_name,
          stories: [storyItem],
          has_unviewed: !storyItem.is_viewed,
          latest_story_time: apiStory.created_at,
        });
      }
    });

    // Sort stories by latest story time
    const transformedStories = Array.from(storyMap.values()).sort(
      (a, b) =>
        new Date(b.latest_story_time).getTime() -
        new Date(a.latest_story_time).getTime()
    );
    console.log("[useStories] Transformed stories:", transformedStories);
    return transformedStories;
  };

  // Fetch all available stories
  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("[useStories] Fetching stories from /stories/");
      const apiStories = await storiesAPI.getAll();
      console.log("[useStories] API response:", {
        count: apiStories.length,
        stories: apiStories,
      });
      const transformedStories = transformStories(apiStories);
      console.log("[useStories] Setting stories:", transformedStories);
      setStories(transformedStories);
      return transformedStories;
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to fetch stories";
      console.error("[useStories] Fetch error:", errorMsg);
      setError(errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark a story as viewed
  const viewStory = useCallback(async (storyId: string) => {
    try {
      await storiesAPI.viewStory(storyId);

      // Update local state
      setStories((prev) =>
        prev.map((story) => ({
          ...story,
          stories: story.stories.map((item) =>
            item.id === storyId ? { ...item, is_viewed: true } : item
          ),
          has_unviewed: story.stories.some(
            (item) => item.id !== storyId && !item.is_viewed
          ),
        }))
      );
    } catch (err) {
      console.error("[useStories] View error:", err);
    }
  }, []);

  // Create a new story
  const createStory = useCallback(
    async (mediaUrl: string, mediaType: "image" | "video", caption?: string) => {
      setError(null);

      try {
        const storyData: StoryCreatePayload = {
          media_url: mediaUrl,
          caption: caption || "",
        };

        const response = await storiesAPI.create(storyData);

        // Refresh stories after creation
        await fetchStories();
        return response;
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.detail ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to create story";
        console.error("[useStories] Create error:", errorMsg);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [fetchStories]
  );

  // Delete a story
  const deleteStory = useCallback(async (storyId: string) => {
    setError(null);

    try {
      await storiesAPI.delete(storyId);

      // Remove from local state
      setStories((prev) =>
        prev
          .map((story) => ({
            ...story,
            stories: story.stories.filter((item) => item.id !== storyId),
          }))
          .filter((story) => story.stories.length > 0)
      );
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to delete story";
      console.error("[useStories] Delete error:", errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  return {
    stories,
    isLoading,
    error,
    fetchStories,
    viewStory,
    createStory,
    deleteStory,
  };
}
