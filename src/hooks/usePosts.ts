"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import axios, { AxiosError } from "axios";
import { useAuth } from "@/contexts/auth-context";
import type { User } from "@/contexts/auth-context";
import { postsCache } from "@/lib/cache";

// Interfaces remain the same
export interface Post {
  id: string;
  caption: string;
  content?: string;
  images?: string[];
  media_url?: string;
  author: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    first_name?: string;
    last_name?: string;
    user_type?: string;
    verification_status?: "none" | "pending" | "verified" | "rejected";
    followers_count?: number;
    following_count?: number;
    is_following?: boolean;
  };
  // Optional post type: 'property' | 'review' | 'question' | etc.
  type?: string;
  like_count: number;
  view_count: number;
  comment_count: number;
  is_liked?: boolean;
  created_at: string;
  updated_at: string;
  // Location fields
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_label?: string | null;
  /** Client-only flag to indicate the post is being created optimistically */
  isPending?: boolean;
}

interface PostResponse {
  results: Post[];
  next: string | null;
  previous: string | null;
}

export interface Comment {
  id: string;
  post: string;
  author: {
    id: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar?: string;
    type?: string;
  };
  content: string;
  parent?: string | null;
  like_count: number;
  reply_count: number;
  is_liked?: boolean;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
  isPending?: boolean; // For optimistic updates
}

interface CommentResponse {
  results: Comment[];
  next: string | null;
  previous: string | null;
}

interface PostError {
  error?: string;
  detail?: string;
  details?: any;
  non_field_errors?: string[];
  [key: string]: any;
}

const API_BASE_URL = (() => {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (!env) return "http://localhost:8000"; // local dev default
  return env.replace(/\/+$/g, "") + "/";
})();

export function usePosts() {
  const { user, isAuthenticated, isLoading, refreshAccessToken } = useAuth();
  
  // Initialize posts from sessionStorage if available
  const [posts, setPosts] = useState<Post[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('cachedPosts');
      const cacheTime = sessionStorage.getItem('cachedPostsTime');
      if (cached && cacheTime) {
        const timeSinceCache = Date.now() - parseInt(cacheTime, 10);
        // Only use cache if less than 5 minutes old
        if (timeSinceCache < 5 * 60 * 1000) {
          console.log('[usePosts] Restoring posts from cache:', timeSinceCache / 1000, 'seconds old');
          return JSON.parse(cached);
        }
      }
    }
    return [];
  });
  
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('cachedNextPage');
    }
    return null;
  });
  const [commentsCache, setCommentsCache] = useState<
    Record<string, CommentResponse>
  >({});

  // Add ref to track if initial fetch has been done
  const hasInitialFetched = useRef(false);
  // Add cache timestamp to track when posts were last fetched
  const getInitialCacheTime = () => {
    if (typeof window !== 'undefined') {
      const cacheTime = sessionStorage.getItem('cachedPostsTime');
      return cacheTime ? parseInt(cacheTime, 10) : 0;
    }
    return 0;
  };
  const lastFetchTime = useRef<number>(getInitialCacheTime());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

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
      console.log(`[usePosts] ${config.method?.toUpperCase()} ${config.url}`, {
        hasAuth: !!token,
        data: config.data,
      });
      return config;
    },
    (error) => {
      console.error("[usePosts] Request interceptor error:", error);
      return Promise.reject(error);
    }
  );

  // Handle token refresh on 401 errors
  axiosInstance.interceptors.response.use(
    (response) => {
      console.log(`[usePosts] Response ${response.status}:`, response.data);
      return response;
    },
    async (error: AxiosError) => {
      console.error("[usePosts] Response error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      const originalRequest = error.config;
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest.url?.includes("/auth/")
      ) {
        console.log("[usePosts] Attempting token refresh...");
        try {
          const newToken = await refreshAccessToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            console.log("[usePosts] Token refreshed, retrying request");
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          console.error("[usePosts] Token refresh failed:", refreshError);
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("tokenData");
          localStorage.removeItem("authUser");
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
  );

  // Fetch a single post by ID
  const fetchPostById = useCallback(
    async (postId: string): Promise<Post | null> => {
      console.log("[usePosts] Fetching post by ID:", postId);
      setError(null);

      try {
        // Check cache first
        const cacheKey = `post_${postId}`;
        const cached = postsCache.get<Post>(cacheKey);
        if (cached) {
          console.log("✅ Post loaded from cache:", postId);
          // Update posts array if needed
          setPosts((prev) => {
            const existingIndex = prev.findIndex((p) => p.id === postId);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = cached;
              return updated;
            }
            return [cached, ...prev];
          });
          return cached;
        }

        console.log("🔄 Fetching post from API:", postId);
        const response = await axiosInstance.get<Post>(`posts/${postId}/`);
        console.log("[usePosts] Post fetched successfully:", response.data);

        // Cache for 2 minutes
        postsCache.set(cacheKey, response.data, 120);

        // Update posts array if post exists
        setPosts((prev) => {
          const existingIndex = prev.findIndex((p) => p.id === postId);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = response.data;
            return updated;
          }
          return [response.data, ...prev];
        });

        return response.data;
      } catch (err) {
        const error = err as AxiosError<PostError>;
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.error ||
          error.response?.data?.non_field_errors?.[0] ||
          error.message ||
          "Failed to fetch post";
        console.error(
          "[usePosts] Fetch post by ID error:",
          errorMsg,
          error.response?.data
        );
        setError(errorMsg);
        return null;
      }
    },
    []
  );

  // Fetch posts with pagination and deduplication + caching
  const fetchPosts = useCallback(
    async (url: string = `${API_BASE_URL}posts/`, reset: boolean = false) => {
      // Check if this is a pagination request (contains cursor)
      const isPagination = url.includes('cursor=');
      
      // Check cache first - if data is fresh (less than 5 min old), don't refetch
      // BUT always allow pagination requests through
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime.current;

      if (!reset && !isPagination && posts.length > 0 && timeSinceLastFetch < CACHE_DURATION) {
        console.log(
          "[usePosts] Using cached posts, last fetch:",
          timeSinceLastFetch / 1000,
          "seconds ago"
        );
        return;
      }

      if (isLoading || isLoadingPosts) {
        console.log("[usePosts] Skipping fetch - auth or posts still loading");
        return;
      }

      console.log("[usePosts] Fetching posts from:", url, isPagination ? "(pagination)" : "(initial)");
      setIsLoadingPosts(true);
      setError(null);

      try {
        const response = await axiosInstance.get<PostResponse>(url);
        console.log("[usePosts] Posts fetched successfully:", {
          count: response.data.results.length,
          posts: response.data.results,
        });

        // Update last fetch time only for initial fetches, not pagination
        if (!isPagination) {
          lastFetchTime.current = now;
        }

        // Transform posts to include author object from author_id, author_username, author_avatar
        const transformedPosts = response.data.results.map((post: any) => {
          // If post already has author object, use it
          if (post.author && typeof post.author === 'object') {
            return post;
          }
          
          // Otherwise, create author object from separate fields
          return {
            ...post,
            author: {
              id: post.author_id || '',
              username: post.author_username || '',
              email: post.author_username || '', // Use username as fallback for email
              avatar: post.author_avatar || undefined,
              first_name: post.author_first_name || undefined,
              last_name: post.author_last_name || undefined,
              user_type: post.author_user_type || undefined,
            }
          };
        });

        // Deduplicate posts based on ID
        setPosts((prev) => {
          const newPosts = transformedPosts.filter(
            (newPost) =>
              !prev.some((existingPost) => existingPost.id === newPost.id)
          );
          
          if (reset) {
            // When resetting, preserve any individually fetched posts that aren't in the new results
            const preservedPosts = prev.filter(
              (prevPost) => !transformedPosts.some((newPost) => newPost.id === prevPost.id)
            );
            
            if (preservedPosts.length > 0) {
              console.log(`[usePosts] Preserving ${preservedPosts.length} individually fetched posts during reset:`, 
                preservedPosts.map(p => p.id));
            }
            
            // Add preserved posts at the beginning to maintain their position
            return [...preservedPosts, ...newPosts];
          }
          
          return [...prev, ...newPosts];
        });
        setNextPage(response.data.next);
      } catch (err) {
        const error = err as AxiosError<PostError>;
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.error ||
          error.response?.data?.non_field_errors?.[0] ||
          error.message ||
          "Failed to fetch posts";
        console.error(
          "[usePosts] Fetch posts error:",
          errorMsg,
          error.response?.data
        );
        setError(errorMsg);
      } finally {
        setIsLoadingPosts(false);
      }
    },
    [isLoading, isLoadingPosts]
  );

  // Create a new post
  const createPost = useCallback(
    async (
      caption: string,
      images?: string[],
      mediaUrl?: string | null,
      location?: {
        city?: string;
        state?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
        location_label?: string;
      }
    ) => {
      console.log("[usePosts] createPost called:", {
        captionLength: caption.length,
        imagesCount: images?.length || 0,
        hasVideo: !!mediaUrl,
        isAuthenticated,
      });

      if (!isAuthenticated) {
        const msg = "You must be logged in to create a post";
        console.error("[usePosts]", msg);
        setError(msg);
        return false;
      }

      setError(null);

      try {
        const postData: any = {
          caption: caption.trim(),
        };

        if (images && images.length > 0) {
          postData.images = images;
        }

        if (mediaUrl) {
          postData.media_url = mediaUrl;
        }

        // Add location data if provided
        if (location) {
          if (location.city) postData.city = location.city;
          if (location.state) postData.state = location.state;
          if (location.country) postData.country = location.country;
          if (location.latitude !== undefined) postData.latitude = location.latitude;
          if (location.longitude !== undefined) postData.longitude = location.longitude;
          if (location.location_label) postData.location_label = location.location_label;
        }

        console.log("[usePosts] Sending postData to POST /posts/:", postData);

        const response = await axiosInstance.post<Post>("posts/", postData);

        console.log("[usePosts] Post created successfully:", response.data);

        // Update cache timestamp since we have new data
        lastFetchTime.current = Date.now();

        setPosts((prev) => [
          response.data,
          ...prev.filter((post) => post.id !== response.data.id),
        ]);
        return true;
      } catch (err) {
        const error = err as AxiosError<PostError>;
        console.error("[usePosts] Create post error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });

        const errorMsg =
          error.response?.data?.error ||
          error.response?.data?.detail ||
          error.response?.data?.non_field_errors?.[0] ||
          (error.response?.data?.details
            ? JSON.stringify(error.response.data.details)
            : "") ||
          error.message ||
          "Failed to create post";

        console.error("[usePosts] Setting error:", errorMsg);
        setError(errorMsg);
        return false;
      }
    },
    [isAuthenticated]
  );

  // Delete a post
  const deletePost = useCallback(
    async (postId: string) => {
      console.log("[usePosts] Deleting post:", postId);

      if (!isAuthenticated) {
        const msg = "You must be logged in to delete a post";
        console.error("[usePosts]", msg);
        setError(msg);
        return false;
      }

      setError(null);
      try {
        await axiosInstance.delete(`posts/${postId}/`);
        console.log("[usePosts] Post deleted successfully:", postId);
        setPosts((prev) => prev.filter((post) => post.id !== postId));
        return true;
      } catch (err) {
        const error = err as AxiosError<PostError>;
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.error ||
          error.response?.data?.non_field_errors?.[0] ||
          error.message ||
          "Failed to delete post";
        console.error(
          "[usePosts] Delete post error:",
          errorMsg,
          error.response?.data
        );
        setError(errorMsg);
        return false;
      }
    },
    [isAuthenticated]
  );

  // Like or unlike a post
  const likePost = useCallback(
    async (postId: string, action: "like" | "unlike") => {
      console.log("[usePosts] Like/unlike post:", { postId, action });

      if (!isAuthenticated) {
        const msg = "You must be logged in to like a post";
        console.error("[usePosts]", msg);
        setError(msg);
        return false;
      }

      setError(null);
      try {
        const response = await axiosInstance.post<{
          id: string;
          like_count: number;
          action: string;
        }>(`posts/${postId}/like/`, { action });
        console.log("[usePosts] Post liked/unliked:", response.data);
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  like_count: response.data.like_count,
                  is_liked: action === "like",
                }
              : post
          )
        );
        return true;
      } catch (err) {
        const error = err as AxiosError<PostError>;
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.error ||
          error.response?.data?.non_field_errors?.[0] ||
          error.message ||
          "Failed to like post";
        console.error(
          "[usePosts] Like post error:",
          errorMsg,
          error.response?.data
        );
        setError(errorMsg);
        return false;
      }
    },
    [isAuthenticated]
  );

  // Register a post view
  const viewPost = useCallback(async (postId: string) => {
    console.log("[usePosts] Registering view for post:", postId);
    setError(null);

    try {
      const response = await axiosInstance.post<{
        id: string;
        view_count: number;
      }>(`posts/${postId}/view/`, { viewed: true });
      console.log("[usePosts] View registered:", response.data);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, view_count: response.data.view_count }
            : post
        )
      );
      return true;
    } catch (err) {
      const error = err as AxiosError<PostError>;
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.response?.data?.non_field_errors?.[0] ||
        error.message ||
        "Failed to register view";
      console.error(
        "[usePosts] Register view error:",
        errorMsg,
        error.response?.data
      );
      setError(errorMsg);
      return false;
    }
  }, []);

  // Fetch comments for a post
  const fetchComments = useCallback(
    async (postId: string, pageUrl: string | null = null) => {
      console.log("[usePosts] Fetching comments for post:", postId);
      setError(null);

      try {
        const url = pageUrl || `posts/${postId}/comments/`;
        const response = await axiosInstance.get<CommentResponse>(url);
        console.log(
          "[usePosts] Comments fetched:",
          response.data.results.length
        );
        
        // Transform comments to include author object from author_id, author_username, author_avatar
        const transformedComments = response.data.results.map((comment: any) => {
          // If comment already has author object, use it
          if (comment.author && typeof comment.author === 'object') {
            return comment;
          }
          
          // Otherwise, create author object from separate fields
          return {
            ...comment,
            author: {
              id: comment.author_id || '',
              username: comment.author_username || '',
              email: comment.author_username || '',
              avatar: comment.author_avatar || undefined,
              first_name: comment.author_first_name || undefined,
              last_name: comment.author_last_name || undefined,
              type: comment.author_user_type || undefined,
            }
          };
        });
        
        return {
          ...response.data,
          results: transformedComments
        };
      } catch (err) {
        const error = err as AxiosError<PostError>;
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.error ||
          error.response?.data?.non_field_errors?.[0] ||
          error.message ||
          "Failed to fetch comments";
        console.error(
          "[usePosts] Fetch comments error:",
          errorMsg,
          error.response?.data
        );
        setError(errorMsg);
        return { results: [], next: null, previous: null };
      }
    },
    []
  );

  // Create a comment
  const createComment = useCallback(
    async (postId: string, content: string) => {
      console.log("[usePosts] Creating comment on post:", postId);

      if (!isAuthenticated) {
        const msg = "You must be logged in to comment";
        console.error("[usePosts]", msg);
        setError(msg);
        return null;
      }

      setError(null);
      try {
        const response = await axiosInstance.post<Comment>(
          `posts/${postId}/comments/`,
          { content }
        );
        console.log("[usePosts] Comment created:", response.data);
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, comment_count: post.comment_count + 1 }
              : post
          )
        );
        return response.data;
      } catch (err) {
        const error = err as AxiosError<PostError>;
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.error ||
          error.response?.data?.non_field_errors?.[0] ||
          error.message ||
          "Failed to create comment";
        console.error(
          "[usePosts] Create comment error:",
          errorMsg,
          error.response?.data
        );
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [isAuthenticated]
  );

  // Like or unlike a comment
  const likeComment = useCallback(
    async (commentId: string, action: "like" | "unlike") => {
      console.log("[usePosts] Like/unlike comment:", { commentId, action });

      if (!isAuthenticated) {
        const msg = "You must be logged in to like a comment";
        console.error("[usePosts]", msg);
        setError(msg);
        return false;
      }

      setError(null);
      try {
        const response = await axiosInstance.post<{
          id: string;
          like_count: number;
          action: string;
        }>(`comments/${commentId}/like/`, { action });
        console.log("[usePosts] Comment liked/unliked:", response.data);
        return response.data;
      } catch (err) {
        const error = err as AxiosError<PostError>;
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.error ||
          error.response?.data?.non_field_errors?.[0] ||
          error.message ||
          "Failed to like comment";
        console.error(
          "[usePosts] Like comment error:",
          errorMsg,
          error.response?.data
        );
        setError(errorMsg);
        return false;
      }
    },
    [isAuthenticated]
  );

  // Reply to a comment
  const replyToComment = useCallback(
    async (commentId: string, content: string) => {
      console.log("[usePosts] Replying to comment:", commentId);

      if (!isAuthenticated) {
        const msg = "You must be logged in to reply";
        console.error("[usePosts]", msg);
        setError(msg);
        return null;
      }

      setError(null);
      try {
        const response = await axiosInstance.post<Comment>(
          `comments/${commentId}/reply/`,
          { content }
        );
        console.log("[usePosts] Reply created:", response.data);
        return response.data;
      } catch (err) {
        const error = err as AxiosError<PostError>;
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.error ||
          error.response?.data?.non_field_errors?.[0] ||
          error.message ||
          "Failed to reply to comment";
        console.error(
          "[usePosts] Reply error:",
          errorMsg,
          error.response?.data
        );
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [isAuthenticated]
  );

  // Delete a comment
  const deleteComment = useCallback(
    async (commentId: string) => {
      console.log("[usePosts] Deleting comment:", commentId);

      if (!isAuthenticated) {
        const msg = "You must be logged in to delete a comment";
        console.error("[usePosts]", msg);
        setError(msg);
        return false;
      }

      setError(null);
      try {
        await axiosInstance.delete(`comments/${commentId}/delete/`);
        console.log("[usePosts] Comment deleted successfully");
        return true;
      } catch (err) {
        const error = err as AxiosError<PostError>;
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.error ||
          error.response?.data?.non_field_errors?.[0] ||
          error.message ||
          "Failed to delete comment";
        console.error(
          "[usePosts] Delete comment error:",
          errorMsg,
          error.response?.data
        );
        setError(errorMsg);
        return false;
      }
    },
    [isAuthenticated]
  );

  // Fetch posts by location
  const fetchPostsByLocation = useCallback(
    async (params: {
      city?: string;
      state?: string;
      latitude?: number;
      longitude?: number;
      radius?: number;
    }) => {
      try {
        setIsLoadingPosts(true);
        setError(null);

        const queryParams = new URLSearchParams();
        if (params.city) queryParams.append("city", params.city);
        if (params.state) queryParams.append("state", params.state);
        if (params.latitude !== undefined)
          queryParams.append("latitude", params.latitude.toString());
        if (params.longitude !== undefined)
          queryParams.append("longitude", params.longitude.toString());
        if (params.radius)
          queryParams.append("radius", params.radius.toString());

        const response = await axiosInstance.get<PostResponse>(
          `posts/by-location/?${queryParams.toString()}`
        );

        if (response.data.results) {
          setPosts(response.data.results);
          setNextPage(response.data.next);
        }

        return response.data.results || [];
      } catch (err: unknown) {
        const errorMsg = "Failed to fetch posts by location";
        console.error(errorMsg, err);
        setError(errorMsg);
        return [];
      } finally {
        setIsLoadingPosts(false);
      }
    },
    []
  );

  // Load more posts
  const loadMorePosts = useCallback(async () => {
    if (nextPage && !isLoadingPosts) {
      console.log("[usePosts] Loading more posts from:", nextPage);
      await fetchPosts(nextPage, false);
    }
  }, [nextPage, isLoadingPosts, fetchPosts]);

  // Save posts to sessionStorage whenever they change
  useEffect(() => {
    if (posts.length > 0 && typeof window !== 'undefined') {
      sessionStorage.setItem('cachedPosts', JSON.stringify(posts));
      sessionStorage.setItem('cachedPostsTime', lastFetchTime.current.toString());
      if (nextPage) {
        sessionStorage.setItem('cachedNextPage', nextPage);
      }
      // console.log('[usePosts] Saved', posts.length, 'posts to cache');
    }
  }, [posts, nextPage]);

  // Initial fetch of posts - FIXED: Only runs once, skip if loaded from cache
  useEffect(() => {
    if (
      !isLoading &&
      !hasInitialFetched.current &&
      posts.length === 0 &&
      !isLoadingPosts
    ) {
      console.log("[usePosts] Initial posts fetch");
      hasInitialFetched.current = true;
      fetchPosts(`${API_BASE_URL}posts/`, true);
    } else if (posts.length > 0 && !hasInitialFetched.current) {
      // Posts were loaded from cache
      console.log("[usePosts] Posts loaded from cache, skipping initial fetch");
      hasInitialFetched.current = true;
    }
  }, [isLoading, posts.length]); // Added posts.length to detect cache restoration

  // Force refresh posts (bypass cache)
  const refreshPosts = useCallback(() => {
    console.log("[usePosts] Force refreshing posts");
    lastFetchTime.current = 0; // Reset cache timestamp
    hasInitialFetched.current = false;
    fetchPosts(`${API_BASE_URL}posts/`, true);
  }, [fetchPosts]);

  return {
    posts,
    isLoading: isLoadingPosts,
    error,
    fetchPosts,
    fetchPostById,
    fetchPostsByLocation,
    createPost,
    deletePost,
    likePost,
    viewPost,
    fetchComments,
    createComment,
    likeComment,
    replyToComment,
    deleteComment,
    loadMorePosts,
    refreshPosts, // Add refreshPosts to return
    hasMore: !!nextPage,
    user: user as User | null,
    isAuthenticated,
    commentsCache,
  };
}
