"use client"

import type React from "react"
import { X, Plus } from "lucide-react"
import { useState } from "react"

interface TellYourStoryPopupProps {
  isOpen: boolean
  onClose: () => void
}

const TellYourStoryPopup: React.FC<TellYourStoryPopupProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [experience, setExperience] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false)
      onClose()
      // Reset form
      setEmail("")
      setAddress("")
      setExperience("")
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
      <div className="w-[90%] max-w-[600px] bg-background border border-border rounded-[10px] shadow-lg flex flex-col overflow-hidden">
        <div className="relative p-5 max-w-[426px] mx-auto">
          <button onClick={onClose} className="absolute top-4 right-[-50] text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl text-center pt-6 font-semibold text-white mb-2">Tell your story</h2>
          <p className="text-sm text-gray-400 mb-4">
            Have you recently experienced an unpleasant situation with an agent or landlord? Please share, we would love
            to help!
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-gray-400 mb-1">
                Enter your email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-background border border-border rounded-md py-2 pl-9 pr-3 text-white placeholder:text-gray-500"
                  required
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm text-gray-400 mb-1">
                Property Address
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g No. 15, Admiralty Way, Lekki, Lagos"
                className="w-full bg-background border border-border rounded-md py-2 px-3 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <label htmlFor="experience" className="block text-sm text-gray-400 mb-1">
                Share your past experience
              </label>
              <div className="relative">
                <textarea
                  id="experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Add any issues you have faced"
                  className="w-full bg-background border border-border rounded-md py-2 px-3 text-white placeholder:text-gray-500 min-h-[80px]"
                />
                <button type="button" className="absolute bottom-2 right-2 text-gray-400 hover:text-white">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Upload photos</label>
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 bg-background border border-border rounded-md py-2 px-3 text-gray-400 hover:text-white"
              >
                <Plus className="w-4 h-4" />
                <span>Add photos</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 rounded-md text-white font-medium bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 transition-all duration-200"
            >
              {isSubmitting ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TellYourStoryPopup
