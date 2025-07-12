
"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { chatAPI } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "./auth-context"
import { Context } from "@/types/chatMessage"

// Define interfaces for chat data
interface ChatSession {
  id: string
  chat_title: string
  user: string
  created_at?: string
  updated_at?: string
  unique_chat_id?: string
}

interface ChatMessage {
  id: string
  prompt: string
  response?: string
  classification?: string
  context?: Context[]
  properties?: Property[]
  session: string
  created_at?: string
  updated_at?: string
  isLoading?: boolean
  error?: string
}

interface Property {
  id: string
  title: string
  address: string
  price: string
  imageUrl: string
  bedrooms?: number
  bathrooms?: number
  size?: string
  listedBy?: string
  yearBuilt?: string
  lotSize?: string
  squareFootage?: string
  state?: string
  city?: string
  zipCode?: string
  phone?: string
  created_by?: string
  location?: string
  cordinates?: string
  rentalGrade?: number | string
  environmentalScore?: number | string
  neighborhoodScore?: number | string
  aiRefinedDescription?: string | null
  environmentalReport?: string | null
}

// Define types for our context
interface ChatContextType {
  sessions: ChatSession[]
  activeSession: string | null
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  createChatSession: (title: string) => Promise<ChatSession>
  getChatSessions: () => Promise<void>
  getChatsBySession: (sessionId: string) => Promise<ChatMessage[]>
  postChat: (message: string, sessionId?: string) => Promise<ChatMessage>
  editChat: (id: string, message: string, sessionId?: string) => Promise<ChatMessage>
  deleteSession: (sessionId: string) => Promise<void>
  setActiveSession: (sessionId: string | null) => void
  deleteChat: (id: string) => Promise<void>
}

// Create the context
const ChatContext = createContext<ChatContextType | undefined>(undefined)

// Chat Provider Props
interface ChatProviderProps {
  children: ReactNode
}

// Create the provider component
export function ChatProvider({ children }: ChatProviderProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const { user, isAuthenticated } = useAuth()

  // Get all chat sessions for the user
  const getChatSessions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await chatAPI.getChatSessions()
      setSessions(response)
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error)
      setError("Failed to fetch chat sessions")
      toast({
        title: "Error",
        description: "Failed to fetch chat sessions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get all chat messages for a specific session
  const getChatsBySession = useCallback(async (sessionId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await chatAPI.getChatsBySession(sessionId)
      setMessages(response)
      return response
    } catch (error) {
      console.error("Failed to fetch chat messages:", error)
      setError("Failed to fetch chat messages")
      toast({
        title: "Error",
        description: "Failed to fetch chat messages",
        variant: "destructive",
      })
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Create a new chat session
  const createChatSession = useCallback(
    async (title: string) => {
      setIsLoading(true)
      setError(null)

      try {
        if (!title.trim()) {
          throw new Error("Chat title is required")
        }

        let userId = user?.id

        if (!userId && !isAuthenticated) {
          userId = "guest"
          console.log("Warning: User not authenticated. Using guest ID.")
        }

        const sessionData = {
          chat_title: title,
          user: userId || "guest",
        }

        const response = await chatAPI.createChatSession(sessionData)
        setSessions((prev) => [response, ...prev])
        setActiveSession(response.id)

        return response
      } catch (error) {
        console.error("Failed to create chat session:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to create chat session"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [user, isAuthenticated]
  )

  // Post a chat message
 // Update the postChat function in your ChatProvider:
const postChat = useCallback(
  async (message: string, sessionId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!message.trim()) {
        throw new Error("Message cannot be empty");
      }

      if (!isAuthenticated) {
        throw new Error("Please log in to send messages");
      }

      const targetSessionId = sessionId || activeSession;

      if (!targetSessionId) {
        // Create new session flow
        const newSession = await createChatSession(message.substring(0, 30));
        const newSessionId = newSession.id;

        setActiveSession(newSessionId);
        setSessions((prev) => [newSession, ...prev]);

        const tempMessage: ChatMessage = {
          id: `temp-${Date.now()}`,
          prompt: message.trim(),
          session: newSessionId,
          isLoading: true,
        };

        setMessages([tempMessage]);

        // Make the API call
        const response = await chatAPI.postNewChat(message, newSessionId);
        
        // Update the messages with the response
        setMessages([{
          ...response,
          isLoading: false,
        }]);

        setActiveSession(newSessionId);
        return response;
      } else {
        // Existing session flow
        const tempMessage: ChatMessage = {
          id: `temp-${Date.now()}`,
          prompt: message.trim(),
          session: targetSessionId,
          isLoading: true,
        };

        setMessages((prev) => [...prev, tempMessage]);

        // Make the API call
        const response = await chatAPI.postNewChat(message, targetSessionId);
        
        // Update the messages with the response
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage.id ? { ...response, isLoading: false } : msg
          )
        );

        return response;
      }
    } catch (error: any) {
      console.error("Failed to post chat message:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Failed to post chat message";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Update the message with error state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === `temp-${Date.now()}` 
            ? { ...msg, isLoading: false, error: errorMessage }
            : msg
        )
      );
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  },
  [activeSession, createChatSession, isAuthenticated]
);

  // Edit a chat message
  const editChat = useCallback(
    async (messageId: string, newPrompt: string, sessionId?: string) => {
      setIsLoading(true)
      setError(null)

      try {
        if (!newPrompt.trim()) {
          throw new Error("Message cannot be empty")
        }

        if (!isAuthenticated) {
          throw new Error("Please log in to edit messages")
        }

        const targetSessionId = sessionId || activeSession
        if (!targetSessionId) {
          throw new Error("No active session to edit message in")
        }

        const existingMessage = messages.find((m) => m.id === messageId)
        if (!existingMessage) {
          throw new Error("Message not found")
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, prompt: newPrompt.trim(), isLoading: true } : m
          )
        )

        const apiResponse = await chatAPI.editChat(messageId, newPrompt.trim(), targetSessionId)

        const updatedMessage: ChatMessage = {
          id: messageId,
          prompt: newPrompt.trim(),
          response: apiResponse?.response || existingMessage.response || "",
          session: targetSessionId,
          created_at: existingMessage.created_at,
          updated_at: existingMessage.updated_at || new Date().toISOString(),
          context: apiResponse.context || existingMessage.context || [],
          classification: apiResponse.classification || existingMessage.classification || "",
          isLoading: false,
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? updatedMessage : m))
        )

        toast({
          title: "Success",
          description: "Message updated successfully",
        })

        return updatedMessage

   
      } catch (error: any) {
        console.error("Failed to edit chat message:", error)
        const errorMessage = error.response?.data?.message || error.message || "Failed to edit message"
        setError(errorMessage)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, isLoading: false, error: errorMessage } : m
          )
        )
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [isAuthenticated, activeSession, messages]
  )

  // Delete a chat session
  const deleteSession = useCallback(
    async (sessionId: string) => {
      setIsLoading(true)
      setError(null)

      try {
        await chatAPI.deleteChatSession(sessionId)
        setSessions((prev) => prev.filter((session) => session.id !== sessionId))

        if (activeSession === sessionId) {
          setActiveSession(null)
          setMessages([])
        }

        toast({
          title: "Success",
          description: "Chat session deleted successfully",
        })
      } catch (error) {
        console.error("Failed to delete chat session:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to delete chat session"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [activeSession]
  )

  // Delete a chat by ID
  const deleteChat = useCallback(
    async (chatId: string) => {
      setIsLoading(true)
      setError(null)

      try {
        await chatAPI.deleteChat(chatId)
        setMessages((prev) => prev.filter((msg) => msg.id !== chatId))

        toast({
          title: "Success",
          description: "Chat deleted successfully",
        })
      } catch (error) {
        console.error("Failed to delete chat:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to delete chat"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    []
  )


  // Load sessions on initial mount
  useEffect(() => {
    if (isAuthenticated) {
      getChatSessions()
    }
  }, [isAuthenticated, getChatSessions])

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
    editChat,
    deleteChat,
    deleteSession,
    setActiveSession,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

// Custom hook to use the chat context
export function useChat() {
  const context = useContext(ChatContext)

  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }

  return context
}