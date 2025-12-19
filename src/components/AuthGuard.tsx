"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
  onLoginRequired?: () => void;
}

export default function AuthGuard({
  children,
  redirectTo = "/login",
  onLoginRequired,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (onLoginRequired) {
        onLoginRequired();
      } else {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, router, redirectTo, onLoginRequired]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  // If authenticated, show the protected content
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated, show nothing (will redirect)
  return null;
}
