// components/ClientLayout.tsx
"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
// import ChatInput from "@/components/chatpage/chat";
import { useEffect, useState } from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [showChatInput, setShowChatInput] = useState(false);

  // Fixed: Match both /social/* and /social-feed
  const isSocialRoute =
    pathname?.startsWith("/social/") ||
    pathname?.startsWith("/social-feed") ||
    false;

  useEffect(() => {
    if (!authLoading) {
      setShowChatInput(isAuthenticated && isSocialRoute);
    }
  }, [isAuthenticated, isSocialRoute, authLoading]);

  // Dummy chat state (replace later)
  const [input, setInput] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Chat:", input);
    setInput("");
  };
  const handleStop = () => {};

  // Don't block rendering - always show children immediately
  // Auth checks happen in specific route guards if needed

  return (
    <>
      {children}

      {/* Chat Input – now appears on /social-feed */}
      {showChatInput && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background/90 to-transparent pointer-events-none">
          <div className="container mx-auto px-4 pb-4 pt-8 pointer-events-auto">
            <div className="max-w-4xl mx-auto">
              {/* <ChatInput
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={false}
                isMobile={false}
                sidebarCollapsed={false}
                handleStop={handleStop}
              /> */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
