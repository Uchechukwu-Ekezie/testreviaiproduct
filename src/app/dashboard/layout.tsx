"use client";

import { DashboardProvider } from "@/contexts/dashboard-context";
import { ReviewsProvider } from "@/contexts/reviews-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { PropertiesProvider } from "@/contexts/properties-context";
import ScreenSizeGuard from "@/components/dashboard/screen-size-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
