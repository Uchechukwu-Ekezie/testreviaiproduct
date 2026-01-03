// src/components/social-feed/NeighborhoodHighlights.tsx
"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import PostCard from "@/components/social-feed/PostCard";
import PostCardSkeleton from "@/components/social-feed/PostCardSkeleton";
import { usePosts } from "@/hooks/usePosts";
import { useAgents } from "@/hooks/useAgents";
import { useProperties } from "@/contexts/properties-context";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useFollow } from "@/hooks/useFollow";
import { MapPin, AlertCircle, Star, Loader2 } from "lucide-react";
import { getUserLocation, reverseGeocodeLocation } from "@/utils/geolocation";
import Image from "next/image";
import PropertyCarousel from "@/components/social-feed/PropertyCarousel";
import type { Post } from "@/hooks/usePosts";
import type { Property } from "@/contexts/properties-context";

interface LocationData {
  city: string;
  state: string;
  coordinates: string;
  latitude: number;
  longitude: number;
}

export default function NeighborhoodHighlights() {
  const router = useRouter();
  const { user } = useAuth();
  const { toggleFollow, checkFollowStatus } = useFollow();

  const {
    fetchPostsByLocation,
    likePost: likePostAction,
    fetchComments,
    createComment,
    replyToComment,
    likeComment,
  } = usePosts();

  const { agents, isLoading: agentsLoading, fetchAgents } = useAgents();
  const { fetchPropertiesByLocation, properties: agentProperties } =
    useProperties();

  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "loading" | "success" | "denied" | "error"
  >("loading");
  const [locationBasedPosts, setLocationBasedPosts] = useState<Post[]>([]);
  const [locationBasedProperties, setLocationBasedProperties] = useState<Property[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Follow state
  const [followStatusMap, setFollowStatusMap] = useState<Record<string, boolean>>({});
  const [followLoadingMap, setFollowLoadingMap] = useState<Record<string, boolean>>({});
  const checkedAuthorIdsRef = React.useRef<Set<string>>(new Set());

  // Fetch agents
  useEffect(() => {
    if (agents.length === 0 && !agentsLoading) fetchAgents();
  }, [agents.length, agentsLoading, fetchAgents]);

  // Initialize follow status for posts
  useEffect(() => {
    if (locationBasedPosts.length === 0 || !user) return;

    const postsAuthorIds = [
      ...new Set(locationBasedPosts.map((post) => post.author?.id).filter(Boolean)),
    ] as string[];

    if (postsAuthorIds.length === 0) return;

    const newAuthorIds = postsAuthorIds.filter(
      (id) => !checkedAuthorIdsRef.current.has(id)
    );

    if (newAuthorIds.length === 0) return;

    newAuthorIds.forEach((id) => checkedAuthorIdsRef.current.add(id));

    const initializeFollowStatus = async () => {
      try {
        const followStatus = await checkFollowStatus(newAuthorIds);
        setFollowStatusMap((prev) => ({ ...prev, ...followStatus }));
      } catch (error) {
        console.error("Failed to initialize follow status:", error);
        newAuthorIds.forEach((id) => checkedAuthorIdsRef.current.delete(id));
      }
    };

    const timeoutId = setTimeout(() => {
      initializeFollowStatus();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [locationBasedPosts.map((p) => p.author?.id).join(","), user, checkFollowStatus]);

  // Detect location and fetch location-based data
  useEffect(() => {
    const detectLocationAndFetchData = async () => {
      try {
        setLocationStatus("loading");
        const pos = await getUserLocation({
          enableHighAccuracy: true,
          timeout: 15000,
        });

        // Get full location data
        const locationString = await reverseGeocodeLocation(
          pos.latitude,
          pos.longitude
        );
        const parts = locationString.split(",").map((p) => p.trim());

        const locData: LocationData = {
          city: parts[0] || "",
          state: parts[1] || "",
          coordinates: `(${pos.latitude}, ${pos.longitude})`,
          latitude: pos.latitude,
          longitude: pos.longitude,
        };

        setLocationData(locData);
        setLocationStatus("success");

        // Fetch posts and properties by location
        // Backend now uses flexible text search across title, address, description, city, state
        setIsLoadingData(true);
        try {
          const [posts, properties] = await Promise.all([
            fetchPostsByLocation({
              city: locData.city,
              state: locData.state,
              latitude: locData.latitude,
              longitude: locData.longitude,
              radius: 50,
            }),
            fetchPropertiesByLocation({
              city: locData.city,
              state: locData.state,
              coordinates: locData.coordinates,
              radius: 50,
            }),
          ]);
          setLocationBasedPosts(posts || []);
          setLocationBasedProperties(properties || []);
          console.log(`Found ${posts?.length || 0} posts and ${properties?.length || 0} properties in ${locData.city}`);
        } catch (err) {
          console.error("Error fetching location-based data", err);
        } finally {
          setIsLoadingData(false);
        }
      } catch (err: unknown) {
        const error = err as { code?: string };
        setLocationStatus(
          error.code === "PERMISSION_DENIED" ? "denied" : "error"
        );
        setIsLoadingData(false);
      }
    };
    detectLocationAndFetchData();
  }, [fetchPostsByLocation, fetchPropertiesByLocation]);

  // COMBINED FEED -----------------------------------------------------------
  interface FeedItemPost { type: 'post'; created_at: string; post: Post }
  interface FeedItemProperty { type: 'property'; created_at: string; property: Property }
  type FeedItem = FeedItemPost | FeedItemProperty;

  const feedItems: FeedItem[] = useMemo(() => {
    const postItems: FeedItemPost[] = locationBasedPosts.map(p => ({ type: 'post', created_at: p.created_at, post: p }));
    const propertyItems: FeedItemProperty[] = locationBasedProperties.map(prop => ({ type: 'property', created_at: prop.created_at, property: prop }));
    // Merge & sort descending by created_at
    return [...postItems, ...propertyItems].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [locationBasedPosts, locationBasedProperties]);

  // Infinite scroll for posts (properties currently single fetch)
  const { loadMorePosts, hasMore } = usePosts(); // need hasMore from hook instance used earlier via destructure
  const handleScroll = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 400;
    if (nearBottom) {
      setIsLoadingMore(true);
      loadMorePosts().finally(() => setIsLoadingMore(false));
    }
  }, [isLoadingMore, hasMore, loadMorePosts]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleLike = async (postId: string) => {
    const post = locationBasedPosts.find((p) => p.id === postId);
    if (!post || post.isPending) return;
    await likePostAction(postId, post.is_liked ? "unlike" : "like");
    
    // Update local state
    setLocationBasedPosts((prev) =>
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

  const handleFollowToggle = useCallback(
    async (
      authorId: string,
      authorData: {
        username?: string;
        email?: string;
        first_name?: string;
        last_name?: string;
        avatar?: string;
        user_type?: string;
      }
    ) => {
      if (!user) {
        router.push("/signin");
        return;
      }

      if (authorId === user.id) {
        return;
      }

      const currentStatus = followStatusMap[authorId] || false;
      setFollowLoadingMap((prev) => ({ ...prev, [authorId]: true }));

      try {
        await toggleFollow(
          {
            id: authorId,
            username: authorData.username || "",
            email: authorData.email || "",
            first_name: authorData.first_name || "",
            last_name: authorData.last_name || "",
            avatar: authorData.avatar || "",
            type: authorData.user_type || "user",
          },
          currentStatus
        );

        setFollowStatusMap((prev) => ({
          ...prev,
          [authorId]: !currentStatus,
        }));
      } catch (error) {
        console.error("Failed to toggle follow:", error);
      } finally {
        setFollowLoadingMap((prev) => ({ ...prev, [authorId]: false }));
      }
    },
    [user, router, followStatusMap, toggleFollow]
  );

  const handleLikeComment = useCallback(
    async (commentId: string, isLiked: boolean) => {
      const action = isLiked ? "unlike" : "like";
      const result = await likeComment(commentId, action);
      return result;
    },
    [likeComment]
  );

  // Calculate agent rating (you can replace this with actual rating data from your API)
  const getAgentRating = (agentId: string) => {
    // This is a placeholder - replace with actual rating logic from your data
    const ratings: Record<string, number> = {
      // Add actual agent ratings here
    };
    return ratings[agentId] || Math.random() * 2 + 3; // Random rating between 3-5 for demo
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#141414] to-[#0a0a0a] text-white pb-20">
      {/* Instagram Stories Bar - Top Agents */}
      {/* <div className="bg-black/30 backdrop-blur border-b border-white/10 sticky top-0 z-50">
        <div className="flex gap-4 px-4 py-4 overflow-x-auto scrollbar-hide">
          {agents.slice(0, 20).map((agent) => {
            const listings = agentProperties.filter(
              (p) => p.created_by === agent.id
            ).length;
            const agentRating = getAgentRating(agent.id);
            
            const displayName = agent.name || 
              `${agent.first_name || ""} ${agent.last_name || ""}`.trim() || 
              agent.username || 
              "Agent";
            
            const initials = displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "A";

            return (
              <button
                key={agent.id}
                onClick={() => router.push(`/social-feed/agent/${agent.id}`)}
                className="flex-shrink-0 text-center group"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full ring-2 ring-white/20 ring-offset-2 ring-offset-black p-0.5">
                    <div className="w-full h-full rounded-full bg-white/10 overflow-hidden">
                      {agent.avatar ? (
                        <Image
                          src={agent.avatar || "/image/profile.jpg"}
                          alt={displayName}
                          width={60}
                          height={60}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-lg font-bold">
                          {initials}
                        </div>
                      )}
                    </div>
                  </div>
                  {listings > 0 && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-black" />
                  )}
                </div>
                <p className="text-xs mt-1 max-w-16 truncate text-gray-300 group-hover:text-white transition">
                  {displayName}
                </p>

                <div className="flex items-center justify-center gap-0.5 mt-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <span className="text-xs text-yellow-400 font-medium">
                    {agentRating.toFixed(1)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div> */}

      {/* Location Status Header */}
      {/* <div className="px-4 py-4 border-b border-white/10 bg-black/30 backdrop-blur sticky top-[88px] z-40">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-white/70" />
          {locationStatus === "loading" && (
            <span className="text-gray-400 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Detecting your location...
            </span>
          )}
          {locationStatus === "success" && locationData && (
            <span className="text-green-400 font-medium">
              Showing highlights in{" "}
              <span className="underline">{locationData.city}</span>
            </span>
          )}
          {locationStatus === "denied" && (
            <span className="text-yellow-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Location denied • Global feed
            </span>
          )}
          {locationStatus === "error" && (
            <span className="text-red-400">Location unavailable</span>
          )}
        </div>
      </div> */}

      {/* Feed */}
      <div className="max-w-lg mx-auto pt-6">
        {feedItems.length === 0 && !isLoadingData ? (
          <div className="text-center py-20 text-gray-400">
            <MapPin className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg">No posts or properties in your area yet</p>
            <p className="text-sm mt-2">
              Be the first to share something in{" "}
              {locationData?.city || "your city"}!
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {feedItems.map(item => {
              if (item.type === 'post') {
                const isFollowing = item.post.author ? (followStatusMap[item.post.author.id] || false) : false;
                return (
                  <PostCard
                    key={`post-${item.post.id}`}
                    post={item.post}
                    onLike={handleLike}
                    onShare={(postId: string) => {
                      console.log('Share post:', postId);
                    }}
                    fetchComments={fetchComments}
                    createComment={createComment}
                    replyToComment={replyToComment}
                    onLikeComment={handleLikeComment}
                    isFollowing={isFollowing}
                    onFollowToggle={handleFollowToggle}
                    onClick={() => router.push(`/social-feed/post/${item.post.id}`)}
                  />
                );
              }
              const property = item.property;
              return (
                <div
                  key={`property-${property.id}`}
                  className="bg-gray-900 rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-white/30 transition"
                  onClick={() => router.push(`/social-feed/property/${property.id}`)}
                >
                  <div className="relative">
                    <PropertyCarousel property={property} />
                    {property.price && (
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold text-blue-300">
                        {property.price}
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-lg leading-snug">{property.title}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{property.address || `${property.city || ''} ${property.state || ''}`}</p>
                    {property.ai_refined_description ? (
                      <div className="prose prose-invert max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: property.ai_refined_description.replace(/\n/g,'<br/>') }} />
                    ) : property.description ? (
                      <p className="text-sm text-gray-300 line-clamp-4">{property.description}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 text-xs text-gray-400 pt-1">
                      {property.property_type && <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 capitalize">{property.property_type.replace('_',' ')}</span>}
                      {property.status && <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 capitalize">{property.status.replace('_',' ')}</span>}
                      {property.bedrooms && property.bedrooms !== '' && <span>{property.bedrooms} bd</span>}
                      {property.bathrooms && property.bathrooms !== '' && <span>{property.bathrooms} ba</span>}
                      {property.square_footage && <span>{property.square_footage}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {isLoadingMore && (
              <div className="text-center text-xs text-gray-400 py-4 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading more...</div>
            )}
          </div>
        )}

        {/* Loading */}
        {isLoadingData && locationBasedPosts.length === 0 && (
          <div className="space-y-6">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        )}

        {feedItems.length > 0 && !isLoadingData && (
            <p className="text-center text-gray-500 py-10 text-sm">
              You&apos;re all caught up in{" "}
              {locationData?.city || "your area"}!
            </p>
          )}
      </div>
    </div>
  );
}
