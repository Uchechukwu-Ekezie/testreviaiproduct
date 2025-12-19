"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export function useAuthRequired() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const checkAuthAndProceed = (callback: () => void) => {
    if (isLoading) return;

    if (isAuthenticated) {
      callback();
    } else {
      router.push("/login");
    }
  };

  return {
    isAuthenticated,
    isLoading,
    checkAuthAndProceed,
  };
}
