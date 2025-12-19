// app/agent/[id]/page.tsx — FINAL FIXED VERSION
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Star,
  Phone,
  Search,
  MapPin,
  Bed,
  Bath,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAgents } from "@/hooks/useAgents";
import { useProperties } from "@/contexts/properties-context";
import { useAuth } from "@/contexts/auth-context";
import { followAPI } from "@/lib/api/follow.api";
import { AgentReviewCard } from "@/components/agent-review-card";
import { AgentReviewForm } from "@/components/agent-review-form";
import { AgentReviewsEmptyState } from "@/components/agent-reviews-empty-state";
import AgentProfileSkeleton from "@/components/social-feed/AgentProfileSkeleton";

export default function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const {
    agents,
    isLoading: isLoadingAgents,
    error: agentsError,
    fetchAgents,
  } = useAgents();
  const {
    fetchPropertiesByUserId,
    properties: agentProperties,
    isLoading: isLoadingProperties,
  } = useProperties();

  const [agent, setAgent] = useState<any>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"listings" | "posts" | "reviews">(
    "listings"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [agentSpecificProperties, setAgentSpecificProperties] = useState<any[]>(
    []
  );

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewsCount, setReviewsCount] = useState(0);

  // Resolve URL param
  useEffect(() => {
    (async () => {
      const { id } = await params;
      setAgentId(id);
    })();
  }, [params]);

  // Fetch agents if needed
  useEffect(() => {
    if (!agents.length && !isLoadingAgents && !agentsError) {
      fetchAgents();
    }
  }, [agents.length, isLoadingAgents, agentsError, fetchAgents]);

  // Fetch agent properties
  useEffect(() => {
    if (!agentId) return;

    const loadAgentProperties = async () => {
      try {
        await fetchPropertiesByUserId(agentId);
      } catch (error) {
        console.error("Failed to fetch agent properties:", error);
      }
    };

    loadAgentProperties();
  }, [agentId, fetchPropertiesByUserId]);

  // Update local agent properties when context properties change
  useEffect(() => {
    if (agentId && agentProperties.length >= 0) {
      console.log(
        `📊 Agent ${agentId} properties count:`,
        agentProperties.length
      );
      console.log("📋 Properties:", agentProperties);
      setAgentSpecificProperties(agentProperties);
    }
  }, [agentId, agentProperties]);

  // Set agent data safely
  useEffect(() => {
    if (!agentId || agents.length === 0) return;

    const foundAgent = agents.find((a) => a.id === agentId);
    if (!foundAgent) {
      setIsLoading(false);
      return;
    }

    const fullName = `${foundAgent.first_name || ""} ${
      foundAgent.last_name || ""
    }`.trim();
    const displayName =
      fullName || foundAgent.username?.split("@")[0] || "Agent";

    setAgent({
      ...foundAgent,
      name: displayName,
      listings: agentSpecificProperties.length,
      location: foundAgent.location || "Lagos, Nigeria",
      verified: foundAgent.type?.toLowerCase() === "agent",
      rating: foundAgent.rating || 4.8,
    });

    setIsFollowing(!!foundAgent.is_following);
    setFollowersCount(foundAgent.followers_count || 0);
    setReviewsCount(foundAgent.reviews_count || 0);
    setIsLoading(false);
  }, [agentId, agents, agentSpecificProperties]);

  // Fetch reviews
  const fetchReviews = async () => {
    if (!agentId) return;

    setIsLoadingReviews(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth/agent-reviews/agent/${agentId}/`,
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
      console.error("Failed to fetch reviews:", error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Fetch reviews when reviews tab is active
  useEffect(() => {
    if (activeTab === "reviews" && agentId) {
      fetchReviews();
    }
  }, [activeTab, agentId]);

  // Toggle follow
  const handleFollowToggle = async () => {
    if (!currentUser || !agentId || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await followAPI.unfollow(agentId);
        setIsFollowing(false);
        setFollowersCount((c) => c - 1);
      } else {
        await followAPI.follow(agentId);
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
      }
    } catch (error) {
      console.error("Follow failed:", error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Search filter
  const filteredProperties = agentSpecificProperties.filter(
    (p) =>
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Loading
  if (isLoading || isLoadingAgents || isLoadingProperties) {
    return <AgentProfileSkeleton />;
  }

  // Not found
  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Agent Not Found</h2>
          <Button onClick={() => router.push("/agents")} variant="outline">
            Browse Agents
          </Button>
        </div>
      </div>
    );
  }

  const displayFollowers =
    followersCount > 999
      ? `${(followersCount / 1000).toFixed(1)}k`
      : followersCount.toString();
  console.log("Followers: " + followersCount);

  const getInitials = (name: string) => {
    if (!name) return "AG";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background font-sans pt-10 sm:pt-10 pb-20 sm:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="-ml-2"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base">Back</span>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Profile Card */}
        <div className="text-center mb-8 sm:mb-12 max-w-md mx-auto">
          <div className="relative inline-block mb-4 sm:mb-6">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-2 sm:border-4 border-background">
              <AvatarImage src={agent.avatar} alt={agent.name} />
              <AvatarFallback className="text-3xl sm:text-4xl font-bold bg-muted">
                {getInitials(agent.name)}
              </AvatarFallback>
            </Avatar>

            <div className="absolute -top-2 -right-6 sm:-top-3 sm:-right-8 bg-[#1A1A1A] text-white rounded-full px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-1 text-xs sm:text-sm font-bold">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-500 text-yellow-500" />
              {agent.rating}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold">{agent.name}</h1>
            {agent.verified && (
              <BadgeCheck className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-blue-500" />
            )}
          </div>

          {agent.phone ? (
            <a
              href={`tel:${agent.phone}`}
              className="inline-flex items-center gap-2 bg-[#2E2E2E] hover:bg-[#3E3E3E] transition-colors rounded-full px-4 py-2 sm:px-5 sm:py-3 mb-6 sm:mb-10 text-xs sm:text-sm cursor-pointer"
            >
              <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{agent.phone}</span>
            </a>
          ) : (
            <div className="inline-flex items-center gap-2 bg-[#2E2E2E] rounded-full px-4 py-2 sm:px-5 sm:py-3 mb-6 sm:mb-10 text-xs sm:text-sm opacity-50">
              <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Contact unavailable</span>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-10">
            <div>
              <div className="text-xl sm:text-3xl font-bold">0</div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Posts
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-bold">
                {displayFollowers}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Followers
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-bold">
                {agent.listings}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Listings
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-bold">
                {reviewsCount}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Reviews
              </div>
            </div>
          </div>

          {/* Follow Button */}
          {currentUser && currentUser.id !== agentId && (
            <Button
              onClick={handleFollowToggle}
              disabled={isFollowLoading}
              size="default"
              variant={isFollowing ? "secondary" : "default"}
              className={cn(
                "rounded-full px-8 sm:px-10 font-bold text-base sm:text-lg min-w-36 sm:min-w-44",
                isFollowing && "bg-[#2E2E2E] hover:bg-[#3E3E3E]"
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
          <div className="flex justify-center mt-8 sm:mt-12 border-2 border-[#2E2E2E] rounded-full overflow-hidden max-w-md mx-auto">
            {["listings", "posts", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "flex-1 py-2 sm:py-3 text-xs sm:text-sm font-medium capitalize",
                  activeTab === tab
                    ? "bg-[#2E2E2E] text-white rounded-full mx-0.5 sm:mx-1 my-0.5 sm:my-1"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Tab */}
        {activeTab === "listings" && (
          <div className="mt-6 sm:mt-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold">Listings</h2>
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 sm:pl-11 max-w-full sm:max-w-72 h-9 sm:h-10 bg-transparent border-2 border-[#2E2E2E] rounded-full text-sm"
                  />
                </div>
                <span className="bg-[#2E2E2E] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap">
                  {agent.listings}
                </span>
              </div>
            </div>

            {filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                {filteredProperties.map((property) => (
                  <div
                    key={property.id}
                    onClick={() =>
                      router.push(`/social-feed/property/${property.id}`)
                    }
                    className="bg-card rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all border border-border"
                  >
                    <div className="relative h-48 sm:h-64">
                      <Image
                        src={
                          property.images?.[0]?.image_url ||
                          property.image_url ||
                          "/placeholder.svg"
                        }
                        alt={property.title || "Property"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4 sm:p-6">
                      <h3 className="font-bold text-xl mb-2">
                        {property.title || "Untitled"}
                      </h3>
                      <p className="text-muted-foreground flex items-center gap-2 mb-4">
                        <MapPin className="w-4 h-4" />
                        {property.address}
                      </p>
                      <div className="flex gap-3 mb-4">
                        {property.bedrooms && (
                          <span className="bg-[#2E2E2E] px-4 py-2 rounded-full text-sm flex items-center gap-2">
                            <Bed className="w-4 h-4" />
                            {property.bedrooms}
                          </span>
                        )}
                        {property.bathrooms && (
                          <span className="bg-[#2E2E2E] px-4 py-2 rounded-full text-sm flex items-center gap-2">
                            <Bath className="w-4 h-4" />
                            {property.bathrooms}
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {property.price?.toLocaleString() || "Price on request"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground">
                  {searchQuery ? "No matching listings." : "No listings yet."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Other tabs */}
        {activeTab === "posts" && (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">Coming soon</p>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="mt-12 space-y-8">
            {/* Review Form - Only show if user is logged in and not viewing own profile */}
            {currentUser && agentId && currentUser.id !== agentId && (
              <AgentReviewForm
                agentId={agentId}
                onReviewSubmitted={() => {
                  fetchReviews();
                  // Refresh agent data to update rating
                  fetchAgents();
                }}
              />
            )}

            {/* Reviews List */}
            {isLoadingReviews ? (
              <div className="space-y-4">
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
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">
                    Reviews ({reviewsCount})
                  </h3>
                  <div className="flex items-center gap-2 bg-[#2E2E2E] px-4 py-2 rounded-full">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">
                      {agent.rating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      ({reviewsCount}{" "}
                      {reviewsCount === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <AgentReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            ) : (
              <AgentReviewsEmptyState />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
