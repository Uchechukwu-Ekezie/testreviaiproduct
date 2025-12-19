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

  // NEW: Check follow status for multiple users
  checkFollowStatus: async (userIds: string[]): Promise<CheckFollowStatusResponse> => {
    const res = await api.post("/auth/follow/check-follow-status/", { 
      user_ids: userIds 
    });
    return res.data;
  },
};