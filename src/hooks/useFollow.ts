// hooks/useFollow.ts
import { useState, useCallback } from 'react';
import { followAPI } from '@/lib/api/follow.api';
import { useAuth, User } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';

export const useFollow = () => {
  const { user: currentUser, refreshAccessToken } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const followUser = useCallback(async (userToFollow: User): Promise<boolean> => {
    if (!currentUser) {
      console.log('❌ Cannot follow: No current user');
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to follow users',
        variant: 'destructive'
      });
      return false;
    }
    
    console.log(`🔄 Attempting to follow user: ${userToFollow.username} (${userToFollow.id})`);
    
    setIsLoading(true);
    try {
      const response = await followAPI.follow(userToFollow.id);
      console.log(`✅ Successfully followed user: ${userToFollow.username}`, response);
      
      // Show success toast
      const displayName = userToFollow.username || userToFollow.first_name || 'this user';
      toast({
        title: 'Following',
        description: `You are now following ${displayName}`,
        variant: 'success'
      });
      
      return true;
    } catch (error: any) {
      console.error('❌ Failed to follow user:', error);
      
      // Handle the case where we're already following
      if (error.response?.data?.detail?.includes('already following')) {
        console.log(`ℹ️  Already following user: ${userToFollow.username} - considering this success`);
        const displayName = userToFollow.username || userToFollow.first_name || 'this user';
        toast({
          title: 'Already Following',
          description: `You are already following ${displayName}`,
          variant: 'default'
        });
        return true; // Consider this a success since we want to be in the following state
      }
      
      // Try to refresh token if it's an auth error
      if (error.response?.status === 401) {
        console.log('🔄 Token expired, attempting refresh...');
        await refreshAccessToken();
        // Retry the follow operation
        try {
          const retryResponse = await followAPI.follow(userToFollow.id);
          console.log(`✅ Successfully followed user after token refresh: ${userToFollow.username}`, retryResponse);
          const displayName = userToFollow.username || userToFollow.first_name || 'this user';
          toast({
            title: 'Following',
            description: `You are now following ${displayName}`,
            variant: 'success'
          });
          return true;
        } catch (retryError: any) {
          console.error('❌ Failed to follow user after token refresh:', retryError);
          if (retryError.response?.data?.detail?.includes('already following')) {
            console.log(`ℹ️  Already following user after retry: ${userToFollow.username}`);
            const displayName = userToFollow.username || userToFollow.first_name || 'this user';
            toast({
              title: 'Already Following',
              description: `You are already following ${displayName}`,
              variant: 'default'
            });
            return true;
          }
          toast({
            title: 'Failed to Follow',
            description: 'Failed to follow user. Please try again.',
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Failed to Follow',
          description: 'Failed to follow user. Please try again.',
          variant: 'destructive'
        });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, refreshAccessToken]);

  const unfollowUser = useCallback(async (userToUnfollow: User): Promise<boolean> => {
    if (!currentUser) {
      console.log('❌ Cannot unfollow: No current user');
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to unfollow users',
        variant: 'destructive'
      });
      return false;
    }
    
    console.log(`🔄 Attempting to unfollow user: ${userToUnfollow.username} (${userToUnfollow.id})`);
    
    setIsLoading(true);
    try {
      const response = await followAPI.unfollow(userToUnfollow.id);
      console.log(`✅ Successfully unfollowed user: ${userToUnfollow.username}`, response);
      
      // Show success toast
      const displayName = userToUnfollow.username || userToUnfollow.first_name || 'this user';
      toast({
        title: 'Unfollowed',
        description: `You have unfollowed ${displayName}`,
        variant: 'default'
      });
      
      return true;
    } catch (error: any) {
      console.error('❌ Failed to unfollow user:', error);
      
      // Handle the case where we're not following
      if (error.response?.data?.detail?.includes('not following')) {
        console.log(`ℹ️  Not following user: ${userToUnfollow.username} - considering this success`);
        const displayName = userToUnfollow.username || userToUnfollow.first_name || 'this user';
        toast({
          title: 'Not Following',
          description: `You are not following ${displayName}`,
          variant: 'default'
        });
        return true; // Consider this a success since we want to be in the not-following state
      }
      
      // Try to refresh token if it's an auth error
      if (error.response?.status === 401) {
        console.log('🔄 Token expired, attempting refresh...');
        await refreshAccessToken();
        // Retry the unfollow operation
        try {
          const retryResponse = await followAPI.unfollow(userToUnfollow.id);
          console.log(`✅ Successfully unfollowed user after token refresh: ${userToUnfollow.username}`, retryResponse);
          const displayName = userToUnfollow.username || userToUnfollow.first_name || 'this user';
          toast({
            title: 'Unfollowed',
            description: `You have unfollowed ${displayName}`,
            variant: 'default'
          });
          return true;
        } catch (retryError: any) {
          console.error('❌ Failed to unfollow user after token refresh:', retryError);
          if (retryError.response?.data?.detail?.includes('not following')) {
            console.log(`ℹ️  Not following user after retry: ${userToUnfollow.username}`);
            const displayName = userToUnfollow.username || userToUnfollow.first_name || 'this user';
            toast({
              title: 'Not Following',
              description: `You are not following ${displayName}`,
              variant: 'default'
            });
            return true;
          }
          toast({
            title: 'Failed to Unfollow',
            description: 'Failed to unfollow user. Please try again.',
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Failed to Unfollow',
          description: 'Failed to unfollow user. Please try again.',
          variant: 'destructive'
        });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, refreshAccessToken]);

  const toggleFollow = useCallback(async (user: User, isCurrentlyFollowing: boolean): Promise<boolean> => {
    console.log(`🔄 Toggle follow for ${user.username}: currently ${isCurrentlyFollowing ? 'FOLLOWING' : 'NOT FOLLOWING'}`);
    
    if (isCurrentlyFollowing) {
      return await unfollowUser(user);
    } else {
      return await followUser(user);
    }
  }, [followUser, unfollowUser]);

  // NEW: Check follow status for multiple users
  const checkFollowStatus = useCallback(async (userIds: string[]): Promise<Record<string, boolean>> => {
    if (!currentUser || userIds.length === 0) {
      console.log('❌ Cannot check follow status: No current user or empty user IDs');
      return {};
    }

    console.log(`🔄 Checking follow status for ${userIds.length} users:`, userIds);
    
    try {
      const response = await followAPI.checkFollowStatus(userIds);
      console.log(`✅ Follow status check completed:`, response.follow_status);
      return response.follow_status;
    } catch (error: any) {
      console.error('❌ Failed to check follow status:', error);
      
      // Try to refresh token if it's an auth error
      if (error.response?.status === 401) {
        console.log('🔄 Token expired, attempting refresh...');
        await refreshAccessToken();
        // Retry the check
        try {
          const retryResponse = await followAPI.checkFollowStatus(userIds);
          return retryResponse.follow_status;
        } catch (retryError) {
          console.error('❌ Failed to check follow status after token refresh:', retryError);
        }
      }
      return {};
    }
  }, [currentUser, refreshAccessToken]);

  return {
    followUser,
    unfollowUser,
    toggleFollow,
    checkFollowStatus,
    isLoading,
  };
};