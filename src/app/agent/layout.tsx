"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import AgentSidebar from "@/components/agent/agent-sidebar";
import AgentHeader from "@/components/agent/agent-header";
import { useMediaQuery } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import ScreenSizeGuard from "@/components/dashboard/screen-size-guard";

interface AgentLayoutProps {
  children: React.ReactNode;
}

export default function AgentLayout({ children }: AgentLayoutProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useMediaQuery("(max-width: 1024px)");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/signin");
      return;
    }

    // Check if user is a verified agent
    const isVerifiedAgent =
      user?.agent_info?.status === "approved" ||
      user?.agent_request?.status === "approved";

    if (!isVerifiedAgent) {
      router.push("/"); // Redirect to main app
      return;
    }

    setIsLoading(false);
  }, [isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#121212]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
          <p className="text-zinc-400">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ScreenSizeGuard>
      <div className="flex h-screen bg-[#121212] text-white">
        {/* Sidebar */}
        <AgentSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
        />

        {/* Main Content */}
        <div
          className={cn(
            "flex flex-col flex-1 transition-all duration-300",
            sidebarOpen && !isMobile ? "ml-64" : "ml-0"
          )}
        >
          {/* Header */}
          <AgentHeader
            setSidebarOpen={setSidebarOpen}
            sidebarOpen={sidebarOpen}
            isMobile={isMobile}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </ScreenSizeGuard>
  );
}
