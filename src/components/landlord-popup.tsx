"use client"

import type React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LandlordVerificationPopupProps {
  isOpen: boolean
  onClose: () => void
}

const LandlordVerificationPopup: React.FC<LandlordVerificationPopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[80%] h-[80%] bg-card border border-border rounded-lg shadow-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Verify Your Landlord</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Search for a Landlord</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter landlord name or property address..."
                  className="flex-1 px-4 py-2 border rounded-md bg-background border-border"
                />
                <Button>Search</Button>
              </div>
            </div>

            <div className="p-4 border rounded-md border-border bg-muted/30">
              <h3 className="mb-2 text-lg font-medium">Why Verify Your Landlord?</h3>
              <p className="text-muted-foreground">
                Verifying your landlord helps ensure you're renting from a legitimate property owner with a good track
                record. Our verification system checks public records, reviews from other tenants, and property
                management credentials.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Verification Process</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-md border-border">
                  <h4 className="mb-2 font-medium">Step 1: Search</h4>
                  <p className="text-sm text-muted-foreground">
                    Enter your landlord's name or property address to search our database.
                  </p>
                </div>
                <div className="p-4 border rounded-md border-border">
                  <h4 className="mb-2 font-medium">Step 2: Review</h4>
                  <p className="text-sm text-muted-foreground">
                    Review the verification results, including ratings and reviews from other tenants.
                  </p>
                </div>
                <div className="p-4 border rounded-md border-border">
                  <h4 className="mb-2 font-medium">Step 3: Verify</h4>
                  <p className="text-sm text-muted-foreground">
                    Confirm the landlord's identity and property ownership through our verification system.
                  </p>
                </div>
                <div className="p-4 border rounded-md border-border">
                  <h4 className="mb-2 font-medium">Step 4: Share</h4>
                  <p className="text-sm text-muted-foreground">
                    Share your own experience to help other tenants make informed decisions.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-md border-border bg-muted/30">
              <h3 className="mb-2 text-lg font-medium">Need Help?</h3>
              <p className="text-muted-foreground">
                If you can't find your landlord or have questions about the verification process, our support team is
                here to help.
                <a
                  href="https://www.reviai.tech/experience"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2 text-blue-500 hover:underline"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LandlordVerificationPopup
