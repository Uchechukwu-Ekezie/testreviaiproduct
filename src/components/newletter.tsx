"use client"

import type React from "react"

import { useState } from "react"
import { MailIcon } from "lucide-react"
import { toast } from "react-toastify"

export default function NewsletterSection() {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // TODO: Implement your newsletter signup logic here
      // Submitting email
      
      // Show success toast
      toast.success("Thank you! You've been added to our waitlist.")
      
      // Reset the email input after submission
      setEmail("")
    } catch (error) {
      console.error("Newsletter signup error:", error)
      toast.error("Failed to join waitlist. Please try again.")
    }
  }

  return (
    <section className="py-12 px-4 sm:px-6 md:py-16" id="newsletter">
      <div className="max-w-[995px] min-h-[344px] mx-auto bg-[#141414] rounded-[15px] py-12 px-6 text-center flex flex-col justify-center items-center shadow-lg">
        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-semibold text-white mt-[30px]">Join the Waitlist</h2>
        <p className="text-white/70 text-sm sm:text-[16px] max-w-[522px] leading-[23.3px] mx-auto mt-4">
          Be the first to know when there are new updates, price changes or property insights.
        </p>

        {/* Input Box */}
        <form onSubmit={handleSubmit} className="w-full max-w-[431px] mt-6">
          <div className="flex items-center bg-[#1E1E1E] rounded-[15px] border border-white/10">
            {/* Email Icon */}
            <MailIcon className="text-gray-400 w-5 h-5 ml-2" aria-hidden="true" />

            {/* Input Field */}
            <input
              type="email"
              id="email-input"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-gray-400 pl-3 pr-4 py-2 focus:outline-none border-none"
              required
              aria-label="Email address"
            />

            {/* Button at the End */}
            <button
              type="submit"
              className="bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-orange-600 hover:to-pink-600 text-white font-medium px-6 py-2 rounded-[15px] ml-2"
            >
              Join
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

