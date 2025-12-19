"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

import AiScoreCard from "./ai-score-card";
import TestimonialCard from "./testimonial-card";
import willdo from "../../public/Image/naija.jpg";
import img2 from "../../public/Image/house.jpeg";
import boy from "../../public/Image/boy.png";

export default function WhatWeDo() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: willdo,
      aiScore: 4.5,
      aiDescription:
        "Reviai's AI rated Oakwood Apartments highly with a trust score of 4.5/5, highlighting the property's well-maintained condition and minor repair delays noted by past tenants, with no significant legal issues reported.",
      testimonial:
        "Oakwood Apartments has been great. The AI flagged a minor repair delay, which was accurate. The landlord's clean history gave me peace of mind.",
      avatar: boy,
    },
    {
      image: img2,
      aiScore: 3.5,
      aiDescription:
        "Reviai's AI assigned Oakwood Apartments a 3.5/5 rating, citing decent upkeep but occasional maintenance delays. Some tenants have noted that repair requests take longer than expected, though the building remains structurally sound.",
      testimonial:
        "The AI's analysis was spot on. While the building is in good shape, getting things fixed can take some time. The landlord is fair, but better responsiveness would improve the experience.",
      avatar: boy,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [slides.length]);

  return (
    <section className="bg-[#0A0A0A] py-20">
      <div className="container">
        {/* Slider Section */}
        <div className="relative rounded-2xl overflow-hidden max-w-[1234px] mx-auto px-5 ">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="relative w-full h-[500px] sm:h-[400px]"
            >
              <Image
                src={slides[currentSlide].image}
                alt="Property showcase"
                fill
                className="object-cover rounded-2xl"
                priority
              />
              <div className="absolute inset-0 bg-black/50"></div>
            </motion.div>
          </AnimatePresence>

          {/* AI Score & Testimonial Positioned Over Image */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-[90%] sm:max-w-[600px] flex flex-col items-center ">
            <AnimatePresence mode="wait">
              <motion.div
                key={`ai-${currentSlide}`}
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="text-center"
              >
                <AiScoreCard description={slides[currentSlide].aiDescription} />
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`testimonial-${currentSlide}`}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
                className="text-center mt-4"
              >
                <TestimonialCard
                  content={slides[currentSlide].testimonial}
                  avatar={slides[currentSlide].avatar}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Slider Navigation Dots */}
        <div className="flex justify-center mt-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all mx-1 ${
                currentSlide === index ? "bg-white scale-110" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
