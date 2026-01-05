/**
 * Stories API Module
 *
 * Handles all story-related operations:
 * - Story CRUD operations (create, read, delete)
 * - Story view tracking
 * - Story listing for all users or specific user
 */

import { withErrorHandling } from "./error-handler";
import api from "./axios-config";

export interface StoryResponse {
  id: string;
  author_id: string;
  media_url: string;
  caption?: string;
  created_at: string;
  expires_at?: string;
  author_username?: string;
  author_avatar?: string;
  author_first_name?: string;
  author_last_name?: string;
  is_viewed?: boolean;
}

export interface StoryCreatePayload {
  media_url: string;
  caption?: string;
}

export interface StoriesListResponse {
  results?: StoryResponse[];
  stories?: StoryResponse[];
  count?: number;
  total?: number;
}

/**
 * Stories API
 */
export const storiesAPI = {
  /**
   * Get all active stories for all users
   * @returns Array of active stories
   */
  getAll: async (): Promise<StoryResponse[]> => {
    return withErrorHandling(async () => {
      console.log("storiesAPI.getAll: Starting request to /stories/");
      const response = await api.get<StoriesListResponse | StoryResponse[]>("/stories/");
      console.log("storiesAPI.getAll: Raw response:", response.data);
      
      // Handle different response formats
      let stories: StoryResponse[] = [];
      if (Array.isArray(response.data)) {
        stories = response.data as StoryResponse[];
      } else if (response.data && typeof response.data === 'object') {
        const data = response.data as StoriesListResponse;
        stories = data.results || data.stories || [];
      }
      
      console.log("storiesAPI.getAll: Parsed stories:", stories);
      return stories;
    });
  },

  /**
   * Get active stories for a specific user
   * @param userId - User ID
   * @returns Array of user's active stories
   */
  getByUserId: async (userId: string): Promise<StoryResponse[]> => {
    return withErrorHandling(async () => {
      console.log(`storiesAPI.getByUserId: Starting request for userId: ${userId}`);
      const response = await api.get<StoriesListResponse | StoryResponse[]>(`/stories/${userId}`);
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data as StoryResponse[];
      } else if (response.data && typeof response.data === 'object') {
        const data = response.data as StoriesListResponse;
        return data.results || data.stories || [];
      }
      
      return [];
    });
  },

  /**
   * Create a new story
   * @param payload - Story creation data
   * @returns Created story
   */
  create: async (payload: StoryCreatePayload): Promise<StoryResponse> => {
    return withErrorHandling(async () => {
      console.log("storiesAPI.create: Starting request with payload:", payload);
      const response = await api.post<StoryResponse>("/stories/", payload);
      console.log("storiesAPI.create: Success response:", response.data);
      return response.data;
    });
  },

  /**
   * Mark a story as viewed by the current user
   * @param storyId - Story ID
   * @returns View confirmation
   */
  viewStory: async (storyId: string): Promise<void> => {
    return withErrorHandling(async () => {
      console.log(`storiesAPI.viewStory: Marking story ${storyId} as viewed`);
      await api.post(`/stories/${storyId}/view`);
      console.log(`storiesAPI.viewStory: Successfully marked story ${storyId} as viewed`);
    });
  },

  /**
   * Delete a story (owner only)
   * @param storyId - Story ID to delete
   * @returns Deletion confirmation
   */
  delete: async (storyId: string): Promise<void> => {
    return withErrorHandling(async () => {
      console.log(`storiesAPI.delete: Deleting story ${storyId}`);
      await api.delete(`/stories/${storyId}`);
      console.log(`storiesAPI.delete: Successfully deleted story ${storyId}`);
    });
  },
};

