"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatbotContextType {
  isChatbotOpen: boolean;
  setIsChatbotOpen: (open: boolean) => void;
  chatMessage: string;
  setChatMessage: (message: string) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");


  return (
    <ChatbotContext.Provider value={{
      isChatbotOpen,
      setIsChatbotOpen,
      chatMessage,
      setChatMessage
    }}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
}
