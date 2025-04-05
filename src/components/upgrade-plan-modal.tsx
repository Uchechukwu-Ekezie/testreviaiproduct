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
        <DialogContent className="sm:max-w-[650px] md:max-w-[700px] bg-[#1A1A1A] border-zinc-800 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="p-3 sm:p-4 md:p-6">
            <DialogHeader className="mb-4 sm:mb-6">
              <DialogTitle className="text-lg text-center text-white sm:text-xl">Subscription Plan</DialogTitle>
              <p className="text-xs text-center sm:text-sm text-zinc-400">Select your Plan</p>
              <p className="mt-1 text-xs text-center text-zinc-500">
                Unlock more insights with the right plan for you.
              </p>
            </DialogHeader>

            {/* Plans - Responsive Grid */}
            <div className="grid grid-cols-1 gap-3 mb-3 xs:grid-cols-2 sm:grid-cols-3 sm:gap-4 sm:mb-4">
              {plans.slice(0, 5).map((plan) => (
                <div
                  key={plan.id}
                  className={`group relative p-3 sm:p-4 rounded-lg border border-zinc-800 bg-[#262626] flex flex-col items-center transition-all
                    ${plan.id === selectedPlanId ? "ring-2 ring-blue-500 border-blue-500" : ""}
                    hover:ring-2 hover:ring-yellow-500 hover:border-yellow-500`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] px-2 py-0.5 rounded-full font-medium">
                      Popular
                    </div>
                  )}
                  <h3 className="mb-2 text-xs font-medium text-center sm:text-sm text-zinc-400">{plan.name}</h3>
                  <div className="mb-1 text-2xl font-bold text-white sm:text-3xl">{plan.tokens}</div>
                  <div className="mb-3 sm:mb-4 text-[10px] sm:text-xs text-zinc-500">Tokens</div>
                  <div className="mb-4 text-base font-semibold text-white sm:mb-6 sm:text-xl">
                    {formatPrice(plan.price)}
                  </div>

                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full h-8 text-sm text-white transition-all sm:h-10 bg-zinc-800 group-hover:bg-gradient-to-r group-hover:from-yellow-500 group-hover:to-pink-500"
                  >
                    {plan.isFree ? "Get Now" : "Buy Now"}
                  </Button>
                </div>
              ))}
            </div>

            {/* Last 2 Plans */}
            <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4">
              {plans.slice(5).map((plan) => (
                <div
                  key={plan.id}
                  className={`group relative p-3 sm:p-4 rounded-lg border border-zinc-800 bg-[#262626] flex flex-col items-center transition-all
                    ${plan.id === selectedPlanId ? "ring-2 ring-blue-500 border-blue-500" : ""}
                    hover:ring-2 hover:ring-yellow-500 hover:border-yellow-500`}
                >
                  <h3 className="mb-2 text-xs font-medium text-center sm:text-sm text-zinc-400">{plan.name}</h3>
                  <div className="mb-1 text-2xl font-bold text-white sm:text-3xl">{plan.tokens}</div>
                  <div className="mb-3 sm:mb-4 text-[10px] sm:text-xs text-zinc-500">Tokens</div>
                  <div className="mb-4 text-base font-semibold text-white sm:mb-6 sm:text-xl">
                    {formatPrice(plan.price)}
                  </div>

                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full h-8 text-sm text-white transition-all sm:h-10 bg-zinc-800 group-hover:bg-gradient-to-r group-hover:from-yellow-500 group-hover:to-pink-500"
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
            price: selectedPlan.price,
          }}
        />
      )}
    </>
  )
}

