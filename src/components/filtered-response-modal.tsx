"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import { useState } from "react"

interface FilteredResponseModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (role: string) => void
}

interface RoleOption {
  id: string
  title: string
  description: string
}

const roles: RoleOption[] = [
  {
    id: "tenant",
    title: "Tenant",
    description: "Looking for a rental",
  },
  {
    id: "buyer",
    title: "Buyer",
    description: "Searching for properties",
  },
  {
    id: "landlord",
    title: "Landlord",
    description: "Listing and managing properties",
  },
  {
    id: "agent",
    title: "Real Estate Agent",
    description: "Connecting buyers and sellers",
  },
]

export function FilteredResponseModal({ isOpen, onClose, onSelect }: FilteredResponseModalProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const handleContinue = () => {
    if (selectedRole) {
      onSelect(selectedRole)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Filtered Response</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                selectedRole === role.id
                  ? "border-yellow-500 bg-zinc-800/50"
                  : "border-zinc-800 bg-transparent hover:bg-zinc-800/30"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  selectedRole === role.id ? "bg-gradient-to-r from-yellow-500 to-pink-500" : "bg-zinc-800"
                }`}
              >
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-white">{role.title}</div>
                <div className="text-xs text-zinc-400">{role.description}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleContinue}
            disabled={!selectedRole}
            className="flex-1 text-white bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600"
          >
            Continue
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

