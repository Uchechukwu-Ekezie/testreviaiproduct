import React from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share, Copy, MapPin } from "lucide-react";

interface PropertyCardProps {
  title: string;
  address: string;
  price: string;
  imageUrl?: string;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  title = "Luxury Apartment",
  address = "23 Admiralty Way, Lekki",
  price = "N75,000,000",
  imageUrl = "/placeholder-property.jpg",
}) => {
  return (
    <Card className="overflow-hidden transition-shadow border border-gray-200 rounded-lg shadow-sm hover:shadow-md">
      {/* Property Image */}
      <div className="relative h-48 bg-gray-100">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute px-2 py-1 text-xs font-medium text-white rounded bottom-2 left-2 bg-black/50">
          Featured
        </div>
      </div>

      {/* Property Details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center mt-1 text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{address}</span>
        </div>
        
        <div className="mt-3">
          <span className="text-xl font-bold text-gray-900">{price}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1">
            Save
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            More Info
          </Button>
          <Button size="sm" className="flex-1">
            Contact
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-gray-500">
              <Share className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500">
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
          </div>
          
          <div className="text-xs text-gray-500">
            Posted 2 days ago
          </div>
        </div>

        {/* Additional Options */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Button variant="outline" size="sm">
            See rental details
          </Button>
          <Button variant="outline" size="sm">
            Contact Agent
          </Button>
          <Button variant="outline" size="sm">
            See on Map
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PropertyCard;