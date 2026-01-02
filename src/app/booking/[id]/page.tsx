"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  Phone,
  Mail,
  MapPin,
  Star,
  ArrowLeft,
  Check,
} from "lucide-react";
import Image from "next/image";
import house from "../../../../public/Image/house.jpeg";
import AuthGuard from "@/components/AuthGuard";
import { propertiesAPI } from "@/lib/api";

// Sample property data - replace w
const propertyData = [
  {
    id: "0010fa44-a6eb-4b41-a472-e3087a013cfe",
    title: "Luxury 2BR Apartment",
    location: "Lekki Phase 1, Lagos",
    coordinates: { lat: 6.4698, lng: 3.5852 },
    rating: 4.5,
    reviews: 24,
    price: "₦100,250,000",
    bedrooms: 2,
    propertyType: "Apartment",
    images: house,
    badge: "Best Value",
  },
  {
    id: "luxury-2br-apartment-1",
    title: "Luxury 2BR Apartment",
    location: "Lekki Phase 1, Lagos",
    coordinates: { lat: 6.4698, lng: 3.5852 },
    rating: 4.5,
    reviews: 24,
    price: "₦100,250,000",
    bedrooms: 2,
    propertyType: "Apartment",
    images: house,
    badge: "Best Value",
  },
  {
    id: "luxury-3br-apartment-2",
    title: "Luxury 3BR Apartment",
    location: "Victoria Island, Lagos",
    coordinates: { lat: 6.4281, lng: 3.4219 },
    rating: 4.8,
    reviews: 15,
    price: "₦80,500,000",
    bedrooms: 3,
    propertyType: "Apartment",
    images: house,
    badge: "Best Value",
  },
  {
    id: "luxury-3br-apartment-3",
    title: "Luxury 3BR Apartment",
    location: "Ikoyi, Lagos",
    coordinates: { lat: 6.4541, lng: 3.4316 },
    rating: 4.9,
    reviews: 18,
    price: "₦85,350,000",
    bedrooms: 3,
    propertyType: "Apartment",
    images: house,
    badge: "Best Value",
  },
];

export default function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const propertyId = resolvedParams.id;

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [property, setProperty] = useState<(typeof propertyData)[0] | null>(
    null
  );
  const [bookingData, setBookingData] = useState({
    checkIn: "",
    checkOut: "",
    guests: 1,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequests: "",
  });

  useEffect(() => {
    const fetchProperty = async () => {
      setIsLoading(true);
      try {
        // First try to fetch from API
        const apiProperty = await propertiesAPI.getById(propertyId);

        if (apiProperty) {
          // Type cast the API response to match our property type
          setProperty(apiProperty as (typeof propertyData)[0]);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        // API fetch failed, fallback to sample data
      }

      // Fallback to sample data
      const foundProperty = propertyData.find((p) => p.id === propertyId);

      setProperty(foundProperty || null);
      setIsLoading(false);
    };

    fetchProperty();
  }, [propertyId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading Property...</h2>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
          <p className="text-white/70 mb-4">
            The property you&apos;re looking for doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.push("/properties")}
            className="bg-[#FFD700] text-black px-6 py-2 rounded-lg hover:bg-[#FFA500] transition-colors"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string | number) => {
    setBookingData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    // Here you would typically send the booking data to your API
    alert("Booking request submitted successfully!");
    router.push("/properties");
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < Math.floor(rating)
            ? "text-yellow-400 fill-yellow-400"
            : "text-gray-400"
        }`}
      />
    ));
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-white">Book Property</h1>
          </div>

          {/* Property Summary */}
          <div className="flex gap-6 p-6 bg-white/5 rounded-xl mb-8">
            <div className="relative w-32 h-32 rounded-lg overflow-hidden">
              <Image
                src={property.images}
                alt={property.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-semibold text-2xl mb-2">
                {property.title}
              </h2>
              <div className="flex items-center gap-2 text-white/70 text-lg mb-2">
                <MapPin className="w-5 h-5" />
                {property.location}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  {renderStars(property.rating)}
                </div>
                <span className="text-white/70 text-lg">
                  {property.rating} • {property.reviews} Reviews
                </span>
              </div>
              <div className="text-[#FFD700] font-bold text-2xl">
                {property.price}
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center">
              {[
                { number: 1, label: "Dates & Guests" },
                { number: 2, label: "Personal Info" },
                { number: 3, label: "Review & Confirm" },
              ].map((stepInfo, index) => (
                <div key={stepInfo.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold mb-2 ${
                        step >= stepInfo.number
                          ? "bg-[#FFD700] text-black"
                          : "bg-white/20 text-white/50"
                      }`}
                    >
                      {step > stepInfo.number ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        stepInfo.number
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        step >= stepInfo.number
                          ? "text-[#FFD700]"
                          : "text-white/50"
                      }`}
                    >
                      {stepInfo.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <div
                      className={`w-24 h-1 mx-4 mt-[-20px] ${
                        step > stepInfo.number ? "bg-[#FFD700]" : "bg-white/20"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white/5 rounded-xl p-8 mb-8">
            {step === 1 && (
              <div>
                <h3 className="text-white text-2xl font-semibold mb-6">
                  Select Dates & Guests
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white/70 text-lg mb-3">
                      Check-in Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={bookingData.checkIn}
                        onChange={(e) =>
                          handleInputChange("checkIn", e.target.value)
                        }
                        className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white text-lg focus:outline-none focus:border-[#FFD700]"
                      />
                      <Calendar className="absolute right-4 top-4 w-6 h-6 text-white/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/70 text-lg mb-3">
                      Check-out Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={bookingData.checkOut}
                        onChange={(e) =>
                          handleInputChange("checkOut", e.target.value)
                        }
                        className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white text-lg focus:outline-none focus:border-[#FFD700]"
                      />
                      <Calendar className="absolute right-4 top-4 w-6 h-6 text-white/50" />
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-white/70 text-lg mb-3">
                    Number of Guests
                  </label>
                  <div className="relative">
                    <select
                      value={bookingData.guests}
                      onChange={(e) =>
                        handleInputChange("guests", parseInt(e.target.value))
                      }
                      className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white text-lg focus:outline-none focus:border-[#FFD700] appearance-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num} className="bg-[#1a1a1a]">
                          {num} Guest{num > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                    <Users className="absolute right-4 top-4 w-6 h-6 text-white/50" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 className="text-white text-2xl font-semibold mb-6">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white/70 text-lg mb-3">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={bookingData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white text-lg focus:outline-none focus:border-[#FFD700]"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-lg mb-3">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={bookingData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white text-lg focus:outline-none focus:border-[#FFD700]"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-white/70 text-lg mb-3">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={bookingData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white text-lg focus:outline-none focus:border-[#FFD700]"
                      placeholder="Enter your email address"
                    />
                    <Mail className="absolute right-4 top-4 w-6 h-6 text-white/50" />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-white/70 text-lg mb-3">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={bookingData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white text-lg focus:outline-none focus:border-[#FFD700]"
                      placeholder="Enter your phone number"
                    />
                    <Phone className="absolute right-4 top-4 w-6 h-6 text-white/50" />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 className="text-white text-2xl font-semibold mb-6">
                  Review & Confirm
                </h3>
                <div className="space-y-6">
                  <div className="p-6 bg-white/5 rounded-lg">
                    <h4 className="text-white font-semibold text-xl mb-4">
                      Booking Summary
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-lg">
                        <span className="text-white/70">Check-in:</span>
                        <span className="text-white">
                          {bookingData.checkIn || "Not selected"}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-white/70">Check-out:</span>
                        <span className="text-white">
                          {bookingData.checkOut || "Not selected"}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-white/70">Guests:</span>
                        <span className="text-white">
                          {bookingData.guests} Guest
                          {bookingData.guests > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-white/70">Guest Name:</span>
                        <span className="text-white">
                          {bookingData.firstName} {bookingData.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-white/70">Email:</span>
                        <span className="text-white">{bookingData.email}</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-white/70">Phone:</span>
                        <span className="text-white">{bookingData.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/70 text-lg mb-3">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      value={bookingData.specialRequests}
                      onChange={(e) =>
                        handleInputChange("specialRequests", e.target.value)
                      }
                      className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white text-lg focus:outline-none focus:border-[#FFD700] resize-none"
                      rows={4}
                      placeholder="Any special requests or notes..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={step === 1 ? () => router.back() : handleBack}
              className="px-8 py-4 text-white border border-white/20 rounded-lg hover:bg-white/5 transition-colors text-lg"
            >
              {step === 1 ? "Back to Property" : "Previous"}
            </button>
            <button
              onClick={step === 3 ? handleSubmit : handleNext}
              className="px-8 py-4 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-[#FFA500] transition-colors text-lg"
            >
              {step === 3 ? "Confirm Booking" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
