/**
 * Posts API Module
 *
 * Handles post and comment operations including:
 * - Fetching posts and comments
 * - Creating, liking, and deleting posts and comments
 * - Registering post views
 *
 * @module post.api
 */

import { api } from "./axios-config";
import { withErrorHandling } from "./error-handler";
import type { Post, Comment, PaginationParams, PaginatedResponse } from "./types";
const BASEURL = process.env.NEXT_PUBLIC_BASE_URL
/**
 * Post creation payload
 */
export interface CreatePostPayload {
  title: string;
  content: string;
  images?: string[];
  author?: string;
}

/**
 * Comment creation payload
 */
export interface CreateCommentPayload {
  content: string;
  parent?: string;
}

/**
 * Like action payload
 */
export interface LikeActionPayload {
  action: "like" | "unlike";
}

/**
 * View registration payload
 */
export interface RegisterViewPayload {
  viewed: boolean;
}

/**
 * Posts API
 * Provides functionality for managing posts and comments
 */
export const postAPI = {
  /**
   * Fetch all posts (paginated)
   *
   * @param params - Pagination parameters
   * @returns Paginated array of posts
   * @throws {Error} If the request fails
   *
   * @example
   * const posts = await postAPI.getPosts({ page: 1, page_size: 10 });
   * console.log(`Fetched ${posts.count} posts`);
   */
  getPosts: async (params: PaginationParams = {}): Promise<PaginatedResponse<Post>> => {
    return withErrorHandling(async () => {
      console.log("API: Fetching posts with params:", params);
      const response = await api.get<PaginatedResponse<Post>>(`${BASEURL}/posts/`, { params });
      console.log("API: Posts fetched successfully, count:", response.data.count);
      return response.data;
    });
  },

  /**
   * Fetch a single post by ID
   *
   * @param postId - Post ID
   * @returns Post details
   * @throws {Error} If the request fails or post not found
   *
   * @example
   * const post = await postAPI.getPost('post-123');
   * console.log('Post title:', post.title);
   */
  getPost: async (postId: string): Promise<Post> => {
    return withErrorHandling(async () => {
      console.log("API: Fetching post by ID:", postId);
      const response = await api.get<Post>(`${BASEURL}/posts/${postId}/`);
      console.log("API: Post fetched successfully, response:", response.data);
      return response.data;
    });
  },

  /**
   * Create a new post
   *
   * @param data - Post creation data
   * @returns Created post
   * @throws {Error} If the request fails
   *
   * @example
   * const post = await postAPI.createPost({
   *   title: 'New Post',
   *   content: 'This is a new post',
   *   images: ['image1.jpg'],
   * });
   * console.log('Created post ID:', post.id);
   */
  createPost: async (data: CreatePostPayload): Promise<Post> => {
    return withErrorHandling(async () => {
      console.log("API: Creating post with data:", data);
      const response = await api.post<Post>(`${BASEURL}/posts/`, data);
      console.log("API: Post created successfully, response:", response.data);
      return response.data;
    });
  },

  /**
   * Delete a post by ID
   *
   * @param postId - Post ID to delete
   * @returns Deletion confirmation
   * @throws {Error} If the request fails or post not found
   *
   * @example
   * await postAPI.deletePost('post-123');
   * console.log('Post deleted');
   */
  deletePost: async (postId: string): Promise<{ message: string }> => {
    return withErrorHandling(async () => {
      console.log("API: Deleting post:", postId);
      const response = await api.delete<{ message: string }>(`${BASEURL}/posts/${postId}/`);
      console.log("API: Post deleted successfully, response:", response.data);
      return response.data;
    });
  },

  /**
   * Like or unlike a post
   *
   * @param postId - Post ID
   * @param data - Like action data
   * @returns Updated post like count and action
   * @throws {Error} If the request fails
   *
   * @example
   * const result = await postAPI.likePost('post-123', { action: 'like' });
   * console.log('Like count:', result.like_count);
   */
  likePost: async (
    postId: string,
    data: LikeActionPayload
  ): Promise<{ id: string; like_count: number; action: string }> => {
    return withErrorHandling(async () => {
      console.log("API: Liking/unliking post:", postId, data);
      const response = await api.post<{ id: string; like_count: number; action: string }>(
        `${BASEURL}/posts/${postId}/like/`,
        data
      );
      console.log("API: Post like action successful, response:", response.data);
      return response.data;
    });
  },

  /**
   * Register a view for a post
   *
   * @param postId - Post ID
   * @param data - View registration data
   * @returns Updated post view count
   * @throws {Error} If the request fails
   *
   * @example
   * const result = await postAPI.registerView('post-123', { viewed: true });
   * console.log('View count:', result.view_count);
   */
  registerView: async (
    postId: string,
    data: RegisterViewPayload
  ): Promise<{ id: string; view_count: number }> => {
    return withErrorHandling(async () => {
      console.log("API: Registering view for post:", postId, data);
      const response = await api.post<{ id: string; view_count: number }>(
        `${BASEURL}/posts/${postId}/view/`,
        data
      );
      console.log("API: Post view registered successfully, response:", response.data);
      return response.data;
    });
  },

  /**
   * Fetch comments for a post (paginated)
   *
   * @param postId - Post ID
   * @param params - Pagination parameters
   * @returns Paginated array of comments
   * @throws {Error} If the request fails
   *
   * @example
   * const comments = await postAPI.getComments('post-123', { page: 1 });
   * console.log(`Fetched ${comments.count} comments`);
   */
  getComments: async (
    postId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Comment>> => {
    return withErrorHandling(async () => {
      console.log("API: Fetching comments for post:", postId, params);
      const response = await api.get<PaginatedResponse<Comment>>(
        `${BASEURL}/posts/${postId}/comments/`,
        { params }
      );
      console.log("API: Comments fetched successfully, count:", response.data.count);
      return response.data;
    });
  },

  /**
   * Create a comment or reply
   *
   * @param postId - Post ID
   * @param data - Comment creation data
   * @returns Created comment
   * @throws {Error} If the request fails
   *
   * @example
   * const comment = await postAPI.createComment('post-123', {
   *   content: 'Great post!',
   *   parent: 'comment-456'
   * });
   * console.log('Created comment ID:', comment.id);
   */
  createComment: async (
    postId: string,
    data: CreateCommentPayload
  ): Promise<Comment> => {
    return withErrorHandling(async () => {
      console.log("API: Creating comment for post:", postId, data);
      const response = await api.post<Comment>(`${BASEURL}posts/${postId}/comments/`, data);
      console.log("API: Comment created successfully, response:", response.data);
      return response.data;
    });
  },

  /**
   * Like or unlike a comment
   *
   * @param commentId - Comment ID
   * @param data - Like action data
   * @returns Updated comment like count and action
   * @throws {Error} If the request fails
   *
   * @example
   * const result = await postAPI.likeComment('comment-123', { action: 'like' });
   * console.log('Like count:', result.like_count);
   */
  likeComment: async (
    commentId: string,
    data: LikeActionPayload
  ): Promise<{ id: string; like_count: number; action: string }> => {
    return withErrorHandling(async () => {
      console.log("API: Liking/unliking comment:", commentId, data);
      const response = await api.post<{ id: string; like_count: number; action: string }>(
        `${BASEURL}/api/posts/comments/${commentId}/like`,
        data
      );
      console.log("API: Comment like action successful, response:", response.data);
      return response.data;
    });
  },

  /**
   * Delete a comment by ID
   *
   * @param commentId - Comment ID to delete
   * @returns Deletion confirmation
   * @throws {Error} If the request fails or comment not found
   *
   * @example
   * await postAPI.deleteComment('comment-123');
   * console.log('Comment deleted');
   */
  deleteComment: async (commentId: string): Promise<{ message: string }> => {
    return withErrorHandling(async () => {
      console.log("API: Deleting comment:", commentId);
      const response = await api.delete<{ message: string }>(`${BASEURL}/comments/${commentId}/`);
      console.log("API: Comment deleted successfully, response:", response.data);
      return response.data;
    });
  },

  /**
   * Create a reply to a comment
   *
   * @param commentId - Parent comment ID
   * @param data - Reply creation data
   * @returns Created reply
   * @throws {Error} If the request fails
   *
   * @example
   * const reply = await postAPI.createReply('comment-123', {
   *   content: 'Thanks for the comment!',
   *   post: 'post-123'
   * });
   * console.log('Created reply ID:', reply.id);
   */
  createReply: async (
    commentId: string,
    data: CreateCommentPayload & { post: string }
  ): Promise<Comment> => {
    return withErrorHandling(async () => {
      console.log("API: Creating reply to comment:", commentId, data);
      const response = await api.post<Comment>(`${BASEURL}/api/comments/${commentId}/reply/`, data);
      console.log("API: Reply created successfully, response:", response.data);
      return response.data;
    });
  },
};

export default postAPI;