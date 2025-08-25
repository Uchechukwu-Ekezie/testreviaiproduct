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
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  Home,
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

// Add MessageImages component for displaying uploaded images
const MessageImages: React.FC<{ imageUrls: string[] }> = ({ imageUrls }) => {
  if (!imageUrls || imageUrls.length === 0) return null;

  return (
    <motion.div
      className="flex flex-wrap gap-2 mt-2 mb-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {imageUrls.map((url, index) => (
        <motion.div
          key={index}
          className="relative group"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, delay: index * 0.1 }}
        >
          <div className="relative w-32 h-32 overflow-hidden border rounded-lg md:w-40 md:h-40 border-border">
            <Image
              src={url}
              alt={`Attached image ${index + 1}`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              unoptimized
            />
            <div className="absolute inset-0 transition-opacity bg-black bg-opacity-0 group-hover:bg-opacity-10" />
          </div>

          {/* Click handler to view full size */}
          <motion.button
            onClick={() => {
              // Open image in new tab
              window.open(url, "_blank");
            }}
            className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
            whileHover={{ scale: 1.02 }}
          >
            <div className="p-2 bg-black bg-opacity-50 rounded-full">
              <Eye className="w-4 h-4 text-white" />
            </div>
          </motion.button>
        </motion.div>
      ))}
    </motion.div>
  );
};

// Add MessageFiles component for displaying file attachments
const MessageFiles: React.FC<{ file: string | null; attachments?: File[] }> = ({
  file,
  attachments,
}) => {
  // Handle both backend file URLs and local File objects
  const hasFile = file || (attachments && attachments.length > 0);
  if (!hasFile) return null;

  // If we have attachments (File objects), use the first one
  const fileObject =
    attachments && attachments.length > 0 ? attachments[0] : null;
  const fileName = fileObject
    ? fileObject.name
    : file
    ? file.split("/").pop() || file
    : "Unknown file";
  const fileSize = fileObject ? fileObject.size : null;

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "txt":
        return "�";
      case "csv":
        return "📊";
      case "xls":
      case "xlsx":
        return "📊";
      case "ppt":
      case "pptx":
        return "📎";
      default:
        return "📁";
    }
  };

  const getFileType = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "PDF Document";
      case "doc":
      case "docx":
        return "Word Document";
      case "txt":
        return "Text File";
      case "csv":
        return "CSV File";
      case "xls":
      case "xlsx":
        return "Excel Spreadsheet";
      case "ppt":
      case "pptx":
        return "PowerPoint Presentation";
      default:
        return "Document";
    }
  };

  const handleFileClick = () => {
    if (fileObject) {
      // For File objects, create a temporary URL for viewing
      const url = URL.createObjectURL(fileObject);
      window.open(url, "_blank");
      // Clean up the URL after a delay to prevent memory leaks
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } else if (file) {
      if (file.startsWith("http")) {
        // If it's a URL, open in new tab
        window.open(file, "_blank");
      } else {
        // Create a proper download URL based on your backend setup
        const downloadUrl = file.startsWith("/") ? file : `/${file}`;
        window.open(downloadUrl, "_blank");
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <motion.div
      className="mt-2 mb-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.button
        onClick={handleFileClick}
        className="flex items-center gap-3 p-3 transition-all border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted border-border hover:border-border/60 hover:shadow-md"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-2xl">{getFileIcon(fileName)}</span>
        <div className="flex flex-col items-start flex-1">
          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
            {fileName}
          </span>
          <span className="text-xs text-muted-foreground">
            {getFileType(fileName)}
            {fileSize && ` • ${formatFileSize(fileSize)}`}
            {fileObject ? " • Click to view" : " • Click to view/download"}
          </span>
        </div>
        <Eye className="w-4 h-4 ml-auto text-muted-foreground" />
      </motion.button>
    </motion.div>
  );
};

// Simplified property parsing function
const parsePropertyData = (message: any): Context[] => {
  try {
    // If context is already an array, return it directly
    if (Array.isArray(message.context)) {
      return message.context;
    }

    // If context is a string, try to parse it as JSON
    if (typeof message.context === "string" && message.context.trim()) {
      try {
        const parsed = JSON.parse(message.context);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (error) {
        console.error("Failed to parse property context:", error);
        return [];
      }
    }

    return [];
  } catch (error) {
    console.error("Error in parsePropertyData:", error);
    return [];
  }
};

// Optimized property validation
const validateProperty = (property: any): boolean => {
  return (
    property &&
    typeof property === "object" &&
    (property.title || property.address || property.price || property.id)
  );
};

// Clean property formatter
const formatProperty = (property: any): Context => {
  return {
    id:
      property.id ||
      `property-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: property.title || "Property Listing",
    description: property.description || property.ai_refined_description || "",
    ai_refined_description: property.ai_refined_description || "",
    price: property.price || "Price on request",
    address: property.address || "Address not available",
    location:
      property.coordinate || property.address || "Location not available", // Add required location property
    property_type: property.property_type || "Property",
    status: property.status || "available",
    visibility_status: property.visibility_status || "visible",
    bedrooms: property.bedrooms || null,
    bathrooms: property.bathrooms || null,
    size: property.size || null,
    listed_by: property.listed_by || null,
    year_built: property.year_built || "",
    lot_size: property.lot_size || "",
    square_footage: property.square_footage || "",
    state: property.state || "",
    city: property.city || "",
    zip_code: property.zip_code || "",
    image_url: property.image_url || "",
    coordinate: property.coordinate || "",
    environmental_report: property.environmental_report || {},
    environmental_score: property.environmental_score || null,
    neighborhood_score: property.neighborhood_score || null,
    rental_grade: property.rental_grade || null,
    phone: property.phone || "",
    created_by: property.created_by || "",
  };
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

const getChatsBySessionWithRetry = async (
  sessionId: string,
  maxRetries = 3
) => {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await chatAPI.getChatsBySession(sessionId);
      return response;
    } catch (error: any) {
      retries++;
      console.error(
        `Attempt ${retries} failed for session ${sessionId}:`,
        `Attempt ${retries} failed for session ${sessionId}:`,
        error
      );

      if (error.response?.status === 404) {
        console.error(`Session ${sessionId} not found (404)`);
        throw error;
      }

      if (retries >= maxRetries) {
        console.error(
          `Max retries (${maxRetries}) reached for session ${sessionId}`
        );
        throw error;
      }

      const delay = 1000 * Math.pow(2, retries - 1);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Property Card Component - Moved outside to prevent re-renders
const PropertyCard = React.memo(({ property }: { property: Context }) => (
  <div className="p-4 rounded-lg property-card">
    <div className="w-full gap-4 md:flex-row ml-[-10px]">
      {/* Property Image */}
      <div className="relative md:h-[200px] h-[150px] w-full">
        <div className="absolute top-0 left-0 w-[320px] md:w-[411px] h-[150px] md:h-[200px] bg-gradient-to-b from-[#1e1e1e] to-[#2a2a2a] rounded-t-[15px]">
          <Image
            src={
              property.image_url ||
              property.property_url ||
              "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"
            }
            alt={property.property_type || "Property Image"}
            fill
            className="object-cover rounded-t-[15px]"
            unoptimized
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Status badge */}
          {property.status && (
            <div className="absolute px-3 py-1 rounded-full top-3 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 backdrop-blur-sm">
              <span className="text-xs font-bold tracking-wide text-white capitalize">
                {property.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Property Details */}
      <div className="p-4 bg-[#262626] mt-4 rounded-b-[15px] md:w-[411px] w-[320px]">
        <h3 className="font-semibold md:text-lg text-[13px]">
          {property.title}
        </h3>
        <div className="flex items-center mt-1 text-sm text-[#CCCCCC]">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-[13px]">{property.address}</span>
        </div>

        <div className="mt-3">
          <span className="text-[16px] font-bold">{property.price}</span>
        </div>
      </div>

      {/* Description */}
      <div className="mt-5 mb-2 md:w-[415px]">
        <p className="text-[15px] text-[#CCCCCC]">
          Would you like to see the rental details or connect with the landlord?
        </p>
      </div>

      {/* Property Actions */}
      <PropertyActions
        location={property.coordinate || property.address}
        property={property}
        description={property.ai_refined_description}
        status={property.status}
        year_built={property.year_built}
        lot_size={property.lot_size}
        square_footage={property.square_footage}
        state={property.state}
        city={property.city}
        zip_code={property.zip_code}
        phone={property.phone}
        created_by={property.created_by}
        rental_grade={property.rental_grade}
      />
    </div>
  </div>
));

PropertyCard.displayName = "PropertyCard";

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages: messagesProp,
  isLoading,
  setIsLoading,
  isSessionLoading,
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
  sidebarCollapsed = false,
  sidebarOpen = false,
}) => {
  const messages = Array.isArray(messagesProp) ? messagesProp : [];

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

  // Simplified state management
  const [parsedPropertyData, setParsedPropertyData] = useState<
    Record<string, Context[]>
  >({});
  const [expandedProperties, setExpandedProperties] = useState<
    Record<string, boolean>
  >({});
  const [textAnimationCompleted, setTextAnimationCompleted] = useState<
    Record<string, boolean>
  >({});

  // Navigation state
  const [hasMessages, setHasMessages] = useState(false);
  const [shouldMoveUp, setShouldMoveUp] = useState(false);
  const previousMessagesLength = useRef(0);
  const lastPromptRef = useRef<HTMLDivElement | null>(null);

  // Session loading state
  const [sessionLoadingState, setSessionLoadingState] = useState({
    isLoading: false,
    currentSessionId: null as string | null,
    lastLoadedSessionId: null as string | null,
  });

  // Toggle function for property expansion - memoized to prevent re-renders
  const togglePropertyExpansion = useCallback((messageId: string) => {
    setExpandedProperties((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  }, []);

  // Optimized property parsing effect
  useEffect(() => {
    const parseProperties = () => {
      const propertyMessages = messages.filter(
        (message) =>
          message?.classification === "Property Search" &&
          message?.response &&
          !parsedPropertyData[message.id]
      );

      if (propertyMessages.length === 0) return;

      const newParsedData: Record<string, Context[]> = {};

      propertyMessages.forEach((message) => {
        try {
          const rawProperties = parsePropertyData(message);
          const validProperties = rawProperties
            .filter(validateProperty)
            .map(formatProperty);

          if (validProperties.length > 0) {
            newParsedData[message.id] = validProperties;
          }
        } catch (error) {
          console.error(
            `Error parsing properties for message ${message.id}:`,
            error
          );
        }
      });

      if (Object.keys(newParsedData).length > 0) {
        setParsedPropertyData((prev) => ({ ...prev, ...newParsedData }));
      }
    };

    parseProperties();
  }, [messages, parsedPropertyData]);

  // Session loading logic
  useEffect(() => {
    const loadSessionFromUrl = async () => {
      const path = pathname || "";
      const pathSegments = path.split("/");
      const sessionIdFromUrl = pathSegments[2];

      if (!sessionIdFromUrl || sessionIdFromUrl === "new") {
        if (activeSession !== null) {
          setActiveSession(null);
        }
        if (messages.length > 0) {
          setMessages([]);
        }
        setSessionLoadingState((prev) => ({
          ...prev,
          isLoading: false,
          currentSessionId: null,
        }));
        return;
      }

      if (
        sessionIdFromUrl === sessionLoadingState.currentSessionId ||
        sessionIdFromUrl === sessionLoadingState.lastLoadedSessionId ||
        sessionLoadingState.isLoading
      ) {
        return;
      }

      if (sessionIdFromUrl === activeSession && messages.length > 0) {
        setSessionLoadingState((prev) => ({
          ...prev,
          lastLoadedSessionId: sessionIdFromUrl,
        }));
        return;
      }

      try {
        setSessionLoadingState({
          isLoading: true,
          currentSessionId: sessionIdFromUrl,
          lastLoadedSessionId: null,
        });

        if (activeSession !== sessionIdFromUrl) {
          setActiveSession(sessionIdFromUrl);
        }

        const chats = await getChatsBySessionWithRetry(sessionIdFromUrl);

        // Debug logging to see what the API is returning
        console.log(
          "API returned chats:",
          chats,
          "Type:",
          typeof chats,
          "Is array:",
          Array.isArray(chats)
        );

        // Ensure chats is an array before trying to map over it
        const chatsArray = Array.isArray(chats) ? chats : [];

        if (!Array.isArray(chats)) {
          console.warn(
            "Expected chats to be an array, but got:",
            typeof chats,
            chats
          );
        }

        // Transform messages from API to match Message interface
        const transformedChats = chatsArray.map(
          (chat: any): Message => ({
            id: chat.id,
            prompt: chat.prompt,
            response: chat.response,
            session: chat.session,
            classification: chat.classification,
            context: chat.context,
            image_url: chat.image_url,
            file: chat.file,
            // Parse properties if it's a JSON string
            properties: chat.properties
              ? (() => {
                  try {
                    return JSON.parse(chat.properties);
                  } catch {
                    return undefined;
                  }
                })()
              : undefined,
          })
        );

        setMessages(transformedChats);

        setSessionLoadingState({
          isLoading: false,
          currentSessionId: null,
          lastLoadedSessionId: sessionIdFromUrl,
        });
      } catch (error: any) {
        console.error("Failed to load session:", sessionIdFromUrl, error);

        setSessionLoadingState({
          isLoading: false,
          currentSessionId: null,
          lastLoadedSessionId: null,
        });

        if (error.response?.status === 404) {
          router.replace("/chats/new/");
          toast({
            title: "Session not found",
            description:
              "The chat session could not be found. Starting a new chat.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Failed to load chat",
            description:
              "There was an error loading your chat session. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    loadSessionFromUrl();
  }, [pathname]);

  // Message tracking
  useEffect(() => {
    const currentLength = messages.length;

    if (currentLength > 0) {
      setHasMessages(true);
    }

    if (currentLength > previousMessagesLength.current) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage?.prompt && !latestMessage.response) {
        setShouldMoveUp(true);

        setTimeout(() => {
          if (lastPromptRef.current) {
            lastPromptRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 100);
      }
    }

    previousMessagesLength.current = currentLength;
  }, [messages]);

  // Reset shouldMoveUp when response comes in
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage?.response && shouldMoveUp) {
        setShouldMoveUp(false);
      }
    }
  }, [messages, shouldMoveUp]);

  // Scroll functions
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, []);

  // Auto-scroll effects
  useEffect(() => {
    const messagesArray = Array.isArray(messages) ? messages : [];

    if (
      activeSession &&
      messagesArray.length > 0 &&
      !sessionLoadingState.isLoading &&
      !isSessionLoading
    ) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [
    activeSession,
    scrollToBottom,
    sessionLoadingState.isLoading,
    isSessionLoading,
    messages,
  ]);

  useEffect(() => {
    const messagesArray = Array.isArray(messages) ? messages : [];

    if (
      messagesArray.length > 0 &&
      !sessionLoadingState.isLoading &&
      !isSessionLoading
    ) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [
    messages,
    sessionLoadingState.isLoading,
    isSessionLoading,
    scrollToBottom,
  ]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const threshold = 100;
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;

      setIsAutoScrollEnabled(distanceFromBottom <= threshold);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isAutoScrollEnabled || !chatContainerRef.current || shouldMoveUp)
      return;

    const isUserAtBottom =
      chatContainerRef.current.scrollTop +
        chatContainerRef.current.clientHeight >=
      chatContainerRef.current.scrollHeight - 50;

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
    shouldMoveUp,
  ]);

  // Handle text updates during animation
  const handleTextUpdate = useCallback(() => {
    if (!chatContainerRef.current || shouldMoveUp) return;
    const isUserAtBottom =
      chatContainerRef.current.scrollTop +
        chatContainerRef.current.clientHeight >=
      chatContainerRef.current.scrollHeight - 50;

    setTimeout(() => {
      if (isUserAtBottom && isAutoScrollEnabled) {
        scrollToBottom();
      }
    }, 100);
  }, [scrollToBottom, isAutoScrollEnabled, shouldMoveUp]);

  // Message handlers
  const handleResendMessage = async (
    messageId: string,
    newPrompt: string,
    sessionId: string
  ) => {
    try {
      const messagesArray = Array.isArray(messages) ? messages : [];
      const originalMessage = messagesArray.find((m) => m?.id === messageId);

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

      const response = await chatAPI.editChat(messageId, newPrompt, sessionId);

      toast({
        title: "Message updated",
        description: "Your message has been edited successfully",
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, response: response.response } : m
        )
      );

      setParsedPropertyData((prev) => {
        const newData = { ...prev };
        delete newData[messageId];
        return newData;
      });
    } catch (error) {
      console.error("Failed to resend message:", error);

      const errorMessage =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object"
          ? ("error" in error.response.data &&
            typeof error.response.data.error === "string"
              ? error.response.data.error
              : "") ||
            ("message" in error.response.data &&
            typeof error.response.data.message === "string"
              ? error.response.data.message
              : "")
          : error instanceof Error
          ? error.message
          : "Failed to resend message";

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                error: true,
                errorMessage: errorMessage,
              }
            : m
        )
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

      // Prepare options with image URLs if they exist
      const apiOptions: { file?: string } = {};
      if (message.imageUrls && message.imageUrls.length > 0) {
        apiOptions.file = message.imageUrls.join(","); // Send as comma-separated string
      }

      const data = await chatAPI.postNewChat(
        message.prompt,
        activeSession,
        apiOptions
      );

      setLatestMessageId(data.id);

      // Transform the API response properly
      const transformedMessage: Message = {
        id: data.id,
        prompt: message.prompt,
        response: data.response,
        session: activeSession,
        classification: data.classification,
        context: data.context,
        retrying: false,
        error: false,
        imageUrls: message.imageUrls, // Preserve the original image URLs
        image_url: data.image_url,
        file: data.file,
        // Parse properties if it's a JSON string
        properties: data.properties
          ? (() => {
              try {
                return JSON.parse(data.properties);
              } catch {
                return undefined;
              }
            })()
          : undefined,
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === message.id ? transformedMessage : msg))
      );

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

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to retry message";

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id
            ? {
                ...msg,
                retrying: false,
                error: true,
                errorMessage: errorMessage,
              }
            : msg
        )
      );

      toast({
        title: "Just a moment!",
        description: error.response?.data?.error?.includes(
          "Service Not Available"
        )
          ? "We're experiencing high demand right now. Please give us about 10 minutes and try again. Thanks for your patience! 🙏"
          : error.response?.data?.message || "Failed to retry message",
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
      setTimeout(() => setCardLoading(null), 500);
      return;
    }

    if (card.title === "Report your Landlord") {
      setShowLandlordVerification(true);
      setTimeout(() => setCardLoading(null), 500);
      return;
    }

    // Use the handleCardClick prop if available (preferred approach)
    if (handleCardClick) {
      try {
        await handleCardClick(card);
      } catch (error: any) {
        console.error("Error in handleCardClick:", error);

        // Check for specific error messages
        const errorMessage = error.response?.data?.error || error.message || "";
        let userFriendlyMessage =
          "The server encountered an error. Please try again later.";

        if (
          errorMessage.includes("Service Not Available") ||
          errorMessage.includes("temporarily busy")
        ) {
          userFriendlyMessage =
            "We're experiencing high demand right now. Please give us about 10 minutes and try again. Thanks for your patience! 🙏";
        }

        toast({
          title: "Just a moment!",
          description: userFriendlyMessage,
          variant: "destructive",
        });
      } finally {
        setTimeout(() => setCardLoading(null), 500);
      }
      return;
    }

    // Fallback: handle card submission directly (only if handleCardClick is not available)
    setIsLoading(true);
    const messageText = card.message;
    const tempId = `temp-${Date.now()}`;

    // Create a temporary message
    const tempMessage: Message = {
      id: tempId,
      prompt: messageText,
      response: "",
      session: activeSession,
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      let data;
      let currentSessionId = activeSession;

      if (!currentSessionId) {
        const sessionData = {
          chat_title: messageText.substring(0, 30),
          user: user?.id || "guest",
        };

        const sessionResponse = await chatAPI.createChatSession(sessionData);
        currentSessionId = sessionResponse.id;

        router.push(`/chats/${currentSessionId}/`, undefined);
        setActiveSession(currentSessionId);

        setSessions((prev) => {
          if (!prev.some((s) => s.id === currentSessionId)) {
            return [sessionResponse, ...prev];
          }
          return prev;
        });

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

      // Transform the API response to match the Message interface
      const transformedMessage: Message = {
        id: data.id,
        prompt: data.prompt,
        response: data.response,
        session: data.session,
        classification: data.classification,
        context: data.context,
        image_url: data.image_url,
        file: data.file,
        // Parse properties if it's a JSON string
        properties: data.properties
          ? (() => {
              try {
                return JSON.parse(data.properties);
              } catch {
                return undefined;
              }
            })()
          : undefined,
      };

      // Replace the temporary message with the actual response
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? transformedMessage : msg))
      );
    } catch (error: any) {
      console.error("Error submitting card message:", error);

      const cardErrorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to submit message";

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                ...msg,
                error: true,
                session: activeSession,
                errorMessage: cardErrorMessage,
              }
            : msg
        )
      );

      // Check for specific error messages
      const errorMessage = error.response?.data?.error || error.message || "";
      let userFriendlyMessage =
        "The server encountered an error. Please try again later.";

      if (
        errorMessage.includes("Service Not Available") ||
        errorMessage.includes("temporarily busy")
      ) {
        userFriendlyMessage =
          "We're experiencing high demand right now. Please give us about 10 minutes and try again. Thanks for your patience! 🙏";
      }

      toast({
        title: "Just a moment!",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setCardLoading(null);
    }
  };

  useEffect(() => {
    if (editingMessageId) {
      const messagesArray = Array.isArray(messages) ? messages : [];
      const message = messagesArray.find((m) => m?.id === editingMessageId);

      if (message) {
        setEditedPrompt(message.prompt || "");
      }
    }
  }, [editingMessageId, messages]);

  // Optimized property rendering with stable references
  const renderPropertyData = useCallback(
    (message: any) => {
      const properties = parsedPropertyData[message.id] || [];

      // Filter available properties
      const availableProperties = properties.filter(
        (prop) =>
          prop &&
          (prop.status === "for_rent" ||
            prop.status === "for_sale" ||
            prop.status === "available")
      );

      if (availableProperties.length === 0) {
        return null;
      }

      const isExpanded = expandedProperties[message.id] || false;

      return (
        <div className="my-4 space-y-4">
          {/* Toggle Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-semibold text-[#CCCCCC]">
              Found {availableProperties.length} Available Properties
            </h3>
            <Button
              onClick={() => togglePropertyExpansion(message.id)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-[#434343] bg-[#262626] text-[#CBCBCB] hover:bg-[#434343] transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>{isExpanded ? "Hide Properties" : "See Properties"}</span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Property Display */}
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="space-y-4 overflow-hidden"
              >
                {availableProperties.map((property, index) => (
                  <PropertyCard
                    key={`${property.id}-${index}`}
                    property={property}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    },
    [parsedPropertyData, expandedProperties, togglePropertyExpansion]
  );

  return (
    <>
      <div
        ref={chatContainerRef}
        className={cn(
          "flex-1 overflow-y-auto mt-14 bg-background transition-all duration-300",
          sidebarCollapsed ? "md:pl-16" : "md:",
          sidebarOpen ? "lg:pl-44" : "lg:pl-0",
          "pb-[calc(70px+1rem)]"
        )}
      >
        {sessionLoadingState.isLoading || isSessionLoading ? (
          <LoaderAnimation variant="typing" text="Loading chat session" />
        ) : (
          <div className="flex flex-col w-full p-4 mx-auto md:max-w-5xl">
            {/* Session Title */}
            {activeSession &&
              Array.isArray(messages) &&
              messages.length > 0 && (
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

            {/* Welcome Screen */}
            {(!Array.isArray(messages) || messages.length === 0) &&
              !isLoading &&
              !sessionLoadingState.isLoading &&
              !isSessionLoading && (
                <motion.div
                  className={cn(
                    "flex flex-col items-center justify-center max-w-[600px] h-[60vh] md:min-h-[63vh] mx-auto",
                    !hasMessages && "min-h-[calc(83vh-180px)]"
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h1 className="mb-8 text-center md:text-[32px] text-foreground">
                      {isAuthenticated
                        ? `Hi ${
                            user?.first_name
                              ? user?.first_name + " " + user?.last_name
                              : "there"
                          }! How can I assist you today?`
                        : "Hi! How can I assist you today?"}
                    </h1>
                  </motion.div>

                  {/* Action Cards */}
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
                </motion.div>
              )}

            {/* Chat Messages */}
            {messages.length > 0 && (
              <div className="flex flex-col items-start self-start w-full max-w-[880px] mx-auto space-y-4 font-normal text-white">
                <AnimatePresence>
                  {messages.map((message: any, index: number) => {
                    if (!message) return null;

                    const isLastPrompt =
                      message.prompt &&
                      !message.response &&
                      index === messages.length - 1;

                    return (
                      <motion.div
                        key={index}
                        ref={isLastPrompt ? lastPromptRef : null}
                        className="w-full space-y-2 group"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* User Message */}
                        <div className="relative flex justify-end w-full">
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
                                onChange={(e) =>
                                  setEditedPrompt(e.target.value)
                                }
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
                            <div className="max-w-[80%] flex flex-col items-end space-y-3">
                              {/* Display attached images for user message - legacy imageUrls */}
                              {message?.imageUrls && (
                                <motion.div
                                  className="w-[70%] md:w-[60%] mb-2"
                                  initial={{ scale: 0.95, x: 20 }}
                                  animate={{ scale: 1, x: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <MessageImages
                                    imageUrls={message.imageUrls}
                                  />
                                </motion.div>
                              )}

                              {/* Display attached image from API - single image_url */}
                              {message?.image_url && (
                                <motion.div
                                  className="w-[70%] md:w-[60%] mb-2"
                                  initial={{ scale: 0.95, x: 20 }}
                                  animate={{ scale: 1, x: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <MessageImages
                                    imageUrls={[message.image_url]}
                                  />
                                </motion.div>
                              )}

                              {/* Display attached file from API */}
                              {message?.file && (
                                <motion.div
                                  className="w-[70%] md:w-[60%] mb-2"
                                  initial={{ scale: 0.95, x: 20 }}
                                  animate={{ scale: 1, x: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {/* Check if file contains image URLs (Cloudinary uploads) */}
                                  {message.file.startsWith("http") &&
                                  (message.file.includes("cloudinary.com") ||
                                    message.file.match(
                                      /\.(jpg|jpeg|png|gif|bmp|webp)$/i
                                    )) ? (
                                    <MessageImages imageUrls={[message.file]} />
                                  ) : (
                                    <MessageFiles
                                      file={message.file}
                                      attachments={message.attachments}
                                    />
                                  )}
                                </motion.div>
                              )}

                              <motion.div
                                className={`rounded-[10px] rounded-tr-none p-4 border-2 border-border ${
                                  message?.response ? "" : "bg-muted"
                                }`}
                                initial={{ scale: 0.95, x: 20 }}
                                animate={{ scale: 1, x: 0 }}
                                transition={{ duration: 0.2, delay: 0.1 }}
                                layout
                              >
                                <p className="text-white whitespace-pre-wrap">
                                  {message?.prompt}
                                </p>
                              </motion.div>
                            </div>
                          )}
                        </div>

                        {/* AI Response */}
                        {message.response ? (
                          <div className="flex items-center w-full">
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
                              <div className="flex-1 min-w-0 rounded-lg">
                                {(() => {
                                  const textParts = message.response.split(
                                    /\`\`\`json[\s\S]*\`\`\`/
                                  );

                                  // Extract property data for URL correction
                                  const rawProperties =
                                    parsePropertyData(message);
                                  const properties = rawProperties
                                    .filter(validateProperty)
                                    .map(formatProperty);
                                  const firstProperty =
                                    properties.length > 0
                                      ? properties[0]
                                      : null;
                                  const propertyData = firstProperty
                                    ? {
                                        property_url:
                                          firstProperty.property_url ||
                                          undefined,
                                        image_url:
                                          firstProperty.image_url || undefined,
                                      }
                                    : null;

                                  return (
                                    <>
                                      <ProgressiveMarkdownRenderer
                                        content={textParts[0]}
                                        typingSpeed={5}
                                        shouldAnimate={
                                          message.id === latestMessageId
                                        }
                                        messageId={message.id}
                                        propertyData={propertyData}
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
                                          typingSpeed={5}
                                          shouldAnimate={
                                            message.id === latestMessageId
                                          }
                                          messageId={message.id}
                                          propertyData={propertyData}
                                          onTextUpdate={handleTextUpdate}
                                        />
                                      )}
                                    </>
                                  );
                                })()}

                                {/* Display images and files from AI response */}
                                {message?.image_url && (
                                  <motion.div
                                    className="mt-3"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <MessageImages
                                      imageUrls={[message.image_url]}
                                    />
                                  </motion.div>
                                )}

                                {message?.file && (
                                  <motion.div
                                    className="mt-3"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    {/* Check if file contains image URLs (Cloudinary uploads) */}
                                    {message.file.startsWith("http") &&
                                    (message.file.includes("cloudinary.com") ||
                                      message.file.match(
                                        /\.(jpg|jpeg|png|gif|bmp|webp)$/i
                                      )) ? (
                                      <MessageImages
                                        imageUrls={[message.file]}
                                      />
                                    ) : (
                                      <MessageFiles
                                        file={message.file}
                                        attachments={message.attachments}
                                      />
                                    )}
                                  </motion.div>
                                )}

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
                          <div className="flex justify-start w-full">
                            <motion.div
                              className="flex items-start gap-2 md:gap-4 md:max-w-[80%] rounded-lg p-4 bg-red-900/20 border border-red-500/30"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="mb-2 text-red-400">
                                  {message.errorMessage || "An error occurred"}
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
                    );
                  })}
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

            {/* Scroll to Bottom Button */}
            {!isAutoScrollEnabled && (
              <div className="fixed z-50 w-full max-w-5xl px-4 transform -translate-x-1/2 pointer-events-none bottom-44 left-1/2">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      chatContainerRef.current?.scrollTo({
                        top: chatContainerRef.current.scrollHeight,
                        behavior: "smooth",
                      });
                      setIsAutoScrollEnabled(true);
                    }}
                    className="px-3 py-2 text-sm text-white transition-all duration-300 ease-in-out border-2 rounded-full pointer-events-auto bg-background border-border hover:bg-muted/50"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
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
