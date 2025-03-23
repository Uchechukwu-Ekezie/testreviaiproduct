"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";


import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";

import Testimonial from "@/components/testimonial";
import Logo from "@/components/logo";

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
    <div className="min-h-screen  mx-auto bg-[#212121] flex items-center justify-between p-4 font-sf-pro ">
      <div className="flex flex-col items-center w-full gap-8 mx-auto lg:flex-row max-w-1440 ">
        <Card className="w-full max-w-[503px] mx-auto lg:min-h-[96vh]">
          {/* Logo at the top */}
          <CardHeader className="space-y-3 ">
            <Logo/>
          </CardHeader>

          {/* Main Content (Flex-grow makes this take available space) */}
          <CardContent className="flex flex-col justify-center flex-grow space-y-4" style={{ height: 'calc(100vh - 200px)' }}>
            <h2 className="text-center text-white text-[25px]">
              Sign Up to Revi.ai
            </h2>
            <p className="text-center justify-center text-zinc-400 text-[18px] max-w-[340px] mx-auto">
              Enter the code from the email we sent to verify your email address
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
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
          </CardContent>

          {/* Footer at the bottom */}
          <CardFooter className="flex justify-center mt-9  space-x-4 text-[16px] font-[400]  text-white">
            <Link href="/privacy" className="hover:text-zinc-400">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-zinc-400">
              Terms of Use
            </Link>
          </CardFooter>
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
