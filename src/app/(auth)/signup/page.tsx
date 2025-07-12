"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import Image from "next/image";

import { useMediaQuery } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";

import Testimonial from "@/components/testimonial";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/components/ui/use-toast";
import PPTU from "@/components/pptu";
import Logo from "@/components/logo";
import { Eye, EyeOff } from "lucide-react";
import sms from "../../../../public/Image/sms.png";
import pass from "../../../../public/Image/password-check.png";
import user from "../../../../public/Image/password-check.png";

import axios from "axios";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isMobile = useMediaQuery("(max-width: 1024px)");
  const router = useRouter();
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description:
          "Please accept the Terms of Service and Privacy Policy to continue.",
        variant: "destructive",
      });
      return;
    }

    // Basic validation
    if (!formData.email || !formData.email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await signup(formData);
    } catch (error) {
      console.error(error, "Signup form submission");

      if (axios.isAxiosError(error)) {
        console.error("Response error data:", error.response?.data);

        // Show the exact error response data (simplified)
        let errorDisplay = "";

        if (error.response?.data) {
          // For API validation errors (typically in object form with field names as keys)
          if (typeof error.response.data === "object") {
            const errorData = error.response.data;
            errorDisplay = JSON.stringify(errorData);
          } else {
            // If it's a string, use it directly
            errorDisplay = String(error.response.data);
          }
        } else {
          errorDisplay = `Error ${error.response?.status || ""}: ${
            error.message
          }`;
        }

        toast({
          title: "Signup failed",
          description: errorDisplay,
          variant: "destructive",
        });
      } else {
        // Handle non-axios errors
        toast({
          title: "Signup failed",
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 mx-auto bg-[#212121] font-sf-pro">
      <div className="flex flex-col items-center w-full gap-8 mx-auto lg:flex-row max-w-1440">
        <Card className="w-full max-w-[503px] mx-auto lg:min-h-[96vh] bg-transparent border-transparent flex flex-col">
          <CardHeader className="space-y-3">
            <Logo />
            <h2 className="text-center text-[25px] font-[500] text-white pt-[33.5px]">
              Sign Up to Revi.ai
            </h2>
          </CardHeader>

          <CardContent className="flex-grow py-4 overflow-y-auto">
            <div className="space-y-2">
              <form onSubmit={handleSubmit} className="pt-10 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="first_name"
                      className="text-zinc-400 text-[16px]"
                    >
                      First Name
                    </Label>
                    <div className="relative">
                      <input
                        id="first_name"
                        placeholder="First name"
                        value={formData.first_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            first_name: e.target.value,
                          })
                        }
                        className="border border-white/15 w-full bg-transparent h-11 rounded-[15px] text-white !text-[15px] placeholder:text-[17px] placeholder:text-white pl-10 pr-10 focus:outline-none focus:ring-0 focus:border-white/40"
                        disabled={isLoading}
                        required
                      />
                      <Image
                        src={user || "/placeholder.svg"}
                        alt="user icon"
                        className="absolute w-[20px] h-[17px] transform -translate-y-1/2 left-3 top-1/2 text-zinc-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="last_name"
                      className="text-zinc-400 text-[16px]"
                    >
                      Last Name
                    </Label>
                    <div className="relative">
                      <input
                        id="last_name"
                        placeholder="Last name"
                        value={formData.last_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            last_name: e.target.value,
                          })
                        }
                        className="border border-white/15 w-full bg-transparent h-11 rounded-[15px] text-white !text-[15px] placeholder:text-[17px] placeholder:text-white pl-10 pr-10 focus:outline-none focus:ring-0 focus:border-white/40"
                        disabled={isLoading}
                        required
                      />
                      <Image
                        src={user || "/placeholder.svg"}
                        alt="user icon"
                        className="absolute w-[20px] h-[17px] transform -translate-y-1/2 left-3 top-1/2 text-zinc-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-zinc-400 text-[16px]">
                    Email
                  </Label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="border border-white/15 w-full bg-transparent h-11 rounded-[15px] text-white !text-[15px] placeholder:text-[17px] placeholder:text-white pl-10 pr-10 focus:outline-none focus:ring-0 focus:border-white/40"
                      disabled={isLoading}
                      required
                    />
                    <Image
                      src={sms || "/placeholder.svg"}
                      alt="email icon"
                      className="absolute w-[20px] h-[17px] transform -translate-y-1/2 left-3 top-1/2 text-zinc-400"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="password" className="text-zinc-400">
                    Password
                  </Label>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="border border-white/15 w-full bg-transparent h-11 rounded-[15px] text-white !text-[15px] placeholder:text-[17px] placeholder:text-white pl-10 pr-10 focus:outline-none focus:ring-0 focus:border-white/40"
                      disabled={isLoading}
                      required
                    />

                    <Image
                      src={pass || "/placeholder.svg"}
                      alt="pass"
                      className="absolute w-[20px] h-[17px] transform -translate-y-1/2 left-3 top-1/2 text-zinc-400"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute transform -translate-y-1/2 right-3 top-1/2 text-zinc-400"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    className="text-white border-white/15"
                    checked={termsAccepted}
                    onCheckedChange={(checked) =>
                      setTermsAccepted(checked === true)
                    }
                  />
                  <Label htmlFor="terms" className="text-sm text-zinc-400">
                    I agree to the Terms of Service and Privacy Policy
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-white rounded-[15px] bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </Button>
              </form>
            </div>
            <CardFooter className="flex flex-col space-y-4 text-center">
              <p className="mt-5 text-sm text-zinc-400">
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 font-normal text-white hover:underline"
                  onClick={() => router.push("/signin")}
                  disabled={isLoading}
                >
                  Sign In
                </Button>
              </p>
            </CardFooter>
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
