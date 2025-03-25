"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { PaymentModal } from "./payment-modal"
import { toast } from "@/components/ui/use-toast"

interface UpgradePlanModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Plan {
  id: string
  name: string
  price: number
  tokens: number
  popular?: boolean
  isFree?: boolean
}

export function UpgradePlanModal({ isOpen, onClose }: UpgradePlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null) // Track selected plan
  const [showPayment, setShowPayment] = useState(false)

  const plans: Plan[] = [
    {
      id: "freebie",
      name: "Onboarding Freebie",
      price: 0,
      tokens: 15,
      isFree: true,
    },
    {
      id: "basic",
      name: "Basic Plan",
      price: 8000,
      tokens: 10,
    },
    {
      id: "popular",
      name: "Popular Plan",
      price: 18500,
      tokens: 25,
      popular: true,
    },
    {
      id: "value",
      name: "Best Value Plan",
      price: 35500,
      tokens: 60,
    },
    {
      id: "premium",
      name: "Premium Plan",
      price: 75000,
      tokens: 150,
    },
  ]

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlanId(plan.id) // Track the selected plan
    setSelectedPlan(plan)

    if (plan.isFree) {
      toast({
        title: "Free plan activated",
        description: "Your free tokens have been added to your account.",
      })
      onClose()
    } else {
      setShowPayment(true)
    }
  }

  const handlePaymentClose = () => {
    setShowPayment(false)
    onClose()
  }

  const formatPrice = (price: number) => {
    if (price === 0) return "Free"
    return `₦${price.toLocaleString()}`
  }

  return (
    <>
      <Dialog open={isOpen && !showPayment} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[650px] bg-[#1A1A1A] border-zinc-800 p-0 overflow-hidden">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl text-center text-white">Subscription Plan</DialogTitle>
              <p className="text-sm text-center text-zinc-400">Select your Plan</p>
              <p className="mt-1 text-xs text-center text-zinc-500">
                Unlock more insights with the right plan for you.
              </p>
            </DialogHeader>

            {/* First 3 Plans */}
            <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-3">
              {plans.slice(0, 3).map((plan) => (
                <div
                  key={plan.id}
                  className={`group relative p-4 rounded-lg border border-zinc-800 bg-[#262626] flex flex-col items-center transition-all
                    ${plan.id === selectedPlanId ? "ring-2 ring-blue-500 border-blue-500" : ""}
                    hover:ring-2 hover:ring-yellow-500 hover:border-yellow-500`}
                >
                  <h3 className="mb-2 text-sm font-medium text-zinc-400">{plan.name}</h3>
                  <div className="mb-1 text-3xl font-bold text-white">{plan.tokens}</div>
                  <div className="mb-4 text-xs text-zinc-500">Tokens</div>
                  <div className="mb-6 text-xl font-semibold text-white">{formatPrice(plan.price)}</div>

                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full text-white transition-all bg-zinc-800 group-hover:bg-gradient-to-r group-hover:from-yellow-500 group-hover:to-pink-500"
                  >
                    {plan.isFree ? "Get Now" : "Buy Now"}
                  </Button>
                </div>
              ))}
            </div>

            {/* Last 2 Plans */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {plans.slice(3).map((plan) => (
                <div
                  key={plan.id}
                  className={`group relative p-4 rounded-lg border border-zinc-800 bg-[#262626] flex flex-col items-center transition-all
                    ${plan.id === selectedPlanId ? "ring-2 ring-blue-500 border-blue-500" : ""}
                    hover:ring-2 hover:ring-yellow-500 hover:border-yellow-500`}
                >
                  <h3 className="mb-2 text-sm font-medium text-zinc-400">{plan.name}</h3>
                  <div className="mb-1 text-3xl font-bold text-white">{plan.tokens}</div>
                  <div className="mb-4 text-xs text-zinc-500">Tokens</div>
                  <div className="mb-6 text-xl font-semibold text-white">{formatPrice(plan.price)}</div>

                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full text-white transition-all bg-zinc-800 group-hover:bg-gradient-to-r group-hover:from-yellow-500 group-hover:to-pink-500"
                  >
                    Buy Now
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {selectedPlan && !selectedPlan.isFree && (
        <PaymentModal
          isOpen={showPayment}
          onClose={handlePaymentClose}
          planDetails={{
            name: selectedPlan.name,
            price: selectedPlan.price
          }}
        />
      )}
    </>
  )
}

