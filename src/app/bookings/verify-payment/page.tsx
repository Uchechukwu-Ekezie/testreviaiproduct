"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Redirect page for payment verification
 * 
 * This page handles cases where Paystack redirects to /bookings/verify-payment
 * It extracts the payment reference and redirects to the proper frontend callback page
 * that handles the actual payment verification via API.
 * 
 * Note: This only works if the backend redirects to the frontend URL.
 * If Paystack redirects directly to the backend URL, the backend needs to handle it.
 */
function VerifyPaymentRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract reference from URL params
    const reference = searchParams.get("reference");
    const trxref = searchParams.get("trxref");
    const paymentReference = reference || trxref;

    if (paymentReference) {
      // Redirect to the proper frontend callback page with the reference
      // This page will handle the actual API call to verify payment
      const callbackUrl = `/booking/payment/callback?reference=${paymentReference}${trxref ? `&trxref=${trxref}` : ''}`;
      router.replace(callbackUrl);
    } else {
      // No reference found, redirect to bookings page
      console.error("No payment reference found in URL");
      router.replace("/user-dashboard/bookings");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-white/5 rounded-xl p-8 max-w-md w-full text-center border border-white/10">
        <Loader2 className="w-16 h-16 text-[#FFD700] mx-auto mb-4 animate-spin" />
        <h2 className="text-2xl font-bold text-white mb-2">Processing Payment</h2>
        <p className="text-white/70">Redirecting to payment verification...</p>
      </div>
    </div>
  );
}

export default function VerifyPaymentPage() {
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
      <VerifyPaymentRedirect />
    </Suspense>
  );
}

