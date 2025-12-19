"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-context";
import { postAPI } from "@/lib/api";
import type { Post, Comment } from "@/lib/api/types";
import { ApiAxiosError } from "@/lib/api/types";
import { setAuthToken, clearAuthToken } from "@/lib/api/utils";
import axios from "axios";

// Define the shape of the Posts context
interface PostsContextType {
  posts: Post[];
  isLoading: boolean;
  fetchPosts: () => Promise<void>;
  fetchPost: (postId: string) => Promise<Post | null>;
  createPost: (postData: {
    title: string;
    content: string;
    images?: string[];
  }) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;
  likePost: (postId: string, action: "like" | "unlike") => Promise<boolean>;
  registerView: (postId: string) => Promise<boolean>;
  fetchComments: (postId: string, page?: number) => Promise<Comment[]>;
  createComment: (
    postId: string,
    content: string,
    parentId?: string
  ) => Promise<boolean>;
  likeComment: (commentId: string, action: "like" | "unlike") => Promise<boolean>;
  deleteComment: (commentId: string) => Promise<boolean>;
}

// Create the Posts context with default values
const PostsContext = createContext<PostsContextType>({
  posts: [],
  isLoading: false,
  fetchPosts: async () => {},
  fetchPost: async () => null,
  createPost: async () => false,
  deletePost: async () => false,
  likePost: async () => false,
  registerView: async () => false,
  fetchComments: async () => [],
  createComment: async () => false,
  likeComment: async () => false,
  deleteComment: async () => false,
});

// Define props for the Posts provider
interface PostsProviderProps {
  children: ReactNode;
}

// Posts provider component
export function PostsProvider({ children }: PostsProviderProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, refreshAccessToken, user, logout } = useAuth();

// posts-context.tsx
const withAuth = async <T,>(
  apiCall: () => Promise<T>,
  retry: boolean = true
): Promise<T | null> => {
  console.log("withAuth: isAuthenticated =", isAuthenticated); // Debug
  if (!isAuthenticated) {
    console.error("withAuth: User is not authenticated");
    throw new Error("User must be authenticated to perform this action");
  }

  try {
    console.log("withAuth: Attempting API call"); // Debug
    const result = await apiCall();
    console.log("withAuth: API call successful", result); // Debug
    return result;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("withAuth: Axios error", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.status === 401 && retry && isAuthenticated) {
        console.log("withAuth: Attempting token refresh"); // Debug
        try {
          const newToken = await refreshAccessToken();
          if (newToken) {
            setAuthToken(newToken);
            console.log("withAuth: Token refreshed, retrying API call"); // Debug
            try {
              return await apiCall();
            } catch (retryError) {
              console.error("withAuth: Retry failed", retryError);
              throw new Error("Request failed after token refresh");
            }
          } else {
            console.error("withAuth: Token refresh failed");
            clearAuthToken();
            setPosts([]);
            logout();
            throw new Error("Authentication failed: Unable to refresh token");
          }
        } catch (refreshError) {
          console.error("withAuth: Token refresh error", refreshError);
          clearAuthToken();
          setPosts([]);
          logout();
          throw new Error("Authentication failed: Token refresh error");
        }
      }
      throw error;
    }
    console.error("withAuth: Non-Axios error", error); // Debug
    throw error;
  }
};
  // Fetch all posts (paginated)
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await withAuth(() => postAPI.getPosts());
      if (response) {
        setPosts(response.results);
      }
    } catch (error) {
      console.error("Posts context: Failed to fetch posts:", error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshAccessToken, logout]);

  // Fetch a single post by ID
  const fetchPost = useCallback(async (postId: string): Promise<Post | null> => {
    setIsLoading(true);
    try {
      const response = await withAuth(() => postAPI.getPost(postId));
      return response;
    } catch (error) {
      console.error(`Posts context: Failed to fetch post ${postId}:`, error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshAccessToken, logout]);

  // Create a new post
  const createPost = async (postData: {
    title: string;
    content: string;
    images?: string[];
  }): Promise<boolean> => {
    if (!isAuthenticated) {
      throw new Error("User must be authenticated to create a post");
    }
    setIsLoading(true);
    try {
      const response = await withAuth(() =>
        postAPI.createPost({
          ...postData,
          author: user?.id,
        })
      );
      if (response) {
        setPosts((prev) => [response, ...prev]);
      }
      return true;
    } catch (error) {
      console.error("Posts context: Failed to create post:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a post
  const deletePost = async (postId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      throw new Error("User must be authenticated to delete a post");
    }
    setIsLoading(true);
    try {
      await withAuth(() => postAPI.deletePost(postId));
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      return true;
    } catch (error) {
      console.error(`Posts context: Failed to delete post ${postId}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Like or unlike a post
  const likePost = async (
    postId: string,
    action: "like" | "unlike"
  ): Promise<boolean> => {
    if (!isAuthenticated) {
      throw new Error("User must be authenticated to like/unlike a post");
    }
    setIsLoading(true);
    try {
      const response = await withAuth(() =>
        postAPI.likePost(postId, { action })
      );
      if (response) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, like_count: response.like_count }
              : post
          )
        );
      }
      return true;
    } catch (error) {
      console.error(`Posts context: Failed to ${action} post ${postId}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register a view for a post
  const registerView = async (postId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await withAuth(() =>
        postAPI.registerView(postId, { viewed: true })
      );
      if (response) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, view_count: response.view_count }
              : post
          )
        );
      }
      return true;
    } catch (error) {
      console.error(`Posts context: Failed to register view for post ${postId}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch comments for a post
  const fetchComments = useCallback(
    async (postId: string, page: number = 1): Promise<Comment[]> => {
      setIsLoading(true);
      try {
        const response = await withAuth(() =>
          postAPI.getComments(postId, { page })
        );
        if (response) {
          return (response as any).results || response;
        }
        return [];
      } catch (error) {
        console.error(`Posts context: Failed to fetch comments for post ${postId}:`, error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, refreshAccessToken, logout]
  );

  // Create a comment or reply
  const createComment = async (
    postId: string,
    content: string,
    parentId?: string
  ): Promise<boolean> => {
    if (!isAuthenticated) {
      throw new Error("User must be authenticated to comment");
    }
    setIsLoading(true);
    try {
      const response = await withAuth(() =>
        postAPI.createComment(postId, { content, parent: parentId })
      );
      if (response) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comment_count: post.comment_count
                    ? post.comment_count + 1
                    : 1,
                }
              : post
          )
        );
      }
      return true;
    } catch (error) {
      console.error(`Posts context: Failed to create comment for post ${postId}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Like or unlike a comment
  const likeComment = async (
    commentId: string,
    action: "like" | "unlike"
  ): Promise<boolean> => {
    if (!isAuthenticated) {
      throw new Error("User must be authenticated to like/unlike a comment");
    }
    setIsLoading(true);
    try {
      const response = await withAuth(() =>
        postAPI.likeComment(commentId, { action })
      );
      return true;
    } catch (error) {
      console.error(`Posts context: Failed to ${action} comment ${commentId}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a comment
  const deleteComment = async (commentId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      throw new Error("User must be authenticated to delete a comment");
    }
    setIsLoading(true);
    try {
      await withAuth(() => postAPI.deleteComment(commentId));
      return true;
    } catch (error) {
      console.error(`Posts context: Failed to delete comment ${commentId}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PostsContext.Provider
      value={{
        posts,
        isLoading,
        fetchPosts,
        fetchPost,
        createPost,
        deletePost,
        likePost,
        registerView,
        fetchComments,
        createComment,
        likeComment,
        deleteComment,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

// Custom hook to use the Posts context
export function usePosts() {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error("usePosts must be used within a PostsProvider");
  }
  return context;
}