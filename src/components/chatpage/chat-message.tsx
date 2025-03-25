"use client"

import React from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { AnimatedText } from "@/components/animated-text"
import star from "../../../public/Image/Star 1.png"

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
  latestMessageId: string | null
  messagesEndRef: React.RefObject<HTMLDivElement>
  activeSession: string | null
  sessions: any[]
  actionCards: ActionCard[]
  handleCardClick: (card: ActionCard) => void
  isAuthenticated: boolean
  user: any
}

const ThinkingAnimation = () => {
  const [dots, setDots] = React.useState("")

  React.useEffect(() => {
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
      <span className="font-medium">Revi AI is thinking</span>
      <span className="inline-block w-8">{dots}</span>
    </div>
  )
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  latestMessageId,
  messagesEndRef,
  activeSession,
  sessions,
  actionCards,
  handleCardClick,
  isAuthenticated,
  user,
}) => {
  return (
    <div className="flex-1 overflow-y-auto mt-14" style={{ paddingBottom: "calc(70px + 1rem)" }}>
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:max-w-[600px] w-full text-center mx-auto">
              {actionCards.map((card) => (
                <Card
                  key={card.title}
                  className="p-4 transition-colors cursor-pointer md:py-8 bg-card border-border hover:bg-muted"
                  onClick={() => handleCardClick(card)}
                >
                  <div className="flex items-center justify-center gap-3 lg:flex-col">
                    <Image
                      src={card.image || "/placeholder.svg"}
                      alt={card.title}
                      width={44}
                      height={44}
                      className="w-11 h-11"
                      sizes="(max-width: 640px) 32px, 44px"
                    />
                    <div>
                      <h3 className="mb-1 font-medium text-foreground">{card.title}</h3>
                      <p className="hidden text-sm text-muted-foreground md:block">{card.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start self-start w-full pb-20 space-y-4">
            {messages.map((message: any, index: number) => (
              <div key={index} className="w-full space-y-2">
                <div className={`flex justify-end w-full`}>
                  <div className={`max-w-[80%] rounded-lg p-4 bg-card text-foreground `}>
                    <p className="whitespace-pre-wrap">{message?.prompt}</p>
                  </div>
                </div>
                {message?.response && (
                  <div className={`flex justify-start w-full`}>
                    <div className="flex items-start gap-2 md:gap-4 md:max-w-[80%] rounded-lg p-4 text-foreground">
                      <Image
                        src={star || "/placeholder.svg"}
                        alt="Response Image"
                        className="object-cover w-8 h-8 rounded-full md:w-8 md:h-8"
                      />
                      <div className="flex-1 min-w-0">
                        {message.id === latestMessageId ? (
                          <AnimatedText text={message?.response} speed={50} batchSize={3} />
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
                    <Image
                      src={star || "/placeholder.svg"}
                      alt="Response Image"
                      className="object-cover w-8 h-8 rounded-full md:w-8 md:h-8"
                    />
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
  )
}

export default ChatMessages

