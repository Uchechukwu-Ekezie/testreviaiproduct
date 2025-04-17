"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useMediaQuery } from "@/hooks/use-mobile"
import { toast } from "@/components/ui/use-toast"
import { chatAPI } from "@/lib/api"

// Import images
import one from "../../public/Image/search-normal.svg"
import two from "../../public/Image/smart-home.svg"
import three from "../../public/Image/verify.svg"
import four from "../../public/Image/more-circle.svg"
import ChatSidebar from "@/components/chatpage/chat-sidebar"
import ChatHeader from "@/components/chatpage/chat-header"
import ChatMessages from "@/components/chatpage/chat-message"
import ChatInput from "@/components/chatpage/chat-input"
import RenameDialog from "@/components/chatpage/rename-dialog"

// Add interface for Message type
interface Message {
  id: string
  prompt?: string
  response?: string
  session?: string | null | undefined
  error?: boolean
  retrying?: boolean
  isNewSession?: boolean
}

interface ChatSession {
  id: string
  chat_title: string
  user: string
  created_at?: string
}

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [latestMessageId, setLatestMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user, isAuthenticated, logout } = useAuth()
  const isMobile = useMediaQuery("(max-width: 768px)")
  // Add a ref to track if we're currently creating a new session
  const isCreatingNewSession = useRef(false)

  const actionCards = [
    {
      title: "Find a Property",
      description: "Search for homes to rent or buy",
      image: one,
      message: "I want to find a property.",
    },
    {
      title: "Report your Landlord",
      description: "Check credentials and reviews",
      image: three,
      message: "Can I verify my landlord?",
    },
    {
      title: "Tell your story",
      description: "Share your experience with us",
      image: two,
      message: "I want to tell my story.",
    },
    {
      title: "Explore Neighborhoods",
      description: "Discover nearby amenities and more",
      image: four,
      message: "Tell me about my neighborhood.",
    },
  ]

  const getSessions = async () => {
    try {
      // Only attempt to fetch sessions if authenticated
      if (!isAuthenticated) {
        setSessions([])
        return []
      }

      const data = await chatAPI.getSessionsMine()

      // If no results property or it's not an array, handle gracefully
      if (!data || !data.results || !Array.isArray(data.results)) {
        console.warn("Unexpected response format from getSessionsMine:", data)
        setSessions([])
        return []
      }

      // Sort sessions by most recently updated first (if timestamps are available)
      const sortedSessions = [...data.results].sort((a, b) => {
        // If created_at exists, sort by that
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        return 0 // No sorting if no timestamps
      })

      setSessions(sortedSessions)

      // If we have an active session, make sure it's still in the list
      if (activeSession) {
        const sessionExists = sortedSessions.some((session) => session.id === activeSession)
        if (!sessionExists) {
          // Session no longer exists, reset active session
          console.log("Active session no longer exists, resetting")
          setActiveSession(null)
          setMessages([])
        }
      }

      return sortedSessions
    } catch (error: any) {
      console.error("Error fetching sessions:", error)
      // Don't show toast for unauthorized errors as they're expected for non-logged-in users
      if (error.response?.status !== 401) {
        toast({
          title: "Error",
          description: "Failed to fetch chat sessions",
          variant: "destructive",
        })
      }
      setSessions([])
      return []
    }
  }

  // Replace the getChats function with this improved version that prevents duplicate messages
  const getChats = async (sessionId: string) => {
    // Skip fetching if we're creating a new session
    if (isCreatingNewSession.current) {
      console.log("Skipping message fetch while creating new session")
      return []
    }

    // Skip fetching if we have a pending message for this session
    const hasPendingMessage = messages.some((msg) => msg.session === sessionId && !msg.response && !msg.error)

    if (hasPendingMessage) {
      console.log("Skipping message fetch for session with pending message:", sessionId)
      return []
    }

    try {
      console.log("Fetching chats for session:", sessionId)
      const data = await chatAPI.getChatsBySession(sessionId)

      if (!data || !data.results) {
        console.warn("No results returned for session:", sessionId)
        return []
      }

      // Sort messages by created_at to ensure chronological order (oldest first)
      const sortedMessages = [...data.results].sort((a, b) => {
        if (a.created_at && b.created_at) {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        }
        return 0
      })

      // Check for duplicate messages by ID before updating state
      const existingMessageIds = new Set(messages.map((msg) => msg.id))
      const uniqueNewMessages = sortedMessages.filter((msg) => !existingMessageIds.has(msg.id))

      // If we have pending messages, merge them with the fetched messages
      if (hasPendingMessage) {
        const pendingMessages = messages.filter((msg) => !msg.response && !msg.error)
        const nonPendingFetchedMessages = sortedMessages.filter(
          (msg) => !pendingMessages.some((pending) => pending.id === msg.id),
        )
        setMessages([...nonPendingFetchedMessages, ...pendingMessages])
      } else {
        // Only replace messages if we don't have any yet or if we have new unique messages
        if (messages.length === 0 || uniqueNewMessages.length > 0) {
          setMessages(sortedMessages)
        }
      }

      // Ensure the messages display is scrolled to the bottom after loading
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)

      return sortedMessages
    } catch (error: any) {
      console.error("Error fetching chats for session:", sessionId, error)
      toast({
        title: "Error",
        description: "Failed to fetch chat messages",
        variant: "destructive",
      })
      return []
    }
  }

  // Fetch sessions when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      getSessions()
    }
  }, [isAuthenticated]) // Add isAuthenticated as dependency to reload when auth state changes

  // Fetch chats when active session changes
  useEffect(() => {
    if (activeSession && !isCreatingNewSession.current) {
      // Check if we have any messages for this session already
      const hasMessagesForSession = messages.some((msg) => msg.session === activeSession)

      // Only fetch messages if we don't already have messages for this session
      // or if we have messages but none are pending
      if (!hasMessagesForSession) {
        getChats(activeSession)
      }
    }
  }, [activeSession]) // Only depend on activeSession to prevent loops

  // Add a function to refresh sessions
  const refreshSessions = async () => {
    if (isAuthenticated) {
      await getSessions()
    }
  }

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  }

  useEffect(() => {
    // Only scroll on new messages
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  // Update the postChat function to prevent duplicate messages
  const postChat = async (input: string, activeSession?: string) => {
    try {
      // Create a temporary message ID that we'll use to track this message
      const tempMessageId = "temp-" + Date.now()

      // Immediately add the user's message to the UI
      const tempMessage: Message = {
        id: tempMessageId,
        prompt: input,
        response: "",
        session: activeSession,
      }

      // Check if we already have this message to prevent duplicates
      const isDuplicate = messages.some(
        (msg) => msg.prompt === input && (!msg.response || msg.response === "") && msg.session === activeSession,
      )

      if (!isDuplicate) {
        // Add the message to the UI immediately
        setMessages((prev) => [...prev, tempMessage])
      }

      let sessionId = activeSession
      let newSessionData: ChatSession | null = null

      // If no active session, create one first
      if (!sessionId) {
        // Set the flag to indicate we're creating a new session
        isCreatingNewSession.current = true

        const userId = user?.id || "guest"
        const sessionData = {
          chat_title: input.substring(0, 30),
          user: userId,
        }

        console.log("Creating new chat session with data:", sessionData)
        try {
          // Mark this as a new session message to prevent message fetching
          setMessages((prev) => prev.map((msg) => (msg.id === tempMessageId ? { ...msg, isNewSession: true } : msg)))

          newSessionData = await chatAPI.createChatSession(sessionData)
          console.log("New session created:", newSessionData)

          if (!newSessionData) {
            throw new Error("Failed to create new chat session")
          }

          sessionId = newSessionData.id

          // Update sessions list and set active session immediately
          setSessions((prev: ChatSession[]) => {
            // Check if session already exists to prevent duplicates
            if (prev.some((s) => s.id === newSessionData!.id)) {
              return prev
            }
            return [newSessionData!, ...prev]
          })

          setActiveSession(sessionId)

          // Update the temporary message with the new session ID and isNewSession flag
          setMessages((prev) =>
            prev.map((msg) => (msg.id === tempMessageId ? { ...msg, session: sessionId, isNewSession: true } : msg)),
          )
        } catch (error) {
          console.error("Error creating session:", error)
          // Mark the message as failed
          setMessages((prev) => prev.map((msg) => (msg.id === tempMessageId ? { ...msg, error: true } : msg)))
          throw error
        }
      }

      // Now post the chat message
      console.log("Posting chat message...")
      try {
        const data = await chatAPI.postNewChat(input, sessionId!)
        setLatestMessageId(data.id)

        // Update the messages with the response, ensuring we don't duplicate
        setMessages((prev) => {
          // Find the temporary message
          const tempIndex = prev.findIndex((msg) => msg.id === tempMessageId)

          if (tempIndex >= 0) {
            // Replace the temporary message with the real one
            const newMessages = [...prev]
            newMessages[tempIndex] = { ...data, session: sessionId }
            return newMessages
          } else {
            // If we can't find the temp message, check if we already have this message
            const existingIndex = prev.findIndex((msg) => msg.id === data.id)
            if (existingIndex >= 0) {
              // Update the existing message
              const newMessages = [...prev]
              newMessages[existingIndex] = { ...data, session: sessionId }
              return newMessages
            } else {
              // Add as a new message
              return [...prev, { ...data, session: sessionId }]
            }
          }
        })

        // If this was a new session, update the sessions list
        if (newSessionData) {
          setSessions((prev) => {
            const existingSession = prev.find((s) => s.id === sessionId)
            if (!existingSession) {
              return [
                {
                  ...newSessionData!,
                  chat_title: newSessionData!.chat_title,
                  first_message: input,
                },
                ...prev,
              ]
            }
            return prev
          })

          // Make sure the active session is still set correctly after all operations
          setTimeout(() => {
            setActiveSession(sessionId)
            // Reset the creating new session flag
            isCreatingNewSession.current = false
          }, 100)
        }

        setTimeout(scrollToBottom, 100)
        return data
      } catch (error) {
        console.error("Error posting chat:", error)
        // Mark the message as failed but keep it in the UI
        setMessages((prev) => prev.map((msg) => (msg.id === tempMessageId ? { ...msg, error: true } : msg)))

        // Reset the creating new session flag
        isCreatingNewSession.current = false

        throw error
      }
    } catch (error: any) {
      console.error("Error in postChat:", error)
      // Reset the creating new session flag
      isCreatingNewSession.current = false
      throw error
    }
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim()) return

      setIsLoading(true)
      const currentMessage = input
      setInput("")

      try {
        await postChat(currentMessage, activeSession || undefined)
      } catch (error: any) {
        console.error("Error submitting chat:", error)

        let errorMessage = "The server encountered an error. Please try again later."
        if (error.response?.status === 401) {
          errorMessage = "Authentication required. Please log in to continue."
        } else if (error.response?.status === 403) {
          errorMessage = "You don't have permission to perform this action."
        } else if (error.response?.status === 404) {
          errorMessage = "Resource not found. The session may have been deleted."
        } else if (error.response?.status === 500) {
          errorMessage = "Server error. Please try again later."
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [input, activeSession, user?.id],
  )

  // Direct card submission handler
  const handleCardSubmit = async (card: (typeof actionCards)[0]) => {
    if (isLoading) return

    setIsLoading(true)

    try {
      await postChat(card.message, activeSession || undefined)
    } catch (error: any) {
      console.error("Error submitting card message:", error)

      let errorMessage = "The server encountered an error. Please try again later."
      if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in to continue."
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to perform this action."
      } else if (error.response?.status === 404) {
        errorMessage = "Resource not found. The session may have been deleted."
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later."
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRename = async (sessionId: string) => {
    if (!newTitle.trim()) return

    try {
      // Call the API to update the session title
      const updatedSession = await chatAPI.updateChatSession(sessionId, {
        chat_title: newTitle.trim(),
      })

      // Update the sessions list with the new title
      setSessions((prev: ChatSession[]) =>
        prev.map((session: ChatSession) => (session.id === sessionId ? { ...session, ...updatedSession } : session)),
      )

      setShowRenameDialog(false)
      setNewTitle("")
      setSelectedSessionId(null)

      toast({
        title: "Success",
        description: "Chat session renamed successfully",
      })
    } catch (error: any) {
      console.error("Error renaming chat session:", error)

      // Show more specific error message if available
      const errorMessage = error.response?.data?.detail || "Failed to rename chat session"

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar Component */}
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sessions={sessions}
        setSessions={setSessions}
        activeSession={activeSession}
        setActiveSession={setActiveSession}
        setMessages={setMessages}
        isAuthenticated={isAuthenticated}
        logout={logout}
        isMobile={isMobile}
        showRenameDialog={showRenameDialog}
        setShowRenameDialog={setShowRenameDialog}
        setSelectedSessionId={setSelectedSessionId}
        setNewTitle={setNewTitle}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-screen">
        {/* Header Component */}
        <ChatHeader setSidebarOpen={setSidebarOpen} isAuthenticated={isAuthenticated} />

        {/* Messages Component */}
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          latestMessageId={latestMessageId}
          setLatestMessageId={setLatestMessageId}
          messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
          activeSession={activeSession}
          setActiveSession={setActiveSession}
          sessions={sessions}
          setSessions={setSessions}
          actionCards={actionCards}
          handleCardClick={handleCardSubmit}
          isAuthenticated={isAuthenticated}
          user={user}
          setMessages={setMessages}
          refreshSessions={refreshSessions}
        />

        {/* Input Component */}
        <ChatInput
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          isMobile={isMobile}
        />
      </div>

      {/* Rename Dialog Component */}
      <RenameDialog
        showRenameDialog={showRenameDialog}
        setShowRenameDialog={setShowRenameDialog}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        selectedSessionId={selectedSessionId}
        setSelectedSessionId={setSelectedSessionId}
        handleRename={handleRename}
      />
    </div>
  )
}
