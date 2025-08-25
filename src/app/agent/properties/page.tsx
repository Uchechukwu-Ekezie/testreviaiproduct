"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Bed,
  Bath,
  Square,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Dummy property data - replace with actual API calls
const properties = [
  {
    id: 1,
    title: "Luxury 3-Bedroom Apartment",
    location: "Victoria Island, Lagos",
    price: 2500000,
    status: "active",
    type: "apartment",
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    views: 234,
    inquiries: 12,
    image: "/api/placeholder/300/200",
    dateAdded: "2024-01-15",
  },
  {
    id: 2,
    title: "Modern 4-Bedroom Duplex",
    location: "Lekki Phase 1, Lagos",
    price: 5000000,
    status: "rented",
    type: "house",
    bedrooms: 4,
    bathrooms: 3,
    area: 250,
    views: 189,
    inquiries: 8,
    image: "/api/placeholder/300/200",
    dateAdded: "2024-01-10",
  },
  {
    id: 3,
    title: "Executive Studio Apartment",
    location: "Ikoyi, Lagos",
    price: 1200000,
    status: "pending",
    type: "apartment",
    bedrooms: 1,
    bathrooms: 1,
    area: 75,
    views: 156,
    inquiries: 23,
    image: "/api/placeholder/300/200",
    dateAdded: "2024-01-20",
  },
];

const statusColors = {
  active: "bg-green-500/20 text-green-500 border-green-500/30",
  rented: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  inactive: "bg-red-500/20 text-red-500 border-red-500/30",
};

export default function PropertiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || property.status === statusFilter;
    const matchesType = typeFilter === "all" || property.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Properties</h1>
          <p className="text-zinc-400 mt-1">
            Manage your property listings and track their performance.
          </p>
        </div>
        <Button
          onClick={() => router.push("/agent/properties/create")}
          className="bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-[#1a1a1a] border-zinc-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#262626] border-zinc-700 text-white placeholder-zinc-400"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-[#262626] border-zinc-700 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-[#262626] border-zinc-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48 bg-[#262626] border-zinc-700 text-white">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-[#262626] border-zinc-700">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="duplex">Duplex</SelectItem>
                <SelectItem value="office">Office</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <Card
            key={property.id}
            className="bg-[#1a1a1a] border-zinc-800 overflow-hidden"
          >
            {/* Property Image */}
            <div className="h-48 bg-zinc-800 relative">
              <div className="absolute top-4 right-4">
                <Badge
                  className={cn(
                    "border",
                    statusColors[property.status as keyof typeof statusColors]
                  )}
                >
                  {property.status.charAt(0).toUpperCase() +
                    property.status.slice(1)}
                </Badge>
              </div>
              <div className="absolute bottom-4 left-4 text-white bg-black/50 px-2 py-1 rounded text-sm">
                {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
              </div>
            </div>

            <CardContent className="p-4">
              {/* Property Details */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {property.title}
                  </h3>
                  <div className="flex items-center text-zinc-400 text-sm mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {property.location}
                  </div>
                </div>

                {/* Price */}
                <div className="text-2xl font-bold text-[#FFD700]">
                  {formatPrice(property.price)}
                  <span className="text-sm text-zinc-400 font-normal">
                    /year
                  </span>
                </div>

                {/* Property Features */}
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <div className="flex items-center">
                    <Bed className="w-4 h-4 mr-1" />
                    {property.bedrooms} bed
                  </div>
                  <div className="flex items-center">
                    <Bath className="w-4 h-4 mr-1" />
                    {property.bathrooms} bath
                  </div>
                  <div className="flex items-center">
                    <Square className="w-4 h-4 mr-1" />
                    {property.area} m²
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="flex items-center justify-between text-sm text-zinc-400 pt-2 border-t border-zinc-800">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {property.views} views
                  </div>
                  <div>{property.inquiries} inquiries</div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-zinc-700 hover:bg-zinc-800"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-zinc-700 hover:bg-zinc-800"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-700 hover:bg-red-800 text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProperties.length === 0 && (
        <Card className="bg-[#1a1a1a] border-zinc-800">
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No properties found
            </h3>
            <p className="text-zinc-400 mb-6">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters or search query."
                : "Get started by adding your first property listing."}
            </p>
            <Button className="bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
