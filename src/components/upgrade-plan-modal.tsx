"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { useState } from "react"
import { PaymentModal } from "./payment-modal"


interface UpgradePlanModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PlanFeature {
  name: string
  included: boolean
}

interface Plan {
  name: string
  price: number
  period: string
  features: PlanFeature[]
}

const plans: Plan[] = [
  {
    name: "Basic",
    price: 5,
    period: "month",
    features: [
      { name: "Basic property search", included: true },
      { name: "Limited property insights", included: true },
      { name: "Email support", included: true },
      { name: "Advanced analytics", included: false },
      { name: "Priority support", included: false },
      { name: "Custom reports", included: false },
    ],
  },
  {
    name: "Premium",
    price: 15,
    period: "month",
    features: [
      { name: "Basic property search", included: true },
      { name: "Advanced property insights", included: true },
      { name: "Priority support", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Custom reports", included: true },
      { name: "API access", included: true },
    ],
  },
]

export function UpgradePlanModal({ isOpen, onClose }: UpgradePlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showPayment, setShowPayment] = useState(false)

  const handleUpgrade = () => {
    if (!selectedPlan) return
    setShowPayment(true)
  }

  const handlePaymentClose = () => {
    setShowPayment(false)
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen && !showPayment} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl text-center text-white">Subscription Plan</DialogTitle>
            <p className="text-sm text-center text-zinc-400">Select your Plan</p>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-6 rounded-lg border cursor-pointer transition-all ${
                  selectedPlan === plan
                    ? "border-yellow-500 bg-zinc-800/50"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                {/* Plan Header */}
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-white">${plan.price}</span>
                    <span className="text-zinc-400">/{plan.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className={`w-4 h-4 ${feature.included ? "text-green-500" : "text-zinc-700"}`} />
                      <span className={`text-sm ${feature.included ? "text-zinc-300" : "text-zinc-600 line-through"}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Selected Indicator */}
                {selectedPlan === plan && (
                  <div className="absolute inset-0 border-2 border-yellow-500 rounded-lg pointer-events-none" />
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleUpgrade}
              disabled={!selectedPlan}
              className="flex-1 text-white bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600"
            >
              Upgrade Plan
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

      {selectedPlan && (
        <PaymentModal
          isOpen={showPayment}
          onClose={handlePaymentClose}
          planDetails={{
            name: selectedPlan.name,
            price: selectedPlan.price,
          }}
        />
      )}
    </>
  )
}

