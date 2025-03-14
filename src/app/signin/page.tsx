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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-mobile";

import google from "../../../public/Image/Google - Original.png";
import apple from "../../../public/Image/Apple - Negative.png";
import Testimonial from "@/components/testimonial";
import PPTU from "@/components/pptu";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/components/ui/use-toast";
import Logo from "@/components/logo";
import { Eye, EyeOff} from "lucide-react";
import sms from "../../../public/Image/sms.png";
import  pass from "../../../public/Image/password-check.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      // Success toast
      toast({
        title: "Login successful",
        description: "Welcome back to Revi.ai!",
      });
      // Router push is handled inside the login function
    } catch (error) {
      console.error("Login failed", error);
      // Error toast
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 mx-auto bg-[#212121] font-sf-pro ">
      <div className="flex flex-col items-center w-full gap-8 mx-auto lg:flex-row max-w-1440 ">
        <Card className="w-full max-w-[503px] mx-auto  lg:min-h-[96vh]   ">
          <CardHeader className="space-y-3 ">
            <Logo />
            <h2 className="text-center text-[25px] font-[500] text-white pt-[33.5px] ">
              Welcome back to Revi.ai
            </h2>
          </CardHeader>

          <CardContent className="flex-grow">
            <div className="space-y-4">
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="w-full text-white rounded-[15px] text-[15px] font-[400] border-white/15 hover:bg-zinc-800 py-5 h-11"
                  disabled={isLoading}
                >
                  <Image
                    src={google || "/placeholder.svg"}
                    alt="Google Logo"
                    width={24}
                    height={24}
                  />
                  Sign in with Google
                </Button>

                <Button
                  variant="outline"
                  className="w-full text-white rounded-[15px] text-[15px] font-[400] bg-transparent border-white/15 hover:bg-zinc-800 py-5 h-11"
                  disabled={isLoading}
                >
                  <Image
                    src={apple || "/placeholder.svg"}
                    alt="Apple Logo"
                    width={24}
                    height={24}
                  />
                  Sign in with Apple
                </Button>
              </div>

              <div className="relative py-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 bg-zinc-900 text-zinc-400">Or</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-7">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-zinc-400 text-[16px]">
                    Email
                  </Label>

                  {/* Relative wrapper to position the icon inside the input */}
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border border-white/15 h-11 rounded-[15px] text-white !text-[16px] font-normal placeholder:text-[17px] placeholder:text-zinc-500 pl-10"
                      disabled={isLoading}
                      required
                    />
                    {/* Mail icon inside the input */}
                    <Image src={sms} alt="email icon" className="absolute w-[20px] h-[17px] transform -translate-y-1/2 left-3 top-1/2 text-zinc-400" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-zinc-400">
                    Password
                  </Label>

                  {/* Relative wrapper to position the icons inside the input */}
                  <div className="relative">
                    {/* Input field */}
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border border-white/15 h-11 rounded-[15px] text-white !text-[16px] placeholder:text-[17px] placeholder:text-zinc-500 pl-10 pr-10"
                      disabled={isLoading}
                      required
                    />

                    {/* Lock Icon (Left) */}
                    <Image src={pass} alt="pass" className="absolute w-[20px] h-[17px] transform -translate-y-1/2 left-3 top-1/2 text-zinc-400" />

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
            </div>
            <CardFooter className="flex flex-col text-center ">
              <p className="mt-5 space-y-4 text-sm text-zinc-400">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-white hover:underline">
                  Sign Up
                </Link>
              </p>
            </CardFooter>
          </CardContent>

          <PPTU />
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
