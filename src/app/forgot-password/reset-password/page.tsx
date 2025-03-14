"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import pass from "../../../../public/Image/password-check.png";
import Testimonial from "@/components/testimonial";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Eye, EyeOff } from "lucide-react";
import Logo from "@/components/logo";
import PPTU from "@/components/pptu";

export default function SetNewPasswordPage() {
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false,
  });
  const [error, setError] = useState("");
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 1024px)");

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

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwords.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      // Here you would typically call your API to update the password
      // await updatePassword(passwords.newPassword)
      router.push("/forgot-password/verifyhuman"); // Redirect to login page after successful password reset
    } catch {
      setError("Failed to update password. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 mx-auto bg-[#212121] font-sf-pro">
      <div className="flex flex-col items-center w-full gap-8 mx-auto lg:flex-row max-w-1440">
        <Card className="w-full max-w-[503px] mx-auto min-h-[96vh]">
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
                    <Input
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
                      className="border border-white/15 h-11 rounded-[15px] text-white !text-[17px] placeholder:text-[17px] placeholder:text-zinc-500 pl-10 pr-10"
                      required
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
                    <Input
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
                      className="border border-white/15 h-11 rounded-[15px] text-white !text-[18px] placeholder:text-[17px] placeholder:text-zinc-500 pl-10 pr-10"
                      required
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
              >
                Confirm
              </Button>

              <p className="text-sm text-center text-zinc-500">
                Not a Revi.ai account?{" "}
                <Link href="/signup" className="text-white hover:underline">
                  Sign up here
                </Link>
              </p>
            </form>
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
