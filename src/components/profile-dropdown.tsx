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
import { Settings, LogOut, User, Crown } from "lucide-react";
import { useState } from "react";
import { ProfileModal } from "./profile-modal";
import { SettingsModal } from "./settings-modal";
import { UpgradePlanModal } from "./upgrade-plan-modal";

export function ProfileDropdown() {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
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
              onClick={() => setIsProfileOpen(true)}
            >
              <User style={{ width: "24px", height: "24px" }} />

              <span>Profile</span>
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
              onClick={() => setIsSettingsOpen(true)}
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
        onClose={() => setIsProfileOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <UpgradePlanModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
      />
    </>
  );
}
