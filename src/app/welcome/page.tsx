"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";
import { ThumbsUp, Home } from "lucide-react";

import Testimonial from "@/components/testimonial";
import Logo from "@/components/logo";
import PPTU from "@/components/pptu";

export default function WelcomePage() {
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const router = useRouter();

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 mx-auto bg-[#212121] font-sf-pro">
      <div className="flex flex-col items-center w-full gap-8 mx-auto lg:flex-row max-w-1440">
        {/* Left Section */}
        <Card className="w-full max-w-[503px] mx-auto lg:min-h-[96vh] bg-transparent border-transparent flex flex-col min-h-[100vh] justify-between p-4 sm:p-6">
          <CardHeader className="space-y-3 flex-shrink-0">
            <Logo />
          </CardHeader>

          {/* Middle Section */}
          <div className="flex flex-col items-center justify-center flex-grow space-y-4 text-center" style={{height: 'calc(100vh - 200px)' }}>
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-yellow-500 to-pink-500">
              <ThumbsUp className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-4">
              <h1 className="text-2xl font-semibold text-white">
                Welcome to Revi AI
              </h1>
              <p className="max-w-[523px] mx-auto text-zinc-400">
                Let’s make your experience even better. Get instant insights or
                AI-tailored recommendations for your needs.
              </p>
              <p className="pt-3 pb-20 text-sm text-zinc-400">
                <Button
                  variant="link"
                  onClick={() => router.push("/preferences")}
                  className="w-full h-auto p-0 underline text-zinc-400 hover:text-white"
                >
                  Help us understand you better for personalized recommendations
                </Button>
              </p>
            </div>

            <Button
              onClick={() => router.push("/signin")}
              className="px-6 text-white border bg-transparent    border-zinc-700 hover:bg-zinc-700 rounded-[15px] text-[18px] font-[400] py-5 mt-8"
            >
              <Home className="mr-2" />
              Go to Home Page
            </Button>
          </div>

          {/* PPTU at the Bottom */}
          <PPTU />
        </Card>

        {/* Right Section - AI Features */}
        {!isMobile && (
          <div className="w-full max-w-[720px] space-y-6 bg-[#262626] h-[800px] pt-[30px]">
            <Testimonial />
          </div>
        )}
      </div>
    </div>
  );
}
