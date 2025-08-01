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
  handleSubmit: (e: React.FormEvent, options?: { imageUrls?: string[]; file?: File }) => void;
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

  // State for file handling
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]); // Store Cloudinary URLs
  const [attachments, setAttachments] = useState<File[]>([]);
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<boolean[]>([]);

  // Direct Cloudinary upload method for chat images (using your existing setup)
  const uploadToCloudinary = async (file: File): Promise<string> => {
    try {
      // Create a FormData object for Cloudinary upload
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append("file", file);

      // For unsigned uploads, an upload preset is REQUIRED
      const uploadPreset =
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_TWO || "reviews";
      cloudinaryFormData.append("upload_preset", uploadPreset);

      // Add folder parameter for organization (allowed in unsigned uploads)
      cloudinaryFormData.append("folder", "chat_images");

      // Make sure the cloud name is defined
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        throw new Error("Cloudinary cloud name is not defined");
      }

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const response = await fetch(cloudinaryUrl, {
        method: "POST",
        body: cloudinaryFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || "Failed to upload to Cloudinary"
        );
      }

      const data = await response.json();

      // Use the URL from Cloudinary directly - no transformations
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  };

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

  const handleLocalSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if any images are still uploading
    const hasUploadingImages = uploadingImages.some(uploading => uploading);
    
    if (hasUploadingImages) {
      toast({
        title: "Please wait",
        description: "Images are still uploading. Please wait a moment.",
        variant: "default",
      });
      return;
    }

    if (handleSubmit) {
      // Prepare options object with both imageUrls and file
      const options: { imageUrls?: string[]; file?: File } = {};
      
      if (imageUrls.length > 0) {
        options.imageUrls = imageUrls;
      }
      
      if (attachments.length > 0) {
        options.file = attachments[0]; // Pass the first attachment as File object
      }
      
      // Pass to parent handler with both imageUrls and file
      handleSubmit(e, Object.keys(options).length > 0 ? options : undefined);
      
      // Clear everything after submission
      setInput("");
      setImages([]);
      setImagePreviews(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return [];
      });
      setImageUrls([]);
      setUploadingImages([]);
      setAttachments([]);
      return;
    }

    // Handle submission if no input and no files
    if (!input.trim() && images.length === 0 && attachments.length === 0) return;

    // Simple fallback if no external handler
    toast({
      title: "No handler",
      description: "No submit handler provided.",
      variant: "destructive",
    });
  }, [handleSubmit, setInput, input, images, attachments, uploadingImages, imageUrls]);

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

  // Enhanced image upload handler using your Cloudinary setup
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedImages = Array.from(e.target.files);
      
      // Validate image files
      const validImages = selectedImages.filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
        
        if (!isValidType) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a valid image file.`,
            variant: "destructive",
          });
          return false;
        }
        
        if (!isValidSize) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the 10MB limit.`,
            variant: "destructive",
          });
          return false;
        }
        
        return true;
      });

      if (validImages.length === 0) return;

      // Create previews immediately
      const newImagePreviews = validImages.map((file) =>
        URL.createObjectURL(file)
      );
      
      setImages((prev) => [...prev, ...validImages]);
      setImagePreviews((prev) => [...prev, ...newImagePreviews]);
      setUploadingImages((prev) => [...prev, ...validImages.map(() => true)]);

      // Show upload start notification
      toast({
        title: "Uploading images",
        description: `Uploading ${validImages.length} image(s) to cloud storage...`,
      });

      // Upload each image to Cloudinary
      for (let i = 0; i < validImages.length; i++) {
        const imageIndex = images.length + i; // Calculate the correct index
        try {
          const url = await uploadToCloudinary(validImages[i]);
          if (url) {
            setImageUrls(prev => {
              const newUrls = [...prev];
              newUrls[imageIndex] = url;
              return newUrls;
            });
            
            toast({
              title: "Image uploaded",
              description: `${validImages[i].name} uploaded successfully.`,
            });
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${validImages[i].name}.`,
            variant: "destructive",
          });
        } finally {
          setUploadingImages(prev => {
            const newState = [...prev];
            newState[imageIndex] = false;
            return newState;
          });
        }
      }
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
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    setUploadingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Internal chat submission (when not using external handleSubmit)
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
    const userMessage = { 
      id: tempId, 
      prompt: currentMessage, 
      response: "", 
      isComplete: false,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined
      
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const messageOptions: {
        image_url?: string;
        file?: File;
        properties?: string;
        classification?: string;
      } = {};
      
      // Add image URLs as separate field (first image URL for now, can be extended for multiple)
      if (imageUrls.length > 0) {
        messageOptions.image_url = imageUrls[0]; // Send first image URL
        console.log("Chat Input: Adding image_url to messageOptions:", imageUrls[0]);
        // If multiple images, you might want to join them or send as array
        // messageOptions.image_url = imageUrls.join(','); // Alternative: comma-separated
      }
      
      // Add attachment file separately (not as JSON string)
      if (attachments.length > 0) {
        messageOptions.file = attachments[0]; // Send first attachment as file
        console.log("Chat Input: Adding file to messageOptions:", attachments[0].name, attachments[0]);
      }

      console.log("Chat Input: Final messageOptions:", messageOptions);

      let data;
      if (activeSession) {
        data = await chatAPI.postNewChat(currentMessage, activeSession, messageOptions);
      } else {
        const sessionData = {
          chat_title: currentMessage.substring(0, 30),
          user: user?.id || "guest",
        };
        const sessionResponse = await chatAPI.createChatSession(sessionData);
        setActiveSession(sessionResponse.id);
        data = await chatAPI.postNewChat(currentMessage, sessionResponse.id, messageOptions);

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
      
      // Clear files after successful submission
      setAttachments([]);
      setImages([]);
      setImagePreviews(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return [];
      });
      setImageUrls([]);
      setUploadingImages([]);
    } catch (error: unknown) {
      console.error("Error submitting chat:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as any).response?.data?.message || "Failed to send message."
        : "Failed to send message.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setInput(currentMessage); // Restore the input if failed
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

              {/* Upload Status Indicator */}
              <AnimatePresence>
                {uploadingImages.some(uploading => uploading) && (
                  <motion.div
                    className="flex items-center gap-2 p-2 mt-2 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-4 h-4 border-2 border-yellow-500 rounded-full border-t-transparent animate-spin"></div>
                    <span className="text-sm text-yellow-700 dark:text-yellow-300">
                      Uploading images to cloud storage...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

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
                        <div className="relative">
                          <Image
                            src={imagePreviews[index] || "/placeholder.svg"}
                            alt="preview"
                            width={64}
                            height={64}
                            className={`object-cover w-16 h-16 rounded-md ${
                              uploadingImages[index] ? 'opacity-50' : ''
                            }`}
                          />
                          {/* Upload progress indicator */}
                          {uploadingImages[index] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                              <div className="w-6 h-6 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                            </div>
                          )}
                          {/* Success indicator */}
                          {imageUrls[index] && !uploadingImages[index] && (
                            <div className="absolute flex items-center justify-center w-4 h-4 bg-green-500 rounded-full top-1 left-1">
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                            {image.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(image.size / 1024).toFixed(1)} KB
                          </span>
                          {uploadingImages[index] && (
                            <span className="text-xs text-blue-500">Uploading...</span>
                          )}
                          {imageUrls[index] && !uploadingImages[index] && (
                            <span className="text-xs text-green-500">Uploaded</span>
                          )}
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => removeImage(index)}
                          disabled={uploadingImages[index]}
                          className={`absolute top-0 right-0 p-1 rounded-full ${
                            uploadingImages[index] 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-red-500 hover:bg-red-600'
                          }`}
                          whileHover={{ scale: uploadingImages[index] ? 1 : 1.1 }}
                          whileTap={{ scale: uploadingImages[index] ? 1 : 0.9 }}
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
                      className="flex items-center gap-2 p-2 transition-colors rounded-md hover:bg-muted disabled:opacity-50"
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
                      className="flex items-center gap-2 p-2 transition-colors rounded-md hover:bg-muted disabled:opacity-50"
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
                        attachments.length === 0) || 
                      uploadingImages.some(uploading => uploading) // Disable if images are uploading
                    }
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      (isLoading || localIsLoading || isGenerating) && !isStopping
                        ? "bg-red-500 hover:bg-red-600"
                        : uploadingImages.some(uploading => uploading)
                        ? "bg-yellow-500 cursor-not-allowed"
                        : "bg-white from-[#FFD700] to-[#780991]"
                    } text-white`}
                    whileHover={{ 
                      scale: uploadingImages.some(uploading => uploading) ? 1 : 1.05 
                    }}
                    whileTap={{ 
                      scale: uploadingImages.some(uploading => uploading) ? 1 : 0.95 
                    }}
                    animate={
                      isLoading || localIsLoading || isGenerating || isStopping || uploadingImages.some(uploading => uploading)
                        ? { scale: [1, 0.95, 1] }
                        : {}
                    }
                    transition={
                      isLoading || localIsLoading || isGenerating || isStopping || uploadingImages.some(uploading => uploading)
                        ? {
                            repeat: Number.POSITIVE_INFINITY,
                            duration: 1.5,
                          }
                        : {}
                    }
                  >
                    {uploadingImages.some(uploading => uploading) ? (
                      <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                    ) : (isLoading || localIsLoading || isGenerating) && !isStopping ? (
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
                          className="flex items-center w-full gap-3 p-3 transition-colors rounded-md hover:bg-muted disabled:opacity-50"
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
                          className="flex items-center w-full gap-3 p-3 transition-colors rounded-md hover:bg-muted disabled:opacity-50"
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