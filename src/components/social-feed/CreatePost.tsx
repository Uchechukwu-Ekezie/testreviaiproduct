"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera } from "lucide-react";
import { useAuth } from "@/contexts/auth-context"; // Adjust path as needed
import { usePosts } from "@/hooks/usePosts"; // Adjust path to where usePosts.ts is located
import PostModal from "@/components/social-feed/PostModal";

export default function CreatePost() {
  const { user } = useAuth();
  const { isAuthenticated } = usePosts();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    if (!isAuthenticated) {
      // Optionally redirect to login or show a message
      alert("Please log in to create a post");
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="mb-6 mt-6">
      <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-4">
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="text-white text-xs">
              {user
                ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`
                : "👤"}
            </span>
          )}
        </div>
        <div className="flex-1 relative">
          <Input
            placeholder="Share your property update"
            readOnly
            onClick={handleOpenModal}
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 pr-12 rounded-lg cursor-pointer"
          />
          <Camera className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
        <Button
          onClick={handleOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg"
        >
          Post
        </Button>
      </div>
      <PostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
