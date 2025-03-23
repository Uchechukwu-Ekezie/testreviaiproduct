import { chatAPI } from "@/lib/api";

/**
 * Creates a new chat session
 * @param chatTitle The title of the chat session
 * @param userId The ID of the user who owns the session
 * @param uniqueChatId Optional unique identifier for the chat session
 * @returns The created chat session data
 */
export async function createChatSession(
  chatTitle: string,
  userId: string,
  uniqueChatId?: string
) {
  try {
    // Validate inputs
    if (!chatTitle || !userId) {
      throw new Error("Chat title and user ID are required");
    }

    // Create session data object
    const sessionData = {
      chat_title: chatTitle,
      user: userId,
      unique_chat_id: uniqueChatId || undefined // Only include if provided
    };

    // Create the chat session
    const response = await chatAPI.createChatSession(sessionData);
    console.log("Chat session created:", response);
    
    return response;
  } catch (error) {
    console.error("Failed to create chat session:", error);
    throw error;
  }
}

/**
 * Fetches details for a chat session by ID
 * @param sessionId The ID of the chat session to fetch
 * @returns The chat session details
 */
export async function fetchChatSession(sessionId: string) {
  try {
    // Validate input
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // Fetch the chat session details
    const response = await chatAPI.getChatSession(sessionId);
    console.log("Chat session details:", response);
    
    return response;
  } catch (error) {
    console.error("Failed to fetch chat session:", error);
    throw error;
  }
}

/**
 * Example usage - creates a chat session and then fetches its details
 */
export async function createAndFetchExample() {
  try {
    const userId = "2b30a7f0-a174-45c2-95b9-ed51f1782c23"; // Replace with actual user ID
    
    // Create the session
    const newSession = await createChatSession("house", userId);
    console.log("Created session:", newSession);
    
    // Get the session ID
    const sessionId = newSession.id;
    
    // Fetch the session details
    const sessionDetails = await fetchChatSession(sessionId);
    console.log("Session details:", sessionDetails);
    
    return sessionDetails;
  } catch (error) {
    console.error("Error in create and fetch example:", error);
    throw error;
  }
} 