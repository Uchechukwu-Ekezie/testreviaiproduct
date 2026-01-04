"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  LayoutDashboard,
  Building2,
  Star,
  Settings,
  LogOut,
  X,
  CalendarCheck,
} from "lucide-react";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "My Properties",
    href: "/dashboard/properties",
    icon: Building2,
  },
  {
    name: "Bookings",
    href: "/dashboard/bookings",
    icon: CalendarCheck,
  },
  {
    name: "Reviews",
    href: "/dashboard/reviews",
    icon: Star,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

// Logout Confirmation Modal Component
function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#222222] border border-[#333333] rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute text-gray-400 transition-colors top-4 right-4 hover:text-white"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-semibold text-white">
            Confirm Logout
          </h3>
          <p className="text-gray-400">
            Are you sure you want to logout? You will need to sign in again to
            access your account.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#333333] hover:bg-[#404040] rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 rounded-full border-white/30 border-t-white animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Logout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [isCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/l");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect even if logout API fails
      router.push("/");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <div
        className={`fixed left-0 top-0 z-40 h-screen bg-[#212121] border-r border-[#2a2a2a] transition-all duration-300 flex flex-col ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              {/* <Image
                src="/Image/logo.png"
                alt="Revi.ai"
                width={32}
                height={32}
                className="rounded"
              /> */}
              <div>
                <h2 className="text-lg font-bold text-white">Revi.ai</h2>
                <p className="text-xs text-gray-400 capitalize">Agent Portal</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation - flex-1 to take up available space */}
        <nav className="flex-1 px-4 mt-8">
          <div className="mb-4">
            <h3 className="mb-3 text-xs font-medium tracking-wider text-gray-500 uppercase">
              {!isCollapsed && "Main Menu"}
            </h3>
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-[15px] px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[#373737] text-white border border-[#444444]"
                          : "text-gray-400 hover:bg-[#2A2A2A] hover:text-white"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {!isCollapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Bottom Section - Logout */}
        {/* <div className="p-4 border-t border-[#2a2a2a]">
          <button
            onClick={handleLogoutClick}
            className={`flex items-center gap-3 rounded-[15px] px-3 py-2 text-sm font-medium transition-colors w-full text-gray-400 hover:bg-red-500/10 hover:text-red-400 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div> */}
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />
    </>
  );
}
