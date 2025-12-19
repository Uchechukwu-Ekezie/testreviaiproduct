"use client";

import { useState, useEffect, useRef } from "react";
import { ImagePlus, Mail } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";

interface FormData {
  email: string;
  address: string;
  experience: string;
  photos: File[];
}

const GOMAPS_API_KEY = process.env.NEXT_PUBLIC_GOMAPS_API_KEY as string;

export default function ShareExperience() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    address: "",
    experience: "",
    photos: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const autocompleteRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadGomapsScript = () => {
      if (!GOMAPS_API_KEY) {
        console.error("GoMaps API Key is missing.");
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.gomaps.pro/maps/api/js?key=${GOMAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initAutocomplete;
      document.body.appendChild(script);
    };

    const initAutocomplete = () => {
      if (typeof window !== "undefined" && window.google && autocompleteRef.current) {
        const google = window.google;

        // Initialize Google Places Autocomplete from GoMaps
        const autocomplete = new google.maps.places.Autocomplete(autocompleteRef.current, {
          types: ["geocode"],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          setFormData((prev) => ({
            ...prev,
            address: place.formatted_address ?? "", // Fallback to empty string
          }));
        });
      }
    };

    loadGomapsScript();
  }, []);

  const uploadToCloudinary = async (file: File) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "REVIAI"); // Replace with your Cloudinary upload preset
    data.append("cloud_name", "dc4ek6qz7"); // Replace with your Cloudinary cloud name

    const response = await fetch("https://api.cloudinary.com/v1_1/dc4ek6qz7/image/upload", {
      method: "POST",
      body: data,
    });

    const result = await response.json();
    return result.secure_url; // Return the uploaded image URL
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);

    if (!formData.email || !formData.address || !formData.experience) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    toast.info("Submitting your data...", {
      autoClose: 2000,
      style: {
        background: "linear-gradient(to right, #F5B041, #EC7063)",
        color: "#fff",
        fontSize: "16px",
        padding: "12px 20px",
        borderRadius: "10px",
        fontWeight: "bold",
        transition: "all 0.5s ease-in-out",
      },
    });

    try {
      // Upload photos to Cloudinary
      const uploadedPhotos = await Promise.all(
        formData.photos.map(async (photo) => await uploadToCloudinary(photo))
      );

      const validPhotos = uploadedPhotos.filter((url) => url !== null);

      const response = await fetch("/api/submitForm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          address: formData.address,
          pastExperience: formData.experience,
          images: validPhotos,
        }),
      });

      const data = await response.json();
      if (response.status === 200) {
        console.log("Data successfully saved to Google Sheets:", data);
        toast.success("Your experience has been submitted successfully!", {
          autoClose: 3000,
          style: {
            background: "linear-gradient(to right, #F5B041, #EC7063)",
            color: "#fff",
            fontSize: "16px",
            padding: "12px 20px",
            borderRadius: "10px",
            fontWeight: "bold",
            transition: "all 0.5s ease-in-out",
          },
          onClose: () => router.push("/thanks"),
        });
        setIsSubmitting(false);
      } else {
        console.error("Failed to save data", data);
        toast.error("Failed to submit your data. Please try again.", {
          autoClose: 3000,
          style: {
            background: "linear-gradient(to right, #EC7063, #F5B041)",
            color: "#fff",
            fontSize: "16px",
            padding: "12px 20px",
            borderRadius: "12px",
            fontWeight: "500",
            transition: "all 0.5s ease-in-out",
            boxShadow: "0px 10px 15px rgba(0, 0, 0, 0.1)",
          },
        });
      }
    } catch (error) {
      console.error("Error while submitting data", error);
      toast.error("Error while submitting your data. Please try again.", {
        autoClose: 3000,
        style: {
          background: "linear-gradient(to right, #EC7063, #F5B041)",
          color: "#fff",
          fontSize: "16px",
          padding: "12px 20px",
          borderRadius: "12px",
          fontWeight: "500",
          transition: "all 0.5s ease-in-out",
          boxShadow: "0px 10px 15px rgba(0, 0, 0, 0.1)",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);

      // Limit to 5 images
      if (files.length > 5) {
        toast.error("You can only upload up to 5 images.");
        return;
      }

      setFormData((prev) => ({ ...prev, photos: files }));
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[980px] mx-auto bg-[#171717] backdrop-blur-md rounded-2xl p-8 border border-white/10">
        <div className="max-w-lg mx-auto">
          <div className="space-y-2 mb-6 text-center">
            <h2 className="text-2xl font-semibold text-white">Share your Experience</h2>
            <p className="text-white/70 text-sm">
              We love to hear your past housing experience. Whether it&apos;s renting or buying, let us know about it.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm text-white/70">
                Enter your email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 pl-10 bg-transparent border rounded-[15px] border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm text-white/70">
                Property Address
              </label>
              <input
                id="address"
                type="text"
                ref={autocompleteRef}
                placeholder="e.g No. 15, Admiralty Way, Lekki, Lagos"
                className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-[15px] text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="experience" className="block text-sm text-white/70">
                Share your past experience
              </label>
              <textarea
                id="experience"
                placeholder="Add any issues you have faced"
                className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-[15px] text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 min-h-[100px] resize-y"
                value={formData.experience}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    experience: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <span className="block text-sm text-white/70">Upload photos</span>
              <div className="relative">
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
                  <ImagePlus className="w-5 h-5" />
                  <span>Add photos</span>
                </label>
                {formData.photos.length > 0 && (
                  <p className="mt-2 text-sm text-white/50">{formData.photos.length} photo(s) selected</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting} // Disable the button while submitting
              className="w-full py-3 px-4 rounded-[15px] font-medium text-white bg-gradient-to-r from-[#F5B041] to-[#EC7063] hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              {isSubmitting ? "Submitting..." : "Send"} {/* Show different button text */}
            </button>
          </form>
        </div>
      </div>

      {/* Toast Notification Container */}
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

      {/* Inject Custom Toast Styles directly within the component */}
      <style jsx global>{`
        .Toastify__toast-container {
          z-index: 9999;
        }
        .Toastify__toast {
          background: linear-gradient(to right, #F5B041, #EC7063);
          color: #fff;
          font-size: 16px;
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: bold;
        }
        .Toastify__close-button {
          color: #fff;
        }
      `}</style>
    </section>
  );
}