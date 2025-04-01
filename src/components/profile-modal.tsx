"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { Camera } from "lucide-react"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: user?.username || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    avatar: user?.avatar || ""
  })

  // Update form data when user data changes or modal is opened
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        username: user.username || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        avatar: user.avatar || ""
      })
    }
  }, [user, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Only include fields that have actually changed from the original user data
      const changedFields: any = {}; 
      
      if (user?.username !== formData.username) changedFields.username = formData.username;
      if (user?.first_name !== formData.first_name) changedFields.first_name = formData.first_name;
      if (user?.last_name !== formData.last_name) changedFields.last_name = formData.last_name;
      
      // Don't proceed if no changes were made
      if (Object.keys(changedFields).length === 0) {
        toast({
          title: "No changes detected",
          description: "You haven't made any changes to your profile.",
        });
        onClose();
        return;
      }
      
      console.log("Profile modal: Submitting profile update with changed fields:", changedFields);
      
      setIsLoading(true)

      try {
        // Update the user profile via the auth context with only changed fields
        await updateProfile(changedFields)

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        })
        
        // Add a small delay before closing the modal for better UX
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (error: any) {
        console.error("Profile update error:", error)
        
        // Extract error message from API response if available
        let errorMessage = "Failed to update profile. Please try again."

        if (error.response?.data) {
          const responseData = error.response.data
          
          // Handle multiple error messages
          const errorMessages = []
          if (responseData.username) errorMessages.push(`Username: ${responseData.username[0]}`)
          if (responseData.first_name) errorMessages.push(`First Name: ${responseData.first_name[0]}`)
          if (responseData.last_name) errorMessages.push(`Last Name: ${responseData.last_name[0]}`)
          if (responseData.detail) errorMessages.push(responseData.detail)
          if (responseData.error) errorMessages.push(responseData.error)
          if (responseData.message) errorMessages.push(responseData.message)

          errorMessage = errorMessages.join(". ") || "Failed to update profile. Please try again."
        } else if (error.message) {
          // Handle direct error message from auth context or elsewhere
          errorMessage = error.message;
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    } catch (outerError: any) {
      console.error("Profile form error:", outerError)
      toast({
        title: "Error",
        description: "There was a problem with the form submission.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Here you would typically upload the image to your storage service
      // For now, we'll just create a local URL
      const url = URL.createObjectURL(file)
      setFormData((prev) => ({ ...prev, avatar: url }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl text-muted-foreground">Profile Settings</DialogTitle>
          <DialogDescription className="text-zinc-400">Update your basic profile information.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="py-4 space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                {formData.avatar ? (
                  <Image
                    src={formData.avatar || "/placeholder.svg"}
                    alt={formData.username || "User"}
                    width={80}
                    height={80}
                    className="object-cover rounded-full"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-2xl rounded-full bg-zinc-800 text-zinc-400">
                    {formData.first_name?.[0] || formData.username?.[0] || "U"}
                  </div>
                )}
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-1 rounded-full cursor-pointer bg-background hover:bg-zinc-700"
              >
                <Camera className="w-4 h-4 text-zinc-400" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-muted-foreground">
              Username
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
              className=" border-border bg-card"
              placeholder="Enter your username"
            />
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-muted-foreground">
              First Name
            </Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
              className=" border-border bg-card"
              placeholder="Enter your first name"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-muted-foreground">
              Last Name
            </Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
              className="border-border bg-card"
              placeholder="Enter your last name"
            />
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground">
              Email (Read-only)
            </Label>
            <Input
              id="email"
              value={user?.email || ""}
              readOnly
              disabled
              className=" border-border bg-card opacity-70"
            />
          </div>

          {/* Subscription Info (Read-only) */}
          {user?.subscription_type && (
            <div className="p-4 space-y-2 rounded-md bg-zinc-800">
              <h3 className="text-sm font-medium text-white">Subscription Info</h3>
              <div className="text-xs text-zinc-400">
                <p>Type: <span className="text-white">{user.subscription_type}</span></p>
                {user.subscription_start_date && (
                  <p>Start: <span className="text-white">{new Date(user.subscription_start_date).toLocaleDateString()}</span></p>
                )}
                {user.subscription_end_date && (
                  <p>End: <span className="text-white">{new Date(user.subscription_end_date).toLocaleDateString()}</span></p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border text-zinc-400 "
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-white bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

