"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { AnimatedText } from "@/components/animated-text"
import star from "../../../public/Image/Star 1.png"
import { chatAPI } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import LandlordVerificationPopup from "../landlord-popup"
import LandlordVerificationLink from "../landlord-verify"

interface Message {
  id: string
  prompt?: string
  response?: string
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

  // Direct submission when card is clicked
  const handleCardSubmit = async (card: ActionCard) => {
    if (isLoading || cardLoading) return

    // Set loading state for this card
    setCardLoading(card.title)

    // Special case for "Tell your story" card
    if (card.title === "Tell your story") {
      const tempResponseMessage = {
        id: `temp-response-${Date.now()}`,
        prompt: card.message,
        response:
          "You can share your experience with your landlord through our dedicated experience page. This feature is available in our main site as it's still being integrated with our main platform.\n\n[Click here to share your experience](https://www.reviai.tech/experience)",
      }

      setMessages((prev) => [...prev, tempResponseMessage])

      // Scroll to bottom after a short delay
      setTimeout(() => {
        scrollToBottom()
      }, 100)

      // Reset card loading state after a delay
      setTimeout(() => {
        setCardLoading(null)
      }, 500)

      return
    }

    // Special case for "Verify a Landlord"
    if (card.title === "Verify a Landlord") {
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
      handleCardClick(card)
      setTimeout(() => {
        setCardLoading(null)
      }, 500)
      return
    }

    // Start direct submission process
    setIsLoading(true)
    const messageText = card.message

    // Create a temporary message to show immediately
    const tempId = `temp-${Date.now()}`
    const userMessage = { id: tempId, prompt: messageText, response: "" }
    setMessages((prev) => [...prev, userMessage])

    try {
      let data
      if (activeSession) {
        // Use existing session
        data = await chatAPI.postNewChat(messageText, activeSession)
      } else {
        // Create new session
        const sessionData = {
          chat_title: messageText.substring(0, 30),
          user: user?.id || "guest",
        }

        const sessionResponse = await chatAPI.createChatSession(sessionData)
        setActiveSession(sessionResponse.id)

        data = await chatAPI.postNewChat(messageText, sessionResponse.id)

        // Update sessions list
        setSessions((prev) => {
          if (!prev.some((s) => s.id === sessionResponse.id)) {
            return [...prev, sessionResponse]
          }
          return prev
        })

        // Refresh sessions after a short delay
        setTimeout(() => {
          refreshSessions()
        }, 500)
      }

      // Update the message with the response
      setLatestMessageId(data.id)
      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? data : msg)))

      // Scroll to bottom after receiving response
      setTimeout(scrollToBottom, 100)
    } catch (error: any) {
      console.error("Error submitting card message:", error)

      // Remove the temporary message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))

      // Show error toast
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send message",
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
                  {message?.response && (
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
                          ) : message.response.includes("[Click here to share your experience]") ? (
                            <div className="whitespace-pre-wrap">
                              {message.response.split("[Click here to share your experience]")[0]}
                              <LandlordVerificationLink url="https://www.reviai.tech/experience">
                                Click here to share your experience
                              </LandlordVerificationLink>
                              {message.response.split("(")[1]?.includes(")")
                                ? message.response.split(")")[1] || ""
                                : ""}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{message?.response}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
      <LandlordVerificationPopup isOpen={showLandlordVerification} onClose={() => setShowLandlordVerification(false)} />
    </>
  )
}

export default ChatMessages
