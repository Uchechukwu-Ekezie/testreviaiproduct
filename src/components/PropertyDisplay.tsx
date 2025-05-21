"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { Context } from "@/types/chatMessage";
import { BathIcon, BedIcon, Flag, Phone, User } from "lucide-react";

interface PropertyDisplayProps {
  property: Context;
}

const PropertyDisplay: React.FC<PropertyDisplayProps> = ({ property }) => {
  return (
    <Card className="p-4 mt-4 bg-zinc-900/50 border-zinc-800">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          {property.property_type || "Property"} Details
        </h3>
        
        {property.description && (
          <div className="p-4 rounded-lg bg-zinc-800/50">
            <h4 className="mb-2 font-semibold">Description:</h4>
            <p className="whitespace-pre-line">{property.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {property.status && (
            <span className="flex items-center gap-2">
              <Flag className="w-5 h-5" />
              <span className="font-semibold">Status:</span>
              <span>{property.status}</span>
            </span>
          )}

          {property.bedrooms && (
            <span className="flex items-center gap-2">
              <BedIcon className="w-5 h-5" />
              <span className="font-semibold">Bedrooms:</span>
              <span>{property.bedrooms.toString()}</span>
            </span>
          )}

          {property.bathrooms && (
            <span className="flex items-center gap-2">
              <BathIcon className="w-5 h-5" />
              <span className="font-semibold">Bathrooms:</span>
              <span>{property.bathrooms.toString()}</span>
            </span>
          )}

          {property.listed_by && (
            <span className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="font-semibold">Agent:</span>
              <span>{property.listed_by}</span>
            </span>
          )}

          {property.year_built && (
            <span className="flex items-center gap-2">
              <span className="font-semibold">Year Built:</span>
              <span>{property.year_built}</span>
            </span>
          )}

          {property.size && (
            <span className="flex items-center gap-2">
              <span className="font-semibold">Size:</span>
              <span>{property.size}</span>
            </span>
          )}

          {property.price && (
            <span className="flex items-center gap-2">
              <span className="font-semibold">Price:</span>
              <span>${typeof property.price === 'number' ? property.price.toLocaleString() : property.price}</span>
            </span>
          )}

          {property.address && (
            <span className="flex items-center gap-2">
              <span className="font-semibold">Address:</span>
              <span>{property.address}</span>
            </span>
          )}

          {property.phone && (
            <span className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              <span className="font-semibold">Contact:</span>
              <span>{property.phone}</span>
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PropertyDisplay; 