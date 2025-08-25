"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useMediaQuery } from "@/hooks/use-mobile";
import { toast } from "@/components/ui/use-toast";
import { chatAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

// Import components
import ChatSidebar from "@/components/chatpage/chat-sidebar";
import ChatHeader from "@/components/chatpage/chat-header";
import ChatMessages from "@/components/chatpage/chat-message";
import RenameDialog from "@/components/chatpage/rename-dialog";
import ChatInput from "@/components/chatpage/chat-input";

import { Message } from "@/types/chatMessage";

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
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebarState");
      return stored ? stored === "true" : false;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("sidebarState", String(sidebarOpen));
  }, [sidebarOpen]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // FIXED: Ensure messages is always initialized as an array
  const [messagesState, setMessagesState] = useState<Message[]>([]);

  // FIXED: Use useMemo for messages to avoid dependency issues
  const messages = useMemo(
    () => (Array.isArray(messagesState) ? messagesState : []),
    [messagesState]
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
  const isMediumScreen = useMediaQuery(
    "(min-width: 768px) and (max-width: 1023px)"
  );
  const isLgScreen = useMediaQuery("(min-width: 1024px)");
  const isCreatingNewSession = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const actionCards = [
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
  ];

  const getSessions = async () => {
    try {
      if (!isAuthenticated) {
        setSessions([]);
        return [];
      }

      setIsLoadingSessions(true);
      const data = await chatAPI.getSessionsMine();

      if (!data || !data.results || !Array.isArray(data.results)) {
        console.warn("Unexpected response format from getSessionsMine:", data);
        setSessions([]);
        return [];
      }

      const sortedSessions = [...data.results].sort((a, b) => {
        if (a.created_at && b.created_at) {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
        return 0;
      });

      setSessions(sortedSessions);

      if (activeSession) {
        const sessionExists = sortedSessions.some(
          (session) => session.id === activeSession
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
  };

  const getChats = useCallback(
    async (sessionId: string) => {
      if (isCreatingNewSession.current) {
        return [];
      }

      const hasPendingMessage = messages.some(
        (msg) => msg && msg.session === sessionId && !msg.response && !msg.error
      );

      if (hasPendingMessage) {
        return [];
      }

      try {
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

        const existingMessageIds = new Set(
          messages.map((msg) => msg && msg.id).filter(Boolean)
        );
        const uniqueNewMessages = validMessages.filter(
          (msg) => msg && !existingMessageIds.has(msg.id)
        );

        if (hasPendingMessage) {
          const pendingMessages = messages.filter(
            (msg) => msg && !msg.response && !msg.error
          );
          const nonPendingFetchedMessages = validMessages.filter(
            (msg) =>
              msg &&
              !pendingMessages.some(
                (pending) => pending && pending.id === msg.id
              )
          );
          setMessages([...nonPendingFetchedMessages, ...pendingMessages]);
        } else {
          if (messages.length === 0 || uniqueNewMessages.length > 0) {
            setMessages(validMessages);
          }
        }

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);

        return validMessages;
      } catch (error: unknown) {
        console.error("Error fetching chats for session:", sessionId, error);
        toast({
          title: "Error",
          description: "Failed to fetch chat messages",
          variant: "destructive",
        });
        return [];
      }
    },
    [messages, setMessages]
  );

  useEffect(() => {
    if (isAuthenticated) {
      getSessions();
    }
  }, [isAuthenticated, pathname]);

  useEffect(() => {
    if (activeSession && !isCreatingNewSession.current) {
      const hasMessagesForSession = messages.some(
        (msg) => msg && msg.session === activeSession
      );

      // Only show loading and fetch messages if we don't have messages for this session
      if (!hasMessagesForSession) {
        setIsSessionLoading(true);
        getChats(activeSession).finally(() => {
          setIsSessionLoading(false);
        });
      }

      // Update the previous active session tracker
      if (previousActiveSession !== activeSession) {
        setPreviousActiveSession(activeSession);
      }
    } else if (!activeSession) {
      // Reset when no active session
      setPreviousActiveSession(null);
    }
  }, [activeSession, messages, getChats, previousActiveSession]);

  const refreshSessions = async () => {
    if (isAuthenticated) {
      await getSessions();
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (activeSession && pathname !== `/chats/${activeSession}`) {
      window.history.pushState({}, "", `/chats/${activeSession}`);
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

  useEffect(() => {
    if (id && !activeSession) {
      const loadSessionFromUrl = async () => {
        try {
          setIsSessionLoading(true);
          const sessionId = id as string;

          const sessionExists =
            sessions.some((s) => s.id === sessionId) ||
            (await chatAPI.getChatSession(sessionId).catch(() => false));

          if (sessionExists) {
            setActiveSession(sessionId);
            await getChats(sessionId);
          } else {
            toast({
              title: "Session not found",
              description: "The requested chat session could not be found",
              variant: "destructive",
            });
            router.push("/");
          }
        } catch (error) {
          console.error("Error loading session from URL:", error);
          router.push("/");
        } finally {
          setIsSessionLoading(false);
        }
      };

      loadSessionFromUrl();
    }
  }, [id]);

  // Enhanced postChat function with image support
  const postChatWithImages = useCallback(
    async (
      input: string,
      activeSession?: string,
      imageUrls?: string[],
      options?: {
        signal?: AbortSignal;
        skipAddingTempMessage?: boolean;
        file?: File;
      }
    ) => {
      console.log("postChatWithImages: Received options:", options);
      console.log("postChatWithImages: File received:", options?.file);
      if (options?.file) {
        console.log("postChatWithImages: File details:", {
          name: options.file.name,
          size: options.file.size,
          type: options.file.type,
          lastModified: options.file.lastModified,
        });
      }

      try {
        const tempMessageId = "temp-" + Date.now();

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
          setMessages((prev) => [...prev, tempMessage]);
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
                : "Failed to create session";

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
          // Prepare message for API call with image URLs and files
          const apiOptions: {
            signal?: AbortSignal;
            imageUrls?: string[];
            image_url?: string;
            file?: File;
          } = options?.signal ? { signal: options.signal } : {};

          // Include image URLs properly
          if (imageUrls && imageUrls.length > 0) {
            apiOptions.imageUrls = imageUrls;
            apiOptions.image_url = imageUrls[0]; // Use first image as primary
          }

          // Include file if provided from handleSubmit options
          if (options?.file) {
            apiOptions.file = options.file;
            console.log("postChatWithImages: Adding file to apiOptions:", {
              name: options.file.name,
              size: options.file.size,
              type: options.file.type,
            });
            console.log(
              "postChatWithImages: File instanceof File:",
              options.file instanceof File
            );
            console.log("postChatWithImages: File object:", options.file);
          } else {
            console.log(
              "postChatWithImages: No file in options or file is falsy"
            );
            console.log(
              "postChatWithImages: options.file value:",
              options?.file
            );
          }

          console.log(
            "postChatWithImages: Final apiOptions before API call:",
            apiOptions
          );
          console.log(
            "postChatWithImages: Final apiOptions.file:",
            apiOptions.file
          );

          const data = await chatAPI.postNewChat(input, sessionId!, apiOptions);
          console.log("API Response data:", data);
          console.log("Original imageUrls:", imageUrls);
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
                context: data.context,
                image_url: data.image_url,
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
                  context: data.context,
                  image_url: data.image_url,
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
                  context: data.context,
                  image_url: data.image_url,
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

          setTimeout(scrollToBottom, 100);
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
      messages,
      user,
      setMessages,
      setSessions,
      setActiveSession,
      setLatestMessageId,
      scrollToBottom,
    ]
  );

  // Original postChat function for backward compatibility
  const postChat = useCallback(
    async (
      input: string,
      activeSession?: string,
      options?: { signal?: AbortSignal; skipAddingTempMessage?: boolean }
    ) => {
      return postChatWithImages(input, activeSession, undefined, options);
    },
    [postChatWithImages]
  );

  // Enhanced handleSubmit with image and file support
  const handleSubmit = useCallback(
    async (
      e: React.FormEvent,
      options?: { imageUrls?: string[]; file?: File }
    ) => {
      e.preventDefault();
      console.log("Page handleSubmit: Received options:", options);
      console.log("Page handleSubmit: File received:", options?.file);
      console.log("Page handleSubmit: typeof file:", typeof options?.file);
      console.log(
        "Page handleSubmit: file instanceof File:",
        options?.file instanceof File
      );
      if (options?.file) {
        console.log("Page handleSubmit: File details:", {
          name: options.file.name,
          size: options.file.size,
          type: options.file.type,
          lastModified: options.file.lastModified,
          constructor: options.file.constructor.name,
        });
        console.log(
          "Page handleSubmit: File stringified:",
          JSON.stringify(options.file)
        );
      }

      if (
        !input.trim() &&
        (!options?.imageUrls || options.imageUrls.length === 0) &&
        !options?.file
      )
        return;

      const imageUrls = options?.imageUrls || [];
      const file = options?.file;

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsLoading(true);

      try {
        // Pass both imageUrls and file to postChatWithImages
        await postChatWithImages(input, activeSession || undefined, imageUrls, {
          signal: controller.signal,
          skipAddingTempMessage: false, // Let postChatWithImages handle the temp message
          file: file, // Pass the file option
        });
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error submitting chat:", error);

          const errorMessage = (() => {
            if (
              error instanceof Error &&
              "response" in error &&
              typeof error.response === "object" &&
              error.response &&
              "data" in error.response &&
              typeof error.response.data === "object" &&
              error.response.data &&
              "message" in error.response.data &&
              typeof error.response.data.message === "string"
            ) {
              return error.response.data.message;
            }
            return "Failed to send message";
          })();

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
        setInput("");
      }
    },
    [input, activeSession, postChatWithImages, setIsLoading]
  );

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
        await postChat(card.message, activeSession || undefined, {
          skipAddingTempMessage: true,
        });
      } catch (error: unknown) {
        console.error("Error submitting card message:", error);

        let errorMessage =
          "The server encountered an error. Please try again later.";

        if (
          error &&
          typeof error === "object" &&
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "status" in error.response
        ) {
          const status = error.response.status as number;
          if (status === 401) {
            errorMessage =
              "Authentication required. Please log in to continue.";
          } else if (status === 403) {
            errorMessage = "You don't have permission to perform this action.";
          } else if (status === 404) {
            errorMessage =
              "Resource not found. The session may have been deleted.";
          } else if (status === 500) {
            errorMessage = "Server error. Please try again later.";
          }

          // Also try to get the specific error message from the response
          if (
            "data" in error.response &&
            error.response.data &&
            typeof error.response.data === "object"
          ) {
            const responseData = error.response.data as any;
            if (responseData.error && typeof responseData.error === "string") {
              errorMessage = responseData.error;
            } else if (
              responseData.message &&
              typeof responseData.message === "string"
            ) {
              errorMessage = responseData.message;
            }
          }
        }

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
    [activeSession, isLoading, postChat, toast]
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
    if (sessionId) {
      window.history.pushState({}, "", `/chats/${sessionId}`);
    } else {
      window.history.pushState({}, "", "/");
    }
  }, []);

  const handleSetSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpen(open);
    localStorage.setItem("sidebarState", String(open));
  }, []);

  const handleStartNewChat = useCallback(() => {
    setActiveSession(null);
    setMessages([]);
    setInput("");
    window.history.pushState({}, "", "/");
    isCreatingNewSession.current = false;
  }, [setMessages, setInput]);

  // Memoize child components' props
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
      sessions,
      activeSession,
      isAuthenticated,
      isMobile,
      isLgScreen,
      isMediumScreen,
      handleSetSidebarOpen,
      handleSetActiveSession,
      logout,
    ]
  );

  const chatInputProps = useMemo(
    () => ({
      input,
      setInput,
      handleSubmit, // This now supports image URLs
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
      user: user?.id ? { id: user.id } : null, // Fix type issue
    }),
    [
      input,
      isLoading,
      isMobile,
      activeSession,
      isAuthenticated,
      sidebarOpen,
      handleSetActiveSession,
      handleSubmit,
      handleStop,
      user,
    ]
  );

  return (
    <div className="flex h-screen bg-gradient-to-b from-[#121212] to-[#1a1a1a]">
      {(sidebarOpen || (isMobile && isLgScreen)) && (
        <ChatSidebar {...sidebarProps} />
      )}

      <div
        className={cn(
          "flex flex-col flex-1 h-screen w-full transition-all duration-300 bg-",
          !isMobile && (sidebarOpen ? "" : "")
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
        />

        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          isSessionLoading={isSessionLoading}
          latestMessageId={latestMessageId}
          setLatestMessageId={setLatestMessageId}
          messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
          activeSession={activeSession}
          setActiveSession={(value) => {
            if (typeof value === "function") {
              handleSetActiveSession(value(activeSession));
            } else {
              handleSetActiveSession(value);
            }
          }}
          sessions={sessions}
          setSessions={setSessions}
          actionCards={actionCards}
          handleCardClick={handleCardSubmit}
          isAuthenticated={isAuthenticated}
          user={user?.id ? user : null}
          setMessages={setMessages}
          refreshSessions={refreshSessions}
          isLgScreen={isLgScreen}
          sidebarOpen={sidebarOpen}
        />

        <ChatInput {...chatInputProps} />
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
