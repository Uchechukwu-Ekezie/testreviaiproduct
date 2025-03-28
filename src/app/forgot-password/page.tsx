"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import sms from "../../../public/Image/sms.png"
import Testimonial from "@/components/testimonial"
import { useMediaQuery } from "@/hooks/use-mobile"
import Logo from "@/components/logo"
import PPTU from "@/components/pptu"
import { Label } from "@/components/ui/label"
import { authAPI } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import axios from "axios"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [currentStep, setCurrentStep] = useState<"email" | "verification">("email")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 1024px)")

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Validate email format before sending
      if (!email || !email.includes('@') || !email.includes('.')) {
        setError("Please enter a valid email address")
        setIsLoading(false)
        return
      }
      
      console.log("Submitting password reset request for email:", email)
      
      // Call the API to request a password reset
      await authAPI.requestPasswordReset(email)

      // Show success toast
      toast({
        title: "Verification code sent",
        description: "Please check your email for the verification code.",
      })

      // Move to the verification step
      setCurrentStep("verification")
    } catch (error) {
      console.error("Password reset request failed:", error)
      
      let errorMessage = "Failed to send verification code. Please try again."

      if (axios.isAxiosError(error) && error.response?.data) {
        errorMessage = error.response.data.detail || error.response.data.message || errorMessage
      }

      setError(errorMessage)
      toast({
        title: "Request failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Validate inputs
      if (!email || !verificationCode) {
        setError("Email and verification code are required")
        setIsLoading(false)
        return
      }

      // Call the API to verify the OTP code with email
      const response = await authAPI.verifyEmailOtp(email, verificationCode)

      // Show success toast
      toast({
        title: "Verification successful",
        description: "You can now reset your password.",
      })

      // Extract the reset token from the response
      const { uid, token } = response

      // Move to the reset password page with the token
      router.push(`/forgot-password/reset-password?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`)
    } catch (error) {
      console.error("Verification failed:", error)
      
      let errorMessage = "Invalid verification code. Please try again."
      let shouldShowResend = false
      
      if (axios.isAxiosError(error)) {
        const errorDetail = error.response?.data?.detail || 
                          error.response?.data?.message ||
                          error.response?.data?.error ||
                          (typeof error.response?.data === 'string' ? error.response.data : null)

        if (errorDetail) {
          errorMessage = errorDetail
          // If OTP is expired, suggest resending
          if (errorDetail.toLowerCase().includes('expired')) {
            errorMessage = "Your verification code has expired. Please request a new one."
            shouldShowResend = true
          }
        }
      }

      setError(errorMessage)
      toast({
        title: "Verification failed",
        description: errorMessage,
        variant: "destructive",
      })

      // If OTP is expired, automatically trigger resend
      if (shouldShowResend) {
        handleResendCode()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    try {
      await authAPI.requestPasswordReset(email)
      
      toast({
        title: "Code resent",
        description: "A new verification code has been sent to your email.",
      })
    } catch (error) {
      console.error("Failed to resend code:", error)
      
      let errorMessage = "Failed to resend code. Please try again."
      if (axios.isAxiosError(error) && error.response?.data) {
        errorMessage = error.response.data.detail || error.response.data.message || errorMessage
      }

      toast({
        title: "Failed to resend code",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderEmailStep = () => (
    <CardContent className="flex flex-col justify-center flex-grow text-center">
      <h2 className="text-center text-[25px] font-[500] text-white pb-6">Reset Your Password</h2>

      <p className="mb-8 text-sm text-zinc-400">
        Enter your email address and we&apos;ll send you a verification code to reset your password.
      </p>

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div className="space-y-3">
          <Label htmlFor="email" className="text-zinc-400 text-[16px]">
            Email
          </Label>

          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-white/15 h-11 rounded-[15px] text-white font-normal placeholder:text-[17px] !text-[16px] placeholder:text-zinc-500 pl-10"
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

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          className="w-full text-white h-11 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 rounded-[15px]"
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send Verification Code"}
        </Button>
      </form>

      <Button
        variant="link"
        className="p-0 mt-4 text-zinc-400 hover:text-zinc-300"
        onClick={() => router.push("/signin")}
        disabled={isLoading}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Login
      </Button>
    </CardContent>
  )

  const renderVerificationStep = () => (
    <CardContent className="flex flex-col justify-center flex-grow text-center">
      <h2 className="text-left text-[25px] font-[500] text-white pb-2">Verify Your Email</h2>

      <p className="mb-6 text-sm text-left text-zinc-400">
        Enter the verification code we&apos;ve sent to <span className="text-white">{email}</span>
      </p>

      <form onSubmit={handleVerificationSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            id="verificationCode"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter verification code"
            className="bg-[#262626] text-zinc-400 border-zinc-800 placeholder:text-[17px] !text-[16px] h-11 rounded-[15px] text-center"
            disabled={isLoading}
            maxLength={6}
            required
          />
        </div>

        {error && <p className="text-sm text-left text-red-500">{error}</p>}

        <Button
          type="submit"
          className="w-full text-white font-medium h-11 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 rounded-[15px]"
          disabled={isLoading || verificationCode.length !== 6}
        >
          {isLoading ? "Verifying..." : "Verify Code"}
        </Button>

        <p className="mt-2 text-xs text-left text-zinc-500">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isLoading}
            className="text-white hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Sending..." : "Resend code"}
          </button>
        </p>
      </form>

      <div className="flex justify-start mt-8">
        <Button
          variant="link"
          className="p-0 text-zinc-400 hover:text-zinc-300"
          onClick={() => setCurrentStep("email")}
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to email
        </Button>
      </div>
    </CardContent>
  )

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 mx-auto bg-[#212121] font-sf-pro">
      <div className="flex flex-col items-center w-full gap-8 mx-auto lg:flex-row max-w-1440">
        <Card className="w-full max-w-[503px] mx-auto lg:min-h-[96vh] bg-transparent border-transparent flex flex-col">
          <CardHeader className="space-y-3">
            <Logo />
          </CardHeader>

          <CardContent className="flex items-center flex-grow py-4 overflow-y-auto">
            {currentStep === "email" && renderEmailStep()}
            {currentStep === "verification" && renderVerificationStep()}
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
  )
}

