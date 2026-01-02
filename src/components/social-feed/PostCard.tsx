// components/social-feed/PostCard.tsx
"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Play,
  Pause,
  BadgeCheck,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import ShareModal from "./ShareModal";
import CommentsModal from "./CommentsModal";
import type {
  Post as PostType,
  Comment as CommentType,
} from "@/hooks/usePosts";
import { useAuth } from "@/contexts/auth-context";
import { useFollow } from "@/hooks/useFollow";

interface PostCardProps {
  post: PostType;
  onLike: (postId: string) => Promise<void>;
  onShare: (postId: string) => void;
  fetchComments: (postId: string) => Promise<{
    results: CommentType[];
    next: string | null;
    previous: string | null;
  }>;
  createComment: (
    postId: string,
    content: string
  ) => Promise<CommentType | null>;
  replyToComment: (
    commentId: string,
    content: string
  ) => Promise<CommentType | null>;
  onLikeComment?: (commentId: string, isLiked: boolean) => Promise<any>;
  onClick?: () => void;
  // NEW: Follow props
  isFollowing?: boolean;
  onFollowToggle?: (authorId: string, authorData: any) => Promise<void>;
  // Image lightbox handler
  onOpenLightbox?: (images: string[], startIndex: number) => void;
}

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSec = Math.floor(diffInMs / 1000);
  const diffInMin = Math.floor(diffInSec / 60);
  const diffInHours = Math.floor(diffInMin / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSec < 60) return "just now";
  if (diffInMin < 60) return `${diffInMin}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  return `${diffInYears}y ago`;
};

/* --------------------------------------------------------------- */
/* PostCard component                                              */
/* --------------------------------------------------------------- */
export default function PostCard({
  post,
  onLike,
  onShare,
  fetchComments,
  createComment,
  replyToComment,
  onLikeComment,
  onClick,
  // NEW: Follow props
  isFollowing = false,
  onFollowToggle,
  // Image lightbox handler
  onOpenLightbox,
}: PostCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toggleFollow } = useFollow();

  const [localPost, setLocalPost] = useState(post);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasUserInteracted = useRef(false); // Track manual user interaction
  const justClosedModalRef = useRef(false); // Track if modal was just closed

  // Local follow state for this post's author
  const [localIsFollowing, setLocalIsFollowing] = useState(isFollowing);
  const [localIsFollowLoading, setLocalIsFollowLoading] = useState(false);

  /* ------------------------------------------------------------- */
  /* Sync local state with prop changes                            */
  /* ------------------------------------------------------------- */
  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  // Sync follow state with props
  useEffect(() => {
    setLocalIsFollowing(isFollowing);
  }, [isFollowing]);

  /* ------------------------------------------------------------- */
  /* Follow/Unfollow Handler                                       */
  /* ------------------------------------------------------------- */
  const handleFollowToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!user) {
        router.push("/signin");
        return;
      }

      // Early return if author is undefined
      if (!localPost.author) {
        return;
      }

      // Don't allow following yourself
      if (localPost.author.id === user.id) {
        return;
      }

      setLocalIsFollowLoading(true);

      try {
        if (onFollowToggle) {
          // Use parent-provided handler
          await onFollowToggle(localPost.author.id, localPost.author);
        } else {
          // Use local handler as fallback
          await toggleFollow(
            {
              id: localPost.author.id,
              username: localPost.author.username || "",
              email: localPost.author.email || "",
              first_name: localPost.author.first_name || "",
              last_name: localPost.author.last_name || "",
              avatar: localPost.author.avatar || "",
              type: localPost.author.user_type || "user",
            },
            localIsFollowing
          );
        }

        // Toggle local state
        setLocalIsFollowing((prev) => !prev);
      } catch (error) {
        console.error("Failed to toggle follow:", error);
      } finally {
        setLocalIsFollowLoading(false);
      }
    },
    [
      localPost.author,
      user,
      router,
      onFollowToggle,
      toggleFollow,
      localIsFollowing,
    ]
  );

  /* ------------------------------------------------------------- */
  /* Helpers                                                       */
  /* ------------------------------------------------------------- */
  const isVideoPost = useMemo(() => {
    const videoExtensions = [".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"];

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
      if (videoExtensions.some((ext) => lower.endsWith(ext))) return true;

      return lower.includes("/video/") || lower.includes("video");
    };

    if (checkUrlForVideo(localPost.media_url)) return true;

    const type = localPost.type?.toLowerCase();
    if (type && ["video", "reel", "short"].includes(type)) return true;

    return false;
  }, [localPost.media_url, localPost.type]);

  const handleCardClick = (e?: React.MouseEvent) => {
    if (!isVideoPost) return;
    // Don't navigate if comments modal is open
    if (isCommentsModalOpen) return;
    // Don't navigate if modal was just closed (prevents navigation on close click)
    if (justClosedModalRef.current) {
      e?.stopPropagation();
      e?.preventDefault();
      return;
    }
    // Save scroll position before navigating
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "socialFeedScrollPosition",
        window.scrollY.toString()
      );
    }
    router.push(`/social-feed/post/${localPost.id}`);
  };

  const handleOpenComments = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (localPost.isPending) return;

    setIsCommentsModalOpen(true);
    setCommentError(null);

    if (hasLoadedComments) return;

    setIsLoadingComments(true);
    try {
      const response = await fetchComments(localPost.id);
      setComments(response.results ?? []);
      setHasLoadedComments(true);
    } catch (error) {
      console.error("Failed to load comments:", error);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleCloseComments = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIsCommentsModalOpen(false);
    setCommentError(null);
    // Prevent navigation for a short period after closing modal
    justClosedModalRef.current = true;
    setTimeout(() => {
      justClosedModalRef.current = false;
    }, 500); // Increased to 500ms to ensure click events are fully processed
  };

  const handleCommentCreated = async (content: string) => {
    if (!content.trim()) return;
    setCommentError(null);

    // Create optimistic comment
    const optimisticComment: CommentType = {
      id: `temp-${Date.now()}`,
      post: localPost.id,
      author: {
        id: user?.id || 'temp-user',
        username: user?.username,
        first_name: user?.first_name,
        last_name: user?.last_name,
        email: user?.email || '',
        avatar: user?.avatar,
        type: user?.user_type || 'user',
      },
      content,
      parent: null,
      like_count: 0,
      reply_count: 0,
      is_liked: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      replies: [],
      isPending: true, // Mark as pending
    };

    // Add optimistic comment immediately
    setComments((prev) => [optimisticComment, ...prev]);
    setLocalPost((prev) => ({
      ...prev,
      comment_count: (prev.comment_count || 0) + 1,
    }));

    try {
      const newComment = await createComment(localPost.id, content);
      if (newComment) {
        // Replace optimistic comment with real one
        setComments((prev) => 
          prev.map(c => c.id === optimisticComment.id ? newComment : c)
        );
      }
    } catch (error) {
      // Remove optimistic comment on error
      setComments((prev) => prev.filter(c => c.id !== optimisticComment.id));
      setLocalPost((prev) => ({
        ...prev,
        comment_count: Math.max((prev.comment_count || 0) - 1, 0),
      }));
      
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create comment. Please try again.";
      setCommentError(message);
    }
  };

  useEffect(() => {
    setComments([]);
    setHasLoadedComments(false);
    setIsCommentsModalOpen(false);
    setCommentError(null);
  }, [localPost.id]);

  const prependReplyToComments = (
    list: CommentType[],
    parentId: string,
    reply: CommentType
  ): { updated: CommentType[]; inserted: boolean } => {
    let inserted = false;

    const updated = list.map((comment) => {
      if (comment.id === parentId) {
        inserted = true;
        return {
          ...comment,
          reply_count: (comment.reply_count ?? 0) + 1,
          replies: [reply, ...(comment.replies ?? [])],
        };
      }

      if (comment.replies && comment.replies.length > 0) {
        const { updated: nestedReplies, inserted: nestedInserted } =
          prependReplyToComments(comment.replies, parentId, reply);

        if (nestedInserted) {
          inserted = true;
          return {
            ...comment,
            reply_count: (comment.reply_count ?? 0) + 1,
            replies: nestedReplies,
          };
        }
      }

      return comment;
    });

    return { updated, inserted };
  };

  const handleReplyCreated = useCallback(
    async (parentCommentId: string, content: string) => {
      if (!content.trim()) return;
      setCommentError(null);

      try {
        const newReply = await replyToComment(parentCommentId, content);
        if (newReply) {
          setComments((prev) => {
            const { updated, inserted } = prependReplyToComments(
              prev,
              parentCommentId,
              newReply
            );
            return inserted ? updated : prev;
          });
          setLocalPost((prev) => ({
            ...prev,
            comment_count: (prev.comment_count || 0) + 1,
          }));
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to reply. Please try again.";
        setCommentError(message);
        throw error;
      }
    },
    [replyToComment, prependReplyToComments]
  );

  const handleLikeComment = useCallback(
    async (commentId: string, isLiked: boolean) => {
      if (!onLikeComment) return;

      try {
        const result = await onLikeComment(commentId, isLiked);
        if (result && typeof result === "object" && "like_count" in result) {
          // Update the comment in the local state
          const updateCommentLikeStatus = (
            comment: CommentType
          ): CommentType => {
            if (comment.id === commentId) {
              return {
                ...comment,
                like_count: result.like_count,
                is_liked: !isLiked,
              };
            }
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: comment.replies.map(updateCommentLikeStatus),
              };
            }
            return comment;
          };

          setComments((prev) => prev.map(updateCommentLikeStatus));
        }
      } catch (error) {
        console.error("Failed to like comment:", error);
        throw error;
      }
    },
    [onLikeComment]
  );

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  /* ------------------------------------------------------------- */
  /* Like handling                                                 */
  /* ------------------------------------------------------------- */
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localPost.isPending) return;
    await onLike(localPost.id);

    setLocalPost((p) => ({
      ...p,
      is_liked: !p.is_liked,
      like_count: p.is_liked ? p.like_count - 1 : p.like_count + 1,
    }));
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localPost.isPending) return;
    setIsShareModalOpen(true);
    onShare(localPost.id);
  };

  /* ------------------------------------------------------------- */
  /* Video controls                                                */
  /* ------------------------------------------------------------- */
  const toggleVideoPlayback = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localPost.isPending) return;
    if (!videoRef.current) return;

    // Mark that user has manually interacted
    hasUserInteracted.current = true;

    try {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        // Unmute when user manually plays
        videoRef.current.muted = false;
        await videoRef.current.play();
        setIsVideoPlaying(true);
      }
    } catch (err) {
      console.error("Video toggle error:", err);
      setVideoError(true);
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localPost.isPending) return;
    toggleVideoPlayback(e);
  };

  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
    hasUserInteracted.current = false; // Reset interaction flag so it can autoplay again
    if (videoRef.current) videoRef.current.currentTime = 0;
  };

  const handleVideoError = () => {
    console.error("Video failed to load");
    setVideoError(true);
    setIsVideoPlaying(false);
  };

  const handleVideoLoaded = () => setVideoError(false);

  /* ------------------------------------------------------------- */
  /* Video Autoplay with IntersectionObserver                      */
  /* ------------------------------------------------------------- */
  useEffect(() => {
    if (!isVideoPost || !videoRef.current || !cardRef.current) return;

    const video = videoRef.current;
    const card = cardRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Video is in viewport, try to autoplay ONLY if user hasn't manually interacted
            if (!hasUserInteracted.current && video.paused && !videoError) {
              video.muted = true; // Mute for autoplay
              video
                .play()
                .then(() => {
                  setIsVideoPlaying(true);
                })
                .catch((err) => {
                  console.log("Autoplay prevented:", err);
                  // Autoplay was prevented, user will need to click
                });
            }
          } else {
            // Video is out of viewport, pause it
            if (!video.paused) {
              video.pause();
              setIsVideoPlaying(false);
              // Reset interaction flag when scrolling away
              hasUserInteracted.current = false;
            }
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of the video is visible
        rootMargin: "0px",
      }
    );

    observer.observe(card);

    return () => {
      observer.disconnect();
    };
  }, [isVideoPost, videoError]);

  /* ------------------------------------------------------------- */
  /* Cleanup                                                       */
  /* ------------------------------------------------------------- */
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      hasUserInteracted.current = false;
    };
  }, []);

  // Reset interaction flag when post changes
  useEffect(() => {
    hasUserInteracted.current = false;
    setIsVideoPlaying(false);
  }, [localPost.id]);

  /* ------------------------------------------------------------- */
  /* Render helpers                                                */
  /* ------------------------------------------------------------- */
  const authorFullName = `${localPost.author?.first_name || ""} ${
    localPost.author?.last_name || ""
  }`.trim();
  const authorDisplayName = authorFullName || localPost.author?.username || "?";

  const postDate = new Date(localPost.created_at);
  const relativeTime = formatRelativeTime(postDate);
  const isPending = localPost.isPending;
  const timestampLabel = isPending ? "Posting…" : relativeTime;

  const isVerifiedAgent =
    localPost.author?.user_type === "agent" &&
    localPost.author?.verification_status === "verified";

  // Check if current user is the post author
  const isOwnPost = user && localPost.author?.id === user.id;

  return (
    <div
      ref={cardRef}
      className={cn(
        "border-b border-gray-800/50 px-3 sm:px-4 py-3 sm:py-4 transition-all duration-200",
        "hover:bg-gray-900/30",
        isVideoPost && !isCommentsModalOpen
          ? "cursor-pointer"
          : "cursor-default"
      )}
      onClick={(e) => {
        // Don't navigate if modal is open or was just closed
        if (isCommentsModalOpen || justClosedModalRef.current) {
          return;
        }
        if (isVideoPost) {
          handleCardClick(e);
        }
      }}
    >
      <div className="flex gap-2 sm:gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-gray-700/50 ring-offset-2 ring-offset-[#141414]">
            <AvatarImage src={localPost.author?.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-900 text-white">
              {(() => {
                const firstName = localPost.author?.first_name?.trim();
                const lastName = localPost.author?.last_name?.trim();
                const username = localPost.author?.username?.trim();
                
                // Try to get initials from first + last name
                if (firstName && lastName) {
                  return (firstName[0] + lastName[0]).toUpperCase();
                }
                // Fallback to first name initial
                if (firstName) {
                  return firstName[0].toUpperCase();
                }
                // Fallback to username initial
                if (username) {
                  return username[0].toUpperCase();
                }
                // Final fallback
                return "?";
              })()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap flex-1 min-w-0">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <span
                  className="font-semibold text-white text-sm sm:text-[15px] hover:text-blue-400 cursor-pointer truncate transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!localPost.isPending && localPost.author?.id) {
                      router.push(`/social-feed/user/${localPost.author.id}`);
                    }
                  }}
                >
                  {authorDisplayName}
                </span>
                {isVerifiedAgent && (
                  <BadgeCheck className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white fill-bg-r  flex-shrink-0" />
                )}
              </div>
              {localPost.author?.username && (
                <span
                  className="text-gray-400 text-xs sm:text-[15px] cursor-pointer hover:text-blue-400 truncate transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!localPost.isPending && localPost.author?.id) {
                      router.push(`/social-feed/user/${localPost.author.id}`);
                    }
                  }}
                >
                  @{localPost.author.username}
                </span>
              )}
              <span className="text-gray-500 text-xs sm:text-[15px]">·</span>
              <span className="text-gray-500 text-xs sm:text-[15px] hover:underline">
                {timestampLabel}
              </span>
            </div>

            {/* Follow Button */}
            {!isOwnPost && !localIsFollowing && (
              <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ml-1">
                <button
                  className={cn(
                    "text-white rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-[13px] font-medium transition-all duration-200 flex items-center gap-0.5 sm:gap-1 shadow-sm",
                    "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-500/20",
                    localIsFollowLoading &&
                      "opacity-50 cursor-not-allowed"
                  )}
                  onClick={handleFollowToggle}
                  disabled={localIsFollowLoading}
                  title={`Click to follow ${localPost.author?.username || "this user"}`}
                >
                  {localIsFollowLoading ? (
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">Follow</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="mb-2 sm:mb-3">
            <p
              className={cn(
                "text-gray-100 text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words",
                isVideoPost
                  ? "cursor-pointer hover:text-white transition-colors"
                  : "cursor-default"
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (!localPost.isPending && isVideoPost) {
                  // Save scroll position before navigating
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem(
                      "socialFeedScrollPosition",
                      window.scrollY.toString()
                    );
                  }
                  router.push(`/social-feed/post/${localPost.id}`);
                }
              }}
            >
              {localPost.caption}
            </p>
          </div>

          {/* ------------------- Media ------------------- */}
          {(localPost.images?.length || localPost.media_url) && (
            <div className="mb-2 sm:mb-3">
              {/* Single image */}
              {localPost.images?.length === 1 ? (
                <div
                  className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden border border-gray-800/50 shadow-lg cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenLightbox && localPost.images) {
                      onOpenLightbox(localPost.images, 0);
                    }
                  }}
                  style={{ maxHeight: "400px" }}
                >
                  <Image
                    src={localPost.images[0]}
                    alt="Post image"
                    width={1200}
                    height={675}
                    className="object-cover w-full h-auto pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
                </div>
              ) : /* Multiple images */
              localPost.images?.length ? (
                <div className="grid grid-cols-2 gap-0.5 rounded-xl sm:rounded-2xl overflow-hidden border border-gray-800/50 shadow-lg">
                  {localPost.images.map((img, i) => (
                    <div
                      key={i}
                      className="relative aspect-square cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenLightbox && localPost.images) {
                          onOpenLightbox(localPost.images, i);
                        }
                      }}
                    >
                      <Image
                        src={img}
                        alt={`Image ${i + 1}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
                    </div>
                  ))}
                </div>
              ) : /* Video */
              localPost.media_url ? (
                <div
                  className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden border border-gray-800/50 shadow-lg cursor-pointer group"
                  onClick={handleVideoClick}
                  style={{ maxHeight: "400px" }}
                >
                  <video
                    ref={videoRef}
                    src={localPost.media_url}
                    className="w-full h-auto object-cover"
                    loop
                    playsInline
                    preload="metadata"
                    onEnded={handleVideoEnded}
                    onError={handleVideoError}
                    onLoadedData={handleVideoLoaded}
                    onClick={handleVideoClick}
                  />

                  {/* Play/Pause overlay */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110"
                      onClick={handleVideoClick}
                    >
                      {isVideoPlaying ? (
                        <Pause className="w-6 h-6 text-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white ml-1" />
                      )}
                    </button>
                  </div>

                  {/* Loading */}
                  {!videoRef.current?.readyState && !videoError && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}

                  {/* Error */}
                  {videoError && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center flex-col gap-2">
                      <div className="text-white text-sm">
                        Failed to load video
                      </div>
                      <button
                        className="text-white text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoError(false);
                          videoRef.current?.load();
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* ------------------- Action bar ------------------- */}
          <div className="flex items-center justify-between mt-2 sm:mt-3 max-w-md">
            {/* Comments */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                handleOpenComments(e);
              }}
              className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 p-2 sm:p-2.5 h-auto rounded-full group transition-all duration-200"
              disabled={isPending}
            >
              <MessageCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform group-hover:scale-110" />
              <span className="text-xs sm:text-[13px] font-medium">
                {localPost.comment_count > 0 ? localPost.comment_count : ""}
              </span>
            </Button>

            {/* Share */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareClick}
              className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 p-2 sm:p-2.5 h-auto rounded-full group transition-all duration-200"
              disabled={isPending}
            >
              <Share2 className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform group-hover:scale-110" />
              <span className="text-xs sm:text-[13px]"></span>
            </Button>

            {/* Like */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1 sm:gap-2 hover:bg-pink-500/10 p-2 sm:p-2.5 h-auto rounded-full group transition-all duration-200",
                localPost.is_liked
                  ? "text-pink-500 hover:text-pink-400"
                  : "text-gray-400 hover:text-pink-500"
              )}
              disabled={isPending}
            >
              <Heart
                className={cn(
                  "w-4 h-4 sm:w-[18px] sm:h-[18px] transition-all duration-200",
                  localPost.is_liked && "fill-current scale-110"
                )}
              />
              <span className="text-xs sm:text-[13px] font-medium">
                {localPost.like_count > 0
                  ? localPost.like_count > 1000
                    ? `${(localPost.like_count / 1000).toFixed(1)}K`
                    : localPost.like_count
                  : ""}
              </span>
            </Button>

            {/* Views */}
            <Button
              variant="ghost"
              size="sm"
              onClick={stopPropagation}
              className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 p-2 sm:p-2.5 h-auto rounded-full group transition-all duration-200"
            >
              <Eye className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform group-hover:scale-110" />
              <span className="text-xs sm:text-[13px] font-medium">
                {localPost.view_count > 0
                  ? localPost.view_count > 1000
                    ? `${(localPost.view_count / 1000).toFixed(1)}M`
                    : localPost.view_count
                  : ""}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* ------------------- Share Modal ------------------- */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        postId={localPost.id}
        postTitle={localPost.caption.substring(0, 50) + "..."}
      />

      <CommentsModal
        key={`comments-${localPost.id}`}
        isOpen={isCommentsModalOpen}
        onClose={handleCloseComments}
        comments={comments}
        onCommentCreated={handleCommentCreated}
        isLoading={isLoadingComments}
        errorMessage={commentError ?? undefined}
        onReply={handleReplyCreated}
        onLikeComment={handleLikeComment}
        currentUserId={user?.id}
        currentUserAvatar={user?.avatar}
        currentUserName={
          user?.first_name || user?.username || user?.email?.split("@")[0]
        }
      />
    </div>
  );
}
