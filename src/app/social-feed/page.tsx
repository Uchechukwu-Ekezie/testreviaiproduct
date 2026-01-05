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
import CreateStoryModal from "@/components/social-feed/CreateStoryModal";

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
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);

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

  // Debug: Log stories data
  useEffect(() => {
    console.log("[SocialFeed] Stories state:", {
      storiesCount: stories.length,
      stories,
      currentUserId: user?.id,
      isLoadingStories,
    });
  }, [stories, user?.id, isLoadingStories]);

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

  // Auto-load all posts when page loads (similar to media view page)
  const isLoadingAllPosts = useRef(false);
  const hasStartedAutoLoad = useRef(false);
  const previousPostsLength = useRef(0);
  
  useEffect(() => {
    const loadAllPosts = async () => {
      // Only load if we have posts, there are more to load, and we're not already loading
      if (posts.length > 0 && hasMore && !isLoadingPosts && !isLoadingAllPosts.current && !hasStartedAutoLoad.current) {
        hasStartedAutoLoad.current = true;
        isLoadingAllPosts.current = true;
        previousPostsLength.current = posts.length;
        console.log(`[SocialFeed] Auto-loading all posts. Current: ${posts.length}, hasMore: ${hasMore}`);
        
        let attempts = 0;
        const maxAttempts = 50; // Safety limit to prevent infinite loops
        let lastPostsCount = posts.length;
        let noChangeCount = 0; // Track consecutive loads with no new posts
        
        while (hasMore && !isLoadingPosts && attempts < maxAttempts) {
          console.log(`[SocialFeed] Loading more posts - attempt ${attempts + 1}, current count: ${posts.length}`);
          await loadMorePosts();
          attempts++;
          
          // Wait for state to update (posts array and hasMore)
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check if we got new posts
          if (posts.length === lastPostsCount) {
            noChangeCount++;
            // If we've had 2 consecutive loads with no new posts, stop
            if (noChangeCount >= 2) {
              console.log(`[SocialFeed] No new posts loaded after ${noChangeCount} attempts, stopping`);
              break;
            }
          } else {
            noChangeCount = 0; // Reset counter if we got new posts
            lastPostsCount = posts.length;
          }
        }
        
        if (attempts > 0) {
          console.log(`[SocialFeed] Finished auto-loading posts. Total: ${posts.length}, attempts: ${attempts}`);
        }
        
        isLoadingAllPosts.current = false;
      }
    };

    // Start loading all posts after initial posts are loaded and page is mounted
    // Only start once when we first get posts
    if (posts.length > 0 && hasMore && !isLoadingPosts && isMounted && !hasStartedAutoLoad.current && previousPostsLength.current === 0) {
      previousPostsLength.current = posts.length;
      // Small delay to ensure initial render is complete
      const timeoutId = setTimeout(() => {
        loadAllPosts();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [posts.length, hasMore, isLoadingPosts, loadMorePosts, isMounted]);

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

  // Improved infinite scroll with Intersection Observer + mobile fallback
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollHandlerRef = useRef<(() => void) | null>(null);
  const containerRef = useRef<HTMLElement | Window | null>(null);

  useEffect(() => {
    if (!isMounted) return;

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const currentTrigger = loadMoreTriggerRef.current;

      if (!currentTrigger) {
        console.log("[SocialFeed] Trigger element not found");
        return;
      }

      // Cleanup previous observers/listeners
      if (observerRef.current && currentTrigger) {
        observerRef.current.unobserve(currentTrigger);
      }
      if (scrollHandlerRef.current && containerRef.current) {
        containerRef.current.removeEventListener("scroll", scrollHandlerRef.current);
      }

      // Find the scrolling container (main element in SocialFeedClientWrapper)
      const findScrollingContainer = (): HTMLElement | null => {
        let element: HTMLElement | null = currentTrigger;
        while (element && element !== document.body) {
          const style = window.getComputedStyle(element);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            console.log("[SocialFeed] Found scrolling container:", element);
            return element;
          }
          element = element.parentElement;
        }
        console.log("[SocialFeed] No scrolling container found, using viewport");
        return null;
      };

      const scrollingContainer = findScrollingContainer();

      // Intersection Observer - use scrolling container as root if found
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          console.log("[SocialFeed] Intersection Observer entry:", {
            isIntersecting: entry.isIntersecting,
            hasMore,
            isLoadingPosts,
            isLoadingMore: isLoadingMoreRef.current,
            intersectionRatio: entry.intersectionRatio
          });
          
          if (entry.isIntersecting && hasMore && !isLoadingPosts && !isLoadingMoreRef.current) {
            console.log("[SocialFeed] Intersection Observer triggered - Loading more posts");
            isLoadingMoreRef.current = true;
            loadMorePosts().finally(() => {
              isLoadingMoreRef.current = false;
            });
          }
        },
        {
          root: scrollingContainer, // Use scrolling container as root
          rootMargin: "400px", // Start loading 400px before the trigger
          threshold: 0.1,
        }
      );

      observer.observe(currentTrigger);
      observerRef.current = observer;
      console.log("[SocialFeed] Intersection Observer set up", {
        hasMore,
        triggerElement: currentTrigger,
        scrollingContainer: scrollingContainer
      });

      // Fallback scroll listener on the actual scrolling container
      const handleScroll = () => {
        if (isLoadingMoreRef.current || !hasMore || isLoadingPosts) {
          return;
        }

        const container = scrollingContainer || document.documentElement;
        
        const scrollTop = scrollingContainer 
          ? scrollingContainer.scrollTop 
          : window.scrollY;
        
        const scrollHeight = scrollingContainer
          ? scrollingContainer.scrollHeight
          : document.documentElement.scrollHeight;
        
        const clientHeight = scrollingContainer
          ? scrollingContainer.clientHeight
          : window.innerHeight;

        const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

        // Trigger load when within 500px of bottom
        if (distanceFromBottom < 500 && hasMore && !isLoadingPosts && !isLoadingMoreRef.current) {
          console.log("[SocialFeed] Scroll listener triggered - Loading more posts", {
            distanceFromBottom,
            scrollTop,
            scrollHeight,
            clientHeight,
            hasMore,
            isLoadingPosts,
            isLoadingMore: isLoadingMoreRef.current
          });
          isLoadingMoreRef.current = true;
          loadMorePosts().finally(() => {
            isLoadingMoreRef.current = false;
          });
        }
      };

      // Add scroll listener to the actual scrolling container
      const containerToListen = scrollingContainer || window;
      containerToListen.addEventListener("scroll", handleScroll, { passive: true });
      scrollHandlerRef.current = handleScroll;
      containerRef.current = containerToListen;
      console.log("[SocialFeed] Scroll listener attached to:", containerToListen);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      const currentTrigger = loadMoreTriggerRef.current;
      if (observerRef.current && currentTrigger) {
        observerRef.current.unobserve(currentTrigger);
        observerRef.current = null;
      }
      if (scrollHandlerRef.current && containerRef.current) {
        containerRef.current.removeEventListener("scroll", scrollHandlerRef.current);
        scrollHandlerRef.current = null;
        containerRef.current = null;
      }
    };
  }, [hasMore, isLoadingPosts, loadMorePosts, isMounted]);

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
         <div className="mt-14 sm:mt-16 ">
          <StoriesBar
            stories={stories}
            currentUserId={user?.id}
            currentUserAvatar={user?.avatar}
            currentUserName={user?.first_name || user?.username || "You"}
            onStoryClick={(userId, storyIndex) => {
              console.log("[SocialFeed] Story clicked:", { userId, storyIndex });
              setSelectedStoryIndex(storyIndex);
              setIsStoryViewerOpen(true);
            }}
            onCreateStory={() => {
              setIsCreateStoryModalOpen(true);
            }}
            isLoading={isLoadingStories}
          />
        </div> 

        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-32 sm:pb-32 ">
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
              {isMounted && hasMore && combinedPosts.length > 0 && (
                <div
                  ref={loadMoreTriggerRef}
                  className="h-20 flex items-center justify-center min-h-[80px]"
                  style={{ minHeight: '80px' }}
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

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={isCreateStoryModalOpen}
        onClose={() => setIsCreateStoryModalOpen(false)}
        onCreateStory={async (mediaUrl, mediaType, caption) => {
          await createStory(mediaUrl, mediaType, caption);
        }}
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
