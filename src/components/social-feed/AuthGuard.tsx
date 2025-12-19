"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

/**
 * Auth Guard Component
 * Checks authentication ONLY ONCE when component first mounts
 * No loading screen - relies on parent auth context loading state
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const checkedRef = useRef(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only check once per component lifetime
    if (checkedRef.current) return;

    // Wait for auth to load
    if (isLoading) return;

    // Mark as checked
    checkedRef.current = true;

    // Redirect if not authenticated (only once)
    if (!isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push("/signin");
    }
  }, [isLoading, isAuthenticated, router]);

  // Always render children immediately - no loading screen
  // The auth context already handles the initial loading state
  return <>{children}</>;
}
