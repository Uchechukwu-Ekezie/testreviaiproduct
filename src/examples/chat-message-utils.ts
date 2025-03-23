import { chatAPI } from "@/lib/api";

/**
 * Creates a new chat session
 * @param chatTitle The title of the chat session
 * @param userId The ID of the user who owns the session
 * @returns The created chat session data
 */
export async function createChatSession(chatTitle: string, userId: string) {
  try {
    // Validate inputs
    if (!chatTitle || !userId) {
      throw new Error("Chat title and user ID are required");
    }

    // Create session data object
    const sessionData = {
      chat_title: chatTitle,
      user: userId
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
 * Posts a new chat message to a session
 * @param message The message to post
 * @param sessionId The ID of the session to post the message to
 * @returns The chat message data
 */
export async function postChatMessage(message: string, sessionId: string) {
  try {
    // Validate inputs
    if (!message) {
      throw new Error("Message is required");
    }
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // Post the chat message
    const response = await chatAPI.postNewChat(message, sessionId);
    console.log("Chat message posted:", response);
    
    return response;
  } catch (error) {
    console.error("Failed to post chat message:", error);
    throw error;
  }
}

/**
 * Fetches messages for a chat session
 * @param sessionId The ID of the session to fetch messages for
 * @returns The chat messages data
 */
export async function getChatMessages(sessionId: string) {
  try {
    // Validate input
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // Fetch the chat messages
    const response = await chatAPI.getChatsBySession(sessionId);
    console.log("Chat messages fetched:", response);
    
    return response.results || [];
  } catch (error) {
    console.error("Failed to fetch chat messages:", error);
    throw error;
  }
}

/**
 * Example usage - creates a session, posts a message, and fetches messages
 */
export async function fullChatExample() {
  try {
    const userId = "2b30a7f0-a174-45c2-95b9-ed51f1782c23";
    
    // 1. Create a chat session
    console.log("Step 1: Creating chat session...");
    const session = await createChatSession("house", userId);
    const sessionId = session.id;
    console.log("Session created with ID:", sessionId);
    
    // 2. Post a chat message
    console.log("\nStep 2: Posting a chat message...");
    const message = "Tell me about houses in New York";
    const chatResponse = await postChatMessage(message, sessionId);
    console.log("Message posted, response:", chatResponse);
    
    // 3. Fetch all messages
    console.log("\nStep 3: Fetching all messages...");
    const messages = await getChatMessages(sessionId);
    console.log("All messages:", messages);
    
    return {
      session,
      chatResponse,
      messages
    };
  } catch (error) {
    console.error("Error in full chat example:", error);
    throw error;
  }
} 