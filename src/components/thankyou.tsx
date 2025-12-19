"use client"

import { useRouter } from "next/navigation"

export default function ThankYou() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full lg:w-[996px] h-[336px] rounded-[15px] bg-[#171717] p-8 backdrop-blur-md">
        <div className="mx-auto max-w-[457px] space-y-6 text-center">
          <h2 className="text-2xl font-semibold text-white mt-12">Thank You for Sharing Your Experience</h2>
          <p className="text-sm text-white/70">
            Your feedback is valuable to us and helps others make better housing decisions.
          </p>
          <button
            onClick={() => router.push("/experience")}
            className="inline-block rounded-[15px] bg-gradient-to-r from-[#FFD700] to-[#780991] px-12 py-2 text-[15px] font-normal text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            Share Another Experience
          </button>
        </div>
      </div>
    </div>
  )
}

