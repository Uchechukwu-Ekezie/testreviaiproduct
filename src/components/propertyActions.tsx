"use client";
import React, { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import home from "../../public/Image/home.svg";
import msg from "../../public/Image/message-notif.svg";
import pot from "../../public/Image/image.svg";
import rev from "../../public/Image/sms-star.svg";
import { BathIcon, BedIcon, Flag, Phone, User } from "lucide-react";

interface Property {
  image_url?: string | null;
  property_type?: string;
  location: string;
  price?: number;
  description?: string;
  coordinate?: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: string;
  listed_by?: string;
  year_built?: string;
  lot_size?: string;
  square_footage?: string;
  state?: string;
  city?: string;
  zip_code?: string;
  phone?: string;
  created_by?: string;
  property?: string;
}

interface ModalContent {
  title: string;
  content: React.ReactNode;
}

interface PropertyActionsProps {
  property: Property;
  location: string;
  description?: string;
  status?: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: string;
  listed_by?: string;
  year_built?: string;
  lot_size?: string;
  square_footage?: string;
  state?: string;
  city?: string;
  zip_code?: string;
  phone?: string;
  created_by?: string;
}

const PropertyActions: React.FC<PropertyActionsProps> = ({
  property,
  location,
  description: propDescription,
  status,

  phone,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContent>({
    title: "",
    content: "",
  });

  // Get description from props first, then fall back to property.description
  const description = propDescription || property.description;

  const handleButtonClick = (action: string) => {
    const actions: Record<string, ModalContent> = {
      details: {
        title: "Rental Details",
        content: (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {property.property_type || "Property"} at {location}
            </h3>
            {description && (
              <div className="p-4 rounded-lg bg-gray-800/50">
                <h4 className="mb-2 font-semibold">Description:</h4>
                <p className="whitespace-pre-line">{description}</p>
              </div>
            )}
            <div className="flex flex-col gap-2 p-4 rounded-lg bg-gray-800/50">
              {status && (
                <span className="flex gap-1 text-lg">
                  <div className="flex gap-1">
                    <span className="font-semibold">
                      <Flag />
                    </span>
                    <span>Status:</span>
                  </div>

                  <p>{status}</p>
                </span>
              )}
              {property.bedrooms && (
                <span className="flex gap-1 text-lg">
                  <div className="flex gap-1">
                    <span className="font-semibold">
                      <BedIcon />
                    </span>
                    <span>Bedrooms:</span>
                  </div>

                  <p>{property.bedrooms}</p>
                </span>
              )}
              {property.bathrooms && (
                <span className="flex gap-1 text-lg">
                  <div className="flex gap-1">
                    <span className="font-semibold">
                      <BathIcon />
                    </span>
                    <span>Bathrooms:</span>
                  </div>

                  <p>{property.bathrooms}</p>
                </span>
              )}
              {property.size && (
                <p className="text-lg">
                  <span className="font-semibold">Size:</span> {property.size}
                </p>
              )}

              {property.listed_by && (
                <span className="flex gap-1 text-lg">
                  <div className="flex gap-1">
                    <span className="font-semibold">
                      <User />
                    </span>
                    <span>Agent:</span>
                  </div>

                  <p>{property.listed_by}</p>
                </span>
              )}

              {property.year_built && (
                <span className="flex gap-1 text-lg">
                  <div className="flex gap-1">
                    <span className="font-semibold">
                      <User />
                    </span>
                    <span>Year Built:</span>
                  </div>

                  <p>{property.year_built}</p>
                </span>
              )}
              {property.size && (
                <span className="flex gap-1 text-lg">
                  <div className="flex gap-1">
                    <span className="font-semibold">
                      <User />
                    </span>
                    <span>Size:</span>
                  </div>

                  <p>{property.size}</p>
                </span>
              )}
            </div>
            {property.price && (
              <p className="text-lg">
                <span className="font-semibold">Price:</span> $
                {property.price.toLocaleString()}
              </p>
            )}
          </div>
        ),
      },
      contact: {
        title: "Contact Agent",
        content: (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {property.property_type || "Property"} at {location}
            </h3>
            <div className="flex flex-col gap-2 p-4 rounded-lg bg-gray-800/50">
              {phone && (
                <span className="flex gap-1 text-lg">
                  <div className="flex gap-1">
                    <span className="font-semibold">
                      <Phone />
                    </span>
                    <span>Phone:</span>
                  </div>

                  <p>{phone}</p>
                </span>
              )}
            </div>
          </div>
        ),
      },
      photos: {
        title: "Property Photos",
        content: `Photo gallery for ${property.property_type || "property"}`,
      },
      reviews: {
        title: "Property Reviews",
        content: `Reviews for ${
          property.property_type || "property"
        } at ${location}`,
      },
      default: {
        title: "Property Information",
        content: "Loading property details...",
      },
    };

    setModalContent(actions[action] || actions.default);
    setIsModalOpen(true);
  };

  const handleMapClick = () => {
    const mapLocation = property.coordinate || property.address || location;
    if (mapLocation) {
      const encodedAddress = encodeURIComponent(mapLocation);
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
        "_blank",
        "noopener,noreferrer"
      );
    } else {
      alert("Address not available for this property");
    }
  };

  return (
    <>
      <div className="grid  md:grid-cols-3 grid-cols-2    gap-3 mt-4 md:w-[530px] w-[347px]">
        {/* Rental Details */}
        <div className="">
          <button
            onClick={() => handleButtonClick("details")}
            className="w-[163px] h-[35px] px-1 border-border border-2 rounded-[15px] gap-1 text-[#CBCBCB] flex items-center justify-center hover:bg-gray-800/50 transition-colors "
          >
            <Image
              src={home}
              className="w-[20px] h-[20px]"
              alt="Home"
              loading="lazy"
            />
            <span className="text-center text-[14px]">See rental details</span>
          </button>
        </div>

        {/* Contact Agent */}
        <button
          onClick={() => handleButtonClick("contact")}
          className="w-[144px] h-[35px] border-border border-2 rounded-[15px] gap-1 text-[#CBCBCB] flex items-center justify-center hover:bg-gray-800/50 transition-colors"
        >
          <Image
            src={msg}
            className="w-[20px] h-[20px]"
            alt="Contact"
            loading="lazy"
          />
          <span className="text-center text-[14px]">Contact Agent</span>
        </button>

        {/* See on Map */}
        <button
          onClick={handleMapClick}
          className="ml-[-20px] hidden md:flex w-[126px] h-[35px] border-border border-2 rounded-[15px] gap-1 text-[#CBCBCB]  items-center justify-center hover:bg-gray-800/50 transition-colors"
        >
          <Image
            src={msg}
            className="w-[20px] h-[20px]"
            alt="Map"
            loading="lazy"
          />
          <span className="text-center text-[14px]">See on map</span>
        </button>

        {/* View Photos */}
        <button
          onClick={() => handleButtonClick("photos")}
          className="w-[167px] h-[35px] border-border border-2 rounded-[15px] gap-1 text-[#CBCBCB] flex items-center justify-center hover:bg-gray-800/50 transition-colors"
        >
          <Image
            src={pot}
            className="w-[20px] h-[20px]"
            alt="Photos"
            loading="lazy"
          />
          <span className="text-center text-[14px]">View more photos</span>
        </button>

        {/* View Reviews */}
        <button
          onClick={() => handleButtonClick("reviews")}
          className="w-[134px] h-[35px] border-border border-2 rounded-[15px] gap-1 text-[#CBCBCB] flex items-center justify-center hover:bg-gray-800/50 transition-colors"
        >
          <Image
            src={rev}
            className="w-[20px] h-[20px]"
            alt="Reviews"
            loading="lazy"
          />
          <span className="text-center text-[14px]">View reviews</span>
        </button>

        <button
          onClick={handleMapClick}
          className="flex md:hidden w-[126px] h-[35px] border-border border-2 rounded-[15px] gap-1 text-[#CBCBCB]  items-center justify-center hover:bg-gray-800/50 transition-colors"
        >
          <Image
            src={msg}
            className="w-[20px] h-[20px]"
            alt="Map"
            loading="lazy"
          />
          <span className="text-center text-[14px]">See on map</span>
        </button>
      </div>

      {/* Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-[#212121] border-border">
          <DialogHeader>
            <DialogTitle className="text-white">
              {modalContent.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-gray-300">{modalContent.content}</div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PropertyActions;
