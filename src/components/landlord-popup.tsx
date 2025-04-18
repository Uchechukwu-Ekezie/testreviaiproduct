"use client"

import type React from "react"
import { X, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { UserReviews } from "@/lib/api"
import { toast } from "./ui/use-toast"

interface ReportYourLandlordProps {
  isOpen: boolean
  onClose: () => void
  activeSession?: string | null
}

const ReportYourLandlord: React.FC<ReportYourLandlordProps> = ({ isOpen, onClose, activeSession = null }) => {
  const { user } = useAuth()
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [experience, setExperience] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<FileList | null>(null)

  // Set email from user when component mounts or user changes
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email)
    }
  }, [user])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address || !experience) {
      toast({ title: "Warning", description: "Please fill in address and your experience." })
      return
    }

    if (!user) {
      toast({ title: "Error", description: "You must be logged in to report a landlord.", variant: "destructive" })
      return
    }

    // Prepare the data for the API
    const data = {
      address,
      review_text: experience,
      user: user.id || "",
      chat_session: activeSession || "general",
      // Add a flag to indicate this is a landlord report
      report_type: "landlord_report",
    }

    try {
      setIsSubmitting(true)

      // Log the data being sent to help with debugging
      console.log("Submitting landlord report with data:", data)

      // Call the API function
      const response = await UserReviews.postReview(data)

      console.log("Landlord report submitted successfully:", response)

      // Handle file uploads if any
      if (files && files.length > 0) {
        // This is a placeholder for file upload functionality
        // You would need to implement a file upload API call here
        console.log("Files to upload:", files)

        // Example of how you might handle file uploads:
        // const formData = new FormData()
        // formData.append('review_id', response.id)
        // for (let i = 0; i < files.length; i++) {
        //   formData.append('files', files[i])
        // }
        // await api.post('/reviews/upload-files/', formData)
      }

      toast({
        title: "Success",
        description: "Thanks for reporting your landlord! Your report has been recorded.",
      })

      // Reset form fields
      setAddress("")
      setExperience("")
      setFiles(null)

      // Close the popup
      onClose()
    } catch (err: any) {
      console.error("Error submitting landlord report:", err)

      // Show a more specific error message if available
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Failed to submit your report. Please try again later."

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
      <div className="w-[90%] max-w-[600px] bg-background border border-border rounded-[10px] shadow-lg flex flex-col overflow-hidden">
        <div className="relative p-5 max-w-[426px] mx-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-[-50] text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="pt-6 mb-2 text-xl font-semibold text-center text-white">Report your Landlord</h2>
          <p className="mb-4 text-sm text-gray-400">
            Have you recently experienced an unpleasant situation with your landlord? Please share, we would love to
            help address the issue!
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-1 text-sm text-gray-400">
                Enter your email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!user?.email} // Disable if user is logged in
                  className="w-full py-2 pr-3 text-white border rounded-md bg-background border-border pl-9 placeholder:text-gray-500 disabled:opacity-70 disabled:cursor-not-allowed"
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
              {user?.email && (
                <p className="mt-1 text-xs text-gray-400">
                  Using your account email. This field is automatically filled.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block mb-1 text-sm text-gray-400">
                Landlord's Property Address
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g No. 15, Admiralty Way, Lekki, Lagos"
                className="w-full px-3 py-2 text-white border rounded-md bg-background border-border placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <label htmlFor="experience" className="block mb-1 text-sm text-gray-400">
                Describe your experience with the landlord
              </label>
              <div className="relative">
                <textarea
                  id="experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Describe any issues you've faced with your landlord"
                  className="w-full bg-background border border-border rounded-md py-2 px-3 text-white placeholder:text-gray-500 min-h-[80px]"
                  required
                />
                <button
                  type="button"
                  className="absolute text-gray-400 bottom-2 right-2 hover:text-white"
                  aria-label="Add attachment"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="photos" className="block mb-1 text-sm text-gray-400">
                Upload photos (optional)
              </label>
              <input
                type="file"
                id="photos"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="w-full px-3 py-2 text-gray-400 border rounded-md bg-background border-border hover:text-white file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-gray-700 file:text-white hover:file:bg-gray-600"
              />
              {files && files.length > 0 && (
                <p className="mt-1 text-xs text-gray-400">
                  {files.length} file{files.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !user}
              className="w-full py-2 rounded-md text-white font-medium bg-gradient-to-r from-[#FFD700] to-[#780991] hover:from-yellow-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : user ? "Submit Report" : "Please log in to submit"}
            </button>

            {!user && (
              <p className="text-xs text-center text-red-400">You need to be logged in to report a landlord.</p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default ReportYourLandlord
