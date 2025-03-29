"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Input } from "@/components/ui/input"
import { userAPI } from "@/lib/api"
import { useRouter } from "next/navigation"

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleDeleteAccount = async () => {
    if (confirmText !== "delete my account") {
      toast({
        title: "Error",
        description: "Please type 'delete my account' to confirm",
        variant: "destructive",
      })
      return
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User ID not found",
        variant: "destructive",
      })
      return
    }

    try {
      setIsDeleting(true)
      await userAPI.deleteUserById(user.id)
      
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      })
      
      logout() // Log out the user after successful deletion
      onClose()
      router.push("/signup") // Redirect to signup page after deletion
    } catch (error: any) {
      console.error("Delete account error:", error)
      const errorMessage = error.detail || "Failed to delete account"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md gap-0 p-0 bg-[#262626] border-zinc-800">
        <DialogHeader className="p-3 border-b sm:p-4 border-zinc-800">
          <DialogTitle className="text-base font-normal text-white sm:text-lg">
            Delete Account
          </DialogTitle>
        </DialogHeader>

        <div className="p-3 space-y-4 sm:p-4">
          <div className="space-y-2">
            <p className="text-sm text-zinc-400">
              This action cannot be undone. This will permanently delete your account and remove all associated data.
            </p>
            <p className="text-sm text-zinc-400">
              Please type <span className="text-white">&quot;delete my account&quot;</span> to confirm.
            </p>
          </div>

          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="text-white bg-zinc-800/50 border-zinc-700"
            placeholder="Type 'delete my account'"
            disabled={isDeleting}
          />

          <div className="flex gap-2 pt-2">
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={confirmText !== "delete my account" || isDeleting}
              className="flex-1"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 border-zinc-700 hover:bg-zinc-800 text-zinc-400"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

