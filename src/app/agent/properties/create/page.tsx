"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { agentAPI } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { ArrowLeft } from "lucide-react";

interface PropertyFormData {
  title: string;
  description: string;
  price: string;
  address: string;
  property_type: string;
  status: string;
  state: string;
  city: string;
  zip_code: string;
  bedrooms: string;
  bathrooms: string;
  size: string;
  square_footage: string;
  year_built: string;
  phone: string;
}

export default function CreatePropertyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    description: "",
    price: "",
    address: "",
    property_type: "",
    status: "for_rent",
    state: "",
    city: "",
    zip_code: "",
    bedrooms: "",
    bathrooms: "",
    size: "",
    square_footage: "",
    year_built: "",
    phone: "",
  });

  const handleInputChange = (field: keyof PropertyFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.description ||
      !formData.price ||
      !formData.address
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const propertyData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        size: formData.size ? parseFloat(formData.size) : null,
        square_footage: formData.square_footage
          ? parseFloat(formData.square_footage)
          : null,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        created_by: user?.id,
        listed_by: user?.id,
        visibility_status: "visible",
        // is_added_by_agent will be automatically set to true by the API
      };

      console.log("Creating property with data:", propertyData);

      await agentAPI.createProperty(propertyData);

      toast({
        title: "Success",
        description: "Property created successfully!",
      });

      // Redirect to properties list
      router.push("/agent/properties");
    } catch (error) {
      console.error("Error creating property:", error);
      toast({
        title: "Error",
        description: "Failed to create property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/agent/properties")}
          className="text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Properties
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">Add New Property</h1>
          <p className="text-zinc-400 mt-1">
            Create a new property listing for your portfolio.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-[#1a1a1a] border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-zinc-400">
                  Property Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., Modern 3-Bedroom Apartment"
                  className="bg-[#262626] border-zinc-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="price" className="text-zinc-400">
                  Price (₦) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="e.g., 2500000"
                  className="bg-[#262626] border-zinc-700 text-white"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-zinc-400">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe the property features, amenities, and location..."
                className="bg-[#262626] border-zinc-700 text-white min-h-[100px]"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="property_type" className="text-zinc-400">
                  Property Type *
                </Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value) =>
                    handleInputChange("property_type", value)
                  }
                >
                  <SelectTrigger className="bg-[#262626] border-zinc-700 text-white">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#262626] border-zinc-700">
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="duplex">Duplex</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status" className="text-zinc-400">
                  Status *
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger className="bg-[#262626] border-zinc-700 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#262626] border-zinc-700">
                    <SelectItem value="for_rent">For Rent</SelectItem>
                    <SelectItem value="for_sale">For Sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="bg-[#1a1a1a] border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address" className="text-zinc-400">
                Address *
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter full address"
                className="bg-[#262626] border-zinc-700 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="state" className="text-zinc-400">
                  State *
                </Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  placeholder="e.g., Lagos"
                  className="bg-[#262626] border-zinc-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="city" className="text-zinc-400">
                  City *
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="e.g., Victoria Island"
                  className="bg-[#262626] border-zinc-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="zip_code" className="text-zinc-400">
                  Postal Code
                </Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) =>
                    handleInputChange("zip_code", e.target.value)
                  }
                  placeholder="e.g., 101001"
                  className="bg-[#262626] border-zinc-700 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card className="bg-[#1a1a1a] border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="bedrooms" className="text-zinc-400">
                  Bedrooms
                </Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) =>
                    handleInputChange("bedrooms", e.target.value)
                  }
                  placeholder="e.g., 3"
                  className="bg-[#262626] border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="bathrooms" className="text-zinc-400">
                  Bathrooms
                </Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) =>
                    handleInputChange("bathrooms", e.target.value)
                  }
                  placeholder="e.g., 2"
                  className="bg-[#262626] border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="size" className="text-zinc-400">
                  Size (m²)
                </Label>
                <Input
                  id="size"
                  type="number"
                  value={formData.size}
                  onChange={(e) => handleInputChange("size", e.target.value)}
                  placeholder="e.g., 150"
                  className="bg-[#262626] border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="year_built" className="text-zinc-400">
                  Year Built
                </Label>
                <Input
                  id="year_built"
                  type="number"
                  value={formData.year_built}
                  onChange={(e) =>
                    handleInputChange("year_built", e.target.value)
                  }
                  placeholder="e.g., 2020"
                  className="bg-[#262626] border-zinc-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-zinc-400">
                Contact Phone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="e.g., +234 801 234 5678"
                className="bg-[#262626] border-zinc-700 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/agent/properties")}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 text-white"
          >
            {isSubmitting ? "Creating..." : "Create Property"}
          </Button>
        </div>
      </form>
    </div>
  );
}
