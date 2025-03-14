"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"

import Image from "next/image"
import { Settings, LogOut, User, Crown } from "lucide-react"
import { useState } from "react"
import { ProfileModal } from "./profile-modal"
import { SettingsModal } from "./settings-modal"
import { UpgradePlanModal } from "./upgrade-plan-modal"

export function ProfileDropdown() {
  const { user, logout } = useAuth()
  
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 hover:opacity-80">
            <span className="text-sm text-zinc-400">{user?.name || user?.email}</span>
            <Avatar className="w-8 h-8">
              {user?.avatar ? (
                <Image
                  src={user.avatar || "/placeholder.svg"}
                  alt={user.name || "User"}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="flex items-center justify-center text-sm rounded-full bg-zinc-800 text-zinc-400">
                  {user?.name?.[0] || user?.email?.[0] || "U"}
                </div>
              )}
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 border-zinc-800 bg-zinc-900" align="end">
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={() => setIsProfileOpen(true)}
          >
            <User className="w-4 h-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={() => setIsUpgradeOpen(true)}
          >
            <Crown className="w-4 h-4" />
            Upgrade Plan
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="w-4 h-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <UpgradePlanModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </>
  )
}

