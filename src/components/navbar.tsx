"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FiMenu, FiX, FiLogOut } from "react-icons/fi";
import { User, Settings } from "lucide-react";
import Button from "../ui/Button";
import logo from "../../public/Image/Revi.ai Technology.png";
import { useAuth } from "@/contexts/auth-context";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    setIsOpen(false);

    // Close user menu when clicking outside
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

  const handleLoginClick = () => {
    router.push("/login");
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      setIsOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDashboardClick = () => {
    router.push("/user-dashboard");
    setShowUserMenu(false);
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md">
      <div className="container flex items-center justify-between py-4 px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src={logo || "/placeholder.svg"}
            alt="Logo"
            width={166}
            height={35}
          />
        </Link>

        <div className="hidden md:flex items-center space-x-8 text-[18px]">
          <Link
            href="/experience"
            className="text-[#F3F3F3] hover:text-white/80"
          >
            Share Your Experience
          </Link>
          <Link
            href="/properties"
            className="text-[#F3F3F3] hover:text-white/80"
          >
            Properties
          </Link>
          <Link
            href="https://app.reviai.ai/ "
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#F3F3F3] hover:text-white/80"
          >
            AI Chat
          </Link>
          <Link href="/blogs" className="text-[#F3F3F3] hover:text-white/80">
            Blogs
          </Link>

          {/* <Link href="/reviews" className="text-[#F3F3F3] hover:text-white/80">
            Reviews
          </Link> */}

          {/* Authentication-based buttons */}
          {isAuthenticated ? (
            <div className="relative user-menu">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:opacity-90 px-4 py-2 rounded-[15px] text-white transition-opacity"
              >
                {/* {user?.avatar && user.avatar !== "/placeholder.svg" ? (
                  <Image
                    src={user.avatar}
                    alt="Profile"
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )} */}
                <span>Dashboard</span>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-lg py-2 z-50">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center space-x-3">
                      {/* {user?.avatar && user.avatar !== "/placeholder.svg" ? (
                        <Image
                          src={user.avatar}
                          alt="Profile"
                          width={62}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-r from-[#FFD700] to-[#780991] rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )} */}
                      <div>
                        <p className="text-white font-medium">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-white/60 text-sm">{user?.email}</p>
                        {user?.user_type && (
                          <p className="text-xs text-[#FFD700] capitalize">
                            {user.user_type}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <button
                    onClick={handleDashboardClick}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center space-x-2"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              label="Login"
              onClick={handleLoginClick}
              className="bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-orange-600 hover:to-pink-600 hover:opacity-90 border-0 text-white rounded-[15px]"
            />
          )}
        </div>

        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-md flex flex-col items-center py-4 px-4 space-y-4 border-t border-white/10"
        >
          <Link
            href="/experience"
            className="text-white text-base sm:text-lg hover:text-white/80 py-2 px-4 rounded-lg hover:bg-white/5 transition-colors w-full text-center"
            onClick={() => setIsOpen(false)}
          >
            Share Your Experience
          </Link>
          <Link
            href="/properties"
            className="text-white text-base sm:text-lg hover:text-white/80 py-2 px-4 rounded-lg hover:bg-white/5 transition-colors w-full text-center"
            onClick={() => setIsOpen(false)}
          >
            Properties
          </Link>
          <Link
            href="https://app.reviai.ai/ "
            className="text-white text-base sm:text-lg hover:text-white/80 py-2 px-4 rounded-lg hover:bg-white/5 transition-colors w-full text-center"
            onClick={() => setIsOpen(false)}
            target="_blank"
            rel="noopener noreferrer"
          >
            AI Chat
          </Link>
          <Link
            href="/blogs"
            className="text-white text-base sm:text-lg hover:text-white/80 py-2 px-4 rounded-lg hover:bg-white/5 transition-colors w-full text-center"
            onClick={() => setIsOpen(false)}
          >
            Blogs
          </Link>
          {/* <Link
            href="/reviews"
            className="text-white text-base sm:text-lg hover:text-white/80 py-2 px-4 rounded-lg hover:bg-white/5 transition-colors w-full text-center"
            onClick={() => setIsOpen(false)}
          >
            Reviews
          </Link> */}

          {/* Mobile Authentication buttons */}
          {isAuthenticated ? (
            <div className="flex flex-col space-y-3 items-center w-full">
              {/* Mobile User Info */}
              <div className="flex items-center space-x-3 px-4 py-3 bg-white/5 rounded-lg w-full max-w-sm">
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
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-white/60 text-xs truncate">{user?.email}</p>
                  {user?.user_type && (
                    <p className="text-xs text-[#FFD700] capitalize">
                      {user.user_type}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-2 w-full max-w-sm">
                <Button
                  label="Dashboard"
                  onClick={handleDashboardClick}
                  className="bg-gradient-to-r from-[#FFD700] to-[#780991] hover:opacity-90 border-0 text-white rounded-[15px] w-full py-2.5"
                />
                <Button
                  label="Logout"
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 border-0 text-white rounded-[15px] w-full py-2.5"
                />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-sm">
              <Button
                label="Login"
                onClick={handleLoginClick}
                className="bg-gradient-to-r from-[#FFD700] to-[#780991] hover:opacity-90 border-0 text-white rounded-[15px] w-full py-2.5"
              />
            </div>
          )}
        </motion.div>
      )}
    </nav>
  );
}
