import ThankYou from "@/components/thankyou";
import React from "react";

function Page() {
  return (
    <div className="bg-[#0A0A0A] relative min-h-screen">
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
      <div className="relative z-10 min-h-screen bg-black/60 flex items-center justify-center">
        <ThankYou />
      </div>
    </div>
  );
}

export default Page;
