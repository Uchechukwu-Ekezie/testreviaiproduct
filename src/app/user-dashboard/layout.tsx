"use client";

import Sidebar from "@/components/sidebar";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { useState, useEffect } from "react";
import { FiHome, FiLogOut } from "react-icons/fi";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUserMenu && !target.closest(".user-menu")) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  // Pages that should not show the sidebar (like login, landing page, etc.)
  const publicPages = ["/login", "/register", "/", "/about", "/contact"];
  const shouldShowSidebar = !publicPages.includes(pathname);

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar (Optional) */}
        <header className="bg-[#222222] text-[#BEBEBE]  px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold  capitalize">
                {pathname === "/dashboard"
                  ? "Dashboard"
                  : pathname === "/bookings"
                  ? "Bookings"
                  : pathname === "/receipts"
                  ? "Receipts"
                  : pathname === "/my-reviews"
                  ? "My Reviews"
                  : pathname.slice(1)}
              </h1>
            </div>

            {/* User Profile Section */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-5 5v-5zM9 12l2 2 4-4m-6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
              </button>

              {/* User Avatar & Menu */}
              <div className="relative user-menu">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  {user?.avatar && user.avatar !== "/placeholder.svg" ? (
                    <Image
                      src={user.avatar}
                      alt="Profile"
                      width={22}
                      height={22}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-[#FFD700] to-[#780991] rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user?.first_name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="text-left">
                    <span className="text-sm font-medium text-white block">
                      {user?.first_name} {user?.last_name || ""}
                    </span>
                    {user?.user_type && (
                      <span className="text-xs text-[#FFD700] capitalize">
                        {user.user_type}
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-lg py-2 z-50">
                    {/* User Info Header */}
                    {/* <div className="px-4 py-3 border-b border-white/10">
                      <div className="flex items-center space-x-3">
                        {user?.avatar && user.avatar !== "/placeholder.svg" ? (
                          <Image
                            src={user.avatar}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-[#FFD700] to-[#780991] rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-lg">
                              {user?.first_name?.charAt(0) || "U"}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">
                            {user?.first_name} {user?.last_name}
                          </p>
                          <p className="text-white/60 text-sm">{user?.email}</p>
                          {user?.user_type && (
                            <p className="text-xs text-[#FFD700] capitalize mt-1">
                              {user.user_type}
                            </p>
                          )}
                        </div>
                      </div>
                    </div> */}

                    {/* Menu Items */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        window.location.href = "/";
                        // Add settings navigation logic here
                      }}
                      className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center space-x-2"
                    >
                      <FiHome className="w-4 h-4" />
                      <span>Home</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center space-x-2"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
