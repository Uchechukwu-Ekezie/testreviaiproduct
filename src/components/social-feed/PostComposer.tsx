"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Image as ImageIcon,
  MapPin,
  Tag,
  Video,
  X,
  Smile,
  ChevronDown,
} from "lucide-react";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  getUserLocation,
  reverseGeocodeLocation,
  checkLocationPermission,
} from "@/utils/geolocation";

interface LocationData {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  location_label: string;
}

interface PostComposerProps {
  onCreatePost: (
    caption: string,
    imageUrls?: string[],
    videoUrl?: string | null,
    location?: LocationData
  ) => Promise<boolean>;
  isPosting?: boolean;
}

export default function PostComposer({
  onCreatePost,
  isPosting = false,
}: PostComposerProps) {
  const { user } = useAuth();
  const { uploadImage, uploadVideo, uploading } = useCloudinaryUpload();

  const [caption, setCaption] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt" | "unsupported" | null
  >(null);

  // Rotating placeholder text
  const placeholders = [
    "What's happening?!",
    "Tell your story",
    "Report your landlord",
    "Upload a real estate video",
  ];
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxSize = 10 * 1024 * 1024;
    const maxImages = 4;

    const newImages: File[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        toast.error(`Image ${file.name} is too large. Maximum size is 10MB`);
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image file`);
        return;
      }

      if (images.length + newImages.length >= maxImages) {
        toast.error(`You can only upload up to ${maxImages} images`);
        return;
      }

      newImages.push(file);
    });

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
      const previews = newImages.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...previews]);
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 100 * 1024 * 1024; // 100MB for video
    const file = files[0];

    if (file.size > maxSize) {
      toast.error(`Video is too large. Maximum size is 100MB`);
      return;
    }

    if (!file.type.startsWith("video/")) {
      toast.error(`Not a valid video file`);
      return;
    }

    if (video) {
      toast.error("You can only upload one video per post");
      return;
    }

    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));

    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideo(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!caption.trim() && images.length === 0 && !video) {
      toast.error("Please add some content to your post");
      return;
    }

    if (caption.length > 10000) {
      toast.error("Post content is too long (maximum 10,000 characters)");
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrls: string[] = [];
      let uploadedVideoUrl: string | null = null;

      if (images.length > 0) {
        uploadedImageUrls = await Promise.all(
          images.map(async (file) => {
            const url = await uploadImage(file);
            if (!url) throw new Error(`Failed to upload image: ${file.name}`);
            return url;
          })
        );
      }

      if (video) {
        uploadedVideoUrl = await uploadVideo(video);
        if (!uploadedVideoUrl) throw new Error(`Failed to upload video`);
      }

      const success = await onCreatePost(
        caption,
        uploadedImageUrls,
        uploadedVideoUrl,
        location || undefined
      );

      if (success) {
        toast.success("Post created successfully!");
        // Reset form
        setCaption("");
        setImages([]);
        setVideo(null);
        setImagePreviews([]);
        setVideoPreview(null);
        setIsExpanded(false);
        setLocation(null);
      } else {
        toast.error("Failed to create post. Please try again.");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check location permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const permission = await checkLocationPermission();
      setLocationPermission(permission);

      // Auto-capture location if already granted
      if (permission === "granted") {
        captureLocation();
      }
    };
    checkPermission();
  }, []);

  // Rotate placeholder text every 5 seconds (only when textarea is empty)
  useEffect(() => {
    if (caption.trim().length > 0) {
      setShowDropdown(false); // Close dropdown when typing
      return; // Don't rotate when user is typing
    }

    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [caption, placeholders.length]);

  // Don't auto-show dropdown - user must click button

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement)?.closest("[data-dropdown-button]")
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // Check if current placeholder should show dropdown
  const shouldShowDropdownOptions = () => {
    const currentPlaceholder = placeholders[currentPlaceholderIndex];
    return (
      currentPlaceholder === "Tell your story" ||
      currentPlaceholder === "Report your landlord"
    );
  };

  // Toggle dropdown button
  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown((prev) => !prev);
  };

  // Navigation handlers
  const handleTellYourStory = () => {
    setShowDropdown(false);
    router.push("/");
  };

  const handleReportLandlord = () => {
    setShowDropdown(false);
    router.push("/");
  };

  const captureLocation = async () => {
    try {
      const pos = await getUserLocation({
        enableHighAccuracy: false,
        timeout: 10000,
      });

      const locationString = await reverseGeocodeLocation(
        pos.latitude,
        pos.longitude
      );
      const parts = locationString.split(",").map((p) => p.trim());

      const locData: LocationData = {
        city: parts[0] || "",
        state: parts[1] || "",
        country: parts[2] || "",
        latitude: pos.latitude,
        longitude: pos.longitude,
        location_label: locationString,
      };

      setLocation(locData);
      setLocationPermission("granted");
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === "PERMISSION_DENIED") {
        setLocationPermission("denied");
      }
      console.error("Failed to capture location:", error);
    }
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [imagePreviews, videoPreview]);

  const userName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.username ||
      "User"
    : "User";
  const userAvatar = user?.avatar;
  const userInitial = user?.first_name?.[0] || user?.username?.[0] || "U";

  const isProcessing = isSubmitting || uploading || isPosting;
  const hasContent = caption.trim() || images.length > 0 || video;

  return (
    <div className="border border-gray-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 relative overflow-visible bg-transparent backdrop-blur-sm shadow-lg">
      {/* Avatar and Textarea Row */}
      <div className="flex gap-2 sm:gap-3 items-center relative ">
        {/* Avatar */}
        <div className="flex-shrink-0 pt-1">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-gray-700/50 ring-offset-2 ring-offset-gray-900/30"
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-base ring-2 ring-gray-700/50 ring-offset-2 ring-offset-gray-900/30">
              {userInitial}
            </div>
          )}
        </div>

        {/* Textarea */}
        <div className="flex-1 relative flex items-center gap-1 sm:gap-2">
          <textarea
            ref={textareaRef}
            value={caption}
            onChange={(e) => {
              setCaption(e.target.value);
              setShowDropdown(false); // Close dropdown when typing
            }}
            onFocus={() => setIsExpanded(true)}
            placeholder={placeholders[currentPlaceholderIndex]}
            className="w-full bg-transparent text-gray-100 text-base sm:text-xl placeholder-gray-500 resize-none outline-none leading-relaxed font-normal placeholder:text-base sm:placeholder:text-[20px] placeholder:font-medium sm:placeholder:font-semibold focus:text-white transition-colors"
            rows={1}
            style={{
              minHeight: "24px",
              maxHeight: "400px",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "24px";
              target.style.height = target.scrollHeight + "px";
            }}
            disabled={isProcessing}
            maxLength={10000}
          />

          {/* Dropdown toggle button - only shows for special placeholders */}
          {/* {shouldShowDropdownOptions() && caption.trim().length === 0 && (
            <button
              data-dropdown-button
              onClick={handleToggleDropdown}
              className="flex-shrink-0 p-1.5 sm:p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
              title="Open options"
            >
              <ChevronDown
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                  showDropdown ? "rotate-180" : ""
                }`}
              />
            </button>
          )} */}

          {/* Dropdown for special placeholders */}
          {/* {showDropdown &&
            shouldShowDropdownOptions() &&
            caption.trim().length === 0 && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 mt-2 w-full bg-gray-900 border-2 border-gray-600 rounded-lg shadow-2xl z-[9999] overflow-hidden"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "8px",
                  width: "calc(100% - 0px)",
                }}
              >
                <button
                  onClick={handleTellYourStory}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 text-left text-white hover:bg-gray-800 active:bg-gray-700 transition-colors flex items-center justify-between group border-b border-gray-700"
                >
                  <span className="font-semibold text-sm sm:text-base">
                    Tell your story
                  </span>
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 rotate-[-90deg] group-hover:translate-x-1 transition-transform text-gray-400" />
                </button>
                <button
                  onClick={handleReportLandlord}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 text-left text-white hover:bg-gray-800 active:bg-gray-700 transition-colors flex items-center justify-between group"
                >
                  <span className="font-semibold text-sm sm:text-base">
                    Report your landlord
                  </span>
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 rotate-[-90deg] group-hover:translate-x-1 transition-transform text-gray-400" />
                </button>
              </div>
            )} */}
        </div>
      </div>

      {/* Character count */}
      {caption.length > 9000 && (
        <div className="flex justify-end mb-2 mt-2">
          <span
            className={`text-sm ${
              caption.length > 9800
                ? "text-red-400 font-semibold"
                : "text-gray-500"
            }`}
          >
            {caption.length} / 10,000
          </span>
        </div>
      )}

      {/* Media Preview */}
      {(imagePreviews.length > 0 || videoPreview) && (
        <div className="mt-2 sm:mt-3 mb-2 sm:mb-3 rounded-xl sm:rounded-2xl overflow-hidden border border-gray-800">
          <div
            className={`grid gap-0.5 ${
              imagePreviews.length === 1 && !videoPreview
                ? "grid-cols-1"
                : imagePreviews.length === 2
                ? "grid-cols-2"
                : "grid-cols-2"
            }`}
          >
            {imagePreviews.map((preview, index) => (
              <div
                key={index}
                className="relative group aspect-video bg-gray-900"
              >
                <img
                  src={preview}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200"></div>
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1.5 bg-gray-900/90 hover:bg-black rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
            {videoPreview && (
              <div className="relative group aspect-video bg-gray-900">
                <video
                  src={videoPreview}
                  className="w-full h-full object-cover"
                  controls
                />
                <button
                  onClick={removeVideo}
                  className="absolute top-2 right-2 p-1.5 bg-gray-900/90 hover:bg-black rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location display */}
      {/* {location && (
        <div className="mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-400">
          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
          <span className="truncate flex-1">
            {location.city}
            {location.state && `, ${location.state}`}
          </span>
          <button
            onClick={() => setLocation(null)}
            className="ml-auto text-xs text-gray-500 hover:text-gray-300 flex-shrink-0"
            disabled={isProcessing}
          >
            Remove
          </button>
        </div>
      )} */}

      {/* X.com style bottom bar */}
      {(isExpanded || hasContent) && (
        <div className="flex items-center justify-between pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-gray-800/50">
          {/* Media buttons */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-1.5 sm:p-2 hover:bg-blue-500/10 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={isProcessing || images.length >= 4}
              title="Add photos"
            >
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            </button>

            <input
              type="file"
              ref={videoInputRef}
              onChange={handleVideoUpload}
              accept="video/*"
              className="hidden"
            />
            <button
              onClick={() => videoInputRef.current?.click()}
              className="p-1.5 sm:p-2 hover:bg-blue-500/10 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={isProcessing || video !== null}
              title="Add video"
            >
              <Video className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            </button>

            {/* <button
              className="p-1.5 sm:p-2 hover:bg-blue-500/10 rounded-full transition-colors disabled:opacity-40"
              disabled={isProcessing}
              title="Add emoji"
            >
              <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            </button> */}

            <button
              onClick={captureLocation}
              className={`p-1.5 sm:p-2 hover:bg-blue-500/10 rounded-full transition-colors disabled:opacity-40 ${
                location ? "text-blue-500" : "text-gray-500"
              }`}
              disabled={
                isProcessing ||
                locationPermission === "denied" ||
                locationPermission === "unsupported"
              }
              title={
                location
                  ? "Location added"
                  : locationPermission === "denied"
                  ? "Location permission denied"
                  : "Add location"
              }
            >
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Post button */}
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !hasContent}
            className="px-4 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-blue-500/50 disabled:to-blue-500/50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-full transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 disabled:shadow-none"
          >
            {isProcessing ? "Posting..." : "Post"}
          </button>
        </div>
      )}
    </div>
  );
}
