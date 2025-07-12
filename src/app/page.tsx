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

// Import images
import ChatSidebar from "@/components/chatpage/chat-sidebar";
import ChatHeader from "@/components/chatpage/chat-header";
import ChatMessages from "@/components/chatpage/chat-message";
import RenameDialog from "@/components/chatpage/rename-dialog";
import ChatInput from "@/components/chatpage/chat-input";

// Add interface for Message type
interface Message {
  id: string;
  prompt?: string;
  response?: string;
  session?: string | null | undefined;
  error?: boolean;
  retrying?: boolean;
  isNewSession?: boolean;
}

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
  
  // FIXED: Create a safe getter for messages that always returns an array
  const messages = Array.isArray(messagesState) ? messagesState : [];
  
  // FIXED: Create a safe setter that only accepts arrays
  const setMessages = useCallback((value: Message[] | ((prev: Message[]) => Message[])) => {
    if (typeof value === 'function') {
      setMessagesState(prev => {
        const currentMessages = Array.isArray(prev) ? prev : [];
        const newMessages = value(currentMessages);
        return Array.isArray(newMessages) ? newMessages : [];
      });
    } else {
      setMessagesState(Array.isArray(value) ? value : []);
    }
  }, []);
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
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

  const getChats = async (sessionId: string) => {
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
      const data = await chatAPI.getChatsBySession(sessionId);

      // FIXED: Better validation of API response
      if (!data || !data.results || !Array.isArray(data.results)) {
        console.warn("Invalid response from getChatsBySession:", data);
        return [];
      }

      const sortedMessages = [...data.results].sort((a, b) => {
        if (a.created_at && b.created_at) {
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }
        return 0;
      });

      // FIXED: Ensure we're working with valid message objects
      const validMessages = sortedMessages.filter(msg => msg && typeof msg === 'object' && msg.id);

      const existingMessageIds = new Set(messages.map((msg) => msg && msg.id).filter(Boolean));
      const uniqueNewMessages = validMessages.filter(
        (msg) => msg && !existingMessageIds.has(msg.id)
      );

      if (hasPendingMessage) {
        const pendingMessages = messages.filter(
          (msg) => msg && !msg.response && !msg.error
        );
        const nonPendingFetchedMessages = validMessages.filter(
          (msg) => msg && !pendingMessages.some((pending) => pending && pending.id === msg.id)
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
  };

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

      if (!hasMessagesForSession) {
        setIsSessionLoading(true);
        getChats(activeSession).finally(() => {
          setIsSessionLoading(false);
        });
      }
    }
  }, [activeSession, messages]);

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

  const postChat = useCallback(
    async (
      input: string,
      activeSession?: string,
      options?: { signal?: AbortSignal; skipAddingTempMessage?: boolean }
    ) => {
      try {
        const tempMessageId = "temp-" + Date.now();

        const tempMessage: Message = {
          id: tempMessageId,
          prompt: input,
          response: "",
          session: activeSession,
        };

        // FIXED: Safe array operation
        const isDuplicate = messages.some(
          (msg) =>
          
            msg.prompt === input &&
            (!msg.response || msg.response === "") &&
            msg.session === activeSession
        );

        if (!isDuplicate && !options?.skipAddingTempMessage) {
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
                msg && msg.id === tempMessageId ? { ...msg, isNewSession: true } : msg
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
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempMessageId ? { ...msg, error: true } : msg
              )
            );
            throw error;
          }
        }

        try {
          const data = await chatAPI.postNewChat(
            input,
            sessionId!,
            options?.signal ? { signal: options.signal } : undefined
          );
          setLatestMessageId(data.id);

          setMessages((prev) => {
            const tempIndex = prev.findIndex((msg) => msg && msg.id === tempMessageId);

            if (tempIndex >= 0) {
              const newMessages = [...prev];
              newMessages[tempIndex] = { ...data, session: sessionId };
              return newMessages;
            } else {
              const existingIndex = prev.findIndex((msg) => msg && msg.id === data.id);
              if (existingIndex >= 0) {
                const newMessages = [...prev];
                newMessages[existingIndex] = { ...data, session: sessionId };
                return newMessages;
              } else {
                return [...prev, { ...data, session: sessionId }];
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
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempMessageId
                ? { ...msg, error: true, session: sessionId }
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
        console.error("Error in postChat:", error);
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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;

      const tempId = `temp-${Date.now()}`;
      const tempMessage = {
        id: tempId,
        prompt: input.trim(),
        response: "",
        session: activeSession,
      };

      setMessages((prev) => [...prev, tempMessage]);

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsLoading(true);

      try {
        await postChat(input, activeSession || undefined, {
          signal: controller.signal,
          skipAddingTempMessage: true,
        });
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error submitting chat:", error);

          setMessages((prev) =>
            prev.map((msg) =>
              msg && msg.id === tempId ? { ...msg, error: true } : msg
            )
          );

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
    [input, activeSession, postChat, toast, setIsLoading]
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

        setMessages((prev) =>
          prev.map((msg) => (msg && msg.id === tempId ? { ...msg, error: true } : msg))
        );

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
        }

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