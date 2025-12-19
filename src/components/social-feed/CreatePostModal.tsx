"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Image as ImageIcon, MapPin, Tag, Loader2, Video } from "lucide-react";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "react-toastify";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 *  CreatePostModal – now with a smooth enter / exit animation
 */
export default function CreatePostModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePostModalProps) {
  /* --------------------------------------------------------------
     Hooks & state
  -------------------------------------------------------------- */
  const { user } = useAuth();
  const { createPost, isLoading, error: postError } = usePosts();
  const { uploadImage, uploadVideo, uploading, error: cloudinaryError } =
    useCloudinaryUpload();

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

  /** Keep the portal in the DOM while the exit animation runs */
  const [isMounted, setIsMounted] = useState(false);

  /* --------------------------------------------------------------
     Animation handling
  -------------------------------------------------------------- */
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);               // mount → enter
    } else if (isMounted) {
      // start exit → after 5000 ms unmount
      const timer = setTimeout(() => setIsMounted(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMounted]);

  /* --------------------------------------------------------------
     Helper functions (upload, tags, reset, …)
  -------------------------------------------------------------- */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setMediaError("");
    const maxSize = 10 * 1024 * 1024;
    const maxImages = 4;
    const newImages: File[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        setMediaError(`Image ${file.name} > 10 MB`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        setMediaError(`${file.name} is not an image`);
        return;
      }
      if (images.length + newImages.length >= maxImages) {
        setMediaError("Maximum 4 images");
        return;
      }
      newImages.push(file);
    });

    if (newImages.length) {
      setImages((p) => [...p, ...newImages]);
      setImagePreviews((p) => [
        ...p,
        ...newImages.map((f) => URL.createObjectURL(f)),
      ]);
    }
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setMediaError("");
    const file = files[0];
    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setMediaError("Video > 10 MB");
      return;
    }
    if (!file.type.startsWith("video/")) {
      setMediaError(`${file.name} is not a video`);
      return;
    }
    if (video) {
      setMediaError("Only one video allowed");
      return;
    }

    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const removeImage = (i: number) => {
    setImages((p) => p.filter((_, idx) => idx !== i));
    setImagePreviews((p) => p.filter((_, idx) => idx !== i));
    setMediaError("");
  };
  const removeVideo = () => {
    setVideo(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    setMediaError("");
  };

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags((p) => [...p, t]);
      setTagInput("");
    }
  };
  const removeTag = (t: string) => setTags((p) => p.filter((x) => x !== t));

  const resetForm = () => {
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
  };

  const handleSubmit = async () => {
    if (!caption.trim() && images.length === 0 && !video) {
      toast.error("Add some content");
      return;
    }
    setIsSubmitting(true);
    try {
      const uploadedImages = await Promise.all(
        images.map(async (f) => {
          const url = await uploadImage(f);
          if (!url) throw new Error("Image upload failed");
          return url;
        })
      );
      const uploadedVideo = video ? await uploadVideo(video) : null;
      if (video && !uploadedVideo) throw new Error("Video upload failed");

      const ok = await createPost(caption, uploadedImages, uploadedVideo);
      if (ok) {
        toast.success("Posted!");
        resetForm();
        onClose();
        onSuccess?.();
      } else {
        toast.error(postError || "Post failed");
      }
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* --------------------------------------------------------------
     Cleanup object URLs
  -------------------------------------------------------------- */
  useEffect(() => {
    return () => {
      imagePreviews.forEach((u) => URL.revokeObjectURL(u));
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [imagePreviews, videoPreview]);

  /* --------------------------------------------------------------
     Reset when modal finally closes
  -------------------------------------------------------------- */
  useEffect(() => {
    if (!isOpen && isMounted) {
      const t = setTimeout(resetForm, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, isMounted]);

  const isProcessing = isSubmitting || isLoading || uploading;
  const userName =
    user
      ? `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
        user.username ||
        "User"
      : "User";
  const userAvatar = user?.avatar || "/image/profile.png";

  /* --------------------------------------------------------------
     Render – portal is *always* in the DOM while isMounted === true
  -------------------------------------------------------------- */
  if (!isMounted) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-opacity duration-300
        ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal container – scale + fade */}
      <div
        className={`
          relative w-full max-w-xl max-h-[90vh] overflow-hidden
          rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a]
          border border-gray-700/50 shadow-2xl
          transform transition-all duration-300 ease-out
          ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}
        `}
      >
        {/* ---------- Loading overlay ---------- */}
        {isProcessing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
            <div className="flex flex-col items-center gap-3 rounded-xl bg-gray-900/80 p-6">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              <p className="text-sm font-medium text-gray-200">
                {uploading ? "Uploading…" : "Posting…"}
              </p>
            </div>
          </div>
        )}

        {/* ---------- Header ---------- */}
        <div className="flex items-center justify-between border-b border-gray-700/50 p-4">
          <h2 className="text-lg font-medium text-gray-100">Create Post</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-full p-1.5 transition-colors hover:bg-gray-700/50 disabled:opacity-50"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* ---------- Scrollable body ---------- */}
        <div className="overflow-y-auto p-4 max-h-[calc(90vh-140px)] space-y-4">
          {/* user */}
          <div className="flex items-center gap-3">
            <img
              src={userAvatar}
              alt={userName}
              className="h-10 w-10 rounded-full border-2 border-blue-500/50 object-cover"
            />
            <div>
              <h3 className="font-medium text-gray-100">{userName}</h3>
              <span className="text-xs text-gray-400">Public</span>
            </div>
          </div>

          {/* caption */}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Share your property update..."
            className="w-full resize-none bg-transparent text-base text-gray-100 outline-none placeholder:text-gray-500/80 min-h-[100px]"
            disabled={isProcessing}
            autoFocus
            maxLength={10000}
          />

          {/* char count */}
          {caption.length > 9000 && (
            <div className="text-right text-xs">
              <span
                className={caption.length > 9800 ? "text-red-400" : "text-gray-400"}
              >
                {caption.length} / 10,000
              </span>
            </div>
          )}

          {/* errors */}
          {(mediaError || cloudinaryError || postError) && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-xs text-red-400">
                {mediaError || cloudinaryError || postError}
              </p>
            </div>
          )}

          {/* media preview */}
          {(imagePreviews.length > 0 || videoPreview) && (
            <div
              className={`grid gap-2 ${
                imagePreviews.length === 1 && !videoPreview
                  ? "grid-cols-1"
                  : "grid-cols-2"
              }`}
            >
              {imagePreviews.map((src, i) => (
                <div key={i} className="group relative">
                  <img
                    src={src}
                    alt=""
                    className="h-40 w-full rounded-lg border border-gray-700/50 object-cover"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    disabled={isProcessing}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1 opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3 text-gray-200" />
                  </button>
                </div>
              ))}
              {videoPreview && (
                <div className="group relative">
                  <video
                    src={videoPreview}
                    controls
                    className="h-40 w-full rounded-lg border border-gray-700/50 object-cover"
                  />
                  <button
                    onClick={removeVideo}
                    disabled={isProcessing}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1 opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3 text-gray-200" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* location */}
          {showLocationInput && (
            <div className="flex items-center gap-2 rounded-lg border border-gray-700/50 bg-gray-800/30 p-2.5">
              <MapPin className="h-4 w-4 text-blue-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
                className="flex-1 bg-transparent text-sm text-gray-100 outline-none"
                maxLength={100}
              />
              <button
                onClick={() => {
                  setShowLocationInput(false);
                  setLocation("");
                }}
                className="rounded-full p-1 hover:bg-gray-700/50"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            </div>
          )}

          {/* tags */}
          {showTagInput && (
            <div>
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-gray-700/50 bg-gray-800/30 p-2.5">
                <Tag className="h-4 w-4 text-blue-400" />
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
                  placeholder="Add tags (Enter)"
                  className="flex-1 bg-transparent text-sm text-gray-100 outline-none"
                  maxLength={30}
                />
                <button
                  onClick={handleAddTag}
                  disabled={tags.length >= 5 || !tagInput.trim()}
                  className="rounded px-2.5 py-1 text-xs font-medium text-gray-100 bg-blue-500/80 hover:bg-blue-600 disabled:bg-gray-600/50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-300"
                    >
                      #{t}
                      <button onClick={() => removeTag(t)} className="hover:text-blue-200">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* add-media bar */}
          <div className="rounded-lg border border-gray-700/50 p-3">
            <p className="mb-2 text-sm font-medium text-gray-100">
              Add to your post
            </p>
            <div className="flex items-center gap-2">
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
                disabled={images.length >= 4 || isProcessing}
                className="flex-1 rounded-lg p-2 hover:bg-gray-700/50 flex items-center justify-center transition-colors"
              >
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
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
                disabled={!!video || isProcessing}
                className="flex-1 rounded-lg p-2 hover:bg-gray-700/50 flex items-center justify-center transition-colors"
              >
                <Video className="h-5 w-5 text-muted-foreground" />
              </button>

              <button
                onClick={() => setShowLocationInput((v) => !v)}
                className="flex-1 rounded-lg p-2 hover:bg-gray-700/50 flex items-center justify-center transition-colors"
              >
                <MapPin
                  className={`h-5 w-5 ${
                    showLocationInput ? "text-blue-400" : "text-muted-foreground"
                  }`}
                />
              </button>

              <button
                onClick={() => setShowTagInput((v) => !v)}
                className="flex-1 rounded-lg p-2 hover:bg-gray-700/50 flex items-center justify-center transition-colors"
              >
                <Tag
                  className={`h-5 w-5 ${
                    showTagInput ? "text-blue-400" : "text-muted-foreground"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ---------- Footer ---------- */}
        <div className="flex gap-2 border-t border-gray-700/50 p-4">
          <button
            onClick={handleSubmit}
            disabled={
              isProcessing ||
              (!caption.trim() && images.length === 0 && !video)
            }
            className="flex-1 rounded-lg bg-gradient-to-r from-[#FFD700] to-[#780991] py-2 text-sm font-medium text-gray-100 transition-colors hover:from-yellow-500 hover:to-purple-700 disabled:bg-gray-700/50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{uploading ? "Uploading…" : "Posting…"}</span>
              </>
            ) : (
              "Done"
            )}
          </button>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 rounded-lg bg-gray-700/50 py-2 text-sm font-medium text-gray-100 transition-colors hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}