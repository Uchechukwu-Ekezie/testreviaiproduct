"use client";

import { useState, useEffect } from "react";
import { Monitor, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface ScreenSizeGuardProps {
  children: React.ReactNode;
}

export default function ScreenSizeGuard({ children }: ScreenSizeGuardProps) {
  const [isLaptopSize, setIsLaptopSize] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkScreenSize = () => {
      // Check if screen width is at least 1024px (laptop size)
      setIsLaptopSize(window.innerWidth >= 1024);
    };

    // Check on initial load
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup event listener
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (!isLaptopSize) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-[#1A1A1A] rounded-2xl p-8 border border-[#333333]">
            <div className="mb-6">
              <Monitor className="h-16 w-16 text-[#10B981] mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">
                Desktop Required
              </h1>
              <p className="text-gray-400 text-lg">
                Please use a laptop or desktop computer to access the dashboard.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                The dashboard is optimized for larger screens and requires a
                minimum width of 1024px.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => router.push("/")}
                className="w-full flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#0EA57A] text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </button>

              <div className="text-sm text-gray-500">
                Current screen width:{" "}
                {typeof window !== "undefined" ? window.innerWidth : 0}px
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
