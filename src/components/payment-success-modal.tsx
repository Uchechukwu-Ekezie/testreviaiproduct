"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ThumbsUp } from "lucide-react"

interface PaymentSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  subscriptionDetails: {
    plan: string
    amount: number
    nextBillingDate: string
    paymentMethod: string
  }
}

export function PaymentSuccessModal({ isOpen, onClose, subscriptionDetails }: PaymentSuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800">
        <div className="flex flex-col items-center text-center">
          {/* Success Icon */}
          <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-gradient-to-r from-yellow-500 to-pink-500">
            <ThumbsUp className="w-8 h-8 text-white" />
          </div>

          {/* Success Message */}
          <h2 className="mb-2 text-xl font-semibold text-white">
            Success! Welcome to Revi ai {subscriptionDetails.plan}
          </h2>
          <p className="mb-2 text-sm text-zinc-400">Your subscription is now active</p>
          <p className="mb-8 text-sm text-zinc-400">
            You can now generate unlimited property records & get premium insights.
          </p>

          {/* Subscription Details */}
          <div className="w-full">
            <h3 className="mb-4 text-sm font-medium text-left text-white">Subscription Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-400">Plan:</span>
                <span className="text-sm text-white">{subscriptionDetails.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-400">Amount:</span>
                <span className="text-sm text-white">${subscriptionDetails.amount}/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-400">Next Billing Date:</span>
                <span className="text-sm text-white">{subscriptionDetails.nextBillingDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-400">Payment Method:</span>
                <span className="text-sm text-white">•••• •••• •••• {subscriptionDetails.paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={onClose}
            className="w-full mt-8 text-white bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600"
          >
            Start Exploring
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

