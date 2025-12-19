"use client";
import ShareExperience from "@/components/shareyourexperience";
import { trackFacebookEvent } from "@/utils/facebookPixel";
import React, { useEffect } from "react";

const Page = () => {
  useEffect(() => {
    trackFacebookEvent("PageView");
  }, []);

  return (
    <div className="bg-[#0A0A0A]">
      <video
        className="absolute top-0 left-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source
          src="https://res.cloudinary.com/dazur1hks/video/upload/o5qqgsanxtldkxluwd77.mp4?_s=vp-2.1.0"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen bg-black/60">
        <ShareExperience />
      </div>
    </div>
  );
};

export default Page;
