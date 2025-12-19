"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { usePosts } from "@/hooks/usePosts";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Eye, ArrowLeft, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import Image from "next/image";
import ShareModal from "./ShareModal";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

interface PostDetailProps {
  postId: string;
  isTikTokView?: boolean;
  onNavigate?: (direction: "prev" | "next") => void;
}

/* -------------------------- Skeleton Loader -------------------------- */
const PostSkeletonLoader = memo(() => (
  <div className="bg-card rounded-2xl p-6 shadow-md border border-border animate-pulse w-full h-full">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 rounded-full bg-gray-700"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-1/6"></div>
      </div>
    </div>
    <div className="space-y-3 mb-4">
      <div className="h-4 bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
    </div>
    <div className="h-64 bg-gray-700 rounded-lg mb-4"></div>
    <div className="flex justify-between">
      <div className="h-8 bg-gray-700 rounded w-20"></div>
      <div className="h-8 bg-gray-700 rounded w-20"></div>
      <div className="h-8 bg-gray-700 rounded w-20"></div>
    </div>
  </div>
));
PostSkeletonLoader.displayName = "PostSkeletonLoader";

/* -------------------------- Media Gallery -------------------------- */
const MediaGallery = memo(({ images, mediaUrl, currentMediaIndex, onMediaChange }: {
  images?: string[];
  mediaUrl?: string;
  currentMediaIndex: number;
  onMediaChange: (index: number) => void;
}) => {
  const totalMedia = images?.length || (mediaUrl ? 1 : 0);
  if (totalMedia === 0) return null;

  const handlePrev = () => {
    onMediaChange(currentMediaIndex > 0 ? currentMediaIndex - 1 : totalMedia - 1);
  };
  const handleNext = () => {
    onMediaChange(currentMediaIndex < totalMedia - 1 ? currentMediaIndex + 1 : 0);
  };

  return (
    <div className="relative w-full h-full group">
      {images && images.length > 0 ? (
        <div className="relative w-full h-full">
          <Image
            src={images[currentMediaIndex]}
            alt={`Media ${currentMediaIndex + 1}`}
            fill
            className="object-contain"
            priority={currentMediaIndex === 0}
            onError={(e) => console.error("[MediaGallery] Image load error:", images[currentMediaIndex])}
          />
        </div>
      ) : mediaUrl ? (
        <div className="relative w-full h-full">
          <video
            src={mediaUrl}
            className="w-full h-full object-contain"
            controls
            autoPlay
            muted
            loop
            playsInline
            onError={(e) => console.error("[MediaGallery] Video load error:", mediaUrl)}
          />
        </div>
      ) : null}

      {totalMedia > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            aria-label="Previous media"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            aria-label="Next media"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {Array.from({ length: totalMedia }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => onMediaChange(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === currentMediaIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/75"
                )}
                aria-label={`Go to media ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
});
MediaGallery.displayName = "MediaGallery";

/* -------------------------- Action Button -------------------------- */
const ActionButton = memo(({ 
  icon: Icon, 
  count, 
  onClick, 
  active, 
  activeColor, 
  hoverColor,
  label 
}: {
  icon: any;
  count: number;
  onClick?: () => void;
  active?: boolean;
  activeColor?: string;
  hoverColor?: string;
  label: string;
}) => {
  const formatCount = (num: number) => {
    if (num > 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num > 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 text-sm hover:bg-transparent p-0",
        active ? activeColor : `text-gray-400 ${hoverColor}`
      )}
      aria-label={label}
    >
      <Icon className={cn("w-5 h-5", active && "fill-current")} />
      <span>{formatCount(count)}</span>
    </Button>
  );
});
ActionButton.displayName = "ActionButton";

/* -------------------------- Comment Item -------------------------- */
const CommentItem = memo(({ comment }: { comment: any }) => {
  return (
    <div className="flex gap-3 py-3 border-b border-gray-700/50 last:border-0">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={comment.author.avatar} />
        <AvatarFallback className="bg-gray-700 text-xs">
          {comment.author.username?.[0]?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-100">{comment.author.username}</p>
        <p className="text-sm text-gray-300 mt-0.5">{comment.content}</p>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(comment.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
});
CommentItem.displayName = "CommentItem";

/* -------------------------- Main Component -------------------------- */
export default function PostDetail({ postId, isTikTokView = false, onNavigate }: PostDetailProps) {
  const router = useRouter();
  const {
    posts,
    viewPost,
    likePost,
    isAuthenticated,
    fetchPostById,
    fetchComments,
    createComment,
    commentsCache,
  } = usePosts();

  const [post, setPost] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [hasViewedPost, setHasViewedPost] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Comment Section State
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);

  // Load post
  useEffect(() => {
    const loadPost = async () => {
      setIsLoading(true);
      setError(null);
      setCurrentMediaIndex(0);

      const cached = posts.find(p => p.id === postId);
      if (cached) {
        setPost(cached);
        setIsLoading(false);
        return;
      }

      const fetched = await fetchPostById(postId);
      if (fetched) setPost(fetched);
      else setError("Post not found");
      setIsLoading(false);
    };
    loadPost();
  }, [postId, posts, fetchPostById]);

  // View count
  useEffect(() => {
    if (post && !hasViewedPost && !isLoading) {
      viewPost(postId);
      setHasViewedPost(true);
    }
  }, [post, postId, viewPost, hasViewedPost, isLoading]);

  // Sync cache
  useEffect(() => {
    if (post) {
      const updated = posts.find(p => p.id === postId);
      if (updated) setPost(updated);
    }
  }, [posts, postId]);

  // Load comments when section opens
  useEffect(() => {
    if (showComments && post && !commentsCache?.[postId]) {
      fetchComments(postId);
    }
  }, [showComments, post, postId, fetchComments, commentsCache]);

  const handleLike = useCallback(async () => {
    if (!isAuthenticated) return toast.error("Please log in to like");
    if (post) await likePost(postId, post.is_liked ? "unlike" : "like");
  }, [isAuthenticated, post, postId, likePost]);

  const handleShare = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);

  const handleMediaChange = useCallback((index: number) => {
    setCurrentMediaIndex(index);
  }, []);

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !isAuthenticated) return;
    setSending(true);
    await createComment(postId, newComment);
    setNewComment("");
    setSending(false);
  };

  const handlers = useSwipeable({
    onSwipedUp: () => onNavigate?.("next"),
    onSwipedDown: () => onNavigate?.("prev"),
    trackMouse: true,
    delta: 50,
    preventScrollOnSwipe: true,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-b from-[#121212] to-[#1a1a1a] items-center justify-center">
        <div className={cn(isTikTokView ? "w-full max-w-2xl mx-auto" : "w-full")}>
          <PostSkeletonLoader />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex h-screen bg-gradient-to-b from-[#121212] to-[#1a1a1a] items-center justify-center">
        <div className="flex flex-col gap-4 items-center">
          <p className="text-red-500">{error || "Post not found"}</p>
          {!isTikTokView && (
            <Button
              variant="outline"
              onClick={() => router.push("/social-feed")}
              className="text-gray-100 border-gray-600/50 hover:bg-gray-700/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Feed
            </Button>
          )}
        </div>
      </div>
    );
  }

  const hasMedia = (post.images && post.images.length > 0) || post.media_url;
  const commentsData = commentsCache?.[postId] || { results: [] };
  const comments = commentsData.results.map((c: any) => ({
    id: c.id,
    author: { username: c.author.username, avatar: c.author.avatar },
    content: c.content,
    created_at: c.created_at,
  }));

  // TikTok View
  if (isTikTokView && hasMedia) {
    return (
      <div
        {...handlers}
        className="h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#121212] to-[#1a1a1a] relative snap-start"
      >
        <div className="w-full max-w-2xl h-full flex flex-col relative">
          <div className="flex-1 relative">
            <MediaGallery
              images={post.images}
              mediaUrl={post.media_url}
              currentMediaIndex={currentMediaIndex}
              onMediaChange={handleMediaChange}
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="w-12 h-12 ring-2 ring-white/20">
                  <AvatarImage src={post.author.avatar || "/Image/profile.png"} />
                  <AvatarFallback className="bg-gray-600 text-gray-100">
                    {post.author.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-base">{post.author.username}</h3>
                  <p className="text-xs text-gray-300">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/30 hover:bg-white/20 rounded-full px-4 py-1 text-sm font-semibold backdrop-blur-sm"
              >
                Follow
              </Button>
            </div>
            
            <p className="text-white text-base mb-4 line-clamp-3 leading-relaxed">
              {post.caption}
            </p>
            
            <div className="flex items-center gap-6">
              <ActionButton
                icon={Heart}
                count={post.like_count}
                onClick={handleLike}
                active={post.is_liked}
                activeColor="text-red-500 hover:text-red-400"
                hoverColor="hover:text-red-500"
                label={post.is_liked ? "Unlike post" : "Like post"}
              />
              <ActionButton
                icon={MessageCircle}
                count={post.comment_count}
                onClick={() => setShowComments(true)}
                hoverColor="hover:text-blue-400"
                label="View comments"
              />
              <ActionButton
                icon={Share2}
                count={0}
                onClick={handleShare}
                hoverColor="hover:text-green-400"
                label="Share post"
              />
              <ActionButton
                icon={Eye}
                count={post.view_count}
                hoverColor="hover:text-purple-400"
                label="View count"
              />
            </div>
          </div>
        </div>

        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          postId={postId}
          postTitle={post.caption.substring(0, 50) + "..."}
        />
      </div>
    );
  }

  // Standard View
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#121212] to-[#1a1a1a] py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push("/social-feed")}
          className="mb-4 text-gray-100 hover:bg-gray-700/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feed
        </Button>
        
        <Card className="bg-transparent rounded-lg overflow-hidden border border-gray-700/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={post.author.avatar || "/Image/profile.png"} />
                  <AvatarFallback className="bg-gray-600 text-gray-100">
                    {post.author.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-gray-100">{post.author.username}</h3>
                  <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-gray-100 border-gray-600/50 hover:bg-gray-700/50 rounded-lg px-3 py-1 text-xs font-medium"
              >
                Follow
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="mb-4">
              <p className="text-gray-100 mb-3 leading-relaxed whitespace-pre-line">{post.caption}</p>
            </div>
            
            {hasMedia && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <div className="relative aspect-[16/9]">
                  <MediaGallery
                    images={post.images}
                    mediaUrl={post.media_url}
                    currentMediaIndex={currentMediaIndex}
                    onMediaChange={handleMediaChange}
                  />
                </div>
              </div>
            )}
            
            <div className="pt-2 px-4">
              <div className="flex items-center justify-around">
                <ActionButton
                  icon={Heart}
                  count={post.like_count}
                  onClick={handleLike}
                  active={post.is_liked}
                  activeColor="text-red-400 hover:text-red-300"
                  hoverColor="hover:text-red-400"
                  label={post.is_liked ? "Unlike post" : "Like post"}
                />
                <ActionButton
                  icon={MessageCircle}
                  count={post.comment_count}
                  onClick={() => setShowComments(true)}
                  hoverColor="hover:text-blue-400"
                  label="View comments"
                />
                <ActionButton
                  icon={Share2}
                  count={0}
                  onClick={handleShare}
                  hoverColor="hover:text-green-400"
                  label="Share post"
                />
                <ActionButton
                  icon={Eye}
                  count={post.view_count}
                  hoverColor="hover:text-blue-400"
                  label="View count"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ------------------- COMMENT SECTION (Hidden by default) ------------------- */}
        {showComments && (
          <Card className="mt-6 bg-gray-900/50 border border-gray-700/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-100">
                  Comments {post.comment_count > 0 && `(${post.comment_count})`}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(false)}
                  className="text-gray-400 hover:text-gray-100"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Comment Input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit()}
                  className="flex-1 bg-gray-800 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  size="sm"
                  onClick={handleCommentSubmit}
                  disabled={sending || !newComment.trim()}
                  className="px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-500 py-6">No comments yet. Be the first!</p>
                ) : (
                  comments.map((c: any) => <CommentItem key={c.id} comment={c} />)
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          postId={postId}
          postTitle={post.caption.substring(0, 50) + "..."}
        />
      </div>
    </div>
  );
}