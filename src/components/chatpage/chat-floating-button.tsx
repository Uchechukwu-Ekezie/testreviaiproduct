"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChatInput from "./chat-input";   // adjust the import path

export default function ChatFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Dummy handlers – replace with your real ChatProvider logic
  const handleSubmit = async (
    e: React.FormEvent,
    opts?: { imageUrls?: string[]; file?: File }
  ) => {
    e.preventDefault();
    if (!input.trim() && !opts?.imageUrls?.length && !opts?.file) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setInput("");
    }, 1500);
  };

  const handleStop = () => setIsLoading(false);

  return (
    <>
      {/* FAB – MOVED TO RIGHT */}
      <motion.button
        aria-label="Open chat"
        onClick={() => setIsOpen((v) => !v)}
        className={`
          fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center
          rounded-full bg-gradient-to-r from-[#FFD700] to-[#780991]
          text-white shadow-lg transition-all
          hover:from-yellow-600 hover:to-pink-600
          focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400
        `}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="h-7 w-7" />
      </motion.button>

      {/* Slide-up panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`
              fixed inset-x-0 bottom-0 z-40
              max-h-[85vh] overflow-y-auto rounded-t-3xl
              bg-background shadow-2xl
            `}
          >
            <div className="flex justify-center pt-3">
              <div className="h-1 w-12 rounded-full bg-muted" />
            </div>

            <div className="p-4 pb-8">
              <ChatInput
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                isMobile={true}
                sidebarCollapsed={false}
                handleStop={handleStop}
              />
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className={`
                absolute right-4 top-4 flex h-9 w-9 items-center justify-center
                rounded-full bg-muted/80 text-muted-foreground
                transition-colors hover:bg-muted
              `}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
    </>
  );
}