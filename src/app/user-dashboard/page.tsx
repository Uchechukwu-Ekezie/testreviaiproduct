"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiFetch, reviewsAPI, bookingAPI, propertiesAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Interfaces for type safety
interface Stats {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalSpent: number;
  reviews: number;
  averageRating: number;
}

interface Booking {
  id: string;
  property: string;
  type: string;
  status: string;
  date: string;
  location: string;
  price: number;
  image: string;
}

interface Review {
  id: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  rating: number;
  address: string;
  review_text: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  evidence: string | null;
  property: string | null;
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [currentTime, setCurrentTime] = useState("");
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
    reviews: 0,
    averageRating: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch reviews data using reviewsAPI with user ID
        let userReviews: Review[] = [];
        try {
          if (user?.id) {
            const apiReviews = await reviewsAPI.getUserReviews(user.id, 0, 100);
            // Transform API reviews to match local Review interface
            // API returns reviews with user as string, but we need user as object
            userReviews = (Array.isArray(apiReviews) ? apiReviews : (apiReviews as any)?.reviews || []).map((review: any) => ({
              id: review.id,
              user: typeof review.user === 'string' 
                ? { id: review.user, name: review.user_name || 'Unknown', email: review.user_email || '' }
                : review.user || { id: '', name: 'Unknown', email: '' },
              rating: review.rating,
              address: review.address || '',
              review_text: review.review_text || review.content || '',
              status: review.status || 'pending',
              created_at: review.created_at,
              updated_at: review.updated_at,
              evidence: review.evidence || null,
              property: review.property || review.property_id || null,
            }));
          }
        } catch (reviewError: any) {
          // If reviews endpoint fails, log but don't block dashboard
          console.warn("Failed to fetch reviews:", reviewError);
          // Check if it's a 422 or 404 error (endpoint might not be available)
          if (reviewError?.response?.status !== 422 && reviewError?.response?.status !== 404) {
            throw reviewError; // Re-throw if it's not a 422 or 404
          }
          // For 422/404, just use empty array
          userReviews = [];
        }
        
        // Fetch bookings data using bookingAPI
        let bookingsData: Booking[] = [];
        try {
          console.log("Fetching bookings for user:", user.id);
          const bookingsResponse = await bookingAPI.getMine({
            page: 1,
            page_size: 100,
          }) as any;
          
          console.log("Bookings API response:", bookingsResponse);
          console.log("Response type:", typeof bookingsResponse);
          console.log("Is array:", Array.isArray(bookingsResponse));
          console.log("Has bookings key:", bookingsResponse?.bookings);
          console.log("Has data key:", bookingsResponse?.data);
          
          // Handle paginated response or array response
          let rawBookings: any[] = [];
          
          if (Array.isArray(bookingsResponse)) {
            rawBookings = bookingsResponse;
          } else if (bookingsResponse?.bookings && Array.isArray(bookingsResponse.bookings)) {
            rawBookings = bookingsResponse.bookings;
          } else if (bookingsResponse?.data?.bookings && Array.isArray(bookingsResponse.data.bookings)) {
            rawBookings = bookingsResponse.data.bookings;
          } else if (bookingsResponse?.results && Array.isArray(bookingsResponse.results)) {
            rawBookings = bookingsResponse.results;
          } else {
            console.warn("Unexpected bookings response format:", bookingsResponse);
            rawBookings = [];
          }
          
          console.log("Raw bookings extracted:", rawBookings.length, rawBookings);
          
          // Transform booking data to match dashboard format
          // Use Promise.allSettled to prevent one failed property fetch from breaking all bookings
          const bookingPromises = rawBookings.map(async (booking: any) => {
            let propertyName = "Unknown Property";
            let propertyImage = "";
            let propertyLocation = "";
            
            // Try to fetch property data if property_booked_id exists
            if (booking.property_booked_id) {
              try {
                const propertyResponse = await propertiesAPI.getById(booking.property_booked_id) as any;
                const property = propertyResponse?.data || propertyResponse;
                if (property) {
                  propertyName = property.title || property.name || propertyName;
                  propertyImage = property.images?.[0]?.url || property.image_url || property.image || "";
                  propertyLocation = property.location || property.address || "";
                }
              } catch (propError) {
                console.warn(`Could not fetch property ${booking.property_booked_id}:`, propError);
                // Continue with default values
              }
            }
            
            return {
              id: booking.id,
              property: propertyName,
              type: booking.type || "booking",
              status: booking.status || "pending",
              date: booking.created_at ? new Date(booking.created_at).toLocaleDateString() : "",
              location: propertyLocation || booking.location || "",
              price: parseFloat(booking.total_amount || booking.price || "0"),
              image: propertyImage,
            };
          });
          
          const bookingResults = await Promise.allSettled(bookingPromises);
          bookingsData = bookingResults
            .filter((result): result is PromiseFulfilledResult<Booking> => result.status === 'fulfilled')
            .map(result => result.value);
          
          console.log("Transformed bookings data:", bookingsData.length, bookingsData);
        } catch (bookingError: any) {
          // If bookings endpoint fails, log but don't block dashboard
          console.error("Failed to fetch bookings:", bookingError);
          console.error("Error details:", {
            message: bookingError?.message,
            response: bookingError?.response,
            status: bookingError?.response?.status,
            data: bookingError?.response?.data,
          });
          bookingsData = [];
        }

        // Calculate stats from the data
        const calculatedStats: Stats = {
          totalBookings: bookingsData.length,
          pendingBookings: bookingsData.filter(booking => {
            const status = (booking.status || "").toLowerCase();
            return status.includes("pending") || status.includes("awaiting");
          }).length,
          completedBookings: bookingsData.filter(booking => {
            const status = (booking.status || "").toLowerCase();
            return status.includes("confirmed") || status.includes("completed") || status.includes("paid");
          }).length,
          totalSpent: bookingsData.reduce((sum, booking) => {
            const price = typeof booking.price === 'string' ? parseFloat(booking.price) : (booking.price || 0);
            return sum + price;
          }, 0),
          reviews: userReviews.length,
          averageRating: userReviews.length > 0 
            ? userReviews.reduce((sum: number, review: Review) => {
                // Handle rating as string or number
                const rating = typeof review.rating === 'string' ? parseFloat(review.rating) : (review.rating || 0);
                return sum + (isNaN(rating) ? 0 : rating);
              }, 0) / userReviews.length
            : 0,
        };

        console.log("Dashboard stats calculated:", {
          bookingsCount: bookingsData.length,
          reviewsCount: userReviews.length,
          stats: calculatedStats,
          bookingsData: bookingsData,
          userReviews: userReviews,
        });

        setStats(calculatedStats);
        setRecentBookings(bookingsData.slice(0, 2)); // Show only recent 2 bookings
        setRecentReviews(userReviews.slice(0, 2)); // Show only recent 2 reviews

      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        const errorMessage = "Failed to load dashboard data";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return (
      <div className="bg-[#222222] p-6 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
          <p className="text-gray-400">You need to be logged in to view your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#222222] p-6 text-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">
              Welcome back{user ? `, ${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}` : ''}! Here&#39;s your overview
            </p>
          </div>
          <div className="text-sm text-gray-400">{currentTime}</div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Loading dashboard...</span>
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

      {/* Stats Grid */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="p-6 border rounded-[15px] shadow-inner bg-[#212121] shadow-white/5 border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Bookings</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalBookings}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-[15px] flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
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
                </div>
              </div>
            </div>

            <div className="p-6 border rounded-[15px] shadow-inner bg-[#212121] shadow-white/5 border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pending Booking</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {stats.pendingBookings}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-[15px] flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="p-6 border rounded-[15px] shadow-inner bg-[#212121] shadow-white/5 border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completed Booking</p>
                  <p className="text-2xl font-bold text-green-400">
                    {stats.completedBookings}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-[15px] flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="p-6 border rounded-[15px] shadow-inner bg-[#212121] shadow-white/5 border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Reviews</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.reviews}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-[15px] flex items-center justify-center">
                  ({stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0'}★)
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Bookings */}
            <div className="bg-[#212121] rounded-[15px] shadow-inner shadow-white/5 border border-gray-700">
              <div className="p-6 border-b border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Recent Bookings
                  </h3>
                  <Link
                    href="/dashboard/bookings"
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    View All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentBookings.length > 0 ? (
                    recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center gap-4 p-4 border border-gray-700 rounded-[15px] bg-[#2a2a2a]"
                      >
                        <div className="w-16 h-16 bg-gray-600 rounded-[15px] overflow-hidden">
                          {booking.image ? (
                            <Image
                              src={booking.image}
                              alt={booking.property}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white">
                            {booking.property}
                          </h4>
                          <p className="text-sm text-gray-400">{booking.location}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                              {booking.type}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                booking.status === "Confirmed"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-orange-500/20 text-orange-400"
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">
                            ₦{booking.price.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-400">{booking.date}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-sm">
                        No recent bookings
                      </div>
                      <p className="text-gray-500 text-xs mt-1">
                        Your booking history will appear here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Reviews */}
            <div className="bg-[#212121] rounded-[15px] shadow-inner shadow-white/5 border border-gray-700">
              <div className="p-6 border-b border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Recent Reviews
                  </h3>
                  <Link
                    href="/dashboard/reviews"
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    View All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentReviews.length > 0 ? (
                    recentReviews.map((review) => (
                      <div
                        key={review.id}
                        className="p-4 border border-gray-700 rounded-[15px] bg-[#2a2a2a]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">
                            {review.address || 'Property Review'}
                          </h4>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "text-yellow-400"
                                    : "text-gray-500"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">
                          {review.review_text?.length > 100 
                            ? review.review_text.substring(0, 100) + '...'
                            : review.review_text}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            review.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            review.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {review.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-sm">
                        No reviews yet
                      </div>
                      <p className="text-gray-500 text-xs mt-1">
                        Start by reviewing a property
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}