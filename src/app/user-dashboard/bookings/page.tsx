"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { bookingAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "react-toastify";

// Interfaces for type safety
interface Booking {
  id: string;
  property: string | {
    id: string;
    title: string;
    address: string;
    image_url?: string;
  };
  type: string;
  status: string;
  date: string;
  created_at: string;
  updated_at: string;
  location?: string;
  price: number;
  landlord?: string;
  image?: string;
  category?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

const sortOptions = [
  { value: "upcoming", label: "Upcoming first" },
  { value: "recent", label: "Most recent" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "price-low", label: "Price: Low to High" },
];

const typeOptions = [
  { value: "all", label: "All Types" },
  { value: "consultation", label: "Consultation" },
  { value: "shortlet", label: "Shortlet" },
  { value: "inspection", label: "Inspection" },
];

export default function Bookings() {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterType, setFilterType] = useState("all");
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);

  // Fetch bookings data
  useEffect(() => {
    const fetchBookings = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch bookings from API
        const response = await bookingAPI.getMine({
          page: 1,
          page_size: 100,
        }) as any;
        
        // Handle paginated response or array response
        const bookingsData = response?.bookings || response || [];
        setBookings(bookingsData);

      } catch (err: any) {
        console.error("Error fetching bookings:", err);
        // If endpoint doesn't exist, show empty state instead of error
        if (err.message?.includes('404') || err.message?.includes('Not Found')) {
          setBookings([]);
          setError(null);
        } else {
          setError("Failed to load bookings");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated, user]);

  // Transform booking data to ensure consistency
  const transformedBookings = bookings.map(booking => ({
    ...booking,
    property: typeof booking.property === 'string' 
      ? booking.property 
      : booking.property?.title || 'Unknown Property',
    location: booking.location || 
              (typeof booking.property === 'object' ? booking.property.address : '') || 
              'Location not specified',
    image: booking.image || 
           (typeof booking.property === 'object' ? booking.property.image_url : '') || 
           null,
    category: getCategoryFromStatus(booking.status),
    date: formatDate(booking.date || booking.created_at),
  }));

  // Helper function to categorize bookings based on status
  function getCategoryFromStatus(status: string): string {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('confirmed') || lowerStatus.includes('completed')) {
      return 'successful';
    } else if (lowerStatus.includes('pending') || lowerStatus.includes('awaiting')) {
      return 'pending';
    } else if (lowerStatus.includes('cancelled') || lowerStatus.includes('rejected')) {
      return 'failed';
    }
    return 'pending';
  }

  // Helper function to format date
  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  // Calculate tab counts
  const tabs = [
    { id: "all", label: "All", count: transformedBookings.length },
    {
      id: "pending",
      label: "Pending",
      count: transformedBookings.filter((b) => b.category === "pending").length,
    },
    {
      id: "successful",
      label: "Successful",
      count: transformedBookings.filter((b) => b.category === "successful").length,
    },
    {
      id: "failed",
      label: "Failed",
      count: transformedBookings.filter((b) => b.category === "failed").length,
    },
  ];

  const filteredBookings = transformedBookings.filter((booking) => {
    // Filter by tab
    if (activeTab !== "all" && booking.category !== activeTab) return false;

    // Filter by search query
    if (
      searchQuery &&
      !booking.property.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !booking.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;

    // Filter by type
    if (filterType !== "all" && booking.type.toLowerCase() !== filterType)
      return false;

    return true;
  }).sort((a, b) => {
    // Sort logic
    switch (sortBy) {
      case "recent":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "upcoming":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "price-high":
        return b.price - a.price;
      case "price-low":
        return a.price - b.price;
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('confirmed')) {
      return "bg-green-500/20 text-green-400";
    } else if (lowerStatus.includes('awaiting') || lowerStatus.includes('pending')) {
      return "bg-orange-500/20 text-orange-400";
    } else if (lowerStatus.includes('cancelled') || lowerStatus.includes('rejected')) {
      return "bg-red-500/20 text-red-400";
    } else if (lowerStatus.includes('completed')) {
      return "bg-blue-500/20 text-blue-400";
    }
    return "bg-gray-500/20 text-gray-400";
  };

  const getTypeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('consultation')) {
      return "bg-blue-500/20 text-blue-400";
    } else if (lowerType.includes('shortlet')) {
      return "bg-purple-500/20 text-purple-400";
    } else if (lowerType.includes('inspection')) {
      return "bg-yellow-500/20 text-yellow-400";
    }
    return "bg-gray-500/20 text-gray-400";
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    setProcessingBooking(bookingId);
    try {
      await bookingAPI.cancel(bookingId);
      toast.success("Booking cancelled successfully");
      // Refresh bookings list
      const response = await bookingAPI.getMine({
        page: 1,
        page_size: 100,
      }) as any;
      const bookingsData = response?.bookings || response || [];
      setBookings(bookingsData);
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      toast.error(error.message || "Failed to cancel booking");
    } finally {
      setProcessingBooking(null);
    }
  };

  const handlePayBooking = async (bookingId: string) => {
    setProcessingBooking(bookingId);
    try {
      const paymentResponse = await bookingAPI.initializePayment(bookingId) as any;
      
      if (paymentResponse?.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = paymentResponse.authorization_url;
      } else {
        toast.error("Failed to initialize payment");
      }
    } catch (error: any) {
      console.error("Error initializing payment:", error);
      toast.error(error.message || "Failed to initialize payment");
      setProcessingBooking(null);
    }
  };

  const handleViewDetails = (bookingId: string) => {
    // Navigate to booking details page or show modal
    // For now, just show a toast
    toast.info("Booking details feature coming soon");
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-[#222222] p-6 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
          <p className="text-gray-400">You need to be logged in to view your bookings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#222222] p-6 text-white min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="flex items-center text-gray-400 hover:text-white mb-4"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-white">Bookings</h1>
        <p className="text-gray-400 mt-1">Manage your property bookings and appointments</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Loading bookings...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-[15px] p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Tabs */}
          <div className="flex space-x-1 bg-[#2a2a2a] p-1 rounded-[15px] mb-6 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-[12px] text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#212121] text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex w-[40%] relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by property or location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#212121] border border-gray-600 rounded-[15px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-[#212121] border border-gray-600 rounded-[15px] focus:ring-2 focus:border-transparent text-white"
            >
              {typeOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-[#212121] text-white"
                >
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-[#212121] border border-gray-600 rounded-[15px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            >
              {sortOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-[#212121] text-white"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bookings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-[#212121] rounded-[15px] shadow-inner shadow-white/5 border border-gray-700 overflow-hidden"
              >
                <div className="flex h-[220px]">
                  {/* Property Image */}
                  <div className="w-[160px] h-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0">
                    {booking.image ? (
                      <Image
                        src={booking.image}
                        alt={booking.property}
                        width={160}
                        height={220}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white text-sm">
                        {booking.property}
                      </h3>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(
                          booking.type
                        )}`}
                      >
                        {booking.type}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {booking.date}
                      </div>

                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {booking.location}
                      </div>

                      {booking.landlord && (
                        <div className="text-xs text-gray-500">
                          Landlord/Agent: {booking.landlord}
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-3 flex items-start w-full gap-2 mt-3 md:ml-[-20px] flex-wrap">
                      {booking.status?.toLowerCase() === "pending" && (
                        <button
                          onClick={() => handlePayBooking(booking.id)}
                          disabled={processingBooking === booking.id}
                          className="px-3 bg-[#373737] py-1 text-sm text-green-400 hover:text-green-300 rounded-[15px] disabled:opacity-50"
                        >
                          {processingBooking === booking.id ? "Processing..." : "Pay Now"}
                        </button>
                      )}
                      {booking.status?.toLowerCase() !== "cancelled" && 
                       booking.status?.toLowerCase() !== "completed" && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={processingBooking === booking.id}
                          className="px-3 bg-[#373737] py-1 text-sm text-red-400 hover:text-red-300 rounded-[15px] disabled:opacity-50"
                        >
                          {processingBooking === booking.id ? "Processing..." : "Cancel"}
                        </button>
                      )}
                      <button
                        onClick={() => handleViewDetails(booking.id)}
                        className="px-3 bg-[#373737] py-1 text-sm text-blue-400 hover:text-blue-300 ml-auto rounded-[15px]"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-white">
                No bookings found
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : "You haven't made any bookings yet"}
              </p>
              <div className="mt-6">
                <Link
                  href="/"
                  className="px-4 py-2 bg-blue-600 text-white rounded-[15px] hover:bg-blue-700"
                >
                  Browse Properties
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}