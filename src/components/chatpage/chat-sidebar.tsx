"use client"

import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Search, Plus, LogOut, X, Trash2, Pencil, PanelLeftClose, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { chatAPI, searchAPI } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import logo from "../../../public/Image/logo reviai.png"

interface ChatSidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  sessions: any[]
  setSessions: React.Dispatch<React.SetStateAction<any[]>>
  activeSession: string | null
  setActiveSession: (sessionId: string | null) => void
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
  isAuthenticated: boolean
  logout: () => void
  isMobile: boolean
  setShowRenameDialog: React.Dispatch<React.SetStateAction<boolean>>
  setSelectedSessionId: React.Dispatch<React.SetStateAction<string | null>>
  setNewTitle: React.Dispatch<React.SetStateAction<string>>
  isLgScreen: boolean
  isMediumScreen: boolean
  isLoadingSessions: boolean
  showDeleteConfirmation?: (sessionId: string, sessionTitle: string) => void
  isDeleting?: string | null
}

const groupSessionsByDate = (sessions: any[]) => {
  if (!sessions || !Array.isArray(sessions)) return {};
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);
  
  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 30);
  
  const grouped: Record<string, any[]> = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
    'Older': []
  };
  
  sessions.forEach(session => {
    if (!session.created_at) return;
    
    const sessionDate = new Date(session.created_at);
    if (sessionDate >= today) {
      grouped['Today'].push(session);
    } else if (sessionDate >= yesterday) {
      grouped['Yesterday'].push(session);
    } else if (sessionDate >= last7Days) {
      grouped['Previous 7 Days'].push(session);
    } else if (sessionDate >= last30Days) {
      grouped['Previous 30 Days'].push(session);
    } else {
      grouped['Older'].push(session);
    }
  });
  
  // Remove empty groups
  return Object.fromEntries(
    Object.entries(grouped).filter(([, items]) => items.length > 0)
  );
};

const ChatSidebar: React.FC<ChatSidebarProps> = React.memo(({
  sidebarOpen,
  setSidebarOpen,
  sessions,
  setSessions,
  activeSession,
  setActiveSession,
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
  showDeleteConfirmation,
  isDeleting,
}) => {
  const [collapsed, setCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const sidebarRef = useRef<HTMLDivElement>(null)

  const { user } = useAuth()

  const groupedSessions = groupSessionsByDate(sessions)
  const groupedSearchResults = groupSessionsByDate(searchResults)

  const toggleGroupExpansion = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }))
  }

  const handleSessionClick = React.useCallback((sessionId: string) => {
    setActiveSession(sessionId);
    const newUrl = `/chats/${sessionId}`;
    window.history.pushState({}, '', newUrl);
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [setActiveSession, setSidebarOpen, isMobile]);

  const handleNewChat = React.useCallback(() => {
    setMessages([]);
    setActiveSession(null);
    window.history.pushState({}, '', '/');
    if (isMobile) setSidebarOpen(false);
  }, [setMessages, setActiveSession, isMobile, setSidebarOpen]);

  const openRenameDialog = (sessionId: string, currentTitle: string) => {
    setSelectedSessionId(sessionId)
    setNewTitle(currentTitle)
    setShowRenameDialog(true)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
    setIsSearching(true)
    try {
      if (!isAuthenticated) {
        toast({
          title: "Authentication Required",
          description: "Please login to search chat sessions",
          variant: "destructive",
        })
        return
      }
      const searchableSessions = Array.isArray(sessions) ? sessions : []
      const results = await searchAPI.searchChatSessions(searchQuery, searchableSessions)
      setSearchResults(results)
      setShowSearchResults(true)
    } catch (error) {
      console.error("Search failed:", error)
      toast({
        title: "Error",
        description: "Failed to perform search",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setShowSearchResults(false)
  }

  const handleClose = () => {
    if (isMobile || isLgScreen || isMediumScreen) {
      setSidebarOpen(false)
    } else {
      setCollapsed(!collapsed)
    }
  }

  const displayGroups = showSearchResults ? groupedSearchResults : groupedSessions

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && (isMobile || isMediumScreen)) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMobile, isMediumScreen, setSidebarOpen])

  if ((isMobile || isLgScreen || isMediumScreen) && !sidebarOpen) {
    return null
  }

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-[280px] bg-[#171717] border-gray-800 flex flex-col h-full overflow-x-hidden",
        isMobile && !sidebarOpen && "hidden",
        isLgScreen && !sidebarOpen && "hidden",
        isMediumScreen && !sidebarOpen && "hidden",
      )}
      ref={sidebarRef}
    >
      {/* Top Section */}
      <div className="flex flex-col flex-shrink-0">
        {/* Header with logo and close button */}
        <div className="flex items-center justify-between p-4">
          {isMobile ? (
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="md:hidden">
              <X className="w-5 h-5 text-gray-300" />
            </Button>
          ) : (
            <>
              <div>
                <Image src={logo || "/placeholder.svg"} alt="logo" className="w-10 h-10" />
              </div>
              <button
                onClick={handleClose}
                className="transition-colors rounded-md hover:bg-gray-700"
                aria-label="Close sidebar"
              >
                <PanelLeftClose className="w-8 h-8 text-gray-300" />
              </button>
            </>
          )}
        </div>

        {/* New Chat Button */}
        <div className="px-4 pb-4 border-gray-800">
          <Button
            onClick={handleNewChat}
            className={cn(
              "flex items-center w-[60%] rounded-md justify-start gap-2 bg-[#212121] hover:bg-[#212121] text-[#BEBEBE]",
              collapsed && "justify-center p-2",
            )}
          >
            <Plus className="w-4 h-4" />
            {!collapsed && "New chat"}
          </Button>
        </div>

        {/* Search Input */}
        {!collapsed && (
          <div className="relative w-full p-4 border-gray-800">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full py-2 pl-8 pr-8 text-sm text-gray-200 bg-[#212121] border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-600"
              disabled={isSearching}
            />
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-6 top-1/2" />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute text-gray-400 transform -translate-y-1/2 right-6 top-1/2 hover:text-gray-200"
                disabled={isSearching}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Chat History - Scrollable area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-[#171717] px-2">
        {!collapsed && (
          <div className="px-2 py-2 text-xs font-medium text-gray-400">
            {showSearchResults ? "Search Results" : ""}
          </div>
        )}

        {isLoadingSessions ? (
          // Loading skeleton - simplified version
          <div className="px-2 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-10 bg-gray-700 rounded-md" />
            ))}
          </div>
        ) : Object.keys(displayGroups).length > 0 ? (
          // Grouped sessions with "See More" functionality
          Object.entries(displayGroups).map(([groupName, groupSessions]) => {
            const isExpanded = expandedGroups[groupName] || false
            const sessionsToShow = isExpanded ? groupSessions : groupSessions.slice(0, 3)
            const hasMore = groupSessions.length > 3

            return (
              <div key={groupName} className="mb-6">
                {!collapsed && (
                  <div className="flex items-center justify-between px-2 py-2">
                    <span className="text-[13px] font-medium text-gray-500">
                      {groupName}
                    </span>
                    {hasMore && !isExpanded && (
                      <button
                        onClick={() => toggleGroupExpansion(groupName)}
                        className="text-xs text-gray-400 hover:text-gray-200"
                      >
                        <ChevronDown className="w-4 h-4 font-semibold" />
                      </button>
                    )}
                  </div>
                )}
                <div className="space-y-1">
                  {sessionsToShow.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "flex items-center justify-between mx-1 p-2 rounded-md cursor-pointer group w-full transition-colors",
                        activeSession === session.id ? "bg-[#212121] text-white" : "hover:bg-[#212121]"
                      )}
                      onClick={() => handleSessionClick(session.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleSessionClick(session.id)
                        }
                      }}
                    >
                      <div className="flex items-center min-w-0 text-sm">
                        {!collapsed && (
                          <span
                            className={cn(
                              "truncate",
                              activeSession === session.id
                                ? "text-white"
                                : "text-[#BEBEBE] group-hover:text-white"
                            )}
                          >
                            {session.chat_title || "New chat"}
                          </span>
                        )}
                      </div>

                      {!collapsed && (
                        <div 
                          className={cn(
                            "flex items-center space-x-1",
                            activeSession === session.id ? "flex" : "hidden group-hover:flex"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              openRenameDialog(session.id, session.chat_title)
                            }}
                            className="p-1 text-gray-400 transition-colors hover:text-gray-200"
                            aria-label="Rename chat"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              showDeleteConfirmation?.(session.id, session.chat_title || "New chat")
                            }}
                            className="p-1 text-gray-400 transition-colors hover:text-red-500"
                            disabled={isDeleting === session.id}
                            aria-label="Delete chat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {hasMore && isExpanded && (
                  <div className="flex justify-center mt-2">
                    <button
                      onClick={() => toggleGroupExpansion(groupName)}
                      className="flex items-center text-xs text-gray-400 hover:text-gray-200"
                    >
                      <ChevronDown className="w-3 h-3 mr-1 transform rotate-180" />
                      Show less
                    </button>
                  </div>
                )}
              </div>
            )
          })
        ) : !collapsed && (
          <div className="px-2 py-4 text-sm text-center text-gray-400">
            {isAuthenticated
              ? "No chat sessions yet.\nStart a new chat to begin."
              : "Sign in to view and save\n your chat history."}
          </div>
        )}
      </div>

      {/* User Section - Fixed at bottom */}
      {isAuthenticated && (
        <div className="flex-shrink-0 p-4 border-t border-gray-800">
          {!collapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="justify-start w-full gap-2 text-gray-200 hover:bg-gray-800">
                  <div className="flex items-center justify-center w-6 h-6 text-gray-300 bg-gray-700 rounded-full">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                <DropdownMenuItem onClick={logout} className="text-red-400 hover:bg-gray-700 focus:text-red-400">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={logout}
              className="flex justify-center w-full p-2 rounded-md hover:bg-gray-800"
              title="Log out"
            >
              <LogOut className="w-5 h-5 text-gray-300" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.sidebarOpen === nextProps.sidebarOpen &&
    prevProps.activeSession === nextProps.activeSession &&
    prevProps.isAuthenticated === nextProps.isAuthenticated &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.isLgScreen === nextProps.isLgScreen &&
    prevProps.isMediumScreen === nextProps.isMediumScreen &&
    prevProps.isLoadingSessions === nextProps.isLoadingSessions &&
    prevProps.sessions.length === nextProps.sessions.length &&
    prevProps.sessions.every((session, index) => 
      session.id === nextProps.sessions[index].id && 
      session.chat_title === nextProps.sessions[index].chat_title &&
      session.created_at === nextProps.sessions[index].created_at
    )
  );
});

ChatSidebar.displayName = 'ChatSidebar';

// Delete Confirmation Modal Component
const DeleteConfirmationModal: React.FC<{
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  sessionToDelete: { id: string; title: string } | null;
  deleteChatSession: () => void;
  isDeleting: string | null;
}> = ({ showDeleteModal, setShowDeleteModal, sessionToDelete, deleteChatSession, isDeleting }) => {
  return (
    <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
      <DialogContent className="text-white bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle>Delete Chat</DialogTitle>
          <DialogDescription className="text-gray-300">
            Are you sure you want to delete &ldquo;{sessionToDelete?.title}&rdquo;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
            className="text-gray-300 border-gray-600 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={deleteChatSession}
            disabled={isDeleting === sessionToDelete?.id}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting === sessionToDelete?.id ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Enhanced ChatSidebar with Modal
const ChatSidebarWithModal: React.FC<ChatSidebarProps> = (props) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const showDeleteConfirmation = (sessionId: string, sessionTitle: string) => {
    setSessionToDelete({ id: sessionId, title: sessionTitle });
    setShowDeleteModal(true);
  };

  const deleteChatSession = async () => {
    if (!sessionToDelete || isDeleting) return;
    setIsDeleting(sessionToDelete.id);

    try {
      await chatAPI.deleteChatSession(sessionToDelete.id);
      props.setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete.id));

      if (props.activeSession === sessionToDelete.id) {
        props.setActiveSession(null);
        props.setMessages([]);
      }

      toast({
        description: "Chat deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete chat session:", error);
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
      setShowDeleteModal(false);
      setSessionToDelete(null);
    }
  };

  return (
    <>
      <ChatSidebar 
        {...props} 
        showDeleteConfirmation={showDeleteConfirmation}
        isDeleting={isDeleting}
      />
      <DeleteConfirmationModal
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        sessionToDelete={sessionToDelete}
        deleteChatSession={deleteChatSession}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default ChatSidebarWithModal