// app/social-feed/post/[id]/page.tsx
"use client";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  TouchEvent,
  WheelEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  ArrowLeft,
  Eye,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  UserCheck,
  UserPlus,
} from "lucide-react";
import Image from "next/image";
import CommentsModal from "@/components/social-feed/CommentsModal";
import ShareModal from "@/components/social-feed/ShareModal";
import ImageLightbox from "@/components/social-feed/ImageLightbox";
import { usePosts } from "@/hooks/usePosts";
import { useFollow } from "@/hooks/useFollow";
import { useAuth } from "@/contexts/auth-context";
import type { Post as PostType, Comment } from "@/hooks/usePosts";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
  type: string;
}

export default function MediaViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const {
    fetchPostById,
    likePost,
    viewPost,
    fetchComments,
    createComment,
    replyToComment,
    likeComment,
    deleteComment,
    posts,
    loadMorePosts,
    hasMore,
    isLoading,
    fetchPosts,
  } = usePosts();

  const {
    toggleFollow,
    checkFollowStatus,
    isLoading: isFollowLoading,
  } = useFollow();
  const { user: currentUser, isAuthenticated } = useAuth();

  // -----------------------------------------------------------------
  // Global UI state
  // -----------------------------------------------------------------
  const [currentPostId, setCurrentPostId] = useState<string>("");
  const [routePostId, setRoutePostId] = useState<string>(""); // Track URL param separately
  const [translateY, setTranslateY] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string>("");
  const [allPostsLoaded, setAllPostsLoaded] = useState(false);
  const [isLoadingSinglePost, setIsLoadingSinglePost] = useState(false);
  const [postFetchAttempted, setPostFetchAttempted] = useState(false);
  const [postNotFound, setPostNotFound] = useState(false); // Track if post was not found (404)
  const [isMounted, setIsMounted] = useState(false); // Prevent hydration mismatch

  // Follow states
  const [followStatusMap, setFollowStatusMap] = useState<
    Record<string, boolean>
  >({});
  const [followLoadingMap, setFollowLoadingMap] = useState<
    Record<string, boolean>
  >({});

  // Video states (centralized)
  const [videoPlayingMap, setVideoPlayingMap] = useState<
    Record<string, boolean>
  >({});
  const [videoErrorMap, setVideoErrorMap] = useState<Record<string, boolean>>(
    {}
  );
  const [videoMutedMap, setVideoMutedMap] = useState<Record<string, boolean>>(
    {}
  );
  const [videoVolumeMap, setVideoVolumeMap] = useState<Record<string, number>>(
    {}
  );

  // Per-post caches
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [mediaIndexMap, setMediaIndexMap] = useState<Record<string, number>>(
    {}
  );
  const [textExpandedMap, setTextExpandedMap] = useState<
    Record<string, boolean>
  >({});

  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Refs
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const videoInitializedRef = useRef<Record<string, boolean>>({});
  const videoLoadingRef = useRef<Record<string, boolean>>({}); // Track videos being loaded
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelThrottle = useRef<NodeJS.Timeout | null>(null);
  const isNavigating = useRef(false);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const minSwipe = 80;
  const scrollPosition = useRef(0);
  const followStatusInitialized = useRef(false);
  const currentPostLoadedId = useRef<string | null>(null);
  const isLoadingMore = useRef(false);
  const lastPlayedPostRef = useRef<string | null>(null); // Track last post that was autoplayed
  const manuallyPausedRef = useRef<Record<string, boolean>>({}); // Track videos that were manually paused
  const isUserScrolling = useRef(false); // Track if user is actively scrolling
  const scrollEndTimeout = useRef<NodeJS.Timeout | null>(null);
  const isLoadingPostsRef = useRef(false); // Track if we're currently loading more posts
  const preservedScrollPost = useRef<string | null>(null); // Preserve which post user was viewing during load
  const hasScrolledToInitialPost = useRef(false); // Track if we've scrolled to initial post on page load

  // Helper function to check if a post has a video
  const checkUrlForVideo = (url?: string | null) => {
    if (!url) return false;
    let candidate = url;
    try {
      const parsed = new URL(url);
      candidate = parsed.pathname || url;
    } catch {
      // Ignore URL parsing errors for relative URLs
    }
    const lower = candidate.toLowerCase();
    const videoExtensions = [".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"];
    if (videoExtensions.some((ext) => lower.endsWith(ext))) return true;
    return lower.includes("/video/") || lower.includes("video");
  };

  // Helper function to check if a post has any video
  const postHasVideo = (post: PostType) => {
    const mediaItems = post.images?.length
      ? post.images
      : post.media_url
      ? [post.media_url]
      : [];
    return mediaItems.some((item) => checkUrlForVideo(item));
  };

  // Filter posts to only show videos
  const videoPosts = posts.filter(postHasVideo);

  // Helper: current index in filtered video posts
  const currentIdx = videoPosts.findIndex((p) => p.id === currentPostId);

  const initializeFollowStatus = useCallback(async () => {
    // Prevent multiple initializations
    if (followStatusInitialized.current) {
      console.log("🔄 Follow status already initialized, skipping");
      return;
    }

    if (posts.length === 0 || !currentUser) {
      console.log("🔄 Skipping follow status initialization: no posts or user");
      return;
    }

    console.log(`🔄 Initializing follow status for ${posts.length} posts`);

    // Get unique author IDs from all posts
    const authorIds = [
      ...new Set(posts.map((post) => post.author?.id).filter(Boolean)),
    ];

    if (authorIds.length === 0) {
      console.log("📝 No valid author IDs found in posts");
      return;
    }

    console.log(`📝 Unique authors to check:`, authorIds);

    try {
      const followStatus = await checkFollowStatus(authorIds);
      console.log(`✅ Received follow status:`, followStatus);

      setFollowStatusMap(followStatus);
      followStatusInitialized.current = true;
    } catch (error) {
      console.error("❌ Failed to initialize follow status:", error);
    }
  }, [currentUser, checkFollowStatus, posts]);

  // Posts are automatically fetched by usePosts hook, no need to fetch here
  useEffect(() => {
    if (posts.length > 0 && !allPostsLoaded) {
      setAllPostsLoaded(true);
    }
  }, [posts.length, allPostsLoaded]);

  // Load all available posts upfront (eliminates pagination issues)
  useEffect(() => {
    const loadAllPosts = async () => {
      // Keep loading posts until there are no more
      let attempts = 0;
      const maxAttempts = 50; // Safety limit to prevent infinite loops
      
      while (hasMore && !isLoading && attempts < maxAttempts) {
        console.log(`[MediaView] Loading all posts - attempt ${attempts + 1}, current count: ${posts.length}`);
        await loadMorePosts();
        attempts++;
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (attempts > 0) {
        console.log(`[MediaView] Finished loading all posts. Total: ${posts.length}`);
      }
    };

    // Only start loading if we have some posts and there are more to load
    if (posts.length > 0 && hasMore && !isLoadingMore.current) {
      loadAllPosts();
    }
  }, [posts.length, hasMore, isLoading, loadMorePosts]);

  // Initialize follow status when posts load (only once)
  useEffect(() => {
    if (posts.length > 0 && currentUser && !followStatusInitialized.current) {
      console.log("🔄 Posts loaded, initializing follow status...");
      initializeFollowStatus();
    }
  }, [posts.length, currentUser, initializeFollowStatus]);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if current post needs to be fetched (when posts array changes or currentPostId changes)
  useEffect(() => {
    if (!currentPostId || postNotFound) return; // Don't fetch if post was already marked as not found

    const postInArray = posts.find((p) => p.id === currentPostId);

    // If looking for a post that's not in array and not currently loading, fetch it
    if (!postInArray && !isLoadingSinglePost && postFetchAttempted && !postNotFound) {
      console.log(
        `🔄 Current post ${currentPostId} not in array after state update, fetching...`
      );
      setIsLoadingSinglePost(true);
      setPostFetchAttempted(false);

      fetchPostById(currentPostId)
        .then((fetchedPost) => {
          if (fetchedPost) {
            viewPost(currentPostId);

            if (!commentsMap[currentPostId]) {
              fetchComments(currentPostId).then((resp) => {
                setCommentsMap((prev) => ({
                  ...prev,
                  [currentPostId]: resp.results ?? [],
                }));
              });
            }

            setMediaIndexMap((prev) => ({ ...prev, [currentPostId]: 0 }));
            setVideoMutedMap((prev) => ({ ...prev, [currentPostId]: true }));
            setVideoVolumeMap((prev) => ({ ...prev, [currentPostId]: 0.7 }));
            setIsLoadingSinglePost(false);
            setTimeout(() => setPostFetchAttempted(true), 500);
          } else {
            // Post not found (404) - mark as not found and redirect
            console.log(`❌ Post ${currentPostId} not found (404)`);
            setPostNotFound(true);
            setIsLoadingSinglePost(false);
            // Redirect to feed after a short delay
            setTimeout(() => {
              router.push("/social-feed");
            }, 1000);
          }
        })
        .catch((error) => {
          console.error("❌ Failed to fetch missing post:", error);
          // Check if it's a 404 error
          const is404 = error.response?.status === 404 || error.message?.includes("404");
          if (is404) {
            setPostNotFound(true);
            setTimeout(() => {
              router.push("/social-feed");
            }, 1000);
          }
          setIsLoadingSinglePost(false);
          setTimeout(() => setPostFetchAttempted(true), 500);
        });
    }
  }, [
    currentPostId,
    posts,
    isLoadingSinglePost,
    postFetchAttempted,
    postNotFound,
    fetchPostById,
    viewPost,
    fetchComments,
    commentsMap,
    router,
  ]);

  // Load more posts when near bottom
  useEffect(() => {
    if (
      currentIdx >= 0 &&
      posts.length - currentIdx < 10 &&
      hasMore &&
      !isLoading &&
      !isLoadingMore.current
    ) {
      console.log("[MediaView] Auto-loading more posts - near end of list", {
        currentIdx,
        totalPosts: posts.length,
        remaining: posts.length - currentIdx,
        hasMore,
      });
      isLoadingMore.current = true;
      isLoadingPostsRef.current = true; // Mark that we're loading
      preservedScrollPost.current = currentPostId; // Preserve current post
      console.log(`📌 Preserving scroll position at post: ${currentPostId}`);
      
      loadMorePosts().finally(() => {
        // Wait for DOM to update, then restore scroll position
        setTimeout(() => {
          const preservedPostId = preservedScrollPost.current;
          
          if (preservedPostId) {
            const preservedElement = document.querySelector(`[data-postid="${preservedPostId}"]`);
            
            if (preservedElement) {
              console.log(`✅ Restoring scroll position to post: ${preservedPostId}`);
              
              // Scroll to the preserved post
              preservedElement.scrollIntoView({
                behavior: 'instant' as ScrollBehavior,
                block: 'start',
              });
            }
          }
          
          isLoadingMore.current = false;
          isLoadingPostsRef.current = false;
          
          // Clear preserved post after a delay
          setTimeout(() => {
            preservedScrollPost.current = null;
          }, 1000);
        }, 300); // Wait for React to finish rendering
      });
    }
  }, [currentIdx, posts.length, hasMore, isLoading, loadMorePosts, currentPostId]);

  // Auto-load more posts on scroll
  useEffect(() => {
    const handleScroll = () => {
      scrollPosition.current = window.scrollY + window.innerHeight;
      const maxScroll = document.documentElement.scrollHeight;
      if (
        maxScroll - scrollPosition.current < 2000 &&
        hasMore &&
        !isLoading &&
        !isLoadingMore.current
      ) {
        console.log("[MediaView] Triggering loadMorePosts - scroll position");
        isLoadingMore.current = true;
        isLoadingPostsRef.current = true;
        preservedScrollPost.current = currentPostId;
        
        loadMorePosts().finally(() => {
          setTimeout(() => {
            const preservedPostId = preservedScrollPost.current;
            
            if (preservedPostId) {
              const preservedElement = document.querySelector(`[data-postid="${preservedPostId}"]`);
              
              if (preservedElement) {
                console.log(`✅ Restoring scroll position to post: ${preservedPostId}`);
                preservedElement.scrollIntoView({
                  behavior: 'instant' as ScrollBehavior,
                  block: 'start',
                });
              }
            }
            
            isLoadingMore.current = false;
            isLoadingPostsRef.current = false;
            
            setTimeout(() => {
              preservedScrollPost.current = null;
            }, 1000);
          }, 300);
        });
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoading, loadMorePosts, currentPostId]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const { id } = await params;

      if (!isMounted) return;

      console.log(
        `🔍 Effect triggered for post ID: ${id}, posts.length=${posts.length}`
      );

      // Check if post is actually in the array, not just if we attempted to load it
      const postInArray = posts.find((p) => p.id === id);

      // Skip only if post is already in array AND we've marked it as loaded
      if (currentPostLoadedId.current === id && postInArray) {
        console.log(`✅ Post ${id} already loaded and in array, skipping`);
        if (!isMounted) return;
        setCurrentPostId(id);
        setRoutePostId(id); // Track route parameter
        setActivePostId(id);
        setPostFetchAttempted(true);
        return;
      }

      // Reset the loaded ref if post is not in array (stale ref from hot reload)
      if (currentPostLoadedId.current === id && !postInArray) {
        console.log(
          `⚠️ Post ${id} marked as loaded but not in array, will refetch`
        );
        currentPostLoadedId.current = null;
      }

      console.log(`🎯 Loading post: ${id}`);
      if (!isMounted) return;
      setCurrentPostId(id);
      setRoutePostId(id); // Track route parameter
      setActivePostId(id);
      currentPostLoadedId.current = id;
      setIsLoadingSinglePost(true);
      setPostFetchAttempted(false);

      try {
        // Check if post already exists in posts array (from feed)
        const post = posts.find((p) => p.id === id);

        // If post is in cache, use it immediately without showing loading
        if (post) {
          console.log(`✅ Using cached post ${id}`);
          if (!isMounted) return;
          setPostFetchAttempted(true);
          setIsLoadingSinglePost(false);

          // Initialize states immediately
          setMediaIndexMap((prev) => ({ ...prev, [id]: 0 }));
          setVideoMutedMap((prev) => ({ ...prev, [id]: false }));
          setVideoVolumeMap((prev) => ({ ...prev, [id]: 0.7 }));

          // Fetch comments and register view in background (non-blocking)
          Promise.all([
            viewPost(id).catch(console.error),
            commentsMap[id]
              ? Promise.resolve()
              : fetchComments(id)
                  .then((resp) => {
                    if (isMounted) {
                      setCommentsMap((prev) => ({
                        ...prev,
                        [id]: resp.results ?? [],
                      }));
                    }
                  })
                  .catch(console.error),
          ]);
          return;
        }

        // Only fetch if not found in existing posts
        console.log(`📡 Post ${id} not in cache, fetching...`);
        const fetchedPost = await fetchPostById(id);

        if (!isMounted) return;

        if (fetchedPost) {
          // Debug: Log post media data
          if (process.env.NODE_ENV === "development") {
            console.debug(`📦 Fetched post ${id} media data:`, {
              hasMediaUrl: !!fetchedPost.media_url,
              mediaUrl: fetchedPost.media_url,
              hasImages: !!fetchedPost.images?.length,
              images: fetchedPost.images,
              isValidUrl:
                fetchedPost.media_url &&
                (fetchedPost.media_url.startsWith("http://") ||
                  fetchedPost.media_url.startsWith("https://") ||
                  fetchedPost.media_url.startsWith("/") ||
                  fetchedPost.media_url.startsWith("data:")),
            });
          }
          // Register view and fetch comments in parallel
          await Promise.all([
            viewPost(id).catch(console.error),
            fetchComments(id)
              .then((resp) => {
                if (isMounted) {
                  setCommentsMap((prev) => ({
                    ...prev,
                    [id]: resp.results ?? [],
                  }));
                }
              })
              .catch(console.error),
          ]);

          if (!isMounted) return;
          setMediaIndexMap((prev) => ({ ...prev, [id]: 0 }));

          // Initialize video states
          setVideoMutedMap((prev) => ({ ...prev, [id]: false }));
          setVideoVolumeMap((prev) => ({ ...prev, [id]: 0.7 }));
        }
      } catch (error) {
        console.error("❌ Failed to load post:", error);
      } finally {
        if (isMounted) {
          setIsLoadingSinglePost(false);
          setPostFetchAttempted(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const playVideo = useCallback(
    async (postId: string, forceMuted = true) => {
      const video = videoRefs.current[postId];
      if (!video || videoErrorMap[postId]) return;

      // Don't play if video was manually paused by user
      if (manuallyPausedRef.current[postId]) {
        // Only log in development
        if (process.env.NODE_ENV === "development") {
          console.debug(
            `⏸️ Video ${postId} was manually paused, skipping autoplay`
          );
        }
        return;
      }

      // Prevent calling playVideo if already playing (avoid infinite loops)
      if (!video.paused && videoInitializedRef.current[postId]) {
        // Only log in development
        if (process.env.NODE_ENV === "development") {
          console.debug(`⏭️ Video ${postId} already playing, skipping`);
        }
        return;
      }

      // Wait for video to be ready if it's not yet
      if (video.readyState < 3) {
        // Prevent multiple listeners from being added
        if (videoLoadingRef.current[postId]) {
          return; // Already waiting for this video to load
        }

        // Only log in development, and make it less noisy
        if (process.env.NODE_ENV === "development") {
          console.debug(`Video not ready yet for ${postId}, waiting...`);
        }
        videoLoadingRef.current[postId] = true;

        // Set up a one-time listener to play when ready
        const onCanPlay = () => {
          videoLoadingRef.current[postId] = false;
          video.removeEventListener("canplay", onCanPlay);
          playVideo(postId, forceMuted);
        };

        // Also handle error case - don't wait forever
        const onError = () => {
          videoLoadingRef.current[postId] = false;
          video.removeEventListener("canplay", onCanPlay);
          video.removeEventListener("error", onError);
        };

        video.addEventListener("canplay", onCanPlay, { once: true });
        video.addEventListener("error", onError, { once: true });

        // Timeout after 5 seconds - video might be broken
        setTimeout(() => {
          if (videoLoadingRef.current[postId]) {
            videoLoadingRef.current[postId] = false;
            video.removeEventListener("canplay", onCanPlay);
            video.removeEventListener("error", onError);
            // Silently handle timeout without console spam
          }
        }, 5000);

        return;
      }

      try {
        // Only reset currentTime if video has ended or is at the very beginning
        if (
          video.currentTime === 0 ||
          video.currentTime >= video.duration - 0.1
        ) {
          video.currentTime = 0;
        }

        // Use the forceMuted parameter consistently
        video.muted = forceMuted;
        video.playsInline = true;

        // Set volume
        const targetVolume =
          videoVolumeMap[postId] !== undefined ? videoVolumeMap[postId] : 0.7;
        video.volume = targetVolume;

        // Only log in development
        if (process.env.NODE_ENV === "development") {
          console.debug(
            `▶️ Playing video ${postId}: muted=${forceMuted}, volume=${video.volume}`
          );
        }

        await video.play();
        videoInitializedRef.current[postId] = true;
        videoLoadingRef.current[postId] = false;
        setVideoPlayingMap((prev) => ({ ...prev, [postId]: true }));

        // Update state to match actual video state
        setVideoMutedMap((prev) => ({ ...prev, [postId]: forceMuted }));
        setVideoVolumeMap((prev) => ({ ...prev, [postId]: targetVolume }));

        setVideoErrorMap((prev) => ({ ...prev, [postId]: false }));
      } catch (err) {
        console.log(`Autoplay blocked for ${postId}`);
        videoLoadingRef.current[postId] = false;
        setVideoPlayingMap((prev) => ({ ...prev, [postId]: false }));
        setVideoMutedMap((prev) => ({ ...prev, [postId]: true }));
        const unlock = () => {
          playVideo(postId, false);
          document.removeEventListener("click", unlock);
          document.removeEventListener("touchstart", unlock);
        };
        document.addEventListener("click", unlock, { once: true });
        document.addEventListener("touchstart", unlock, { once: true });
      }
    },
    [videoErrorMap, videoVolumeMap, videoMutedMap]
  );

  // FIX: Scroll to the correct post when page loads (Issue 1)
  useEffect(() => {
    // Only run if:
    // 1. We haven't scrolled to initial post yet
    // 2. We have a currentPostId
    // 3. The post exists in videoPosts array
    // 4. We're not currently loading
    if (
      !hasScrolledToInitialPost.current &&
      currentPostId &&
      videoPosts.length > 0 &&
      !isLoadingPostsRef.current &&
      !isLoadingSinglePost
    ) {
      const postExists = videoPosts.some((p) => p.id === currentPostId);
      
      if (postExists) {
        // Find the post element
        const postElement = document.querySelector(`[data-postid="${currentPostId}"]`);
        
        if (postElement) {
          console.log(`📍 Scrolling to initial post: ${currentPostId}`);
          
          // Scroll to the post
          postElement.scrollIntoView({
            behavior: 'instant' as ScrollBehavior,
            block: 'start',
          });
          
          hasScrolledToInitialPost.current = true;
          
          // Autoplay the video after scrolling
          setTimeout(() => playVideo(currentPostId, false), 300);
        }
      }
    }
  }, [currentPostId, videoPosts, isLoadingSinglePost, playVideo]);

  // Reset scroll flag when navigating to a new route
  useEffect(() => {
    return () => {
      hasScrolledToInitialPost.current = false;
    };
  }, [routePostId]);

  const toggleVideoPlayback = useCallback(
    async (postId: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const video = videoRefs.current[postId];
      if (!video) return;
      if (!video.paused) {
        video.pause();
        manuallyPausedRef.current[postId] = true; // Mark as manually paused
        setVideoPlayingMap((prev) => ({ ...prev, [postId]: false }));
      } else {
        manuallyPausedRef.current[postId] = false; // Clear manual pause flag
        video.muted = false;
        try {
          await video.play();
          setVideoPlayingMap((prev) => ({ ...prev, [postId]: true }));
          setVideoMutedMap((prev) => ({ ...prev, [postId]: false }));
        } catch (err) {
          setVideoErrorMap((prev) => ({ ...prev, [postId]: true }));
        }
      }
    },
    []
  );

  const toggleVideoMute = useCallback(
    (postId: string, e: React.MouseEvent) => {
      e?.stopPropagation();
      const video = videoRefs.current[postId];
      if (!video) return;

      const currentMuted = video.muted;
      const newMuted = !currentMuted;

      console.log(
        `🔊 Toggle: ${currentMuted ? "MUTED" : "UNMUTED"} → ${
          newMuted ? "MUTED" : "UNMUTED"
        }`
      );
      console.log(
        `🔊 Before: video.muted=${video.muted}, video.volume=${
          video.volume
        }, video.paused=${video.paused}, playing=${!video.paused}`
      );

      // Update state IMMEDIATELY
      setVideoMutedMap((prev) => {
        console.log(`🔊 Updating videoMutedMap: ${postId} = ${newMuted}`);
        return { ...prev, [postId]: newMuted };
      });

      // Set volume if unmuting
      if (!newMuted) {
        if (video.volume < 0.1) {
          video.volume = 0.7;
        }
        setVideoVolumeMap((prev) => ({ ...prev, [postId]: video.volume }));
        console.log(`🔊 Set volume to ${video.volume}`);
      }

      // Toggle mute on the video element
      video.muted = newMuted;

      console.log(
        `🔊 After set: video.muted=${video.muted}, video.volume=${video.volume}`
      );

      // If unmuting and video is paused, play it
      if (!newMuted && video.paused) {
        console.log(`▶️ Video was paused, playing...`);
        video.play().catch((err) => {
          console.error("❌ Failed to play:", err);
        });
        setVideoPlayingMap((prev) => ({ ...prev, [postId]: true }));
      }

      // Check after a brief delay if video is still unmuted
      setTimeout(() => {
        const checkVideo = videoRefs.current[postId];
        if (checkVideo) {
          console.log(
            `🔍 Verification after 100ms: video.muted=${checkVideo.muted}, expected=${newMuted}, videoMutedMap=${videoMutedMap[postId]}`
          );
          if (!newMuted && checkVideo.muted) {
            console.warn(`⚠️ Video was re-muted! Forcing unmute again...`);
            checkVideo.muted = false;
          }
        }
      }, 100);

      console.log(`✅ ${newMuted ? "MUTED" : "UNMUTED (with sound)"}`);
    },
    [videoMutedMap]
  );

  const handleVideoEnded = useCallback((postId: string) => {
    // For looping videos, don't mark as not playing
    const video = videoRefs.current[postId];
    if (video && video.loop) {
      // Video will loop automatically, keep playing state
      return;
    }

    setVideoPlayingMap((prev) => ({ ...prev, [postId]: false }));
    if (video) video.currentTime = 0;
  }, []);

  const handleVideoError = useCallback((postId: string, error?: Event) => {
    // Only log actual errors in development, and make it less noisy
    if (process.env.NODE_ENV === "development") {
      const video = videoRefs.current[postId];
      const errorInfo = video
        ? {
            error: video.error,
            networkState: video.networkState,
            readyState: video.readyState,
            src: video.src,
          }
        : "Video ref not found";
      console.warn(`Video error for ${postId}:`, errorInfo);
    }

    setVideoErrorMap((prev) => ({ ...prev, [postId]: true }));
    setVideoPlayingMap((prev) => ({ ...prev, [postId]: false }));
    videoLoadingRef.current[postId] = false;

    // Clear any pending play attempts
    if (videoRefs.current[postId]) {
      const video = videoRefs.current[postId];
      video.pause();
      video.currentTime = 0;
    }
  }, []);

  const handleVideoLoaded = useCallback(
    (postId: string) => {
      // Prevent excessive logging and state updates
      if (videoInitializedRef.current[postId]) {
        return; // Already handled this video
      }

      videoInitializedRef.current[postId] = true;
      setVideoErrorMap((prev) => ({ ...prev, [postId]: false }));

      // Autoplay only for current post
      if (postId === currentPostId) {
        setTimeout(() => playVideo(postId), 100);
      }
    },
    [currentPostId, playVideo]
  );

  const retryVideo = useCallback(
    (postId: string, e: React.MouseEvent) => {
      e?.stopPropagation();
      setVideoErrorMap((prev) => ({ ...prev, [postId]: false }));
      const video = videoRefs.current[postId];
      if (video) {
        video.load();
        setTimeout(() => playVideo(postId), 100);
      }
    },
    [playVideo]
  );

  // Handle deleting comments
  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      try {
        const success = await deleteComment(commentId);
        if (success) {
          // Remove the comment from state
          setCommentsMap((prev) => {
            const postComments = prev[currentPostId];
            if (!postComments) return prev;

            const removeComment = (comments: Comment[]): Comment[] => {
              return comments.filter((comment) => {
                if (comment.id === commentId) {
                  return false;
                }
                if (comment.replies && comment.replies.length > 0) {
                  comment.replies = removeComment(comment.replies);
                }
                return true;
              });
            };

            return {
              ...prev,
              [currentPostId]: removeComment(postComments),
            };
          });
        }
      } catch (error) {
        console.error("Failed to delete comment:", error);
      }
    },
    [deleteComment, currentPostId]
  );

  useEffect(() => {
    if (!currentPostId) return;

    // Only play if we haven't already played this post from this effect
    if (lastPlayedPostRef.current === currentPostId) {
      // Only log in development
      if (process.env.NODE_ENV === "development") {
        console.debug(
          `⏭️ Already triggered play for ${currentPostId}, skipping`
        );
      }
      return;
    }

    // Only log in development
    if (process.env.NODE_ENV === "development") {
      console.debug(`🎬 Setting up autoplay for ${currentPostId}`);
    }
    lastPlayedPostRef.current = currentPostId;

    // Reset initialized flag for the new post
    videoInitializedRef.current[currentPostId] = false;
    // Clear manual pause flag for the new post (allow autoplay)
    manuallyPausedRef.current[currentPostId] = false;

    // Autoplay unmuted for current post
    const timer = setTimeout(() => playVideo(currentPostId, false), 300);
    return () => clearTimeout(timer);
  }, [currentPostId, playVideo]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const postId = entry.target.getAttribute("data-postid");
            if (
              postId &&
              postId !== currentPostId &&
              !videoPlayingMap[postId] &&
              !videoErrorMap[postId]
            ) {
              // Only autoplay for non-current posts - these should be muted
              playVideo(postId, true);
            }
          }
        });
      },
      { threshold: 0.8, rootMargin: "50px" }
    );
    Object.keys(videoRefs.current).forEach((postId) => {
      const video = videoRefs.current[postId];
      if (video) {
        const container = video.closest("[data-postid]");
        if (container) observer.observe(container);
      }
    });
    return () => observer.disconnect();
  }, [currentPostId, videoPlayingMap, videoErrorMap, playVideo]);

  const handleFollowToggle = useCallback(
    async (authorId: string, authorData: any, e?: React.MouseEvent) => {
      e?.stopPropagation();

      const authorUsername =
        authorData?.username || authorData?.email || "Unknown User";

      console.log(
        `🎯 Follow toggle clicked for author: ${authorUsername} (${authorId})`
      );
      console.log(
        `📊 Current follow status: ${
          followStatusMap[authorId] ? "FOLLOWING" : "NOT FOLLOWING"
        }`
      );
      console.log(
        `👤 Current user: ${currentUser?.username} (${currentUser?.id})`
      );

      if (!isAuthenticated || !currentUser) {
        console.log("🚫 Not authenticated, redirecting to signin");
        router.push("/signin");
        return;
      }

      // Don't allow following yourself
      if (authorId === currentUser.id) {
        console.log("🚫 Cannot follow yourself");
        return;
      }

      const currentStatus = followStatusMap[authorId] || false;
      console.log(
        `🔄 Starting follow toggle: ${currentStatus ? "UNFOLLOW" : "FOLLOW"}`
      );

      setFollowLoadingMap((prev) => ({ ...prev, [authorId]: true }));

      try {
        const authorUser: User = {
          id: authorId,
          username: authorUsername,
          email: authorData?.email || "",
          first_name: authorData?.first_name || "",
          last_name: authorData?.last_name || "",
          avatar: authorData?.avatar || "",
          type: authorData?.type || "user",
        };

        console.log(`🔄 Calling toggleFollow with:`, authorUser);
        const success = await toggleFollow(authorUser, currentStatus);
        console.log(`✅ Follow toggle ${success ? "SUCCESSFUL" : "FAILED"}`);

        if (success) {
          const newStatus = !currentStatus;
          console.log(
            `🔄 Updating follow status to: ${
              newStatus ? "FOLLOWING" : "NOT FOLLOWING"
            }`
          );

          // Update the follow status map
          setFollowStatusMap((prev) => ({
            ...prev,
            [authorId]: newStatus,
          }));

          console.log(`✅ Follow status updated in state`);
        } else {
          console.error("❌ Follow toggle operation failed");

          // If the operation failed but the server says we're already following, sync the state
          // This handles the case where frontend and backend are out of sync
          if (currentStatus === false) {
            console.log(
              "🔄 Syncing follow status with server - user is actually following"
            );
            // Re-check the follow status for this specific user
            try {
              const updatedStatus = await checkFollowStatus([authorId]);
              if (updatedStatus[authorId] !== undefined) {
                setFollowStatusMap((prev) => ({
                  ...prev,
                  [authorId]: updatedStatus[authorId],
                }));
              }
            } catch (syncError) {
              console.error("❌ Failed to sync follow status:", syncError);
            }
          }
        }
      } catch (error: any) {
        console.error("❌ Failed to toggle follow:", error);

        // Handle the specific case where we're already following
        if (error.response?.data?.detail?.includes("already following")) {
          console.log(
            "🔄 Server says we are already following - syncing state"
          );
          setFollowStatusMap((prev) => ({
            ...prev,
            [authorId]: true,
          }));
        }
      } finally {
        setFollowLoadingMap((prev) => ({ ...prev, [authorId]: false }));
        console.log(`🏁 Follow toggle operation completed`);
      }
    },
    [
      isAuthenticated,
      currentUser,
      followStatusMap,
      toggleFollow,
      checkFollowStatus,
      router,
    ]
  );

  // -----------------------------------------------------------------
  // Navigation: next/prev (defined first for use in event handlers)
  // -----------------------------------------------------------------
  const goToNext = useCallback(() => {
    if (isNavigating.current || isTransitioning || isLoadingPostsRef.current) return;
    const nextIdx = currentIdx + 1;
    const next = videoPosts[nextIdx];

    console.log("[MediaView] goToNext called:", {
      currentIdx,
      nextIdx,
      hasNext: !!next,
      totalPosts: videoPosts.length,
      hasMore,
      isLoading,
    });

    if (!next && hasMore && !isLoading && !isLoadingMore.current) {
      console.log(
        "[MediaView] No next post but hasMore=true, loading more posts..."
      );
      isLoadingMore.current = true;
      loadMorePosts().finally(() => {
        isLoadingMore.current = false;
        // After loading, try to navigate to the next post again
        setTimeout(() => {
          const newNext = videoPosts[nextIdx];
          if (newNext) {
            console.log(
              "[MediaView] Posts loaded, navigating to new next post"
            );
            goToNext();
          }
        }, 500);
      });
      return;
    }
    if (!next) {
      // Don't auto-navigate back - just prevent further navigation
      console.log("[MediaView] Reached end of posts (no more to load)");
      return;
    }
    isNavigating.current = true;
    setIsTransitioning(true);
    setTranslateY(-100);
    setTimeout(() => {
      currentPostLoadedId.current = next.id; // Update loaded post ref
      setCurrentPostId(next.id);
      setActivePostId(next.id);
      router.replace(`/social-feed/post/${next.id}`, { scroll: false });
      if (!commentsMap[next.id]) {
        fetchComments(next.id).then((r) =>
          setCommentsMap((m) => ({ ...m, [next.id]: r.results ?? [] }))
        );
      }
      viewPost(next.id);
      setTranslateY(0);
      setIsTransitioning(false);
      isNavigating.current = false;
      setTimeout(() => playVideo(next.id, false), 200);
    }, 280);
  }, [
    currentIdx,
    videoPosts,
    hasMore,
    isLoading,
    isTransitioning,
    router,
    fetchComments,
    commentsMap,
    viewPost,
    playVideo,
    loadMorePosts,
  ]);

  const goToPrev = useCallback(() => {
    if (isNavigating.current || isTransitioning || isLoadingPostsRef.current) return;
    const prev = videoPosts[currentIdx - 1];
    if (!prev) return;
    isNavigating.current = true;
    setIsTransitioning(true);
    setTranslateY(100);
    setTimeout(() => {
      currentPostLoadedId.current = prev.id; // Update loaded post ref
      setCurrentPostId(prev.id);
      setActivePostId(prev.id);
      router.replace(`/social-feed/post/${prev.id}`, { scroll: false });
      if (!commentsMap[prev.id]) {
        fetchComments(prev.id).then((r) =>
          setCommentsMap((m) => ({ ...m, [prev.id]: r.results ?? [] }))
        );
      }
      viewPost(prev.id);
      setTranslateY(0);
      setIsTransitioning(false);
      isNavigating.current = false;
      setTimeout(() => playVideo(prev.id, false), 200);
    }, 280);
  }, [
    currentIdx,
    videoPosts,
    isTransitioning,
    router,
    fetchComments,
    commentsMap,
    viewPost,
    playVideo,
  ]);

  // -----------------------------------------------------------------
  // Touch swipe
  // -----------------------------------------------------------------
  const onTouchStart = (e: TouchEvent) => {
    // Don't handle touch events on input elements or in comments modal
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.closest('[data-comments-modal="true"]') ||
      isCommentsOpen
    ) {
      return;
    }
    touchEndY.current = null;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const onTouchMove = (e: TouchEvent) => {
    // Don't handle touch events on input elements or in comments modal
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.closest('[data-comments-modal="true"]') ||
      isCommentsOpen
    ) {
      return;
    }
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const onTouchEnd = useCallback(
    (e?: TouchEvent) => {
      // Don't handle touch events on input elements or in comments modal
      if (e) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.closest('[data-comments-modal="true"]') ||
          isCommentsOpen
        ) {
          return;
        }
      }
      if (touchStartY.current === null || touchEndY.current === null) return;
      const diff = touchStartY.current - touchEndY.current;
      if (diff > minSwipe) goToNext();
      else if (diff < -minSwipe) goToPrev();
    },
    [goToNext, goToPrev, isCommentsOpen]
  );

  // -----------------------------------------------------------------
  // Mouse wheel navigation
  // -----------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handler = (e: Event) => {
      const wheelEvent = e as unknown as WheelEvent;
      if (isNavigating.current || isTransitioning) return;
      if (wheelThrottle.current) clearTimeout(wheelThrottle.current);
      wheelThrottle.current = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 5;
        const atTop = scrollTop <= 5;
        if (wheelEvent.deltaY > 0 && atBottom) goToNext();
        else if (wheelEvent.deltaY < 0 && atTop) goToPrev();
      }, 80);
    };
    container.addEventListener("wheel", handler, { passive: true });
    return () => {
      container.removeEventListener("wheel", handler);
      if (wheelThrottle.current) clearTimeout(wheelThrottle.current);
    };
  }, [isTransitioning, goToNext, goToPrev]);

  // -----------------------------------------------------------------
  // Keyboard navigation
  // -----------------------------------------------------------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't handle keyboard shortcuts when user is typing in input/textarea
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        if (!isTyping) {
          e.preventDefault();
          goToNext();
        }
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        if (!isTyping) {
          e.preventDefault();
          goToPrev();
        }
      }
      if (e.key === "Escape") {
        if (!isTyping) {
          router.back();
        }
      }
      if (e.key === " " && currentPostId) {
        if (!isTyping) {
          e.preventDefault();
          toggleVideoPlayback(currentPostId);
        }
      }
      if (e.key === "m" && currentPostId) {
        if (!isTyping) {
          e.preventDefault();
          const video = videoRefs.current[currentPostId];
          if (video) {
            video.muted = !video.muted;
            setVideoMutedMap((prev) => ({
              ...prev,
              [currentPostId]: video.muted,
            }));
          }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentPostId, router, toggleVideoPlayback, goToNext, goToPrev]);

  // Pause videos when they scroll out of viewport and update URL
  useEffect(() => {
    let updateTimeout: NodeJS.Timeout | null = null;
    let lastUpdatedPostId: string | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible post (highest intersection ratio)
        let mostVisiblePostId: string | null = null;
        let highestRatio = 0;

        entries.forEach((entry) => {
          const postId = entry.target.getAttribute("data-postid");
          if (!postId) return;

          if (entry.isIntersecting && entry.intersectionRatio > highestRatio) {
            highestRatio = entry.intersectionRatio;
            mostVisiblePostId = postId;
          }
        });

        // Debounce URL updates to prevent excessive calls
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }

        updateTimeout = setTimeout(() => {
          // On mobile, only update if user has stopped scrolling to prevent jumping back
          // On desktop, update more freely
          const isMobile = isMobileDevice;
          const shouldUpdate = !isMobile || !isUserScrolling.current;
          
          // CRITICAL: Don't update if we're loading posts - this prevents scroll jumping
          if (isLoadingPostsRef.current || preservedScrollPost.current) {
            console.log(`⏸️ Skipping post update - loading posts or scroll position preserved`);
            return;
          }
          
          // Update current post only if post changed, has significant visibility, and not already updated
          if (
            mostVisiblePostId &&
            highestRatio > 0.5 &&
            mostVisiblePostId !== currentPostId &&
            mostVisiblePostId !== lastUpdatedPostId &&
            !isNavigating.current &&
            shouldUpdate
          ) {
            console.log(
              `🔄 Post Focus: Most visible post changed to ${mostVisiblePostId} (visibility: ${(
                highestRatio * 100
              ).toFixed(1)}%)`
            );

            lastUpdatedPostId = mostVisiblePostId;
            setCurrentPostId(mostVisiblePostId);
            setActivePostId(mostVisiblePostId);

            // Update URL in browser history without navigation
            if (typeof window !== "undefined") {
              window.history.replaceState(
                null,
                "",
                `/social-feed/post/${mostVisiblePostId}`
              );
            }

            // Only register view and fetch comments if not already done for this post
            if (!commentsMap[mostVisiblePostId]) {
              viewPost(mostVisiblePostId).catch(() => {}); // Silent fail to prevent errors
              fetchComments(mostVisiblePostId)
                .then((r) =>
                  setCommentsMap((m) => ({
                    ...m,
                    [mostVisiblePostId as string]: r.results ?? [],
                  }))
                )
                .catch(() => {}); // Silent fail to prevent errors
            }
          }
        }, isMobileDevice && isUserScrolling.current ? 500 : 100); // Longer delay during mobile scroll

        // Manage video playback (only when significant change happens)
        if (
          mostVisiblePostId &&
          highestRatio > 0.5 &&
          mostVisiblePostId !== lastUpdatedPostId
        ) {
          // Batch video state updates to prevent excessive re-renders
          const videoUpdates: Record<string, boolean> = {};
          const mutedUpdates: Record<string, boolean> = {};

          Object.keys(videoRefs.current).forEach((postId) => {
            const video = videoRefs.current[postId];
            if (!video) return;

            // Pause if not the most visible post and is playing
            if (postId !== mostVisiblePostId && !video.paused) {
              video.pause();
              video.muted = true;
              videoUpdates[postId] = false;
              mutedUpdates[postId] = true;
            }

            // Resume the most visible post if it wasn't manually paused
            if (
              postId === mostVisiblePostId &&
              video.paused &&
              !manuallyPausedRef.current[postId]
            ) {
              video.play().catch(() => {});
              videoUpdates[postId] = true;
            }
          });

          // Batch state updates
          if (Object.keys(videoUpdates).length > 0) {
            setVideoPlayingMap((prev) => ({ ...prev, ...videoUpdates }));
          }
          if (Object.keys(mutedUpdates).length > 0) {
            setVideoMutedMap((prev) => ({ ...prev, ...mutedUpdates }));
          }
        }
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: "-10% 0px -10% 0px", // Slightly smaller detection area for better center focus
      }
    );

    // Check if mobile once for the entire effect
    const isMobileDevice = typeof window !== 'undefined' && window.innerWidth <= 768;

    // Observe all post containers (not just ones with videos)
    const observeContainers = () => {
      if (containerRef.current) {
        const containers =
          containerRef.current.querySelectorAll("[data-postid]");
        containers.forEach((container) => {
          observer.observe(container);
        });
      }
    };

    // Initial observation
    observeContainers();

    // Re-observe when posts change (using a small delay to ensure DOM is updated)
    const timeoutId = setTimeout(observeContainers, 100);

    // Also add scroll listener as backup to pause videos immediately
    const handleScroll = () => {
      // Don't handle scroll events while loading posts
      if (isLoadingPostsRef.current || preservedScrollPost.current) {
        return;
      }
      
      // Find which post is currently most visible in viewport
      let mostVisiblePostId: string | null = null;
      let highestRatio = 0;

      if (containerRef.current) {
        const containers =
          containerRef.current.querySelectorAll("[data-postid]");
        containers.forEach((container) => {
          const rect = container.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const visibleTop = Math.max(0, rect.top);
          const visibleBottom = Math.min(viewportHeight, rect.bottom);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);
          const ratio = visibleHeight / viewportHeight;

          if (ratio > highestRatio) {
            highestRatio = ratio;
            mostVisiblePostId = container.getAttribute("data-postid");
          }
        });
      }

      // Pause all videos except the most visible one, and mute them to stop sound
      Object.keys(videoRefs.current).forEach((postId) => {
        const video = videoRefs.current[postId];
        if (!video) return;

        if (postId !== mostVisiblePostId) {
          if (!video.paused) {
            console.log(
              `⏸️ Scroll: Pausing video ${postId} (most visible: ${mostVisiblePostId})`
            );
            video.pause();
            video.muted = true; // Mute to stop sound
            setVideoPlayingMap((prev) => ({ ...prev, [postId]: false }));
            setVideoMutedMap((prev) => ({ ...prev, [postId]: true }));
          }
        }
      });
    };

    // Throttle scroll events (more responsive)
    let scrollTimeout: NodeJS.Timeout | null = null;
    let lastScrollTime = 0;
    const throttledScroll = () => {
      const now = Date.now();
      
      // Mark that user is scrolling
      isUserScrolling.current = true;
      
      // Clear any existing scroll end timeout
      if (scrollEndTimeout.current) {
        clearTimeout(scrollEndTimeout.current);
      }
      
      // Set a timeout to mark scroll as ended after user stops
      scrollEndTimeout.current = setTimeout(() => {
        isUserScrolling.current = false;
      }, 300); // User has stopped scrolling for 300ms
      
      // Run immediately if it's been more than 50ms since last run
      if (now - lastScrollTime > 50) {
        handleScroll();
        lastScrollTime = now;
      } else if (!scrollTimeout) {
        // Otherwise schedule it
        scrollTimeout = setTimeout(() => {
          handleScroll();
          lastScrollTime = Date.now();
          scrollTimeout = null;
        }, 50);
      }
    };

    const scrollContainer = containerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", throttledScroll, {
        passive: true,
      });
    }

    return () => {
      clearTimeout(timeoutId);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (updateTimeout) clearTimeout(updateTimeout);
      if (scrollEndTimeout.current) clearTimeout(scrollEndTimeout.current);
      observer.disconnect();
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", throttledScroll);
      }
    };
  }, [currentPostId, videoPosts.length, viewPost, fetchComments, commentsMap]);

  // Also pause non-active videos as a fallback (with debounce to prevent excessive calls)
  useEffect(() => {
    const pauseTimeout = setTimeout(() => {
      const videoUpdates: Record<string, boolean> = {};

      Object.entries(videoRefs.current).forEach(([id, video]) => {
        if (video && id !== currentPostId && !video.paused) {
          video.pause();
          videoUpdates[id] = false;
        }
      });

      // Batch update to prevent multiple re-renders
      if (Object.keys(videoUpdates).length > 0) {
        setVideoPlayingMap((prev) => ({ ...prev, ...videoUpdates }));
      }
    }, 50);

    return () => clearTimeout(pauseTimeout);
  }, [currentPostId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const videos = videoRefs.current;
      Object.values(videos).forEach((video) => {
        if (video) {
          video.pause();
          video.src = "";
          video.load();
        }
      });
    };
  }, []);

  // Reset modal states when navigating to a different post (URL changes, not scroll)
  useEffect(() => {
    if (routePostId) {
      setIsCommentsOpen(false);
      setIsShareOpen(false);
      setActivePostId(routePostId);
    }
  }, [routePostId]);

  // Redirect if current post is not a video
  useEffect(() => {
    if (
      currentPostId &&
      postFetchAttempted &&
      !isLoadingSinglePost &&
      !isLoading
    ) {
      const currentPost = posts.find((p) => p.id === currentPostId);
      if (currentPost && !postHasVideo(currentPost)) {
        console.log(
          `🚫 Post ${currentPostId} is not a video, redirecting to feed`
        );
        router.replace("/social-feed");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPostId,
    postFetchAttempted,
    isLoadingSinglePost,
    isLoading,
    posts,
    router,
  ]);

  // -----------------------------------------------------------------
  // Media carousel
  // -----------------------------------------------------------------
  const nextMedia = useCallback(
    (postId: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      const items = post.images?.length
        ? post.images
        : post.media_url
        ? [post.media_url]
        : [];
      setMediaIndexMap((m) => ({
        ...m,
        [postId]: ((m[postId] ?? 0) + 1) % items.length,
      }));
      setTimeout(() => playVideo(postId), 100);
    },
    [posts, playVideo]
  );

  const prevMedia = useCallback(
    (postId: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      const items = post.images?.length
        ? post.images
        : post.media_url
        ? [post.media_url]
        : [];
      setMediaIndexMap((m) => ({
        ...m,
        [postId]: ((m[postId] ?? 0) - 1 + items.length) % items.length,
      }));
      setTimeout(() => playVideo(postId), 100);
    },
    [posts, playVideo]
  );

  // -----------------------------------------------------------------
  // Interactions
  // -----------------------------------------------------------------
  const handleLike = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    await likePost(postId, post.is_liked ? "unlike" : "like");
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    try {
      const result = await likeComment(commentId, isLiked ? "unlike" : "like");
      if (result && typeof result !== "boolean") {
        // Update the comment in the commentsMap
        setCommentsMap((prevMap) => {
          const updatedMap = { ...prevMap };
          Object.keys(updatedMap).forEach((postId) => {
            updatedMap[postId] = updatedMap[postId].map((comment) =>
              updateCommentLikeStatus(
                comment,
                commentId,
                result.like_count,
                !isLiked
              )
            );
          });
          return updatedMap;
        });
      }
    } catch (error) {
      console.error("Failed to like comment:", error);
    }
  };

  // Helper function to recursively update comment and its replies
  const updateCommentLikeStatus = (
    comment: Comment,
    commentId: string,
    newLikeCount: number,
    newIsLiked: boolean
  ): Comment => {
    if (comment.id === commentId) {
      return {
        ...comment,
        like_count: newLikeCount,
        is_liked: newIsLiked,
      };
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: comment.replies.map((reply) =>
          updateCommentLikeStatus(reply, commentId, newLikeCount, newIsLiked)
        ),
      };
    }
    return comment;
  };

  const openComments = (postId: string) => {
    console.log("Opening comments for post:", postId);
    setActivePostId(postId);
    setIsCommentsOpen(true);

    // Auto-focus input on mobile after modal opens
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setTimeout(() => {
        const input = document.querySelector(
          '[data-comments-modal="true"] input[type="text"]'
        ) as HTMLInputElement;
        if (input) {
          console.log("Auto-focusing input for mobile");
          input.focus();
          input.click();
          // Scroll input into view
          input.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 600);
    }
  };

  const openShare = (postId: string) => {
    setActivePostId(postId);
    setIsShareOpen(true);
  };

  // -----------------------------------------------------------------
  // Render functions
  // -----------------------------------------------------------------

  const renderSinglePost = (post: PostType) => {
    // Safety check: ensure post has author object
    if (!post.author) {
      console.error("Post missing author object:", post);
      // Create a fallback author object if missing
      post = {
        ...post,
        author: {
          id: (post as any).author_id || '',
          username: (post as any).author_username || 'Unknown',
          email: (post as any).author_username || '',
          avatar: (post as any).author_avatar || undefined,
          first_name: (post as any).author_first_name || undefined,
          last_name: (post as any).author_last_name || undefined,
          user_type: (post as any).author_user_type || undefined,
        }
      };
    }

    // Get media items - prioritize images, then media_url
    const mediaItems = post.images?.length
      ? post.images
      : post.media_url
      ? [post.media_url]
      : [];
    const mediaIdx = mediaIndexMap[post.id] ?? 0;
    const rawMedia = mediaItems[mediaIdx];

    // Validate and sanitize media URL - CRITICAL: must be a valid URL
    let currentMedia: string | undefined = undefined;
    if (rawMedia) {
      const trimmed = rawMedia.trim();
      // Only accept valid URL patterns - must start with http, /, or data:
      if (
        trimmed &&
        (trimmed.startsWith("http://") ||
          trimmed.startsWith("https://") ||
          trimmed.startsWith("/") ||
          trimmed.startsWith("data:"))
      ) {
        currentMedia = trimmed;
      } else {
        // Invalid URL - clear it to prevent browser from using page URL
        if (process.env.NODE_ENV === "development") {
          console.warn(`❌ Invalid media URL for post ${post.id}:`, {
            original: rawMedia,
            postMediaUrl: post.media_url,
            postImages: post.images,
            mediaItems,
          });
        }
        currentMedia = undefined;
      }
    } else {
      // No media at all
      if (process.env.NODE_ENV === "development") {
        console.debug(`📭 Post ${post.id} has no media:`, {
          hasImages: !!post.images?.length,
          hasMediaUrl: !!post.media_url,
          mediaUrl: post.media_url,
        });
      }
    }

    // Improved video detection logic
    const checkUrlForVideo = (url?: string | null) => {
      if (!url) return false;

      let candidate = url;
      try {
        const parsed = new URL(url);
        candidate = parsed.pathname || url;
      } catch {
        // Ignore URL parsing errors for relative URLs
      }

      const lower = candidate.toLowerCase();
      const videoExtensions = [".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"];
      if (videoExtensions.some((ext) => lower.endsWith(ext))) return true;

      return lower.includes("/video/") || lower.includes("video");
    };

    // Only consider it a video if we have a valid currentMedia URL
    const isVideo = currentMedia ? checkUrlForVideo(currentMedia) : false;

    // Ensure currentMedia is a string if it exists (for TypeScript)
    const validVideoSrc =
      currentMedia && typeof currentMedia === "string"
        ? currentMedia
        : undefined;
    const expanded = textExpandedMap[post.id] ?? false;
    const isVideoPlaying = videoPlayingMap[post.id] ?? false;
    const hasVideoError = videoErrorMap[post.id] ?? false;
    const isVideoMuted = videoMutedMap[post.id] ?? false;

    // Follow status for this post's author
    const isFollowing = followStatusMap[post.author.id] || false;
    const isFollowLoadingForAuthor = followLoadingMap[post.author.id] || false;
    const isOwnPost = currentUser && post.author.id === currentUser.id;

    // Debug logging in development
    if (process.env.NODE_ENV === "development" && isVideo) {
      console.debug(`🎥 Post ${post.id} video check:`, {
        hasMediaUrl: !!post.media_url,
        mediaUrl: post.media_url,
        currentMedia,
        isValid:
          !!currentMedia &&
          (currentMedia.startsWith("http") ||
            currentMedia.startsWith("/") ||
            currentMedia.startsWith("data:")),
        isVideo,
      });
    }

    return (
      <div className="relative w-full h-full">
        <div className="flex flex-col lg:flex-row lg:gap-4 max-w-4xl w-full h-full mx-auto lg:items-end lg:justify-center lg:px-4 md:pb-8 pb-4">
          {/* Post Card - Left Side */}
          <div className="w-full lg:w-auto lg:max-w-[500px] h-full lg:flex-shrink-0 flex items-end justify-center">
            <div className="bg-transparent rounded-2xl overflow-hidden w-full">
              <div
                className="relative h-[85vh] md:h-[90vh] w-full group"
                data-postid={post.id}
                onClick={(e) => {
                  // Only open lightbox if clicking on the image itself (not buttons/controls)
                  const target = e.target as HTMLElement;
                  if (
                    target.tagName === "BUTTON" ||
                    target.closest("button") ||
                    isVideo
                  ) {
                    return;
                  }

                  const imageOnlyItems = mediaItems.filter(
                    (m) => m && !checkUrlForVideo(m)
                  );
                  if (imageOnlyItems.length > 0) {
                    console.log("📸 Opening lightbox:", {
                      total: imageOnlyItems.length,
                      currentIndex: mediaIdx,
                      images: imageOnlyItems,
                    });
                    setLightboxImages(imageOnlyItems);
                    setLightboxIndex(mediaIdx);
                    setIsLightboxOpen(true);
                  }
                }}
              >
                {isVideo && validVideoSrc ? (
                  <div className="relative w-full h-full">
                    <video
                      key={`video-${post.id}-${validVideoSrc}`}
                      ref={(el) => {
                        if (el && validVideoSrc) {
                          videoRefs.current[post.id] = el;

                          // CRITICAL: Set src IMMEDIATELY and SYNCHRONOUSLY to prevent browser default
                          // Don't wait for requestAnimationFrame - set it right away
                          if (el.src !== validVideoSrc) {
                            el.src = validVideoSrc;
                            if (process.env.NODE_ENV === "development") {
                              console.debug(
                                `✅ Set video src for ${post.id} to:`,
                                validVideoSrc
                              );
                            }
                          }

                          // Also set in next frame as backup
                          requestAnimationFrame(() => {
                            if (
                              el &&
                              validVideoSrc &&
                              el.src !== validVideoSrc
                            ) {
                              el.src = validVideoSrc;
                              el.load();
                            }
                          });

                          // Validate src is correct and not the page URL
                          const checkSrc = () => {
                            if (el && validVideoSrc) {
                              if (
                                el.src === window.location.href ||
                                el.currentSrc === window.location.href
                              ) {
                                console.log(
                                  `🔧 Fixed video src for ${post.id}:`,
                                  validVideoSrc
                                );
                                el.src = validVideoSrc;
                                el.load();
                              }
                            }
                          };
                          // Check immediately and after delays
                          checkSrc();
                          setTimeout(checkSrc, 50);
                          setTimeout(checkSrc, 200);

                          // Set initial muted state (only when element is first created)
                          if (el.muted !== (videoMutedMap[post.id] ?? true)) {
                            el.muted = videoMutedMap[post.id] ?? true;
                          }
                          // Set volume
                          if (videoVolumeMap[post.id] !== undefined) {
                            el.volume = videoVolumeMap[post.id];
                          }
                        }
                      }}
                      src={validVideoSrc}
                      className="w-full h-full object-cover"
                      loop
                      playsInline
                      preload="auto"
                      autoPlay={post.id === currentPostId}
                      onEnded={() => handleVideoEnded(post.id)}
                      onError={(
                        e: React.SyntheticEvent<HTMLVideoElement, Event>
                      ) => {
                        const video = e.currentTarget;
                        // Check if src is the page URL (browser default) - this is a validation error
                        if (
                          validVideoSrc &&
                          (video.src === window.location.href ||
                            video.currentSrc === window.location.href)
                        ) {
                          console.error(
                            `❌ Video src defaulted to page URL for ${post.id}. Fixing...`,
                            {
                              postMediaUrl: post.media_url,
                              postImages: post.images,
                              currentMedia: validVideoSrc,
                              videoSrc: video.src,
                              videoCurrentSrc: video.currentSrc,
                            }
                          );
                          // Force set the correct src
                          video.src = validVideoSrc;
                          video.load();
                          setVideoErrorMap((prev) => ({
                            ...prev,
                            [post.id]: false,
                          }));
                          return;
                        }
                        // Real video loading error
                        if (process.env.NODE_ENV === "development") {
                          console.error(`❌ Video error for ${post.id}:`, {
                            error: video.error,
                            networkState: video.networkState,
                            readyState: video.readyState,
                            src: video.src,
                            currentSrc: video.currentSrc,
                            expectedSrc: validVideoSrc,
                          });
                        }
                        handleVideoError(post.id, e.nativeEvent);
                      }}
                      onLoadedData={() => handleVideoLoaded(post.id)}
                      onLoadStart={() => {
                        // Reset error state when video starts loading
                        if (videoErrorMap[post.id]) {
                          setVideoErrorMap((prev) => ({
                            ...prev,
                            [post.id]: false,
                          }));
                        }
                        // Double-check src is correct on load start
                        const video = videoRefs.current[post.id];
                        if (
                          video &&
                          validVideoSrc &&
                          video.src !== validVideoSrc &&
                          video.src !== window.location.href
                        ) {
                          if (process.env.NODE_ENV === "development") {
                            console.debug(
                              `🔧 Fixing video src on loadStart for ${post.id}`
                            );
                          }
                          video.src = validVideoSrc;
                        }
                      }}
                    />
                    {/* Hover Play/Pause Controls - Top Left */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none group-hover:pointer-events-auto">
                      {/* Mobile Back Button - Always visible on mobile */}
                      <button
                        onClick={() => router.push("/social-feed")}
                        className="lg:hidden bg-black/60 hover:bg-black/80 rounded-full p-2 transition-all opacity-100 pointer-events-auto"
                        aria-label="Go back to feed"
                      >
                        <ArrowLeft className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={(e) => toggleVideoPlayback(post.id, e)}
                        className="bg-black/60 hover:bg-black/80 rounded-full p-2 transition-all"
                      >
                        {isVideoPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => toggleVideoMute(post.id, e)}
                        className="bg-black/60 hover:bg-black/80 rounded-full p-2 transition-all"
                      >
                        {isVideoMuted ? (
                          <VolumeX className="w-5 h-5 text-white" />
                        ) : (
                          <Volume2 className="w-5 h-5 text-white" />
                        )}
                      </button>
                    </div>
                    {/* Play/Pause Overlay - Center (for clicking) */}
                    <div
                      className={cn(
                        "absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity cursor-pointer z-10",
                        isVideoPlaying
                          ? "opacity-0 hover:opacity-100 pointer-events-none hover:pointer-events-auto"
                          : "opacity-100"
                      )}
                      onClick={(e) => toggleVideoPlayback(post.id, e)}
                    >
                      <button
                        className={cn(
                          "w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm transition-all hover:scale-110",
                          hasVideoError && "bg-red-500/20"
                        )}
                        onClick={(e) => toggleVideoPlayback(post.id, e)}
                      >
                        {hasVideoError ? (
                          <div className="text-white text-xs">Error</div>
                        ) : isVideoPlaying ? (
                          <Pause className="w-6 h-6 text-white" />
                        ) : (
                          <Play className="w-6 h-6 text-white ml-1" />
                        )}
                      </button>
                    </div>
                    {/* Loading - removed spinner, just show dark overlay */}
                    {!videoRefs.current[post.id]?.readyState &&
                      !hasVideoError && (
                        <div className="absolute inset-0 bg-black/30 z-20 pointer-events-none"></div>
                      )}
                    {/* Error */}
                    {hasVideoError && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center flex-col gap-2 z-20">
                        <div className="text-white text-sm">
                          Failed to load video
                        </div>
                        <button
                          className="text-white text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30 pointer-events-auto z-30"
                          onClick={(e) => retryVideo(post.id, e)}
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    {/* YouTube-style Mobile Action Buttons - Inside Video */}
                    <div className="lg:hidden absolute bottom-20 right-4 flex flex-col gap-6 items-center z-30">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex flex-col gap-1 items-center text-white hover:text-red-500 transition-colors group"
                      >
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-3 group-hover:bg-black/60 transition-colors">
                          <Heart
                            className={cn(
                              "w-6 h-6",
                              post.is_liked && "fill-red-500 text-red-500"
                            )}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {post.like_count > 1000
                            ? `${(post.like_count / 1000).toFixed(1)}K`
                            : post.like_count}
                        </span>
                      </button>
                      <button
                        onClick={() => openComments(post.id)}
                        className="flex flex-col gap-1 items-center text-white hover:text-gray-300 transition-colors group"
                      >
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-3 group-hover:bg-black/60 transition-colors">
                          <MessageCircle className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium">
                          {post.comment_count}
                        </span>
                      </button>
                      <button
                        onClick={() => openShare(post.id)}
                        className="flex flex-col gap-1 items-center text-white hover:text-gray-300 transition-colors group"
                      >
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-3 group-hover:bg-black/60 transition-colors">
                          <Share2 className="w-6 h-6" />
                        </div>
                      </button>
                      <div className="flex flex-col gap-1 items-center text-white group">
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-3">
                          <Eye className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium">
                          {post.view_count > 1000
                            ? `${(post.view_count / 1000).toFixed(1)}K`
                            : post.view_count}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : currentMedia ? (
                  <div className="relative w-full h-full cursor-pointer group">
                    <Image
                      src={currentMedia}
                      alt={post.caption || "Post image"}
                      fill
                      sizes="(max-width: 768px) 100vw, 600px"
                      className="object-cover pointer-events-none"
                    />
                    {/* Hover indicator */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                    {/* Mobile Back Button - Top Left */}
                    <div className="lg:hidden absolute top-3 left-3 z-30">
                      <button
                        onClick={() => router.push("/social-feed")}
                        className="bg-black/60 hover:bg-black/80 rounded-full p-2 transition-all"
                        aria-label="Go back to feed"
                      >
                        <ArrowLeft className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    {/* YouTube-style Mobile Action Buttons - Inside Image */}
                    <div className="lg:hidden absolute bottom-20 right-4 flex flex-col gap-6 items-center z-30">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex flex-col gap-1 items-center text-white hover:text-red-500 transition-colors group"
                      >
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-3 group-hover:bg-black/60 transition-colors">
                          <Heart
                            className={cn(
                              "w-6 h-6",
                              post.is_liked && "fill-red-500 text-red-500"
                            )}
                          />
                        </div>
                        <span className="text-xs font-medium text-white">
                          {post.like_count > 1000
                            ? `${(post.like_count / 1000).toFixed(1)}K`
                            : post.like_count}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(
                            "Mobile comment button clicked for post:",
                            post.id
                          );
                          openComments(post.id);
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                        }}
                        className="flex flex-col gap-1 items-center text-white hover:text-gray-300 transition-colors group touch-manipulation"
                      >
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-3 group-hover:bg-black/60 transition-colors">
                          <MessageCircle className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-white">
                          {post.comment_count}
                        </span>
                      </button>
                      <button
                        onClick={() => openShare(post.id)}
                        className="flex flex-col gap-1 items-center text-white hover:text-gray-300 transition-colors group"
                      >
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-3 group-hover:bg-black/60 transition-colors">
                          <Share2 className="w-6 h-6" />
                        </div>
                      </button>
                      <div className="flex flex-col gap-1 items-center text-white group">
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-3">
                          <Eye className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-white">
                          {post.view_count > 1000
                            ? `${(post.view_count / 1000).toFixed(1)}K`
                            : post.view_count}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-8">
                    <div className="text-center max-w-md">
                      <p className="text-white text-lg mb-4">📝 Text Post</p>
                      <p className="text-gray-300 text-sm">
                        This post doesn&apos;t have any media content.
                      </p>
                    </div>
                    {/* Mobile Back Button - Top Left */}
                    <div className="lg:hidden absolute top-3 left-3 z-30">
                      <button
                        onClick={() => router.push("/social-feed")}
                        className="bg-black/60 hover:bg-black/80 rounded-full p-2 transition-all"
                        aria-label="Go back to feed"
                      >
                        <ArrowLeft className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    {/* YouTube-style Mobile Action Buttons - Inside Text Post */}
                    <div className="lg:hidden absolute bottom-20 right-4 flex flex-col gap-6 items-center z-30">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex flex-col gap-1 items-center text-white hover:text-red-500 transition-colors group"
                      >
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-3 group-hover:bg-black/60 transition-colors">
                          <Heart
                            className={cn(
                              "w-6 h-6",
                              post.is_liked && "fill-red-500 text-red-500"
                            )}
                          />
                        </div>
                        <span className="text-xs font-medium text-white">
                          {post.like_count > 1000
                            ? `${(post.like_count / 1000).toFixed(1)}K`
                            : post.like_count}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(
                            "Text post comment button clicked for post:",
                            post.id
                          );
                          openComments(post.id);
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                        }}
                        className="flex flex-col gap-1 items-center text-white hover:text-gray-300 transition-colors group touch-manipulation"
                      >
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-3 group-hover:bg-black/60 transition-colors">
                          <MessageCircle className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-white">
                          {post.comment_count}
                        </span>
                      </button>
                      <button
                        onClick={() => openShare(post.id)}
                        className="flex flex-col gap-1 items-center text-white hover:text-gray-300 transition-colors group"
                      >
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-3 group-hover:bg-black/60 transition-colors">
                          <Share2 className="w-6 h-6" />
                        </div>
                      </button>
                      <div className="flex flex-col gap-1 items-center text-white group">
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-3">
                          <Eye className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-white">
                          {post.view_count > 1000
                            ? `${(post.view_count / 1000).toFixed(1)}K`
                            : post.view_count}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {/* Media Controls */}
                {mediaItems.length > 1 && (
                  <>
                    <button
                      onClick={(e) => prevMedia(post.id, e)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full z-10 hover:bg-black/70"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => nextMedia(post.id, e)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full z-10 hover:bg-black/70"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                      {mediaItems.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMediaIndexMap((m) => ({ ...m, [post.id]: i }));
                            setTimeout(() => playVideo(post.id), 100);
                          }}
                          className={cn(
                            "h-1 w-8 rounded-full transition-all",
                            i === mediaIdx ? "bg-white" : "bg-white/40"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
                {/* Caption */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          router.push(`/social-feed/user/${post.author.id}`)
                        }
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={post.author.avatar} />
                          <AvatarFallback className="bg-gray-600 text-white text-xs">
                            {post.author.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            router.push(`/social-feed/user/${post.author.id}`)
                          }
                          className="font-medium text-white text-[15px] hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          {post.author.username}
                        </button>
                        <span className="text-[15px] text-[#8C8C8C]">•</span>
                        <p className="text-[15px] text-[#8C8C8C]">
                          {new Date(post.created_at).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Follow Button */}
                      {!isOwnPost && (
                        <button
                          className={cn(
                            "text-white  rounded-lg px-3 py-1 text-[15px] font-medium transition-all duration-200 flex items-center gap-2",
                            isFollowing
                              ? "bg-white/20 border-gray-400 hover:bg-white/30"
                              : "bg-[#141414]  hover:bg-white/30",
                            isFollowLoadingForAuthor &&
                              "opacity-50 cursor-not-allowed"
                          )}
                          onClick={(e) => {
                            console.log(
                              `🖱️ Follow button clicked for ${post.author.username}`
                            );
                            console.log(
                              `📊 Current state - isFollowing: ${isFollowing}, isLoading: ${isFollowLoadingForAuthor}`
                            );
                            console.log(`📝 Full author data:`, post.author);

                            // Pass the entire author object instead of just username
                            handleFollowToggle(post.author.id, post.author, e);
                          }}
                          disabled={isFollowLoadingForAuthor}
                          title={`Click to ${
                            isFollowing ? "unfollow" : "follow"
                          } ${post.author.username || "this user"}`}
                        >
                          {isFollowLoadingForAuthor ? (
                            <div className="w-4 h-4 border-2 border-white rounded-full opacity-50" />
                          ) : isFollowing ? (
                            <>
                              <UserCheck className="w-4 h-4" />
                              Following
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Follow
                            </>
                          )}
                        </button>
                      )}

                      {/* Show "You" badge for own posts */}
                      {isOwnPost && (
                        <span className="text-white border border-gray-400 rounded-lg px-3 py-1 text-[15px] font-medium opacity-70">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                  <p
                    className="text-white text-sm leading-relaxed cursor-pointer hover:text-gray-200 w-[80%]"
                    onClick={() =>
                      setTextExpandedMap((m) => ({
                        ...m,
                        [post.id]: !m[post.id],
                      }))
                    }
                  >
                    {expanded
                      ? post.caption
                      : post.caption.length > 50
                      ? `${post.caption.substring(0, 50)}...`
                      : post.caption}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Engagement Icons - Middle */}
          <div className="hidden lg:flex flex-col gap-5 items-center justify-end px-4 pb-4">
            <button
              onClick={() => handleLike(post.id)}
              className="flex flex-col gap-1.5 items-center text-white hover:text-red-500 transition-colors"
            >
              <Heart
                className={cn(
                  "w-8 h-8",
                  post.is_liked && "fill-red-500 text-red-500"
                )}
              />
              <span className="text-sm font-medium">
                {post.like_count > 1000
                  ? `${(post.like_count / 1000).toFixed(1)}K`
                  : post.like_count}
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log(
                  "Desktop comment button clicked for post:",
                  post.id
                );
                openComments(post.id);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
              }}
              className="flex flex-col gap-1.5 items-center text-white hover:text-gray-300 transition-colors touch-manipulation"
            >
              <MessageCircle className="w-8 h-8" />
              <span className="text-sm font-medium">{post.comment_count}</span>
            </button>
            <button
              onClick={() => openShare(post.id)}
              className="flex flex-col gap-1.5 items-center text-white hover:text-gray-300 transition-colors"
            >
              <Share2 className="w-8 h-8" />
            </button>
            <div className="flex flex-col gap-1.5 items-center text-white">
              <Eye className="w-8 h-8" />
              <span className="text-sm font-medium">
                {post.view_count > 1000
                  ? `${(post.view_count / 1000).toFixed(1)}K`
                  : post.view_count}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white p-1"
            >
              <MoreHorizontal className="w-6 h-6" />
            </Button>
          </div>
          {/* Mobile action buttons are now inside the media card above */}
        </div>
      </div>
    );
  };

  // Show loading state ONLY when actively fetching a post that's not in cache
  // Don't show loading if post is already in posts array (from feed cache)
  const postInCache =
    currentPostId && posts.find((p) => p.id === currentPostId);
  if (
    currentPostId &&
    isLoadingSinglePost &&
    !postInCache &&
    !postFetchAttempted
  ) {
    // Show minimal loading - no spinner, just empty state
    return (
      <div className="flex h-screen bg-[#0a0a0a] items-center justify-center">
        <div className="text-center">
          <p className="text-white text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state ONLY if post not found after all loading is complete
  // Also redirect immediately if postNotFound is true
  if (postNotFound) {
    return (
      <div className="flex h-screen bg-[#0a0a0a] items-center justify-center">
        <div className="text-center px-4">
          <p className="text-white text-lg mb-4">Post not found</p>
          <p className="text-gray-400 text-sm mb-6">
            This post may have been deleted or is unavailable.
          </p>
          <p className="text-gray-500 text-xs mb-4">Redirecting to feed...</p>
          <Button
            onClick={() => router.push("/social-feed")}
            className="bg-white text-black hover:bg-gray-200"
          >
            Go to Feed
          </Button>
        </div>
      </div>
    );
  }

  if (
    currentIdx === -1 &&
    currentPostId &&
    postFetchAttempted &&
    !isLoadingSinglePost &&
    !postNotFound
  ) {
    console.log(
      `❌ Showing error state: currentIdx=${currentIdx}, postFetchAttempted=${postFetchAttempted}, posts.length=${posts.length}`
    );
    console.log(
      `📋 Posts IDs:`,
      posts.map((p) => p.id)
    );
    console.log(`🎯 Looking for post ID:`, currentPostId);
    
    // Mark as not found and redirect
    setPostNotFound(true);
    setTimeout(() => {
      router.push("/social-feed");
    }, 1000);
    
    return (
      <div className="flex h-screen bg-[#0a0a0a] items-center justify-center">
        <div className="text-center px-4">
          <p className="text-white text-lg mb-4">Post not found</p>
          <p className="text-gray-400 text-sm mb-6">
            This post may have been deleted or is unavailable.
          </p>
          <p className="text-gray-500 text-xs mb-4">Redirecting to feed...</p>
          <Button
            onClick={() => router.push("/social-feed")}
            className="bg-white text-black hover:bg-gray-200"
          >
            Go to Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen-mobile bg-[#0a0a0a] overflow-hidden snap-y snap-mandatory"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={(e) => onTouchEnd(e)}
    >
      {/* Desktop Back Button */}
      <button
        onClick={() => router.push("/social-feed")}
        className="hidden lg:block fixed top-16 left-4 z-50 p-2.5 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-all shadow-md active:scale-95 touch-manipulation"
        aria-label="Go back to feed"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div
        ref={containerRef}
        className="flex-1 relative overflow-y-auto snap-y snap-mandatory"
        style={{
          transform: `translateY(${translateY}%)`,
          transition: isTransitioning
            ? "transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
            : "none",
          scrollSnapType: "y mandatory",
        }}
      >
        {/* Render all video posts for proper navigation */}
        {isMounted && videoPosts.map((post, index) => (
          <div key={post.id} className="h-screen snap-start">
            {renderSinglePost(post)}
          </div>
        ))}
        {currentIdx === videoPosts.length - 1 &&
          !hasMore &&
          videoPosts.length > 0 && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center text-white/70 text-sm">
              End of feed - {videoPosts.length} videos viewed
            </div>
          )}
      </div>
      {/* Desktop Comments - Fixed position outside scroll container */}
      {isCommentsOpen && (
        <div className="hidden lg:flex fixed right-[50px] top-0 h-full items-end z-50 pb-8">
          <CommentsModal
            isOpen={true}
            onClose={() => setIsCommentsOpen(false)}
            comments={
              Array.isArray(commentsMap[activePostId])
                ? commentsMap[activePostId]
                : []
            }
            mode="inline"
            onCommentCreated={async (content) => {
              const newC = await createComment(activePostId, content);
              if (newC) {
                setCommentsMap((m) => ({
                  ...m,
                  [activePostId]: [newC, ...(m[activePostId] ?? [])],
                }));
              }
            }}
            onReply={async (parentId, content) => {
              const newReply = await replyToComment(parentId, content);
              if (newReply) {
                // Refetch comments to get updated thread
                const updatedComments = await fetchComments(activePostId);
                if (updatedComments && updatedComments.results) {
                  setCommentsMap((m) => ({
                    ...m,
                    [activePostId]: updatedComments.results,
                  }));
                }
              }
            }}
            onLikeComment={handleLikeComment}
            onDeleteComment={handleDeleteComment}
            currentUserId={currentUser?.id}
            currentUserAvatar={currentUser?.avatar}
            currentUserName={
              currentUser?.first_name ||
              currentUser?.username ||
              currentUser?.email?.split("@")[0]
            }
          />
        </div>
      )}
      {/* Mobile Comments */}
      {isCommentsOpen && (
        <div className="lg:hidden" data-comments-modal="true">
          <CommentsModal
            isOpen={true}
            onClose={() => setIsCommentsOpen(false)}
            comments={
              Array.isArray(commentsMap[activePostId])
                ? commentsMap[activePostId]
                : []
            }
            mode="overlay"
            onCommentCreated={async (content) => {
              const newC = await createComment(activePostId, content);
              if (newC) {
                setCommentsMap((m) => ({
                  ...m,
                  [activePostId]: [newC, ...(m[activePostId] ?? [])],
                }));
              }
            }}
            onReply={async (parentId, content) => {
              const newReply = await replyToComment(parentId, content);
              if (newReply) {
                // Refetch comments to get updated thread
                const updatedComments = await fetchComments(activePostId);
                if (updatedComments && updatedComments.results) {
                  setCommentsMap((m) => ({
                    ...m,
                    [activePostId]: updatedComments.results,
                  }));
                }
              }
            }}
            onLikeComment={handleLikeComment}
            onDeleteComment={handleDeleteComment}
            currentUserId={currentUser?.id}
            currentUserAvatar={currentUser?.avatar}
            currentUserName={
              currentUser?.first_name ||
              currentUser?.username ||
              currentUser?.email?.split("@")[0]
            }
          />
        </div>
      )}
      {/* Share Modal */}
      {posts.find((p) => p.id === activePostId) && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          postId={activePostId}
          postTitle={(() => {
            const post = posts.find((p) => p.id === activePostId);
            const caption = post?.caption || "Post";
            return (
              caption.substring(0, 50) + (caption.length > 50 ? "..." : "")
            );
          })()}
        />
      )}

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
