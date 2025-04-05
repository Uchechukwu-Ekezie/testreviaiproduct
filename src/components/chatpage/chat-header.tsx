"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { useRouter } from "next/navigation"

interface ChatHeaderProps {
  setSidebarOpen: (open: boolean) => void
  isAuthenticated: boolean
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ setSidebarOpen, isAuthenticated }) => {
  const router = useRouter()

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-4 px-4 border-b h-14 border-border bg-background lg:left-64">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2 lg:hidden" onClick={() => setSidebarOpen(true)}>
          <Menu className="w-5 h-5 text-muted-foreground" />
        </Button>

        {/* Logo or app name can go here */}
        <span className="font-medium text-foreground ">Revi AI</span>
      </div>

      {/* Right side elements */}
      <div className="flex items-center gap-4">
        {/* <ThemeToggle /> */}
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
  )
}

export default ChatHeader

