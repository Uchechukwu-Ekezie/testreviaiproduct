// lib/api/follow.api.ts
import api from "./axios-config";
import type { User } from "./types";

export interface FollowResponse {
  detail: string;
  following?: User & {
    followers_count: number;
    following_count: number;
    is_following: boolean;
  };
}

export interface CheckFollowStatusResponse {
  follow_status: Record<string, boolean>;
  checked_count: number;
  existing_users_count: number;
}

export interface SingleFollowStatusResponse {
  is_following: boolean;
}

export interface UserFollowStatsResponse {
  id: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

export const followAPI = {
  follow: async (userId: string): Promise<FollowResponse> => {
    const res = await api.post("/auth/follow/follow/", { user_id: userId });
    return res.data;
  },

  unfollow: async (userId: string): Promise<FollowResponse> => {
    const res = await api.post("/auth/follow/unfollow/", { user_id: userId });
    return res.data;
  },

  getFollowing: async (): Promise<User[]> => {
    const res = await api.get("/auth/follow/following/");
    return res.data.following;
  },

  getFollowers: async (): Promise<User[]> => {
    const res = await api.get("/auth/follow/followers/");
    return res.data.followers;
  },

  // Get user follow stats
  getUserFollowStats: async (userId: string): Promise<UserFollowStatsResponse> => {
    const res = await api.get<UserFollowStatsResponse>(`/posts/users/${userId}/follow-stats`);
    return res.data;
  },

  // Check follow status for multiple users (makes individual API calls)
  checkFollowStatus: async (userIds: string[]): Promise<CheckFollowStatusResponse> => {
    // API only accepts one user_id at a time, so we make individual calls
    const promises = userIds.map(async (userId) => {
      try {
        const res = await api.post<SingleFollowStatusResponse>("/auth/follow/check-follow-status/", { 
          user_id: userId 
        });
        return { userId, isFollowing: res.data.is_following };
      } catch (error) {
        console.error(`Failed to check follow status for user ${userId}:`, error);
        return { userId, isFollowing: false };
      }
    });

    const results = await Promise.all(promises);
    
    // Aggregate results into the expected format
    const follow_status: Record<string, boolean> = {};
    results.forEach(({ userId, isFollowing }) => {
      follow_status[userId] = isFollowing;
    });

    return {
      follow_status,
      checked_count: results.length,
      existing_users_count: results.filter(r => r.isFollowing !== undefined).length,
    };
  },
};