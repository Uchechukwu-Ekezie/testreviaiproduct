"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Testimonial from "@/components/testimonial"
import { useMediaQuery } from "@/hooks/use-mobile"
import Logo from "@/components/logo"
import PPTU from "@/components/pptu"

export default function VerifyHumanPage() {
  const [verificationCode, setVerificationCode] = useState("")
  const [displayCode] = useState("SBYSW8DJ") // In a real app, this would be generated
  const [error, setError] = useState("")
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 1024px)")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (verificationCode.toUpperCase() === displayCode) {
      // Here you would typically verify with your backend
      router.push("/signin") // Redirect to login page after successful verification
    } else {
      setError("Invalid verification code. Please try again.")
    }
  }

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 mx-auto bg-[#212121]">
      <div className="flex flex-col items-center w-full gap-8 mx-auto lg:flex-row max-w-1440">
        <Card className="w-full max-w-[503px] mx-auto min-h-[96vh]">
          <CardHeader className="flex-grow space-y-3">
           <Logo/>
          </CardHeader>

          <CardContent className="flex-grow ">
            <h2 className="text-center text-[20px] font-[500] text-white pb-6">Verify you&apos;re human</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Display the verification code */}
                <div className="flex p-4 text-center justify-center items-center  bg-[#262626] rounded-[15px] h-[100px]">
                  <p className="font-mono text-[40px] tracking-wider text-zinc-400">{displayCode}</p>
                </div>

                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter verification code"
                  className="border border-white/15 w-full bg-transparent h-11 rounded-[15px] text-white !text-[16px] placeholder:text-[17px] placeholder:text-white pl-10 pr-10 focus:outline-none focus:ring-0 focus:border-white/40"

                  required
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                className="w-full text-white font-medium h-11 bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 rounded-[15px]"
              >
                Verify
              </Button>
            </form>
          </CardContent>

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

