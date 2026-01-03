"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { bookingAPI } from "@/lib/api";
import { toast } from "react-toastify";
import { Check, X, Loader2 } from "lucide-react";

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying payment...");
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get reference from URL params (Paystack redirects with ?reference=...)
        const reference = searchParams.get("reference");
        const trxref = searchParams.get("trxref"); // Alternative param name

        const paymentReference = reference || trxref;

        if (!paymentReference) {
          setStatus("error");
          setMessage("Payment reference not found. Please contact support.");
          return;
        }

        // Verify payment with backend
        const result = await bookingAPI.verifyPayment(paymentReference) as any;

        if (result?.status === "success" || result?.status === "paid") {
          setStatus("success");
          setMessage("Payment verified successfully!");
          setPaymentData(result);
          
          toast.success("Payment successful! Your booking has been confirmed.");
          
          // Redirect to bookings page after 3 seconds
          setTimeout(() => {
            router.push("/user-dashboard/bookings");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(result?.message || "Payment verification failed.");
          toast.error("Payment verification failed. Please contact support.");
        }
      } catch (error: any) {
        console.error("Payment verification error:", error);
        setStatus("error");
        setMessage(error.message || "Failed to verify payment. Please contact support.");
        toast.error("Payment verification failed. Please contact support.");
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-white/5 rounded-xl p-8 max-w-md w-full text-center border border-white/10">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-[#FFD700] mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-white mb-2">Verifying Payment</h2>
            <p className="text-white/70">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-white/70 mb-4">{message}</p>
            {paymentData && (
              <div className="bg-white/5 rounded-lg p-4 mb-4 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Amount:</span>
                    <span className="text-white">
                      ₦{paymentData.amount?.toLocaleString() || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Reference:</span>
                    <span className="text-white font-mono text-xs">
                      {paymentData.reference || "N/A"}
                    </span>
                  </div>
                  {paymentData.paid_at && (
                    <div className="flex justify-between">
                      <span className="text-white/70">Paid At:</span>
                      <span className="text-white">
                        {new Date(paymentData.paid_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <p className="text-white/50 text-sm mb-4">
              Redirecting to your bookings...
            </p>
            <button
              onClick={() => router.push("/user-dashboard/bookings")}
              className="w-full bg-[#FFD700] text-black font-semibold py-3 rounded-lg hover:bg-[#FFA500] transition-colors"
            >
              View My Bookings
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Verification Failed</h2>
            <p className="text-white/70 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/user-dashboard/bookings")}
                className="w-full bg-[#FFD700] text-black font-semibold py-3 rounded-lg hover:bg-[#FFA500] transition-colors"
              >
                View My Bookings
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full bg-white/10 text-white font-semibold py-3 rounded-lg hover:bg-white/20 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-white/5 rounded-xl p-8 max-w-md w-full text-center border border-white/10">
            <Loader2 className="w-16 h-16 text-[#FFD700] mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-white mb-2">Loading...</h2>
            <p className="text-white/70">Preparing payment verification...</p>
          </div>
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}


