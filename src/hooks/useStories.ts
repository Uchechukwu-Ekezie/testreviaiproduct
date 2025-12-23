import { useState, useCallback, useEffect } from "react";
import axios, { AxiosError } from "axios";

export interface StoryItem {
  id: string;
  media_url: string;
  media_type: "image" | "video";
  created_at: string;
  duration?: number;
  is_viewed?: boolean;
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

interface Post {
  id: string;
  author: {
    id: string;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    avatar: string;
  };
  media_url?: string;
  images?: string[];
  created_at: string;
  is_story?: boolean;
  is_viewed?: boolean;
}

interface PostsResponse {
  results: Post[];
  count: number;
  next: string | null;
  previous: string | null;
}

interface StoryError {
  detail?: string;
  error?: string;
  non_field_errors?: string[];
}

const API_BASE_URL = (() => {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (!env) return "http://localhost:8000";
  return env.replace(/\/+$/g, "") + "/";
})();

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configure axios instance with auth token
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Add auth token to requests
  axiosInstance.interceptors.request.use(
    async (config) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Transform posts to stories format
  const transformPostsToStories = (posts: Post[]): Story[] => {
    const storyMap = new Map<string, Story>();

    posts.forEach((post) => {
      // Skip posts without valid author data
      if (!post.author || !post.author.id) return;
      
      const userId = post.author.id;
      const mediaUrl = post.images?.[0] || post.media_url || "";
      
      if (!mediaUrl) return;

      const storyItem: StoryItem = {
        id: post.id,
        media_url: mediaUrl,
        media_type: mediaUrl.match(/\.(mp4|webm|mov)$/i) ? "video" : "image",
        created_at: post.created_at,
        is_viewed: post.is_viewed || false,
      };

      if (storyMap.has(userId)) {
        const existingStory = storyMap.get(userId)!;
        existingStory.stories.push(storyItem);
        existingStory.has_unviewed =
          existingStory.has_unviewed || !storyItem.is_viewed;
        // Update latest time if this story is newer
        if (
          new Date(post.created_at) >
          new Date(existingStory.latest_story_time)
        ) {
          existingStory.latest_story_time = post.created_at;
        }
      } else {
        storyMap.set(userId, {
          user_id: userId,
          username: post.author.username,
          avatar: post.author.avatar,
          first_name: post.author.first_name,
          last_name: post.author.last_name,
          stories: [storyItem],
          has_unviewed: !storyItem.is_viewed,
          latest_story_time: post.created_at,
        });
      }
    });

    // Sort stories by latest story time
    return Array.from(storyMap.values()).sort(
      (a, b) =>
        new Date(b.latest_story_time).getTime() -
        new Date(a.latest_story_time).getTime()
    );
  };

  // Fetch all available stories (posts with is_story=true)
  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get<PostsResponse>(
        "/posts/?is_story=true"
      );
      const transformedStories = transformPostsToStories(
        response.data.results || []
      );
      setStories(transformedStories);
      return transformedStories;
    } catch (err) {
      const error = err as AxiosError<StoryError>;
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
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
      await axiosInstance.post(`/posts/${storyId}/view/`);

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

  // Create a new story (post with is_story=true)
  const createStory = useCallback(
    async (mediaUrl: string, mediaType: "image" | "video") => {
      setError(null);

      try {
        const postData: any = {
          caption: "",
          is_story: true,
        };

        if (mediaType === "image") {
          postData.images = [mediaUrl];
        } else {
          postData.media_url = mediaUrl;
        }

        const response = await axiosInstance.post<Post>(
          "/posts/",
          postData
        );

        // Refresh stories after creation
        await fetchStories();
        return response.data;
      } catch (err) {
        const error = err as AxiosError<StoryError>;
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.error ||
          error.message ||
          "Failed to create story";
        console.error("[useStories] Create error:", errorMsg);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [fetchStories, axiosInstance]
  );

  // Delete a story
  const deleteStory = useCallback(async (storyId: string) => {
    setError(null);

    try {
      await axiosInstance.delete(`/posts/${storyId}/`);

      // Remove from local state
      setStories((prev) =>
        prev
          .map((story) => ({
            ...story,
            stories: story.stories.filter((item) => item.id !== storyId),
          }))
          .filter((story) => story.stories.length > 0)
      );
    } catch (err) {
      const error = err as AxiosError<StoryError>;
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
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
