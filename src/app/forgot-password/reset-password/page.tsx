"use client";

import React, { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import pass from "../../../../public/Image/password-check.png";
import Testimonial from "@/components/testimonial";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Eye, EyeOff } from "lucide-react";
import Logo from "@/components/logo";
import PPTU from "@/components/pptu";
import { toast } from "@/components/ui/use-toast";
import { authAPI } from "@/lib/api";
import { extractErrorMessage } from "@/utils/error-handler";

function ResetPasswordContent() {
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 1024px)");

  // Get email and OTP from localStorage (stored during verification)
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  // Load email and OTP from localStorage on component mount
  React.useEffect(() => {
    const storedEmail = localStorage.getItem("resetEmail");
    const storedOtp = localStorage.getItem("resetOtp");
    
    if (storedEmail && storedOtp) {
      setEmail(storedEmail);
      setOtp(storedOtp);
    }
  }, []);

  const togglePasswordVisibility = (
    field: "newPassword" | "confirmPassword"
  ) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email || !otp) {
      setError("Invalid reset session. Please request a new password reset.");
      setIsLoading(false);
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (passwords.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    try {
      await authAPI.passwordResetConfirm({
        new_password1: passwords.newPassword,
        new_password2: passwords.confirmPassword,
      });

      toast({
        title: "Password reset successful",
        description: "You can now log in with your new password.",
      });

      router.push("/signin");
    } catch (error) {
      console.error("Password reset error:", error);
      const errorMessage = extractErrorMessage(error, "Failed to update password. Please try again or request a new reset link.");
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // If no email or OTP is present, show an error
  if (!email || !otp) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen p-4 mx-auto bg-[#212121] font-sf-pro">
        <Card className="w-full max-w-[503px] mx-auto p-6">
          <CardContent className="text-center">
            <h2 className="mb-4 text-xl text-white">Invalid Reset Session</h2>
            <p className="mb-6 text-zinc-400">
              This password reset session is invalid or has expired. Please request a new password reset.
            </p>
            <Button
              onClick={() => router.push("/forgot-password")}
              className="w-full text-white h-11 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 rounded-[15px]"
            >
              Request Password Reset
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 mx-auto bg-[#212121] font-sf-pro">
      <div className="flex flex-col items-center w-full gap-8 mx-auto lg:flex-row max-w-1440">
        <Card className="w-full max-w-[503px] mx-auto min-h-[96vh] bg-transparent border-transparent">
          <CardHeader className="flex-grow space-y-3">
            <Logo />
          </CardHeader>

          <CardContent className="flex-grow">
            <h2 className="text-center text-[25px] font-[500] text-white pb-6">
              Set Your New Password
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="block text-zinc-400">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPasswords.newPassword ? "text" : "password"}
                      value={passwords.newPassword}
                      onChange={(e) =>
                        setPasswords((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      placeholder="Enter your password"
                      className="border border-white/15 w-full bg-transparent h-11 rounded-[15px] text-white !text-[16px] placeholder:text-[17px] placeholder:text-white/40 pl-10 pr-10 focus:outline-none focus:ring-0 focus:border-white/40"

                      required
                      disabled={isLoading}
                    />
                    <Image
                      src={pass}
                      alt="pass"
                      className="absolute w-[20px] h-[17px] transform -translate-y-1/2 left-3 top-1/2 text-zinc-400"
                    />

                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400"
                      onClick={() => togglePasswordVisibility("newPassword")}
                    >
                      {showPasswords.newPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-zinc-400"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showPasswords.confirmPassword ? "text" : "password"}
                      value={passwords.confirmPassword}
                      onChange={(e) =>
                        setPasswords((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="Enter your password"
                      className="border border-white/15 w-full bg-transparent h-11 rounded-[15px] text-white !text-[16px] placeholder:text-[17px] placeholder:text-white/40 pl-10 pr-10 focus:outline-none focus:ring-0 focus:border-white/40"

                      required
                      disabled={isLoading}
                    />
                    <Image
                      src={pass}
                      alt="pass"
                      className="absolute w-[20px] h-[17px] transform -translate-y-1/2 left-3 top-1/2 text-zinc-400"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400"
                      onClick={() =>
                        togglePasswordVisibility("confirmPassword")
                      }
                    >
                      {showPasswords.confirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                className="w-full text-white font-medium h-11 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 rounded-[15px]"
                disabled={isLoading}
              >
                {isLoading ? "Updating Password..." : "Confirm"}
              </Button>

              <p className="text-sm text-center text-zinc-500">
                Not a Revi.ai account?{" "}
                <Link href="/signup" className="text-white hover:underline">
                  Sign up here
                </Link>
              </p>
            </form>
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

export default function SetNewPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}