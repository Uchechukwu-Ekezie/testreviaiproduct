"use client";

import type React from "react";
import { X, Plus } from "lucide-react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);

  // Set email from user when component mounts or user changes
  useEffect(() => {
    if (authUser?.email) {
      setEmail(authUser.email);
    }
  }, [authUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address || !experience) {
      toast({
        title: "Warning",
        description: "Please fill in address and your experience.",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to report a landlord.",
        variant: "destructive",
      });
      return;
    }

    // Prepare the data for the API
    const data = {
      address,
      review_text: experience,
      user: user.id || "",
      chat_session: activeSession || "general",
      // Add a flag to indicate this is a landlord report
      report_type: "landlord_report",
    };

    try {
      setIsSubmitting(true);

      // Log the data being sent to help with debugging
      console.log("Submitting landlord report with data:", data);

      // Call the API function
      const response = await UserReviews.postReview(data);

      console.log("Landlord report submitted successfully:", response);

    
      if (files && files.length > 0) {
   
        console.log("Files to upload:", files);

       
        // const formData = new FormData()
        // formData.append('review_id', response.id)
        // for (let i = 0; i < files.length; i++) {
        //   formData.append('files', files[i])
        // }
        // await api.post('/reviews/upload-files/', formData)
      }

      toast({
        title: "Success",
        description:
          "Thanks for reporting your landlord! Your report has been recorded.",
      });

      // Reset form fields
      setAddress("");
      setExperience("");
      setFiles(null);

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
      setFiles(e.target.files);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
      <div className="w-[90%] max-w-[692px] bg-background border border-border rounded-[10px] shadow-lg flex flex-col overflow-hidden">
        <div className="relative p-5 max-w-[506px] mx-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-[-50] text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="pt-6 mb-2 text-xl font-semibold text-center text-white">
            Report your Landlord
          </h2>
          <p className="mb-4 text-sm text-gray-400">
            Have you recently experienced an unpleasant situation with your
            landlord? Please share, we would love to help address the issue!
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block mb-1 text-sm text-gray-400"
              >
                Enter your email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!authUser?.email} // Disable if user is logged in
                  className="w-full py-2 pr-3 text-white border rounded-[12px] bg-background border-border pl-9 placeholder:text-gray-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  required
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Image
                    src={sms}
                    alt="Email icon"
                    className="w-5 h-5 text-gray-400"
                  />
                </div>
              </div>
              {authUser?.email && (
                <p className="mt-1 text-xs text-gray-400">
                  Using your account email. This field is automatically filled.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="address"
                className="block mb-1 text-sm text-gray-400"
              >
                Property Address
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g No. 15, Admiralty Way, Lekki, Lagos"
                className="w-full px-3 py-2 text-white border rounded-[12px] bg-background border-border focus:outline-none placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="experience"
                className="block mb-1 text-sm text-gray-400"
              >
                Your reason for report
              </label>
              <div className="relative">
                <textarea
                  id="experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Describe any issues you've faced with your landlord"
                  className="w-full bg-background border border-border rounded-[12px] py-2 px-3 text-white focus:outline-none placeholder:text-gray-500 min-h-[80px]"
                  required
                />
                <button
                  type="button"
                  className="absolute text-gray-400 bottom-2 right-2 hover:text-white"
                  aria-label="Add attachment"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="photos"
                className="block mb-1 text-sm text-gray-400"
              >
                Upload an image of your utiliity bill or proof
              </label>
              <label
                htmlFor="photos"
                className="flex items-center justify-center w-full px-4 py-3 text-sm text-white transition border rounded-[12px] cursor-pointer bg-gray-800 border-border hover:bg-gray-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add photos
              </label>

              <input
                type="file"
                id="photos"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden "
              />
              {files && files.length > 0 && (
                <p className="mt-1 text-xs text-gray-400">
                  {files.length} file{files.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !user}
              className="w-full py-2 rounded-[15px] text-white font-medium bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Sending..."
                : user
                ? "Send"
                : "Please log in to submit"}
            </button>

            {!user && (
              <p className="text-xs text-center text-red-400">
                You need to be logged in to report a landlord.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportYourLandlord;
