"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { dashboardAPI } from "@/lib/api";

interface DashboardStats {
  totalProperties: number;
  totalReviews: number;
  averageRating: number;
  totalUsers: number;
  monthlyGrowth: {
    properties: number;
    reviews: number;
    users: number;
  };
  recentActivity: Array<{
    id: string;
    type: "property_added" | "review_submitted" | "user_registered";
    message: string;
    timestamp: string;
    user?: {
      name: string;
      email: string;
    };
  }>;
  reviewsOverTime: Array<{
    date: string;
    count: number;
    rating: number;
  }>;
  propertiesOverTime: Array<{
    date: string;
    count: number;
  }>;
}

interface DashboardContextType {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
  getAnalytics: (period?: "week" | "month" | "year") => Promise<void>;
  refreshDashboard: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  children,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await dashboardAPI.getStats();

      if (response) {
        setStats(response as any);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard stats";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getAnalytics = async (period: "week" | "month" | "year" = "month") => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await dashboardAPI.getAnalytics(period);

      if (response && stats) {
        // Merge analytics data with existing stats
        setStats((prevStats) => ({
          ...prevStats!,
          ...response,
        }));
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch analytics";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDashboard = async () => {
    await fetchStats();
  };

  // Fetch dashboard stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  const value: DashboardContextType = {
    stats,
    isLoading,
    error,
    fetchStats,
    getAnalytics,
    refreshDashboard,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
