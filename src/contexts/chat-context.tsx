"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { chatAPI } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "./auth-context";

// Define interfaces for chat data
interface ChatSession {
  id: string;
  chat_title: string;
  user: string;
  created_at?: string;
  updated_at?: string;
  unique_chat_id?: string;
}

interface ChatMessage {
  id: string;
  prompt: string;
  response?: string;
  session: string;
  created_at?: string;
  updated_at?: string;
}

// Define types for our context
interface ChatContextType {
  sessions: ChatSession[];
  activeSession: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  createChatSession: (title: string) => Promise<ChatSession>;
  getChatSessions: () => Promise<void>;
  getChatsBySession: (sessionId: string) => Promise<ChatMessage[]>;
  postChat: (message: string, sessionId?: string) => Promise<ChatMessage>;
  deleteSession: (sessionId: string) => Promise<void>;
  setActiveSession: (sessionId: string | null) => void;
}

// Create the context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Chat Provider Props
interface ChatProviderProps {
  children: ReactNode;
}

// Create the provider component
export function ChatProvider({ children }: ChatProviderProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Get all chat sessions for the user
  const getChatSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the chatAPI.getChatSessions function we added
      const response = await chatAPI.getChatSessions();
      setSessions(response);
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
      setError("Failed to fetch chat sessions");
      toast({
        title: "Error",
        description: "Failed to fetch chat sessions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get all chat messages for a specific session
  const getChatsBySession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await chatAPI.getChatsBySession(sessionId);
      setMessages(response);
      return response;
    } catch (error) {
      console.error("Failed to fetch chat messages:", error);
      setError("Failed to fetch chat messages");
      toast({
        title: "Error",
        description: "Failed to fetch chat messages",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new chat session
  const createChatSession = useCallback(async (title: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!title.trim()) {
        throw new Error("Chat title is required");
      }
      
      let userId = user?.id;
      
      // If not authenticated, use a default/guest ID or handle accordingly
      if (!userId && !isAuthenticated) {
        userId = "guest"; // Use a guest ID or handle as needed
        console.log("Warning: User not authenticated. Using guest ID.");
      }
      
      // Create session data object
      const sessionData = {
        chat_title: title,
        user: userId || "guest" // Ensure it's always a string
      };
      
      // Create the chat session
      const response = await chatAPI.createChatSession(sessionData);
      
      // Update sessions list
      setSessions(prev => [response, ...prev]);
      
      // Set as active session
      setActiveSession(response.id);
      
      return response;
    } catch (error) {
      console.error("Failed to create chat session:", error);
      
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to create chat session";
      
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  // Post a chat message
  const postChat = useCallback(async (message: string, sessionId?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!message.trim()) {
        throw new Error("Message cannot be empty");
      }

      // Check authentication
      if (!isAuthenticated) {
        throw new Error("Please log in to send messages");
      }
      
      const targetSessionId = sessionId || activeSession;
      
      if (!targetSessionId) {
        // Create a new session if none exists
        console.log("No active session, creating new one...");
        const newSession = await createChatSession(message.substring(0, 30));
        console.log("New session created:", newSession);
        
        // Set as active session and update sessions list
        setActiveSession(newSession.id);
        setSessions(prev => [newSession, ...prev]);
        
        // Use the chatAPI postNewChat function
        console.log("Posting message to new session...");
        const response = await chatAPI.postNewChat(message, newSession.id);
        console.log("Message posted successfully:", response);
        
        // Update messages - ensure we have both prompt and response
        const newMessage = {
          ...response,
          prompt: message.trim(),  // Ensure we keep the original prompt
          session: newSession.id
        };
        setMessages([newMessage]);
        
        return newMessage;
      } else {
        // Post to existing session
        console.log("Posting message to existing session:", targetSessionId);
        const response = await chatAPI.postNewChat(message, targetSessionId);
        console.log("Message posted successfully:", response);
        
        // Update messages - ensure we have both prompt and response
        const newMessage = {
          ...response,
          prompt: message.trim(),  // Ensure we keep the original prompt
          session: targetSessionId
        };
        setMessages(prev => [...prev, newMessage]);
        
        // Ensure the session is still in our list and active
        if (!sessions.some(s => s.id === targetSessionId)) {
          // If session not in list, fetch it and add it
          try {
            const sessionData = await chatAPI.getChatSession(targetSessionId);
            setSessions(prev => [sessionData, ...prev]);
          } catch (err) {
            console.error("Failed to fetch session data:", err);
          }
        }
        
        // Ensure this session is set as active
        setActiveSession(targetSessionId);
        
        return newMessage;
      }
    } catch (error: any) {
      console.error("Failed to post chat message:", error);
      
      let errorMessage = "Failed to post chat message";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error.response?.data) {
        errorMessage = error.response.data.detail || error.response.data;
      }
      
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, createChatSession, isAuthenticated, sessions]);

  // Delete a chat session
  const deleteSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await chatAPI.deleteChatSession(sessionId);
      
      // Update sessions list
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // Clear active session if it was deleted
      if (activeSession === sessionId) {
        setActiveSession(null);
        setMessages([]);
      }
      
      toast({
        title: "Success",
        description: "Chat session deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete chat session:", error);
      
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to delete chat session";
      
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeSession]);

  // Load sessions on initial mount
  useEffect(() => {
    if (isAuthenticated) {
      getChatSessions();
    }
  }, [isAuthenticated, getChatSessions]);

  // The context value
  const value = {
    sessions,
    activeSession,
    messages,
    isLoading,
    error,
    createChatSession,
    getChatSessions,
    getChatsBySession,
    postChat,
    deleteSession,
    setActiveSession
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// Custom hook to use the chat context
export function useChat() {
  const context = useContext(ChatContext);
  
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  
  return context;
} 