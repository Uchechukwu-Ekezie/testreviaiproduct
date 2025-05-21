// hooks/useCloudinaryUpload.ts
import { useState } from "react";

export const useCloudinaryUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "REVIAI"); // replace this
    formData.append("cloud_name", "da6rmfoiz"); // replace this

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/da6rmfoiz/image/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setUploading(false);
      return data.secure_url;
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      setError("Upload failed. Please try again.");
      setUploading(false);
      return null;
    }
  };

  return { uploadImage, uploading, error };
};
