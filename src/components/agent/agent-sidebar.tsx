"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  LayoutDashboard,
  Building2,
  Star,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import Image from "next/image";
import logo from "../../../public/Image/logo reviai.png";

interface AgentSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/agent/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Properties",
    href: "/agent/properties",
    icon: Building2,
  },
  {
    name: "Reviews",
    href: "/agent/reviews",
    icon: Star,
  },
  {
    name: "Settings",
    href: "/agent/settings",
    icon: Settings,
  },
];

export default function AgentSidebar({
  sidebarOpen,
  setSidebarOpen,
  isMobile,
}: AgentSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1a1a] border-r border-zinc-800 transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          !isMobile && "lg:translate-x-0 lg:static lg:inset-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center">
              <Image src={logo} alt="Revi AI Logo" width={32} height={24} />
              <span className="ml-3 text-xl font-semibold text-white">
                Agent Portal
              </span>
            </div>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#FFD700] to-[#780991] rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.first_name?.charAt(0)?.toUpperCase() || "A"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.username || "Agent"}
                </p>
                <p className="text-xs text-zinc-400">Verified Agent</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-gradient-to-r from-[#FFD700]/20 to-[#780991]/20 text-[#FFD700] border border-[#FFD700]/30"
                      : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="px-4 py-4 border-t border-zinc-800">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-zinc-300 hover:text-white hover:bg-zinc-800"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
