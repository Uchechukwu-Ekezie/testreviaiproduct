"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-mobile";
// import google from "../../../../public/Image/Google - Original.png";
// import apple from "../../../../public/Image/Apple - Negative.png";
import Testimonial from "@/components/testimonial";
import PPTU from "@/components/pptu";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/components/ui/use-toast";
import Logo from "@/components/logo";
import { Eye, EyeOff } from "lucide-react";
import sms from "../../../../public/Image/sms.png";
import pass from "../../../../public/Image/password-check.png";
import axios from "axios";
// import { useGoogleLogin, type TokenResponse } from "@react-oauth/google";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const { login } = useAuth();

  // clear local storage

  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate input first
      if (!email || !email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      await login(email, password);

      // Show success toast after login completes
      toast({
        title: "Login successful",
        description: "Welcome back to Revi.ai!",
      });
      // Router push is handled inside the login function
    } catch (error) {
      console.error("Login failed:", error);

      if (axios.isAxiosError(error)) {
        console.error("Response error data:", error.response?.data);

        // Extract error message from API response if available
        let errorMessage = "Invalid credentials";

        if (error.response?.data) {
          errorMessage =
            error.response.data.detail ||
            error.response.data.message ||
            error.response.data.error ||
            "Invalid credentials";

          // Handle specific status codes
          if (error.response.status === 401) {
            errorMessage = "Invalid email or password. Please try again.";
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Removed unused type GoogleCredentialResponse

  // const handleGoogleLogin = useGoogleLogin({
  //   onSuccess: async (tokenResponse: TokenResponse) => {
  //     setIsLoading(true)
  //     try {
  //       // Convert TokenResponse to expected GoogleCredentialResponse format
  //       await loginWithGoogle({
  //       access_token: tokenResponse.access_token,

  //       })
  //       toast({
  //         title: "Login successful",
  //         description: "Welcome back with Google!",
  //       })
  //     } catch (error: any) {
  //       toast({
  //         title: "Google login failed",
  //         description: error.message || "Failed to login with Google",
  //         variant: "destructive",
  //       })
  //     } finally {
  //       setIsLoading(false)
  //     }
  //   },
  //   onError: () => {
  //     toast({
  //       title: "Google login failed",
  //       description: "An error occurred during Google authentication",
  //       variant: "destructive",
  //     })
  //   }
  // })

  // const handleAppleLogin = () => {
  //   toast({
  //     title: "Coming soon",
  //     description: "Apple login will be available soon",
  //     variant: "default",
  //   })
  // }

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 mx-auto bg-background font-sf-pro">
      <div className="flex flex-col items-center w-full gap-8 mx-auto lg:flex-row max-w-1440">
        <Card className="w-full max-w-[503px] m-auto   bg-transparent border-transparent flex flex-col">
          <CardHeader className="space-y-3">
            <Logo />
            <h2 className="text-center text-[25px] font-[500] text-muted-foreground md:pt-[33.5px]">
              Welcome back to Revi.ai
            </h2>
          </CardHeader>

          <CardContent className="items-center justify-center flex-grow w-full py-4 overflow-y-auto ">
            <div className="md:space-y-4">
              {/* <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="w-full bg-card rounded-[15px] text-[15px] font-[400] border-white/15  py-5 h-11"
                  disabled={isLoading}
                  onClick={() => handleGoogleLogin()}
                >
                  <Image src={google || "/placeholder.svg"} alt="Google Logo" width={24} height={24} />
                  Sign in with Google
                </Button>

                <Button
                  variant="outline"
                  className="w-full bg-card rounded-[15px] text-[15px] font-[400]  border-white/15  py-5 h-11"
                  disabled={isLoading}
                  onClick={handleAppleLogin}
                >
                  <Image src={apple || "/placeholder.svg"} alt="Apple Logo" width={24} height={24} />
                  Sign in with Apple
                </Button>
              </div> */}

              <div className="relative py-4">
                {/* <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-700" />
                </div>
                <div className="relative flex justify-center text-[16px] ">
                  <span className="p-2 bg-background text-zinc-400">Or</span>
                </div> */}
              </div>

              <form onSubmit={handleSubmit} className="space-y-7">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-zinc-400 text-[16px]">
                    Email
                  </Label>

                  {/* Relative wrapper to position the icon inside the input */}
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border border-white/15 w-full bg-transparent h-11 rounded-[15px] text-white !text-[16px] placeholder:text-[17px] placeholder:text-white pl-10 pr-10 focus:outline-none focus:ring-0 focus:border-white/40"
                      disabled={isLoading}
                      required
                    />
                    {/* Mail icon inside the input */}
                    <Image
                      src={sms || "/placeholder.svg"}
                      alt="email icon"
                      className="absolute w-[20px] h-[17px] transform -translate-y-1/2 left-3 top-1/2 text-zinc-400"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-zinc-400">
                    Password
                  </Label>

                  {/* Relative wrapper to position the icons inside the input */}
                  <div className="relative">
                    {/* Input field */}
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border border-white/15 w-full bg-transparent h-11 rounded-[15px] text-white !text-[16px] placeholder:text-[17px] placeholder:text-white pl-10 pr-10 focus:outline-none focus:ring-0 focus:border-white/40"
                      disabled={isLoading}
                      required
                    />

                    {/* Lock Icon (Left) */}
                    <Image
                      src={pass || "/placeholder.svg"}
                      alt="pass"
                      className="absolute w-[20px] h-[17px] transform -translate-y-1/2 left-3 top-1/2 text-zinc-400"
                    />

                    {/* Password Toggle Button (Right) */}
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      className="text-white border-white/15"
                      checked={rememberMe}
                      onCheckedChange={(checked) =>
                        setRememberMe(checked === true)
                      }
                    />
                    <Label htmlFor="remember" className="text-sm text-zinc-400">
                      Remember me
                    </Label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-zinc-400 hover:text-white"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full text-white h-11 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 rounded-[15px]"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              <CardFooter className="flex flex-col text-center">
                <p className="mt-5 text-sm text-zinc-400">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="text-white hover:underline">
                    Sign Up
                  </Link>
                </p>
              </CardFooter>
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
