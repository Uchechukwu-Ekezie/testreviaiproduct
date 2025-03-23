"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";



import { useMediaQuery } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";

import Testimonial from "@/components/testimonial";
import Logo from "@/components/logo";
import PPTU from "@/components/pptu";

export default function VerifyPage() {
  const [verificationCode, setVerificationCode] = useState("");
  const [isResending, setIsResending] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Add your verification logic here
      // After successful verification:
      router.push("/welcome");
    } catch {
      // Handle verification error
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      // Add logic to resend verification code
      // Show success message
    } catch {
      // Handle error
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 mx-auto bg-[#212121] font-sf-pro">
      <div className="flex flex-col items-center w-full gap-8 mx-auto lg:flex-row max-w-1440">
        <Card className="w-full max-w-[503px] mx-auto lg:min-h-[96vh] bg-transparent border-transparent flex flex-col">
          <CardHeader className="space-y-3">
            <Logo />
            <h2 className="text-center text-[25px] font-[500] text-white pt-[33.5px]">Sign Up to Revi.ai</h2>
          </CardHeader>

          <CardContent className="flex-grow py-4 overflow-y-auto">
            <div className="space-y-4">
              <p className="text-center text-zinc-400 text-[18px] max-w-[340px] mx-auto mb-8">
                Enter the code from the email we sent to verify your email address
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  type="text"
                  placeholder="Enter verification code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="border border-white/15 h-11 rounded-[15px] text-center text-white !text-[17px] font-normal placeholder:text-[17px] placeholder:text-zinc-500"
                  maxLength={6}
                />

                <Button
                  type="submit"
                  className="w-full text-white h-11 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 rounded-[15px]"
                  disabled={verificationCode.length !== 6}
                >
                  Verify Email Address
                </Button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-sm text-zinc-400">
                  Not seeing the email in your inbox?{" "}
                  <Button
                    variant="link"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="h-auto p-0 font-normal text-white hover:text-white hover:underline"
                  >
                    Try sending again
                  </Button>
                </p>
              </div>
            </div>
          </CardContent>
          
          <div className="mt-auto">
            <PPTU />
          </div>
        </Card>

        {!isMobile && (
          <div className="w-full max-w-[720px] space-y-6 bg-[#262626] h-[800px] pt-[30px]">
            <Testimonial />
          </div>
        )}
      </div>
    </div>
  );
}
