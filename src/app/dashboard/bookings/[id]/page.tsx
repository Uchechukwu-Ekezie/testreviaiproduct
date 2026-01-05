"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { bookingAPI, propertiesAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "react-toastify";
import { Header } from "@/components/dashboard/header";
import { ArrowLeft, Calendar, MapPin, Users, Mail, Phone, DollarSign, CreditCard } from "lucide-react";

interface Booking {
  id: string;
  property_booked_id?: string;
  property?: any;
  status: string;
  created_at: string;
  updated_at: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  check_in_date?: string;
  check_out_date?: string;
  number_of_guests?: number;
  total_amount?: string;
  currency?: string;
  payment_reference?: string;
  paystack_reference?: string | null;
  payment_authorization_url?: string | null;
  paid_at?: string | null;
  special_requests?: string;
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState(false);

  const bookingId = params?.id as string;

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId || !isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch booking details
        const bookingResponse = await bookingAPI.getById(bookingId) as any;
        const bookingData = bookingResponse?.data || bookingResponse;
        setBooking(bookingData);

        // Fetch property details if property_booked_id exists
        if (bookingData?.property_booked_id) {
          try {
            const propertyResponse = await propertiesAPI.getById(bookingData.property_booked_id) as any;
            const propertyData = propertyResponse?.data || propertyResponse;
            setProperty(propertyData);
          } catch (propError) {
            console.warn("Could not fetch property:", propError);
          }
        }
      } catch (err: any) {
        console.error("Error fetching booking:", err);
        const errorMessage = err?.message || err?.detail || "Failed to load booking details";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, isAuthenticated]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!booking) return;
    
    if (!confirm(`Are you sure you want to update this booking status to ${newStatus}?`)) {
      return;
    }

    setProcessingStatus(true);
    try {
      await bookingAPI.updateStatus(booking.id, newStatus);
      toast.success("Booking status updated successfully");
      
      // Refresh booking data
      const bookingResponse = await bookingAPI.getById(bookingId) as any;
      const bookingData = bookingResponse?.data || bookingResponse;
      setBooking(bookingData);
    } catch (error: any) {
      console.error("Error updating booking status:", error);
      const errorMessage = error?.detail || error?.message || "Failed to update booking status";
      toast.error(errorMessage);
    } finally {
      setProcessingStatus(false);
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "Not specified";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return "Not specified";
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'pending' || statusLower === 'payment_initialized') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (statusLower === 'paid' || statusLower === 'confirmed') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (statusLower === 'cancelled') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (statusLower === 'completed') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-[#222222] min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
          <p className="text-gray-400">You need to be logged in to view booking details</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#222222] min-h-screen">
        <Header title="Booking Details" />
        <div className="ml-64 p-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading booking details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="bg-[#222222] min-h-screen">
        <Header title="Booking Details" />
        <div className="ml-64 p-8">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error || "Booking not found"}</p>
          </div>
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  // Get property image
  let propertyImage: string | null = null;
  if (property) {
    if (property.image_urls && Array.isArray(property.image_urls) && property.image_urls.length > 0) {
      const primaryImage = property.image_urls.find((img: any) => img.is_primary) || property.image_urls[0];
      propertyImage = primaryImage.url || primaryImage.image_url || null;
    } else if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      const primaryImage = property.images.find((img: any) => img.is_primary) || property.images[0];
      propertyImage = primaryImage.image_url || primaryImage.url || null;
    } else if (property.image_url) {
      propertyImage = property.image_url;
    }
  }

  return (
    <div className="bg-[#222222] min-h-screen">
      <Header title="Booking Details" />
      <div className="ml-6 p-8">
        {/* Back Button */}
        <Link
          href="/dashboard/bookings"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Booking Details</h1>
              <p className="text-gray-400">Booking ID: {booking.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-lg border font-medium ${getStatusColor(booking.status)}`}>
                {booking.status || 'Unknown'}
              </span>
              {booking.status?.toLowerCase() !== "cancelled" && 
               booking.status?.toLowerCase() !== "completed" && (
                <button
                  onClick={() => {
                    if (booking.status?.toLowerCase() === "paid") {
                      handleUpdateStatus("confirmed");
                    } else if (booking.status?.toLowerCase() === "confirmed") {
                      handleUpdateStatus("completed");
                    }
                  }}
                  disabled={processingStatus}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors disabled:opacity-50"
                >
                  {processingStatus ? "Processing..." : 
                   booking.status?.toLowerCase() === "paid" ? "Confirm Booking" : 
                   booking.status?.toLowerCase() === "confirmed" ? "Mark Complete" : 
                   "Update Status"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Information */}
            {property && (
              <div className="bg-[#212121] border border-gray-700 rounded-lg overflow-hidden">
                <div className="h-64 relative bg-gradient-to-br from-blue-400 to-blue-600">
                  {propertyImage ? (
                    <Image
                      src={propertyImage}
                      alt={property.title || 'Property'}
                      fill
                      className="object-cover"
                      unoptimized={propertyImage.startsWith('http')}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-2">{property.title || 'Property'}</h2>
                  {property.address && (
                    <div className="flex items-center gap-2 text-gray-400 mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>{property.address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Booking Dates */}
            <div className="bg-[#212121] border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Booking Dates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Check-in Date</p>
                  <p className="text-white font-medium">{formatDate(booking.check_in_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Check-out Date</p>
                  <p className="text-white font-medium">{formatDate(booking.check_out_date)}</p>
                </div>
                {booking.number_of_guests && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Number of Guests</p>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {booking.number_of_guests} {booking.number_of_guests === 1 ? 'Guest' : 'Guests'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Guest Information */}
            <div className="bg-[#212121] border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Guest Information</h3>
              <div className="space-y-4">
                {booking.guest_name && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Guest Name</p>
                    <p className="text-white font-medium">{booking.guest_name}</p>
                  </div>
                )}
                {booking.guest_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Email</p>
                      <p className="text-white font-medium">{booking.guest_email}</p>
                    </div>
                  </div>
                )}
                {booking.guest_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Phone</p>
                      <p className="text-white font-medium">{booking.guest_phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Special Requests */}
            {booking.special_requests && (
              <div className="bg-[#212121] border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Special Requests</h3>
                <p className="text-gray-300">{booking.special_requests}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Information */}
            <div className="bg-[#212121] border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment Information
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-white">
                    {booking.currency || 'NGN'} {booking.total_amount ? parseFloat(booking.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </p>
                </div>
                {booking.payment_reference && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Payment Reference</p>
                    <p className="text-white font-mono text-sm">{booking.payment_reference}</p>
                  </div>
                )}
                {booking.paystack_reference && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Paystack Reference</p>
                    <p className="text-white font-mono text-sm">{booking.paystack_reference}</p>
                  </div>
                )}
                {booking.paid_at && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Paid At</p>
                    <p className="text-white">{formatDateTime(booking.paid_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Timeline */}
            <div className="bg-[#212121] border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Created</p>
                  <p className="text-white">{formatDateTime(booking.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Last Updated</p>
                  <p className="text-white">{formatDateTime(booking.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

