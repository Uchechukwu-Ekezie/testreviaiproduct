"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen, Plus, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { useRouter } from "next/navigation";

interface ChatHeaderProps {
  setSidebarOpen: (open: boolean) => void;
  isAuthenticated: boolean;
  sidebarCollapsed: boolean;
  isLgScreen: boolean;
  sidebarOpen: boolean;
  startNewChat?: () => void;
  isMediumScreen: boolean; // Add this prop
  isClient?: boolean; // Add this prop for hydration safety
  isScrolled?: boolean; // Add this prop for scroll state
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  setSidebarOpen,
  isAuthenticated,
  sidebarCollapsed,
  isLgScreen,
  sidebarOpen,
  startNewChat,
  isMediumScreen,
  isClient = true, // Default to true for backward compatibility
  isScrolled: isScrolledProp, // Get scroll state from parent
}) => {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  // Use prop if provided, otherwise detect window scroll (for other pages)
  useEffect(() => {
    if (isScrolledProp !== undefined) {
      setIsScrolled(isScrolledProp);
      return;
    }

    // Fallback: detect window scroll for pages that don't pass the prop
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrolledProp]);

  // Debug logging removed to prevent console spam on every re-render

  const setCollapsed = (collapsed: boolean) => {
    if (!collapsed) {
      setSidebarOpen(true);
    } else {
      console.warn("Collapse functionality requires additional implementation");
    }
  };

  // const handleDashboardClick = () => {
  //   router.push("/dashboard");
  // };

  return (
    <>
      {/* Fixed Right Actions */}
      <div className="fixed z-50 right-10 top-3">
        <div className="flex items-center gap-2">
          {/* Social Feed Button - Only show when authenticated */}
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/social-feed")}
              className="text-sm text-muted-foreground hover:text-foreground bg-transparent rounded-2xl hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30"
            >
              {/* <User className="w-4 h-4 mr-1" /> */}
              Social Feed
            </Button>
          )}

          {/* Profile/Sign In */}
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

      {/* Main Header */}
      <header
        className={cn(
          "fixed top-0 z-40 h-16 transition-all duration-300 ease-in-out",
          isScrolled ? "bg-gradient-to-b from-[#0a0a0a] via-[#141414] to-[#0a0a0a]" : "bg-transparent",
          "w-full",
          sidebarCollapsed && !isLgScreen ? "md:pl-16" : "md:pl-64",
          isLgScreen && !sidebarOpen ? "lg:pl-4" : "lg:pl-64"
        )}
      >
        <div className="relative flex items-center h-full gap-3 px-4">
          {/* Left side controls */}
          <div className="flex items-center gap-2">
            {/* Menu Button - Show on medium and large screens when sidebar is closed */}
            {isClient && !sidebarOpen && (
              <button
                onClick={() => {
                  setSidebarOpen(true);
                  setCollapsed(false);
                }}
                aria-label="Open sidebar"
              >
                <PanelLeftOpen className="w-8 h-8 text-muted-foreground" />
              </button>
            )}

            {/* New Chat Button - only visible when sidebar is closed */}
            {isClient && !sidebarOpen && (
              <div className="flex items-center justify-center w-8 h-8 border-2 rounded-full">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (startNewChat) startNewChat();
                  }}
                  className="flex items-center justify-center w-full h-full"
                >
                  <Plus className="w-6 h-6 font-bold" />
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <span
            className={cn(
              "font-medium text-foreground ml-2",
              "absolute left-[120px] hidden md:block -translate-x-1/2 top-1/2 -translate-y-1/2",
              "md:static md:transform-none",
              {
                "md:left-4": sidebarCollapsed && !isLgScreen,
                "lg:left-4": isLgScreen && !sidebarOpen,
              }
            )}
          >
            Revi AI
          </span>
        </div>
      </header>
    </>
  );
};

export default ChatHeader;
