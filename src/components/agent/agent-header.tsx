"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Menu, Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AgentHeaderProps {
  setSidebarOpen: (open: boolean) => void;
  sidebarOpen: boolean;
  isMobile: boolean;
}

export default function AgentHeader({
  setSidebarOpen,
  sidebarOpen,
  isMobile,
}: AgentHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 bg-[#1a1a1a] border-b border-zinc-800 px-6 py-4",
        "transition-all duration-300"
      )}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Menu button for mobile */}
        <div className="flex items-center gap-4">
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          {/* Search bar */}
          <div className="hidden md:flex items-center relative">
            <Search className="absolute left-3 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search properties, clients..."
              className="pl-10 w-80 bg-[#262626] border-zinc-700 text-white placeholder-zinc-400 focus:border-[#FFD700]"
            />
          </div>
        </div>

        {/* Right side - Notifications */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 relative"
          >
            <Bell className="w-5 h-5" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center">
              3
            </span>
          </Button>
        </div>
      </div>

      {/* Mobile search */}
      {isMobile && (
        <div className="mt-4 flex items-center relative">
          <Search className="absolute left-3 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search properties, clients..."
            className="pl-10 w-full bg-[#262626] border-zinc-700 text-white placeholder-zinc-400 focus:border-[#FFD700]"
          />
        </div>
      )}
    </header>
  );
}
