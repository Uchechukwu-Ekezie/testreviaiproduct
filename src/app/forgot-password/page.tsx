"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"

import { useRouter } from "next/navigation"
import { ArrowLeft, Check } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import sms from "../../../public/Image/sms.png";
import Testimonial from "@/components/testimonial"
import { useMediaQuery } from "@/hooks/use-mobile"
import Logo from "@/components/logo"
import PPTU from "@/components/pptu"
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
 
  const [verificationCode, setVerificationCode] = useState("")
  // Add a new state to track the current step
  const [currentStep, setCurrentStep] = useState<"email" | "verification" | "success">("email")
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 1024px)")

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically call your API to send a verification code
    // For demo purposes, we'll just move to the verification step
    setCurrentStep("verification")
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would validate the verification code with your API
    // For demo purposes, we'll just show the success state
    setCurrentStep("success")
  }

  const renderEmailStep = () => (
    <CardContent className="flex flex-col justify-center flex-grow text-center">
      <h2 className="text-center text-[25px] font-[500] text-white pb-6">Sign In to Revi.ai</h2>

      <p className="mb-8 text-sm text-zinc-400">
        Enter your email address and we&apos;ll send you a code to reset your password.
      </p>

      <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                      className="border border-white/15 h-11 rounded-[15px] text-white font-normal placeholder:text-[17px] !text-[16px] placeholder:text-zinc-500 pl-10"
                      
                      required
                    />
                    {/* Mail icon inside the input */}
                    <Image src={sms} alt="email icon" className="absolute w-[20px] h-[17px] transform -translate-y-1/2 left-3 top-1/2 text-zinc-400" />
                  </div>
                </div>

        <Button
          type="submit"
          className="w-full text-white h-11 bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600 rounded-[15px]"
        >
          Verify Email Address
        </Button>
      </form>

      <Button variant="link" className="p-0 mt-4 text-zinc-400 hover:text-zinc-300" onClick={() => router.push("/")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Login
      </Button>
    </CardContent>
  )

  // Update the renderVerificationStep function to match the design
  const renderVerificationStep = () => (
    <CardContent className="flex flex-col justify-center flex-grow text-center">
      <h2 className="text-left text-[25px] font-[500] text-white pb-2">Reset your password</h2>

      <p className="mb-6 text-sm text-left text-zinc-400">
        Enter the code we&apos;ve sent to your email to verify your identity and reset your password.
      </p>

      <form onSubmit={handleVerificationSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            id="verificationCode"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter verification code"
            className="bg-[#262626] text-zinc-400 border-zinc-800 placeholder:text-[17px] !text-[16px] h-11 rounded-[15px]"
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full text-white font-medium h-11 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 rounded-[15px]"
        >
          Verify code
        </Button>

        <p className="mt-2 text-xs text-left text-zinc-500">
          Not seeing the email in your inbox?{" "}
          <span className="text-white cursor-pointer hover:underline">Check spam area.</span>
        </p>
      </form>

      <div className="flex justify-start mt-8">
        <Button variant="link" className="p-0 text-zinc-400 hover:text-zinc-300" onClick={() => router.push("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login page
        </Button>
      </div>
    </CardContent>
  )

  const renderSuccessStep = () => (
    <CardContent className="flex flex-col justify-center flex-grow text-center">
      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#FFD700] to-[#780991]">
          <Check className="w-8 h-8 text-white" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl text-white">Verification Successful</h2>
          <p className="max-w-sm text-sm text-zinc-400">
            Your identity has been verified. You can now reset your password.
          </p>
        </div>

        <div className="w-full space-y-3">
          <Button
            onClick={() => router.push("/forgot-password/reset-password")}
            className="w-full text-white h-11 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 rounded-[15px]"
          >
            Reset Password
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="w-full bg-transparent h-11 border-zinc-800 hover:bg-zinc-800/50 text-zinc-400"
          >
            Return to Login
          </Button>
        </div>
      </div>
    </CardContent>
  )

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 mx-auto bg-[#212121] font-sf-pro">
      <div className="flex flex-col items-center w-full gap-8 mx-auto lg:flex-row max-w-1440">
        <Card className="w-full max-w-[503px] mx-auto min-h-[96vh] ">
          {/* Update the CardHeader to match the design */}
          <CardHeader className="space-y-3 ">
          <Logo/>
          </CardHeader>

          {currentStep === "email" && renderEmailStep()}
          {currentStep === "verification" && renderVerificationStep()}
          {currentStep === "success" && renderSuccessStep()}

          {/* Update the footer to match the design */}
       <PPTU/>
        </Card>

        {!isMobile && (
          <div className="w-full max-w-[720px] space-y-6 bg-[#262626] h-[800px] pt-[30px]">
            <Testimonial />
          </div>
        )}
      </div>
    </div>
  )
}

