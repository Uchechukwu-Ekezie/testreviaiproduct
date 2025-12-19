"use client";
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BASEURL } from "@/lib/env";
import { useAuth } from "@/contexts/auth-context";
import { useAuthRequired } from "@/hooks/useAuthRequired";

interface ReviewFormData {
  property: string;
  name: string; // This would typically be the logged-in user's ID
  email: string; // This would typically be the logged-in user's ID
  rating: number;
  address: string;
  reviewText: string;
  status: string; // Status defaults to "pending"
  //   photos: File[];
}

const ReviewForm: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { checkAuthAndProceed } = useAuthRequired();

  const [formData, setFormData] = useState<ReviewFormData>({
    property: "",
    name: "",
    email: "",
    rating: 1,
    address: "",
    reviewText: "",
    status: "pending", // Default status
    // photos: [],
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Update form data with user info when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
      }));
    }
  }, [isAuthenticated, user]);

  //   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //     if (e.target.files) {
  //       setFormData((prev) => ({
  //         ...prev,
  //         photos: Array.from(e.target.files),
  //       }));
  //     }
  //   };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check authentication before proceeding
    checkAuthAndProceed(async () => {
      setIsSubmitting(true);

      // Prepare data for submission
      const data = new FormData();
      data.append("property", formData.property);
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("rating", formData.rating.toString());
      data.append("address", formData.address);
      data.append("review_text", formData.reviewText);
      data.append("status", formData.status);
      // formData.photos.forEach((file) => data.append("photos", file));

      try {
        const response = await fetch(`${BASEURL}/api/reviews/no-auth/`, {
          method: "POST",
          body: data,
        });

        if (response.ok) {
          // Save review to localStorage as well for dashboard
          if (typeof window !== 'undefined') {
            const newReview = {
              id: Date.now().toString(),
              property: formData.property,
              rating: formData.rating,
              reviewText: formData.reviewText,
              status: "pending" as const,
              createdAt: new Date().toISOString(),
              address: formData.address,
            };

            const existingReviews = JSON.parse(
              localStorage.getItem("userReviews") || "[]"
            );
            existingReviews.push(newReview);
            localStorage.setItem("userReviews", JSON.stringify(existingReviews));
          }

          toast.success("Review submitted successfully!");
          setFormData({
            property: "",
            name: user ? `${user.first_name} ${user.last_name}` : "",
            email: user ? user.email : "",
            rating: 1,
            address: "",
            reviewText: "",
            status: "pending",
            //   photos: [],
          });
        } else {
          toast.error("Failed to submit the review.");
        }
      } catch {
        toast.error("An error occurred. Please try again later.");
      }

      setIsSubmitting(false);
    });
  };

  return (
    <section className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[980px] mx-auto bg-[#171717] backdrop-blur-md rounded-2xl p-8 border border-white/10">
        <div className="max-w-lg mx-auto">
          <div className="space-y-2 mb-6 text-center">
            <h2 className="text-2xl font-semibold text-white">
              Share your Experience
            </h2>
            <p className="text-white/70 text-sm">
              We love to hear your past housing experience. Whether it&apos;s
              renting or buying, let us know about it.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="property" className="block text-sm text-white/70">
                Property ID
              </label>
              <input
                id="property"
                type="text"
                placeholder="Enter property ID"
                className="w-full px-3 py-2 pl-10 bg-transparent border rounded-[15px] border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.property}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, property: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="rating" className="block text-sm text-white/70">
                Rating (1 to 5 stars)
              </label>
              <input
                id="rating"
                type="number"
                min="1"
                max="5"
                className="w-full px-3 py-2 bg-transparent border rounded-[15px] border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.rating}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, rating: +e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm text-white/70">
                Property Address
              </label>
              <input
                id="address"
                type="text"
                placeholder="e.g No. 15, Admiralty Way, Lekki, Lagos"
                className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-[15px] text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="reviewText"
                className="block text-sm text-white/70"
              >
                Share your past experience
              </label>
              <textarea
                id="reviewText"
                placeholder="Add any issues you have faced"
                className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-[15px] text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 min-h-[100px] resize-y"
                value={formData.reviewText}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    reviewText: e.target.value,
                  }))
                }
              />
            </div>

            {/* <div className="space-y-2">
              <span className="block text-sm text-white/70">Upload photos</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                id="photo-upload"
                onChange={handleFileChange}
              />
              <label
                htmlFor="photo-upload"
                className="flex items-center justify-center gap-2 p-4 border border-dashed border-white/10 rounded-[15px] text-white/70 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <span>Add photos</span>
              </label>
              {formData.photos.length > 0 && (
                <p className="mt-2 text-sm text-white/50">{formData.photos.length} photo(s) selected</p>
              )}
            </div> */}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-[15px] font-medium text-white bg-gradient-to-r from-[#F5B041] to-[#EC7063] hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              {isSubmitting ? "Submitting..." : "Send"}
            </button>
          </form>
        </div>
      </div>

      <ToastContainer
        className="z-40 mt-[60px]"
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </section>
  );
};

export default ReviewForm;
