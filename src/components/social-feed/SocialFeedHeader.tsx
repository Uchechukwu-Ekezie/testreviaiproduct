"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { FaPlus } from "react-icons/fa";
import PostModal from "@/components/social-feed/PostModal";

interface SocialFeedHeaderProps {
  onOpenCreatePost: () => void;
  placeholder?: string;
}

export default function SocialFeedHeader({
  onOpenCreatePost,
  placeholder = "Share your property update",
}: SocialFeedHeaderProps) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 mb-6 rounded-lg p-4">
      {/* Plus Icon Button */}
      <button
        onClick={() => {
          setIsModalOpen(true);
          onOpenCreatePost?.();
        }}
        className="w-[50px] h-[50px] bg-[#1A1A1A] rounded-[15px] flex items-center justify-center border-[#2E2E2E] border-[1px] hover:bg-[#2A2A2A] transition-colors duration-200"
      >
        <FaPlus className="text-white text-[20px]" />
      </button>

      {/* Input Field (clickable) */}
      <div
        onClick={() => {
          setIsModalOpen(true);
          onOpenCreatePost?.();
        }}
        className="flex-1 relative cursor-pointer"
      >
        <input
          type="text"
          placeholder={placeholder}
          readOnly
          className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-[15px] pl-[50px] pr-[80px] py-3 text-white placeholder:text-gray-400 focus:outline-none cursor-pointer"
        />

        {/* Profile Avatar */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full overflow-hidden z-10">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-white text-xs">
              {user
                ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`
                : "User"}
            </div>
          )}
        </div>
      </div>

      <PostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
