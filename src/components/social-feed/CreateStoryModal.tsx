"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Image as ImageIcon, Video, Loader2 } from "lucide-react";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { toast } from "react-toastify";

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStory: (mediaUrl: string, mediaType: "image" | "video", caption?: string) => Promise<void>;
}

export default function CreateStoryModal({
  isOpen,
  onClose,
  onCreateStory,
}: CreateStoryModalProps) {
  const { uploadImage, uploadVideo, uploading } = useCloudinaryUpload();
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCaption("");
      setSelectedFile(null);
      setPreview(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Generate preview when file is selected
  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  }, [selectedFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast.error("Please select an image or video file");
        return;
      }

      // Validate file size (max 50MB for videos, 10MB for images)
      const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select an image or video");
      return;
    }

    setIsSubmitting(true);
    try {
      const mediaType = selectedFile.type.startsWith("video/") ? "video" : "image";
      let uploadedUrl: string | null = null;

      // Upload to Cloudinary
      if (mediaType === "image") {
        uploadedUrl = await uploadImage(selectedFile);
      } else {
        uploadedUrl = await uploadVideo(selectedFile);
      }

      if (!uploadedUrl) {
        throw new Error("Failed to upload media");
      }

      // Create story with caption
      await onCreateStory(uploadedUrl, mediaType, caption.trim() || undefined);
      
      toast.success("Story created successfully!");
      onClose();
    } catch (error: any) {
      console.error("Failed to create story:", error);
      toast.error(error.message || "Failed to create story");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  const isProcessing = uploading || isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
        {/* Loading overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-xl bg-gray-900/80 p-6">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              <p className="text-sm font-medium text-gray-200">
                {uploading ? "Uploading media..." : "Creating story..."}
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700/50 p-4">
          <h2 className="text-lg font-semibold text-white">Create Story</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-full p-1.5 transition-colors hover:bg-gray-700/50 disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* File selection area */}
          {!selectedFile ? (
            <div
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-4">
                  <div className="p-4 bg-gray-800 rounded-full">
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="p-4 bg-gray-800 rounded-full">
                    <Video className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Select photo or video</p>
                  <p className="text-sm text-gray-400">Choose an image or video to share</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative rounded-xl overflow-hidden bg-gray-900">
                {selectedFile.type.startsWith("video/") ? (
                  <video
                    src={preview || undefined}
                    controls
                    className="w-full max-h-64 object-contain"
                  />
                ) : (
                  <img
                    src={preview || undefined}
                    alt="Preview"
                    className="w-full max-h-64 object-contain"
                  />
                )}
                <button
                  onClick={handleRemoveFile}
                  disabled={isProcessing}
                  className="absolute top-2 right-2 p-2 bg-black/60 rounded-full hover:bg-black/80 transition-colors disabled:opacity-50"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Caption input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Caption (optional)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption to your story..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={2200}
                  disabled={isProcessing}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {caption.length}/2200
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedFile || isProcessing}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:opacity-90 text-white rounded-lg font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Posting..." : "Share Story"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

