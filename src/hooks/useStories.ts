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
  // Use the same base URL as the rest of the app
  const env = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!env) return "https://uat.backend.reviai.ai";
  return env.replace(/\/+$/g, "");
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
    console.log("[useStories] Transforming posts to stories:", posts);
    const storyMap = new Map<string, Story>();

    posts.forEach((post) => {
      console.log("[useStories] Processing post:", {
        id: post.id,
        hasAuthor: !!post.author,
        authorId: post.author?.id,
        authorUsername: post.author?.username,
        hasImages: !!post.images?.length,
        hasMediaUrl: !!post.media_url,
        images: post.images,
        media_url: post.media_url,
      });

      // Handle posts that might have author_id, author_username, author_avatar instead of author object
      let authorId: string | undefined;
      let authorUsername: string | undefined;
      let authorAvatar: string | undefined;
      let authorFirstName: string | undefined;
      let authorLastName: string | undefined;

      if (post.author && post.author.id) {
        // Post has author object
        authorId = post.author.id;
        authorUsername = post.author.username;
        authorAvatar = post.author.avatar;
        authorFirstName = post.author.first_name;
        authorLastName = post.author.last_name;
      } else if ((post as any).author_id) {
        // Post has separate author fields
        authorId = (post as any).author_id;
        authorUsername = (post as any).author_username || (post as any).author_username;
        authorAvatar = (post as any).author_avatar;
        authorFirstName = (post as any).author_first_name;
        authorLastName = (post as any).author_last_name;
      }

      // Skip posts without valid author data
      if (!authorId) {
        console.log("[useStories] Skipping post - no author ID:", post.id);
        return;
      }
      
      const mediaUrl = post.images?.[0] || post.media_url || "";
      
      if (!mediaUrl) {
        console.log("[useStories] Skipping post - no media URL:", post.id);
        return;
      }

      const storyItem: StoryItem = {
        id: post.id,
        media_url: mediaUrl,
        media_type: mediaUrl.match(/\.(mp4|webm|mov)$/i) ? "video" : "image",
        created_at: post.created_at,
        is_viewed: post.is_viewed || false,
      };

      if (storyMap.has(authorId)) {
        const existingStory = storyMap.get(authorId)!;
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
        storyMap.set(authorId, {
          user_id: authorId,
          username: authorUsername || "Unknown",
          avatar: authorAvatar || "",
          first_name: authorFirstName,
          last_name: authorLastName,
          stories: [storyItem],
          has_unviewed: !storyItem.is_viewed,
          latest_story_time: post.created_at,
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

  // Fetch all available stories (posts with is_story=true)
  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = "/posts/?is_story=true";
      console.log("[useStories] Fetching stories from:", API_BASE_URL + url);
      const response = await axiosInstance.get<PostsResponse>(url);
      console.log("[useStories] API response:", {
        count: response.data.count,
        resultsCount: response.data.results?.length || 0,
        results: response.data.results,
      });
      const transformedStories = transformPostsToStories(
        response.data.results || []
      );
      console.log("[useStories] Setting stories:", transformedStories);
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
