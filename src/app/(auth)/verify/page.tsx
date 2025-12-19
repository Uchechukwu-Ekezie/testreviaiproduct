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
    <div className="flex items-center justify-center w-full min-h-screen p-4 mx-auto bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#212121] font-sf-pro">
      <div className="flex flex-col items-center w-full gap-8 mx-auto lg:flex-row max-w-7xl">
        <Card className=" max-w-[502px] mx-auto lg:min-h-[96vh] bg-transparent border-transparent flex flex-col min-h-[100vh] justify-between p-4 sm:p-6">
          <CardHeader className="flex-shrink-0 space-y-3">
            <Logo />
          </CardHeader>

          <CardContent className="flex items-center justify-center flex-grow w-full py-4 sm:py-8">
            <div className="space-y-8 w-full max-w-[450px] mx-auto">
                             {/* Header Section */}
               <div className="text-center space-y-3">
                 <div className="inline-flex items-center justify-center w-14 h-14 mb-3 bg-gradient-to-br from-[#FFD700] to-[#780991] rounded-full">
                   <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 </div>
                 <h2 className="text-2xl font-bold text-white leading-tight">
                   Verify Your Email
                 </h2>
                 <p className="text-base text-zinc-300 leading-relaxed max-w-sm mx-auto">
                   We've sent a 6-digit verification code to{" "}
                   <span className="font-semibold text-white bg-gradient-to-r from-[#FFD700] to-[#780991] bg-clip-text text-transparent">
                     {user?.email}
                   </span>
                 </p>
               </div>

               {/* Verification Form */}
               <form onSubmit={handleSubmit} className="space-y-6">
                 {/* 6-Box Verification Code Input */}
                 <div className="space-y-3">
                   <label className="text-sm font-medium text-zinc-400 text-center block">
                     Enter verification code
                   </label>
                   <div className="flex justify-between w-full gap-2 sm:gap-3">
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
                         className="flex-1 w-full h-12 sm:h-14 text-xl sm:text-2xl font-bold text-center text-white transition-all duration-300 bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-2 rounded-xl border-zinc-700 focus:outline-none focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] hover:border-zinc-600 hover:shadow-lg hover:shadow-[#FFD700]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                         autoComplete="off"
                       />
                     ))}
                   </div>
                 </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full text-white h-14 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-[#FFD700]/90 hover:to-[#780991]/90 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl hover:shadow-[#FFD700]/20 transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={!isCodeComplete || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Verify Email Address"
                  )}
                </Button>
              </form>

                             {/* Resend Code Section */}
               <div className="text-center space-y-3">
                 <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-600 to-transparent"></div>
                 <p className="text-base text-zinc-400">
                   Didn't receive the code?{" "}
                   <Button
                     variant="link"
                     onClick={handleResendCode}
                     disabled={isResending}
                     className="h-auto p-0 font-medium text-[#FFD700] hover:text-[#FFD700]/80 hover:underline transition-colors duration-200"
                   >
                     {isResending ? (
                       <div className="flex items-center space-x-2">
                         <div className="w-4 h-4 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div>
                         <span>Sending...</span>
                       </div>
                     ) : (
                       "Resend Code"
                     )}
                   </Button>
                 </p>
                 <p className="text-sm text-zinc-500">
                   Check your spam folder if you don't see it
                 </p>
               </div>
            </div>
          </CardContent>

          <div className="flex-shrink-0">
            <PPTU />
          </div>
        </Card>

        {!isMobile && (
          <div className="w-full max-w-[720px] space-y-6 bg-gradient-to-br from-[#262626] to-[#1f1f1f] h-[800px] pt-[30px] rounded-2xl shadow-2xl">
            <Testimonial />
          </div>
        )}
      </div>
    </div>
  );
}