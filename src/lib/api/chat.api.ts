/**
 * Chat API Module
 *
 * Handles all chat-related operations:
 * - Chat session management (create, get, delete)
 * - Chat messages (send, edit, delete)
 * - Chat reactions (like/dislike)
 * - File/image uploads with messages
 */

import type { AxiosRequestConfig, AxiosError } from "axios";
import api from "./axios-config";
import { getAuthToken, setAuthToken } from "./utils";
import type {
  ChatSession,
  ChatSessionCreate,
  ChatSessionUpdate,
  ChatMessage,
  ChatMessageResponse,
  ChatMessageOptions,
  ReactionType,
} from "./types";

/**
 * Chat API
 */
export const chatAPI = {
  /**
   * Create a new chat session
   * @param data - Chat session data
   * @returns Created chat session
   */
  createChatSession: async (data: ChatSessionCreate): Promise<ChatSession> => {
    // Don't use withErrorHandling to preserve raw server errors
    const response = await api.post<ChatSession>(`/chat-sessions/`, data);
    return response.data;
  },

  /**
   * Get all chat sessions for the current user
   * @returns Array of chat sessions
   */
  getChatSessions: async (): Promise<ChatSession[]> => {
    // Don't use withErrorHandling to preserve raw server errors
    // Check if user is authenticated before making the request
    const token = localStorage.getItem("authToken");
    if (!token) {
      return [];
    }

    const response = await api.get<ChatSession[]>(`/chat-sessions/`);
    return response.data;
  },

  /**
   * Get a specific chat session by ID
   * @param sessionId - Chat session ID
   * @returns Chat session details
   */
  getChatSession: async (sessionId: string): Promise<ChatSession> => {
    // Don't use withErrorHandling to preserve raw server errors
    const response = await api.get<ChatSession>(
      `/chat-sessions/${sessionId}/`
    );
    return response.data;
  },

  /**
   * Delete a chat session by ID
   * @param sessionId - Chat session ID to delete
   * @returns Deletion response
   */
  deleteChatSession: async (sessionId: string): Promise<unknown> => {
    // Don't use withErrorHandling to preserve raw server errors
    const response = await api.delete(`/chat-sessions/${sessionId}/`);
    return response.data;
  },

  /**
   * Delete all chat sessions for the current user
   * @returns Deletion response
   */
  deleteAllChatSessions: async (): Promise<unknown> => {
    // Don't use withErrorHandling to preserve raw server errors
    const response = await api.delete(
      `/chat-sessions/delete_all_my_sessions/`
    );
    return response.data;
  },

  /**
   * Get all chats for a specific session
   * @param sessionId - Chat session ID
   * @returns Array of chat messages
   */
  getChatsBySession: async (sessionId: string): Promise<ChatMessage[]> => {
    // Don't use withErrorHandling to preserve raw server errors
    const response = await api.get<unknown>(`/chats/session/${sessionId}`);

    // Handle different response structures
    let chats = response.data;

    // If response.data is an object with a 'results' or 'data' property, extract the array
    if (chats && typeof chats === "object" && !Array.isArray(chats)) {
      const chatsObj = chats as Record<string, unknown>;
      if (Array.isArray(chatsObj.results)) {
        chats = chatsObj.results;
      } else if (Array.isArray(chatsObj.data)) {
        chats = chatsObj.data;
      } else if (Array.isArray(chatsObj.chats)) {
        chats = chatsObj.chats;
      }
    }

    // Ensure we have an array
    const chatArray = Array.isArray(chats) ? chats : [];
    
    // Transform chats to convert session_id to session
    const transformedChats = chatArray.map((chat: any) => {
      // If chat already has session field, use it
      if (chat.session) {
        return chat;
      }
      
      // Otherwise, use session_id as session
      return {
        ...chat,
        session: chat.session_id || sessionId, // Use session_id from response or fallback to the sessionId parameter
      };
    });

    return transformedChats as ChatMessage[];
  },

  /**
   * Get user's own chat sessions
   * @returns Array of user's chat sessions
   */
  getSessionsMine: async (): Promise<ChatSession[]> => {
    // Don't use withErrorHandling to preserve raw server errors
    const response = await api.get<ChatSession[]>(`/chat-sessions/mine/`);
    return response.data;
  },

  /**
   * Send a new chat message
   * @param message - Message text
   * @param sessionId - Optional session ID
   * @param options - Optional message options (images, files, etc.)
   * @returns Chat message response
   */
  postNewChat: async (
    message: string,
    sessionId?: string,
    options?: ChatMessageOptions
  ): Promise<ChatMessageResponse> => {
    // Ensure auth token is set
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication token is missing");
    }
    setAuthToken(token);

    // Declare hasFile using instanceof File
    const hasFile = options?.file instanceof File;

    let requestData: FormData | Record<string, unknown>;
    let requestConfig: AxiosRequestConfig;

    const looksLikeFile =
      options?.file &&
      typeof options?.file === "object" &&
      "name" in options.file &&
      "size" in options.file &&
      "type" in options.file;
    
    // Always use FormData since backend expects multipart/form-data
    const shouldUseFormData = true;

    const userLatitudeValue =
      options?.user_latitude ??
      (options && "userLatitude" in options ? (options as any).userLatitude : undefined);
    const userLongitudeValue =
      options?.user_longitude ??
      (options && "userLongitude" in options ? (options as any).userLongitude : undefined);
    const locationStringValue =
      options?.location ??
      (options && "locationString" in options ? (options as any).locationString : undefined) ??
      (options && "locationLabel" in options ? (options as any).locationLabel : undefined);

    if (shouldUseFormData) {
      // Use FormData for file uploads
      requestData = new FormData();
      requestData.append("prompt", message.trim());
      // requestData.append("original_prompt", message.trim());

      // Always send session_id (empty string for new chats, actual ID for existing)
      requestData.append("session_id", sessionId || "");

      // Add image URL if provided (only if non-empty)
      if (options?.image_url && options.image_url.trim()) {
        requestData.append("image_url", options.image_url);
      } else if (options?.imageUrls && options.imageUrls.length > 0 && options.imageUrls[0].trim()) {
        requestData.append("image_url", options.imageUrls[0]);
      }

      // Add file if provided
      if (options?.file) {
        try {
          if (options.file instanceof File) {
            requestData.append("file", options.file);
          } else if (looksLikeFile && typeof options.file !== "string") {
            requestData.append("file", options.file as File);
          }
        } catch (fileError) {
          console.error("Error adding file to FormData:", fileError);
        }
      }

      // Add other optional fields (only if non-empty)
      if (options?.properties && options.properties.trim()) {
        requestData.append("properties", options.properties);
      }
      if (options?.classification && options.classification.trim()) {
        requestData.append("classification", options.classification);
      }

      // Add location coordinates if provided
      // if (userLatitudeValue !== undefined) {
      //   requestData.append("user_latitude", userLatitudeValue.toString());
      // }
      // if (userLongitudeValue !== undefined) {
      //   requestData.append("user_longitude", userLongitudeValue.toString());
      // }

      // Add city-level location if provided (fallback)
      // if (locationStringValue) {
      //   requestData.append("location", locationStringValue);
      // }

      // Add stream flag if provided
      if (options?.stream !== undefined) {
        requestData.append("stream", options.stream.toString());
      }

      requestConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
        ...(options?.signal ? { signal: options.signal } : {}),
        ...(options?.config ? options.config : {}),
      };
    } else {
      // Use JSON for regular requests without files
      requestData = {
        prompt: message.trim(),
        // original_prompt: message.trim(),
        ...(sessionId && { session_id: sessionId }),
      };

      // Add image URL if provided
      if (options?.image_url) {
        requestData.image_url = options.image_url;
      } else if (options?.imageUrls && options.imageUrls.length > 0) {
        requestData.image_url = options.imageUrls[0];
      }

      // Add other optional fields
      if (options?.properties) {
        requestData.properties = options.properties;
      }
      if (options?.classification) {
        requestData.classification = options.classification;
      }

      // Add location coordinates if provided
      // if (userLatitudeValue !== undefined) {
      //   console.log('✅ Adding user_latitude to JSON request:', userLatitudeValue);
      //   requestData.user_latitude = userLatitudeValue;
      // }
      // if (userLongitudeValue !== undefined) {
      //   console.log('✅ Adding user_longitude to JSON request:', userLongitudeValue);
      //   requestData.user_longitude = userLongitudeValue;
      // }

      // Add city-level location if provided (fallback)
      // if (locationStringValue) {
      //   requestData.location = locationStringValue;
      // }

      // Add stream flag if provided
      if (options?.stream !== undefined) {
        requestData.stream = options.stream;
      }

      console.log('📋 Final JSON requestData:', requestData);

      requestConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        ...(options?.signal ? { signal: options.signal } : {}),
        ...(options?.config ? options.config : {}),
      };
    }

    // Log request payload for debugging
    const logPayload = shouldUseFormData 
      ? Object.fromEntries((requestData as FormData).entries()) 
      : requestData;
    
    console.log('🌐 API Request:', {
      endpoint: '/chats/ai-chat/',
      method: 'POST',
      dataType: shouldUseFormData ? 'FormData' : 'JSON',
      payload: logPayload,
      hasLocation: userLatitudeValue !== undefined && userLongitudeValue !== undefined,
      locationData: userLatitudeValue !== undefined ? {
        latitude: userLatitudeValue,
        longitude: userLongitudeValue
      } : null,
      locationString: locationStringValue ?? null
    });

    // Log the full FormData contents if using FormData
    if (shouldUseFormData) {
      console.log('📦 FormData entries:');
      (requestData as FormData).forEach((value, key) => {
        console.log(`  ${key}:`, value);
      });
    }

    console.log('📤 Making POST request to /chats/ai-chat/');
    console.log('🔧 Request config:', {
      url: '/chats/ai-chat/',
      method: 'POST',
      headers: requestConfig.headers,
      dataType: shouldUseFormData ? 'FormData' : 'JSON',
    });
    console.log('📦 Request data:', shouldUseFormData ? 'FormData (see above)' : requestData);
    console.log('🌐 Full URL:', `${api.defaults.baseURL}/chats/ai-chat/`);
    console.log('⏳ Sending request now... Check Network tab for:', 'ai-chat');

    // Don't use custom error handling to preserve raw server errors
    const response = await api.post<ChatMessageResponse>(
      `/chats/ai-chat/`,
      requestData,
      requestConfig
    );

    console.log('✅ Response received:', response.status, response.statusText);
    console.log('📥 Response data preview:', { 
      id: response.data.id, 
      hasResponse: !!response.data.response,
      responseLength: response.data.response?.length 
    });

    // Create response object
    const responseData = response.data as ChatMessageResponse & {
      message?: string;
      session_id?: string; // Backend returns session_id (with underscore)
    };
    const messageObj: ChatMessageResponse = {
      id: responseData.id,
      prompt: message.trim(),
      original_prompt: responseData.original_prompt || message.trim(),
      response: responseData.response || responseData.message || "",
      session: responseData.session_id || sessionId || responseData.session, // Check session_id first
      context: responseData.context || [],
      classification: responseData.classification || "",
      created_at: responseData.created_at || new Date().toISOString(),
      updated_at: responseData.updated_at || new Date().toISOString(),
      file: responseData.file || null,
      image_url: responseData.image_url || null,
      imageUrls:
        options?.imageUrls ||
        (responseData.image_url ? [responseData.image_url] : undefined),
      properties: responseData.properties || null,
      reaction: responseData.reaction || null,
      embeddings: responseData.embeddings || null,
    };

    return messageObj;
  },

  /**
   * Edit an existing chat message
   * @param chatId - Chat message ID
   * @param prompt - New message text
   * @param session - Session ID
   * @returns Updated chat message
   */
  editChat: async (
    chatId: string,
    prompt: string,
    session: string
  ): Promise<ChatMessageResponse> => {
    // Don't use withErrorHandling to preserve raw server errors
    // Validate required parameters
    if (!chatId) throw new Error("Message ID is required");
    if (!session) throw new Error("Session ID is required");
    if (!prompt.trim()) throw new Error("Message cannot be empty");

    const token = getAuthToken();
    if (!token) throw new Error("Authentication token missing");

    const response = await api.put<ChatMessageResponse>(
      `/chats/ai-chat/${chatId}/`,
      {
        prompt: prompt.trim(),
        session: session,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  },

  /**
   * Delete a chat message by ID
   * @param chatId - Chat message ID to delete
   * @returns Deletion response
   */
  deleteChat: async (chatId: string): Promise<unknown> => {
    // Don't use withErrorHandling to preserve raw server errors
    const response = await api.delete(`/chats/${chatId}/delete/`);
    return response.data;
  },

  /**
   * Update reaction for a chat message
   * @param chatId - Chat message ID
   * @param reaction - Reaction type (like, dislike, neutral)
   * @param sessionId - Session ID
   * @returns Updated chat message
   */
  updateReaction: async (
    chatId: string,
    reaction: ReactionType,
    sessionId: string
  ): Promise<unknown> => {
    // Don't use withErrorHandling to preserve raw server errors
    const response = await api.put(`/chats/ai-chat/${chatId}/`, {
      reaction,
      session: sessionId,
    });
    return response.data;
  },

  /**
   * Update chat session details
   * @param sessionId - Chat session ID
   * @param data - Session update data
   * @returns Updated chat session
   */
  updateChatSession: async (
    sessionId: string,
    data: ChatSessionUpdate
  ): Promise<ChatSession> => {
    // Don't use withErrorHandling to preserve raw server errors
    const response = await api.patch<ChatSession>(
      `/chat-sessions/${sessionId}/`,
      data
    );
    return response.data;
  },

  /**
   * Post new chat message with realistic streaming simulation
   * Uses your existing endpoint but creates ChatGPT-like streaming effect
   * @param message - User message
   * @param sessionId - Chat session ID
   * @param options - Additional options
   * @param onChunk - Callback for each chunk of response
   * @returns Promise that resolves when streaming is complete
   */
  postNewChatStreaming: async (
    message: string,
    sessionId?: string,
    options?: ChatMessageOptions & {
      onChunk?: (chunk: string, isComplete: boolean) => void;
    }
  ): Promise<ChatMessageResponse> => {
    console.log('🎬 postNewChatStreaming called');
    console.log('📍 Location in options:', options?.user_latitude, options?.user_longitude);
    
    // Don't use withErrorHandling to preserve raw server errors
    // First, get the complete response from your existing endpoint
    console.log('⏳ Calling postNewChat...');
    const completeResponse = await chatAPI.postNewChat(message, sessionId, options);
    console.log('✅ postNewChat completed');
    
    // If no onChunk callback, return immediately
    if (!options?.onChunk) {
      return completeResponse;
    }

    // Send complete response immediately - ProgressiveMarkdown will handle animation
    const responseText = completeResponse.response;
    
    // Send the complete response with isComplete=false to trigger streaming animation
    options.onChunk?.(responseText, false);
    
    // Then send it again with isComplete=true to finish streaming
    setTimeout(() => {
      options.onChunk?.(responseText, true);
    }, 50);

    return completeResponse;
  },

  /**
   * Property-specific AI chat (stateless, no session)
   * @param propertyId - Property UUID
   * @param question - User's question about the property
   * @param options - Optional streaming configuration
   * @returns AI response about the property
   */
  propertyChat: async (
    propertyId: string,
    question: string,
    options?: {
      useStreaming?: boolean;
      includeSimilarProperties?: boolean;
      onChunk?: (text: string, isComplete: boolean) => void;
      signal?: AbortSignal;
    }
  ): Promise<{ answer: string; property_context?: any; similar_properties?: any[] }> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication token is missing");
    }
    setAuthToken(token);

    const requestData = {
      property_id: propertyId,
      question: question.trim(),
      use_streaming: options?.useStreaming ?? false,
      include_similar_properties: options?.includeSimilarProperties ?? false,
    };

    const requestConfig: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...(options?.signal ? { signal: options.signal } : {}),
    };

    // Handle streaming response
    if (options?.useStreaming && options?.onChunk) {
      requestConfig.responseType = "text";
      requestConfig.adapter = "fetch";
      requestConfig.onDownloadProgress = undefined;

      try {
        const response = await fetch(
          `${api.defaults.baseURL}/chats/ask-property-ai/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
            signal: options?.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  options.onChunk(fullText, true);
                  return { answer: fullText };
                }
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullText += parsed.content;
                    options.onChunk(fullText, false);
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        }

        return { answer: fullText };
      } catch (error) {
        console.error("Streaming error:", error);
        throw error;
      }
    }

    // Standard non-streaming request
    const response = await api.post<{ answer: string; property_context?: any }>(
      `/chats/ask-property-ai/`,
      requestData,
      requestConfig
    );

    return response.data;
  },
};

export default chatAPI;
