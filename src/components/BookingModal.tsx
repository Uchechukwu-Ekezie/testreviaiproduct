"use client";

import { useState } from "react";
import { X, Check, Phone, Mail, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface Property {
  id: string;
  title: string;
  location: string;
  price: string;
  image: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
}

export default function BookingModal({
  isOpen,
  onClose,
  property,
}: BookingModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    guests: "1",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  if (!isOpen || !property) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Show success toast
      toast.success("Booking request submitted successfully!");

      setStep("success");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to submit booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetModal = () => {
    setStep("form");
    setFormData({
      name: "",
      email: "",
      phone: "",
      checkIn: "",
      checkOut: "",
      guests: "1",
      message: "",
    });
    onClose();
  };

  const goToDashboard = () => {
    resetModal();
    router.push("/user-dashboard");
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        {step === "form" ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">Book Property</h2>
              <button
                onClick={resetModal}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Property Info */}
            <div className="p-6 border-b border-white/10">
              <div className="flex gap-4">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {property.title}
                  </h3>
                  <p className="text-gray-400">{property.location}</p>
                  <p className="text-green-400 font-semibold">
                    {property.price}
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-800 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-800 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-800 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Number of Guests
                  </label>
                  <select
                    name="guests"
                    value={formData.guests}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <option key={num} value={num}>
                        {num} Guest{num > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    name="checkIn"
                    value={formData.checkIn}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    name="checkOut"
                    value={formData.checkOut}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-white/70 text-sm mb-2">
                  Special Requests
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-gray-800 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Any special requests or questions?"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Submit Booking Request"
                )}
              </button>
            </form>
          </>
        ) : (
          // Success Step
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              Booking Request Sent!
            </h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              Thank you for your booking request. Our agent will contact you
              shortly to confirm the details and arrange your visit.
            </p>

            {/* Agent Contact Info */}
            <div className="bg-gray-800 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">
                Your Assigned Agent
              </h3>
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">SA</span>
                </div>
                <div className="text-left">
                  <h4 className="text-lg font-semibold text-white">
                    Sarah Ahmed
                  </h4>
                  <p className="text-gray-400">Senior Property Agent</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Phone className="w-4 h-4" />
                  <span>+234 806 123 4567</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Mail className="w-4 h-4" />
                  <span>sarah@reviai.tech</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-green-400 mt-4">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Typical response time: 1 hour</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={resetModal}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={goToDashboard}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-300"
              >
                View Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
