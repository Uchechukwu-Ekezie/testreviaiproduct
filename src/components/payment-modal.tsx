"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { PaymentSuccessModal } from "./payment-success-modal"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  planDetails: {
    name: string
    price: number
  }
}

export function PaymentModal({ isOpen, onClose, planDetails }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardholderName: "",
  })
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Here you would typically integrate with your payment processor
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call

      // Show success modal instead of toast
      setShowSuccess(true)
    } catch {
      toast({
        title: "Payment failed",
        description: "Please check your payment details and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, "")
      .replace(/(\d{4})/g, "$1 ")
      .trim()
  }

  const formatExpiry = (value: string) => {
    return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2")
  }

  const handleSuccessClose = () => {
    setShowSuccess(false)
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen && !showSuccess} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Complete Payment</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            {/* Left Column - Payment Method */}
            <div className="space-y-6">
              <div>
                <h3 className="mb-4 text-sm font-medium text-white">Payment Method</h3>
                <RadioGroup
                  defaultValue="card"
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" className="border-zinc-700" />
                    <Label htmlFor="card" className="text-zinc-400">
                      Credit/Debit Card
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bank" id="bank" className="border-zinc-700" />
                    <Label htmlFor="bank" className="text-zinc-400">
                      Bank Transfer
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber" className="text-zinc-400">
                      Card Number
                    </Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={paymentDetails.cardNumber}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          cardNumber: formatCardNumber(e.target.value),
                        })
                      }
                      maxLength={19}
                      className="text-white bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry" className="text-zinc-400">
                        MM/YY
                      </Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={paymentDetails.expiry}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            expiry: formatExpiry(e.target.value),
                          })
                        }
                        maxLength={5}
                        className="text-white bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv" className="text-zinc-400">
                        CVV
                      </Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={paymentDetails.cvv}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            cvv: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        maxLength={3}
                        className="text-white bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardholderName" className="text-zinc-400">
                      Cardholder Name
                    </Label>
                    <Input
                      id="cardholderName"
                      placeholder="John Doe"
                      value={paymentDetails.cardholderName}
                      onChange={(e) =>
                        setPaymentDetails({
                          ...paymentDetails,
                          cardholderName: e.target.value,
                        })
                      }
                      className="text-white bg-zinc-800 border-zinc-700"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="space-y-6">
              <div>
                <h3 className="mb-4 text-sm font-medium text-white">Order Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">{planDetails.name.toUpperCase()} Plan</span>
                    <span className="text-white">${planDetails.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Monthly Subscription</span>
                  </div>
                  <div className="my-2 border-t border-zinc-800" />
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Subtotal</span>
                    <span className="text-white">${planDetails.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Tax</span>
                    <span className="text-white">$0</span>
                  </div>
                  <div className="my-2 border-t border-zinc-800" />
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total</span>
                    <div className="text-right">
                      <div className="font-medium text-white">${planDetails.price}</div>
                      <div className="text-xs text-zinc-500">monthly</div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-500">Your subscription will renew automatically</p>
            </div>

            {/* Submit Button */}
            <div className="col-span-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full text-white bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600"
              >
                {isLoading ? "Processing..." : "Pay"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <PaymentSuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        subscriptionDetails={{
          plan: planDetails.name,
          amount: planDetails.price,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          paymentMethod: paymentDetails.cardNumber.slice(-4) || "2580",
        }}
      />
    </>
  )
}

