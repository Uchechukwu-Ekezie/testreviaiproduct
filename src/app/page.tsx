"use client";

import React, {
  Suspense,
  useMemo,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useMediaQuery } from "@/hooks/use-mobile";
import { toast } from "@/components/ui/use-toast";
import { chatAPI } from "@/lib/api";
import { extractErrorMessage } from "@/utils/error-handler";
import { cn } from "@/lib/utils";

// Import components
import ChatSidebar from "@/components/chatpage/chat-sidebar";
import ChatHeader from "@/components/chatpage/chat-header";
import ChatMessages from "@/components/chatpage/chat-message";
import RenameDialog from "@/components/chatpage/rename-dialog";
import ChatInput from "@/components/chatpage/chat-input";

import { Message, Context } from "@/types/chatMessage";
import type { ChatSubmitOptions, ChatSubmitLocation } from "@/types/chat";
import { getUserLocation, formatCoordinates } from "@/utils/geolocation";

interface ChatSession {
  id: string;
  chat_title: string;
  user: string;
  created_at?: string;
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const id = searchParams?.get("id") || pathname?.split("/").pop() || null;

  // Use localStorage to persist sidebar state across navigation and refreshes
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration-safe initialization
  useEffect(() => {
    setIsHydrated(true);
    const stored = localStorage.getItem("sidebarState");
    if (stored) {
      setSidebarOpen(stored === "true");
    }
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("sidebarState", String(sidebarOpen));
    }
  }, [sidebarOpen, isHydrated]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // FIXED: Ensure messages is always initialized as an array
  const [messagesState, setMessagesState] = useState<Message[]>([]);

  // Message cache to avoid refetching messages for sessions we've already loaded
  const [messageCache, setMessageCache] = useState<Record<string, Message[]>>(
    {}
  );
  const [cacheTimestamps, setCacheTimestamps] = useState<
    Record<string, number>
  >({});
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // FIXED: Use useMemo for messages to avoid dependency issues
  const messages = useMemo(
    () => (Array.isArray(messagesState) ? messagesState : []),
    [messagesState]
  );

  // Use media queries for responsive behavior
  const isLgScreen = useMediaQuery("(min-width: 1024px)");
  const isMediumScreen = useMediaQuery(
    "(min-width: 768px) and (max-width: 1023px)"
  );

  // FIXED: Create a safe setter that only accepts arrays
  const setMessages = useCallback(
    (value: Message[] | ((prev: Message[]) => Message[])) => {
      if (typeof value === "function") {
        setMessagesState((prev) => {
          const currentMessages = Array.isArray(prev) ? prev : [];
          const newMessages = value(currentMessages);
          return Array.isArray(newMessages) ? newMessages : [];
        });
      } else {
        setMessagesState(Array.isArray(value) ? value : []);
      }
    },
    []
  );

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [previousActiveSession, setPreviousActiveSession] = useState<
    string | null
  >(null);
  const [newTitle, setNewTitle] = useState("");
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [latestMessageId, setLatestMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isCreatingNewSession = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionsLoadedRef = useRef(false);
  const loadingSessionRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const activeSessionRef = useRef<string | null>(null);
  const loadingFromUrlRef = useRef(false);
  const [isClient, setIsClient] = useState(false);
  const pendingMessageRef = useRef<{
    message: string;
    imageUrls?: string[];
    location?: ChatSubmitLocation;
  } | null>(null);
  const lastLocationRef = useRef<ChatSubmitLocation | null>(null);
  const [lastLocationLabel, setLastLocationLabel] = useState<string | null>(
    null
  );

  // Fix hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check for pending chat message from social feed (only set input, don't submit yet)
  useEffect(() => {
    if (!isClient) return;

    const pendingMessage = sessionStorage.getItem("pendingChatMessage");
    if (pendingMessage) {
      // Store in ref for later submission
      const pendingImages = sessionStorage.getItem("pendingChatImages");
      const pendingLocation = sessionStorage.getItem("pendingChatLocation");
      let imageUrls: string[] | undefined;
      let location: { latitude: number; longitude: number } | undefined;

      if (pendingImages) {
        try {
          imageUrls = JSON.parse(pendingImages);
        } catch (e) {
          console.error("Error parsing pending images:", e);
        }
      }

      if (pendingLocation) {
        try {
          location = JSON.parse(pendingLocation);
        } catch (e) {
          console.error("Error parsing pending location:", e);
        }
      }

      pendingMessageRef.current = {
        message: pendingMessage,
        imageUrls,
        location,
      };

      // Set the input with the pending message
      setInput(pendingMessage);

      // Clear from sessionStorage
      sessionStorage.removeItem("pendingChatMessage");
      sessionStorage.removeItem("pendingChatImages");
      sessionStorage.removeItem("pendingChatFile");
      sessionStorage.removeItem("pendingChatLocation");
    }
  }, [isClient, setInput]);

  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Keep activeSessionRef in sync with activeSession state
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  // Memoize actionCards to prevent recreation on every render
  const actionCards = useMemo(
    () => [
      {
        title: "Find a Property",
        description: "Search for homes to rent or buy",
        image: "🏡",
        message: "I want to find a property.",
      },
      {
        title: "Report your Landlord",
        description: "Check credentials and reviews",
        image: "🚨",
        message: "Can I verify my landlord?",
      },
      {
        title: "Tell your story",
        description: "Share your experience with us",
        image: "✍️",
        message: "I want to tell my story.",
      },
      {
        title: "Explore Neighborhoods",
        description: "Discover nearby amenities and more",
        image: "🧭",
        message: "Tell me about my neighborhood.",
      },
    ],
    []
  );

  // Memoized getSessions function to prevent recreation
  const getSessions = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        setSessions([]);
        sessionsLoadedRef.current = true;
        return [];
      }

      setIsLoadingSessions(true);
      const data = await chatAPI.getSessionsMine();

      // Handle paginated response
      let sessions: any[] = [];
      if (
        data &&
        typeof data === "object" &&
        "results" in data &&
        Array.isArray(data.results)
      ) {
        sessions = data.results;
      } else if (Array.isArray(data)) {
        sessions = data;
      } else {
        console.warn("Unexpected response format from getSessionsMine:", data);
        setSessions([]);
        sessionsLoadedRef.current = true;
        return [];
      }

      const sortedSessions = [...sessions].sort((a, b) => {
        if (a.created_at && b.created_at) {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
        return 0;
      });

      setSessions(sortedSessions);
      sessionsLoadedRef.current = true;

      // Preload messages for the first few sessions for faster navigation
      // This will be handled by a separate useEffect after preloadSessionMessages is defined

      // Use ref to get current activeSession without dependency
      const currentActiveSession = activeSessionRef.current;
      if (currentActiveSession && !loadingFromUrlRef.current) {
        const sessionExists = sortedSessions.some(
          (session) => session.id === currentActiveSession
        );
        if (!sessionExists) {
          setActiveSession(null);
          setMessages([]);
        }
      }

      return sortedSessions;
    } catch (error: unknown) {
      console.error("Error fetching sessions:", error);
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response &&
        "status" in error.response &&
        error.response.status !== 401
      ) {
        toast({
          title: "Error",
          description: "Failed to fetch chat sessions",
          variant: "destructive",
        });
      }
      setSessions([]);
      return [];
    } finally {
      setIsLoadingSessions(false);
    }
  }, [isAuthenticated, setSessions, setActiveSession, setMessages]);

  const getChats = useCallback(
    async (sessionId: string, forceRefresh = false) => {
      if (isCreatingNewSession.current) {
        return [];
      }

      // Check cache first for faster loading
      if (!forceRefresh && messageCache[sessionId]) {
        const cacheTime = cacheTimestamps[sessionId] || 0;
        const isCacheValid = Date.now() - cacheTime < CACHE_DURATION;

        if (isCacheValid) {
          // Load from cache instantly
          setMessages(messageCache[sessionId]);
          setTimeout(() => {
            scrollToBottomWithAnchoring();
          }, 50);
          return messageCache[sessionId];
        }
      }

      // Prevent duplicate API calls for the same session only if we're actually loading
      if (
        loadingSessionRef.current === sessionId &&
        loadingSessionRef.current !== null
      ) {
        return [];
      }

      // Use ref to get current messages without causing dependency issues
      const currentMessages = messagesRef.current;
      const hasPendingMessage = currentMessages.some(
        (msg) => msg && msg.session === sessionId && !msg.response && !msg.error
      );

      if (hasPendingMessage) {
        return [];
      }

      try {
        loadingSessionRef.current = sessionId; // Set loading ref here, not before calling
        const data: any = await chatAPI.getChatsBySession(sessionId);

        // FIXED: Better validation of API response - handle both array and object responses
        let results: any[];
        if (Array.isArray(data)) {
          results = data;
        } else if (data && data.results && Array.isArray(data.results)) {
          results = data.results;
        } else {
          console.warn("Invalid response from getChatsBySession:", data);
          return [];
        }

        const sortedMessages = [...results].sort((a, b) => {
          if (a.created_at && b.created_at) {
            return (
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
            );
          }
          return 0;
        });

        // FIXED: Ensure we're working with valid message objects
        const validMessages = sortedMessages.filter(
          (msg) => msg && typeof msg === "object" && msg.id
        );

        // Cache the messages for faster future loading
        setMessageCache((prev) => ({
          ...prev,
          [sessionId]: validMessages,
        }));
        setCacheTimestamps((prev) => ({
          ...prev,
          [sessionId]: Date.now(),
        }));

        // When switching sessions, always set the messages for the new session
        // Don't try to merge with existing messages from other sessions
        setMessages(validMessages);

        setTimeout(() => {
          scrollToBottomWithAnchoring();
        }, 50); // Reduced delay for faster perceived performance

        return validMessages;
      } catch (error: unknown) {
        console.error("Error fetching chats for session:", sessionId, error);
        const errorMessage = extractErrorMessage(
          error,
          "Failed to fetch chat messages"
        );
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return [];
      }
    },
    [setMessages, messageCache, cacheTimestamps, CACHE_DURATION] // Removed messages dependency to prevent infinite loops
  );

  useEffect(() => {
    if (isAuthenticated) {
      getSessions();
    } else {
      // Clear sessions and messages when user logs out
      setSessions([]);
      setMessages([]);
      setActiveSession(null);
      sessionsLoadedRef.current = false;
    }
  }, [isAuthenticated]); // Removed pathname dependency

  // Memoized refreshSessions function
  const refreshSessions = useCallback(async () => {
    if (isAuthenticated) {
      await getSessions();
    }
  }, [isAuthenticated, getSessions]);

  // Clear message cache for a specific session or all sessions
  const clearMessageCache = useCallback((sessionId?: string) => {
    if (sessionId) {
      setMessageCache((prev) => {
        const newCache = { ...prev };
        delete newCache[sessionId];
        return newCache;
      });
      setCacheTimestamps((prev) => {
        const newTimestamps = { ...prev };
        delete newTimestamps[sessionId];
        return newTimestamps;
      });
    } else {
      // Clear all cache
      setMessageCache({});
      setCacheTimestamps({});
    }
  }, []);

  // Preload messages for sessions to make navigation even faster
  const preloadSessionMessages = useCallback(
    async (sessionId: string) => {
      if (!messageCache[sessionId] && !loadingSessionRef.current) {
        try {
          const data: any = await chatAPI.getChatsBySession(sessionId);
          let results: any[];
          if (Array.isArray(data)) {
            results = data;
          } else if (data && data.results && Array.isArray(data.results)) {
            results = data.results;
          } else {
            return;
          }

          const sortedMessages = [...results].sort((a, b) => {
            if (a.created_at && b.created_at) {
              return (
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
              );
            }
            return 0;
          });

          const validMessages = sortedMessages.filter(
            (msg) => msg && typeof msg === "object" && msg.id
          );

          // Cache the messages
          setMessageCache((prev) => ({
            ...prev,
            [sessionId]: validMessages,
          }));
          setCacheTimestamps((prev) => ({
            ...prev,
            [sessionId]: Date.now(),
          }));
        } catch (error) {
          // Silently fail for preloading
          console.warn("Failed to preload session:", sessionId, error);
        }
      }
    },
    [messageCache]
  );

  // Preload messages for sessions when they're loaded
  useEffect(() => {
    if (sessions.length > 0 && isAuthenticated) {
      const sessionsToPreload = sessions.slice(0, 3);
      sessionsToPreload.forEach((session) => {
        if (session.id !== activeSessionRef.current) {
          preloadSessionMessages(session.id);
        }
      });
    }
  }, [sessions, isAuthenticated, preloadSessionMessages]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, []);

  // Enhanced scroll to bottom with viewport anchoring (new messages at bottom)
  const scrollToBottomWithAnchoring = useCallback(() => {
    if (messagesEndRef.current) {
      // Scroll to bottom where new messages appear
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  }, []);

  // Optimized scroll effect with debouncing
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottomWithAnchoring();
      }, 50); // Small delay to prevent excessive scroll calls

      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToBottomWithAnchoring]); // Only depend on length, not the entire messages array

  // Update URL when activeSession changes (using pushState to avoid refreshes)
  useEffect(() => {
    if (activeSession && pathname !== `/chats/${activeSession}`) {
      window.history.pushState({}, "", `/chats/${activeSession}`);
    } else if (!activeSession && pathname !== "/") {
      window.history.pushState({}, "", "/");
    }
  }, [activeSession, pathname]);

  useEffect(() => {
    const handlePopState = () => {
      const pathParts = window.location.pathname.split("/");
      const sessionId = pathParts[pathParts.length - 1];

      if (sessionId && sessionId !== "chats") {
        setActiveSession(sessionId);
      } else {
        setActiveSession(null);
        setMessages([]);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // URL-based session loading effect
  useEffect(() => {
    if (id && id !== activeSessionRef.current && !loadingFromUrlRef.current) {
      const loadSessionFromUrl = async () => {
        try {
          loadingFromUrlRef.current = true;
          setIsSessionLoading(true);
          const sessionId = id as string;

          // First check if we have the session in our local list
          const sessionInList = sessions.some((s) => s.id === sessionId);

          if (sessionInList) {
            // Session exists in our list, proceed to load it
            setActiveSession(sessionId);
            await getChats(sessionId);
          } else {
            // Session not in our list, try to verify it exists on server
            try {
              await chatAPI.getChatSession(sessionId);
              // If we get here, session exists but wasn't in our list
              setActiveSession(sessionId);
              await getChats(sessionId);
            } catch (error) {
              console.error("Error checking session existence:", error);

              // Check if it's a 401 error (session exists but not authorized)
              if (
                error &&
                typeof error === "object" &&
                "response" in error &&
                error.response &&
                typeof error.response === "object" &&
                "status" in error.response &&
                error.response.status === 401
              ) {
                // Session exists but user is not authenticated
                setActiveSession(sessionId);
                await getChats(sessionId); // This will show the proper auth error
              } else {
                // Session truly doesn't exist
                toast({
                  title: "Session not found",
                  description: "The requested chat session could not be found",
                  variant: "destructive",
                });
                window.history.pushState({}, "", "/");
                setActiveSession(null);
              }
            }
          }
        } catch (error) {
          console.error("Error loading session from URL:", error);
          window.history.pushState({}, "", "/");
          setActiveSession(null);
        } finally {
          setIsSessionLoading(false);
          loadingFromUrlRef.current = false;
        }
      };

      loadSessionFromUrl();
    }
  }, [id, sessions]); // Removed activeSession dependency to prevent URL switching loop

  // Session switching effect (from sidebar clicks) - Optimized for faster loading
  useEffect(() => {
    if (
      activeSession &&
      !isCreatingNewSession.current &&
      previousActiveSession !== activeSession &&
      loadingSessionRef.current !== activeSession
    ) {
      // Check if we have cached messages for instant loading
      if (messageCache[activeSession]) {
        const cacheTime = cacheTimestamps[activeSession] || 0;
        const isCacheValid = Date.now() - cacheTime < CACHE_DURATION;

        if (isCacheValid) {
          // Load from cache instantly - no loading state needed
          setMessages(messageCache[activeSession]);
          setPreviousActiveSession(activeSession);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 50);
          return;
        }
      }

      // Only show loading for uncached sessions
      setIsSessionLoading(true);

      // Call getChats directly - it's stable now
      getChats(activeSession)
        .then((messages) => {
          setIsSessionLoading(false);
          loadingSessionRef.current = null;
        })
        .catch((error) => {
          console.error("getChats failed for session:", activeSession, error);
          setIsSessionLoading(false);
          loadingSessionRef.current = null;
        });

      // Update the previous active session tracker
      setPreviousActiveSession(activeSession);
    } else if (!activeSession && previousActiveSession !== null) {
      // Reset when no active session (only if it actually changed)
      setPreviousActiveSession(null);
      setIsSessionLoading(false);
    }
  }, [
    activeSession,
    previousActiveSession,
    getChats,
    messageCache,
    cacheTimestamps,
    CACHE_DURATION,
  ]); // Added cache dependencies

  type PostChatWithImagesOptions = {
    signal?: AbortSignal;
    skipAddingTempMessage?: boolean;
    file?: File;
    tempId?: string;
    locationDetails?: ChatSubmitLocation | null;
    locationString?: string | null;
    userLatitude?: number;
    userLongitude?: number;
  };

  // Enhanced postChat function with image support
  const postChatWithImages = useCallback(
    async (
      input: string,
      activeSession?: string,
      imageUrls?: string[],
      options?: PostChatWithImagesOptions
    ) => {
      try {
        // Use provided tempId if available, otherwise generate new one
        const tempMessageId = options?.tempId || "temp-" + Date.now();

        const tempMessage: Message = {
          id: tempMessageId,
          prompt: input,
          response: "",
          session: activeSession,
          imageUrls: imageUrls && imageUrls.length > 0 ? imageUrls : undefined,
          // 🔥 CRITICAL FIX: Include file in temp message so it displays immediately
          file: options?.file ? options.file.name : undefined, // Use filename for display
          attachments: options?.file ? [options.file] : undefined, // Store actual file object
        };

        // Check if we should skip adding temp message (to avoid duplicates)
        if (!options?.skipAddingTempMessage) {
          setMessages((prev) => {
            // Avoid unnecessary re-renders by checking if message already exists
            if (prev.some((msg) => msg.id === tempMessageId)) {
              return prev;
            }
            return [...prev, tempMessage];
          });
        }

        let sessionId = activeSession;
        let newSessionData: ChatSession | null = null;

        if (!sessionId) {
          isCreatingNewSession.current = true;

          const userId = user?.id || "guest";
          const sessionData = {
            chat_title: input.substring(0, 30),
            user: userId,
          };

          try {
            setMessages((prev) =>
              prev.map((msg) =>
                msg && msg.id === tempMessageId
                  ? { ...msg, isNewSession: true }
                  : msg
              )
            );

            newSessionData = await chatAPI.createChatSession(sessionData);

            if (!newSessionData) {
              throw new Error("Failed to create new chat session");
            }

            sessionId = newSessionData.id;

            setSessions((prev: ChatSession[]) => {
              if (prev.some((s) => s.id === newSessionData!.id)) {
                return prev;
              }
              return [newSessionData!, ...prev];
            });

            setActiveSession(sessionId);

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempMessageId
                  ? { ...msg, session: sessionId, isNewSession: true }
                  : msg
              )
            );
          } catch (error) {
            console.error("Error creating session:", error);

            const errorMessage = extractErrorMessage(
              error,
              "Failed to create session"
            );

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempMessageId
                  ? {
                      ...msg,
                      error: true,
                      errorMessage: errorMessage,
                    }
                  : msg
              )
            );
            throw error;
          }
        }

        try {
          const locationDetails = options?.locationDetails ?? null;
          const resolvedLatitude =
            options?.userLatitude ??
            (locationDetails ? locationDetails.latitude : undefined);
          const resolvedLongitude =
            options?.userLongitude ??
            (locationDetails ? locationDetails.longitude : undefined);
          const resolvedLocationString =
            options?.locationString ??
            (locationDetails ? locationDetails.label ?? null : null);

          // Prepare message for API call with image URLs and files
          const apiOptions: {
            signal?: AbortSignal;
            imageUrls?: string[];
            image_url?: string;
            file?: File;
            user_latitude?: number;
            user_longitude?: number;
            location?: string;
          } = options?.signal ? { signal: options.signal } : {};

          // Include image URLs properly
          if (imageUrls && imageUrls.length > 0) {
            apiOptions.imageUrls = imageUrls;
            apiOptions.image_url = imageUrls[0]; // Use first image as primary
          }

          // Include file if provided from handleSubmit options
          if (options?.file) {
            apiOptions.file = options.file;
          }

          // Include location coordinates if provided
          console.log("🔍 postChatWithImages - options received:", options);
          if (
            resolvedLatitude !== undefined &&
            resolvedLongitude !== undefined
          ) {
            console.log("📍 Adding coordinates to API options:", {
              latitude: resolvedLatitude,
              longitude: resolvedLongitude,
            });
            apiOptions.user_latitude = resolvedLatitude;
            apiOptions.user_longitude = resolvedLongitude;
          } else {
            console.log("⚠️ No coordinates resolved from options");
          }

          if (resolvedLocationString) {
            console.log(
              "🆔 Adding location string to API options:",
              resolvedLocationString
            );
            apiOptions.location = resolvedLocationString;
          }

          // Use streaming API for ChatGPT-style response
          const data = await chatAPI.postNewChatStreaming(input, sessionId!, {
            ...apiOptions,
            onChunk: (chunk: string, isComplete: boolean) => {
              // Update the temp message with streaming content
              setMessages((prev) => {
                const tempIndex = prev.findIndex(
                  (msg) => msg && msg.id === tempMessageId
                );

                if (tempIndex >= 0) {
                  const newMessages = [...prev];
                  newMessages[tempIndex] = {
                    ...newMessages[tempIndex],
                    response: chunk,
                    isStreaming: !isComplete,
                  };
                  return newMessages;
                }
                return prev;
              });
            },
          });
          setLatestMessageId(data.id);

          setMessages((prev) => {
            const tempIndex = prev.findIndex(
              (msg) => msg && msg.id === tempMessageId
            );

            if (tempIndex >= 0) {
              const newMessages = [...prev];
              // Get the temp message to preserve file information
              const tempMessage = prev[tempIndex];

              // Transform the API response to match Message interface
              const transformedMessage: Message = {
                id: data.id,
                prompt: data.prompt,
                response: data.response,
                session: sessionId,
                classification: data.classification,
                context: data.context as Context[] | undefined,
                image_url: data.image_url,
                isStreaming: false, // Mark streaming as complete
                // 🔥 PRESERVE FILE: Use backend file if available, otherwise keep temp file
                file: data.file || tempMessage?.file || undefined,
                attachments: tempMessage?.attachments || undefined, // Preserve attachments
                imageUrls:
                  imageUrls && imageUrls.length > 0 ? imageUrls : undefined,
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
              newMessages[tempIndex] = transformedMessage;
              return newMessages;
            } else {
              const existingIndex = prev.findIndex(
                (msg) => msg && msg.id === data.id
              );
              if (existingIndex >= 0) {
                const newMessages = [...prev];
                // Transform the API response to match Message interface
                const transformedMessage: Message = {
                  id: data.id,
                  prompt: data.prompt,
                  response: data.response,
                  session: sessionId,
                  classification: data.classification,
                  context: data.context as Context[] | undefined,
                  image_url: data.image_url,
                  isStreaming: false, // Mark streaming as complete
                  file: data.file,
                  imageUrls:
                    imageUrls && imageUrls.length > 0 ? imageUrls : undefined,
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
                newMessages[existingIndex] = transformedMessage;
                return newMessages;
              } else {
                // Transform the API response to match Message interface
                const transformedMessage: Message = {
                  id: data.id,
                  prompt: data.prompt,
                  response: data.response,
                  session: sessionId,
                  classification: data.classification,
                  context: data.context as Context[] | undefined,
                  image_url: data.image_url,
                  isStreaming: false, // Mark streaming as complete
                  file: data.file,
                  imageUrls:
                    imageUrls && imageUrls.length > 0 ? imageUrls : undefined,
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
                return [...prev, transformedMessage];
              }
            }
          });

          // Invalidate cache for this session since we have new messages
          if (sessionId) {
            clearMessageCache(sessionId);
          }

          if (newSessionData) {
            setSessions((prev) => {
              const existingSession = prev.find((s) => s.id === sessionId);
              if (!existingSession) {
                return [
                  {
                    ...newSessionData!,
                    chat_title: newSessionData!.chat_title,
                    first_message: input,
                  },
                  ...prev,
                ];
              }
              return prev;
            });

            setTimeout(() => {
              setActiveSession(sessionId);
              isCreatingNewSession.current = false;
            }, 100);
          }

          setTimeout(scrollToBottomWithAnchoring, 100);
          return data;
        } catch (error) {
          console.error("Error posting chat:", error);

          const postErrorMessage =
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
              : "Failed to post chat";

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempMessageId
                ? {
                    ...msg,
                    error: true,
                    session: sessionId,
                    errorMessage: postErrorMessage,
                  }
                : msg
            )
          );

          if (newSessionData && sessionId) {
            setActiveSession(sessionId);
          }

          isCreatingNewSession.current = false;
          throw error;
        }
      } catch (error: unknown) {
        console.error("Error in postChatWithImages:", error);
        isCreatingNewSession.current = false;
        throw error;
      }
    },
    [
      user,
      setMessages,
      setSessions,
      setActiveSession,
      setLatestMessageId,
      scrollToBottomWithAnchoring,
    ]
  );

  // Original postChat function for backward compatibility
  const postChat = useCallback(
    async (
      input: string,
      activeSession?: string,
      options?: ChatSubmitOptions & {
        signal?: AbortSignal;
        skipAddingTempMessage?: boolean;
        tempId?: string;
      }
    ) => {
      const imageUrls = options?.imageUrls;
      const locationDetails =
        options?.locationDetails ??
        (options?.userLatitude !== undefined &&
        options?.userLongitude !== undefined
          ? {
              latitude: options.userLatitude,
              longitude: options.userLongitude,
              label: options.locationLabel ?? options.location ?? undefined,
            }
          : null);
      const locationString =
        options?.location ?? options?.locationLabel ?? null;

      return postChatWithImages(
        input,
        activeSession,
        imageUrls,
        options
          ? {
              signal: options.signal,
              skipAddingTempMessage: options.skipAddingTempMessage,
              tempId: options.tempId,
              file: options.file,
              locationDetails,
              locationString,
              userLatitude: options.userLatitude,
              userLongitude: options.userLongitude,
            }
          : undefined
      );
    },
    [postChatWithImages]
  );

  // Enhanced handleSubmit with image and file support
  const handleSubmit = useCallback(
    async (e: React.FormEvent, options?: ChatSubmitOptions) => {
      e.preventDefault();

      if (
        !input.trim() &&
        (!options?.imageUrls || options.imageUrls.length === 0) &&
        !options?.file
      )
        return;

      const imageUrls = options?.imageUrls || [];
      const file = options?.file;
      const locationDetails = options?.locationDetails;
      const userLatitude =
        options?.userLatitude ??
        (locationDetails ? locationDetails.latitude : undefined);
      const userLongitude =
        options?.userLongitude ??
        (locationDetails ? locationDetails.longitude : undefined);
      const locationLabel =
        options?.location ??
        options?.locationLabel ??
        (locationDetails ? locationDetails.label : undefined);

      console.log("🚀 handleSubmit called with:", {
        input,
        imageUrls,
        file,
        userLatitude,
        userLongitude,
        locationLabel,
        locationDetails,
      });

      // Clear input immediately for better UX
      setInput("");

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Set loading state immediately for better perceived performance
      setIsLoading(true);

      try {
        // Pass imageUrls, file, and location to postChatWithImages
        console.log("📤 Calling postChatWithImages with location details:", {
          userLatitude,
          userLongitude,
          locationLabel,
          locationDetails,
        });
        await postChatWithImages(input, activeSession || undefined, imageUrls, {
          signal: controller.signal,
          skipAddingTempMessage: false, // Let postChatWithImages handle the temp message
          file: file, // Pass the file option
          locationDetails:
            locationDetails ??
            (userLatitude !== undefined && userLongitude !== undefined
              ? {
                  latitude: userLatitude,
                  longitude: userLongitude,
                  label: locationLabel,
                }
              : null),
          locationString: locationLabel ?? null,
          userLatitude: userLatitude,
          userLongitude: userLongitude,
        });
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error submitting chat:", error);

          const errorMessage = extractErrorMessage(
            error,
            "Failed to send message"
          );

          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
        abortControllerRef.current = null;
      }
    },
    [input, activeSession, postChatWithImages, setIsLoading, setInput]
  );

  // Auto-submit pending message from social feed after handleSubmit is ready
  useEffect(() => {
    if (pendingMessageRef.current && !isLoading) {
      const pending = pendingMessageRef.current;
      pendingMessageRef.current = null; // Clear it so we only submit once

      // Small delay to ensure everything is ready
      setTimeout(() => {
        const syntheticEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        }) as unknown as React.FormEvent;
        const options: ChatSubmitOptions = {};

        if (pending.imageUrls && pending.imageUrls.length > 0) {
          options.imageUrls = pending.imageUrls;
        }

        if (pending.location) {
          options.locationDetails = pending.location;
          options.userLatitude = pending.location.latitude;
          options.userLongitude = pending.location.longitude;
          options.locationLabel = pending.location.label;
          options.location = pending.location.label;
          console.log("📍 Auto-submitting with location:", pending.location);
        }

        handleSubmit(
          syntheticEvent,
          Object.keys(options).length > 0 ? options : undefined
        );
      }, 300);
    }
  }, [isLoading, handleSubmit]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      toast({
        title: "Stopped",
        description: "Response generation stopped",
      });
    }
  }, [toast, setIsLoading]);

  const handleCardSubmit = useCallback(
    async (card: (typeof actionCards)[0]) => {
      if (isLoading) return;

      setIsLoading(true);
      const tempId = `temp-${Date.now()}`;
      const initialMessage = {
        id: tempId,
        prompt: card.message,
        response: "",
        session: activeSession,
      };

      setMessages((prev) => [...prev, initialMessage]);

      try {
        let locationDetails = lastLocationRef.current;
        let locationLabel = lastLocationLabel ?? locationDetails?.label ?? null;

        if (!locationDetails) {
          try {
            const freshLocation = await getUserLocation({
              enableHighAccuracy: false,
              timeout: 7000,
              maximumAge: 300000,
            });

            locationDetails = {
              latitude: freshLocation.latitude,
              longitude: freshLocation.longitude,
              label: formatCoordinates(
                freshLocation.latitude,
                freshLocation.longitude
              ),
            };

            lastLocationRef.current = locationDetails;
            setLastLocationLabel(locationDetails.label ?? null);
            locationLabel = locationDetails.label ?? locationLabel;
          } catch (error) {
            console.warn(
              "handleCardSubmit: Unable to obtain user location",
              error
            );
          }
        }

        if (locationDetails && !locationLabel) {
          locationLabel =
            locationDetails.label ??
            formatCoordinates(
              locationDetails.latitude,
              locationDetails.longitude
            );
        }

        await postChat(card.message, activeSession || undefined, {
          skipAddingTempMessage: true,
          tempId: tempId, // Pass the tempId so it can update the correct message
          locationDetails: locationDetails ?? undefined,
          locationLabel: locationLabel ?? undefined,
          location: locationLabel ?? undefined,
          userLatitude: locationDetails?.latitude,
          userLongitude: locationDetails?.longitude,
        });
      } catch (error: unknown) {
        console.error("Error submitting card message:", error);

        const errorMessage = extractErrorMessage(
          error,
          "The server encountered an error. Please try again later."
        );

        setMessages((prev) =>
          prev.map((msg) =>
            msg && msg.id === tempId
              ? {
                  ...msg,
                  error: true,
                  errorMessage: errorMessage,
                }
              : msg
          )
        );

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [activeSession, isLoading, postChat, toast, lastLocationLabel]
  );

  const handleRename = useCallback(
    async (sessionId: string) => {
      if (!newTitle.trim()) return;

      try {
        const updatedSession = await chatAPI.updateChatSession(sessionId, {
          chat_title: newTitle.trim(),
        });

        setSessions((prev: ChatSession[]) =>
          prev.map((session: ChatSession) =>
            session.id === sessionId
              ? { ...session, ...updatedSession }
              : session
          )
        );

        setShowRenameDialog(false);
        setNewTitle("");
        setSelectedSessionId(null);

        toast({
          title: "Success",
          description: "Chat session renamed successfully",
        });
      } catch (error: unknown) {
        console.error("Error renaming chat session:", error);

        let errorMessage = "Failed to rename chat session";

        if (
          error &&
          typeof error === "object" &&
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "data" in error.response &&
          error.response.data &&
          typeof error.response.data === "object" &&
          "detail" in error.response.data
        ) {
          errorMessage = String(error.response.data.detail);
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [
      newTitle,
      setSessions,
      setShowRenameDialog,
      setNewTitle,
      setSelectedSessionId,
    ]
  );

  // Memoize callbacks
  const handleSetActiveSession = useCallback((sessionId: string | null) => {
    setActiveSession(sessionId);
    // URL will be updated by the useEffect that watches activeSession
  }, []);

  const handleSetSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpen(open);
    localStorage.setItem("sidebarState", String(open));
  }, []);

  const handleStartNewChat = useCallback(() => {
    setActiveSession(null);
    setMessages([]);
    setInput("");
    isCreatingNewSession.current = false;
    // URL will be updated by the useEffect that watches activeSession
  }, []);

  const handleLocationUpdate = useCallback(
    (location: ChatSubmitLocation | null, label?: string) => {
      lastLocationRef.current = location;
      setLastLocationLabel(label ?? location?.label ?? null);
    },
    []
  );

  // Memoized sidebar props to prevent unnecessary re-renders
  const sidebarProps = useMemo(
    () => ({
      sidebarOpen,
      setSidebarOpen: handleSetSidebarOpen,
      sessions,
      setSessions,
      activeSession,
      setActiveSession: handleSetActiveSession,
      setMessages,
      isAuthenticated,
      logout,
      isMobile,
      setShowRenameDialog,
      setSelectedSessionId,
      setNewTitle,
      isLgScreen,
      isMediumScreen,
      isLoadingSessions,
    }),
    [
      sidebarOpen,
      handleSetSidebarOpen,
      sessions,
      setSessions,
      activeSession,
      handleSetActiveSession,
      setMessages,
      isAuthenticated,
      logout,
      isMobile,
      setShowRenameDialog,
      setSelectedSessionId,
      setNewTitle,
      isLgScreen,
      isMediumScreen,
      isLoadingSessions,
    ]
  );

  // Memoized chat input props to prevent unnecessary re-renders
  const chatInputProps = useMemo(
    () => ({
      input,
      setInput,
      handleSubmit,
      isLoading,
      isMobile,
      activeSession,
      isAuthenticated,
      setMessages,
      setActiveSession: handleSetActiveSession,
      setSessions,
      refreshSessions,
      sidebarCollapsed: !sidebarOpen,
      handleStop,
      user: user?.id ? { id: user.id } : null,
      onLocationUpdate: handleLocationUpdate,
    }),
    [
      input,
      setInput,
      handleSubmit,
      isLoading,
      isMobile,
      activeSession,
      isAuthenticated,
      setMessages,
      handleSetActiveSession,
      setSessions,
      refreshSessions,
      sidebarOpen,
      handleStop,
      user?.id,
      handleLocationUpdate,
    ]
  );

  // Memoized chat messages props to prevent unnecessary re-renders
  const chatMessagesProps = useMemo(
    () => ({
      messages,
      isLoading,
      setIsLoading,
      isSessionLoading,
      latestMessageId,
      setLatestMessageId,
      messagesEndRef: messagesEndRef as React.RefObject<HTMLDivElement>,
      activeSession,
      setActiveSession,
      sessions,
      setSessions,
      actionCards,
      handleCardClick: handleCardSubmit,
      isAuthenticated,
      user: user?.id ? user : null,
      setMessages,
      refreshSessions,
      sidebarCollapsed: !sidebarOpen,
      sidebarOpen,
      isLgScreen,
    }),
    [
      messages,
      isLoading,
      setIsLoading,
      isSessionLoading,
      latestMessageId,
      setLatestMessageId,
      activeSession,
      setActiveSession,
      sessions,
      setSessions,
      actionCards,
      handleCardSubmit,
      isAuthenticated,
      user?.id,
      setMessages,
      refreshSessions,
      sidebarOpen,
      isLgScreen,
    ]
  );

  return (
    <div className="flex h-screen bg-gradient-to-b from-[#121212] to-[#1a1a1a]">
      {isClient && (sidebarOpen || (isMobile && isLgScreen)) && (
        <ChatSidebar {...sidebarProps} />
      )}

      <div
        className={cn(
          "flex flex-col flex-1 h-screen w-full",
          isClient && !isMobile && (sidebarOpen ? "" : "")
        )}
      >
        <ChatHeader
          setSidebarOpen={handleSetSidebarOpen}
          isAuthenticated={isAuthenticated}
          sidebarCollapsed={!sidebarOpen}
          isLgScreen={isLgScreen}
          sidebarOpen={sidebarOpen}
          startNewChat={handleStartNewChat}
          isMediumScreen={isMediumScreen}
          isClient={isHydrated}
        />

        {/* Viewport Container - Bottom-anchored with new messages at bottom */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Area - Scrollable, new messages at bottom */}
          <div className="flex-1 overflow-y-auto min-h-0 pt-14 bg-background">
            <ChatMessages {...chatMessagesProps} />
          </div>

          {/* Input Area - Fixed at bottom */}
          <div className="flex-shrink-0">
            <ChatInput {...chatInputProps} />
          </div>
        </div>
      </div>

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
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
          <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          <p className="text-lg text-gray-500">Loading chat...</p>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
