"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "@/components/ui/use-toast";
import { userAPI } from "@/lib/api";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateProfile, updateProfileImage } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(
    null
  );

  const [formData, setFormData] = useState({
    username: user?.username || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    avatar: user?.avatar || "",
    phone: user?.phone || user?.agent_info?.phone || "",
  });
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedAvatarFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Update form data when user data changes or modal is opened
  useEffect(() => {
    if (user && isOpen) {
      const phoneValue = user.phone || user.agent_info?.phone || "";
      
      const newFormData = {
        username: user.username || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        avatar: user.avatar || "",
        phone: phoneValue,
      };
      
      setFormData(newFormData);
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
      setAvatarUploadError(null);
      setIsUploadingAvatar(false);
    }
  }, [user, isOpen]);

  // Additional effect to handle user.agent_info changes specifically
  useEffect(() => {
    if (user?.agent_info?.phone && isOpen) {
      console.log("Agent info phone updated:", user.agent_info.phone);
      setFormData(prev => ({
        ...prev,
        phone: user.phone || user.agent_info?.phone || prev.phone
      }));
    }
  }, [user?.agent_info?.phone, user?.phone, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Upload image to Cloudinary and get the URL
  const uploadToCloudinary = async (file: File) => {
    // Create a FormData object for Cloudinary upload
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);

    // For unsigned uploads, an upload preset is REQUIRED
    const uploadPreset =
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "reviai_avatars";
    cloudinaryFormData.append("upload_preset", uploadPreset);

    // Add folder parameter for organization (allowed in unsigned uploads)
    cloudinaryFormData.append("folder", "profile_avatars");

    try {
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

  // Send the Cloudinary URL to your backend
  const updateAvatarInBackend = async (avatarUrl: string): Promise<string> => {
    try {
      console.log("[1] Starting update with:", avatarUrl);

      // Make the API call
      const response = await userAPI.uploadAvatar(avatarUrl);
      console.log("[2] Received response:", response);

      // If we get here but response is undefined, backend isn't returning data
      if (!response) {
        throw new Error(
          "Backend returned 200 but no data - check server implementation"
        );
      }

      // Fallback: Use the original Cloudinary URL if backend doesn't return one
      const finalAvatarUrl = response?.avatar || avatarUrl;
      console.log("[3] Using avatar URL:", finalAvatarUrl);

      await updateProfileImage(finalAvatarUrl);
      return finalAvatarUrl;
    } catch (error: unknown) {
      console.error("[4] Full error:", {
        message: (error as any).message,
        response: (error as any).response?.data,
      });

      // If backend fails but we have a Cloudinary URL, use it as fallback
      if (avatarUrl) {
        console.warn("Using Cloudinary URL as fallback due to backend error");
        await updateProfileImage(avatarUrl);
        return avatarUrl;
      }

      throw new Error((error as any).response?.data?.message || "Avatar update failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const changedFields: any = {};

      // Check for changes in text fields
      if (user?.username !== formData.username)
        changedFields.username = formData.username;
      if (user?.first_name !== formData.first_name)
        changedFields.first_name = formData.first_name;
      if (user?.last_name !== formData.last_name)
        changedFields.last_name = formData.last_name;
      
      // Check for phone number changes (compare with both possible sources)
      const currentPhone = user?.phone || user?.agent_info?.phone || "";
      if (currentPhone !== formData.phone)
        changedFields.phone = formData.phone;

      // Early return if no changes
      if (Object.keys(changedFields).length === 0 && !selectedAvatarFile) {
        toast({
          title: "No changes detected",
          description: "You haven't made any changes to your profile.",
        });
        onClose();
        return;
      }

      setIsLoading(true);

      // Handle avatar upload if new file selected
      if (selectedAvatarFile) {
        setIsUploadingAvatar(true);
        try {
          // First upload to Cloudinary
          const cloudinaryUrl = await uploadToCloudinary(selectedAvatarFile);
          if (!cloudinaryUrl) {
            throw new Error("Failed to upload avatar to Cloudinary");
          }

          // Then update the backend with the Cloudinary URL
          const confirmedAvatarUrl = await updateAvatarInBackend(cloudinaryUrl);

          changedFields.avatar = confirmedAvatarUrl;
          setFormData((prev) => ({ ...prev, avatar: confirmedAvatarUrl }));

          toast({
            title: "Avatar updated",
            description: "Your profile picture has been updated successfully.",
          });
        } catch (error: any) {
          setAvatarUploadError(error.message || "Error uploading avatar");
          toast({
            title: "Avatar Update Failed",
            description:
              error.message || "Couldn't update avatar. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          setIsUploadingAvatar(false);
          return;
        } finally {
          setIsUploadingAvatar(false);
        }
      }

      // Update profile with changed fields
      if (Object.keys(changedFields).length > 0) {
        await updateProfile(changedFields);

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      }

      // Reset states and close modal
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Could not update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl text-muted-foreground">
            Profile Settings
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Update your basic profile information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="py-4 space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                {avatarPreview || formData.avatar ? (
                  <Image
                    src={avatarPreview || formData.avatar}
                    alt={formData.username || "User"}
                    width={80}
                    height={80}
                    className="object-cover rounded-full"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-2xl rounded-full bg-zinc-800 text-zinc-400">
                    {formData.first_name?.[0] || formData.username?.[0] || "U"}
                  </div>
                )}
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className={`absolute bottom-0 right-0 p-1 rounded-full cursor-pointer bg-background hover:bg-zinc-700 ${
                  isUploadingAvatar ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <Camera className="w-4 h-4 text-zinc-400" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={isUploadingAvatar}
                />
              </label>
              {isUploadingAvatar && (
                <div className="absolute flex items-center transform -translate-x-1/2 -bottom-6 left-1/2">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  <span className="text-xs text-zinc-400">Uploading...</span>
                </div>
              )}
            </div>
            {selectedAvatarFile && (
              <p className="text-xs text-zinc-400">
                New avatar selected: {selectedAvatarFile.name}
              </p>
            )}
            {avatarUploadError && (
              <p className="text-xs text-red-500">{avatarUploadError}</p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-muted-foreground">
              Username
            </Label>
            <input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              // className="border-border bg-card"
              className="border border-white/15 w-full bg-transparent h-9 rounded-[10px] text-white !text-[16px] placeholder:text-[17px] placeholder:text-muted-foreground pl-3 pr-10 focus:outline-none focus:ring-0 focus:border-white/40"

              placeholder="Enter your username"
              minLength={3}
              maxLength={20}
            />
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-muted-foreground">
              First Name
            </Label>
            <input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              className="border border-white/15 w-full bg-transparent h-9 rounded-[10px] text-white !text-[16px] placeholder:text-[17px] placeholder:text-muted-foreground pl-3 pr-10 focus:outline-none focus:ring-0 focus:border-white/40"

              placeholder="Enter your first name"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-muted-foreground">
              Last Name
            </Label>
            <input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              className="border border-white/15 w-full bg-transparent h-9 rounded-[10px] text-white !text-[16px] placeholder:text-[17px] placeholder:text-muted-foreground pl-3 pr-10 focus:outline-none focus:ring-0 focus:border-white/40"

              placeholder="Enter your last name"
            />
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground">
              Email (Read-only)
            </Label>
            <input
              id="email"
              value={user?.email || ""}
              readOnly
              disabled
              className="opacity-70 border border-white/15 w-full bg-transparent h-9 rounded-[10px] text-white !text-[16px] placeholder:text-[17px] placeholder:text-muted-foreground pl-3 pr-10 focus:outline-none focus:ring-0 focus:border-white/40"

            />
          </div>

          {/* Phone */}
          {/* <div className="space-y-2">
            <Label htmlFor="phone" className="text-muted-foreground">
              Phone Number
            </Label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={user?.agent_info?.phone}
              onChange={handleInputChange}
              className="border border-white/15 w-full bg-transparent h-9 rounded-[10px] text-white !text-[16px] placeholder:text-[17px] placeholder:text-muted-foreground pl-3 pr-10 focus:outline-none focus:ring-0 focus:border-white/40"
              placeholder="Enter your phone number"
            />
          </div> */}

          {/* Subscription Info */}
          {user?.subscription_type && (
            <div className="p-4 space-y-2 rounded-md bg-zinc-800">
              <h3 className="text-sm font-medium text-white">
                Subscription Info
              </h3>
              <div className="text-xs text-zinc-400">
                <p>
                  Type:{" "}
                  <span className="text-white capitalize">
                    {user.subscription_type}
                  </span>
                </p>
                {user.subscription_start_date && (
                  <p>
                    Start:{" "}
                    <span className="text-white">
                      {new Date(
                        user.subscription_start_date
                      ).toLocaleDateString()}
                    </span>
                  </p>
                )}
                {user.subscription_end_date && (
                  <p>
                    End:{" "}
                    <span className="text-white">
                      {new Date(
                        user.subscription_end_date
                      ).toLocaleDateString()}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border text-zinc-400"
              disabled={isLoading || isUploadingAvatar}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-white bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600"
              disabled={isLoading || isUploadingAvatar}
            >
              {isLoading || isUploadingAvatar ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isUploadingAvatar ? "Uploading..." : "Saving..."}
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}