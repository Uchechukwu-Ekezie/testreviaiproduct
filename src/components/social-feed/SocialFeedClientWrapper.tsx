"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-mobile";
import ChatSidebar from "@/components/chatpage/chat-sidebar";
import ChatHeader from "@/components/chatpage/chat-header";
import { chatAPI } from "@/lib/api/chat.api";
import RenameDialog from "@/components/chatpage/rename-dialog";
import ChatInput from "@/components/chatpage/chat-input";
import type { ChatSubmitOptions } from "@/types/chat";

interface SocialFeedClientWrapperProps {
  children: React.ReactNode;
}

/**
 * Client-side wrapper component for social feed
 * Handles all interactive UI elements (sidebar, chat, etc.)
 * Separated from auth logic to prevent unnecessary re-renders
 */
export default function SocialFeedClientWrapper({
  children,
}: SocialFeedClientWrapperProps) {
  const { isAuthenticated, isLoading, logout: authLogout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're on a post detail page
  const isPostDetailPage = pathname?.includes("/social-feed/post/");

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isLoading, isAuthenticated, router]);

  // Sidebar state management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sessions, setSessions] = useState<
    Array<{
      id: string;
      chat_title?: string;
      created_at?: string;
    }>
  >([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [newTitle, setNewTitle] = useState("");
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);

  // Refs for session management
  const sessionsLoadedRef = useRef(false);
  const activeSessionRef = useRef<string | null>(null);

  // Handle chat submit - redirect to main chat page with the message
  const handleChatSubmit = async (
    e: React.FormEvent,
    options?: ChatSubmitOptions
  ) => {
    e.preventDefault();

    if (!chatMessage.trim()) return;

    // Store the message in sessionStorage to pass it to the chat page
    sessionStorage.setItem("pendingChatMessage", chatMessage);

    // Store image URLs if provided
    if (options?.imageUrls && options.imageUrls.length > 0) {
      sessionStorage.setItem(
        "pendingChatImages",
        JSON.stringify(options.imageUrls)
      );
    }

    // Store file if provided
    if (options?.file) {
      sessionStorage.setItem(
        "pendingChatFile",
        JSON.stringify({
          name: options.file.name,
          type: options.file.type,
          size: options.file.size,
        })
      );
    }

    // Store location if provided
    if (options?.locationDetails) {
      sessionStorage.setItem(
        "pendingChatLocation",
        JSON.stringify(options.locationDetails)
      );
    } else if (
      options?.userLatitude !== undefined &&
      options?.userLongitude !== undefined
    ) {
      sessionStorage.setItem(
        "pendingChatLocation",
        JSON.stringify({
          latitude: options.userLatitude,
          longitude: options.userLongitude,
          label: options.locationLabel || options.location || null,
        })
      );
    }

    // Redirect to main chat page
    router.push("/");
  };

  // Media queries
  const isMobile = useMediaQuery("(max-width: 768px)");

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

  // Update activeSession ref when activeSession changes
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  // Handle session selection - navigate to main chat page
  const handleSessionSelect = useCallback(
    (sessionId: string | null) => {
      if (sessionId) {
        router.push(`/?id=${sessionId}`);
      }
    },
    [router]
  );

  // Load sessions function
  const getSessions = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        setSessions([]);
        sessionsLoadedRef.current = true;
        return [];
      }

      setIsLoadingSessions(true);
      const data = await chatAPI.getSessionsMine();

      let sessions: Array<{
        id: string;
        chat_title?: string;
        created_at?: string;
      }> = [];
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

      return sortedSessions;
    } catch (error: unknown) {
      console.error("Error fetching sessions:", error);
      setSessions([]);
      sessionsLoadedRef.current = true;
      return [];
    } finally {
      setIsLoadingSessions(false);
    }
  }, [isAuthenticated]);

  // Load sessions when authenticated - ONE TIME ONLY
  useEffect(() => {
    if (isAuthenticated && !sessionsLoadedRef.current) {
      getSessions();
    }
  }, [isAuthenticated, getSessions]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Clear auth check flag on logout
      sessionStorage.removeItem("socialFeedAuthChecked");
      await authLogout();
      router.push("/signin");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [authLogout, router]);

  // Delete session handler
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    setIsDeleting(sessionId);
    try {
      await chatAPI.deleteChatSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      if (activeSessionRef.current === sessionId) {
        setActiveSession(null);
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Failed to delete session. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  }, []);

  // Delete confirmation function
  const showDeleteConfirmation = useCallback(
    (sessionId: string, sessionTitle: string) => {
      if (
        window.confirm(`Are you sure you want to delete "${sessionTitle}"?`)
      ) {
        handleDeleteSession(sessionId);
      }
    },
    [handleDeleteSession]
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Chat Sidebar */}
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sessions={sessions}
        setSessions={setSessions}
        activeSession={activeSession}
        setActiveSession={handleSessionSelect}
        setMessages={() => {}}
        isAuthenticated={isAuthenticated}
        logout={logout}
        isMobile={isMobile}
        setShowRenameDialog={setShowRenameDialog}
        setSelectedSessionId={setSelectedSessionId}
        setNewTitle={setNewTitle}
        isLgScreen={useMediaQuery("(min-width: 1024px)")}
        isMediumScreen={useMediaQuery("(min-width: 768px)")}
        isLoadingSessions={isLoadingSessions}
        showDeleteConfirmation={showDeleteConfirmation}
        isDeleting={isDeleting}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <ChatHeader
          setSidebarOpen={setSidebarOpen}
          isAuthenticated={isAuthenticated}
          sidebarCollapsed={!sidebarOpen}
          isLgScreen={useMediaQuery("(min-width: 1024px)")}
          sidebarOpen={sidebarOpen}
          startNewChat={() => router.push("/")}
          isMediumScreen={useMediaQuery("(min-width: 768px)")}
          isClient={true}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* Floating Chat Input - Hidden on post detail pages */}
        {!isPostDetailPage && (
          <ChatInput
            input={chatMessage}
            setInput={setChatMessage}
            handleSubmit={handleChatSubmit}
            isLoading={false}
            isMobile={isMobile}
            sidebarCollapsed={!sidebarOpen}
            isCollapsed={isChatCollapsed}
            setIsCollapsed={setIsChatCollapsed}
          />
        )}
      </div>

      {/* Rename Dialog */}
      <RenameDialog
        showRenameDialog={showRenameDialog}
        setShowRenameDialog={setShowRenameDialog}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        selectedSessionId={selectedSessionId}
        setSelectedSessionId={setSelectedSessionId}
        handleRename={async (sessionId: string) => {
          if (!newTitle.trim()) return;
          await chatAPI.updateChatSession(sessionId, {
            chat_title: newTitle.trim(),
          });
          setSessions((prev) =>
            prev.map((s) =>
              s.id === sessionId ? { ...s, chat_title: newTitle.trim() } : s
            )
          );
        }}
      />
    </div>
  );
}
