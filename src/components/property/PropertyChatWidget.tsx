"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bed, Bath, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chatAPI } from "@/lib/api/chat.api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface SimilarProperty {
  id: string;
  title: string;
  price?: string;
  location?: string;
  bedrooms?: number;
  bathrooms?: number;
  image_url?: string;
  similarity_score?: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  similar_properties?: SimilarProperty[];
}

interface PropertyChatWidgetProps {
  propertyId: string;
  propertyTitle?: string;
}

export default function PropertyChatWidget({
  propertyId,
  propertyTitle,
}: PropertyChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [streamingSimilarProperties, setStreamingSimilarProperties] = useState<SimilarProperty[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage, streamingSimilarProperties]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingMessage("");
    setStreamingSimilarProperties([]);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    // Detect if user is asking for comparison/similar properties
    const isComparisonQuery = /\b(compare|similar|alternative|other|like this|recommend|suggest)\b/i.test(userMessage.content);

    try {
      const response = await chatAPI.propertyChat(
        propertyId,
        userMessage.content,
        {
          useStreaming: false, // Disabled streaming - backend returns JSON response
          includeSimilarProperties: isComparisonQuery,
          signal: abortControllerRef.current.signal,
        }
      );

      // Create assistant message with the response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer,
        timestamp: new Date(),
        similar_properties: response.similar_properties || [],
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request cancelled");
      } else {
        console.error("Error sending message:", error);
        toast({
          title: "Error",
          description: "Failed to get response. Please try again.",
          variant: "destructive",
        });
      }
      setStreamingMessage("");
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setStreamingMessage("");
    setStreamingSimilarProperties([]);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Chat Button - Yellow/Gold for Property Chat */}
      {!isOpen && (
        <Button
          onClick={handleToggle}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-yellow-600 hover:to-orange-600 text-white transition-all duration-300 hover:scale-110"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 bg-background border border-border shadow-2xl transition-all duration-300 ease-in-out",
            // Mobile: Full screen bottom sheet
            "bottom-0 left-0 right-0 h-[70vh] rounded-t-2xl",
            // Desktop: Bottom-right floating panel
            "md:bottom-6 md:right-6 md:left-auto md:w-[400px] md:h-[600px] md:rounded-2xl"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm rounded-t-2xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Property Assistant
                </h3>
                {propertyTitle && (
                  <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                    {propertyTitle}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggle}
              className="h-8 w-8 hover:bg-secondary/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100%-140px)]">
            {messages.length === 0 && !streamingMessage && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm mb-1">
                  Ask me anything about this property
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Reviews, amenities, location, and more
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>

                {/* Similar Properties */}
                {message.role === "assistant" && message.similar_properties && message.similar_properties.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Similar Properties:</p>
                    {message.similar_properties.map((property) => (
                      <div
                        key={property.id}
                        onClick={() => router.push(`/social-feed/property/${property.id}`)}
                        className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex gap-3">
                          {property.image_url && (
                            <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                              <Image
                                src={property.image_url}
                                alt={property.title}
                                fill
                                className="object-cover"
                                unoptimized={property.image_url.startsWith('http')}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-foreground truncate">
                              {property.title}
                            </h4>
                            {property.location && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {property.location}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              {property.bedrooms && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Bed className="w-3 h-3" />
                                  {property.bedrooms}
                                </span>
                              )}
                              {property.bathrooms && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Bath className="w-3 h-3" />
                                  {property.bathrooms}
                                </span>
                              )}
                              {property.price && (
                                <span className="text-xs font-semibold text-primary">
                                  {property.price}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Streaming message */}
            {streamingMessage && (
              <div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-secondary text-secondary-foreground">
                    <p className="whitespace-pre-wrap break-words">
                      {streamingMessage}
                    </p>
                  </div>
                </div>

                {/* Streaming Similar Properties */}
                {streamingSimilarProperties.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Similar Properties:</p>
                    {streamingSimilarProperties.map((property) => (
                      <div
                        key={property.id}
                        onClick={() => router.push(`/social-feed/property/${property.id}`)}
                        className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex gap-3">
                          {property.image_url && (
                            <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                              <Image
                                src={property.image_url}
                                alt={property.title}
                                fill
                                className="object-cover"
                                unoptimized={property.image_url.startsWith('http')}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-foreground truncate">
                              {property.title}
                            </h4>
                            {property.location && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {property.location}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              {property.bedrooms && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Bed className="w-3 h-3" />
                                  {property.bedrooms}
                                </span>
                              )}
                              {property.bathrooms && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Bath className="w-3 h-3" />
                                  {property.bathrooms}
                                </span>
                              )}
                              {property.price && (
                                <span className="text-xs font-semibold text-primary">
                                  {property.price}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && !streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-secondary text-secondary-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background/95 backdrop-blur-sm rounded-b-2xl">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this property..."
                className="flex-1 px-4 py-2 bg-secondary/50 border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                disabled={isLoading}
                maxLength={500}
              />
              {isLoading ? (
                <Button
                  type="button"
                  onClick={handleStop}
                  size="icon"
                  variant="destructive"
                  className="h-10 w-10 rounded-full flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim()}
                  className="h-10 w-10 rounded-full flex-shrink-0 bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
