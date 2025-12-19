import { useState, useCallback, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { useAuth } from '@/contexts/auth-context';
import type { User } from '@/contexts/auth-context';

// Define the Agent interface as expected by AgentCard
interface Agent {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  propertiesSold: number;
  experience: string;
  location: string;
  verified: boolean;
  type?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
  phone?: string;
  reviews_count?: number;
  agent_request?: {
    id: string;
    status: string;
    phone?: string;
    verification_document?: string;
  };
}

// Define the API response structure
interface AgentResponse {
  detail: string;
  agents: User[];
}

// Define error interface
interface AgentError {
  error?: string;
  detail?: string;
  details?: any;
  non_field_errors?: string[];
  [key: string]: any;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/';

// Global flag to prevent multiple simultaneous requests
let isFetching = false;

export function useAgents() {
  const { user, isAuthenticated, isLoading, refreshAccessToken } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Configure axios instance with auth token
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth token to requests
  axiosInstance.interceptors.request.use(
    async (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      console.error('[useAgents] Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Handle token refresh on 401 errors
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && originalRequest && !originalRequest.url?.includes('/auth/')) {
        try {
          const newToken = await refreshAccessToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          console.error('[useAgents] Token refresh failed:', refreshError);
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('tokenData');
          localStorage.removeItem('authUser');
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  // Fetch agents - memoized to prevent infinite loops
  const fetchAgents = useCallback(
    async (forceRefresh: boolean = false) => {
      // Prevent multiple simultaneous requests
      if (isFetching && !forceRefresh) {
        console.log('[useAgents] Request already in progress, skipping');
        return;
      }

      if (isLoading) {
        console.log('[useAgents] Auth still loading, skipping');
        return;
      }

      if (!isAuthenticated) {
        const msg = 'You must be logged in to fetch agents';
        setError(msg);
        setHasFetched(true);
        return;
      }

      // If we already fetched successfully, don't fetch again unless forced
      if (hasFetched && !forceRefresh) {
        console.log('[useAgents] Agents already fetched, skipping');
        return;
      }

      console.log('[useAgents] Fetching agents...');
      isFetching = true;
      setIsLoadingAgents(true);
      setError(null);

      try {
        const response = await axiosInstance.get<AgentResponse>('auth/users/agents/');
        console.log('[useAgents] Agents fetched successfully:', {
          count: response.data.agents?.length || 0
        });

        // Transform User data to Agent interface
        const transformedAgents: Agent[] = (response.data.agents || []).map((user: User) => {
          // Safely handle is_following - ensure it's always a boolean
          let isFollowing = false;
          
          // If is_following is a function, we can't use it directly
          if (typeof user.is_following === 'boolean') {
            isFollowing = user.is_following;
          } else if (typeof user.is_following === 'function') {
            // If it's a function, we can't execute it without the current user context
            // So we default to false for now
            console.warn(`[useAgents] is_following is a function for user ${user.id}, defaulting to false`);
            isFollowing = false;
          }
          // If it's undefined or any other type, isFollowing remains false

          return {
            id: user.id,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Agent',
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            avatar: user.avatar || '/placeholder.svg',
            rating: user.rating || 0,
            propertiesSold: 0,
            experience: 'N/A',
            location: user.location || 'Nigeria',
            verified: user.agent_request?.status === 'approved' || user.type === 'agent',
            type: user.type,
            followers_count: user.followers_count || 0,
            following_count: user.following_count || 0,
            is_following: isFollowing, // Now guaranteed to be boolean
            phone: user.phone || user.agent_request?.phone,
            reviews_count: user.reviews_count || 0,
            agent_request: user.agent_request,
          };
        });

        setAgents(transformedAgents);
        setHasFetched(true);
      } catch (err) {
        const error = err as AxiosError<AgentError>;
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.error ||
          error.response?.data?.non_field_errors?.[0] ||
          error.message ||
          'Failed to fetch agents';
        console.error('[useAgents] Fetch agents error:', errorMsg);
        setError(errorMsg);
        setHasFetched(true);
      } finally {
        setIsLoadingAgents(false);
        isFetching = false;
      }
    },
    [isLoading, isAuthenticated, hasFetched, axiosInstance, refreshAccessToken]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    agents,
    isLoading: isLoadingAgents,
    error,
    fetchAgents,
    clearError,
    user: user as User | null,
    isAuthenticated,
    hasFetched,
  };
}