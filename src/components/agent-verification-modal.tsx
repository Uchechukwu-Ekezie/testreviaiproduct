"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast";
import { landlordAPI } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { X, Upload, FileText, Loader2,  } from "lucide-react"

interface AgentVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface VerificationFormData {
  fullName: string
  email: string
  phone: string
  id_document?: string
}

// Add your Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET // Replace with your actual upload preset
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME // Replace with your actual cloud name

export function AgentVerificationModal({ isOpen, onClose, onSuccess }: AgentVerificationModalProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{name: string, url: string} | null>(null)
  const [showStatusView, setShowStatusView] = useState(false)
  const [formData, setFormData] = useState<VerificationFormData>({
    fullName: "",
    email: "",
    phone: "",
  })

  // Get verification status from user context
  const getVerificationStatus = (): 'none' | 'pending' | 'verified' | 'rejected' => {
    if (!user?.agent_request) return 'none'
    
    const status = user.agent_request.status
    if (status === 'pending') return 'pending'
    if (status === 'approved') return 'verified'
    if (status === 'rejected') return 'rejected'
    return 'none'
  }

  const verificationStatus = getVerificationStatus()

  // Auto-fill form when modal opens and user is available
  React.useEffect(() => {
    if (isOpen && user) {
      // Check if user already has a verification status
      if (verificationStatus !== 'none') {
        setShowStatusView(true)
      } else {
        setShowStatusView(false)
        setFormData(prev => ({
          ...prev,
          fullName: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
          email: user.email || "",
          phone: user.phone || user.agent_request?.phone || "",
        }))
      }
    }
  }, [isOpen, user, verificationStatus])

  const handleInputChange = (field: keyof VerificationFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a valid image (PNG, JPG, JPEG) or PDF file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      
      if (!CLOUDINARY_UPLOAD_PRESET || !CLOUDINARY_CLOUD_NAME) {
        throw new Error('Cloudinary configuration is missing')
      }
      
      uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
      uploadFormData.append('folder', 'agent-verification') // Optional: organize files in folders

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: 'POST',
          body: uploadFormData,
        }
      )

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      
      // Store the uploaded file info
      setUploadedFile({
        name: file.name,
        url: data.secure_url
      })

      // Update form data with the Cloudinary URL
      setFormData(prev => ({
        ...prev,
        id_document: data.secure_url
      }))

      toast({
        title: "Upload Successful",
        description: "Your document has been uploaded successfully.",
      })

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const removeUploadedFile = () => {
    setUploadedFile(null)
    setFormData(prev => ({
      ...prev,
      id_document: ""
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.phone) {
      toast({
        title: "Validation Error",
        description: "Please fill in your phone number.",
        variant: "destructive",
      })
      return
    }

    if (!formData.id_document) {
      toast({
        title: "Validation Error",
        description: "Please upload your ID document.",
        variant: "destructive",
      })
      return
    }

    // if (!user?.id) {
    //   toast({
    //     title: "Error",
    //     description: "User not found. Please log in again.",
    //     variant: "destructive",
    //   })
    //   return
    // }

    setIsSubmitting(true)

    try {
      const requestData = {
        // user: user.id,
        phone: formData.phone,
        verification_document: formData.id_document,
      }

      console.log("Submitting verification request with data:", requestData)
      
      // Send phone and verification_document to backend
      await landlordAPI.postAgentRequest(requestData)

      toast({
        title: "Request Submitted",
        description: "Your verification request has been submitted successfully. We'll review it within 2-3 business days.",
      })

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
      })
      setUploadedFile(null)

      onSuccess()
      onClose()
    } catch (error: unknown) {
      console.error("Verification request error:", error)
      let errorMessage = "Failed to submit verification request"
      
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string; detail?: string } } }).response
        errorMessage = response?.data?.message || response?.data?.detail || errorMessage
      }
      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting && !isUploading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md gap-0 p-0 bg-[#262626] border-zinc-800 w-[95vw] sm:w-[90vw] md:w-[85vw] lg:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-zinc-800">
          <DialogTitle className="text-lg font-medium text-white">
            Request Agent Verification
          </DialogTitle>
          <button
            onClick={handleClose}
            disabled={isSubmitting || isUploading}
            className="text-zinc-400 hover:text-white disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm text-zinc-400">
              Full Name *
            </Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              className="text-white bg-zinc-800/50 border-zinc-700"
              placeholder="Enter your full name"
              disabled={isSubmitting || isUploading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-zinc-400">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="text-white bg-zinc-800/50 border-zinc-700"
              placeholder="Enter your email address"
              disabled={isSubmitting || isUploading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm text-zinc-400">
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="text-white bg-zinc-800/50 border-zinc-700"
              placeholder="Enter your phone number"
              disabled={isSubmitting || isUploading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-zinc-400">
              Upload NIN Document *
            </Label>
            
            {!uploadedFile ? (
              <div className="p-4 border-2 border-dashed rounded-lg border-zinc-700">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isSubmitting || isUploading}
                />
                <label
                  htmlFor="file-upload"
                  className={`flex flex-col items-center justify-center cursor-pointer ${
                    isUploading ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 mb-2 text-zinc-400 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 mb-2 text-zinc-400" />
                  )}
                  <span className="text-sm text-center text-zinc-400">
                    {isUploading ? (
                      "Uploading..."
                    ) : (
                      <>
                        Click to upload or drag and drop
                        <br />
                        PNG, JPG, JPEG or PDF (max 5MB)
                      </>
                    )}
                  </span>
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-zinc-800/50 border-zinc-700">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{uploadedFile.name}</p>
                    <p className="text-xs text-zinc-400">Upload successful</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeUploadedFile}
                  disabled={isSubmitting}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || isUploading}
              className="flex-1 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="flex-1 text-white bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}