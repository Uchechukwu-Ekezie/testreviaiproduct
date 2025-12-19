/**
 * Search API Module
 *
 * Handles search history operations including:
 * - Client-side chat session search
 * - Search history CRUD operations
 * - Search query tracking
 *
 * @module search.api
 */

import { api } from "./axios-config";
import { withErrorHandling } from "./error-handler";
import type { ChatSession } from "./types";

/**
 * Search history data structure
 */
export interface SearchHistory {
  id: string;
  user: string;
  query: string;
  chat_session: string;
  created_at: string;
  updated_at: string;
}

/**
 * Search history creation payload
 */
export interface CreateSearchHistoryPayload {
  user: string;
  query: string;
  chat_session: string;
}

/**
 * Search API
 * Provides search functionality and search history management
 */
export const searchAPI = {
  /**
   * Client-side search of chat sessions by title
   *
   * @param query - Search query string
   * @param sessions - Array of chat sessions to search
   * @returns Filtered array of chat sessions matching the query
   *
   * @example
   * const results = searchAPI.searchChatSessions('house', chatSessions);
   */
  searchChatSessions: (
    query: string,
    sessions: ChatSession[]
  ): ChatSession[] => {
    // Validate input
    if (!Array.isArray(sessions)) {
      console.error("searchChatSessions: sessions is not an array", sessions);
      return [];
    }

    // Return all sessions if query is empty
    if (!query.trim()) {
      return sessions;
    }

    // Filter sessions by title
    const searchTerm = query.toLowerCase();
    return sessions.filter((session) => {
      if (!session) return false;
      const title = session.chat_title || "Untitled Chat";
      return title.toLowerCase().includes(searchTerm);
    });
  },

  /**
   * Save a search query to history
   *
   * @param data - Search history data
   * @returns Created search history record
   * @throws {Error} If the request fails
   *
   * @example
   * const history = await searchAPI.postSearchHistory({
   *   user: 'user-123',
   *   query: 'apartment in Lagos',
   *   chat_session: 'session-456'
   * });
   */
  postSearchHistory: async (
    data: CreateSearchHistoryPayload
  ): Promise<SearchHistory> => {
    return withErrorHandling(async () => {
      console.log("API: Posting search history with data:", data);
      const response = await api.post<SearchHistory>(
        "/search-histories/",
        data
      );
      console.log(
        "API: Search history posted successfully, response:",
        response.data
      );
      return response.data;
    });
  },

  /**
   * Get all search histories for the authenticated user
   *
   * @returns Array of search history records
   * @throws {Error} If the request fails
   *
   * @example
   * const histories = await searchAPI.getSearchHistories();
   * console.log(`Found ${histories.length} search records`);
   */
  getSearchHistories: async (): Promise<SearchHistory[]> => {
    return withErrorHandling(async () => {
      console.log("API: Fetching all search histories");
      const response = await api.get<SearchHistory[]>("/search-histories/");
      console.log(
        "API: Search histories fetched successfully, count:",
        response.data.length
      );
      return response.data;
    });
  },

  /**
   * Get a specific search history by ID
   *
   * @param searchHistoryId - Search history ID
   * @returns Search history details
   * @throws {Error} If the request fails or history not found
   *
   * @example
   * const history = await searchAPI.getSearchHistoryById('history-123');
   * console.log('Query:', history.query);
   */
  getSearchHistoryById: async (
    searchHistoryId: string
  ): Promise<SearchHistory> => {
    return withErrorHandling(async () => {
      console.log("API: Fetching search history by ID:", searchHistoryId);
      const response = await api.get<SearchHistory>(
        `/search-histories/${searchHistoryId}/`
      );
      console.log(
        "API: Search history fetched successfully, response:",
        response.data
      );
      return response.data;
    });
  },

  /**
   * Delete a search history record
   *
   * @param searchHistoryId - Search history ID to delete
   * @returns Deletion confirmation
   * @throws {Error} If the request fails or history not found
   *
   * @example
   * await searchAPI.deleteSearchHistory('history-123');
   * console.log('Search history deleted');
   */
  deleteSearchHistory: async (
    searchHistoryId: string
  ): Promise<{ message: string }> => {
    return withErrorHandling(async () => {
      console.log("API: Deleting search history:", searchHistoryId);
      const response = await api.delete<{ message: string }>(
        `/search-histories/${searchHistoryId}/`
      );
      console.log(
        "API: Search history deleted successfully, response:",
        response.data
      );
      return response.data;
    });
  },
};

export default searchAPI;
