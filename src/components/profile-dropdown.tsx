"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

import Image from "next/image";
import { Settings, LogOut, User, Crown, LayoutDashboard, MessageSquare } from "lucide-react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProfileModal } from "./profile-modal";
import { SettingsModal } from "./settings-modal";
import { UpgradePlanModal } from "./upgrade-plan-modal";

export function ProfileDropdown() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // Memoized handlers for better performance
  const handleProfileOpen = useCallback(() => setIsProfileOpen(true), []);
  const handleProfileClose = useCallback(() => setIsProfileOpen(false), []);
  const handleSettingsOpen = useCallback(() => setIsSettingsOpen(true), []);
  const handleSettingsClose = useCallback(() => setIsSettingsOpen(false), []);
  const handleUpgradeOpen = useCallback(() => setIsUpgradeOpen(true), []);
  const handleUpgradeClose = useCallback(() => setIsUpgradeOpen(false), []);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 hover:opacity-80">
            <Avatar className="w-10 h-10">
              {user?.avatar ? (
                <Image
                  src={user.avatar || "/placeholder.svg"}
                  alt={user.username || "User"}
                  fill
                  sizes="100%"
                  className="rounded-full"
                />
              ) : (
                <div className="flex items-center justify-center text-sm rounded-full bg-zinc-800 text-zinc-400">
                  {user?.username?.[0] || user?.email?.split("@")[0] || "U"}
                </div>
              )}
            </Avatar>
            <span className="hidden text-sm text-zinc-400 md:block">
              {user?.username || user?.email}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[270px] bg-card rounded-[15px]  "
          align="end"
        >
          <div className="w-[250px]  ">
            <DropdownMenuItem
              className="flex items-center gap-2 pb-3 border-0 cursor-pointer text-muted-foreground hover:text-white hover:bg-zinc-800 hover:border-none focus:outline-none focus:ring-0"
              onClick={handleProfileOpen}
            >
              <User style={{ width: "24px", height: "24px" }} />
              <span>Profile</span>
            </DropdownMenuItem>
            {(user?.type === "admin" || user?.agent_request?.status === "approved") && (
              <DropdownMenuItem
                className="flex items-center gap-2 pb-3 border-0 cursor-pointer text-muted-foreground hover:text-white hover:bg-zinc-800 hover:border-none focus:outline-none focus:ring-0"
                onClick={() => router.push("/dashboard")}
              >
                <LayoutDashboard style={{ width: "24px", height: "24px" }} />
                <span>Dashboard</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="flex items-center gap-2 pb-3 border-0 cursor-pointer text-muted-foreground hover:text-white hover:bg-zinc-800 hover:border-none focus:outline-none focus:ring-0"
              onClick={() => router.push("/reviews")}
            >
              <MessageSquare style={{ width: "24px", height: "24px" }} />
              <span>Reviews</span>
            </DropdownMenuItem>
            {/* <DropdownMenuItem
className="flex items-center gap-2 pb-3 border-0 cursor-pointer text-muted-foreground hover:text-white hover:bg-zinc-800 hover:border-none focus:outline-none focus:ring-0"
onClick={() => setIsUpgradeOpen(true)}
            >
              <Crown style={{ width: "24px", height: "24px" }} />
              Upgrade Plan
            </DropdownMenuItem> */}
            <DropdownMenuItem
              className="flex items-center gap-2 pb-3 border-0 cursor-pointer text-muted-foreground hover:text-white hover:bg-zinc-800 hover:border-none focus:outline-none focus:ring-0"
              onClick={handleSettingsOpen}
            >
              <Settings style={{ width: "24px", height: "24px" }} />
              Settings
            </DropdownMenuItem>
          </div>
          <DropdownMenuSeparator className="bg-[#646262]/40 mb-3 w-[92%] mx-auto" />
          <DropdownMenuItem
            className="flex items-center gap-2 pb-3 border-0 cursor-pointer text-muted-foreground hover:text-white hover:bg-zinc-800 hover:border-none focus:outline-none focus:ring-0"
            onClick={logout}
          >
            <LogOut style={{ width: "24px", height: "24px" }} />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={handleProfileClose}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={handleSettingsClose}
      />
      <UpgradePlanModal
        isOpen={isUpgradeOpen}
        onClose={handleUpgradeClose}
      />
    </>
  );
}
