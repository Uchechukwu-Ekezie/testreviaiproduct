// app/social-feed/page.tsx
"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

// Components
import SearchAndFilter from "@/components/social-feed/SearchAndFilter";
import PostCard from "@/components/social-feed/PostCard";
import AgentCard from "@/components/social-feed/AgentCard";
import EmptyState from "@/components/social-feed/EmptyState";
import PostComposer from "@/components/social-feed/PostComposer";
import FeaturedProperties from "@/components/social-feed/FeaturedProperties";
import NeighborhoodHighlights from "@/components/social-feed/NeighbourHighlights";
import ImageLightbox from "@/components/social-feed/ImageLightbox";
import PostCardSkeleton from "@/components/social-feed/PostCardSkeleton";
import AgentCardSkeleton from "@/components/social-feed/AgentCardSkeleton";
import StoriesBar from "@/components/social-feed/StoriesBar";
import StoryViewer from "@/components/social-feed/StoryViewer";

// Hooks
import { usePosts } from "@/hooks/usePosts";
import { useAgents } from "@/hooks/useAgents";
import { useProperties } from "@/contexts/properties-context";
import { useFollow } from "@/hooks/useFollow";
import { useStories } from "@/hooks/useStories";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import type { Post as PostType } from "@/hooks/usePosts";

export default function SocialFeed() {
  const { user } = useAuth();
  const router = useRouter();

  const {
    posts,
    isLoading: isLoadingPosts,
    error: postsError,
    createPost,
    likePost,
    fetchComments,
    createComment,
    replyToComment,
    likeComment,
    loadMorePosts,
    hasMore,
  } = usePosts();

  const {
    agents,
    isLoading: isLoadingAgents,
    error: agentsError,
    fetchAgents,
  } = useAgents();

  const { fetchPropertiesByUserId, properties: agentProperties } =
    useProperties();

  // NEW: Follow functionality
  const { toggleFollow, checkFollowStatus } = useFollow();

  // NEW: Stories functionality
  const {
    stories,
    isLoading: isLoadingStories,
    viewStory,
    createStory,
    deleteStory,
  } = useStories();

  const { uploadImage, uploadVideo } = useCloudinaryUpload();

  const [selectedFilter, setSelectedFilter] = useState<string>("trending");
  const hasPostsRef = useRef(false);
  const [optimisticPosts, setOptimisticPosts] = useState<PostType[]>([]);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // Stories viewer state
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  // NEW: Follow state management
  const [followStatusMap, setFollowStatusMap] = useState<
    Record<string, boolean>
  >({});
  const [followLoadingMap, setFollowLoadingMap] = useState<
    Record<string, boolean>
  >({});
  // Track which author IDs we've already checked to prevent duplicate API calls
  const checkedAuthorIdsRef = useRef<Set<string>>(new Set());

  // Image lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Prevent hydration mismatch - only render posts after mount
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Scroll position restoration
  const hasRestoredScroll = useRef(false);

  useEffect(() => {
    if (posts.length > 0) hasPostsRef.current = true;
  }, [posts.length]);

  // Restore scroll position when returning to feed
  useEffect(() => {
    if (!hasRestoredScroll.current && posts.length > 0) {
      const savedScrollPosition = sessionStorage.getItem(
        "socialFeedScrollPosition"
      );
      if (savedScrollPosition) {
        const scrollPos = parseInt(savedScrollPosition, 10);
        console.log("📜 Restoring scroll position:", scrollPos);
        // Only restore if no modals are open and page is visible
        const hasModalsOpen = document.querySelector(
          '[role="dialog"], .fixed.inset-0'
        );
        if (!hasModalsOpen && !document.hidden) {
          // Use requestAnimationFrame for smoother restoration
          requestAnimationFrame(() => {
            window.scrollTo({
              top: scrollPos,
              behavior: "instant" as ScrollBehavior,
            });
          });
        }
        hasRestoredScroll.current = true;
      }
    }
  }, [posts]);

  // Save scroll position on scroll and before navigation - debounced
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      // Debounce scroll saving to prevent excessive writes
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        sessionStorage.setItem(
          "socialFeedScrollPosition",
          window.scrollY.toString()
        );
      }, 100); // Save every 100ms max
    };

    // Also save before navigation
    const saveScrollBeforeUnload = () => {
      sessionStorage.setItem(
        "socialFeedScrollPosition",
        window.scrollY.toString()
      );
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("beforeunload", saveScrollBeforeUnload);

    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", saveScrollBeforeUnload);
    };
  }, []);

  // NEW: Initialize follow status for all posts - only check NEW authors
  const postsAuthorIds = useMemo(() => {
    if (posts.length === 0) return [];
    
    // Debug: Log posts to see their structure
    console.log('[SocialFeed] Total posts:', posts.length);
    console.log('[SocialFeed] Sample post structure:', posts[0]);
    
    const postsWithAuthor = posts.filter(post => post.author);
    console.log('[SocialFeed] Posts with author:', postsWithAuthor.length);
    
    if (postsWithAuthor.length === 0 && posts.length > 0) {
      console.warn('[SocialFeed] No posts have author property! Sample post:', posts[0]);
    }
    
    return [...new Set(postsWithAuthor.map((post) => post.author.id).filter(Boolean))];
  }, [posts]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const initializeFollowStatus = async () => {
      if (postsAuthorIds.length === 0 || !user) return;

      // Only check author IDs we haven't checked yet
      const newAuthorIds = postsAuthorIds.filter(
        (id) => !checkedAuthorIdsRef.current.has(id)
      );

      if (newAuthorIds.length === 0) {
        // All authors already checked, no need to make API call
        return;
      }

      // Mark these IDs as checked before making the API call
      newAuthorIds.forEach((id) => checkedAuthorIdsRef.current.add(id));

      try {
        const followStatus = await checkFollowStatus(newAuthorIds);
        setFollowStatusMap((prev) => {
          // Only update if there are actual changes to prevent unnecessary re-renders
          const hasChanges = newAuthorIds.some(
            (id) => prev[id] !== followStatus[id]
          );
          if (!hasChanges) return prev;
          return { ...prev, ...followStatus };
        });
      } catch (error) {
        // If API call fails, remove IDs from checked set so we can retry
        newAuthorIds.forEach((id) => checkedAuthorIdsRef.current.delete(id));
        console.error("Failed to initialize follow status:", error);
      }
    };

    // Debounce the follow status check to prevent rapid-fire API calls
    if (postsAuthorIds.length > 0 && user) {
      timeoutId = setTimeout(() => {
        initializeFollowStatus();
      }, 300); // Wait 300ms after posts change before checking follow status
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postsAuthorIds.join(","), user]); // Use stringified array to prevent unnecessary calls

  // Fetch agents when the tab is selected - only once per session
  useEffect(() => {
    if (selectedFilter === "agents") {
      fetchAgents();
    }
  }, [selectedFilter, fetchAgents]);

  useEffect(() => {
    if (selectedFilter === "agents" && agents.length > 0) {
      agents.forEach((a) => a.id && fetchPropertiesByUserId(a.id));
    }
  }, [agents, selectedFilter, fetchPropertiesByUserId]);

  // Memoize combined posts more efficiently
  const combinedPosts = useMemo(
    () => [...optimisticPosts, ...posts],
    [optimisticPosts, posts]
  );

  const handleLike = useCallback(
    async (postId: string) => {
      const post = combinedPosts.find((p) => p.id === postId);
      if (!post) return;
      if (post.isPending) return;
      await likePost(postId, post.is_liked ? "unlike" : "like");
    },
    [combinedPosts, likePost]
  );

  const handleShare = useCallback(
    (postId: string) => {
      const post = combinedPosts.find((p) => p.id === postId);
      if (!post || post.isPending) return;
      console.log("Shared:", postId);
    },
    [combinedPosts]
  );

  // NEW: Follow toggle handler for posts - memoized
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

      // Don't allow following yourself
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

        // Update follow status
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

  const handleViewAgent = (agentId: string) => {
    router.push(`/social-feed/agent/${agentId}`);
  };

  // Handle opening lightbox from PostCard
  const handleOpenLightbox = useCallback(
    (images: string[], startIndex: number) => {
      console.log("📸 Opening lightbox from feed:", {
        total: images.length,
        startIndex,
        images,
      });
      setLightboxImages(images);
      setLightboxIndex(startIndex);
      setIsLightboxOpen(true);
    },
    []
  );

  // Improved infinite scroll with Intersection Observer
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentTrigger = loadMoreTriggerRef.current;

    if (!currentTrigger) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isLoadingPosts) {
          console.log(
            "[SocialFeed] Intersection Observer triggered - Loading more posts"
          );
          loadMorePosts();
        }
      },
      {
        root: null,
        rootMargin: "800px", // Start loading 800px before the trigger element (about 1-2 posts ahead)
        threshold: 0.1,
      }
    );

    observer.observe(currentTrigger);

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
    };
  }, [hasMore, isLoadingPosts, loadMorePosts]);

  const handleCreatePost = useCallback(
    async (
      caption: string,
      imageUrls: string[] = [],
      videoUrl: string | null = null,
      location?: {
        city: string;
        state: string;
        country: string;
        latitude: number;
        longitude: number;
        location_label: string;
      }
    ) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticPost: PostType = {
        id: tempId,
        caption,
        content: caption,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        media_url: videoUrl || undefined,
        author: {
          id: user?.id || "temp-user",
          username: user?.username || "you",
          email: user?.email || "you",
          avatar: user?.avatar,
          first_name: user?.first_name,
          last_name: user?.last_name,
        },
        type: undefined,
        like_count: 0,
        view_count: 0,
        comment_count: 0,
        is_liked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isPending: true,
      };

      setOptimisticPosts((prev) => [optimisticPost, ...prev]);
      setIsCreatingPost(true);

      try {
        const success = await createPost(
          caption,
          imageUrls,
          videoUrl,
          location
        );
        if (!success) {
          setOptimisticPosts((prev) =>
            prev.filter((post) => post.id !== tempId)
          );
          return false;
        }

        setOptimisticPosts((prev) => prev.filter((post) => post.id !== tempId));
        return true;
      } catch (error) {
        setOptimisticPosts((prev) => prev.filter((post) => post.id !== tempId));
        throw error;
      } finally {
        setIsCreatingPost(false);
      }
    },
    [createPost, user]
  );

  const shouldShowEmptyState =
    !["agents", "featured", "neighborhood"].includes(selectedFilter) &&
    !isLoadingPosts &&
    posts.length === 0 &&
    !hasPostsRef.current &&
    !postsError;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#141414] to-[#0a0a0a]">
        {/* Stories Bar */}
        <div className="mt-14 sm:mt-16">
          <StoriesBar
            stories={stories}
            currentUserId={user?.id}
            currentUserAvatar={user?.avatar}
            currentUserName={user?.first_name || user?.username || "You"}
            onStoryClick={(userId, storyIndex) => {
              setSelectedStoryIndex(storyIndex);
              setIsStoryViewerOpen(true);
            }}
            onCreateStory={async () => {
              // Trigger file input for story creation
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*,video/*";
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  try {
                    let uploadedUrl: string | null = null;
                    const mediaType = file.type.startsWith("video/")
                      ? "video"
                      : "image";

                    // Upload to Cloudinary first
                    if (mediaType === "image") {
                      uploadedUrl = await uploadImage(file);
                    } else {
                      uploadedUrl = await uploadVideo(file);
                    }

                    if (!uploadedUrl) {
                      throw new Error("Failed to upload media");
                    }

                    // Create story with uploaded URL
                    await createStory(uploadedUrl, mediaType);
                  } catch (error) {
                    console.error("Failed to create story:", error);
                  }
                }
              };
              input.click();
            }}
            isLoading={isLoadingStories}
          />
        </div>

        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-32 sm:pb-32">
          {/* Inline Post Composer */}
          <PostComposer
            onCreatePost={handleCreatePost}
            isPosting={isCreatingPost}
          />

          <SearchAndFilter
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
          />

          {/* FEATURED */}
          {selectedFilter === "featured" && <FeaturedProperties />}

          {/* NEIGHBORHOOD */}
          {selectedFilter === "neighborhood" && <NeighborhoodHighlights />}

          {/* AGENTS */}
          {selectedFilter === "agents" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {isLoadingAgents ? (
                <>
                  <AgentCardSkeleton />
                  <AgentCardSkeleton />
                  <AgentCardSkeleton />
                  <AgentCardSkeleton />
                  <AgentCardSkeleton />
                  <AgentCardSkeleton />
                </>
              ) : agentsError ? (
                <div className="col-span-full text-center py-8 text-red-400 text-sm">
                  {agentsError}
                </div>
              ) : agents.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No agents found.
                </div>
              ) : (
                agents.map((agent) => {
                  const listings = agentProperties.filter(
                    (p) => p.created_by === agent.id
                  );
                  return (
                    <AgentCard
                      key={agent.id}
                      agent={{
                        ...agent,
                        propertiesSold: listings.length,
                        experience: "N/A",
                        location: agent.location || "Nigeria",
                      }}
                      onViewAgent={handleViewAgent}
                    />
                  );
                })
              )}
            </div>
          )}

          {/* POSTS (trending only) */}
          {selectedFilter === "trending" && (
            <div className="space-y-4 sm:space-y-6">
              {isLoadingPosts && posts.length === 0 && (
                <>
                  <PostCardSkeleton />
                  <PostCardSkeleton />
                  <PostCardSkeleton />
                </>
              )}

              {isMounted && combinedPosts.map((post) => {
                const isFollowing = post.author ? (followStatusMap[post.author.id] || false) : false;

                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onShare={handleShare}
                    fetchComments={fetchComments}
                    createComment={createComment}
                    replyToComment={replyToComment}
                    onLikeComment={async (commentId: string, isLiked: boolean) => {
                      const action = isLiked ? "unlike" : "like";
                      const result = await likeComment(commentId, action);
                      return result;
                    }}
                    // NEW: Pass follow props
                    isFollowing={isFollowing}
                    onFollowToggle={handleFollowToggle}
                    // Image lightbox handler
                    onOpenLightbox={handleOpenLightbox}
                  />
                );
              })}

              {/* Intersection Observer trigger for infinite scroll - only show after mount */}
              {isMounted && hasMore && posts.length > 0 && (
                <div
                  ref={loadMoreTriggerRef}
                  className="h-20 flex items-center justify-center"
                >
                  {isLoadingPosts && (
                    <p className="text-center text-gray-400 py-8 text-sm">
                      Loading more content...
                    </p>
                  )}
                </div>
              )}

              {isMounted && !hasMore && posts.length > 0 && !isLoadingPosts && (
                <p className="text-center text-gray-500 py-8 text-sm">
                  You&apos;re all caught up!
                </p>
              )}

              {isMounted && shouldShowEmptyState && (
                <EmptyState
                  searchQuery=""
                  onClearFilters={() => setSelectedFilter("trending")}
                />
              )}

              {isMounted && postsError && posts.length === 0 && (
                <div className="text-center py-8 text-red-400 text-sm">
                  {postsError}
                </div>
              )}
            </div>
          )}
        </div>
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

      {/* Story Viewer */}
      {isStoryViewerOpen && stories.length > 0 && (
        <StoryViewer
          stories={stories}
          initialStoryIndex={selectedStoryIndex}
          currentUserId={user?.id}
          onClose={() => setIsStoryViewerOpen(false)}
          onStoryView={viewStory}
          onDeleteStory={async (storyId) => {
            try {
              await deleteStory(storyId);
            } catch (error) {
              console.error("Failed to delete story:", error);
            }
          }}
        />
      )}
    </>
  );
}
