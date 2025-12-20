"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { followAPI } from "@/lib/api/follow.api";
import { usePosts } from "@/hooks/usePosts";
import PostCard from "@/components/social-feed/PostCard";
import ImageLightbox from "@/components/social-feed/ImageLightbox";
import UserProfileSkeleton from "@/components/social-feed/UserProfileSkeleton";
import PostCardSkeleton from "@/components/social-feed/PostCardSkeleton";
import type { Post as PostType } from "@/hooks/usePosts";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { likePost, fetchComments, createComment, replyToComment } = usePosts();

  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "reviews">("posts");
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState<number | null>(0);
  const [followingCount, setFollowingCount] = useState<number | null>(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Image lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Resolve URL param
  useEffect(() => {
    (async () => {
      const { id } = await params;
      setUserId(id);
    })();
  }, [params]);

  // Fetch user data and posts
  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("authToken");

        // Fetch user profile
        const userResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/auth/users/${userId}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await userResponse.json();
        console.log("👤 User data received:", userData);

        const fullName = `${userData.first_name || ""} ${
          userData.last_name || ""
        }`.trim();
        const displayName =
          fullName || userData.username?.split("@")[0] || "User";

        setUser({
          ...userData,
          name: displayName,
          verified: userData.verification_status === "verified",
        });

        // Set follow status from user data
        setIsFollowing(!!userData.is_following);

        // Set followers and following counts from user data
        setFollowersCount(userData.followers_count ?? 0);
        setFollowingCount(userData.following_count ?? 0);

        console.log("📊 User data with counts:", {
          followers: userData.followers_count,
          following: userData.following_count,
          isFollowing: userData.is_following,
        });
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, currentUser]);

  // Fetch user posts
  useEffect(() => {
    if (!userId || activeTab !== "posts") return;

    const fetchUserPosts = async () => {
      setIsLoadingPosts(true);
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/posts/user/${userId}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUserPosts(data.results || data || []);
        }
      } catch (error) {
        console.error("Failed to fetch user posts:", error);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchUserPosts();
  }, [userId, activeTab]);

  // Fetch user reviews
  useEffect(() => {
    if (!userId || activeTab !== "reviews") return;

    const fetchUserReviews = async () => {
      setIsLoadingReviews(true);
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/reviews/user/${userId}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setReviews(data.results || data || []);
        }
      } catch (error) {
        console.error("Failed to fetch user reviews:", error);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchUserReviews();
  }, [userId, activeTab]);

  // Toggle follow
  const handleFollowToggle = async () => {
    console.log("🔄 Follow toggle clicked", {
      currentUser,
      userId,
      isFollowLoading,
      isFollowing,
    });

    if (!currentUser) {
      console.log("❌ No current user, redirecting to signin");
      router.push("/signin");
      return;
    }

    if (!userId || isFollowLoading) {
      console.log("❌ Missing userId or already loading");
      return;
    }

    setIsFollowLoading(true);
    try {
      console.log(
        `🚀 ${isFollowing ? "Unfollowing" : "Following"} user ${userId}`
      );

      if (isFollowing) {
        const result = await followAPI.unfollow(userId);
        console.log("✅ Unfollow successful:", result);
        setIsFollowing(false);
        setFollowersCount((c) => (c ?? 0) - 1);
      } else {
        try {
          const result = await followAPI.follow(userId);
          console.log("✅ Follow successful:", result);
          setIsFollowing(true);
          setFollowersCount((c) => (c ?? 0) + 1);
        } catch (error: any) {
          // If already following, just update the UI
          if (error?.response?.data?.detail?.includes("already following")) {
            console.log("⚠️ Already following, updating UI");
            setIsFollowing(true);
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("❌ Follow failed:", error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Handle post actions
  const handleLike = async (postId: string) => {
    const post = userPosts.find((p) => p.id === postId);
    if (!post) return;
    await likePost(postId, post.is_liked ? "unlike" : "like");

    // Update local state
    setUserPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              is_liked: !p.is_liked,
              like_count: p.is_liked ? p.like_count - 1 : p.like_count + 1,
            }
          : p
      )
    );
  };

  const handleShare = (postId: string) => {
    console.log("Shared:", postId);
  };

  const handleOpenLightbox = (images: string[], startIndex: number) => {
    setLightboxImages(images);
    setLightboxIndex(startIndex);
    setIsLightboxOpen(true);
  };

  // Loading
  if (isLoading) {
    return <UserProfileSkeleton />;
  }

  // Not found
  if (!user) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">User Not Found</h2>
          <Button onClick={() => router.push("/social-feed")} variant="outline">
            Back to Feed
          </Button>
        </div>
      </div>
    );
  }

  const displayFollowers =
    followersCount !== null && followersCount > 999
      ? `${(followersCount / 1000).toFixed(1)}k`
      : followersCount?.toString() || "0";

  const displayFollowing =
    followingCount !== null && followingCount > 999
      ? `${(followingCount / 1000).toFixed(1)}k`
      : followingCount?.toString() || "0";

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isOwnProfile = currentUser && currentUser.id === userId;

  return (
    <div className="min-h-screen bg-[#141414] font-sans pt-10">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#141414]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <Avatar className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 border-2 sm:border-4 border-gray-800">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-xl sm:text-3xl md:text-4xl font-bold bg-gray-800 text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">{user.name}</h1>
            {user.verified && (
              <BadgeCheck className="w-8 h-8 text-white fill-blue-500" />
            )}
          </div>

          {user.username && (
            <p className="text-gray-400 mb-6">@{user.username}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-8 max-w-md mx-auto">
            <div>
              <div className="text-2xl font-bold text-white">
                {userPosts.length}
              </div>
              <div className="text-sm text-gray-400">Posts</div>
            </div>
            {followersCount !== null && (
              <div>
                <div className="text-2xl font-bold text-white">
                  {displayFollowers}
                </div>
                <div className="text-sm text-gray-400">Followers</div>
              </div>
            )}
            {followingCount !== null && (
              <div>
                <div className="text-2xl font-bold text-white">
                  {displayFollowing}
                </div>
                <div className="text-sm text-gray-400">Following</div>
              </div>
            )}
          </div>

          {/* Follow Button */}
          {currentUser && !isOwnProfile && (
            <Button
              onClick={handleFollowToggle}
              disabled={isFollowLoading}
              size="lg"
              className={cn(
                "px-8 py-3 rounded-full font-semibold transition-colors",
                isFollowing
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-white hover:bg-gray-200 text-black"
              )}
            >
              {isFollowLoading ? (
                <span className="inline-block">Loading...</span>
              ) : isFollowing ? (
                "Following"
              ) : (
                "Follow"
              )}
            </Button>
          )}

          {/* Tabs */}
          <div className="flex justify-center mt-8 border-2 border-gray-800 rounded-full overflow-hidden max-w-md mx-auto">
            {["posts", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "flex-1 py-3 text-sm font-medium capitalize",
                  activeTab === tab
                    ? "bg-gray-800 text-white rounded-full mx-1 my-1"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Tab */}
        {activeTab === "posts" && (
          <div className="space-y-4">
            {isLoadingPosts ? (
              <>
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </>
            ) : userPosts.length > 0 ? (
              userPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onShare={handleShare}
                  fetchComments={fetchComments}
                  createComment={createComment}
                  replyToComment={replyToComment}
                  isFollowing={isFollowing}
                  onFollowToggle={async (authorId, authorData) => {
                    await handleFollowToggle();
                  }}
                  onOpenLightbox={handleOpenLightbox}
                />
              ))
            ) : (
              <div className="text-center py-20">
                <p className="text-xl text-gray-400">No posts yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            {isLoadingReviews ? (
              <>
                <div className="bg-[#1A1A1A] rounded-[20px] p-6 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-700"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-32 bg-gray-700 rounded"></div>
                      <div className="h-3 w-full bg-gray-700 rounded"></div>
                      <div className="h-3 w-3/4 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#1A1A1A] rounded-[20px] p-6 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-700"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-32 bg-gray-700 rounded"></div>
                      <div className="h-3 w-full bg-gray-700 rounded"></div>
                      <div className="h-3 w-3/4 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              </>
            ) : reviews.length > 0 ? (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white">
                  Reviews ({reviews.length})
                </h3>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-gray-800/50 rounded-2xl p-6 border border-gray-800"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={review.agent?.avatar} />
                          <AvatarFallback className="bg-gray-700 text-white">
                            {review.agent?.first_name?.[0] || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white">
                              Review for {review.agent?.first_name}{" "}
                              {review.agent?.last_name}
                            </span>
                            {review.agent?.verification_status ===
                              "verified" && (
                              <BadgeCheck className="w-4 h-4 text-white fill-blue-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={cn(
                                    "w-4 h-4",
                                    star <= review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "fill-gray-600 text-gray-600"
                                  )}
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-sm text-gray-400">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-300 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-xl text-gray-400">No reviews yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNext={() =>
          setLightboxIndex((prev) =>
            Math.min(prev + 1, lightboxImages.length - 1)
          )
        }
        onPrev={() => setLightboxIndex((prev) => Math.max(prev - 1, 0))}
      />
    </div>
  );
}
