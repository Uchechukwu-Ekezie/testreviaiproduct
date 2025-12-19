"use client";

import { DashboardProvider } from "@/contexts/dashboard-context";
import { ReviewsProvider } from "@/contexts/reviews-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { PropertiesProvider } from "@/contexts/properties-context";
import ScreenSizeGuard from "@/components/dashboard/screen-size-guard";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("Dashboard Layout: Auth state changed", {
      isLoading,
      user: user
        ? {
            id: user.id,
            type: user.type,
            agent_request: user.agent_request,
            agent_info: user.agent_info,
          }
        : null,
    });

    // Add a small delay to prevent premature redirects during page refresh
    if (!isLoading && user === null) {
      console.log(
        "Dashboard Layout: No user found, adding delay before redirect"
      );
      // Wait a bit longer to ensure auth state is fully settled
      const timeout = setTimeout(() => {
        console.log("Dashboard Layout: Delayed redirect to homepage");
        router.push("/");
      }, 500); // 500ms delay

      return () => clearTimeout(timeout);
    }

    if (!isLoading && user) {
      const isAgent =
        user?.agent_request?.status === "approved" ||
        user?.agent_info?.status === "approved";
      const isAdmin = user?.type === "admin";
      const isLandlord = user?.type === "landlord";
      const isRegularUser = user?.type === "user"; // Handle regular users

      console.log("Dashboard Layout: Authorization check", {
        isAgent,
        isAdmin,
        isLandlord,
        isRegularUser,
        agent_request_status: user?.agent_request?.status,
        agent_info_status: user?.agent_info?.status,
        user_type: user?.type,
        raw_user_type: JSON.stringify(user?.type),
      });

      // Allow access if user is agent (approved), admin, landlord, or regular user
      if (isAgent || isAdmin || isLandlord || isRegularUser) {
        console.log("Dashboard Layout: User authorized, staying on dashboard", {
          isAgent,
          isAdmin,
          isLandlord,
          isRegularUser,
          reason: isAgent
            ? "approved agent"
            : isAdmin
            ? "admin"
            : isLandlord
            ? "landlord"
            : "regular user",
        });
      } else {
        console.log(
          "Dashboard Layout: User not authorized, redirecting to homepage"
        );
        router.push("/");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  // Don't render anything if still loading or user is not authenticated/authorized
  if (isLoading || !user) {
    console.log(
      "Dashboard Layout: Not rendering - isLoading:",
      isLoading,
      "user:",
      !!user
    );
    return null;
  }

  const isAgent =
    user?.agent_request?.status === "approved" ||
    user?.agent_info?.status === "approved";
  const isAdmin = user?.type === "admin";
  const isLandlord = user?.type === "landlord"; // Check if user is a landlord
  const isRegularUser = user?.type === "user"; // Handle regular users

  console.log("Dashboard Layout: Final render check", {
    isAgent,
    isAdmin,
    isLandlord,
    isRegularUser,
    userType: user?.type,
    agent_info_status: user?.agent_info?.status,
    fullUser: user,
  });

  // Allow access if user is agent (approved), admin, landlord, or regular user
  if (isAgent || isAdmin || isLandlord || isRegularUser) {
    console.log("Dashboard Layout: Rendering dashboard - user authorized", {
      reason: isAgent
        ? "approved agent"
        : isAdmin
        ? "admin"
        : isLandlord
        ? "landlord"
        : "regular user",
    });
  } else {
    console.log("Dashboard Layout: Not rendering - user not authorized");
    return null;
  }

  console.log("Dashboard Layout: Rendering dashboard");

  return (
    <ScreenSizeGuard>
      <DashboardProvider>
        <PropertiesProvider>
          <ReviewsProvider>
            <div className="flex h-screen bg-[#0A0A0A]">
              <Sidebar />
              <div className="flex-1 ml-16 transition-all duration-300 lg:ml-64">
                {children}
              </div>
            </div>
          </ReviewsProvider>
        </PropertiesProvider>
      </DashboardProvider>
    </ScreenSizeGuard>
  );
}
