// hooks/useCloudinaryUpload.ts
import { useState } from "react";
import { toast } from "react-toastify";

export const useCloudinaryUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);

    const uploadPreset =
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_TWO || "reviews";
    
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dtyvgqppg";
    const finalUploadPreset = uploadPreset || "reviews";
    cloudinaryFormData.append("upload_preset", finalUploadPreset);
    cloudinaryFormData.append("folder", "chat_images");

    try {
      console.log("Cloudinary Debug Info:");
      console.log("Cloud Name:", cloudName);
      console.log("Upload Preset:", finalUploadPreset);
      
      if (!cloudName) {
        throw new Error("Cloudinary cloud name is not defined");
      }

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      console.log("Upload URL:", cloudinaryUrl);

      const response = await fetch(cloudinaryUrl, {
        method: "POST",
        body: cloudinaryFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Cloudinary upload error:", errorData);
        throw new Error(
          errorData.error?.message || "Failed to upload to Cloudinary"
        );
      }

      const data = await response.json();
      setUploading(false);
      return data.secure_url;
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      const errorMsg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(errorMsg);
      setUploading(false);
      return null;
    }
  };

  const uploadVideo = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);

    const uploadPreset =
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_TWO || "reviews";
    
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dtyvgqppg";
    const finalUploadPreset = uploadPreset || "reviews";
    cloudinaryFormData.append("upload_preset", finalUploadPreset);
    cloudinaryFormData.append("folder", "post_videos");
    cloudinaryFormData.append("resource_type", "video");

    try {
      console.log("Uploading video to Cloudinary:");
      console.log("Cloud Name:", cloudName);
      console.log("Upload Preset:", finalUploadPreset);
      console.log("File size:", file.size, "bytes");
      
      if (!cloudName) {
        throw new Error("Cloudinary cloud name is not defined");
      }

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
      console.log("Upload URL:", cloudinaryUrl);

      const response = await fetch(cloudinaryUrl, {
        method: "POST",
        body: cloudinaryFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Cloudinary video upload error:", errorData);
        throw new Error(
          errorData.error?.message || "Failed to upload video to Cloudinary"
        );
      }

      const data = await response.json();
      console.log("Video uploaded successfully:", data.secure_url);
      setUploading(false);
      return data.secure_url;
    } catch (err) {
      console.error("Cloudinary video upload error:", err);
      const errorMsg = err instanceof Error ? err.message : "Video upload failed. Please try again.";
      setError(errorMsg);
      setUploading(false);
      return null;
    }
  };

  return { uploadImage, uploadVideo, uploading, error };
};