"use client";

import { useRouter, usePathname } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
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

// Loading skeleton component for better perceived performance
const MessageSkeleton = React.memo(() => (
  <div className="flex items-start gap-2 md:gap-4 p-4 animate-pulse">
    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
    </div>
  </div>
));

MessageSkeleton.displayName = "MessageSkeleton";

// Memoized MessageItem component to prevent unnecessary re-renders
const MessageItem = React.memo(
  ({
    message,
    index,
    isLastPrompt,
    lastPromptRef,
    parsedPropertyData,
    expandedProperties,
    togglePropertyExpansion,
    setEditingMessageId,
    setEditedPrompt,
    handleRetryMessage,
    retryingMessageId,
    feedbackGiven,
    setFeedbackGiven,
    handleFeedback,
    handleDeleteMessage,
    isAuthenticated,
    user,
    setMessages,
    refreshSessions,
    actionCards,
    handleCardClick,
    sidebarCollapsed,
    sidebarOpen,
  }: {
    message: any;
    index: number;
    isLastPrompt: boolean;
    lastPromptRef: React.RefObject<HTMLDivElement>;
    parsedPropertyData: Record<string, Context[]>;
    expandedProperties: Record<string, boolean>;
    togglePropertyExpansion: (messageId: string) => void;
    setEditingMessageId: (id: string | null) => void;
    setEditedPrompt: (prompt: string) => void;
    handleRetryMessage: (messageId: string) => void;
    retryingMessageId: string | null;
    feedbackGiven: Record<string, "up" | "down" | null>;
    setFeedbackGiven: (value: Record<string, "up" | "down" | null>) => void;
    handleFeedback: (messageId: string, type: "up" | "down") => void;
    handleDeleteMessage: (messageId: string) => void;
    isAuthenticated: boolean;
    user: any;
    setMessages: (value: any) => void;
    refreshSessions: () => void;
    actionCards: ActionCard[];
    handleCardClick: (card: ActionCard) => void;
    sidebarCollapsed: boolean;
    sidebarOpen: boolean;
  }) => {
    const handleEditClick = useCallback(() => {
      setEditingMessageId(message.id);
    }, [setEditingMessageId, message.id]);

    const handleRetryClick = useCallback(() => {
      handleRetryMessage(message.id);
    }, [handleRetryMessage, message.id]);

    const handleFeedbackClick = useCallback(
      (type: "up" | "down") => {
        handleFeedback(message.id, type);
      },
      [handleFeedback, message.id]
    );

    const handleDeleteClick = useCallback(() => {
      handleDeleteMessage(message.id);
    }, [handleDeleteMessage, message.id]);

    const handlePropertyToggle = useCallback(() => {
      togglePropertyExpansion(message.id);
    }, [togglePropertyExpansion, message.id]);

    return (
      <div
        key={index}
        ref={isLastPrompt ? lastPromptRef : null}
        className="w-full space-y-2 group"
      >
        {/* User Message */}
        <div className="relative flex justify-end w-full mb-12">
          <div className="flex gap-1 p-1 transition-opacity duration-200 rounded-full opacity-0 bg-background/80 backdrop-blur-sm group-hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-1 text-gray-400 hover:text-white"
              onClick={handleEditClick}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-1 text-gray-400 hover:text-white"
              onClick={handleRetryClick}
              disabled={retryingMessageId === message.id}
            >
              <RefreshCw
                className={cn(
                  "w-3 h-3",
                  retryingMessageId === message.id && "animate-spin"
                )}
              />
            </Button>
          </div>
          <div className="flex flex-col items-end max-w-[60%] space-y-2">
            <div className="px-4 py-2 text-sm bg-[#212121] rounded-2xl rounded-br-md text-white">
              {message.prompt}
            </div>
            {message.imageUrls && message.imageUrls.length > 0 && (
              <MessageImages imageUrls={message.imageUrls} />
            )}
          </div>
        </div>

        {/* AI Response */}
        {message.response && (
          <div className="flex flex-col items-start w-full space-y-2 mb-6">
            <div className="flex items-center justify-between w-full max-w-[70%]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">AI</span>
                </div>
                <span className="text-xs text-gray-400">Assistant</span>
              </div>
              <div className="flex gap-1 p-1 transition-opacity duration-200 rounded-full opacity-0 bg-background/80 backdrop-blur-sm group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-6 h-6 p-1",
                    feedbackGiven[message.id] === "up"
                      ? "text-green-500"
                      : "text-gray-400 hover:text-green-500"
                  )}
                  onClick={() => handleFeedbackClick("up")}
                >
                  <ThumbsUp className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-6 h-6 p-1",
                    feedbackGiven[message.id] === "down"
                      ? "text-red-500"
                      : "text-gray-400 hover:text-red-500"
                  )}
                  onClick={() => handleFeedbackClick("down")}
                >
                  <ThumbsDown className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-1 text-gray-400 hover:text-white"
                  onClick={() =>
                    navigator.clipboard.writeText(message.response)
                  }
                >
                  <Copy className="w-3 h-3" />
                </Button>
                {isAuthenticated && user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-1 text-gray-400 hover:text-red-500"
                    onClick={handleDeleteClick}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            <div className="w-full max-w-[60%] px-4 py-2 text-sm bg-[#2a2a2a] rounded-2xl rounded-bl-md text-white">
              <ProgressiveMarkdownRenderer content={message.response} />
            </div>
          </div>
        )}

        {/* Property Cards */}
        {message.classification === "Property Search" &&
          parsedPropertyData[message.id] && (
            <div className="w-full max-w-[60%]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-300">
                  Properties Found
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePropertyToggle}
                  className="text-gray-400 hover:text-white"
                >
                  {expandedProperties[message.id] ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {expandedProperties[message.id] && (
                <div className="grid gap-3">
                  {parsedPropertyData[message.id].map((property, propIndex) => (
                    <PropertyCard key={propIndex} property={property} />
                  ))}
                </div>
              )}
            </div>
          )}

        {/* Action Cards */}
        {message.actionCards && message.actionCards.length > 0 && (
          <div className="w-full max-w-[60%] mb-6">
            <div className="grid gap-2">
              {message.actionCards.map(
                (card: ActionCard, cardIndex: number) => (
                  <Card
                    key={cardIndex}
                    className="p-3 cursor-pointer transition-colors hover:bg-[#2a2a2a] border-gray-700"
                    onClick={() => handleCardClick(card)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Home className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{card.title}</h4>
                        <p className="text-sm text-gray-400">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

MessageItem.displayName = "MessageItem";

// Add MessageImages component for displaying uploaded images
const MessageImages: React.FC<{ imageUrls: string[] }> = React.memo(
  ({ imageUrls }) => {
    if (!imageUrls || imageUrls.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2 mb-3">
        {imageUrls.map((url, index) => (
          <div key={url} className="relative group">
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
            <button
              onClick={() => {
                // Open image in new tab
                window.open(url, "_blank");
              }}
              className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
            >
              <div className="p-2 bg-black bg-opacity-50 rounded-full">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </button>
          </div>
        ))}
      </div>
    );
  }
);

MessageImages.displayName = "MessageImages";

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
    // First, try to get properties from context field (legacy support)
    if (Array.isArray(message.context)) {
      return message.context;
    }

    if (typeof message.context === "string" && message.context.trim()) {
      try {
        const parsed = JSON.parse(message.context);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (error) {
        console.error("Failed to parse property context:", error);
      }
    }

    // If no context, try to extract from original_prompt
    if (
      typeof (message as any).original_prompt === "string" &&
      (message as any).original_prompt.trim()
    ) {
      try {
        // Look for the Context: {'properties': [...] pattern
        const contextMatch = (message as any).original_prompt.match(
          /Context:\s*\{'properties':\s*\[([\s\S]*?)\]/
        );
        if (contextMatch) {
          // Extract the properties array part
          const propertiesStart = (message as any).original_prompt.indexOf(
            "'properties': ["
          );
          const propertiesEnd = (message as any).original_prompt.indexOf(
            "], 'search_results': []}",
            propertiesStart
          );

          if (propertiesStart !== -1 && propertiesEnd !== -1) {
            const propertiesString = (message as any).original_prompt.substring(
              propertiesStart + 15,
              propertiesEnd + 1
            );

            // Clean up the string to make it valid JSON
            let cleanedString = propertiesString
              .replace(/'/g, '"') // Replace single quotes with double quotes
              .replace(/None/g, "null") // Replace Python None with JSON null
              .replace(/UUID\([^)]+\)/g, "null") // Replace UUID objects with null
              .replace(/True/g, "true") // Replace Python True with JSON true
              .replace(/False/g, "false"); // Replace Python False with JSON false

            const properties = JSON.parse(cleanedString);
            return Array.isArray(properties) ? properties : [properties];
          }
        }
      } catch (error) {
        console.error(
          "Failed to parse properties from original_prompt:",
          error
        );
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
  return (
    <div className="flex items-center gap-2">
      {/* Simple pulsing dots */}
      <div className="flex space-x-1">
        <motion.div
          className="w-2 h-2 rounded-full bg-gray-400"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="w-2 h-2 rounded-full bg-gray-400"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 0.2,
          }}
        />
        <motion.div
          className="w-2 h-2 rounded-full bg-gray-400"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 0.4,
          }}
        />
      </div>
      <span className="text-sm text-gray-500">AI is thinking</span>
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
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/Image/house.jpeg";
            }}
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

const ChatMessages: React.FC<ChatMessagesProps> = React.memo(
  ({
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
    feedbackGiven: feedbackGivenProp,
    setFeedbackGiven: setFeedbackGivenProp,
    handleFeedback: handleFeedbackProp,
  }) => {
    const allMessages = Array.isArray(messagesProp) ? messagesProp : [];

    // Filter messages by active session - simplified approach
    const messages = useMemo(() => {
      console.log("🎭 ChatMessages filtering:", {
        activeSession,
        allMessagesCount: allMessages.length,
        allMessages: allMessages.map(m => ({ id: m?.id, session: m?.session }))
      });
      
      if (!activeSession) {
        console.log("⚠️ No active session, returning empty array");
        return [];
      }
      
      const filtered = allMessages.filter((msg) => msg && msg.session === activeSession);
      console.log("✅ Filtered messages count:", filtered.length);
      return filtered;
    }, [allMessages, activeSession]);

    const router = useRouter();
    const pathname = usePathname();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Calculate container height - use mobile-first approach to avoid hydration mismatch
    const [containerHeight, setContainerHeight] = useState({
      height: "calc(100vh - 56px - 65px)",
      maxHeight: "calc(100vh - 56px - 25px)",
    });

    // Update height on mount and window resize
    useEffect(() => {
      let resizeTimeout: NodeJS.Timeout;

      const updateHeight = () => {
        const isDesktop = window.matchMedia("(min-width: 768px)").matches;
        setContainerHeight({
          height: isDesktop
            ? "calc(100vh - 56px - 103px)"
            : "calc(100vh - 56px - 65px)",
          maxHeight: isDesktop
            ? "calc(100vh - 56px - 103px)"
            : "calc(100vh - 56px - 25px)",
        });
      };

      // Set correct height on mount
      updateHeight();

      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateHeight, 100); // Debounce resize events
      };

      window.addEventListener("resize", handleResize);
      return () => {
        clearTimeout(resizeTimeout);
        window.removeEventListener("resize", handleResize);
      };
    }, []);
    const [cardLoading, setCardLoading] = useState<string | null>(null);
    const [showLandlordVerification, setShowLandlordVerification] =
      useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(
      null
    );
    const [editedPrompt, setEditedPrompt] = useState<string>("");
    const [showTellYourStory, setShowTellYourStory] = useState(false);
    const [retryingMessageId, setRetryingMessageId] = useState<string | null>(
      null
    );
    // Use props if provided, otherwise use local state as fallback
    const [localFeedbackGiven, setLocalFeedbackGiven] = useState<
      Record<string, "up" | "down" | null>
    >({});
    const feedbackGiven = feedbackGivenProp ?? localFeedbackGiven;
    const setFeedbackGiven = setFeedbackGivenProp ?? setLocalFeedbackGiven;
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
    const lastScrollPositionRef = useRef<number>(0);
    const isScrollingRef = useRef<boolean>(false);
    const previousMessagesLength = useRef(0);
    const lastPromptRef = useRef<HTMLDivElement | null>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const previousActiveSession = useRef<string | null>(null);
    const lastScrollTime = useRef<number>(0);

    // Session loading state - removed local state, using parent's isSessionLoading prop

    // Toggle function for property expansion - memoized to prevent re-renders
    const togglePropertyExpansion = useCallback((messageId: string) => {
      setExpandedProperties((prev) => ({
        ...prev,
        [messageId]: !prev[messageId],
      }));
    }, []);

    // Optimized property parsing effect with ref to prevent unnecessary recalculations
    const previousMessagesRef = useRef<Message[]>([]);
    const parsedMessageIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
      const parseProperties = () => {
        // Only process new messages that haven't been parsed yet
        const newMessages = messages.filter(
          (message) =>
            message?.classification === "Property Search" &&
            message?.response &&
            !parsedMessageIdsRef.current.has(message.id)
        );

        if (newMessages.length === 0) return;

        const newParsedData: Record<string, Context[]> = {};

        newMessages.forEach((message) => {
          try {
            console.log(`Processing Property Search message ${message.id}:`, {
              classification: message.classification,
              hasContext: !!message.context,
              contextType: typeof message.context,
              contextValue: message.context,
              hasOriginalPrompt: !!(message as any).original_prompt,
              originalPromptType: typeof (message as any).original_prompt,
              originalPromptLength: (message as any).original_prompt?.length,
              hasResponse: !!message.response,
              responseLength: message.response?.length,
            });

            const rawProperties = parsePropertyData(message);
            console.log(
              `Raw properties for message ${message.id}:`,
              rawProperties
            );

            const validProperties = rawProperties
              .filter(validateProperty)
              .map(formatProperty);

            console.log(
              `Valid properties for message ${message.id}:`,
              validProperties
            );

            if (validProperties.length > 0) {
              newParsedData[message.id] = validProperties;
              parsedMessageIdsRef.current.add(message.id);
            } else {
              console.log(
                `No valid properties found for message ${message.id}`
              );
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

      // Only run if messages actually changed
      if (messages !== previousMessagesRef.current) {
        parseProperties();
        previousMessagesRef.current = messages;
      }
    }, [messages]);

    // Session loading is now handled by the parent component (page.tsx)
    // This prevents duplicate API calls and double rendering

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
          // Don't scroll to center - let the main scroll effect handle it
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

    // Optimized scroll functions with smooth scrolling and debouncing
    const scrollToBottom = useCallback((smooth = false, force = false) => {
      if (chatContainerRef.current && (!isScrollingRef.current || force)) {
        const now = Date.now();

        // Only debounce if not forced (for auto-scroll)
        if (!force && now - lastScrollTime.current < 50) {
          return;
        }

        isScrollingRef.current = true;
        lastScrollTime.current = now;

        // Clear any existing scroll timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Mark as programmatic scroll to prevent glitches
        const container = chatContainerRef.current;
        if ((container as any)._markProgrammaticScroll) {
          (container as any)._markProgrammaticScroll();
        }

        // Use messagesEndRef for more accurate scrolling
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({
            behavior: smooth ? "smooth" : "auto",
            block: "end",
            inline: "nearest",
          });
        } else {
          // Fallback to scrollHeight method
          if (smooth) {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: "smooth",
            });
          } else {
            container.scrollTop = container.scrollHeight;
          }
        }

        // Reset scrolling flag after a short delay
        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
        }, 150);
      }
    }, []);

    // Scroll to show new prompt taking full viewport height
    // const scrollToShowNewPrompt = useCallback((smooth = true, force = false) => {
    //   if (chatContainerRef.current && (!isScrollingRef.current || force)) {
    //     const now = Date.now();

    //     // Only debounce if not forced
    //     if (!force && now - lastScrollTime.current < 50) {
    //       return;
    //     }

    //     isScrollingRef.current = true;
    //     lastScrollTime.current = now;

    //     // Clear any existing scroll timeout
    //     if (scrollTimeoutRef.current) {
    //       clearTimeout(scrollTimeoutRef.current);
    //     }

    //     // Scroll to bottom to show the new prompt in full viewport
    //     const container = chatContainerRef.current;

    //     if (smooth) {
    //       container.scrollTo({
    //         top: container.scrollHeight,
    //         behavior: 'smooth'
    //       });
    //     } else {
    //       container.scrollTop = container.scrollHeight;
    //     }

    //     // Reset scrolling flag after a short delay
    //     scrollTimeoutRef.current = setTimeout(() => {
    //       isScrollingRef.current = false;
    //     }, 100);
    //   }
    // }, []);

    const isUserAtBottom = useCallback(() => {
      if (!chatContainerRef.current) return false;
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      return scrollTop + clientHeight >= scrollHeight - 50;
    }, []);

    // Consolidated scroll effect for session loading and initial load
    useEffect(() => {
      if (!isSessionLoading && messages.length > 0) {
        // Check if this is a session change
        const isSessionChange = activeSession !== previousActiveSession.current;

        if (isSessionChange) {
          // Reset scroll state for new session
          previousMessagesLength.current = messages.length;
          previousActiveSession.current = activeSession;
          setIsAutoScrollEnabled(true); // Enable auto-scroll for new session

          // Multiple scroll attempts to handle dynamic content loading
          const scrollAttempts = [100, 300, 500, 800]; // Progressive delays
          const timers: NodeJS.Timeout[] = [];

          scrollAttempts.forEach((delay) => {
            const timer = setTimeout(() => {
              // Only scroll if auto-scroll is still enabled (user hasn't scrolled away)
              if (isAutoScrollEnabled) {
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    scrollToBottom(false, true);
                  });
                });
              }
            }, delay);
            timers.push(timer);
          });

          return () => timers.forEach((timer) => clearTimeout(timer));
        }
      }
    }, [
      isSessionLoading,
      messages.length,
      activeSession,
      scrollToBottom,
      isAutoScrollEnabled,
    ]);

    // Handle initial page load/reload with existing session
    useEffect(() => {
      // Only run once on mount if we have messages and a session
      if (
        !isSessionLoading &&
        messages.length > 0 &&
        activeSession &&
        previousMessagesLength.current === 0
      ) {
        // This is the initial load with existing messages
        previousMessagesLength.current = messages.length;
        previousActiveSession.current = activeSession;

        // Multiple scroll attempts to ensure we reach bottom after all content loads
        const scrollAttempts = [150, 350, 600, 1000]; // Progressive delays for reload
        const timers: NodeJS.Timeout[] = [];

        scrollAttempts.forEach((delay) => {
          const timer = setTimeout(() => {
            // Only scroll if auto-scroll is still enabled (user hasn't scrolled away)
            if (isAutoScrollEnabled) {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  scrollToBottom(false, true);
                });
              });
            }
          }, delay);
          timers.push(timer);
        });

        return () => timers.forEach((timer) => clearTimeout(timer));
      }
    }, [
      isSessionLoading,
      messages.length,
      activeSession,
      scrollToBottom,
      isAutoScrollEnabled,
    ]);

    // Consolidated auto-scroll effect - single source of truth for all scrolling
    useEffect(() => {
      const messagesArray = Array.isArray(messages) ? messages : [];

      // Don't scroll if no messages or still loading
      if (messagesArray.length === 0 || isSessionLoading) {
        return;
      }

      const isNewMessage =
        messagesArray.length > previousMessagesLength.current;

      // Only scroll on new messages
      if (isNewMessage) {
        const latestMessage = messagesArray[messagesArray.length - 1];
        const isStreaming = latestMessage && latestMessage.isStreaming;

        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          // Scroll immediately for new messages
          scrollToBottom(!isStreaming, true); // Smooth for non-streaming, instant for streaming
          previousMessagesLength.current = messagesArray.length;
        });
      }
    }, [messages, isSessionLoading, scrollToBottom]);

    // User scroll detection to disable auto-scroll when user manually scrolls up
    useEffect(() => {
      const container = chatContainerRef.current;
      if (!container) return;

      let scrollTimeout: NodeJS.Timeout;
      let isScrollingProgrammatically = false;

      const handleScroll = () => {
        // Skip if this is a programmatic scroll
        if (isScrollingProgrammatically) {
          return;
        }

        // Throttle scroll events for better performance
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const threshold = 150; // Increased threshold for better mobile detection
          const distanceFromBottom =
            container.scrollHeight -
            container.scrollTop -
            container.clientHeight;

          const newAutoScrollState = distanceFromBottom <= threshold;

          // Only update state if it actually changed to prevent unnecessary re-renders
          setIsAutoScrollEnabled((prev) => {
            if (newAutoScrollState !== prev) {
              return newAutoScrollState;
            }
            return prev;
          });
        }, 150); // Increased throttling to reduce glitches on mobile
      };
      // Mark programmatic scrolls
      const markProgrammaticScroll = () => {
        isScrollingProgrammatically = true;
        setTimeout(() => {
          isScrollingProgrammatically = false;
        }, 200);
      };

      container.addEventListener("scroll", handleScroll, { passive: true });

      // Store function to mark programmatic scrolls
      (container as any)._markProgrammaticScroll = markProgrammaticScroll;

      return () => {
        container.removeEventListener("scroll", handleScroll);
        clearTimeout(scrollTimeout);
        delete (container as any)._markProgrammaticScroll;
      };
    }, []); // Remove isAutoScrollEnabled dependency to prevent re-registration

    // Optimized scroll function for progressive text rendering
    const isAutoScrollEnabledRef = useRef(isAutoScrollEnabled);
    const isSessionLoadingRef = useRef(isSessionLoading);

    // Keep refs in sync
    useEffect(() => {
      isAutoScrollEnabledRef.current = isAutoScrollEnabled;
      isSessionLoadingRef.current = isSessionLoading;
    }, [isAutoScrollEnabled, isSessionLoading]);

    const handleTextUpdate = useCallback(() => {
      // Only auto-scroll if enabled and not during session loading
      if (!isAutoScrollEnabledRef.current || isSessionLoadingRef.current) {
        return;
      }

      // Use requestAnimationFrame for smoother rendering
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          const container = chatContainerRef.current;
          // Check if user is at bottom before auto-scrolling
          const isAtBottom =
            container.scrollTop + container.clientHeight >=
            container.scrollHeight - 100; // Increased threshold for better detection

          if (isAtBottom && messagesEndRef.current) {
            // Use scrollIntoView for more accurate positioning
            messagesEndRef.current.scrollIntoView({
              behavior: "auto",
              block: "end",
              inline: "nearest",
            });
          }
        }
      });
    }, []); // Now stable - no dependencies

    // Handle image loading for more accurate scroll positioning
    // Only runs on session changes, not on every new message
    useEffect(() => {
      if (
        !isSessionLoading &&
        messages.length > 0 &&
        chatContainerRef.current
      ) {
        const container = chatContainerRef.current;
        const images = container.querySelectorAll("img");

        if (images.length === 0) return;

        let loadedCount = 0;
        const totalImages = images.length;
        let hasScrolled = false; // Prevent scroll loop

        const handleImageLoad = () => {
          loadedCount++;
          // Only scroll once when first image loads, not for every image
          if (!hasScrolled) {
            hasScrolled = true;
            requestAnimationFrame(() => {
              scrollToBottom(false, true);
            });
          }
        };

        images.forEach((img) => {
          if (img.complete) {
            loadedCount++;
          } else {
            img.addEventListener("load", handleImageLoad, { once: true });
            img.addEventListener("error", handleImageLoad, { once: true });
          }
        });

        // If all images are already loaded, scroll once
        if (loadedCount === totalImages && !hasScrolled) {
          hasScrolled = true;
          setTimeout(() => {
            scrollToBottom(false, true);
          }, 100);
        }

        return () => {
          images.forEach((img) => {
            img.removeEventListener("load", handleImageLoad);
            img.removeEventListener("error", handleImageLoad);
          });
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      activeSession, // Only re-run on session changes, not message changes
      isSessionLoading,
      scrollToBottom,
    ]); // Removed isAutoScrollEnabled to prevent re-running during scroll

    // Cleanup scroll timeout on unmount
    useEffect(() => {
      return () => {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, []);

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
          prev.map((m) =>
            m.id === messageId ? { ...m, prompt: newPrompt } : m
          )
        );

        if (!newPrompt || !sessionId) {
          throw new Error("Prompt and session ID are required");
        }

        const response = await chatAPI.editChat(
          messageId,
          newPrompt,
          sessionId
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
            msg.id === message.id
              ? { ...msg, retrying: true, error: false }
              : msg
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
          context: data.context as Context[] | undefined,
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

        // Let the main scroll effect handle scrolling

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

    // Use prop if provided, otherwise create local implementation
    const handleFeedback = handleFeedbackProp ?? (async (messageId: string, type: "up" | "down") => {
      try {
        // Map UI feedback to API reaction types
        const reactionType = type === "up" ? "like" : "dislike";

        // Call API to submit reaction
        await chatAPI.reactToChat(messageId, reactionType);

        // Update local message state with the reaction
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, reaction: reactionType }
              : msg
          )
        );

        // Update feedback state for UI highlighting
        setFeedbackGiven((prev) => ({
          ...prev,
          [messageId]: type,
        }));

        toast({
          description: `Feedback submitted: ${type === "up" ? "👍" : "👎"}`,
        });
      } catch (error) {
        console.error("Error submitting feedback:", error);
        toast({
          title: "Error",
          description: "Failed to submit feedback",
          variant: "destructive",
        });
      }
    });

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
          const errorMessage =
            error.response?.data?.error || error.message || "";
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
          context: data.context as Context[] | undefined,
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
        // Only log once per message to avoid spam
        if (!message._propertyDataLogged) {
          console.log(`Rendering property data for message ${message.id}:`, {
            hasParsedData: !!parsedPropertyData[message.id],
            parsedDataLength: parsedPropertyData[message.id]?.length || 0,
            parsedData: parsedPropertyData[message.id],
          });
          message._propertyDataLogged = true;
        }

        const properties = parsedPropertyData[message.id] || [];

        // Show all properties regardless of status
        const availableProperties = properties.filter(
          (prop) => prop && prop.id // Only filter out invalid properties
        );

        // Only log once per message to avoid spam
        if (!message._propertyFilterLogged) {
          console.log(
            `Available properties for message ${message.id}:`,
            availableProperties
          );
          console.log(
            `Property statuses:`,
            properties.map((p) => ({
              id: p.id,
              status: p.status,
              title: p.title,
            }))
          );
          message._propertyFilterLogged = true;
        }

        if (availableProperties.length === 0) {
          if (!message._noPropertiesLogged) {
            console.log(
              `No available properties found for message ${message.id}`
            );
            message._noPropertiesLogged = true;
          }
          return null;
        }

        const isExpanded = expandedProperties[message.id] || false;

        return (
          <div className="my-4 space-y-4">
            {/* Toggle Button */}
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-[#CCCCCC]">
                Found {availableProperties.length} Properties
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
            "flex-1 overflow-y-auto bg-background transition-all duration-300",
            sidebarCollapsed ? "md:pl-16" : "md:",
            sidebarOpen ? "lg:pl-44" : "lg:pl-0",
            "" // No bottom padding - input is fixed at bottom
          )}
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            touchAction: "pan-y",
            // Mobile: reduced gap for compact fit
            height: containerHeight.height,
            maxHeight: containerHeight.maxHeight,
            paddingBottom: "20px", // Minimal padding to prevent content from going under input
          }}
        >
          {isSessionLoading ? (
            <LoaderAnimation variant="typing" text="Loading chat session" />
          ) : (
            <div className="flex flex-col w-full p-4 pt-14 mx-auto md:max-w-[880px]">
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
                    {/* Social Feed Button - Only show when authenticated */}
                    {/* {isAuthenticated && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 }}
                      className="w-full max-w-[143px] mx-auto mb-6"
                    >
                         <Button
                           onClick={() => router.push("/social-feed")}
                          className="w-full text-white font-medium py-3 rounded-[15px] transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 relative overflow-hidden"
                          style={{
                            background: 'linear-gradient(#141414, #141414) padding-box, linear-gradient(45deg, #FFD700, #780991) border-box',
                            border: '2px solid transparent'
                          }}
                         >
                        
                        View Social Feed
                      </Button>
                    </motion.div>
                  )} */}
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
                                <span className="text-[20px]">
                                  {card.image}
                                </span>
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
                          transition={{
                            duration: 0.3,
                            delay: (index + 2) * 0.1,
                          }}
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
                                <span className="text-[20px]">
                                  {card.image}
                                </span>
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

              {/* Loading Skeleton for Session Loading */}
              {isSessionLoading && (
                <div className="flex flex-col items-start self-start w-full mx-auto space-y-4">
                  <MessageSkeleton />
                  <MessageSkeleton />
                  <MessageSkeleton />
                </div>
              )}

              {/* Chat Messages */}
              {messages.length > 0 && (
                <div className="flex flex-col items-start self-start w-full mx-auto space-y-4 font-normal text-white">
                  {/* Social Feed Button - Hidden for production */}
                  {/* {isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed top-640px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-[200px]"
                  >
                    <Button
                      onClick={() => router.push("/social-feed")}
                      className="w-full text-white font-medium py-2 px-4 rounded-[15px] transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 relative overflow-hidden text-sm"
                      style={{
                        background: 'linear-gradient(#141414, #141414) padding-box, linear-gradient(45deg, #FFD700, #780991) border-box',
                        border: '2px solid transparent'
                      }}
                    >
                      View Social Feed
                    </Button>
                  </motion.div>
                )} */}

                  <AnimatePresence>
                    {messages.map((message: any, index: number) => {
                      if (!message) return null;

                      const isLastPrompt =
                        message.prompt &&
                        !message.response &&
                        index === messages.length - 1;

                      return (
                        <motion.div
                          key={message.id || `msg-${index}`}
                          ref={isLastPrompt ? lastPromptRef : null}
                          className={cn(
                            "w-full space-y-2 group",
                            index === messages.length - 1 && "mb-8" // Extra margin for the latest message
                          )}
                          initial={false}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
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
                              <div className="w-full max-w-[60%]">
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

                                <motion.div
                                  className={`rounded-[10px] rounded-tr-none p-4 border-2 border-border flex-1 flex items-center ${
                                    message?.response ? "" : "bg-muted"
                                  }`}
                                  initial={false}
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
                              <div className="flex items-start gap-2 md:gap-4 md:max-w-[80%] w-full rounded-lg md:p-4 mt-2">
                                <div>
                                  <Image
                                    src={star || "/placeholder.svg"}
                                    alt="Response Image"
                                    className="relative object-cover w-5 h-5 rounded-full md:w-8 md:h-8 ml-[-2px]"
                                  />
                                </div>
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
                                            firstProperty.image_url ||
                                            undefined,
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
                                            console.log(
                                              `Text animation completed for message ${message.id}`
                                            );
                                            setTextAnimationCompleted(
                                              (prev) => ({
                                                ...prev,
                                                [message.id]: true,
                                              })
                                            );
                                          }}
                                        />

                                        {(() => {
                                          const isLatestMessage =
                                            message.id === latestMessageId;
                                          const shouldRender =
                                            (textAnimationCompleted[
                                              message.id
                                            ] ||
                                              !isLatestMessage) &&
                                            message.classification ===
                                              "Property Search";

                                          if (!shouldRender) return null;

                                          // Only log once per message to avoid spam
                                          if (!message._propertyRenderLogged) {
                                            console.log(
                                              `Property rendering condition for message ${message.id}:`,
                                              {
                                                textAnimationCompleted:
                                                  textAnimationCompleted[
                                                    message.id
                                                  ],
                                                isLatestMessage,
                                                classification:
                                                  message.classification,
                                                shouldRender,
                                              }
                                            );
                                            message._propertyRenderLogged =
                                              true;
                                          }

                                          return renderPropertyData(message);
                                        })()}

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
                                      (message.file.includes(
                                        "cloudinary.com"
                                      ) ||
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
                              </div>
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
                                    {message.errorMessage ||
                                      "An error occurred"}
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
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              )}

              {/* Scroll to Bottom Button */}
              {!isAutoScrollEnabled && (
                <div
                  className="fixed z-50 w-full max-w-5xl px-4 transform -translate-x-1/2 pointer-events-none left-1/2"
                  style={{
                    bottom: "calc(100px + env(safe-area-inset-bottom))",
                  }}
                >
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
  }
);

ChatMessages.displayName = "ChatMessages";

export default ChatMessages;
