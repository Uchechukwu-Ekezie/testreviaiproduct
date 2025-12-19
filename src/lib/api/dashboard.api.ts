/**
 * Dashboard API Module
 *
 * Handles general dashboard operations including:
 * - Global statistics
 * - Analytics data
 * - Trend analysis
 *
 * @module dashboard.api
 */

import { apiFetch } from "./axios-config";

/**
 * Dashboard statistics structure
 */
export interface DashboardStats {
  total_users?: number;
  total_properties?: number;
  total_reviews?: number;
  total_bookings?: number;
  active_chats?: number;
  pending_reviews?: number;
  recent_activities?: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

/**
 * Analytics data structure
 */
export interface DashboardAnalytics {
  period: string;
  users: {
    total: number;
    new: number;
    active: number;
    trend: number;
    data: Array<{ date: string; count: number }>;
  };
  properties: {
    total: number;
    new: number;
    trend: number;
    data: Array<{ date: string; count: number }>;
  };
  reviews: {
    total: number;
    new: number;
    average_rating: number;
    trend: number;
    data: Array<{ date: string; count: number; rating: number }>;
  };
  bookings?: {
    total: number;
    new: number;
    completed: number;
    cancelled: number;
    trend: number;
    data: Array<{ date: string; count: number }>;
  };
  engagement: {
    chat_sessions: number;
    searches: number;
    page_views: number;
  };
}

/**
 * Dashboard API
 * Provides global dashboard statistics and analytics
 */
export const dashboardAPI = {
  /**
   * Get dashboard statistics
   *
   * Returns high-level statistics for the platform including
   * total users, properties, reviews, and recent activities
   *
   * @returns Dashboard statistics object
   * @throws {Error} If the request fails
   *
   * @example
   * const stats = await dashboardAPI.getStats();
   * console.log(`Total users: ${stats.total_users}`);
   * console.log(`Total properties: ${stats.total_properties}`);
   * console.log(`Pending reviews: ${stats.pending_reviews}`);
   */
  getStats: async (): Promise<DashboardStats> => {
    return apiFetch("dashboard/stats/");
  },

  /**
   * Get dashboard analytics for a specific period
   *
   * Returns detailed analytics including trends, time-series data,
   * and engagement metrics for the specified period
   *
   * @param period - Time period for analytics (week, month, quarter, year)
   * @returns Analytics data with trends and time-series
   * @throws {Error} If the request fails
   *
   * @example
   * // Get monthly analytics
   * const analytics = await dashboardAPI.getAnalytics('month');
   * console.log('New users:', analytics.users.new);
   * console.log('User trend:', analytics.users.trend, '%');
   *
   * @example
   * // Get yearly analytics
   * const yearlyAnalytics = await dashboardAPI.getAnalytics('year');
   * console.log('Total bookings:', yearlyAnalytics.bookings?.total);
   *
   * @example
   * // Get default analytics (no period specified)
   * const defaultAnalytics = await dashboardAPI.getAnalytics();
   */
  getAnalytics: async (period?: string): Promise<DashboardAnalytics> => {
    const params = period ? `?period=${period}` : "";
    return apiFetch(`dashboard/analytics/${params}`);
  },
};

export default dashboardAPI;
