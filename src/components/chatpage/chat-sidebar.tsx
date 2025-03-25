"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Search, Settings, Plus, LogOut, X, Trash, MoreVertical, Pencil } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { chatAPI } from "@/lib/api"

interface ChatSidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  sessions: any[]
  setSessions: React.Dispatch<React.SetStateAction<any[]>>
  activeSession: string | null
  setActiveSession: React.Dispatch<React.SetStateAction<string | null>>
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
  isAuthenticated: boolean
  logout: () => void
  isMobile: boolean
  showRenameDialog: boolean
  setShowRenameDialog: React.Dispatch<React.SetStateAction<boolean>>
  setSelectedSessionId: React.Dispatch<React.SetStateAction<string | null>>
  setNewTitle: React.Dispatch<React.SetStateAction<string>>
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
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
  showRenameDialog,
  setShowRenameDialog,
  setSelectedSessionId,
  setNewTitle,
}) => {
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null)

  const startNewChat = () => {
    // Clear messages
    setMessages([])

    // Clear active session
    setActiveSession(null)

    // On mobile, close the sidebar
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const selectSession = (id: string) => {
    // Set this session as active
    setActiveSession(id)

    // Close sidebar on mobile
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const deleteChatSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent selecting the session when clicking delete

    if (isDeleting) return // Prevent multiple simultaneous delete operations

    setIsDeleting(sessionId)

    try {
      await chatAPI.deleteChatSession(sessionId)

      // Remove the session from the local state
      setSessions((prev: any) => prev.filter((s: any) => s.id !== sessionId))

      // If the active session was deleted, reset it
      if (activeSession === sessionId) {
        setActiveSession(null)
        setMessages([])
      }

      toast({
        title: "Success",
        description: "Chat session deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting chat session:", error)
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const openRenameDialog = (sessionId: string, currentTitle: string) => {
    setSelectedSessionId(sessionId)
    setNewTitle(currentTitle)
    setShowRenameDialog(true)
  }

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border p-4 transition-transform md:relative md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="lg:hidden">
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
          <div className="px-2 py-2 text-xs font-medium text-muted-foreground">Recent Chats</div>

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
                <span className="truncate max-w-[80%] cursor-pointer" onClick={() => selectSession(session.id)}>
                  {session.chat_title || "Untitled Chat"}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground hover:text-foreground">
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
                        e.preventDefault()
                        deleteChatSession(session.id, e as any)
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
  )
}

export default ChatSidebar

