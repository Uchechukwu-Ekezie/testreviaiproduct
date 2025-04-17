"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { AnimatedText } from "@/components/animated-text"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import star from "../../../public/Image/Star 1.png"
import { chatAPI } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"

import TellYourStoryPopup from "../tell-your-story"
import ReportYourLandlord from "../landlord-popup"

interface Message {
  id: string
  prompt?: string
  response?: string
  session?: string | null
  error?: boolean
  retrying?: boolean
  isNewSession?: boolean
}

interface ActionCard {
  title: string
  description: string
  image: any
  message: string
}

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  latestMessageId: string | null
  setLatestMessageId: React.Dispatch<React.SetStateAction<string | null>>
  messagesEndRef: React.RefObject<HTMLDivElement>
  activeSession: string | null
  setActiveSession: React.Dispatch<React.SetStateAction<string | null>>
  sessions: any[]
  setSessions: React.Dispatch<React.SetStateAction<any[]>>
  actionCards: ActionCard[]
  handleCardClick?: (card: ActionCard) => void
  isAuthenticated: boolean
  user: any
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  refreshSessions: () => Promise<void>
}

const ThinkingAnimation = () => {
  const [dots, setDots] = React.useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return ""
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center">
      <span className="font-medium">Thinking</span>
      <span className="inline-block w-8">{dots}</span>
    </div>
  )
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  setIsLoading,
  latestMessageId,
  setLatestMessageId,
  messagesEndRef,
  activeSession,
  setActiveSession,
  sessions,
  setSessions,
  actionCards,
  handleCardClick,
  isAuthenticated,
  user,
  setMessages,
  refreshSessions,
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [cardLoading, setCardLoading] = useState<string | null>(null)
  const [showLandlordVerification, setShowLandlordVerification] = useState(false)
  const [showTellYourStory, setShowTellYourStory] = useState(false)
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null)

  // Remove the preventMessageFetch state as it's not needed and might cause loops
  // const [preventMessageFetch, setPreventMessageFetch] = useState(false)

  // Debug log for messages state
  // useEffect(() => {
  //   if (messages.length > 0) {
  //     console.log(
  //       "Current messages state:",
  //       messages.map((m) => ({
  //         id: m.id,
  //         hasResponse: !!m.response,
  //         hasError: !!m.error,
  //         isNewSession: !!m.isNewSession,
  //         session: m.session,
  //       })),
  //     )
  //   }
  // }, [messages])

  // Add this effect to properly manage the message fetching prevention
  // useEffect(() => {
  //   // If we have an active session and a pending message (no response yet)
  //   if (activeSession && messages.length > 0 && messages.some((msg) => !msg.response && !msg.error)) {
  //     console.log("Setting preventMessageFetch to true for session with pending message")
  //     setPreventMessageFetch(true)
  //   } else {
  //     setPreventMessageFetch(false)
  //   }
  // }, [activeSession, messages])

  // Function to scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [])

  // Scroll when messages change or loading state changes
  useEffect(() => {
    // Add a small delay to ensure the new message is rendered
    setTimeout(() => {
      scrollToBottom()
    }, 100) // Adjust the delay as needed
  }, [messages, isLoading, scrollToBottom])

  // Handle text updates during animation
  const handleTextUpdate = useCallback(() => {
    // Add a small delay after text update as well
    setTimeout(() => {
      scrollToBottom()
    }, 100)
  }, [scrollToBottom])

  // Function to retry a failed message
  const retryMessage = async (message: Message) => {
    if (!message.prompt || !activeSession || retryingMessageId) return

    setRetryingMessageId(message.id)

    try {
      // Mark the message as retrying
      setMessages((prev) => prev.map((msg) => (msg.id === message.id ? { ...msg, retrying: true, error: false } : msg)))

      // Retry sending the message
      const data = await chatAPI.postNewChat(message.prompt, activeSession)

      // Update the message with the response
      setLatestMessageId(data.id)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id
            ? { ...data, prompt: message.prompt, session: activeSession, retrying: false, error: false }
            : msg,
        ),
      )

      // Scroll to bottom after receiving response
      setTimeout(scrollToBottom, 100)

      toast({
        title: "Success",
        description: "Message retry successful",
      })
    } catch (error: any) {
      console.error("Error retrying message:", error)

      // Mark the message as failed
      setMessages((prev) => prev.map((msg) => (msg.id === message.id ? { ...msg, retrying: false, error: true } : msg)))

      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to retry message",
        variant: "destructive",
      })
    } finally {
      setRetryingMessageId(null)
    }
  }

  // Direct submission when card is clicked
  const handleCardSubmit = async (card: ActionCard) => {
    if (isLoading || cardLoading) return

    // Set loading state for this card
    setCardLoading(card.title)

    // Special case for "Tell your story" card
    if (card.title === "Tell your story") {
      // Show the Tell Your Story popup instead of adding a message
      setShowTellYourStory(true)

      // Reset card loading state after a delay
      setTimeout(() => {
        setCardLoading(null)
      }, 500)

      return
    }

    // Special case for "Verify a Landlord"
    if (card.title === "Report your Landlord") {
      // Show the landlord verification popup
      setShowLandlordVerification(true)

      // Reset card loading state after a delay
      setTimeout(() => {
        setCardLoading(null)
      }, 500)

      return
    }

    // If external handler exists, call it first (for backward compatibility)
    if (handleCardClick) {
      try {
        // DO NOT add a message here - let the parent component handle it
        // The parent component will add the message through its own logic

        // Call the handler
        await handleCardClick(card)
      } catch (error: any) {
        console.error("Error in handleCardClick:", error)

        // Show error toast
        toast({
          title: "Error",
          description: "The server encountered an error. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setTimeout(() => {
          setCardLoading(null)
        }, 500)
      }
      return
    }

    // Start direct submission process
    setIsLoading(true)
    const messageText = card.message

    // Check if we already have this message to prevent duplicates
    const isDuplicate = messages.some(
      (msg) => msg.prompt === messageText && (!msg.response || msg.response === "") && msg.session === activeSession,
    )

    if (!isDuplicate) {
      // Create a temporary message to show immediately
      const tempId = `temp-${Date.now()}`
      const userMessage = { id: tempId, prompt: messageText, response: "" }

      // Add the message to the UI immediately
      setMessages((prev) => [...prev, userMessage])
    }

    try {
      let data
      let currentSessionId = activeSession

      if (!currentSessionId) {
        // Create new session
        const sessionData = {
          chat_title: messageText.substring(0, 30),
          user: user?.id || "guest",
        }

        // Mark this message as a new session message to prevent message fetching
        setMessages((prev) =>
          prev.map((msg) => (msg.prompt === messageText && !msg.response ? { ...msg, isNewSession: true } : msg)),
        )

        // Create session first
        const sessionResponse = await chatAPI.createChatSession(sessionData)
        currentSessionId = sessionResponse.id

        // Set active session immediately and keep it in a local variable
        setActiveSession(currentSessionId)

        // Update sessions list with the new session
        setSessions((prev) => {
          if (!prev.some((s) => s.id === currentSessionId)) {
            return [sessionResponse, ...prev]
          }
          return prev
        })

        // Update the temporary message with the new session ID and isNewSession flag
        setMessages((prev) =>
          prev.map((msg) =>
            msg.prompt === messageText && !msg.response
              ? { ...msg, session: currentSessionId, isNewSession: true }
              : msg,
          ),
        )

        // Now post the message using the new session ID
        data = await chatAPI.postNewChat(messageText, currentSessionId || undefined)

        // Refresh sessions after a short delay
        setTimeout(() => {
          refreshSessions()
          // Ensure active session is still set correctly
          setActiveSession(currentSessionId)
        }, 500)
      } else {
        // Use existing session
        data = await chatAPI.postNewChat(messageText, currentSessionId)
      }

      // Update the message with the response
      setLatestMessageId(data.id)

      // Update messages, ensuring we don't duplicate
      setMessages((prev) => {
        // Find any temporary message with this prompt
        const tempIndex = prev.findIndex((msg) => msg.prompt === messageText && !msg.response && !msg.error)

        if (tempIndex >= 0) {
          // Replace the temporary message with the real one
          const newMessages = [...prev]
          newMessages[tempIndex] = data
          return newMessages
        } else {
          // Check if we already have this message
          const existingIndex = prev.findIndex((msg) => msg.id === data.id)
          if (existingIndex >= 0) {
            // Update the existing message
            const newMessages = [...prev]
            newMessages[existingIndex] = data
            return newMessages
          } else {
            // Add as a new message
            return [...prev, data]
          }
        }
      })

      // Scroll to bottom after receiving response
      setTimeout(scrollToBottom, 100)
    } catch (error: any) {
      console.error("Error submitting card message:", error)

      // Update any temporary message to show it failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.prompt === messageText && !msg.response ? { ...msg, error: true, session: activeSession } : msg,
        ),
      )

      // Show error toast
      toast({
        title: "Error",
        description: "The server encountered an error. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setCardLoading(null)
    }
  }

  return (
    <>
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mt-14"
        style={{
          paddingBottom: "calc(70px + 1rem)",
        }}
      >
        <div className="flex flex-col w-full max-w-5xl p-4 mx-auto">
          {/* Show active session title when messages exist */}
          {activeSession && messages.length > 0 && (
            <div className="w-full pb-2 mb-4 border-b border-border">
              <h2 className="font-medium text-md text-foreground">
                {sessions.find((s: any) => s.id === activeSession)?.chat_title || "Chat Session"}
              </h2>
              <p className="text-xs text-muted-foreground">Continue your conversation in this session</p>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)]">
              <h1 className="mb-8 text-xl text-center text-foreground">
                {isAuthenticated
                  ? `Hi ${
                      user?.first_name ? user?.first_name + " " + user?.last_name : "there"
                    }! How can I assist you today?`
                  : "Hi! How can I assist you today?"}
              </h1>

              {/* First two cards */}
              <div className="grid grid-cols-2 gap-3 w-full text-center mx-auto max-w-[600px]">
                {actionCards.slice(0, 2).map((card, index) => (
                  <Card
                    key={card.title}
                    className={`md:p-1 py-[0.5px] transition-colors cursor-pointer border-[1px] border-border md:py-8 bg-card hover:bg-muted rounded-full md:rounded-[10px] ${
                      cardLoading === card.title || isLoading ? "opacity-70 pointer-events-none" : ""
                    }`}
                    onClick={() => handleCardSubmit(card)}
                  >
                    <div className="flex items-center justify-center gap-3 lg:flex-col">
                      <div className="p-2 md:border-2 border-border md:block rounded-[10px]">
                        <Image
                          src={card.image || "/placeholder.svg"}
                          alt={card.title}
                          width={24}
                          height={24}
                          className="w-5 h-5 md:ml-0 md:w-[24px] md:h-[24px] md:block"
                        />
                      </div>
                      <div className="text-center">
                        <h3 className="md:mb-1 md:font-medium text-foreground text-[14px] md:text-[15px] text-wrap overflow-hidden text-ellipsis">
                          {card.title}
                        </h3>
                        <p className="hidden text-sm text-muted-foreground md:block">{card.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Last two cards with specific widths */}
              <div className="flex flex-col justify-center w-full gap-4 mt-4 md:flex-row md:w-[600px]">
                {actionCards.slice(2).map((card, index) => (
                  <Card
                    key={card.title}
                    className={`md:p-1 py-[0.5px] transition-colors cursor-pointer rounded-full md:rounded-[10px] border-[1px] border-border md:py-8 bg-card hover:bg-muted mx-auto ${
                      cardLoading === card.title || isLoading ? "opacity-70 pointer-events-none" : ""
                    } ${index === 0 ? "md:w-full w-[155px]" : "md:w-full w-[210px]"}`}
                    onClick={() => handleCardSubmit(card)}
                  >
                    <div className="flex items-center justify-center gap-3 lg:flex-col">
                      <div className="p-2 md:border-2 border-border md:block rounded-[10px]">
                        <Image
                          src={card.image || "/placeholder.svg"}
                          alt={card.title}
                          width={24}
                          height={24}
                          className="w-5 h-5 md:ml-0 md:w-[24px] md:h-[24px] md:block"
                        />
                      </div>
                      <div className="text-center">
                        <h3 className="md:mb-1 md:font-medium text-foreground text-[14px] md:text-[15px] text-wrap overflow-hidden text-ellipsis">
                          {card.title}
                        </h3>
                        <p className="hidden text-sm text-muted-foreground md:block">{card.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start self-start w-full max-w-[880px] mx-auto pb-20 space-y-4 text-[15px] font-normal text-muted-foreground">
              {messages.map((message: any, index: number) => (
                <div key={index} className="w-full space-y-2">
                  <div className={`flex justify-end w-full`}>
                    <div className={`max-w-[80%] rounded-lg p-4 bg-card`}>
                      <p className="whitespace-pre-wrap">{message?.prompt}</p>
                    </div>
                  </div>

                  {message?.response ? (
                    <div className={`flex justify-start w-full`}>
                      <div className="flex items-start gap-2 md:gap-4 md:max-w-[80%] rounded-lg p-4">
                        <Image
                          src={star || "/placeholder.svg"}
                          alt="Response Image"
                          className="object-cover w-8 h-8 rounded-full md:w-8 md:h-8"
                        />
                        <div className="flex-1 min-w-0">
                          {message.id === latestMessageId ? (
                            <AnimatedText
                              text={message?.response}
                              speed={50}
                              batchSize={3}
                              onTextUpdate={handleTextUpdate}
                            />
                          ) : (
                            <p className="whitespace-pre-wrap">{message?.response}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : message.error ? (
                    <div className={`flex justify-start w-full`}>
                      <div className="flex items-start gap-2 md:gap-4 md:max-w-[80%] rounded-lg p-4 bg-red-50 border border-red-200">
                        <div className="flex-1 min-w-0">
                          <p className="mb-2 text-red-600">The server encountered an error processing this message.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => retryMessage(message)}
                            disabled={!!retryingMessageId}
                            className="flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            {message.id === retryingMessageId ? "Retrying..." : "Retry"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start w-full">
                  <div className="max-w-[80%] rounded-lg p-4 text-foreground">
                    <div className="flex items-center gap-2 md:gap-4">
                      <ThinkingAnimation />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Popups */}
      <ReportYourLandlord isOpen={showLandlordVerification} onClose={() => setShowLandlordVerification(false)} />
      <TellYourStoryPopup isOpen={showTellYourStory} onClose={() => setShowTellYourStory(false)} />
    </>
  )
}

export default ChatMessages
