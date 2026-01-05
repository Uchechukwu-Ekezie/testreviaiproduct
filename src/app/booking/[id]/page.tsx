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
import { propertiesAPI, bookingAPI } from "@/lib/api";
import { toast } from "react-toastify";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [property, setProperty] = useState<{
    id: string;
    title: string;
    location: string;
    price: string;
    rating: number;
    reviews: number;
    images: string | any;
    bedrooms?: string;
    propertyType?: string;
  } | null>(null);
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
        // Fetch property from API
        const response = await propertiesAPI.getById(propertyId) as any;
        const apiProperty = response?.data || response;

        if (apiProperty) {
          // Check if property is added by agent
          if (!apiProperty.is_added_by_agent) {
            setProperty(null);
            setIsLoading(false);
            return;
          }

          // Extract image URL from various possible formats
          let imageUrl = house; // Default fallback
          if (apiProperty.image_urls && Array.isArray(apiProperty.image_urls) && apiProperty.image_urls.length > 0) {
            // Get primary image or first image
            const primaryImage = apiProperty.image_urls.find((img: any) => img.is_primary) || apiProperty.image_urls[0];
            imageUrl = primaryImage.url || primaryImage.image_url || house;
          } else if (apiProperty.image_url) {
            imageUrl = apiProperty.image_url;
          } else if (apiProperty.images && Array.isArray(apiProperty.images) && apiProperty.images.length > 0) {
            const primaryImage = apiProperty.images.find((img: any) => img.is_primary) || apiProperty.images[0];
            imageUrl = primaryImage.image_url || primaryImage.url || house;
          }

          // Transform API property to UI format
          const transformedProperty = {
            id: apiProperty.id,
            title: apiProperty.title || "Property",
            location: apiProperty.address || apiProperty.city || "Location not specified",
            price: apiProperty.price || "₦0",
            rating: typeof apiProperty.rental_grade === "number" ? apiProperty.rental_grade : 4.0,
            reviews: 0, // Can be updated if reviews are available
            images: imageUrl,
            bedrooms: apiProperty.bedrooms || "0",
            propertyType: apiProperty.property_type || "apartment",
          };

          setProperty(transformedProperty);
          setIsLoading(false);
          return;
        }
      } catch (error: any) {
        console.error("Error fetching property:", error);
        toast.error(error.message || "Failed to load property. Please try again.");
      }

      // If we get here, property not found or not available for booking
      setProperty(null);
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
          <h2 className="text-2xl font-bold mb-2">Property Not Available for Booking</h2>
          <p className="text-white/70 mb-4">
            This property is not available for booking. Only properties added by agents can be booked.
          </p>
          <button
            onClick={() => router.push("/properties")}
            className="bg-gradient-to-r from-[#FFD700] to-[#780991] hover:opacity-90 text-black px-6 py-2 rounded-lg transition-colors"
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

  const handleSubmit = async () => {
    // Validate required fields
    if (!bookingData.checkIn || !bookingData.checkOut) {
      toast.error("Please select check-in and check-out dates");
      return;
    }
    
    // Validate dates are not in the past
    if (!isValidDate(bookingData.checkIn, today)) {
      toast.error("Check-in date cannot be in the past");
      return;
    }
    
    const minCheckout = getMinCheckoutDate();
    if (!isValidDate(bookingData.checkOut, minCheckout)) {
      toast.error("Check-out date must be after check-in date");
      return;
    }
    
    // Validate check-out is after check-in
    if (bookingData.checkOut <= bookingData.checkIn) {
      toast.error("Check-out date must be after check-in date");
      return;
    }
    
    if (!bookingData.firstName || !bookingData.lastName) {
      toast.error("Please enter your full name");
      return;
    }
    if (!bookingData.email || !bookingData.phone) {
      toast.error("Please enter your email and phone number");
      return;
    }
    if (!property?.id) {
      toast.error("Property information is missing");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create booking using bookingAPI
      const bookingPayload = {
        property_id: property.id,
        guest_name: `${bookingData.firstName} ${bookingData.lastName}`,
        guest_email: bookingData.email,
        guest_phone: bookingData.phone,
        check_in_date: bookingData.checkIn,
        check_out_date: bookingData.checkOut,
        number_of_guests: bookingData.guests,
        special_requests: bookingData.specialRequests || undefined,
      };

      const response = await bookingAPI.create(bookingPayload) as any;
      
      // Handle API response - could be wrapped in data property
      const booking = response?.data || response;
      setCreatedBooking(booking);

      if (!booking?.id) {
        toast.error("Booking created but missing booking ID. Please contact support.");
        router.push(`/user-dashboard/bookings`);
        return;
      }

      toast.success("Booking created successfully! Redirecting to payment...");

      // Store booking ID in sessionStorage for payment callback
      if (booking?.id) {
        sessionStorage.setItem('pending_booking_id', booking.id);
      }

      // Check if payment authorization URL is already in the booking response
      // Only use it if it's a valid non-null URL
      if (booking?.payment_authorization_url && booking.payment_authorization_url !== null) {
        // Backend already initialized payment, redirect directly
        console.log("[Booking] Using payment URL from booking response");
        window.location.href = booking.payment_authorization_url;
        return;
      }

      // Payment URL not provided, need to initialize payment
      console.log("[Booking] Payment URL not in response, initializing payment...");

      // If no authorization URL in response, initialize payment (fallback)
      try {
        const paymentResponse = await bookingAPI.initializePayment(booking.id) as any;
        const paymentData = paymentResponse?.data || paymentResponse;
        
        if (paymentData?.authorization_url) {
          // Store booking ID in sessionStorage for payment callback
          if (booking?.id) {
            sessionStorage.setItem('pending_booking_id', booking.id);
          }
          // Redirect to Paystack payment page
          window.location.href = paymentData.authorization_url;
        } else {
          toast.error("Failed to initialize payment. Please try again.");
          router.push(`/user-dashboard/bookings`);
        }
      } catch (paymentError: any) {
        console.error("Payment initialization error:", paymentError);
        
        // Extract error message from various possible formats
        let errorMessage = "Failed to initialize payment. Please try again later.";
        
        if (paymentError?.detail) {
          errorMessage = paymentError.detail;
          // Check if it's a Paystack configuration error
          if (errorMessage.includes("401 Unauthorized") || errorMessage.includes("Paystack")) {
            errorMessage = "Payment service is temporarily unavailable. Please contact support or try again later.";
          }
        } else if (paymentError?.message) {
          errorMessage = paymentError.message;
        } else if (paymentError?.response?.data?.detail) {
          errorMessage = paymentError.response.data.detail;
          if (errorMessage.includes("401 Unauthorized") || errorMessage.includes("Paystack")) {
            errorMessage = "Payment service is temporarily unavailable. Please contact support or try again later.";
          }
        }
        
        toast.error(errorMessage);
        // Still redirect to bookings page so user can see their booking
        router.push(`/user-dashboard/bookings`);
      }
    } catch (error: any) {
      console.error("Booking creation error:", error);
      const errorMessage = error?.message || error?.detail || error?.data?.message || "Failed to create booking. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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

  // Get today's date in YYYY-MM-DD format
  const getToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const today = getToday();
  
  // Validate date is not in the past
  const isValidDate = (dateString: string, minDate: string = today) => {
    if (!dateString) return false;
    return dateString >= minDate;
  };
  
  // Calculate minimum check-out date (day after check-in or today)
  const getMinCheckoutDate = () => {
    if (bookingData.checkIn) {
      const checkInDate = new Date(bookingData.checkIn);
      checkInDate.setDate(checkInDate.getDate() + 1);
      const year = checkInDate.getFullYear();
      const month = String(checkInDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkInDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return today;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black text-white">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-3xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4 sm:mb-6 mt-16">
            <button
              onClick={() => router.back()}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-all hover:scale-105 active:scale-95"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">Book Property</h1>
              <p className="text-white/50 text-xs mt-0.5">Complete your reservation in 3 simple steps</p>
            </div>
          </div>

          {/* Property Summary */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-5 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-xl mb-4 sm:mb-6 border border-white/10 shadow-lg hover:border-white/20 transition-all duration-300">
            <div className="relative w-full sm:w-32 h-32 sm:h-32 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
              <Image
                src={typeof property.images === 'string' ? property.images : property.images || house}
                alt={property.title}
                fill
                className="object-cover"
                unoptimized={typeof property.images === 'string' && property.images.startsWith('http')}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = house.src;
                }}
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h2 className="text-white font-semibold text-base sm:text-xl mb-1.5 sm:mb-2 line-clamp-2 leading-tight">
                  {property.title}
                </h2>
                <div className="flex items-center gap-1.5 text-white/60 text-xs mb-1.5 sm:mb-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#780991]" />
                  <span className="truncate">{property.location}</span>
                </div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-0.5">
                    {renderStars(property.rating)}
                  </div>
                  <span className="text-white/60 text-xs">
                    {property.rating.toFixed(1)} • {property.reviews} Review{property.reviews !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="bg-gradient-to-r from-[#FFD700] to-[#780991] bg-clip-text text-white/90 font-bold text-lg sm:text-2xl">
                ₦{property.price}
                </span>
                <span className="text-white/50 text-xs">per night</span>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-6 sm:mb-8 overflow-x-auto pb-3">
            <div className="flex items-center min-w-max">
              {[
                { number: 1, label: "Dates & Guests" },
                { number: 2, label: "Personal Info" },
                { number: 3, label: "Review & Confirm" },
              ].map((stepInfo, index) => (
                <div key={stepInfo.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold mb-1.5 transition-all duration-300 ${
                        step >= stepInfo.number
                          ? "bg-gradient-to-r from-[#FFD700] to-[#780991] text-white/90"
                          : "bg-white/20 text-white/50"
                      }`}
                    >
                      {step > stepInfo.number ? (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        stepInfo.number
                      )}
                    </div>
                    <span
                      className={`text-xs text-center text- px-1 ${
                        step >= stepInfo.number
                          ? "bg-gradient-to-r from-[#FFD700] to-[#780991] text-white/50 bg-clip-text text-transparent font-medium"
                          : "text-white/50"
                      }`}
                    >
                      {stepInfo.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <div
                      className={`w-12 sm:w-16 h-0.5 mx-2 sm:mx-3 mt-[-16px] transition-all duration-300 text-white ${
                        step > stepInfo.number ? "bg-gradient-to-r from-[#FFD700] to-[#780991]" : "bg-white/20"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-xl p-3 sm:p-6 mb-4 sm:mb-6 border border-white/10 shadow-lg">
            {step === 1 && (
              <div>
                <div className="mb-3 sm:mb-5">
                  <h3 className="text-white text-base sm:text-xl font-semibold mb-1">
                    Select Dates & Guests
                  </h3>
                  <p className="text-white/50 text-xs">Choose your check-in and check-out dates</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-white/80 text-xs sm:text-sm font-medium mb-1.5">
                      Check-in Date <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={bookingData.checkIn}
                        onChange={(e) => {
                          const selectedDate = e.target.value;
                          // Validate that the selected date is not in the past
                          if (selectedDate && isValidDate(selectedDate, today)) {
                            handleInputChange("checkIn", selectedDate);
                            // Reset check-out if it's before the new check-in
                            if (bookingData.checkOut && selectedDate && bookingData.checkOut <= selectedDate) {
                              handleInputChange("checkOut", "");
                            }
                          } else if (selectedDate) {
                            // If invalid date selected, show error and don't update
                            toast.error("Please select a date from today onwards");
                            e.target.value = bookingData.checkIn; // Reset to previous value
                          }
                        }}
                        min={today}
                        max="2099-12-31"
                        required
                        className="w-full p-2.5 sm:p-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 focus:border-[#FFD700] transition-all hover:border-white/30"
                      />
                      <Calendar className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/50 pointer-events-none" />
                    </div>
                    {bookingData.checkIn && (
                      <p className="text-white/40 text-xs mt-1">
                        {new Date(bookingData.checkIn).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-white/80 text-xs sm:text-sm font-medium mb-1.5">
                      Check-out Date <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={bookingData.checkOut}
                        onChange={(e) => {
                          const selectedDate = e.target.value;
                          const minCheckout = getMinCheckoutDate();
                          // Validate that the selected date is after check-in
                          if (selectedDate && isValidDate(selectedDate, minCheckout)) {
                            handleInputChange("checkOut", selectedDate);
                          } else if (selectedDate) {
                            // If invalid date selected, show error and don't update
                            toast.error("Check-out date must be after check-in date");
                            e.target.value = bookingData.checkOut; // Reset to previous value
                          }
                        }}
                        min={getMinCheckoutDate()}
                        max="2099-12-31"
                        disabled={!bookingData.checkIn}
                        required
                        className="w-full p-2.5 sm:p-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 focus:border-[#FFD700] transition-all hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <Calendar className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/50 pointer-events-none" />
                    </div>
                    {bookingData.checkOut && (
                      <p className="text-white/40 text-xs mt-1">
                        {new Date(bookingData.checkOut).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    )}
                    {!bookingData.checkIn && (
                      <p className="text-white/40 text-xs mt-1">
                        Select check-in first
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 sm:mt-4">
                  <label className="block text-white/80 text-xs sm:text-sm font-medium mb-1.5">
                    Number of Guests <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={bookingData.guests}
                      onChange={(e) =>
                        handleInputChange("guests", parseInt(e.target.value))
                      }
                      className="w-full p-2.5 sm:p-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 focus:border-[#FFD700] appearance-none transition-all hover:border-white/30 cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num} className="bg-[#1a1a1a]">
                          {num} Guest{num > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                    <Users className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/50 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="mb-3 sm:mb-5">
                  <h3 className="text-white text-base sm:text-xl font-semibold mb-1">
                    Personal Information
                  </h3>
                  <p className="text-white/50 text-xs">Please provide your contact details</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-white/80 text-xs sm:text-sm font-medium mb-1.5">
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={bookingData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      required
                      className="w-full p-2.5 sm:p-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 focus:border-[#FFD700] transition-all hover:border-white/30 placeholder:text-white/30"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-xs sm:text-sm font-medium mb-1.5">
                      Last Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={bookingData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      required
                      className="w-full p-2.5 sm:p-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 focus:border-[#FFD700] transition-all hover:border-white/30 placeholder:text-white/30"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="mt-3 sm:mt-4">
                  <label className="block text-white/80 text-xs sm:text-sm font-medium mb-1.5">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={bookingData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      required
                      className="w-full p-2.5 sm:p-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 focus:border-[#FFD700] transition-all hover:border-white/30 placeholder:text-white/30 pr-9 sm:pr-10"
                      placeholder="john.doe@example.com"
                    />
                    <Mail className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/50 pointer-events-none" />
                  </div>
                </div>
                <div className="mt-3 sm:mt-4">
                  <label className="block text-white/80 text-xs sm:text-sm font-medium mb-1.5">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={bookingData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      required
                      className="w-full p-2.5 sm:p-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 focus:border-[#FFD700] transition-all hover:border-white/30 placeholder:text-white/30 pr-9 sm:pr-10"
                      placeholder="+234 800 000 0000"
                    />
                    <Phone className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/50 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="mb-3 sm:mb-5">
                  <h3 className="text-white text-base sm:text-xl font-semibold mb-1">
                    Review & Confirm
                  </h3>
                  <p className="text-white/50 text-xs">Please review your booking details before confirming</p>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-5 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-lg border border-white/10 shadow-md">
                    <h4 className="text-white font-semibold text-sm sm:text-lg mb-2 sm:mb-3 flex items-center gap-2">
                      <div className="w-0.5 h-4 sm:h-5 bg-gradient-to-b from-[#FFD700] to-[#780991] rounded-full"></div>
                      Booking Summary
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs sm:text-sm py-2 border-b border-white/10">
                        <span className="text-white/60 font-medium">Check-in:</span>
                        <span className="text-white font-semibold text-right">
                          {bookingData.checkIn ? new Date(bookingData.checkIn).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          }) : "Not selected"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs sm:text-sm py-2 border-b border-white/10">
                        <span className="text-white/60 font-medium">Check-out:</span>
                        <span className="text-white font-semibold text-right">
                          {bookingData.checkOut ? new Date(bookingData.checkOut).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          }) : "Not selected"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs sm:text-sm py-2 border-b border-white/10">
                        <span className="text-white/60 font-medium">Duration:</span>
                        <span className="text-white font-semibold">
                          {bookingData.checkIn && bookingData.checkOut ? (
                            (() => {
                              const checkIn = new Date(bookingData.checkIn);
                              const checkOut = new Date(bookingData.checkOut);
                              const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              return `${diffDays} Night${diffDays > 1 ? 's' : ''}`;
                            })()
                          ) : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs sm:text-sm py-2 border-b border-white/10">
                        <span className="text-white/60 font-medium">Guests:</span>
                        <span className="text-white font-semibold">
                          {bookingData.guests} Guest
                          {bookingData.guests > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs sm:text-sm py-2 border-b border-white/10">
                        <span className="text-white/60 font-medium">Guest Name:</span>
                        <span className="text-white font-semibold text-right">
                          {bookingData.firstName} {bookingData.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between items-start text-xs sm:text-sm py-2 border-b border-white/10">
                        <span className="text-white/60 font-medium">Email:</span>
                        <span className="text-white font-semibold break-all text-right ml-4">{bookingData.email}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs sm:text-sm py-2">
                        <span className="text-white/60 font-medium">Phone:</span>
                        <span className="text-white font-semibold">{bookingData.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 text-xs sm:text-sm font-medium mb-1.5">
                      Special Requests <span className="text-white/40 text-xs">(Optional)</span>
                    </label>
                    <textarea
                      value={bookingData.specialRequests}
                      onChange={(e) =>
                        handleInputChange("specialRequests", e.target.value)
                      }
                      className="w-full p-2.5 sm:p-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 focus:border-[#FFD700] resize-none transition-all hover:border-white/30 placeholder:text-white/30"
                      rows={3}
                      placeholder="Any special requests, dietary requirements, or notes for the host..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-3 border-t border-white/10">
            <button
              onClick={step === 1 ? () => router.back() : handleBack}
              className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 text-white border border-white/20 rounded-lg hover:bg-white/10 hover:border-white/30 transition-all text-sm sm:text-base font-medium active:scale-95"
            >
              {step === 1 ? "Back to Property" : "Previous"}
            </button>
            <button
              onClick={step === 3 ? handleSubmit : handleNext}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:opacity-90 text-white font-semibold rounded-lg  transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor- active:scale-95"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : step === 3 ? (
                "Confirm & Pay"
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
