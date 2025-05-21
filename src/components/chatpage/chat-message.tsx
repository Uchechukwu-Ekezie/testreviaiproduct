"use client";

import { useRouter, usePathname } from "next/navigation";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  ArrowDown,
  Edit,
  MapPin,
  Heart,
  Phone,
  Eye,
  Trash2,
  Loader2,
} from "lucide-react";
import star from "../../../public/Image/Star 1.png";
import { chatAPI } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import TellYourStoryPopup from "../tell-your-story";
import ReportYourLandlord from "../landlord-popup";
import { Textarea } from "../ui/textarea";
import PropertyActions from "../propertyActions";
import type {
  ActionCard,
  ChatMessagesProps,
  Context,
  Message,
} from "@/types/chatMessage";
import ProgressiveMarkdownRenderer from "../progressivemarkdown";
import { LoaderAnimation } from "../ui/loader-animation";

const parsePropertyData = (message: any): Context[] => {
  try {
    // First check if context is already an array
    if (Array.isArray(message.context)) {
      console.log("Context is already an array, returning directly");
      return message.context;
    }

    // If context is a string, try to parse it
    if (typeof message.context === "string" && message.context.trim()) {
      try {
        // Get the raw string for debugging
        console.log(
          "Raw context string:",
          message.context.substring(0, 200) + "..."
        );

        // Direct string replacement approach
        let processedString = message.context
          .replace(/None/g, "null")
          .replace(/True/g, "true")
          .replace(/False/g, "false")
          .replace(/UUID\(["']?([^"')]+)["']?\)/g, '"$1"') // Fix UUID
          .replace(/uuid\(["']?([^"')]+)["']?\)/g, '"$1"') // Fix uuid
          .replace(/'/g, '"')
          .replace(/"nan"/g, "null")
          .replace(/\n/g, " ")
          .replace(/,\s*}/g, "}")
          .replace(/,\s*\]/g, "]");

        // Ensure it's a valid JSON array
        if (!processedString.trim().startsWith("[")) {
          processedString = `[${processedString}]`;
        }

        console.log(
          "Processed string:",
          processedString.substring(0, 200) + "..."
        );

        try {
          const parsed = JSON.parse(processedString);
          console.log(
            "Successfully parsed properties from message.context, found",
            Array.isArray(parsed) ? parsed.length : 1,
            "properties"
          );
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch (jsonError) {
          console.error("Failed to parse with JSON.parse:", jsonError);

          // Last resort - try to extract individual property objects
          const properties: Context[] = [];

          // IMPROVED: Better approach to extract multiple property objects
          // First, ensure the string starts with [ and ends with ]
          let contextStr = message.context.trim();
          if (!contextStr.startsWith("[")) contextStr = "[" + contextStr;
          if (!contextStr.endsWith("]")) contextStr = contextStr + "]";

          // Split by "}, {" to get individual objects
          const objectStrings = contextStr
            .replace(/^\[/, "") // Remove leading [
            .replace(/\]$/, "") // Remove trailing ]
            .split(/},\s*{/);

          console.log(
            `Found ${objectStrings.length} potential property objects`
          );

          // Process each object string
          objectStrings.forEach((objStr: string, index: number) => {
            try {
              // Add back the curly braces that were removed in the split
              if (!objStr.startsWith("{")) objStr = "{" + objStr;
              if (!objStr.endsWith("}")) objStr = objStr + "}";

              // Clean the object string
              let cleanedObj: string = objStr
                .replace(/UUID\(['"]([^'"]+)['"]\)/g, '"$1"')
                .replace(/uuid\(['"]([^'"]+)['"]\)/g, '"$1"')
                .replace(/None/g, "null")
                .replace(/True/g, "true")
                .replace(/False/g, "false")
                .replace(/'/g, '"')
                .replace(/"nan"/g, "null")
                .replace(/\n/g, " ");

              // Ensure property names are quoted
              cleanedObj = cleanedObj.replace(
                /([{,]\s*)(\w+)(\s*:)/g,
                '$1"$2"$3'
              );

              // Fix trailing commas
              cleanedObj = cleanedObj.replace(/,\s*}/g, "}");

              console.log(
                `Processing object ${index + 1}:`,
                cleanedObj.substring(0, 100) + "..."
              );
              const obj: Context = JSON.parse(cleanedObj);
              properties.push(obj);
              console.log(`Successfully parsed object ${index + 1}`);
            } catch (objError: unknown) {
              console.error(`Failed to parse object ${index + 1}:`, objError);
            }
          });

          if (properties.length > 0) {
            console.log(
              `Successfully extracted ${properties.length} properties manually`
            );
            return properties;
          }

          // If all else fails, try a more aggressive approach - create mock properties
          if (
            typeof message.context === "string" &&
            message.context.includes("title") &&
            message.context.includes("price")
          ) {
            console.log("Creating mock properties from context");
            const mockProperties = [];

            // Extract all titles using regex
            const titleMatches = message.context.match(
              /['"]title['"]:\s*['"]([^'"]+)['"]/gi
            );
            const priceMatches = message.context.match(
              /['"]price['"]:\s*['"]([^'"]+)['"]/gi
            );
            const addressMatches = message.context.match(
              /['"]address['"]:\s*['"]([^'"]+)['"]/gi
            );

            // Determine how many properties we can create
            const count = Math.max(
              titleMatches ? titleMatches.length : 0,
              priceMatches ? priceMatches.length : 0,
              addressMatches ? addressMatches.length : 0
            );

            for (let i = 0; i < count; i++) {
              // Extract values using regex
              const titleMatch =
                titleMatches && titleMatches[i]
                  ? /['"]title['"]:\s*['"]([^'"]+)['"]/i.exec(titleMatches[i])
                  : null;
              const priceMatch =
                priceMatches && priceMatches[i]
                  ? /['"]price['"]:\s*['"]([^'"]+)['"]/i.exec(priceMatches[i])
                  : null;
              const addressMatch =
                addressMatches && addressMatches[i]
                  ? /['"]address['"]:\s*['"]([^'"]+)['"]/i.exec(
                      addressMatches[i]
                    )
                  : null;

              const title = titleMatch ? titleMatch[1] : `Property ${i + 1}`;
              const price = priceMatch ? priceMatch[1] : "Price on request";
              const address = addressMatch
                ? addressMatch[1]
                : "Address not available";

              // Create a mock property with the extracted data
              const mockProperty = {
                id: `mock-${Date.now()}-${i}`,
                title: title,
                price: price,
                address: address,
                status: "for_rent",
                description: "Property details could not be fully parsed",
              };

              mockProperties.push(mockProperty);
            }

            if (mockProperties.length > 0) {
              console.log(`Created ${mockProperties.length} mock properties`);
              return mockProperties;
            }
          }
        }
      } catch (contextError) {
        console.error("Failed to parse message.context:", contextError);
      }
    }

    // If we get here, we couldn't parse the property data
    console.error("Could not parse property data from context");
    return [];
  } catch (e) {
    console.error("Error in parsePropertyData:", e);
    return [];
  }
};

const toProperty = (property: any) => {
  return property;
};

const ThinkingAnimation = () => {
  const [dots, setDots] = React.useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center">
      <div className="flex space-x-2">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
          className="w-2 h-2 rounded-full bg-foreground"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            delay: 0.2,
          }}
          className="w-2 h-2 rounded-full bg-foreground"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            delay: 0.4,
          }}
          className="w-2 h-2 rounded-full bg-foreground"
        />
      </div>
      <span className="ml-3 font-medium">Thinking{dots}</span>
    </div>
  );
};

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  setIsLoading,
  isSessionLoading = false,
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
  sidebarCollapsed = false, // Default value if not provided
  sidebarOpen = false, // Default value if not provided
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [cardLoading, setCardLoading] = useState<string | null>(null);
  const [showLandlordVerification, setShowLandlordVerification] =
    useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedPrompt, setEditedPrompt] = useState<string>("");
  const [showTellYourStory, setShowTellYourStory] = useState(false);
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(
    null
  );
  const [feedbackGiven, setFeedbackGiven] = useState<
    Record<string, "up" | "down" | null>
  >({});
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  // Add state to cache parsed property data
  const [parsedPropertyData, setParsedPropertyData] = useState<
    Record<string, Context[]>
  >({});
  // Add state to track parsing errors
  const [parsingErrors, setParsingErrors] = useState<Record<string, string>>(
    {}
  );
  // Add state to track property loading status
  const [propertyLoading, setPropertyLoading] = useState<
    Record<string, boolean>
  >({});
  const [textAnimationCompleted, setTextAnimationCompleted] = useState<
    Record<string, boolean>
  >({});

  // Handle URL changes when session changes
  useEffect(() => {
    if (activeSession && pathname !== `/chats/${activeSession}`) {
      router.replace(`/chats/${activeSession}/`, {});
    }
  }, [activeSession, router, pathname]);

  // Update the useEffect for property parsing
  useEffect(() => {
    const parseProperties = async () => {
      const newMessages = messages.filter(
        (message) =>
          message.classification === "Property Search" &&
          message.response &&
          !parsedPropertyData[message.id]
      );

      if (newMessages.length === 0) return;

      for (const message of newMessages) {
        try {
          // Set loading state for this message's properties
          setPropertyLoading((prev) => ({ ...prev, [message.id]: true }));

          // Parse the property data immediately
          const propertyData = parsePropertyData(message);

          // Update the parsed data state
          if (propertyData.length > 0) {
            setParsedPropertyData((prev) => ({
              ...prev,
              [message.id]: propertyData,
            }));

            // Clear any previous parsing errors
            setParsingErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors[message.id];
              return newErrors;
            });
          } else {
            setParsingErrors((prev) => ({
              ...prev,
              [message.id]: "No properties found in the data",
            }));
          }
        } catch (error) {
          console.error("Error parsing property data:", error);
          setParsingErrors((prev) => ({
            ...prev,
            [message.id]:
              error instanceof Error ? error.message : "Unknown parsing error",
          }));
        } finally {
          setPropertyLoading((prev) => ({ ...prev, [message.id]: false }));
        }
      }
    };

    parseProperties();
  }, [messages]);

  // const handleLoadProperties = async (messageId: string) => {
  //   const message = messages.find(m => m.id === messageId);
  //   if (!message) return;

  //   setPropertyLoading((prev) => ({ ...prev, [messageId]: true }));

  //   try {
  //     const propertyData = parsePropertyData(message);
  //     if (propertyData.length > 0) {
  //       setParsedPropertyData((prev) => ({
  //         ...prev,
  //         [messageId]: propertyData,
  //       }));
  //       setParsingErrors((prev) => {
  //         const newErrors = { ...prev };
  //         delete newErrors[messageId];
  //         return newErrors;
  //       });
  //     } else {
  //       setParsingErrors((prev) => ({
  //         ...prev,
  //         [messageId]: 'No properties found in the data',
  //       }));
  //     }
  //   } catch (error) {
  //     console.error('Error parsing property data:', error);
  //     setParsingErrors((prev) => ({
  //       ...prev,
  //       [messageId]: error instanceof Error ? error.message : 'Unknown parsing error',
  //     }));
  //   } finally {
  //     setPropertyLoading((prev) => ({ ...prev, [messageId]: false }));
  //   }
  // };

  // Function to scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const threshold = 100;
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;

      if (distanceFromBottom > threshold) {
        setIsAutoScrollEnabled(false);
      } else {
        setIsAutoScrollEnabled(true);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll when messages change or loading state changes
  useEffect(() => {
    if (!isAutoScrollEnabled || !chatContainerRef.current) return;

    const isUserAtBottom =
      chatContainerRef.current.scrollTop +
        chatContainerRef.current.clientHeight >=
      chatContainerRef.current.scrollHeight - 50; // Adjust threshold as needed

    const timer = setTimeout(() => {
      if (isUserAtBottom) {
        scrollToBottom();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [
    messages,
    isLoading,
    scrollToBottom,
    isAutoScrollEnabled,
    parsedPropertyData,
  ]);

  // Handle text updates during animation
  const handleTextUpdate = useCallback(() => {
    if (!chatContainerRef.current) return;
    const isUserAtBottom =
      chatContainerRef.current.scrollTop +
        chatContainerRef.current.clientHeight >=
      chatContainerRef.current.scrollHeight - 50;

    setTimeout(() => {
      if (isUserAtBottom && isAutoScrollEnabled) {
        scrollToBottom();
      }
    }, 100);
  }, [scrollToBottom, isAutoScrollEnabled]);

  const handleResendMessage = async (
    messageId: string,
    newPrompt: string,
    sessionId: string
  ) => {
    try {
      const originalMessage = messages.find((m) => m.id === messageId);
      if (!originalMessage) {
        console.error("Original message not found with ID:", messageId);
        return;
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, prompt: newPrompt } : m))
      );

      if (!newPrompt || !sessionId) {
        throw new Error("Prompt and session ID are required");
      }

      const requestData = {
        prompt: newPrompt,
        session: sessionId,
      };

      const response = await chatAPI.editChat(
        messageId,
        requestData.prompt,
        requestData.session
      );

      toast({
        title: "Message updated",
        description: "Your message has been edited successfully",
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, response: response.response } : m
        )
      );

      // Clear cached property data for this message to force re-parsing
      setParsedPropertyData((prev) => {
        const newData = { ...prev };
        delete newData[messageId];
        return newData;
      });
    } catch (error) {
      console.error("Failed to resend message:", error);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, error: true } : m))
      );
    }
  };

  const retryMessage = async (message: Message) => {
    if (!message.prompt || !activeSession || retryingMessageId) return;

    setRetryingMessageId(message.id);

    try {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id ? { ...msg, retrying: true, error: false } : msg
        )
      );

      const data = await chatAPI.postNewChat(message.prompt, activeSession);

      setLatestMessageId(data.id);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id
            ? {
                ...data,
                prompt: message.prompt,
                session: activeSession,
                retrying: false,
                error: false,
              }
            : msg
        )
      );

      // Clear cached property data for this message to force re-parsing
      setParsedPropertyData((prev) => {
        const newData = { ...prev };
        delete newData[message.id];
        return newData;
      });

      setTimeout(scrollToBottom, 100);

      toast({
        title: "Success",
        description: "Message retry successful",
      });
    } catch (error: any) {
      console.error("Error retrying message:", error);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id ? { ...msg, retrying: false, error: true } : msg
        )
      );

      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to retry message",
        variant: "destructive",
      });
    } finally {
      setRetryingMessageId(null);
    }
  };

  const deleteChatById = async (chatId: string) => {
    try {
      await chatAPI.deleteChat(chatId);
      toast({
        title: "Success",
        description: "Chat deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting chat:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete chat",
        variant: "destructive",
      });
    }
  };

  const handleFeedback = (messageId: string, type: "up" | "down") => {
    setFeedbackGiven((prev) => ({ ...prev, [messageId]: type }));

    toast({
      title:
        type === "up"
          ? "Thanks for the positive feedback!"
          : "Thanks for your feedback",
      description: "Your input helps us improve our responses.",
      variant: type === "up" ? "default" : "destructive",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The response has been copied to your clipboard.",
      variant: "default",
    });
  };

  const handleCardSubmit = async (card: ActionCard) => {
    if (isLoading || cardLoading) return;

    setCardLoading(card.title);

    if (card.title === "Tell your story") {
      setShowTellYourStory(true);
      setTimeout(() => {
        setCardLoading(null);
      }, 500);
      return;
    }

    if (card.title === "Report your Landlord") {
      setShowLandlordVerification(true);
      setTimeout(() => {
        setCardLoading(null);
      }, 500);
      return;
    }

    if (handleCardClick) {
      try {
        await handleCardClick(card);
      } catch (error: any) {
        console.error("Error in handleCardClick:", error);
        toast({
          title: "Error",
          description:
            "The server encountered an error. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setTimeout(() => {
          setCardLoading(null);
        }, 500);
      }
      return;
    }

    setIsLoading(true);
    const messageText = card.message;

    const isDuplicate = messages.some(
      (msg) =>
        msg.prompt === messageText &&
        (!msg.response || msg.response === "") &&
        msg.session === activeSession
    );

    if (!isDuplicate) {
      const tempId = `temp-${Date.now()}`;
      const userMessage = { id: tempId, prompt: messageText, response: "" };
      setMessages((prev) => [...prev, userMessage]);
    }

    try {
      let data;
      let currentSessionId = activeSession;

      if (!currentSessionId) {
        const sessionData = {
          chat_title: messageText.substring(0, 30),
          user: user?.id || "guest",
        };

        setMessages((prev) =>
          prev.map((msg) =>
            msg.prompt === messageText && !msg.response
              ? { ...msg, isNewSession: true }
              : msg
          )
        );

        const sessionResponse = await chatAPI.createChatSession(sessionData);
        currentSessionId = sessionResponse.id;

        // Update URL with the new session ID
        router.push(`/chats/${currentSessionId}/`, undefined);
        setActiveSession(currentSessionId);

        setSessions((prev) => {
          if (!prev.some((s) => s.id === currentSessionId)) {
            return [sessionResponse, ...prev];
          }
          return prev;
        });

        setMessages((prev) =>
          prev.map((msg) =>
            msg.prompt === messageText && !msg.response
              ? { ...msg, session: currentSessionId, isNewSession: true }
              : msg
          )
        );

        data = await chatAPI.postNewChat(
          messageText,
          currentSessionId || undefined
        );

        setTimeout(() => {
          refreshSessions();
          setActiveSession(currentSessionId);
        }, 500);
      } else {
        data = await chatAPI.postNewChat(messageText, currentSessionId);
      }

      setLatestMessageId(data.id);
      setMessages((prev) => {
        const tempIndex = prev.findIndex(
          (msg) => msg.prompt === messageText && !msg.response && !msg.error
        );

        if (tempIndex >= 0) {
          const newMessages = [...prev];
          newMessages[tempIndex] = data;
          return newMessages;
        } else {
          const existingIndex = prev.findIndex((msg) => msg.id === data.id);
          if (existingIndex >= 0) {
            const newMessages = [...prev];
            newMessages[existingIndex] = data;
            return newMessages;
          } else {
            return [...prev, data];
          }
        }
      });

      setTimeout(scrollToBottom, 100);
    } catch (error: any) {
      console.error("Error submitting card message:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.prompt === messageText && !msg.response
            ? { ...msg, error: true, session: activeSession }
            : msg
        )
      );
      toast({
        title: "Error",
        description: "The server encountered an error. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setCardLoading(null);
    }
  };

  useEffect(() => {
    if (editingMessageId) {
      const message = messages.find((m) => m.id === editingMessageId);
      if (message) {
        setEditedPrompt(message.prompt || "");
      }
    }
  }, [editingMessageId, messages]);

  // Update the renderPropertyData function
  const renderPropertyData = (message: any) => {
    try {
      // Check if properties are loading
      if (propertyLoading[message.id]) {
        return (
          <div className="py-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 mb-2 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading properties...
              </p>
            </div>
          </div>
        );
      }

      // Use cached property data if available
      const context: Context[] = parsedPropertyData[message.id] || [];

      // If no cached data, try to parse it now and show loading state
      if (context.length === 0 && !parsingErrors[message.id]) {
        // Set loading state
        setPropertyLoading((prev) => ({ ...prev, [message.id]: true }));

        // Parse in the next tick to allow loading state to render
        setTimeout(() => {
          try {
            const newContext = parsePropertyData(message);

            // Update state with parsed data
            if (newContext.length > 0) {
              setParsedPropertyData((prev) => ({
                ...prev,
                [message.id]: newContext,
              }));

              // Clear any errors
              setParsingErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[message.id];
                return newErrors;
              });
            } else {
              setParsingErrors((prev) => ({
                ...prev,
                [message.id]: "No properties found in the data",
              }));
            }
          } catch (error) {
            console.error("Error parsing property data:", error);
            setParsingErrors((prev) => ({
              ...prev,
              [message.id]:
                error instanceof Error
                  ? error.message
                  : "Unknown parsing error",
            }));
          } finally {
            // Clear loading state
            setPropertyLoading((prev) => ({ ...prev, [message.id]: false }));
          }
        }, 0);

        // Return loading indicator while panrsing
        return (
          <div className="py-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 mb-2 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading properties...
              </p>
            </div>
          </div>
        );
      }

      // If we have parsing errors, show error message
      if (parsingErrors[message.id]) {
        return (
          <div className="py-4 text-center text-red-400">
            <p>Unable to parse property data</p>
            <p className="mt-2 text-sm">
              {parsingErrors[message.id] ||
                "Please check the format of your data"}
            </p>
            <details className="p-2 mt-4 text-xs text-left bg-gray-800 rounded">
              <summary>Debug Info</summary>
              <pre className="whitespace-pre-wrap overflow-auto max-h-[200px]">
                {typeof message.context === "string"
                  ? message.context.substring(0, 500) +
                    (message.context.length > 500 ? "..." : "")
                  : JSON.stringify(message.context, null, 2)}
              </pre>
            </details>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                // Force a re-parse of the property data
                setPropertyLoading((prev) => ({ ...prev, [message.id]: true }));

                setTimeout(() => {
                  try {
                    const newContext = parsePropertyData(message);
                    if (newContext.length > 0) {
                      setParsedPropertyData((prev) => ({
                        ...prev,
                        [message.id]: newContext,
                      }));
                      // Clear error
                      setParsingErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors[message.id];
                        return newErrors;
                      });

                      toast({
                        title: "Success",
                        description: `Found ${newContext.length} properties`,
                      });
                    } else {
                      setParsingErrors((prev) => ({
                        ...prev,
                        [message.id]: "No properties found in the data",
                      }));

                      toast({
                        title: "Warning",
                        description: "No properties found in the data",
                        variant: "destructive",
                      });
                    }
                  } catch (error) {
                    setParsingErrors((prev) => ({
                      ...prev,
                      [message.id]:
                        error instanceof Error
                          ? error.message
                          : "Unknown parsing error",
                    }));

                    toast({
                      title: "Error",
                      description: "Could not parse property data",
                      variant: "destructive",
                    });
                  } finally {
                    setPropertyLoading((prev) => ({
                      ...prev,
                      [message.id]: false,
                    }));
                  }
                }, 0);
              }}
            >
              Retry Loading Properties
            </Button>
          </div>
        );
      }

      // If we still have no properties, show an error
      if (context.length === 0) {
        return (
          <div className="py-4 text-center text-red-400">
            <p>No properties found</p>
            <p className="mt-2 text-sm">Please check the format of your data</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                // Force a re-parse of the property data
                setPropertyLoading((prev) => ({ ...prev, [message.id]: true }));

                setTimeout(() => {
                  try {
                    const newContext = parsePropertyData(message);
                    if (newContext.length > 0) {
                      setParsedPropertyData((prev) => ({
                        ...prev,
                        [message.id]: newContext,
                      }));

                      toast({
                        title: "Success",
                        description: `Found ${newContext.length} properties`,
                      });
                    } else {
                      setParsingErrors((prev) => ({
                        ...prev,
                        [message.id]: "No properties found in the data",
                      }));

                      toast({
                        title: "Warning",
                        description: "No properties found in the data",
                        variant: "destructive",
                      });
                    }
                  } catch (error) {
                    setParsingErrors((prev) => ({
                      ...prev,
                      [message.id]:
                        error instanceof Error
                          ? error.message
                          : "Unknown parsing error",
                    }));

                    toast({
                      title: "Error",
                      description: "Could not parse property data",
                      variant: "destructive",
                    });
                  } finally {
                    setPropertyLoading((prev) => ({
                      ...prev,
                      [message.id]: false,
                    }));
                  }
                }, 0);
              }}
            >
              Retry Loading Properties
            </Button>
          </div>
        );
      }

      // Filter available properties
      const availableProperties = context.filter(
        (prop) =>
          prop && (prop.status === "for_rent" || prop.status === "for_sale")
      );

      if (availableProperties.length > 0) {
        return (
          <div className="my-4 space-y-4">
            <h3 className="text-[16px] font-semibold text-[#CCCCCC]">
              Available Properties ({availableProperties.length})
            </h3>
            {availableProperties.map((property, index) => (
              <div key={index} className="p-4 rounded-lg property-card">
                <div className="w-full gap-4 md:flex-row ml-[-30px]">
                  <div className="relative  md:h-[200px] h-[150px] w-full">
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-0 left-0 w-[320px] md:w-[411px] h-[150px] md:h-[200px] bg-gradient-to-b from-[#1e1e1e] to-[#2a2a2a] rounded-t-[15px]"
                    >
                      <Image
                        src={
                          property.image_url ||
                          "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"
                        }
                        alt={property.property_type || "Property Image"}
                        fill
                        className="object-cover rounded-t-[15px]"
                        unoptimized
                      />
                    </motion.div>
                  </div>

                  <div className="p-4 bg-[#262626] mt-4 rounded-b-[15px] md:w-[411px] w-[320px]">
                    <h3 className="font-semibold md:text-lg text-[13px]">
                      {property.title}
                    </h3>
                    <div className="flex items-center mt-1 text-sm text-[#CCCCCC]">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-[13px]">
                        {property.address || "No address provided"}
                      </span>
                    </div>

                    <div className="mt-3">
                      <span className="text-[16px] font-bold">
                        {property.price || "Price on request"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4 space-x-2">
                      <button className="flex-1 px-4 py-2 text-sm text-[#CBCBCB] bg-[#434343] rounded-[15px] flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button className="flex-1 px-4 py-2 text-sm text-[#CBCBCB] bg-[#434343] rounded-[15px] flex items-center justify-center gap-2">
                        <Heart className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      <button className="flex-1 px-4 py-2 text-sm text-[#CBCBCB] bg-[#434343] rounded-[15px] flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>Contact</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-5 mb-2 md:w-[415px]">
                    <p className="text-[15px] text-[#CCCCCC]">
                      Would you like to see the rental details or connect with
                      the landlord?
                    </p>
                  </div>

                  <PropertyActions
                    location={
                      property.cordinates ||
                      property.address ||
                      "No location available"
                    }
                    property={toProperty(property)}
                    description={property.description || ""}
                    status={property.status || ""}
                    year_built={property.year_built || ""}
                    lot_size={property.lot_size || ""}
                    square_footage={property.square_footage || ""}
                    state={property.state || ""}
                    city={property.city || ""}
                    zip_code={property.zip_code || ""}
                    phone={property.phone || "Contact not available"}
                    created_by={property.created_by || ""}
                  />
                </div>
              </div>
            ))}
          </div>
        );
      } else {
        return <div className="py-4 text-center text-yellow-400"></div>;
      }
    } catch (e) {
      console.error("Error processing property search:", e);
      return (
        <div className="py-4 text-center text-red-400">
          <p>
            Error loading property listings:{" "}
            {e instanceof Error ? e.message : String(e)}
          </p>
          <p className="mt-2 text-sm">
            Please check the format of your property data
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              // Force a re-render
              setPropertyLoading((prev) => ({ ...prev, [message.id]: true }));

              setTimeout(() => {
                try {
                  const newContext = parsePropertyData(message);
                  if (newContext.length > 0) {
                    setParsedPropertyData((prev) => ({
                      ...prev,
                      [message.id]: newContext,
                    }));
                  }
                } catch (error) {
                  console.error("Error re-parsing property data:", error);
                } finally {
                  setPropertyLoading((prev) => ({
                    ...prev,
                    [message.id]: false,
                  }));
                }
              }, 0);
            }}
          >
            Retry
          </Button>
        </div>
      );
    }
  };

  return (
    <>
      <div
        ref={chatContainerRef}
        className={cn(
          "flex-1 overflow-y-auto mt-14 bg-background transition-all duration-300 ",
          sidebarCollapsed ? "md:pl-16" : "md:",
          sidebarOpen ? "lg:pl-44" : "lg:pl-0",
          "pb-[calc(70px+1rem)]"
        )}
      >
        {isSessionLoading ? (
          <LoaderAnimation variant="typing" text="Loading chat session" />
        ) : (
          <div className="flex flex-col w-full p-4 mx-auto md:max-w-5xl">
            {/* Show active session title when messages exist */}
            {activeSession && messages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full pb-2 mb-4 border-b border-border"
              >
                <h2 className="w-full font-medium text-center uppercase md:w-full text-foreground text-md">
                  {sessions.find((s: any) => s.id === activeSession)
                    ?.chat_title || "Chat Session"}
                </h2>
                <p className="text-xs text-center text-muted-foreground">
                  Continue your conversation in this session
                </p>
              </motion.div>
            )}
            {messages.length === 0 && !isLoading && !isSessionLoading && (
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] max-w-[600px)]">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="mb-8 text-center text-[32px] text-foreground">
                    {isAuthenticated
                      ? `Hi ${
                          user?.first_name
                            ? user?.first_name + " " + user?.last_name
                            : "there"
                        }! How can I assist you today?`
                      : "Hi! How can I assist you today?"}
                  </h1>
                </motion.div>

                {/* First two cards */}
                <div className="grid grid-cols-2 gap-3 w-full text-center mx-auto max-w-[620px]">
                  {actionCards.slice(0, 2).map((card, index) => (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card
                        className={`md:p-1 py-[0.5px] transition-all cursor-pointer border-[1px] border-border md:py-8 bg-gradient-to-br from-[#1e1e1e] to-[#2a2a2a] hover:from-[#2a2a2a] hover:to-[#3a3a3a] hover:shadow-lg hover:shadow-purple-500/10 rounded-full md:rounded-[10px] hover:scale-90 ${
                          cardLoading === card.title || isLoading
                            ? "opacity-70 pointer-events-none"
                            : ""
                        }`}
                        onClick={() => handleCardSubmit(card)}
                      >
                        <div className="flex items-center justify-center md:gap-3 lg:flex-col">
                          <div className="p-2 md:border-2 border-border md:block rounded-[10px]">
                            <span className="text-[20px]">{card.image}</span>
                           
                          </div>
                          <div className="text-center">
                            <h3 className="md:mb-1 md:font-medium text-white text-[14px] md:text-[15px] text-wrap overflow-hidden text-ellipsis">
                              {card.title}
                            </h3>
                            <p className="hidden text-sm text-muted-foreground md:block">
                              {card.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Last two cards with specific widths */}
                <div className="flex flex-col justify-center items-center w-full gap-4 mt-4 md:flex-row md:w-[620px]">
                  {actionCards.slice(2).map((card, index) => (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: (index + 2) * 0.1 }}
                      className={
                        index === 0
                          ? "md:w-full w-[155px]"
                          : "md:w-full w-[210px]"
                      }
                    >
                      <Card
                        key={card.title}
                        className={`md:p-1 py-[0.5px] transition-colors cursor-pointer rounded-full md:rounded-[10px] border-[1px] border-border md:py-8 bg-card bg-gradient-to-br from-[#1e1e1e] to-[#2a2a2a] hover:from-[#2a2a2a] hover:to-[#3a3a3a] hover:shadow-lg hover:shadow-purple-500/10 hover:bg-muted mx-auto hover:scale-90 ${
                          cardLoading === card.title || isLoading
                            ? "opacity-70 pointer-events-none"
                            : ""
                        } ${
                          index === 0
                            ? "md:w-full w-[160px]"
                            : "md:w-full w-[210px]"
                        }`}
                        onClick={() => handleCardSubmit(card)}
                      >
                        <div className="flex items-center justify-center md:gap-3 lg:flex-col">
                          <div className="p-2 md:border-2 border-border md:block rounded-[10px] ">
                          <span className="text-[20px]">{card.image}</span>

                          </div>
                          <div className="text-center">
                            <h3 className="md:mb-1 md:font-medium text-white text-[14px] md:text-[15px] text-wrap overflow-hidden text-ellipsis">
                              {card.title}
                            </h3>
                            <p className="hidden text-sm text-muted-foreground md:block">
                              {card.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div className="flex flex-col items-start self-start w-full  max-w-[880px] mx-auto space-y-4 font-normal text-white">
                <AnimatePresence>
                  {messages.map((message: any, index: number) => (
                    <motion.div
                      key={index}
                      className="w-full space-y-2 group"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className={`flex justify-end w-full relative`}>
                        <div className="flex gap-1 p-1 transition-opacity duration-200 rounded-full opacity-0 bg-background/80 backdrop-blur-sm group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-6 h-6 p-1 text-gray-400 hover:text-white"
                            onClick={() => setEditingMessageId(message.id)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-6 h-6 p-1 text-gray-400 hover:text-red-500"
                            onClick={() => {
                              deleteChatById(message.id);
                              setMessages((prev) =>
                                prev.filter((msg) => msg.id !== message.id)
                              );
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        {editingMessageId === message.id ? (
                          <div className="w-full max-w-[80%]">
                            <Textarea
                              value={editedPrompt}
                              onChange={(e) => setEditedPrompt(e.target.value)}
                              className="min-h-[100px] bg-muted border-border"
                            />
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600"
                                onClick={async () => {
                                  setMessages((prev) =>
                                    prev.map((msg) =>
                                      msg.id === message.id
                                        ? { ...msg, isResending: true }
                                        : msg
                                    )
                                  );

                                  try {
                                    await handleResendMessage(
                                      message.id,
                                      editedPrompt,
                                      message.session || activeSession || ""
                                    );
                                  } finally {
                                    setMessages((prev) =>
                                      prev.map((msg) =>
                                        msg.id === message.id
                                          ? { ...msg, isResending: false }
                                          : msg
                                      )
                                    );
                                    setEditingMessageId(null);
                                  }
                                }}
                                disabled={message.isResending}
                              >
                                {message.isResending ? (
                                  <div className="flex items-center">
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Resending...
                                  </div>
                                ) : (
                                  "Resend"
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingMessageId(null)}
                                disabled={message.isResending}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <motion.div
                            className={`max-w-[80%] rounded-[10px] rounded-tr-none p-4 border-2 border-border ${
                              message?.response ? "" : "bg-muted"
                            }`}
                            initial={{ scale: 0.95, x: 20 }}
                            animate={{ scale: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <p className="text-white whitespace-pre-wrap">
                              {message?.prompt}
                            </p>
                          </motion.div>
                        )}
                      </div>

                      {message.response ? (
                        <div className={`flex items-center w-full`}>
                          <motion.div
                            className="flex items-start gap-2 md:gap-4 md:max-w-[80%] w-full rounded-lg md:p-4 mt-2"
                            initial={{ scale: 0.95, x: -20 }}
                            animate={{ scale: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: 0.1 }}
                          >
                            <motion.div
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Image
                                src={star || "/placeholder.svg"}
                                alt="Response Image"
                                className="relative object-cover w-5 h-5 rounded-full md:w-8 md:h-8 ml-[-2px]"
                              />
                            </motion.div>
                            <div className="flex-1 min-w-0 rounded-lg ">
                              {/* {(() => {
                                // Parse the response immediately when the message is received
                                if (message.classification === "Property Search") {
                                  try {
                                    console.log("Parsing property data for message:", message.id);
                                    console.log("Context data:", message.context);
                                    
                                    const propertyData = parsePropertyData(message);
                                    console.log("Parsed property data:", propertyData);
                                    
                                    if (propertyData.length > 0 && !parsedPropertyData[message.id]) {
                                      setParsedPropertyData((prev) => ({
                                        ...prev,
                                        [message.id]: propertyData,
                                      }));
                                    }
                                  } catch (error) {
                                    console.error("Error parsing property data:", error);
                                  }
                                } */}
                              {(() => {
                                // Split the response into text parts (before and after JSON)
                                const textParts =
                                  message.response.split(/```json[\s\S]*```/);
                                // const hasProprtyData =
                                //   message.classification ===
                                //     "Property Search" &&
                                //   message.context &&
                                //   typeof message.context === "string";

                                return (
                                  <>
                                    {/* First text part */}
                                    <ProgressiveMarkdownRenderer
                                      content={textParts[0]}
                                      typingSpeed={10}
                                      shouldAnimate={
                                        message.id === latestMessageId
                                      }
                                      onTextUpdate={handleTextUpdate}
                                      onComplete={() => {
                                        setTextAnimationCompleted((prev) => ({
                                          ...prev,
                                          [message.id]: true,
                                        }));
                                      }}
                                    />

                                    {textAnimationCompleted[message.id] &&
                                      message.classification ===
                                        "Property Search" &&
                                      renderPropertyData(message)}

                                    {textParts[1] && (
                                      <ProgressiveMarkdownRenderer
                                        content={textParts[1]}
                                        typingSpeed={10} // Increased from 10 to 50
                                        shouldAnimate={
                                          message.id === latestMessageId
                                        }
                                        onTextUpdate={handleTextUpdate}
                                      />
                                    )}

                                    {/* Render properties only after text animation completes */}
                                  </>
                                );
                              })()}

                              <div className="flex items-center justify-between pt-1 mt-4">
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="px-2 text-xs text-gray-400"
                                    onClick={() =>
                                      copyToClipboard(message.response)
                                    }
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`text-xs px-2 ${
                                      feedbackGiven[message.id] === "up"
                                        ? "text-green-400"
                                        : "text-gray-400 hover:text-green-400"
                                    }`}
                                    onClick={() =>
                                      handleFeedback(message.id, "up")
                                    }
                                    disabled={!!feedbackGiven[message.id]}
                                  >
                                    <ThumbsUp className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`text-xs px-2 ${
                                      feedbackGiven[message.id] === "down"
                                        ? "text-red-400"
                                        : "text-gray-400 hover:text-red-400"
                                    }`}
                                    onClick={() =>
                                      handleFeedback(message.id, "down")
                                    }
                                    disabled={!!feedbackGiven[message.id]}
                                  >
                                    <ThumbsDown className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => retryMessage(message)}
                                    disabled={!!retryingMessageId}
                                    className="px-2 text-xs text-gray-400"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      ) : message.error ? (
                        <div className={`flex justify-start w-full`}>
                          <motion.div
                            className="flex items-start gap-2 md:gap-4 md:max-w-[80%] rounded-lg p-4 bg-red-900/20 border border-red-500/30"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="mb-2 text-red-400">
                                The server encountered an error processing this
                                message.
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => retryMessage(message)}
                                disabled={!!retryingMessageId}
                                className="flex items-center gap-1 text-white bg-red-900/30 border-red-500/30 hover:bg-red-800/50"
                              >
                                <RefreshCw className="w-3 h-3" />
                                {message.id === retryingMessageId
                                  ? "Retrying..."
                                  : "Retry"}
                              </Button>
                            </div>
                          </motion.div>
                        </div>
                      ) : null}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isLoading && (
                  <motion.div
                    className="flex justify-start w-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="max-w-[80%] rounded-lg p-4 text-foreground">
                      <div className="flex items-center gap-2 md:gap-4">
                        <ThinkingAnimation />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {!isAutoScrollEnabled && (
              <button
                onClick={() => {
                  chatContainerRef.current?.scrollTo({
                    top: chatContainerRef.current.scrollHeight,
                    behavior: "smooth",
                  });
                  setIsAutoScrollEnabled(true);
                }}
                className="fixed px-3 py-2 text-sm text-white transition-all duration-300 ease-in-out border-2 rounded-full bottom-44 right-[calc(23%-1.5rem)] bg-background border-border hover:bg-muted/50"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <ReportYourLandlord
        isOpen={showLandlordVerification}
        onClose={() => setShowLandlordVerification(false)}
      />
      <TellYourStoryPopup
        isOpen={showTellYourStory}
        onClose={() => setShowTellYourStory(false)}
      />
    </>
  );
};

export default ChatMessages;
