"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { useMediaQuery } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

import Testimonial from "@/components/testimonial";
import Logo from "@/components/logo";
import PPTU from "@/components/pptu";
import { useAuth } from "@/contexts/auth-context";
import { authAPI } from "@/lib/api";
import { userAPI } from "@/lib/api";

export default function VerifyPage() {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user?.email) {
        toast({
          title: "Error",
          description: "Email not found. Please try signing up again.",
          variant: "destructive",
        });
        return;
      }

      await authAPI.verifyEmail(user.email, verificationCode);

      toast({
        title: "Email verified",
        description: "Your email has been successfully verified.",
      });

      router.push("/welcome");
    } catch (error) {
      console.error("Verification error:", error);

      toast({
        title: "Verification failed",
        description: "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "Email not found. Please try signing up again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsResending(true);
      await userAPI.resendVerificationOtp(user.email);
      toast({
        title: "Success",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      console.error("Failed to resend verification code:", error);
      toast({
        title: "Error",
        description:
          error.detail ||
          "Failed to resend verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 mx-auto bg-[#212121] font-sf-pro">
      <div className="flex flex-col items-center w-full gap-8 mx-auto lg:flex-row max-w-1440">
        <Card className="w-full max-w-[503px] mx-auto lg:min-h-[96vh] bg-transparent border-transparent flex flex-col min-h-[100vh] justify-between p-4 sm:p-6">
          <CardHeader className="flex-shrink-0 space-y-3">
            <Logo />
          </CardHeader>

          <CardContent className="flex items-center justify-center flex-grow w-full py-4 sm:py-8">
            <div className="space-y-4 w-full max-w-[450px] mx-auto">
              <h2 className="text-center text-[25px] font-[500] text-white pt-[33.5px]">
                Sign Up to Revi.ai
              </h2>
              <p className="text-center text-zinc-400 text-[18px] mb-8 font-[500] ">
                Enter the code generated from the link we sent to{" "}
                <span className="text-white">{user?.email}</span>
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <input
                  type="text"
                  placeholder="Enter verification code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="border text-center border-white/15 w-full bg-transparent h-11 rounded-[15px] text-white !text-[16px] placeholder:text-[17px] placeholder:text-white pl-10 pr-10 focus:outline-none focus:ring-0 focus:border-white/40"
                  required
                  maxLength={6}
                  disabled={isLoading}
                />

                <Button
                  type="submit"
                  className="w-full text-white h-11 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 rounded-[15px]"
                  disabled={verificationCode.length !== 6 || isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify Email Address"}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-[16px] font-[400] text-zinc-400">
                  Not seeing the email in your inbox?{" "}
                  <Button
                    variant="link"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="h-auto p-0 font-normal text-white hover:text-white hover:underline"
                  >
                    {isResending ? "Sending..." : "Try sending again"}
                  </Button>
                </p>
              </div>
            </div>
          </CardContent>

          <div className="flex-shrink-0">
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
