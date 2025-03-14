"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useSwipeable } from "react-swipeable";
import Image, { StaticImageData } from "next/image";
import house from "../../public/Image/house.png";
import ai from "../../public/Image/ai.png";
import man from "../../public/Image/man.png";

type Testimonial = {
  id: number;
  sender: string;
  text: string;
  avatarColor: StaticImageData | string;
  image?: StaticImageData | string; // Optional image for AI responses
};

// Define testimonial slides (Only two slides)
const testimonialSlides: Testimonial[][] = [
  [
    {
      id: 2,
      sender: "User",
      text: "Oakwood Apartments has been great. The AI flagged a minor repair delay, which was accurate. The landlord's clean history gave me peace of mind.",
      avatarColor: man,
    },
    {
      id: 1,
      sender: "AI",
      text: "Revi.AI rated Oakwood Apartments highly with a trust score of 4.8/5, highlighting the property's well-maintained condition and minor repair delays noted by past tenants, with no significant legal issues reported.",
      avatarColor: ai,
    },
  ],
  [
    {
      id: 3,
      sender: "User",
      text: "Can you show me a picture of the building at 15 Admiralty Way, Lekki Phase 1?",
      avatarColor: man,
    },
    {
      id: 4,
      sender: "AI",
      text: "Here are images of the building located at 15 Admiralty Way, Lekki Phase 1. This property features modern architecture and is situated in a prime location with easy access to essential amenities.",
      avatarColor: ai,
      image: house,
    },
  ],
];

export default function Testimonial() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(
        (prevIndex) => (prevIndex + 1) % testimonialSlides.length
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Swipe handling
  const handlers = useSwipeable({
    onSwipedLeft: () =>
      setCurrentIndex((prev) => (prev + 1) % testimonialSlides.length),
    onSwipedRight: () =>
      setCurrentIndex(
        (prev) =>
          (prev - 1 + testimonialSlides.length) % testimonialSlides.length
      ),
  });

  return (
    <div
      {...handlers}
      className="relative max-w-[720px] w-full bg-[#262626] h-[800px] flex flex-col justify-center items-center p-6 rounded-xl shadow-lg"
    >
      {/* Testimonial Slides */}
      <div className="w-full overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {testimonialSlides.map((pair, index) => (
            <div key={index} className="min-w-full space-y-4">
              {pair.map((testimonial) => (
                <Card
                  key={testimonial.id}
                  className={`p-4 bg-zinc-900 max-w-[391px] mx-auto border-zinc-800 ${
                    testimonial.sender === "User" ? "mr-12" : "ml-12"
                  }`}
                >
                  <div
                    className={`flex items-start gap-3 ${
                      testimonial.sender === "User" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Avatar className="w-8 h-8">
                      <Image
                        src={testimonial.avatarColor as StaticImageData}
                        alt={testimonial.sender}
                        width={32} // Adjust size as needed
                        height={32}
                        className="rounded-full"
                      />
                    </Avatar>
                    <div className="space-y-2">
                      <p className="text-sm text-zinc-300">
                        {testimonial.text}
                      </p>
                      {testimonial.image && (
                        <Image
                          src={testimonial.image}
                          alt="Property Image"
                          width={400}
                          height={200}
                          className="rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="absolute flex justify-center space-x-2 bottom-4">
        {testimonialSlides.map((_, index) => (
          <span
            key={index}
            className={`w-3 h-3 rounded-full ${
              index === currentIndex ? "bg-white" : "bg-gray-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
