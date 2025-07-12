"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
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
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const router = useRouter();
  const { user } = useAuth();

  // Focus first input on component mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace") {
      if (!verificationCode[index] && index > 0) {
        // If current input is empty, focus previous and clear it
        const newCode = [...verificationCode];
        newCode[index - 1] = "";
        setVerificationCode(newCode);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newCode = [...verificationCode];
        newCode[index] = "";
        setVerificationCode(newCode);
      }
    }
    
    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    
    if (pastedData.length > 0) {
      const newCode = ["", "", "", "", "", ""];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newCode[i] = pastedData[i];
      }
      setVerificationCode(newCode);
      
      // Focus the next empty input or the last one
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.join("");
    
    if (code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter all 6 digits of the verification code.",
        variant: "destructive",
      });
      return;
    }

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

      await authAPI.verifyEmail(user.email, code);

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
      
      // Clear the code and focus first input
      setVerificationCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
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
      
      // Clear current code
      setVerificationCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
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

  const isCodeComplete = verificationCode.every(digit => digit !== "");

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
                {/* 6-Box Verification Code Input */}
                <div className="flex justify-center gap-3 sm:gap-4">
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="\d"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      disabled={isLoading}
                      className="w-12 h-12 text-xl font-semibold text-center text-white transition-all duration-200 bg-transparent border rounded-lg sm:w-14 sm:h-14 sm:text-2xl border-white/15 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent hover:border-white/30"
                      autoComplete="off"
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full text-white h-11 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 rounded-[15px] transition-all duration-200 disabled:opacity-50"
                  disabled={!isCodeComplete || isLoading}
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