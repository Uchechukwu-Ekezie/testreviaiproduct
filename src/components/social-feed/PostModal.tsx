"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Image as ImageIcon, MapPin, Tag, Loader2, Video, Globe } from "lucide-react";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "react-toastify";

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PostModal({ isOpen, onClose }: PostModalProps) {
  const { user } = useAuth();
  const { createPost, isLoading, error: postError } = usePosts();
  const { uploadImage, uploadVideo, uploading, error: cloudinaryError } = useCloudinaryUpload();
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [mediaError, setMediaError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    console.log("[PostModal] Image files selected:", files.length);
    setMediaError("");
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    const maxImages = 4;

    const newImages: File[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        const msg = `Image ${file.name} is too large. Maximum size is 10MB`;
        console.warn("[PostModal]", msg);
        setMediaError(msg);
        return;
      }

      if (!file.type.startsWith('image/')) {
        const msg = `${file.name} is not a valid image file`;
        console.warn("[PostModal]", msg);
        setMediaError(msg);
        return;
      }

      if (images.length + newImages.length >= maxImages) {
        const msg = `You can only upload up to ${maxImages} images`;
        console.warn("[PostModal]", msg);
        setMediaError(msg);
        return;
      }

      newImages.push(file);
    });

    if (newImages.length > 0) {
      console.log("[PostModal] Adding images:", newImages.length);
      setImages((prev) => [...prev, ...newImages]);
      const previews = newImages.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...previews]);
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    console.log("[PostModal] Video file selected:", files[0].name);
    setMediaError("");
    const maxSize = 10 * 1024 * 1024; // 10MB limit

    const file = files[0];
    if (file.size > maxSize) {
      const msg = `Video ${file.name} is too large. Maximum size is 10MB`;
      console.warn("[PostModal]", msg);
      setMediaError(msg);
      return;
    }

    if (!file.type.startsWith('video/')) {
      const msg = `${file.name} is not a valid video file`;
      console.warn("[PostModal]", msg);
      setMediaError(msg);
      return;
    }

    if (video) {
      const msg = "You can only upload one video per post";
      console.warn("[PostModal]", msg);
      setMediaError(msg);
      return;
    }

    console.log("[PostModal] Adding video:", file.name);
    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));

    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    console.log("[PostModal] Removing image at index:", index);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setMediaError("");
  };

  const removeVideo = () => {
    console.log("[PostModal] Removing video");
    setVideo(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    setMediaError("");
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      if (tags.length >= 5) {
        console.warn("[PostModal] Maximum tags reached");
        toast.error("Maximum 5 tags allowed");
        return;
      }
      console.log("[PostModal] Adding tag:", tagInput.trim());
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    console.log("[PostModal] Removing tag:", tagToRemove);
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const resetForm = () => {
    console.log("[PostModal] Resetting form...");
    setCaption("");
    setImages([]);
    setVideo(null);
    setImagePreviews([]);
    setVideoPreview(null);
    setLocation("");
    setTags([]);
    setTagInput("");
    setShowLocationInput(false);
    setShowTagInput(false);
    setMediaError("");
    setIsSubmitting(false);
    console.log("[PostModal] Form reset complete");
  };

  const handleSubmit = async () => {
    console.log("=== [PostModal] handleSubmit START ===");
    console.log("[PostModal] Caption length:", caption.length);
    console.log("[PostModal] Images count:", images.length);
    console.log("[PostModal] Has video:", !!video);
    console.log("[PostModal] Location:", location);
    console.log("[PostModal] Tags:", tags);

    // Validation
    if (!caption.trim() && images.length === 0 && !video) {
      console.warn("[PostModal] Validation failed - no content, images, or video");
      toast.error("Please add some content, images, or a video to your post");
      return;
    }

    if (caption.length > 10000) {
      console.warn("[PostModal] Validation failed - caption too long");
      toast.error("Post content is too long (maximum 10,000 characters)");
      return;
    }

    console.log("[PostModal] Validation passed, starting submission");
    setIsSubmitting(true);

    try {
      let uploadedImageUrls: string[] = [];
      let uploadedVideoUrl: string | null = null;

      // Upload images if any
      if (images.length > 0) {
        console.log("[PostModal] Starting image upload...");
        console.log("[PostModal] Images to upload:", images.map(f => ({ name: f.name, size: f.size, type: f.type })));
        
        uploadedImageUrls = await Promise.all(
          images.map(async (file, index) => {
            console.log(`[PostModal] Uploading image ${index + 1}/${images.length}:`, file.name);
            const url = await uploadImage(file);
            if (!url) {
              throw new Error(`Failed to upload image: ${file.name}`);
            }
            console.log(`[PostModal] Image ${index + 1} uploaded:`, url);
            return url;
          })
        );
        
        console.log("[PostModal] All images uploaded successfully");
        console.log("[PostModal] Uploaded URLs:", uploadedImageUrls);
      }

      // Upload video if present
      if (video) {
        console.log("[PostModal] Starting video upload...");
        console.log("[PostModal] Video to upload:", { name: video.name, size: video.size, type: video.type });
        uploadedVideoUrl = await uploadVideo(video);
        if (!uploadedVideoUrl) {
          throw new Error(`Failed to upload video: ${video.name}`);
        }
        console.log("[PostModal] Video uploaded successfully:", uploadedVideoUrl);
      }

      // Create post with caption, images, and video
      console.log("[PostModal] Calling createPost with:");
      console.log("[PostModal]   - caption:", caption.substring(0, 100));
      console.log("[PostModal]   - images:", uploadedImageUrls);
      console.log("[PostModal]   - media_url:", uploadedVideoUrl);
      
      const success = await createPost(caption, uploadedImageUrls, uploadedVideoUrl);
      
      console.log("[PostModal] createPost result:", success);

      if (success) {
        console.log("[PostModal] ✅ Post created successfully!");
        toast.success("Post created successfully!");

        // Close modal immediately
        console.log("[PostModal] Closing modal...");
        onClose();
        
        // Reset form after a brief delay to allow modal animation
        setTimeout(() => {
          resetForm();
          console.log("[PostModal] Form reset after close");
        }, 300);
      } else {
        console.error("[PostModal] ❌ createPost returned false");
        console.error("[PostModal] Post error:", postError);
        
        setIsSubmitting(false);
        toast.error(postError || "Failed to create post. Please try again.");
      }
    } catch (error: any) {
      console.error("=== [PostModal] ERROR in handleSubmit ===");
      console.error("[PostModal] Error type:", error?.constructor?.name);
      console.error("[PostModal] Error message:", error?.message);
      console.error("[PostModal] Error stack:", error?.stack);
      
      setIsSubmitting(false);
      toast.error(error?.message || postError || cloudinaryError || "Failed to create post. Please try again.");
    }

    console.log("=== [PostModal] handleSubmit END ===");
  };

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      console.log("[PostModal] Cleaning up media previews");
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [imagePreviews, videoPreview]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log("[PostModal] Modal closed, resetting form state");
      const timer = setTimeout(() => {
        resetForm();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Log state changes
  useEffect(() => {
    console.log("[PostModal] State update - isSubmitting:", isSubmitting, "uploading:", uploading, "isLoading:", isLoading);
  }, [isSubmitting, uploading, isLoading]);

  const userName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "User"
    : "User";
  const userAvatar = user?.avatar || "/image/profile.png";

  const isProcessing = isSubmitting || isLoading || uploading;

  if (!isOpen) {
    return null;
  }

  console.log("[PostModal] Rendering modal - isProcessing:", isProcessing);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !isProcessing && onClose()}
      ></div>
      
      {/* X.com style compose box */}
      <div className="relative w-full max-w-[600px] mx-4 bg-black rounded-2xl shadow-2xl border border-gray-800 animate-in slide-in-from-top-4 duration-300">
        
        {/* Header - Minimal X.com style */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <button
            onClick={() => !isProcessing && onClose()}
            className="p-2 hover:bg-gray-900 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={isProcessing}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-base font-semibold text-white">Create Post</h2>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[70vh] px-4 py-4">
          {/* User Info - X.com style horizontal */}
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <img
                src={userAvatar}
                alt={userName}
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Caption Textarea - X.com style */}
              <textarea
                value={caption}
                onChange={(e) => {
                  console.log("[PostModal] Caption changed, length:", e.target.value.length);
                  setCaption(e.target.value);
                }}
                placeholder="What's happening?!"
                className="w-full bg-transparent text-white text-xl placeholder-gray-600 resize-none outline-none min-h-[120px] mb-4 leading-normal font-normal"
                disabled={isProcessing}
                autoFocus
                maxLength={10000}
              />

              {/* Character count - X.com style */}
              {caption.length > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="font-semibold">Everyone can reply</span>
                  </button>
                  {caption.length > 9000 && (
                    <span className={`text-sm ${caption.length > 9800 ? "text-red-400 font-semibold" : "text-gray-500"}`}>
                      {caption.length} / 10,000
                    </span>
                  )}
                </div>
              )}

              {/* Error Messages - X.com style */}
              {(mediaError || cloudinaryError || postError) && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-2xl">
                  <p className="text-red-400 text-sm">{mediaError || cloudinaryError || postError}</p>
                </div>
              )}

              {/* Media Preview - X.com style */}
              {(imagePreviews.length > 0 || videoPreview) && (
                <div className="mb-4 rounded-2xl overflow-hidden border border-gray-800">
                  <div className={`grid gap-0.5 ${imagePreviews.length === 1 && !videoPreview ? 'grid-cols-1' : imagePreviews.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group aspect-video bg-gray-900">
                        <img
                          src={preview}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200"></div>
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-black/90 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
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
                          className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-black/90 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                          disabled={isProcessing}
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

          {/* Location Input */}
          {showLocationInput && (
            <div className="mb-4">
              <div className="flex items-center gap-2 p-2.5 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <MapPin className="w-4 h-4 text-blue-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location"
                  className="flex-1 bg-transparent text-gray-100 text-sm outline-none placeholder-gray-500/80"
                  disabled={isProcessing}
                  maxLength={100}
                />
                <button
                  onClick={() => {
                    setShowLocationInput(false);
                    setLocation("");
                  }}
                  className="p-1 hover:bg-gray-700/50 rounded-full transition-colors duration-200"
                  disabled={isProcessing}
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
          )}

          {/* Tags Input */}
          {showTagInput && (
            <div className="mb-4">
              <div className="flex items-center gap-2 p-2.5 bg-gray-800/30 rounded-lg border border-gray-700/50 mb-2">
                <Tag className="w-4 h-4 text-blue-400" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tags (press Enter)"
                  className="flex-1 bg-transparent text-gray-100 text-sm outline-none placeholder-gray-500/80"
                  disabled={isProcessing || tags.length >= 5}
                  maxLength={30}
                />
                <button
                  onClick={handleAddTag}
                  className="px-2.5 py-1 bg-blue-500/80 hover:bg-blue-600 disabled:bg-gray-600/50 disabled:cursor-not-allowed rounded text-gray-100 text-xs font-medium transition-colors duration-200"
                  disabled={isProcessing || tags.length >= 5 || !tagInput.trim()}
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 text-blue-300 rounded-full text-xs font-medium"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-200 transition-colors duration-200"
                        disabled={isProcessing}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {tags.length >= 5 && (
                <p className="text-xs text-gray-400 mt-2">Maximum 5 tags reached</p>
              )}
            </div>
          )}
            </div>
          </div>

          {/* Add to your post */}
          <div className="border border-gray-800/50 rounded-xl p-4 bg-gray-900/30 backdrop-blur-sm">
            <p className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-yellow-400 to-purple-600 rounded-full"></span>
              Add to your post
            </p>
            <div className="grid grid-cols-4 gap-2">
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
                className="p-3 hover:bg-gray-800/70 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed group border border-transparent hover:border-gray-700"
                disabled={isProcessing || images.length >= 4}
                title={images.length >= 4 ? "Maximum 4 images" : "Add Photo"}
              >
                <ImageIcon className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-gray-400 group-hover:text-gray-300">Photo</span>
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
                className="p-3 hover:bg-gray-800/70 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed group border border-transparent hover:border-gray-700"
                disabled={isProcessing || video !== null}
                title={video ? "Only one video allowed" : "Add Video"}
              >
                <Video className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-gray-400 group-hover:text-gray-300">Video</span>
              </button>
              <button
                onClick={() => setShowLocationInput(!showLocationInput)}
                className="p-3 hover:bg-gray-800/70 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1.5 group border border-transparent hover:border-gray-700"
                disabled={isProcessing}
                title="Add Location"
              >
                <MapPin
                  className={`w-5 h-5 group-hover:scale-110 transition-transform ${showLocationInput ? "text-yellow-400" : "text-red-400"}`}
                />
                <span className="text-xs text-gray-400 group-hover:text-gray-300">Location</span>
              </button>
              <button
                onClick={() => setShowTagInput(!showTagInput)}
                className="p-3 hover:bg-gray-800/70 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1.5 group border border-transparent hover:border-gray-700"
                disabled={isProcessing}
                title="Add Tag"
              >
                <Tag
                  className={`w-5 h-5 group-hover:scale-110 transition-transform ${showTagInput ? "text-yellow-400" : "text-purple-400"}`}
                />
                <span className="text-xs text-gray-400 group-hover:text-gray-300">Tags</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800/50 bg-[#1a1a1a]/80 backdrop-blur-xl">
          <div className="flex gap-3">
            <button
              onClick={() => {
                console.log("[PostModal] Cancel button clicked");
                if (!isProcessing) {
                  onClose();
                }
              }}
              className="flex-1 py-3 bg-gray-800/60 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-all duration-200 border border-gray-700/50 hover:border-gray-600"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                console.log("[PostModal] Post button clicked");
                handleSubmit();
              }}
              disabled={isProcessing || (!caption.trim() && images.length === 0 && !video)}
              className="flex-1 py-3 bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#780991] hover:from-yellow-500 hover:via-orange-500 hover:to-purple-700 disabled:from-gray-700 disabled:via-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg disabled:shadow-none"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                "Publish Post"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}