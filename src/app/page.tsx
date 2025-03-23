"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Search,
  Settings,
  Plus,
  LogOut,
  ImageIcon,
  X,
  PaperclipIcon,
  Send,
  Trash,
  MoreVertical,
  Pencil,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import { toast } from "@/components/ui/use-toast";
import one from "../../public/Image/one.png";
import two from "../../public/Image/two.png";
import three from "../../public/Image/three.png";
import four from "../../public/Image/four.png";
import star from "../../public/Image/Star 1.png";
import { useMediaQuery } from "@/hooks/use-mobile";

import { chatAPI } from "@/lib/api";

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  interface Message {
    id: string;
    prompt: string;
    response: string;
    created_at?: string;
  }

  const [messages, setMessages] = useState<Message[]>([]);
  interface Session {
    id: string;
    chat_title: string;
    created_at?: string;
  }

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const getSessions = async () => {
    try {
      // Only attempt to fetch sessions if authenticated
      if (!isAuthenticated) {
        setSessions([]);
        return [];
      }

      const data = await chatAPI.getSessionsMine();

      // If no results property or it's not an array, handle gracefully
      if (!data || !data.results || !Array.isArray(data.results)) {
        console.warn("Unexpected response format from getSessionsMine:", data);
        setSessions([]);
        return [];
      }

      // Sort sessions by most recently updated first (if timestamps are available)
      const sortedSessions = [...data.results].sort((a, b) => {
        // If created_at exists, sort by that
        if (a.created_at && b.created_at) {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
        return 0; // No sorting if no timestamps
      });

      setSessions(sortedSessions);

      // If we have an active session, make sure it's still in the list
      if (activeSession) {
        const sessionExists = sortedSessions.some(
          (session) => session.id === activeSession
        );
        if (!sessionExists) {
          // Session no longer exists, reset active session
          console.log("Active session no longer exists, resetting");
          setActiveSession(null);
          setMessages([]);
        }
      }

      return sortedSessions;
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      // Don't show toast for unauthorized errors as they're expected for non-logged-in users
      if (error.response?.status !== 401) {
        toast({
          title: "Error",
          description: "Failed to fetch chat sessions",
          variant: "destructive",
        });
      }
      setSessions([]);
      return [];
    }
  };

  const getChats = async (activeSession: string) => {
    try {
      console.log("Fetching chats for session:", activeSession);
      const data = await chatAPI.getChatsBySession(activeSession);

      if (!data || !data.results) {
        console.warn("No results returned for session:", activeSession);
        setMessages([]);
        return [];
      }

      console.log(
        `Loaded ${data.results.length} messages for session:`,
        activeSession
      );

      // Sort messages by created_at to ensure chronological order (oldest first)
      const sortedMessages = [...data.results].sort((a, b) => {
        if (a.created_at && b.created_at) {
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }
        return 0;
      });

      setMessages(sortedMessages || []);

      // Ensure the messages display is scrolled to the bottom after loading
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      return sortedMessages;
    } catch (error: any) {
      console.error("Error fetching chats for session:", activeSession, error);

      // Add more detailed error logging
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      };
      console.error("Error details:", errorDetails);

      toast({
        title: "Error",
        description: "Failed to fetch chat messages",
        variant: "destructive",
      });
      return [];
    }
  };

  // Fetch sessions when authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      getSessions();
    }
  }, [isAuthenticated]); // Add isAuthenticated as dependency to reload when auth state changes

  // Fetch chats when active session changes
  React.useEffect(() => {
    if (activeSession) {
      getChats(activeSession);
    }
  }, [activeSession]);

  // Add a function to refresh sessions
  const refreshSessions = async () => {
    if (isAuthenticated) {
      await getSessions();
    }
  };

  const postChat = async (input: string, activeSession?: string) => {
    try {
      if (activeSession) {
        // If we have an active session, post the message to it
        const data = await chatAPI.postNewChat(input, activeSession);

        // Instead of just adding to current messages, refresh from server to ensure correct order
        // This ensures consistent ordering with server-side timestamps
        await getChats(activeSession);

        return data;
      } else {
        // If no active session, create a new session first
        let userId = user?.id;

        // If not authenticated, use a default/guest ID or handle accordingly
        if (!userId && !isAuthenticated) {
          userId = "guest"; // Use a guest ID or handle as needed
          console.log("Warning: User not authenticated. Using guest ID.");
        }

        // Create a new chat session
        const sessionData = {
          chat_title: input.substring(0, 30), // Using first 30 chars of message as title
          user: userId || "guest", // Ensure it's always a string by providing a default
        };

        console.log("Creating new chat session with data:", sessionData);
        const sessionResponse = await chatAPI.createChatSession(sessionData);
        console.log("New session created:", sessionResponse);

        // Set the new session as active
        setActiveSession(sessionResponse.id);

        // Post the message to the new session
        const data = await chatAPI.postNewChat(input, sessionResponse.id);

        // Update the messages state
        setMessages([data]); // Start with just this message in the new session

        // Update the sessions list with the new session at the bottom
        setSessions((prev: any) => {
          // Check if session already exists in the list
          const exists = prev.some((s: any) => s.id === sessionResponse.id);
          if (!exists) {
            return [...prev, sessionResponse]; // Add to the bottom instead of the top
          }
          return prev;
        });

        // Refresh sessions from server to ensure consistency
        setTimeout(() => {
          refreshSessions();
        }, 500);

        return data;
      }
    } catch (error: any) {
      console.error("Error in postChat:", error);

      // Add better error information for debugging
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      };
      console.error("Error details:", errorDetails);

      // Re-throw the error to be handled by the caller
      throw error;
    }
  };

  // Scroll to bottom of messages
  useEffect(() => {
    // Use a small timeout to ensure DOM has updated
    const scrollTimer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    return () => clearTimeout(scrollTimer);
  }, [messages]);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;

      setIsLoading(true);
      // Save the current message to show it immediately in the UI
      const currentMessage = input;
      // Clear input immediately for better user experience
      setInput("");

      try {
        if (activeSession) {
          console.log("Posting chat to existing session:", activeSession);
          await postChat(currentMessage, activeSession);
        } else {
          console.log("Creating new session for chat message");
          await postChat(currentMessage);
        }
      } catch (error: any) {
        console.error("Error submitting chat:", error);

        let errorMessage = "Failed to get a response.";

        // Check for various error sources to provide more specific messages
        if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Check for authentication errors
        if (error.response?.status === 401) {
          errorMessage = "Authentication required. Please log in to continue.";
        } else if (error.response?.status === 403) {
          errorMessage = "You don't have permission to perform this action.";
        } else if (error.response?.status === 404) {
          errorMessage =
            "Resource not found. The session may have been deleted.";
        } else if (error.response?.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });

        // Put the user's message back in the input if it failed
        setInput(currentMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [input, activeSession]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const startNewChat = () => {
    // Clear messages
    setMessages([]);

    // Clear active session
    setActiveSession(null);

    // On mobile, close the sidebar
    if (isMobile) {
      setSidebarOpen(false);
    }

    // Refresh the sessions list
    refreshSessions();

    // Focus on the input field
    const inputField = document.querySelector('input[type="text"]');
    if (inputField) {
      (inputField as HTMLInputElement).focus();
    }
  };

  const selectSession = (id: string) => {
    // Mark as loading while fetching messages for the new session
    setIsLoading(true);

    // Set this session as active
    setActiveSession(id);

    // Focus on the input field after selecting a session
    setTimeout(() => {
      const inputField = document.querySelector('input[type="text"]');
      if (inputField) {
        (inputField as HTMLInputElement).focus();
      }
      setIsLoading(false);
    }, 500); // Short delay to ensure messages are loaded

    // Close sidebar on mobile
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const actionCards = [
    {
      title: "Find a Property",
      description: "Search for homes to rent or buy",
      image: one,
      message: "I want to find a property.",
    },
    {
      title: "Verify a Landlord",
      description: "Check credentials and reviews",
      image: three,
      message: "Can I verify my landlord?",
    },
    {
      title: "Get Property Insights",
      description: "View pricing trends and analytics",
      image: two,
      message: "I need property insights.",
    },
    {
      title: "Explore Neighborhoods",
      description: "Discover nearby amenities and more",
      image: four,
      message: "Tell me about my neighborhood.",
    },
  ];

  const handleCardClick = (card: (typeof actionCards)[0]) => {
    setInput(card.message);
  };

  

  const deleteChatSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the session when clicking delete
    
    if (isDeleting) return; // Prevent multiple simultaneous delete operations
    
    setIsDeleting(sessionId);
    
    try {
      await chatAPI.deleteChatSession(sessionId);
      
      // Remove the session from the local state
      setSessions((prev: any) => prev.filter((s: any) => s.id !== sessionId));
      
      // If the active session was deleted, reset it
      if (activeSession === sessionId) {
        setActiveSession(null);
        setMessages([]);
      }
      
      toast({
        title: "Success",
        description: "Chat session deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting chat session:", error);
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRename = async (sessionId: string) => {
    if (!newTitle.trim()) return;
    
    try {
      // Call the API to update the session title
      const updatedSession = await chatAPI.updateChatSession(sessionId, {
        chat_title: newTitle.trim()
      });
      
      // Update the sessions list with the new title
      setSessions((prev: any) => 
        prev.map((session: any) => 
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
    } catch (error: any) {
      console.error("Error renaming chat session:", error);
      
      // Show more specific error message if available
      const errorMessage = error.response?.data?.detail || "Failed to rename chat session";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const openRenameDialog = (sessionId: string, currentTitle: string) => {
    setSelectedSessionId(sessionId);
    setNewTitle(currentTitle);
    setShowRenameDialog(true);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border p-4 transition-transform md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </Button>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon">
              <Search className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="py-4">
          <Button
            className="justify-start w-full gap-2 text-foreground bg-muted hover:bg-muted/80"
            onClick={startNewChat}
          >
            <Plus className="w-4 h-4" /> New chat
          </Button>
        </div>

        <div className="flex flex-col flex-1 overflow-auto">
          {/* Real sessions (if you have any) */}
          <div className="px-2 py-2">
            <div className="px-2 py-2 text-xs font-medium text-muted-foreground">
              Recent Chats
            </div>

            {sessions.length > 0 ? (
              sessions.map((session: any) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between px-2 py-2 text-sm rounded-md ${
                    activeSession === session.id
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <span 
                    className="truncate max-w-[80%] cursor-pointer"
                    onClick={() => selectSession(session.id)}
                  >
                    {session.chat_title || "Untitled Chat"}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-muted-foreground hover:text-foreground"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => openRenameDialog(session.id, session.chat_title)}
                        className="cursor-pointer"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          deleteChatSession(session.id, e as any);
                        }}
                        className="text-red-600 cursor-pointer focus:text-red-600"
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            ) : isAuthenticated ? (
              // Show message when authenticated but no sessions
              <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                No chat sessions yet.
                <br />
                Start a new chat to begin.
              </div>
            ) : (
              // Show login prompt when not authenticated
              <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                Sign in to view and save
                <br />
                your chat history.
              </div>
            )}
          </div>

          {/* Search History Sidebar */}
          {/* {isAuthenticated && <SearchHistorySidebar />} */}
        </div>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="justify-start w-full text-muted-foreground hover:text-foreground"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" /> Log out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-4 px-4 border-b h-14 border-border">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </Button>

            {/* Logo or app name can go here */}
            <span className="hidden font-medium text-foreground md:block">
              Revi AI
            </span>
          </div>

          {/* Right side elements */}
          <div className="flex items-center gap-4">
            {/* Add search history component here */}
            {/* {isAuthenticated && <SearchHistory onSelectQuery={handleSelectQuery} />} */}

            <ThemeToggle />

            {isAuthenticated ? (
              <ProfileDropdown />
            ) : (
              <Button
                variant="ghost"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => router.push("/signin")}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable Chat Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex flex-col w-full h-full max-w-5xl mx-auto">
            {/* Show active session title when messages exist */}
            {activeSession && messages.length > 0 && (
              <div className="w-full pb-2 mb-4 border-b border-border">
                <h2 className="font-medium text-md text-foreground">
                  {sessions.find((s: any) => s.id === activeSession)
                    ?.chat_title || "Chat Session"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Continue your conversation in this session
                </p>
              </div>
            )}

            {messages.length === 0 ? (
              // Center the welcome message and cards vertically when no messages
              <div className="flex flex-col items-center justify-center h-full">
                <h1 className="mb-8 text-xl text-center text-foreground">
                  {isAuthenticated
                    ? `Hi ${
                        user?.first_name
                          ? user?.first_name + " " + user?.last_name
                          : "there"
                      }! How can I assist you today?`
                    : "Hi! How can I assist you today?"}
                </h1>
                <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 md:max-w-[600px] w-full text-center mx-auto">
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
                          className="w-11 h-11 "
                          sizes="(max-width: 640px) 32px, 44px"
                        />
                        <div>
                          <h3 className="mb-1 font-medium text-foreground">
                            {card.title}
                          </h3>
                          <p className="hidden text-sm text-muted-foreground md:block">
                            {card.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start self-start w-full pb-20 space-y-6">
                {messages.map((message: any, index: number) => (
                  <div key={index} className="w-full space-y-5">
                    <div className={`flex justify-end w-full`}>
                      <div
                        className={`max-w-[80%] rounded-lg p-4 bg-card text-foreground `}
                      >
                        <p className="whitespace-pre-wrap">{message?.prompt}</p>
                      </div>
                    </div>
                    <div className={`flex justify-start w-full`}>
                      <div className="flex items-start gap-4 md:max-w-[80%] rounded-lg p-4 bg-card text-foreground">
                        {/* Image */}
                        <Image
                          src={star}
                          alt="Response Image"
                          className="object-cover w-12 h-12 rounded-full"
                        />

                        {/* Response Text */}
                        <p className="whitespace-pre-wrap">
                          {message?.response}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start w-full">
                    <div className="max-w-[80%] rounded-lg p-4 bg-card text-foreground">
                      <div className="flex space-x-2">
                        <div
                          className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
        {/* Fixed Bottom Input */}
        <div className="bottom-0 left-0 right-0 px-1 lg:pb-4">
          <div className="w-full max-w-[863px] mx-auto border md:rounded-[15px] border-border rounded-t-[15px] p-2 bg-card">
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Ask me anything"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="w-full p-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {isMobile ? (
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isLoading}
                      className="flex items-center gap-2 p-2 transition-colors rounded-md"
                    >
                      <PaperclipIcon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-muted-foreground text-[15px]">
                        Add Attachment
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      className="flex items-center gap-2 p-2 transition-colors rounded-md"
                    >
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-muted-foreground text-[15px]">
                        Use Images
                      </span>
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[#FFD700] to-[#780991] text-white"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-row items-center justify-between mt-4 md:flex-row">
                  {/* Attachments */}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      disabled={isLoading}
                      className="flex items-center gap-2 p-2 transition-colors rounded-md"
                    >
                      <PaperclipIcon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-muted-foreground text-[15px]">
                        Add Attachment
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      className="flex items-center gap-2 p-2 transition-colors rounded-md"
                    >
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-muted-foreground text-[15px]">
                        Use Images
                      </span>
                    </button>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="relative bg-gradient-to-r from-[#FFD700] to-[#780991] text-white rounded-[15px] mt-4 md:mt-0 overflow-hidden px-6"
                  >
                    {isLoading ? "Sending..." : "Send"}
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Add the rename dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat Session</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new title"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRenameDialog(false);
                setNewTitle("");
                setSelectedSessionId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedSessionId && handleRename(selectedSessionId)}
              disabled={!newTitle.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
