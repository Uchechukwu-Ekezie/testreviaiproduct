"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Search,
  Settings,
  Plus,
  LogOut,
  ImageIcon,
  X,
  PaperclipIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ProfileDropdown } from "@/components/profile-dropdown";
import Image from "next/image";
import one from "../../public/Image/one.png";
import two from "../../public/Image/two.png";
import three from "../../public/Image/three.png";
import four from "../../public/Image/four.png";

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
 

  const actionCards = [
    {
      title: "Find a Property",
      description: "Search for homes to rent or buy",
      image: one,
      messages: [
        { sender: "human", text: "I want to find a property." },
        {
          sender: "ai",
          text: "Sure! What type of property are you looking for?",
        },
      ],
    },
    {
      title: "Verify a Landlord",
      description: "Check credentials and reviews",
      image: three,
      messages: [
        { sender: "human", text: "Can I verify my landlord?" },
        { sender: "ai", text: "Yes! Please provide the landlord's details." },
      ],
    },
    {
      title: "Get Property Insights",
      description: "View pricing trends and analytics",
      image: two,
      messages: [
        { sender: "human", text: "I need property insights." },
        {
          sender: "ai",
          text: "I can provide pricing trends and analytics. What location?",
        },
      ],
    },
    {
      title: "Explore Neighborhoods",
      description: "Discover nearby amenities and more",
      image: four,
      messages: [
        { sender: "human", text: "Tell me about my neighborhood." },
        {
          sender: "ai",
          text: "Sure! What neighborhood are you interested in?",
        },
      ],
    },
  ];
  

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 p-4 transition-transform md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </Button>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon">
              <Search className="w-4 h-4 text-zinc-400" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4 text-zinc-400" />
            </Button>
          </div>
        </div>

        <div className="py-4">
          <Button className="justify-start w-full gap-2 text-white bg-zinc-800 hover:bg-zinc-700">
            <Plus className="w-4 h-4" /> New chat
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="px-2 py-2">
            <div className="px-2 py-2 text-xs font-medium text-zinc-400">
              Recent
            </div>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-2 py-2 text-sm rounded-md cursor-pointer text-zinc-400 hover:bg-zinc-800"
                >
                  <span>Find me an address</span>
                  <span className="text-xs">...</span>
                </div>
              ))}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <Button
            variant="ghost"
            className="justify-start w-full text-zinc-400 hover:text-zinc-300"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" /> Log out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-4 px-4 border-b h-14 border-zinc-800">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-zinc-400" />
          </Button>
          <div className="ml-auto">
            {isAuthenticated ? (
              <ProfileDropdown />
            ) : (
              <Button
                variant="ghost"
                className="text-sm text-zinc-400 hover:text-zinc-300"
                onClick={() => router.push("/signin")}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable Chat Content */}
        <div className="flex items-center justify-center flex-1 p-4 overflow-y-auto">
          <div className="w-full max-w-5xl mx-auto">
            <h1 className="mb-8 text-xl text-center text-white">
              {isAuthenticated
                ? `Hi ${user?.name || "there"}! How can I assist you today?`
                : "Hi! How can I assist you today?"}
            </h1>
            <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 max-w-[600px] text-center mx-auto">
              {actionCards.map((card) => (
                <Card
                  key={card.title}
                  className="p-4 py-8 transition-colors cursor-pointer bg-[#262626] border-zinc-800 hover:bg-zinc-900"
                  
                >
                  <div className="flex flex-col items-center gap-3">
                    <Image
                      src={card.image}
                      alt={card.title}
                      width={44}
                      height={44}
                    />
                    <div>
                      <h3 className="mb-1 font-medium text-white">
                        {card.title}
                      </h3>
                      <p className="text-sm text-zinc-400">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
        

        {/* Fixed Bottom Input */}
        <div className="bottom-0 left-0 right-0 lg:pb-4">
          <div className="w-full max-w-[863px] mx-auto border md:rounded-[15px] border-white/10 rounded-t-[15px] md p-2 bg-[#262626]">
            <input
              type="text"
              placeholder="Ask me anything"
              disabled
              className="w-full bg-transparent text-[#7F7F7F] placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#F5B041]/50 p-3"
            />
            <div className="flex flex-row items-center justify-between mt-4 md:flex-row">
              {/* Attachments */}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  disabled
                  className="flex items-center gap-2 p-2 transition-colors rounded-md"
                >
                  <PaperclipIcon className="w-5 h-5 text-[#7F7F7F]" />
                  <span className="text-[#7F7F7F] text-[15px]">
                    Add Attachment
                  </span>
                </button>
                <button
                  disabled
                  className="flex items-center gap-2 p-2 transition-colors rounded-md"
                >
                  <ImageIcon className="w-5 h-5 text-[#7F7F7F]" />
                  <span className="text-[#7F7F7F] text-[15px]">Use Images</span>
                </button>
              </div>

              {/* Submit Button */}
              <Button
                onClick={() => console.log("Coming Soon clicked")}
                disabled
                className="relative bg-gradient-to-r from-[#FFD700] to-[#780991] text-white rounded-[15px] mt-4 md:mt-0 overflow-hidden"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
