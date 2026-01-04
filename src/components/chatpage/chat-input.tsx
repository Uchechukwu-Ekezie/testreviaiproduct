"use client";

import React, { useRef, useState, useEffect } from "react";
import { PaperclipIcon, ImageIcon, X, Plus, MapPin } from "lucide-react";
import Image from "next/image";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import arrow from "../../../public/Image/arrow-up.svg";
import { motion, AnimatePresence } from "framer-motion";
import {
  getUserLocation,
  checkLocationPermission,
  interpretAccuracy,
  reverseGeocodeLocation,
  formatCoordinates,
  type GeolocationResult,
  type GeolocationError,
} from "@/utils/geolocation";
import type { ChatSubmitOptions, ChatSubmitLocation } from "@/types/chat";

// Constants for better maintainability
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_TEXTAREA_HEIGHT = 180; // pixels
const MAX_TEXTAREA_HEIGHT_MOBILE = 96; // pixels (24 * 4)
const MAX_TEXTAREA_HEIGHT_DESKTOP = 128; // pixels (32 * 4)
const KEYBOARD_SCROLL_DELAY = 300; // milliseconds

interface ChatInputProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (e: React.FormEvent, options?: ChatSubmitOptions) => void;
  isLoading: boolean;
  isMobile: boolean;
  activeSession?: string | null;
  user?: { id: string } | null;
  isAuthenticated?: boolean;
  sidebarCollapsed: boolean;
  handleStop?: () => void;
  onLocationUpdate?: (
    location: ChatSubmitLocation | null,
    label?: string
  ) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatInput: React.FC<ChatInputProps> = React.memo(
  ({
    input,
    setInput,
    handleSubmit,
    isLoading,
    isMobile,
    sidebarCollapsed,
    handleStop,
    onLocationUpdate,
    isCollapsed = false,
    setIsCollapsed,
  }) => {
    // Memoize refs to prevent re-renders
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const addButtonRef = useRef<HTMLButtonElement>(null); // Add button ref
    const abortControllerRef = useRef<AbortController | null>(null);
    const isStreamingRef = useRef(false);

    // State for file handling
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]); // Store Cloudinary URLs
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [uploadingImages, setUploadingImages] = useState<boolean[]>([]);

    // State for geolocation
    const [useLocation, setUseLocation] = useState(false);
    const [locationStatus, setLocationStatus] = useState<
      "idle" | "checking" | "granted" | "denied"
    >("idle");
    const [currentLocation, setCurrentLocation] =
      useState<GeolocationResult | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [locationLabel, setLocationLabel] = useState<string | null>(null);
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [userDisabledLocation, setUserDisabledLocation] = useState(false);
    const [autoLocateAttempted, setAutoLocateAttempted] = useState(false);
    const reverseGeocodeCacheRef = useRef<Record<string, string>>({});

    // Check location permission on mount
    useEffect(() => {
      if (useLocation && locationStatus === "idle") {
        setLocationStatus("checking");
        checkLocationPermission().then((permission) => {
          if (permission === "granted") {
            setLocationStatus("granted");
            // Automatically get location if permission already granted
            getUserLocation()
              .then((loc) => {
                setCurrentLocation(loc);
                setLocationError(null);
              })
              .catch((error: GeolocationError) => {
                setLocationError(error.message);
                setLocationStatus("denied");
              });
          } else if (permission === "denied") {
            setLocationStatus("denied");
            setLocationError("Location access was previously denied");
          } else {
            setLocationStatus("idle");
          }
        });
      }
    }, [useLocation, locationStatus]);

    // Reverse geocode when coordinates are available
    useEffect(() => {
      if (!useLocation || !currentLocation) {
        setLocationLabel(null);
        setIsReverseGeocoding(false);
        onLocationUpdate?.(null, undefined);
        return;
      }

      const cacheKey = `${currentLocation.latitude.toFixed(
        4
      )}-${currentLocation.longitude.toFixed(4)}`;
      const cachedLabel = reverseGeocodeCacheRef.current[cacheKey];

      if (cachedLabel) {
        setLocationLabel(cachedLabel);
        return;
      }

      let isCancelled = false;

      const fetchLocationLabel = async () => {
        setIsReverseGeocoding(true);
        try {
          const label = await reverseGeocodeLocation(
            currentLocation.latitude,
            currentLocation.longitude
          );

          if (isCancelled) {
            return;
          }

          reverseGeocodeCacheRef.current[cacheKey] = label;
          setLocationLabel(label);
          setLocationError(null);
        } catch (error) {
          console.error("❌ Reverse geocoding failed:", error);
          if (!isCancelled) {
            setLocationLabel(null);
            setLocationError("Unable to determine precise location");
          }
        } finally {
          if (!isCancelled) {
            setIsReverseGeocoding(false);
          }
        }
      };

      fetchLocationLabel();

      return () => {
        isCancelled = true;
      };
    }, [
      useLocation,
      currentLocation,
      reverseGeocodeLocation,
      onLocationUpdate,
    ]);

    useEffect(() => {
      if (useLocation && currentLocation) {
        const resolvedLabel =
          locationLabel ??
          formatCoordinates(
            currentLocation.latitude,
            currentLocation.longitude
          );

        onLocationUpdate?.(
          {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            label: resolvedLabel,
          },
          resolvedLabel
        );
      } else {
        onLocationUpdate?.(null, undefined);
      }
    }, [useLocation, currentLocation, locationLabel, onLocationUpdate]);

    const requestLocation = React.useCallback(
      async (options?: { showToast?: boolean }) => {
        const showToast = options?.showToast ?? false;
        setLocationStatus("checking");
        try {
          const permission = await checkLocationPermission();
          if (permission === "denied") {
            setUseLocation(false);
            setCurrentLocation(null);
            setLocationStatus("denied");
            setLocationError("Location access was previously denied");
            return false;
          }

          const loc = await getUserLocation({
            enableHighAccuracy: false,
            timeout: 7000,
            maximumAge: 300000,
          });

          setUseLocation(true);
          setCurrentLocation(loc);
          setLocationError(null);
          setLocationStatus("granted");
          setUserDisabledLocation(false);

          const label = formatCoordinates(loc.latitude, loc.longitude);
          setLocationLabel(label);

          if (showToast) {
            const accuracy = interpretAccuracy(loc.accuracy);
            toast({
              title: "📍 Location Enabled",
              description: `Using your location (${accuracy.label}) for better results`,
            });
          }

          return true;
        } catch (error) {
          const err = error as GeolocationError;
          console.error("Location detection failed:", err);
          setUseLocation(false);
          setCurrentLocation(null);
          setLocationStatus("denied");
          setLocationError(err.message);

          if (showToast) {
            toast({
              title: "Location Access Denied",
              description: err.message,
              variant: "destructive",
            });
          }

          return false;
        }
      },
      [toast]
    );

    const disableLocation = React.useCallback(() => {
      setUserDisabledLocation(true);
      setAutoLocateAttempted(true);
      setUseLocation(false);
      setCurrentLocation(null);
      setLocationStatus("idle");
      setLocationError(null);
      setLocationLabel(null);
      onLocationUpdate?.(null, undefined);
      toast({
        title: "Location Disabled",
        description: "Location sharing has been turned off.",
      });
    }, [onLocationUpdate, toast]);

    const enableLocation = React.useCallback(async () => {
      setUserDisabledLocation(false);
      const success = await requestLocation({ showToast: true });
      if (!success) {
        setUserDisabledLocation(true);
      }
      setAutoLocateAttempted(true);
    }, [requestLocation]);

    // Automatically attempt to detect user location on mount
    useEffect(() => {
      if (autoLocateAttempted || userDisabledLocation) {
        return;
      }

      let isCancelled = false;

      const attemptAutoLocate = async () => {
        await requestLocation();
        if (!isCancelled) {
          setAutoLocateAttempted(true);
        }
      };

      attemptAutoLocate();

      return () => {
        isCancelled = true;
      };
    }, [autoLocateAttempted, userDisabledLocation, requestLocation]);

    // Memoized Cloudinary upload method for better performance
    const uploadToCloudinary = React.useCallback(
      async (file: File): Promise<string> => {
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
      },
      []
    );

    // Memoize handlers
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${Math.min(
            textareaRef.current.scrollHeight,
            MAX_TEXTAREA_HEIGHT
          )}px`;
        }
      },
      [setInput]
    );

    const handleLocalSubmit = React.useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();

        // Quick validation - return early if no input and no files
        if (!input.trim() && images.length === 0 && attachments.length === 0) {
          return;
        }

        // Check if any images are still uploading
        const hasUploadingImages = uploadingImages.some(
          (uploading) => uploading
        );

        if (hasUploadingImages) {
          toast({
            title: "Please wait",
            description: "Images are still uploading. Please wait a moment.",
            variant: "default",
          });
          return;
        }

        if (!handleSubmit) {
          toast({
            title: "No handler",
            description: "No submit handler provided.",
            variant: "destructive",
          });
          return;
        }

        // Prepare options object efficiently
        const options: ChatSubmitOptions = {};

        if (imageUrls.length > 0) {
          options.imageUrls = imageUrls;
        }

        if (attachments.length > 0) {
          options.file = attachments[0];
        }

        // Add location if user has enabled it and we have coordinates
        if (useLocation && currentLocation) {
          console.log("📍 ChatInput: Adding location to submission:", {
            ...currentLocation,
            label: locationLabel,
          });
          const resolvedLabel =
            locationLabel ??
            formatCoordinates(
              currentLocation.latitude,
              currentLocation.longitude
            );
          const locationPayload: ChatSubmitLocation = {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            label: resolvedLabel,
          };
          options.location = resolvedLabel;
          options.locationDetails = locationPayload;
          options.userLatitude = currentLocation.latitude;
          options.userLongitude = currentLocation.longitude;
          options.locationLabel = resolvedLabel;
        } else {
          console.log(
            "⚠️ ChatInput: Location not added - useLocation:",
            useLocation,
            "currentLocation:",
            currentLocation
          );
        }

        // Basic file validation
        if (options.file && !(options.file instanceof File)) {
          toast({
            title: "File Upload Error",
            description:
              "File was corrupted during processing. Please try uploading again.",
            variant: "destructive",
          });
          return;
        }

        try {
          // Call handleSubmit immediately - don't await to reduce perceived latency
          console.log(
            "📨 ChatInput: Calling handleSubmit with options:",
            options
          );
          handleSubmit(
            e,
            Object.keys(options).length > 0 ? options : undefined
          );

          // Clear local state immediately for better UX
          setImages([]);
          setImagePreviews((prev) => {
            prev.forEach((url) => URL.revokeObjectURL(url));
            return [];
          });
          setImageUrls([]);
          setUploadingImages([]);
          setAttachments([]);
        } catch (error) {
          console.error("ChatInput: Error during submission:", error);
        }
      },
      [
        handleSubmit,
        input,
        images,
        attachments,
        uploadingImages,
        imageUrls,
        useLocation,
        currentLocation,
        locationLabel,
      ]
    );

    const handleStopGenerating = React.useCallback(() => {
      setIsStopping(true);
      isStreamingRef.current = false;
      abortControllerRef.current?.abort();
      handleStop?.();
    }, [handleStop]);

    // Close modal when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          isModalOpen &&
          modalRef.current &&
          !modalRef.current.contains(event.target as Node) &&
          addButtonRef.current &&
          !addButtonRef.current.contains(event.target as Node)
        ) {
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

    // Optimized auto-resize function with memoization
    const autoResize = React.useCallback(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(
          textareaRef.current.scrollHeight,
          MAX_TEXTAREA_HEIGHT
        )}px`;
      }
    }, []);

    // Auto-resize textarea with debouncing
    useEffect(() => {
      const timer = setTimeout(() => {
        autoResize();
      }, 10); // Small delay to prevent excessive calls

      return () => clearTimeout(timer);
    }, [input, autoResize]);

    // Optimized image upload handler with parallel uploads and better state management
    const handleImageUpload = React.useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const selectedImages = Array.from(e.target.files);

        // Optimized validation with early returns
        const validImages = selectedImages.filter((file) => {
          if (!file.type.startsWith("image/")) {
            toast({
              title: "Invalid file type",
              description: `${file.name} is not a valid image file.`,
              variant: "destructive",
            });
            return false;
          }

          if (file.size > MAX_IMAGE_SIZE) {
            toast({
              title: "File too large",
              description: `${file.name} exceeds the ${MAX_IMAGE_SIZE / (1024 * 1024)}MB limit.`,
              variant: "destructive",
            });
            return false;
          }

          return true;
        });

        if (validImages.length === 0) return;

        // Batch state updates to reduce re-renders
        const newImagePreviews = validImages.map((file) =>
          URL.createObjectURL(file)
        );
        const startIndex = images.length;

        // Single state update for all new images
        setImages((prev) => [...prev, ...validImages]);
        setImagePreviews((prev) => [...prev, ...newImagePreviews]);
        setUploadingImages((prev) => [...prev, ...validImages.map(() => true)]);

        // Show upload start notification
        toast({
          title: "Uploading images",
          description: `Uploading ${validImages.length} image(s) to cloud storage...`,
        });

        // Parallel uploads for better performance
        const uploadPromises = validImages.map(async (file, i) => {
          const imageIndex = startIndex + i;
          try {
            const url = await uploadToCloudinary(file);
            if (url) {
              setImageUrls((prev) => {
                const newUrls = [...prev];
                newUrls[imageIndex] = url;
                return newUrls;
              });
              return { success: true, name: file.name };
            }
          } catch (error) {
            console.error("Error uploading image:", error);
            return { success: false, name: file.name, error };
          } finally {
            setUploadingImages((prev) => {
              const newState = [...prev];
              newState[imageIndex] = false;
              return newState;
            });
          }
        });

        // Wait for all uploads to complete
        const results = await Promise.allSettled(uploadPromises);

        // Show summary toast
        const successful = results.filter(
          (r) => r.status === "fulfilled" && r.value?.success
        ).length;
        const failed = results.length - successful;

        if (successful > 0) {
          toast({
            title: "Upload complete",
            description: `${successful} image(s) uploaded successfully${
              failed > 0 ? `, ${failed} failed` : ""
            }.`,
          });
        }
      },
      [images.length, uploadToCloudinary]
    );

    // Optimized attachment upload handler with memoized validation
    const handleAttachmentUpload = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const selectedFiles = Array.from(e.target.files);

        // Memoized file type validation
        const allowedTypes = new Set([
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
          "text/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ]);

        // Optimized validation with early returns
        const validFiles = selectedFiles.filter((file) => {
          if (!allowedTypes.has(file.type)) {
            toast({
              title: "Invalid file type",
              description: `${file.name} is not a supported document type.`,
              variant: "destructive",
            });
            return false;
          }

          if (file.size > MAX_ATTACHMENT_SIZE) {
            toast({
              title: "File too large",
              description: `${file.name} exceeds the ${MAX_ATTACHMENT_SIZE / (1024 * 1024)}MB limit.`,
              variant: "destructive",
            });
            return false;
          }

          return true;
        });

        if (validFiles.length === 0) return;

        // Single state update
        setAttachments((prev) => [...prev, ...validFiles]);

        toast({
          title: "Files attached",
          description: `${validFiles.length} file(s) attached successfully.`,
        });
      },
      []
    );

    // Optimized remove functions with proper cleanup
    const removeImage = React.useCallback(
      (index: number) => {
        // Clean up object URL to prevent memory leaks
        if (imagePreviews[index]) {
          URL.revokeObjectURL(imagePreviews[index]);
        }

        // Batch state updates to reduce re-renders
        setImages((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
        setImageUrls((prev) => prev.filter((_, i) => i !== index));
        setUploadingImages((prev) => prev.filter((_, i) => i !== index));
      },
      [imagePreviews]
    );

    const removeAttachment = React.useCallback((index: number) => {
      setAttachments((prev) => prev.filter((_, i) => i !== index));
    }, []);

    // Cleanup effect to prevent memory leaks
    useEffect(() => {
      return () => {
        // Clean up all object URLs on unmount
        imagePreviews.forEach((url) => {
          if (url) URL.revokeObjectURL(url);
        });
      };
    }, [imagePreviews]);

    // If collapsed, show floating button
    if (isCollapsed && setIsCollapsed) {
      return (
      <motion.div
        className="fixed bottom-6 left-6 z-40 pointer-events-auto"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
          <motion.button
            onClick={() => setIsCollapsed(false)}
            className={cn(
              "relative flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all group overflow-hidden bg-black border-2 border-[#F5B041]",
              isMobile ? "w-10 h-10" : "w-12 h-12"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            title="Ask ReviAI anything about real estate"
          >
            {/* ReviAI logo icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className={cn(
                  "text-[#F5B041]",
                  isMobile ? "w-5 h-5" : "w-6 h-6"
                )}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Modern house/property icon representing ReviAI */}
                <path
                  d="M3 12L12 3L21 12V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:scale-105 transition-transform origin-center"
                />
                <path
                  d="M9 21V12H15V21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* AI brain pattern */}
                <circle
                  cx="12"
                  cy="8.5"
                  r="1"
                  fill="currentColor"
                  className="opacity-80"
                />
                <circle
                  cx="10"
                  cy="10"
                  r="0.5"
                  fill="currentColor"
                  className="opacity-60"
                />
                <circle
                  cx="14"
                  cy="10"
                  r="0.5"
                  fill="currentColor"
                  className="opacity-60"
                />
              </svg>
            </div>

            {/* Subtle glow effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.button>
        </motion.div>
      );
    }

    return (
      <div
        className="w-full fixed bottom-0 left-0 right-0 z-40 border-border pointer-events-none bg-transparent"
        style={{
          paddingLeft: isMobile ? 0 : sidebarCollapsed ? "4rem" : "16rem",
          paddingRight: isMobile ? 0 : "14px",
          paddingBottom: isMobile
            ? "max(env(safe-area-inset-bottom), 8px)"
            : "env(safe-area-inset-bottom)", // Better mobile support
        }}
      >
        <div className="flex justify-center w-full pointer-events-auto">
          <div
            className={cn(
              "w-full mx-auto",
              isMobile ? "p-3 px-4" : "p-2 md:p-4 md:max-w-[880px]"
            )}
          >
            {/* Upload Status Indicator - Shared for both mobile and desktop */}
            <AnimatePresence>
              {uploadingImages.some((uploading) => uploading) && (
                <motion.div
                  className="flex items-center gap-2 p-2 mb-2 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800"
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

            {/* Uploaded Images - Shared for both mobile and desktop */}
            <AnimatePresence>
              {images.length > 0 && (
                <motion.div
                  className="flex flex-wrap gap-2 mb-2"
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
                          src={
                            imagePreviews[index] ||
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23ddd'/%3E%3C/svg%3E"
                          }
                          alt="preview"
                          width={64}
                          height={64}
                          className={`object-cover w-16 h-16 rounded-md ${
                            uploadingImages[index] ? "opacity-50" : ""
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
                            <svg
                              className="w-2 h-2 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              ></path>
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
                          <span className="text-xs text-blue-500">
                            Uploading...
                          </span>
                        )}
                        {imageUrls[index] && !uploadingImages[index] && (
                          <span className="text-xs text-green-500">
                            Uploaded
                          </span>
                        )}
                      </div>
                      <motion.button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={uploadingImages[index]}
                        className={`absolute top-0 right-0 p-1 rounded-full ${
                          uploadingImages[index]
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                        whileHover={{
                          scale: uploadingImages[index] ? 1 : 1.1,
                        }}
                        whileTap={{
                          scale: uploadingImages[index] ? 1 : 0.9,
                        }}
                      >
                        <X className="w-4 h-4 text-white" />
                      </motion.button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Uploaded Attachments - Shared for both mobile and desktop */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  className="flex flex-wrap gap-2 mb-2"
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
                        <div className="flex flex-col">
                          <span className="text-sm truncate max-w-[150px]">
                            {file.name}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{(file.size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>{file.type || "Unknown type"}</span>
                          </div>
                        </div>
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

            {/* Hidden file inputs - Shared for both mobile and desktop */}
            <input
              type="file"
              multiple
              ref={imageInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
              style={{ display: 'none' }}
            />

            <input
              type="file"
              multiple
              ref={attachmentInputRef}
              onChange={handleAttachmentUpload}
              accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              style={{ display: 'none' }}
            />

            {/* Layout - Mobile has + button inside, Desktop has + button outside */}
            <div
              className={cn(
                "relative flex items-center",
                isMobile ? "gap-3" : "gap-2"
              )}
            >
              {/* Minimize Button - Available on both mobile and desktop */}
              {setIsCollapsed && (
                <motion.button
                  type="button"
                  onClick={() => setIsCollapsed(true)}
                  className={cn(
                    "flex items-center justify-center flex-shrink-0 border-2 rounded-full hover:bg-muted border-border bg-transparent touch-manipulation",
                    isMobile ? "w-8 h-8" : "w-12 h-12 mb-1"
                  )}
                  whileHover={{ scale: isMobile ? 1.05 : 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Minimize chat input"
                >
                  <X
                    className={cn(
                      "text-muted-foreground",
                      isMobile ? "w-3.5 h-3.5" : "w-5 h-5"
                    )}
                  />
                </motion.button>
              )}

              {/* Add Button - Outside the border (Desktop only) */}
              {!isMobile && (
                <motion.button
                  ref={addButtonRef}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                  }}
                  className={cn(
                    "flex items-center justify-center flex-shrink-0 border-2 rounded-full hover:bg-muted border-border bg-transparent touch-manipulation",
                    "w-12 h-12 mb-1"
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Plus className="text-muted-foreground w-6 h-6" />
                </motion.button>
              )}

              {/* Desktop Popover Menu - appears above add button */}
              <AnimatePresence>
                {isModalOpen && (
                  <motion.div
                    ref={modalRef}
                    className="absolute left-0 bottom-full mb-2 z-50 w-[200px] p-2 bg-card rounded-lg border-2 border-border shadow-2xl hidden md:block"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      damping: 20,
                      stiffness: 300,
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <motion.button
                        type="button"
                        disabled={isLoading}
                        onClick={() => {
                          imageInputRef.current?.click();
                          setIsModalOpen(false);
                        }}
                        className="flex items-center w-full gap-2 px-3 py-2 text-sm transition-colors rounded-md hover:bg-muted disabled:opacity-50"
                        whileHover={{ x: 2 }}
                      >
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">Upload Image</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        disabled={isLoading}
                        onClick={() => {
                          attachmentInputRef.current?.click();
                          setIsModalOpen(false);
                        }}
                        className="flex items-center w-full gap-2 px-3 py-2 text-sm transition-colors rounded-md hover:bg-muted disabled:opacity-50"
                        whileHover={{ x: 2 }}
                      >
                        <PaperclipIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">Attach File</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input div with border */}
              <div
                className={cn(
                  "flex-1 border rounded-[15px] border-border bg-[#1A1A1A]",
                  isMobile ? "p-3" : "p-2"
                )}
              >
                <form
                  onSubmit={handleLocalSubmit}
                  className={cn(
                    "flex items-center",
                    isMobile ? "gap-2" : "gap-2"
                  )}
                >
                  {/* Add Button - Inside the border (Mobile only) */}
                  {isMobile && (
                    <motion.button
                      ref={addButtonRef}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsModalOpen(true);
                      }}
                      className={cn(
                        "flex items-center justify-center flex-shrink-0 rounded-full hover:bg-muted bg-transparent touch-manipulation",
                        "w-8 h-8"
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Plus className="text-muted-foreground w-4 h-4" />
                    </motion.button>
                  )}

                  {/* Input Field */}
                  <div className="flex-1">
                    <textarea
                      ref={textareaRef}
                      placeholder={
                        isMobile
                          ? "Ask me anything..."
                          : "Ask me anything about real estate..."
                      }
                      value={input}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleLocalSubmit(e);
                        }
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                      }}
                      onFocus={(e) => {
                        // Better mobile keyboard handling
                        if (isMobile) {
                          setTimeout(() => {
                            e.target.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }, KEYBOARD_SCROLL_DELAY);
                        }
                      }}
                      disabled={isLoading}
                      rows={1}
                      inputMode="text"
                      autoComplete="off"
                      autoCapitalize="sentences"
                      aria-label="Chat input"
                      aria-describedby="chat-input-description"
                      className={cn(
                        "w-full overflow-y-auto bg-transparent resize-none text-foreground placeholder:text-muted-foreground focus:outline-none touch-manipulation",
                        isMobile ? "p-1 text-base max-h-24" : "p-2 max-h-32"
                      )}
                    />
                    <span id="chat-input-description" className="sr-only">
                      Type your message and press Enter to send, or Shift+Enter for a new line
                    </span>
                  </div>

                  {/* Send Button - Inside the border */}
                  <motion.button
                    type="submit"
                    disabled={
                      (!isLoading &&
                        !isStopping &&
                        !input.trim() &&
                        images.length === 0 &&
                        attachments.length === 0) ||
                      uploadingImages.some((uploading) => uploading)
                    }
                    aria-label={
                      isLoading && !isStopping
                        ? "Stop generating response"
                        : uploadingImages.some((uploading) => uploading)
                        ? "Uploading images, please wait"
                        : "Send message"
                    }
                    className={cn(
                      "flex items-center justify-center flex-shrink-0 rounded-full transition-colors touch-manipulation",
                      isMobile ? "w-9 h-9" : "w-10 h-10",
                      isLoading && !isStopping
                        ? "bg-red-500 hover:bg-red-600"
                        : uploadingImages.some((uploading) => uploading)
                        ? "bg-yellow-500 cursor-not-allowed"
                        : "bg-white hover:bg-white",
                      "disabled:opacity-50"
                    )}
                    whileHover={{
                      scale: uploadingImages.some((uploading) => uploading)
                        ? 1
                        : isMobile
                        ? 1.03
                        : 1.05,
                    }}
                    whileTap={{
                      scale: uploadingImages.some((uploading) => uploading)
                        ? 1
                        : 0.95,
                    }}
                    onClick={(e) => {
                      if (isLoading && !isStopping) {
                        e.preventDefault();
                        handleStopGenerating();
                      }
                    }}
                  >
                    {isLoading && !isStopping ? (
                      <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                    ) : (
                      <Image src={arrow} alt="Send" width={20} height={20} />
                    )}
                  </motion.button>
                </form>

                {/* Location Status Indicator */}
                <div className="px-2 pb-2">
                  {useLocation ? (
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {isReverseGeocoding
                            ? "Determining your precise location..."
                            : locationLabel ||
                              (currentLocation
                                ? formatCoordinates(
                                    currentLocation.latitude,
                                    currentLocation.longitude
                                  )
                                : "Awaiting coordinates")}
                        </span>
                      </div>
                      <motion.button
                        type="button"
                        onClick={disableLocation}
                        className="flex items-center justify-center w-7 h-7 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
                        title="Disable location sharing"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.94 }}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {locationStatus === "checking"
                            ? "Detecting your location..."
                            : "Location sharing is off"}
                        </span>
                      </div>
                      <motion.button
                        type="button"
                        onClick={enableLocation}
                        disabled={locationStatus === "checking"}
                        className={cn(
                          "flex items-center justify-center w-7 h-7 rounded-full",
                          locationStatus === "checking"
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                        title="Enable location sharing"
                        whileHover={{
                          scale: locationStatus === "checking" ? 1 : 1.08,
                        }}
                        whileTap={{
                          scale: locationStatus === "checking" ? 1 : 0.94,
                        }}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  )}
                  {locationError && (
                    <p className="mt-1 text-xs text-destructive">
                      {locationError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Modal - Bottom sheet style */}
        <AnimatePresence>
          {isModalOpen && (
            <>
              {/* Backdrop - Mobile only */}
              <motion.div
                className="fixed inset-0 z-[100] bg-black/50 md:hidden pointer-events-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                onTouchStart={(e) => e.stopPropagation()}
              />
              {/* Modal Content - Slides up from bottom - Mobile only */}
              <motion.div
                className="fixed bottom-0 left-0 right-0 z-[101] w-full bg-card rounded-t-3xl border-t-[2px] border-border shadow-2xl md:hidden pointer-events-auto"
                style={{
                  paddingLeft: "1.5rem",
                  paddingRight: "1.5rem",
                  paddingTop: "1.5rem",
                  paddingBottom: "max(env(safe-area-inset-bottom), 2rem)",
                }}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{
                  type: "spring",
                  damping: 30,
                  stiffness: 300,
                }}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
              >
                {/* Handle bar */}
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
                </div>

                <div 
                  className="flex items-center justify-between mb-6"
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-medium">Add to your message</h3>
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsModalOpen(false);
                    }}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="p-2 border-2 rounded-full hover:bg-muted border-border touch-manipulation active:bg-muted"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                <div 
                  className="grid gap-2"
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <label
                    htmlFor="mobile-image-input"
                    className="flex items-center w-full gap-4 p-4 transition-colors rounded-xl hover:bg-muted disabled:opacity-50 touch-manipulation min-h-[56px] active:bg-muted cursor-pointer"
                  >
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    <span className="text-base text-foreground">
                      Upload Image
                    </span>
                    <input
                      id="mobile-image-input"
                      type="file"
                      multiple
                      ref={imageInputRef}
                      onChange={(e) => {
                        handleImageUpload(e);
                        setIsModalOpen(false);
                      }}
                      accept="image/*"
                      className="hidden"
                      style={{ display: 'none' }}
                    />
                  </label>
                  <div className="w-full border-b border-border opacity-50"></div>
                  <label
                    htmlFor="mobile-attachment-input"
                    className="flex items-center w-full gap-4 p-4 transition-colors rounded-xl hover:bg-muted disabled:opacity-50 touch-manipulation min-h-[56px] active:bg-muted cursor-pointer"
                  >
                    <PaperclipIcon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">Attach Document</span>
                    <input
                      id="mobile-attachment-input"
                      type="file"
                      multiple
                      ref={attachmentInputRef}
                      onChange={(e) => {
                        handleAttachmentUpload(e);
                        setIsModalOpen(false);
                      }}
                      accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      className="hidden"
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  },
  // Custom comparison function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    return (
      prevProps.input === nextProps.input &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.isMobile === nextProps.isMobile &&
      prevProps.sidebarCollapsed === nextProps.sidebarCollapsed &&
      prevProps.handleSubmit === nextProps.handleSubmit &&
      prevProps.setInput === nextProps.setInput &&
      prevProps.handleStop === nextProps.handleStop &&
      prevProps.onLocationUpdate === nextProps.onLocationUpdate &&
      prevProps.isCollapsed === nextProps.isCollapsed &&
      prevProps.setIsCollapsed === nextProps.setIsCollapsed
    );
  }
);

ChatInput.displayName = "ChatInput";

export default ChatInput;
