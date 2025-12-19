/**
 * Agent API Module
 *
 * Handles agent-specific operations including:
 * - Agent dashboard statistics
 * - Agent property management with filters
 * - Agent review management
 * - Agent analytics and activities
 * - Agent settings and preferences
 *
 * @module agent.api
 */

import { apiFetch } from "./axios-config";
import type { Property, Review } from "./types";

/**
 * Agent dashboard statistics
 */
export interface AgentDashboardStats {
  total_properties: number;
  active_properties: number;
  pending_properties: number;
  total_reviews: number;
  average_rating: number;
  total_bookings?: number;
  pending_bookings?: number;
  revenue?: {
    total: number;
    this_month: number;
    last_month: number;
  };
}

/**
 * Property filters for agent queries
 */
export interface AgentPropertyFilters {
  status?: "active" | "pending" | "inactive" | "rejected";
  type?: string;
  search?: string;
}

/**
 * Review filters for agent queries
 */
export interface AgentReviewFilters {
  status?: "pending" | "approved" | "rejected";
  rating?: number;
  property_id?: string;
}

/**
 * Agent analytics data
 */
export interface AgentAnalytics {
  period: "week" | "month" | "year";
  views: {
    total: number;
    trend: number;
    data: Array<{ date: string; count: number }>;
  };
  bookings: {
    total: number;
    trend: number;
    data: Array<{ date: string; count: number }>;
  };
  revenue: {
    total: number;
    trend: number;
    data: Array<{ date: string; amount: number }>;
  };
  top_properties: Array<{
    id: string;
    name: string;
    views: number;
    bookings: number;
  }>;
}

/**
 * Agent activity record
 */
export interface AgentActivity {
  id: string;
  type:
    | "property_created"
    | "property_updated"
    | "review_received"
    | "booking_received";
  description: string;
  timestamp: string;
  property_id?: string;
  review_id?: string;
  booking_id?: string;
}

/**
 * Agent settings structure
 */
export interface AgentSettings {
  notification_preferences?: Record<string, boolean>;
  business_hours?: {
    monday?: { start: string; end: string; available: boolean };
    tuesday?: { start: string; end: string; available: boolean };
    wednesday?: { start: string; end: string; available: boolean };
    thursday?: { start: string; end: string; available: boolean };
    friday?: { start: string; end: string; available: boolean };
    saturday?: { start: string; end: string; available: boolean };
    sunday?: { start: string; end: string; available: boolean };
  };
  contact_preferences?: {
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
  };
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Agent API
 * Provides agent-specific functionality for property and business management
 */
export const agentAPI = {
  /**
   * Get agent dashboard statistics
   *
   * @returns Agent dashboard stats including properties, reviews, and revenue
   * @throws {Error} If the request fails
   *
   * @example
   * const stats = await agentAPI.getDashboardStats();
   * console.log(`Total properties: ${stats.total_properties}`);
   * console.log(`Average rating: ${stats.average_rating}`);
   */
  getDashboardStats: async (): Promise<AgentDashboardStats> => {
    return apiFetch("agent/dashboard/stats/");
  },

  /**
   * Get agent properties with pagination and filters
   *
   * @param page - Page number (1-based)
   * @param pageSize - Number of items per page
   * @param filters - Optional filters for status, type, and search
   * @returns Paginated list of agent properties
   * @throws {Error} If the request fails
   *
   * @example
   * const properties = await agentAPI.getProperties(1, 10, {
   *   status: 'active',
   *   type: 'apartment'
   * });
   */
  getProperties: async (
    page: number = 1,
    pageSize: number = 10,
    filters?: AgentPropertyFilters
  ): Promise<PaginatedResponse<Property>> => {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("page_size", pageSize.toString());

    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.type) queryParams.append("type", filters.type);
    if (filters?.search) queryParams.append("search", filters.search);

    return apiFetch(`agent/properties/?${queryParams.toString()}`);
  },

  /**
   * Get agent reviews with pagination and filters
   *
   * @param page - Page number (1-based)
   * @param pageSize - Number of items per page
   * @param filters - Optional filters for status, rating, and property
   * @returns Paginated list of agent reviews
   * @throws {Error} If the request fails
   *
   * @example
   * const reviews = await agentAPI.getReviews(1, 10, {
   *   status: 'approved',
   *   rating: 5
   * });
   */
  getReviews: async (
    page: number = 1,
    pageSize: number = 10,
    filters?: AgentReviewFilters
  ): Promise<PaginatedResponse<Review>> => {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("page_size", pageSize.toString());

    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.rating)
      queryParams.append("rating", filters.rating.toString());
    if (filters?.property_id)
      queryParams.append("property_id", filters.property_id);

    return apiFetch(`agent/reviews/?${queryParams.toString()}`);
  },

  /**
   * Get agent analytics for a specific period
   *
   * @param period - Time period for analytics (week, month, year)
   * @returns Analytics data with views, bookings, and revenue trends
   * @throws {Error} If the request fails
   *
   * @example
   * const analytics = await agentAPI.getAnalytics('month');
   * console.log('Monthly views:', analytics.views.total);
   * console.log('Revenue trend:', analytics.revenue.trend);
   */
  getAnalytics: async (
    period: "week" | "month" | "year" = "month"
  ): Promise<AgentAnalytics> => {
    return apiFetch(`agent/analytics/?period=${period}`);
  },

  /**
   * Get recent agent activities
   *
   * @param limit - Maximum number of activities to return
   * @returns Array of recent agent activities
   * @throws {Error} If the request fails
   *
   * @example
   * const activities = await agentAPI.getActivities(10);
   * activities.forEach(activity => {
   *   console.log(`${activity.type}: ${activity.description}`);
   * });
   */
  getActivities: async (limit: number = 10): Promise<AgentActivity[]> => {
    return apiFetch(`agent/activities/?limit=${limit}`);
  },

  /**
   * Create a new property as an agent
   *
   * Automatically flags the property as agent-created
   *
   * @param propertyData - Property data to create
   * @returns Created property with agent flag
   * @throws {Error} If the request fails or validation fails
   *
   * @example
   * const property = await agentAPI.createProperty({
   *   name: 'Luxury Apartment',
   *   address: '123 Lagos Street',
   *   price: 500000,
   *   type: 'apartment'
   * });
   */
  createProperty: async (
    propertyData: Record<string, unknown>
  ): Promise<Property> => {
    const agentPropertyData = {
      ...propertyData,
      is_added_by_agent: true,
    };

    console.log(
      "agentAPI.createProperty: Creating property with agent flag:",
      agentPropertyData
    );

    return apiFetch("property/", {
      method: "POST",
      body: JSON.stringify(agentPropertyData),
    });
  },

  /**
   * Update agent settings
   *
   * @param settingsData - Agent settings data
   * @returns Updated agent settings
   * @throws {Error} If the request fails
   *
   * @example
   * const settings = await agentAPI.updateSettings({
   *   notification_preferences: {
   *     email_bookings: true,
   *     sms_reviews: false
   *   },
   *   business_hours: {
   *     monday: { start: '09:00', end: '17:00', available: true },
   *     saturday: { start: '10:00', end: '14:00', available: true }
   *   }
   * });
   */
  updateSettings: async (
    settingsData: AgentSettings
  ): Promise<AgentSettings> => {
    return apiFetch("agent/settings/", {
      method: "PUT",
      body: JSON.stringify(settingsData),
    });
  },

  /**
   * Get agent settings
   *
   * @returns Current agent settings
   * @throws {Error} If the request fails
   *
   * @example
   * const settings = await agentAPI.getSettings();
   * console.log('Business hours:', settings.business_hours);
   * console.log('Notifications:', settings.notification_preferences);
   */
  getSettings: async (): Promise<AgentSettings> => {
    return apiFetch("agent/settings/");
  },
};

export default agentAPI;
