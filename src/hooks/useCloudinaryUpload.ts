// hooks/useCloudinaryUpload.ts
import { useState } from "react";

export const useCloudinaryUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);

    // Create a FormData object for Cloudinary upload
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);

    // For unsigned uploads, an upload preset is REQUIRED
    const uploadPreset =
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_TWO || "reviews";
    
    // Temporary hardcoded values for testing
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dtyvgqppg";
    const finalUploadPreset = uploadPreset || "reviews";
    cloudinaryFormData.append("upload_preset", finalUploadPreset);

    // Add folder parameter for organization (allowed in unsigned uploads)
    cloudinaryFormData.append("folder", "chat_images");

    try {
      // Debug logging
      console.log("Cloudinary Debug Info:");
      console.log("Cloud Name:", cloudName);
      console.log("Upload Preset:", finalUploadPreset);
      console.log("Environment Variables:", {
        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_TWO: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_TWO
      });
      
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

      // Use the URL from Cloudinary directly - no transformations
      setUploading(false);
      return data.secure_url;
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setUploading(false);
      return null;
    }
  };

  return { uploadImage, uploading, error };
};
