"use client";

import type React from "react";
import { X, Plus, Trash2 } from "lucide-react"; // Removed Star import
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { UserReviews } from "@/lib/api";
import { toast } from "./ui/use-toast";
import sms from "../../public/Image/sms.png";
import Image from "next/image";

interface ReportYourLandlordProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession?: string | null;
  user?: any;
}

const ReportYourLandlord: React.FC<ReportYourLandlordProps> = ({
  isOpen,
  onClose,
  activeSession = null,
  user,
}) => {
  const { user: authUser } = useAuth();
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [experience, setExperience] = useState("");
  const [rating, setRating] = useState<number>(0); // Separate rating state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Cloudinary configuration - replace with your actual values
  const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "your-cloud-name";
  const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_TWO || "your-upload-preset";

  // Use authUser from context instead of the prop
  const currentUser = authUser || user;

  // Rating options for button-based system (5 options)
  const ratingOptions = [
    { value: 1, label: 'Worse', color: 'bg-red-600 hover:bg-red-700 focus:ring-red-400' },
    { value: 2, label: 'Bad', color: 'bg-red-500 hover:bg-red-600 focus:ring-red-400' },
    { value: 3, label: 'Average', color: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400' },
    { value: 4, label: 'Good', color: 'bg-green-500 hover:bg-green-600 focus:ring-green-400' },
    { value: 5, label: 'Very Good', color: 'bg-green-600 hover:bg-green-700 focus:ring-green-400' }
  ];

  // Set email from user when component mounts or user changes
  useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'landlord-reports'); // Different folder for reports

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    if (files.length === 0) return [];

    setIsUploading(true);
    const urls: string[] = [];

    try {
      for (const file of files) {
        try {
          const url = await uploadToCloudinary(file);
          urls.push(url);
          console.log(`Uploaded ${file.name}:`, url);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          toast({
            title: "Upload Error",
            description: `Failed to upload ${file.name}. Please try again.`,
            variant: "destructive",
          });
        }
      }

      if (urls.length > 0) {
        toast({
          title: "Success",
          description: `${urls.length} file${urls.length !== 1 ? 's' : ''} uploaded successfully!`,
        });
      }

      return urls;
    } finally {
      setIsUploading(false);
    }
  };

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address || !experience) {
      toast({
        title: "Warning",
        description: "Please fill in address and your reason for report.",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Warning", 
        description: "Please select a rating for your landlord experience."
      });
      return;
    }

    // NEW: Check if at least one image is uploaded
    if (files.length === 0) {
      toast({
        title: "Required Field Missing",
        description: "Please upload at least one file (utility bill or property document).",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to report a landlord.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload files to Cloudinary first if any files are selected
      let fileUrls: string[] = [];
      if (files.length > 0) {
        fileUrls = await uploadImages();
      }

      // Prepare the data for the API
      const data = {
        address,
        review_text: experience,
        user: currentUser.id || "",
        rating: rating, // Include the rating (1, 2, 3, 4, or 5)
        chat_session: activeSession || "general",
        evidence: fileUrls.length > 0 ? JSON.stringify(fileUrls) : "", // Convert array to JSON string
      };

      // Log the data being sent to help with debugging
      console.log("Submitting landlord report with data:", data);

      // Call the API function
      const response = await UserReviews.postReview(data);

      console.log("Landlord report submitted successfully:", response);

      toast({
        title: "Success",
        description:
          "Thanks for reporting your landlord! Your report has been recorded.",
      });

      // Reset form fields
      setAddress("");
      setExperience("");
      setRating(0);
      setFiles([]);

      // Close the popup
      onClose();
    } catch (err: any) {
      console.error("Error submitting landlord report:", err);

      // Show a more specific error message if available
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Failed to submit your report. Please try again later.";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-background/50 backdrop-blur-sm sm:p-4">
      {/* Modal Container with Responsive Sizing and Scrolling */}
      <div className="w-full max-w-[90vw] sm:max-w-[600px] lg:max-w-[692px]  max-h-[95vh] sm:max-h-[90vh] bg-background border border-border rounded-[10px] shadow-lg flex flex-col overflow-hidden">
        
        {/* Header - Fixed at top */}
        <div className="relative flex-shrink-0 p-4 border-b sm:p-5 border-border">
          <button
            onClick={onClose}
            className="absolute z-10 text-gray-400 transition-colors duration-200 top-3 right-3 sm:top-4 sm:right-4 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="pr-8 sm:pr-10">
            <h2 className="mb-2 text-lg font-semibold text-center text-white sm:text-xl lg:text-2xl">
              Report your Landlord
            </h2>
            <p className="text-xs leading-relaxed text-center text-gray-400 sm:text-sm">
              Have you recently experienced an unpleasant situation with your
              landlord? Please share, we would love to help address the issue!
            </p>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-5 lg:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block mb-1 text-xs text-gray-400 sm:mb-2 sm:text-sm"
                >
                  Enter your email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!!currentUser?.email} // Disable if user is logged in
                    className="w-full py-2 sm:py-3 pr-3 text-sm sm:text-base text-white border rounded-[8px] sm:rounded-[12px] bg-background border-border pl-8 sm:pl-9 placeholder:text-gray-500 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none sm:pl-3">
                    <Image
                      src={sms}
                      alt="Email icon"
                      className="w-4 h-4 text-gray-400 sm:w-5 sm:h-5"
                    />
                  </div>
                </div>
                {currentUser?.email && (
                  <p className="mt-1 text-xs text-gray-400">
                    Using your account email. This field is automatically filled.
                  </p>
                )}
              </div>

              {/* Address Field */}
              <div>
                <label
                  htmlFor="address"
                  className="block mb-1 text-xs text-gray-400 sm:mb-2 sm:text-sm"
                >
                  Property Address
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g No. 15, Admiralty Way, Lekki, Lagos"
                  className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base text-white border rounded-[8px] sm:rounded-[12px] bg-background border-border focus:outline-none focus:ring-2 focus:ring-yellow-400/50 placeholder:text-gray-500"
                  required
                />
              </div>

              {/* Experience Field */}
              <div>
                <label
                  htmlFor="experience"
                  className="block mb-1 text-xs text-gray-400 sm:mb-2 sm:text-sm"
                >
                  Your reason for report
                </label>
                <div className="relative">
                  <textarea
                    id="experience"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="Describe any issues you've faced with your landlord"
                    className="w-full bg-background border border-border rounded-[8px] sm:rounded-[12px] py-2 sm:py-3 px-3 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 placeholder:text-gray-500 min-h-[80px] sm:min-h-[100px] resize-y"
                    required
                  />
                </div>
              </div>

              {/* Updated Button-based Rating System (5 options) */}
              <div>
                <label className="block mb-2 text-xs text-gray-400 sm:text-sm">
                  Rate your landlord experience *
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ratingOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleRatingClick(option.value)}
                      className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                        rating === option.value
                          ? `${option.color} ring-2 ring-white ring-opacity-50 transform scale-105`
                          : `${option.color.split(' ')[0]} opacity-70 hover:opacity-100`
                      } ${option.color.split(' ')[2]}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-xs text-gray-300 sm:text-sm">
                    You selected: {ratingOptions.find(opt => opt.value === rating)?.label}
                  </p>
                )}
                {rating === 0 && (
                  <p className="text-xs text-gray-500">
                    Select a rating to describe your landlord experience
                  </p>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label
                  htmlFor="photos"
                  className="block mb-1 text-xs text-gray-400 sm:mb-2 sm:text-sm"
                >
                  Upload your utility bill or property document (image/PDF/document) *
                </label>
                <label
                  htmlFor="photos"
                  className={`flex items-center justify-center w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white transition border rounded-[8px] sm:rounded-[12px] cursor-pointer focus-within:ring-2 focus-within:ring-yellow-400/50 ${
                    files.length === 0 
                      ? 'border-red-400 hover:border-red-300' 
                      : 'border-border hover:border-gray-500'
                  }`}
                >
                  <Plus className="w-3 h-3 mr-2 sm:w-4 sm:h-4" />
                  Add files
                </label>

                <input
                  type="file"
                  id="photos"
                  accept="image/*,.pdf,.doc,.docx,.txt,.rtf"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Display selected files */}
                {files.length > 0 && (
                  <div className="mt-2 space-y-2 sm:mt-3">
                    <p className="text-xs text-gray-400">
                      {files.length} file{files.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className="space-y-2 overflow-y-auto max-h-32">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded sm:p-3 border-border">
                          <span className="flex-1 mr-2 text-xs text-white truncate sm:text-sm">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-1 text-red-400 rounded hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Show warning if no files selected */}
                {files.length === 0 && (
                  <p className="mt-1 text-xs text-red-400">
                    At least one file is required to submit your report
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !currentUser || isUploading}
                className="w-full py-2 sm:py-3 rounded-[12px] sm:rounded-[15px] text-sm sm:text-base text-white font-medium bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
              >
                {isSubmitting && files.length > 0
                  ? "Uploading files..."
                  : isSubmitting
                  ? "Sending..."
                  : currentUser
                  ? "Send"
                  : "Please log in to submit"}
              </button>

              {!currentUser && (
                <p className="text-xs text-center text-red-400">
                  You need to be logged in to report a landlord.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportYourLandlord;