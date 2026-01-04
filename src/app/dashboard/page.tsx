"use client";
import { useState, useEffect } from "react";
import {
  TrendingUp,
  Building2,
  Star,
  DollarSign,
  Eye,
  Search,
  Plus,
  Loader2,
} from "lucide-react";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useProperties } from "@/contexts/properties-context";
import { Header } from "@/components/dashboard/header";

// Sample data for the chart - you can later replace this with real analytics data

// Custom tooltip component for the chart

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { properties, isLoading, error, fetchPropertiesByUserId } =
    useProperties();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [filterVerified, setFilterVerified] = useState("All");

  // Fetch user's properties on component mount
  useEffect(() => {
    if (user?.id) {
      // Add a small delay to ensure this runs after the initial general fetch
      const timeoutId = setTimeout(() => {
        fetchPropertiesByUserId(user.id!);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user?.id, fetchPropertiesByUserId]);

  // Calculate dashboard statistics from real data
  const dashboardStats = {
    totalProperties: properties.length,
    totalBookings: 0, // You'll need to add booking data from API
    newBookings: 0, // You'll need to add booking data from API
    totalRevenue: 0, // You'll need to add revenue data from API
    forRentProperties: properties.filter((p) => p.status === "for_rent").length,
    forSaleProperties: properties.filter((p) => p.status === "for_sale").length,
    visibleProperties: properties.filter(
      (p) => p.visibility_status === "visible"
    ).length,
  };

  // Get recent properties (limit to 5 for dashboard)
  const recentProperties = properties.slice(0, 5);

  // Filter properties based on search and filters
  const filteredProperties = recentProperties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatusFilter =
      filterStatus === "All Status" || property.status === filterStatus;
    const matchesVerifiedFilter =
      filterVerified === "All" ||
      (filterVerified === "Visible" &&
        property.visibility_status === "visible") ||
      (filterVerified === "Hidden" &&
        property.visibility_status === "not_visible");

    return matchesSearch && matchesStatusFilter && matchesVerifiedFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "for_rent":
        return "text-green-500";
      case "for_sale":
        return "text-blue-500";
      case "just_listing":
        return "text-orange-500";
      default:
        return "text-gray-400";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "for_rent":
        return "bg-green-500";
      case "for_sale":
        return "bg-blue-500";
      case "just_listing":
        return "bg-orange-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "for_rent":
        return "For Rent";
      case "for_sale":
        return "For Sale";
      case "just_listing":
        return "Just Listing";
      default:
        return status;
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case "apartment":
        return "Apartment";
      case "house":
        return "House";
      case "condo":
        return "Condo";
      case "land":
        return "Land";
      default:
        return type;
    }
  };

  const formatPrice = (price: string | undefined) => {
    if (!price) return "Not specified";
    if (price.includes("₦") || price.includes("$")) return price;
    const numPrice = parseFloat(price.replace(/[^0-9.]/g, ""));
    return isNaN(numPrice) ? price : `₦${numPrice.toLocaleString()}`;
  };

  const getLocationDisplay = (property: any) => {
    const parts = [];
    if (property.city) parts.push(property.city);
    if (property.state) parts.push(property.state);
    if (parts.length === 0 && property.address) {
      const addressParts = property.address.split(",");
      return addressParts[0].trim();
    }
    return parts.join(", ") || "Location not specified";
  };

  const handleViewProperty = (propertyId: string) => {
    router.push(`/dashboard/properties/${propertyId}`);
  };

  const handleAddProperty = () => {
    router.push("/dashboard/properties/add");
  };

  const handleViewAllProperties = () => {
    router.push("/dashboard/properties");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setFilterStatus(e.target.value);
  };

  const handleVerifiedFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setFilterVerified(e.target.value);
  };

  return (
    <div className="min-h-screen bg-[#222222] text-white">
      <Header title="Dashboard" />

      <main className="p-6">
        {/* Dashboard Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 border rounded-[15px] shadow-inner bg-[#212121] shadow-white/5 border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400">
                Total Properties
              </h3>
              <Building2 className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-3">
                <p className="text-2xl font-bold">
                  {dashboardStats.totalProperties}
                </p>
                <p className="text-sm text-white">
                  {dashboardStats.visibleProperties} visible •{" "}
                  {dashboardStats.forRentProperties} for rent
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border rounded-[15px] shadow-inner bg-[#212121] shadow-white/5 border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400">For Sale</h3>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-3">
                <p className="text-2xl font-bold">
                  {dashboardStats.forSaleProperties}
                </p>
                <p className="text-sm text-white">Properties for sale</p>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/bookings"
            className="p-6 border rounded-[15px] shadow-inner bg-[#212121] shadow-white/5 border-[#2a2a2a] hover:border-blue-500/50 transition-colors cursor-pointer block"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400">
                Total Bookings
              </h3>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-3">
                <p className="text-2xl font-bold">
                  {dashboardStats.totalBookings}
                </p>
                <p className="text-sm text-white hover:text-blue-400 transition-colors">
                  View all bookings →
                </p>
              </div>
            </div>
          </Link>

          <div className="p-6 border rounded-[15px] shadow-inner bg-[#212121] shadow-white/5 border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400">
                Total Revenue
              </h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-3">
                <p className="text-2xl font-bold">
                  ₦{dashboardStats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-white">Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Section */}
        <div className="flex flex-col px-6 pt-4 my-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Recent Properties</h2>
              <span className="text-sm text-gray-400">
                ({properties.length} total)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddProperty}
                className="text-sm text-gray-400 bg-[#373737] rounded-[15px] px-3 py-1 hover:bg-[#780991] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
              <button
                onClick={handleViewAllProperties}
                className="text-sm text-blue-400 transition-colors hover:text-blue-300"
              >
                View All
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-5">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Search property..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-[35vw] rounded-[15px] border border-[#2A2A2A] bg-transparent py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#780991]"
              />
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={handleStatusFilterChange}
                className="w-[23vw] rounded-[15px] border border-[#2A2A2A] bg-[#222222] py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#780991] cursor-pointer"
              >
                <option value="All Status">All Status</option>
                <option value="for_rent">For Rent</option>
                <option value="for_sale">For Sale</option>
                <option value="just_listing">Just Listing</option>
              </select>
            </div>

            <div>
              <select
                value={filterVerified}
                onChange={handleVerifiedFilterChange}
                className="w-[23vw] rounded-[15px] border border-[#2A2A2A] bg-[#222222] py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#780991] cursor-pointer"
              >
                <option value="All">All</option>
                <option value="Visible">Visible</option>
                <option value="Hidden">Hidden</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[#212121] rounded-[15px] border border-[#2a2a2a] p-6 shadow-inner">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#780991]" />
              <span className="ml-2 text-gray-400">Loading properties...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <div className="mb-2 text-red-500">Error loading properties</div>
              <div className="text-sm text-gray-400">{error}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="py-3 font-medium text-left text-gray-400">
                      Property Name
                    </th>
                    <th className="py-3 font-medium text-left text-gray-400">
                      Location
                    </th>
                    <th className="py-3 font-medium text-left text-gray-400">
                      Type
                    </th>
                    <th className="py-3 font-medium text-left text-gray-400">
                      Status
                    </th>
                    <th className="py-3 font-medium text-left text-gray-400">
                      Price
                    </th>
                    <th className="py-3 font-medium text-left text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.length > 0 ? (
                    filteredProperties.map((property) => (
                      <tr
                        key={property.id}
                        className="border-b border-[#2a2a2a] hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-4">
                          <div className="font-medium">{property.title}</div>
                          <div className="mt-1 text-sm text-gray-500">
                            {getPropertyTypeLabel(property.property_type)} •{" "}
                            {property.bedrooms
                              ? `${property.bedrooms} bed`
                              : "N/A"}
                          </div>
                        </td>
                        <td className="py-4 text-gray-400">
                          {getLocationDisplay(property)}
                        </td>
                        <td className="py-4">
                          <span className="text-gray-300 capitalize">
                            {getPropertyTypeLabel(property.property_type)}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${getStatusDot(
                                property.status
                              )}`}
                            ></div>
                            <span className={getStatusColor(property.status)}>
                              {getStatusLabel(property.status)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">{formatPrice(property.price)}</td>
                        <td className="py-4">
                          <button
                            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#373737] rounded-lg"
                            onClick={() => handleViewProperty(property.id)}
                            title="View Property"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="mb-4 text-gray-400">
                          {properties.length === 0
                            ? "You haven't added any properties yet."
                            : "No properties found matching your filters."}
                        </div>
                        {properties.length === 0 && (
                          <button
                            onClick={handleAddProperty}
                            className="bg-[#780991] text-white px-6 py-2 rounded-lg hover:bg-[#8b0aa3] transition-colors"
                          >
                            Add Your First Property
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
