"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { AlertTriangle } from "lucide-react"

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { logout } = useAuth()

  const handleDeleteAccount = async () => {
    setIsLoading(true)
    try {
      // Here you would typically call your API to delete the account
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call

      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      })

      // Log out the user after account deletion
      logout()
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Delete Account</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-red-500/10 border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-500">This action cannot be undone.</p>
          </div>

          <div className="space-y-4 text-sm text-zinc-400">
            <p>You are about to delete your account. This will:</p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>Permanently delete your account</li>
              <li>Delete all your chats and conversations</li>
              <li>Cancel any active subscriptions</li>
              <li>Remove all your saved preferences</li>
            </ul>
          </div>

          <div className="pt-4 space-y-4">
            <Button onClick={handleDeleteAccount} disabled={isLoading} variant="destructive" className="w-full">
              {isLoading ? "Deleting..." : "Delete Account"}
            </Button>
            <Button
              onClick={onClose}
              disabled={isLoading}
              variant="outline"
              className="w-full border-zinc-800 text-zinc-400 hover:bg-zinc-800"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

