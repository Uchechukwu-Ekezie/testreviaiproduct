"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { bookingAPI, propertiesAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "react-toastify";
import { Header } from "@/components/dashboard/header";

// Interfaces for type safety
interface Booking {
  id: string;
  property_booked_id?: string;
  property?: string | {
    id: string;
    title: string;
    address: string;
    image_url?: string;
    image_urls?: Array<{
      url?: string;
      image_url?: string;
      is_primary?: boolean;
    }>;
    images?: Array<{
      url?: string;
      image_url?: string;
    }>;
  };
  type?: string;
  status: string;
  date?: string;
  created_at: string;
  updated_at: string;
  location?: string;
  price?: number | string;
  total_amount?: string;
  currency?: string;
  landlord?: string;
  image?: string;
  category?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  check_in_date?: string;
  check_out_date?: string;
  number_of_guests?: number;
  payment_authorization_url?: string | null;
  payment_reference?: string;
  paystack_reference?: string | null;
  booked_by_id?: string;
}

const sortOptions = [
  { value: "upcoming", label: "Upcoming first" },
  { value: "recent", label: "Most recent" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "price-low", label: "Price: Low to High" },
];

export default function AgentBookings() {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);
  const [propertyCache, setPropertyCache] = useState<Record<string, any>>({});

  // Fetch bookings data
  useEffect(() => {
    const fetchBookings = async () => {
      if (!isAuthenticated || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch agent bookings from API
        const response = await bookingAPI.getAgentBookings(user.id, {
          page: 1,
          page_size: 100,
        }) as any;
        
        // Handle paginated response or array response
        const bookingsData = response?.bookings || response?.data?.bookings || response?.results || [];
        
        // Fetch property data for each booking
        const bookingsWithProperties = await Promise.all(
          bookingsData.map(async (booking: Booking) => {
            if (!booking.property_booked_id) {
              return booking;
            }

            // Check cache first
            if (propertyCache[booking.property_booked_id]) {
              return {
                ...booking,
                property: propertyCache[booking.property_booked_id],
              };
            }

            try {
              // Fetch property data
              const propertyResponse = await propertiesAPI.getById(booking.property_booked_id) as any;
              const property = propertyResponse?.data || propertyResponse;
              
              if (property) {
                // Cache the property
                setPropertyCache(prev => ({
                  ...prev,
                  [booking.property_booked_id!]: property,
                }));
                
                return {
                  ...booking,
                  property: property,
                };
              }
            } catch (propError) {
              console.error(`Error fetching property ${booking.property_booked_id}:`, propError);
              // Continue with booking even if property fetch fails
            }

            return booking;
          })
        );

        setBookings(bookingsWithProperties);

      } catch (err: any) {
        console.error("Error fetching bookings:", err);
        const errorMessage = err?.message || err?.detail || "Failed to load bookings";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated, user?.id, propertyCache]);

  // Helper function to format dates
  const formatDate = (dateString: string): string => {
    if (!dateString) return "Date not available";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Transform bookings for display
  const transformedBookings = bookings.map((booking) => {
    let propertyTitle = "Unknown Property";
    let propertyAddress = "Location not specified";
    let propertyImage: string | null = null;

    if (typeof booking.property === 'object' && booking.property) {
      propertyTitle = booking.property.title || 'Unknown Property';
      propertyAddress = booking.property.address || 'Location not specified';
      
      // Get image from various possible formats
      if (booking.property.image_urls && Array.isArray(booking.property.image_urls) && booking.property.image_urls.length > 0) {
        const primaryImage = booking.property.image_urls.find((img: any) => img.is_primary) || booking.property.image_urls[0];
        propertyImage = primaryImage.url || primaryImage.image_url || null;
      } else if (booking.property.images && Array.isArray(booking.property.images) && booking.property.images.length > 0) {
        const primaryImage = booking.property.images.find((img: any) => img.is_primary) || booking.property.images[0];
        propertyImage = primaryImage.image_url || primaryImage.url || null;
      } else if (booking.property.image_url) {
        propertyImage = booking.property.image_url;
      }
    } else if (typeof booking.property === 'string') {
      propertyTitle = booking.property;
    }

    return {
      ...booking,
      property: propertyTitle,
      location: booking.location || propertyAddress,
      image: booking.image || propertyImage,
      date: formatDate(booking.created_at),
      type: booking.type || 'booking',
      price: booking.total_amount || booking.price || 0,
    };
  });

  // Helper function to categorize bookings based on status
  const getCategoryFromStatus = (status: string): string => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'pending' || statusLower === 'payment_initialized') return 'pending';
    if (statusLower === 'paid' || statusLower === 'confirmed') return 'confirmed';
    if (statusLower === 'cancelled') return 'cancelled';
    if (statusLower === 'completed') return 'completed';
    return 'other';
  };

  // Filter bookings by tab
  const getFilteredByTab = () => {
    if (activeTab === "all") return transformedBookings;
    return transformedBookings.filter((booking) => {
      const category = getCategoryFromStatus(booking.status);
      return category === activeTab;
    });
  };

  // Filter and sort bookings
  const filteredBookings = getFilteredByTab()
    .filter((booking) => {
      const matchesSearch =
        booking.property?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.guest_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "upcoming":
          if (!a.check_in_date || !b.check_in_date) return 0;
          return new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime();
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "price-high":
          const priceA = typeof a.price === 'string' ? parseFloat(a.price) : (a.price as number) || 0;
          const priceB = typeof b.price === 'string' ? parseFloat(b.price) : (b.price as number) || 0;
          return priceB - priceA;
        case "price-low":
          const priceALow = typeof a.price === 'string' ? parseFloat(a.price) : (a.price as number) || 0;
          const priceBLow = typeof b.price === 'string' ? parseFloat(b.price) : (b.price as number) || 0;
          return priceALow - priceBLow;
        default:
          return 0;
      }
    });

  // Calculate tab counts
  const tabs = [
    { id: "all", label: "All", count: transformedBookings.length },
    { id: "pending", label: "Pending", count: transformedBookings.filter(b => getCategoryFromStatus(b.status) === 'pending').length },
    { id: "confirmed", label: "Confirmed", count: transformedBookings.filter(b => getCategoryFromStatus(b.status) === 'confirmed').length },
    { id: "completed", label: "Completed", count: transformedBookings.filter(b => getCategoryFromStatus(b.status) === 'completed').length },
    { id: "cancelled", label: "Cancelled", count: transformedBookings.filter(b => getCategoryFromStatus(b.status) === 'cancelled').length },
  ];

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'pending' || statusLower === 'payment_initialized') return 'bg-yellow-500/20 text-yellow-400';
    if (statusLower === 'paid' || statusLower === 'confirmed') return 'bg-green-500/20 text-green-400';
    if (statusLower === 'cancelled') return 'bg-red-500/20 text-red-400';
    if (statusLower === 'completed') return 'bg-blue-500/20 text-blue-400';
    return 'bg-gray-500/20 text-gray-400';
  };

  const getTypeColor = (type: string) => {
    if (!type) return 'bg-gray-500/20 text-gray-400';
    const typeLower = type.toLowerCase();
    if (typeLower.includes('shortlet')) return 'bg-purple-500/20 text-purple-400';
    if (typeLower.includes('consultation')) return 'bg-blue-500/20 text-blue-400';
    if (typeLower.includes('inspection')) return 'bg-orange-500/20 text-orange-400';
    return 'bg-gray-500/20 text-gray-400';
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to update this booking status to ${newStatus}?`)) {
      return;
    }

    setProcessingBooking(bookingId);
    try {
      await bookingAPI.updateStatus(bookingId, newStatus);
      toast.success("Booking status updated successfully");
      
      // Refresh bookings list
      const response = await bookingAPI.getAgentBookings(user!.id, {
        page: 1,
        page_size: 100,
      }) as any;
      const bookingsData = response?.bookings || response?.data?.bookings || response?.results || [];
      
      // Update bookings with cached properties
      const updatedBookings = bookingsData.map((booking: Booking) => {
        if (booking.property_booked_id && propertyCache[booking.property_booked_id]) {
          return {
            ...booking,
            property: propertyCache[booking.property_booked_id],
          };
        }
        return booking;
      });
      
      setBookings(updatedBookings);
    } catch (error: any) {
      console.error("Error updating booking status:", error);
      const errorMessage = error?.detail || error?.message || "Failed to update booking status";
      toast.error(errorMessage);
    } finally {
      setProcessingBooking(null);
    }
  };

  const handleViewDetails = (bookingId: string) => {
    // Navigate to booking details page or show modal
    toast.info("Booking details feature coming soon");
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-[#222222] p-6 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
          <p className="text-gray-400">You need to be logged in to view bookings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#222222] text-white">
      <Header title="Agent Bookings" />

      <main className="p-6">
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
          <h1 className="text-2xl font-bold text-white">Property Bookings</h1>
          <p className="text-gray-400 mt-1">Manage bookings for your properties</p>
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
              <div className="flex w-full sm:w-[40%] relative">
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
                  placeholder="Search by property, location, or guest name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#212121] border border-gray-600 rounded-[15px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                />
              </div>

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
            {filteredBookings.length === 0 ? (
              <div className="bg-[#212121] rounded-[15px] border border-gray-700 p-12 text-center">
                <p className="text-gray-400 text-lg mb-2">No bookings found</p>
                <p className="text-gray-500 text-sm">
                  {searchQuery || activeTab !== "all"
                    ? "Try adjusting your filters"
                    : "You don't have any bookings yet"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-[#212121] rounded-[15px] shadow-inner shadow-white/5 border border-gray-700 overflow-hidden flex flex-col"
                  >
                    <div className="flex min-h-[220px] flex-shrink-0">
                      {/* Property Image */}
                      <div className="w-[160px] h-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 relative overflow-hidden">
                        {booking.image ? (
                          <Image
                            src={booking.image}
                            alt={booking.property || 'Property image'}
                            fill
                            className="object-cover"
                            unoptimized={booking.image.startsWith('http')}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <svg
                              className="w-12 h-12 text-white/50"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4 flex flex-col min-w-0 relative">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-white text-sm line-clamp-2">
                            {booking.property}
                          </h3>
                        </div>

                        <div className="flex gap-2 mb-3 flex-wrap">
                          {booking.status && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                                booking.status
                              )}`}
                            >
                              {booking.status}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 text-xs text-gray-400 flex-1">
                          {/* Guest Name */}
                          {booking.guest_name && (
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 mr-2 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              <span className="font-medium text-gray-300">Guest:</span>
                              <span className="ml-1">{booking.guest_name}</span>
                            </div>
                          )}

                          {/* Guest Email */}
                          {booking.guest_email && (
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 mr-2 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="line-clamp-1 text-xs">{booking.guest_email}</span>
                            </div>
                          )}

                          {/* Check-in Date */}
                          {booking.check_in_date && (
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 mr-2 flex-shrink-0"
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
                              <span className="font-medium text-gray-300">Check-in:</span>
                              <span className="ml-1">{new Date(booking.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          )}

                          {/* Check-out Date */}
                          {booking.check_out_date && (
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 mr-2 flex-shrink-0"
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
                              <span className="font-medium text-gray-300">Check-out:</span>
                              <span className="ml-1">{new Date(booking.check_out_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          )}

                          {/* Number of Guests */}
                          {booking.number_of_guests && (
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 mr-2 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                              <span>{booking.number_of_guests} {booking.number_of_guests === 1 ? 'Guest' : 'Guests'}</span>
                            </div>
                          )}

                          {/* Location */}
                          {booking.location && (
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 mr-2 flex-shrink-0"
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
                              <span className="line-clamp-1">{booking.location}</span>
                            </div>
                          )}

                          {/* Total Amount */}
                          {booking.total_amount && (
                            <div className="flex items-center pt-1 border-t border-gray-700">
                              <svg
                                className="w-4 h-4 mr-2 flex-shrink-0 text-green-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="font-semibold text-white text-sm">
                                {booking.currency || 'NGN'} {parseFloat(booking.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="px-4 py-3 flex items-center w-full gap-2 border-t border-gray-700 pt-3 flex-wrap relative z-10 bg-[#212121]">
                          {/* Update Status Button for Agent */}
                          {booking.status?.toLowerCase() !== "cancelled" && 
                           booking.status?.toLowerCase() !== "completed" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (booking.status?.toLowerCase() === "paid") {
                                  handleUpdateStatus(booking.id, "confirmed");
                                } else if (booking.status?.toLowerCase() === "confirmed") {
                                  handleUpdateStatus(booking.id, "completed");
                                }
                              }}
                              disabled={processingBooking === booking.id}
                              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 text-sm font-medium rounded-[10px] disabled:opacity-50 transition-colors cursor-pointer relative z-20"
                            >
                              {processingBooking === booking.id ? "Processing..." : 
                               booking.status?.toLowerCase() === "paid" ? "Confirm" : 
                               booking.status?.toLowerCase() === "confirmed" ? "Mark Complete" : 
                               "Update Status"}
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleViewDetails(booking.id);
                            }}
                            className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 hover:text-gray-300 text-sm font-medium rounded-[10px] transition-colors ml-auto cursor-pointer relative z-20"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

