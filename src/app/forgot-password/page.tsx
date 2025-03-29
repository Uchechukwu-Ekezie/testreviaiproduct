"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"

import { useRouter } from "next/navigation"
import { ArrowLeft, Check } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import sms from "../../../public/Image/sms.png"
import Testimonial from "@/components/testimonial"
import { useMediaQuery } from "@/hooks/use-mobile"
import Logo from "@/components/logo"
import PPTU from "@/components/pptu"
import { Label } from "@/components/ui/label"
import { authAPI} from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import axios from "axios"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  // Add a new state to track the current step
  const [currentStep, setCurrentStep] = useState<"email" | "verification" | "success">("email")
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
        title: "Verification email sent",
        description: "Please check your email for the verification code.",
      })

      // Move to the verification step
      setCurrentStep("verification")
    } catch (error) {
      console.error("Password reset request failed:", error)

      if (axios.isAxiosError(error)) {
        console.error("Response error data:", error.response?.data)

        // Extract error message from API response if available
        let errorMessage = "Failed to send verification email. Please try again."

        // More detailed error handling
        if (error.response) {
          console.log("Error response status:", error.response.status)
          console.log("Error response data:", error.response.data)
          
          // Handle different status codes
          if (error.response.status === 500) {
            errorMessage = "The server encountered an error. Please try again later or contact support."
          } else if (error.response.status === 404) {
            errorMessage = "Email not found in our system. Please check the email address or sign up."
          } else if (error.response.data) {
            // Try to extract error message from various response formats
            if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
              // Server returned an HTML error page
              errorMessage = "The server returned an unexpected response. Please try again later."
            } else {
              errorMessage =
                error.response.data.detail ||
                error.response.data.email ||
                error.response.data.message ||
                error.response.data.error ||
                "Failed to send verification email. Please try again."
              
              // Handle array of errors
              if (Array.isArray(errorMessage)) {
                errorMessage = errorMessage[0]
              }
            }
          }
        } else if (error.request) {
          // The request was made but no response was received
          errorMessage = "No response from server. Please check your internet connection and try again."
        } else {
          // Something happened in setting up the request
          errorMessage = error.message || "An unexpected error occurred. Please try again."
        }

        setError(errorMessage)

        toast({
          title: "Request failed",
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        // Handle non-Axios errors
        const errorMessage = error instanceof Error 
          ? error.message 
          : "An unexpected error occurred. Please try again.";
        setError(errorMessage);
        
        toast({
          title: "Request failed",
          description: errorMessage,
          variant: "destructive",
        });
      }

      if (axios.isAxiosError(error)) {
        console.error("Response error data:", error.response?.data)

        // Extract error message from API response if available
        let errorMessage = "Failed to send verification email. Please try again."

        // More detailed error handling
        if (error.response) {
          console.log("Error response status:", error.response.status)
          console.log("Error response data:", error.response.data)
          
          // Handle different status codes
          if (error.response.status === 500) {
            errorMessage = "The server encountered an error. Please try again later or contact support."
          } else if (error.response.status === 404) {
            errorMessage = "Email not found in our system. Please check the email address or sign up."
          } else if (error.response.data) {
            // Try to extract error message from various response formats
            if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
              // Server returned an HTML error page
              errorMessage = "The server returned an unexpected response. Please try again later."
            } else {
              errorMessage =
                error.response.data.detail ||
                error.response.data.email ||
                error.response.data.message ||
                error.response.data.error ||
                "Failed to send verification email. Please try again."
              
              // Handle array of errors
              if (Array.isArray(errorMessage)) {
                errorMessage = errorMessage[0]
              }
            }
          }
        } else if (error.request) {
          // The request was made but no response was received
          errorMessage = "No response from server. Please check your internet connection and try again."
        } else {
          // Something happened in setting up the request
          errorMessage = error.message || "An unexpected error occurred. Please try again."
        }

        setError(errorMessage)

        toast({
          title: "Request failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }


  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // In a real implementation, you would validate the verification code with your API
      // For now, we'll simulate a successful verification

      // Show success toast
      toast({
        title: "Verification successful",
        description: "Your identity has been verified.",
      })

      // Move to the success step
      setCurrentStep("success")
    } catch (error) {
      console.error("Verification failed:", error)

      // Extract error message from API response if available
      let errorMessage = "Invalid verification code. Please try again."
      
      if (axios.isAxiosError(error)) {
        console.error("Response error data:", error.response?.data)

        if (error.response?.data) {
          errorMessage =
            error.response.data.detail ||
            error.response.data.code ||
            error.response.data.message ||
            "Invalid verification code. Please try again."
        }

        setError(errorMessage)

        toast({
          title: "Verification failed",
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        // Handle non-Axios errors
        const errorMessage = error instanceof Error 
          ? error.message 
          : "An unexpected error occurred. Please try again.";
        setError(errorMessage);
        
        toast({
          title: "Verification failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false)
    }
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

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          className="w-full text-white h-11 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 rounded-[15px]"
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Verify Email Address"}
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

  // Update the renderVerificationStep function to match the design
  const renderVerificationStep = () => (
    <CardContent className="flex flex-col justify-center flex-grow text-center">
      <h2 className="text-left text-[25px] font-[500] text-white pb-2">Reset your password</h2>

      <p className="mb-6 text-sm text-left text-zinc-400">
        Enter the code we&apos;ve sent to <span className="text-white">{email}</span> to verify your identity and reset
        your password.
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
            disabled={isLoading}
            required
          />
        </div>

        {error && <p className="text-sm text-left text-red-500">{error}</p>}

        <Button
          type="submit"
          className="w-full text-white font-medium h-11 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 rounded-[15px]"
          disabled={isLoading}
        >
          {isLoading ? "Verifying..." : "Verify code"}
        </Button>

        <p className="mt-2 text-xs text-left text-zinc-500">
          Not seeing the email in your inbox?{" "}
          <span
            className="text-white cursor-pointer hover:underline"
            onClick={() => handleEmailSubmit({ preventDefault: () => {} } as React.FormEvent)}
          >
            Resend code
          </span>
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
          Back to email verification
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
            onClick={() =>
              router.push(
                `/reset-password?uid=${encodeURIComponent("UID_PLACEHOLDER")}&token=${encodeURIComponent("TOKEN_PLACEHOLDER")}`,
              )
            }
            className="w-full text-white h-11 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 rounded-[15px]"
          >
            Reset Password
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/signin")}
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
        <Card className="w-full max-w-[503px] mx-auto lg:min-h-[96vh] bg-transparent border-transparent flex flex-col">
          <CardHeader className="space-y-3">
            <Logo />
          </CardHeader>

          <CardContent className="flex items-center flex-grow py-4 overflow-y-auto">
            {currentStep === "email" && renderEmailStep()}
            {currentStep === "verification" && renderVerificationStep()}
            {currentStep === "success" && renderSuccessStep()}
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

