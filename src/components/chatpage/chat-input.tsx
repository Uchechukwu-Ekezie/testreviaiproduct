"use client";

import React, { useRef, useState, useEffect } from "react";
import { PaperclipIcon, ImageIcon, X, Plus, StopCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "@/components/ui/use-toast";
import { chatAPI } from "@/lib/api";
import arrow from "../../../public/Image/arrow-up.svg";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isMobile: boolean;
  activeSession?: string | null;
  user?: { id: string } | null;
  isAuthenticated?: boolean;
  setMessages?: (messages: any[] | ((prev: any[]) => any[])) => void;
  setActiveSession?: (sessionId: string | null) => void;
  setSessions?: (sessions: any[] | ((prev: any[]) => any[])) => void;
  refreshSessions?: () => void;
  sidebarCollapsed: boolean;
  handleStop?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = React.memo(({
  input,
  setInput,
  handleSubmit,
  isLoading,
  isMobile,
  activeSession,
  user,
  isAuthenticated,
  setMessages,
  setActiveSession,
  setSessions,
  refreshSessions,
  sidebarCollapsed,
  handleStop,
}) => {
  // Memoize refs to prevent re-renders
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const tempIdRef = useRef<string>("");
  const isStreamingRef = useRef(false);

  // Memoize state setters
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Memoize handlers
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [setInput]);

  const handleLocalSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (handleSubmit) {
      setInput("");
      handleSubmit(e);
    }
  }, [handleSubmit, setInput]);

  const handleStopGenerating = React.useCallback(() => {
    setIsStopping(true);
    isStreamingRef.current = false;
    abortControllerRef.current?.abort();
    handleStop?.();
  }, [handleStop]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isModalOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);

  // Auto-resize textarea
  useEffect(() => {
    autoResize();
  }, [input]);

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  };

  // File handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedImages = Array.from(e.target.files);
      const newImagePreviews = selectedImages.map((file) =>
        URL.createObjectURL(file)
      );
      setImages((prev) => [...prev, ...selectedImages]);
      setImagePreviews((prev) => [...prev, ...newImagePreviews]);
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };
  // Chat submission
  const onLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (handleSubmit) {
      setInput("");
      handleSubmit(e);
      return;
    }

    if (!input.trim() && images.length === 0 && attachments.length === 0) return;

    setLocalIsLoading(true);
    setIsGenerating(true);
    setIsStopping(false);
    const currentMessage = input;
    setInput("");

    if (!setMessages || !setActiveSession || !setSessions || !refreshSessions) {
      console.error("Required props for internal submit handling are missing");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const userMessage = { id: tempId, prompt: currentMessage, response: "", isComplete: false };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const messageData = {
        message: currentMessage,
        ...(attachments.length > 0 && { attachment: attachments[0] }),
        ...(images.length > 0 && { image: images[0] }),
      };

      let data;
      if (activeSession) {
        data = await chatAPI.postNewChat(messageData.message, activeSession);
      } else {
        const sessionData = {
          chat_title: currentMessage.substring(0, 30),
          user: user?.id || "guest",
        };
        const sessionResponse = await chatAPI.createChatSession(sessionData);
        setActiveSession(sessionResponse.id);
        data = await chatAPI.postNewChat(
          messageData.message,
          sessionResponse.id
        );

        setSessions((prev) => {
          if (!prev.some((s) => s.id === sessionResponse.id)) {
            return [...prev, sessionResponse];
          }
          return prev;
        });

        setTimeout(refreshSessions, 500);
      }

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...data, isComplete: true } : msg))
      );
      setAttachments([]);
      setImages([]);
      setImagePreviews([]);
    } catch (error: any) {
      console.error("Error submitting chat:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send message.",
        variant: "destructive",
      });
      setInput("");
    } finally {
      setLocalIsLoading(false);
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      className="bottom-0 left-0 z-40 w-full transition-all duration-300 bg-background"
      initial={{ y: 20, opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
        paddingLeft: isMobile ? 0 : sidebarCollapsed ? "4rem" : "16rem",
        paddingRight: isMobile ? 0 : "14px",
      }}
      transition={{ duration: 0.1 }}
    >
      <div className="flex justify-center w-full">
        <div className="w-full md:max-w-[880px] mx-auto p-4">
          <motion.div
            className="border rounded-[15px] border-border p-2 bg-card"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleLocalSubmit}>
              <textarea
                ref={textareaRef}
                placeholder="Ask me anything about real estate..."
                value={input}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleLocalSubmit(e);
                  }
                }}
                disabled={isLoading || localIsLoading}
                rows={1}
                className="w-full p-3 overflow-y-auto bg-transparent resize-none text-foreground placeholder:text-muted-foreground focus:outline-none max-h-72"
              />

              {/* Uploaded Images */}
              <AnimatePresence>
                {images.length > 0 && (
                  <motion.div
                    className="flex flex-wrap gap-2 mt-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {images.map((image, index) => (
                      <motion.div
                        key={index}
                        className="relative flex items-center gap-2 p-2 rounded-md"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Image
                          src={imagePreviews[index] || "/placeholder.svg"}
                          alt="preview"
                          width={64}
                          height={64}
                          className="object-cover w-16 h-16 rounded-md"
                        />
                        <motion.button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-0 right-0 p-1 bg-red-500 rounded-full"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="w-4 h-4 text-white" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Uploaded Attachments */}
              <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div
                    className="flex flex-wrap gap-2 mt-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {attachments.map((file, index) => (
                      <motion.div
                        key={index}
                        className="relative flex items-center gap-2 p-2 border rounded-md border-border"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center gap-2">
                          <PaperclipIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[150px]">
                            {file.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="p-1 ml-2 rounded-full hover:bg-muted"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <input
                type="file"
                multiple
                hidden
                ref={imageInputRef}
                onChange={handleImageUpload}
                accept="image/*"
              />

              <input
                type="file"
                multiple
                hidden
                ref={attachmentInputRef}
                onChange={handleAttachmentUpload}
                accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
              />

              <div className="flex items-center justify-between pt-2 mt-2 border-border">
                <div className="flex items-center gap-2">
                  <div className="items-center hidden gap-2 md:flex">
                    <motion.button
                      type="button"
                      disabled={isLoading || localIsLoading}
                      onClick={() => imageInputRef.current?.click()}
                      className="flex items-center gap-2 p-2 transition-colors rounded-md"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-muted-foreground text-[15px]">
                        Upload Image
                      </span>
                    </motion.button>

                    <motion.button
                      type="button"
                      disabled={isLoading || localIsLoading}
                      onClick={() => attachmentInputRef.current?.click()}
                      className="flex items-center gap-2 p-2 transition-colors rounded-md"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <PaperclipIcon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-muted-foreground text-[15px]">
                        Attach Document
                      </span>
                    </motion.button>
                  </div>

                  <div className="flex items-center md:hidden">
                    <motion.button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <div className="flex items-center gap-2 p-1 border-2 rounded-full border-border">
                        <Plus className="w-5 h-5 text-muted-foreground whitespace-nowrap" />
                      </div>
                    </motion.button>
                    <h1 className="ml-2">Add Attachment</h1>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    type="button"
                    onClick={
                      (isLoading || localIsLoading || isGenerating) && !isStopping
                        ? handleStopGenerating
                        : handleLocalSubmit
                    }
                    disabled={
                      (!isLoading &&
                        !localIsLoading &&
                        !isGenerating &&
                        !isStopping &&
                        !input.trim() &&
                        images.length === 0 &&
                        attachments.length === 0) 
                     
                    }
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      (isLoading || localIsLoading || isGenerating) && !isStopping
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-white from-[#FFD700] to-[#780991]"
                    } text-white`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={
                      isLoading || localIsLoading || isGenerating || isStopping
                        ? { scale: [1, 0.95, 1] }
                        : {}
                    }
                    transition={
                      isLoading || localIsLoading || isGenerating || isStopping
                        ? {
                            repeat: Number.POSITIVE_INFINITY,
                            duration: 1.5,
                          }
                        : {}
                    }
                  >
                    {(isLoading || localIsLoading || isGenerating) && !isStopping ? (
                      <X className="w-5 h-5 text-white" />
                    ) : isGenerating ? (
                      <StopCircle className="text-red-800"/>
                    ) : (
                      <Image
                        src={arrow || "/placeholder.svg"}
                        alt=""
                        className="h-[22px] w-[22px]"
                      />
                    )}
                  </motion.button>
                </div>
              </div>

              <AnimatePresence>
                {isModalOpen && (
                  <motion.div
                    className="fixed inset-0 z-50 flex bottom-16 left-[-80px] items-end justify-center md:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      ref={modalRef}
                      className="w-full p-4 max-w-[270px] bg-card rounded-xl border-[2px] border-border"
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 300,
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">Add to your message</h3>
                        <motion.button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="p-1 border-2 rounded-full hover:bg-muted border-border"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="w-5 h-5" />
                        </motion.button>
                      </div>

                      <div className="grid gap-1">
                        <motion.button
                          type="button"
                          disabled={isLoading || localIsLoading}
                          onClick={() => {
                            imageInputRef.current?.click();
                            setIsModalOpen(false);
                          }}
                          className="flex items-center w-full gap-3 p-3 transition-colors rounded-md hover:bg-muted"
                          whileHover={{
                            backgroundColor: "rgba(255,255,255,0.1)",
                          }}
                        >
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                          <span className="text-foreground">Upload Image</span>
                        </motion.button>
                        <div className="w-full border-b-2 border-border"></div>
                        <motion.button
                          type="button"
                          disabled={isLoading || localIsLoading}
                          onClick={() => {
                            attachmentInputRef.current?.click();
                            setIsModalOpen(false);
                          }}
                          className="flex items-center w-full gap-3 p-3 transition-colors rounded-md hover:bg-muted"
                          whileHover={{
                            backgroundColor: "rgba(255,255,255,0.1)",
                          }}
                        >
                          <PaperclipIcon className="w-5 h-5 text-muted-foreground" />
                          <span className="text-foreground">
                            Attach Document
                          </span>
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Optimize comparison function
  return (
    prevProps.input === nextProps.input &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.activeSession === nextProps.activeSession &&
    prevProps.isAuthenticated === nextProps.isAuthenticated &&
    prevProps.sidebarCollapsed === nextProps.sidebarCollapsed &&
    prevProps.handleSubmit === nextProps.handleSubmit &&
    prevProps.handleStop === nextProps.handleStop
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;