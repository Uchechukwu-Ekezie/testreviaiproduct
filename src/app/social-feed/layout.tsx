/**
 * Social Feed Layout (Server Component)
 *
 * This is a SERVER component - no "use client" directive
 * Auth is handled by root AuthProvider - no need for additional guards
 */

import React from "react";
import { ChatbotProvider } from "@/contexts/chatbot-context";
import SocialFeedClientWrapper from "@/components/social-feed/SocialFeedClientWrapper";

interface SocialFeedLayoutProps {
  children: React.ReactNode;
}

/**
 * Main Layout Component (Server Component)
 * Layout stays mounted across navigations - no re-renders
 * Auth handled by root AuthProvider in app/layout.tsx
 */
export default function SocialFeedLayout({ children }: SocialFeedLayoutProps) {
  return (
    <ChatbotProvider>
      <SocialFeedClientWrapper>{children}</SocialFeedClientWrapper>
    </ChatbotProvider>
  );
}
