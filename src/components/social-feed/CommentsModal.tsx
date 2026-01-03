"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MoreHorizontal, BadgeCheck } from "lucide-react";
import type { Comment as CommentType } from "@/hooks/usePosts";
import { followAPI } from "@/lib/api/follow.api";

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: CommentType[];
  mode?: "overlay" | "inline";
  onCommentCreated: (content: string) => Promise<any>;
  isLoading?: boolean;
  errorMessage?: string;
  onReply?: (parentId: string, content: string) => Promise<any>;
  onLikeComment?: (commentId: string, isLiked: boolean) => Promise<any>;
  onDeleteComment?: (commentId: string) => Promise<any>;
  currentUserId?: string;
  currentUserAvatar?: string | null;
  currentUserName?: string;
}

export default function CommentsModal({
  isOpen,
  onClose,
  comments,
  mode = "overlay",
  onCommentCreated,
  isLoading = false,
  errorMessage,
  onReply,
  onLikeComment,
  onDeleteComment,
  currentUserId,
  currentUserAvatar,
  currentUserName,
}: CommentsModalProps) {
  const router = useRouter();
  const [internalLoading, setInternalLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingToUser, setReplyingToUser] = useState<{
    name: string;
    id: string;
    username?: string | null;
  } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [likingComments, setLikingComments] = useState<Set<string>>(new Set());
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  );
  
  // Cache for fetched author data
  const [authorCache, setAuthorCache] = useState<Record<string, CommentType["author"]>>({});
  
  // State to store comments with fetched author data
  const [commentsWithAuthors, setCommentsWithAuthors] = useState<CommentType[]>(comments);

  // Mobile input focus fix
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      // Prevent touch events from interfering with inputs
      const handleTouchStart = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          e.stopImmediatePropagation();
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          e.stopImmediatePropagation();
        }
      };

      // Add higher priority event listeners
      document.addEventListener("touchstart", handleTouchStart, {
        passive: false,
        capture: true,
      });
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
        capture: true,
      });

      // Auto-focus input on mobile after modal opens
      if (window.innerWidth <= 768) {
        const timer = setTimeout(() => {
          const input = document.querySelector(
            '[data-comments-modal="true"] input[type="text"]'
          ) as HTMLInputElement;
          if (input) {
            input.focus();
            input.click();
          }
        }, 500);

        return () => {
          clearTimeout(timer);
          document.removeEventListener("touchstart", handleTouchStart, true);
          document.removeEventListener("touchmove", handleTouchMove, true);
        };
      }

      return () => {
        document.removeEventListener("touchstart", handleTouchStart, true);
        document.removeEventListener("touchmove", handleTouchMove, true);
      };
    }
  }, [isOpen]);
  const [deletingComments, setDeletingComments] = useState<Set<string>>(
    new Set()
  );

  const isSubmitting = internalLoading;
  useEffect(() => {
    if (!isOpen) {
      setReplyingToUser(null);
      setReplyText("");
      setNewCommentText("");
      setInternalLoading(false);
      setLikingComments(new Set());
      setExpandedReplies(new Set());
    }
  }, [isOpen]);

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!onLikeComment || likingComments.has(commentId)) return;

    setLikingComments((prev) => new Set(prev).add(commentId));
    try {
      await onLikeComment(commentId, isLiked);
    } catch (error) {
      console.error("Failed to like comment:", error);
    } finally {
      setLikingComments((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!onDeleteComment || deletingComments.has(commentId)) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this comment?"
    );
    if (!confirmDelete) return;

    setDeletingComments((prev) => new Set(prev).add(commentId));
    try {
      await onDeleteComment(commentId);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    } finally {
      setDeletingComments((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  // Fetch author data by ID
  const fetchAuthorData = useCallback(async (authorId: string): Promise<CommentType["author"] | null> => {
    // Check cache first
    if (authorCache[authorId]) {
      return authorCache[authorId];
    }

    try {
      const stats = await followAPI.getUserFollowStats(authorId);
      const author: CommentType["author"] = {
        id: stats.id,
        username: stats.username || undefined,
        email: stats.email || undefined,
        first_name: stats.first_name || undefined,
        last_name: stats.last_name || undefined,
        avatar: stats.avatar || undefined,
        type: undefined, // Type not available from follow stats
      };
      
      // Cache the author data
      setAuthorCache(prev => ({ ...prev, [authorId]: author }));
      return author;
    } catch (error) {
      console.error(`Failed to fetch author data for ${authorId}:`, error);
      return null;
    }
  }, [authorCache]);

  // Fetch missing author data for comments
  useEffect(() => {
    const fetchMissingAuthors = async () => {
      const authorIdsToFetch: string[] = [];
      const currentCache = { ...authorCache };

      // Collect all comments and replies that need author data
      const collectComments = (commentList: CommentType[]) => {
        commentList.forEach((comment) => {
          // Check if author data is missing
          const authorId = comment.author_id;
          if (!authorId) return;
          
          const needsFetch = 
            (!comment.author?.username && !comment.author?.avatar) &&
            !currentCache[authorId];

          if (needsFetch && !authorIdsToFetch.includes(authorId)) {
            authorIdsToFetch.push(authorId);
          }

          // Process replies recursively
          if (comment.replies && comment.replies.length > 0) {
            collectComments(comment.replies);
          }
        });
      };

      collectComments(comments);

      // Fetch author data for all missing authors
      if (authorIdsToFetch.length > 0) {
        const fetchPromises = authorIdsToFetch.map(async (authorId) => {
          try {
            const stats = await followAPI.getUserFollowStats(authorId);
            const author: CommentType["author"] = {
              id: stats.id,
              username: stats.username || undefined,
              email: stats.email || undefined,
              first_name: stats.first_name || undefined,
              last_name: stats.last_name || undefined,
              avatar: stats.avatar || undefined,
              type: undefined,
            };
            currentCache[authorId] = author;
            return { authorId, author };
          } catch (error) {
            console.error(`Failed to fetch author data for ${authorId}:`, error);
            return null;
          }
        });

        const results = await Promise.all(fetchPromises);
        
        // Update cache with all fetched authors
        const newCache = { ...currentCache };
        results.forEach((result) => {
          if (result) {
            newCache[result.authorId] = result.author;
          }
        });
        setAuthorCache(newCache);

        // Update comments with fetched author data
        const updateCommentAuthor = (comment: CommentType): CommentType => {
          const updatedComment = { ...comment };
          
          if (comment.author_id && newCache[comment.author_id]) {
            updatedComment.author = {
              ...comment.author,
              ...newCache[comment.author_id],
            };
          }

          // Recursively update replies
          if (comment.replies && comment.replies.length > 0) {
            updatedComment.replies = comment.replies.map(updateCommentAuthor);
          }

          return updatedComment;
        };

        const updatedComments = comments.map(updateCommentAuthor);
        setCommentsWithAuthors(updatedComments);
      } else {
        // No missing authors, just set comments as-is
        setCommentsWithAuthors(comments);
      }
    };

    if (comments.length > 0) {
      fetchMissingAuthors();
    } else {
      setCommentsWithAuthors(comments);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments]);

  // Helper function to get author with fallback to fetching
  const getAuthorWithFallback = useCallback(async (comment: CommentType): Promise<CommentType["author"] | null> => {
    // If author already has username/avatar, return it
    if (comment.author && (comment.author.username || comment.author.avatar)) {
      return comment.author;
    }

    // If we have author_id but no author data, fetch it
    if (comment.author_id && !comment.author?.username && !comment.author?.avatar) {
      const fetchedAuthor = await fetchAuthorData(comment.author_id);
      return fetchedAuthor || comment.author || null;
    }

    return comment.author || null;
  }, [fetchAuthorData]);

  if (!isOpen) return null;

  const handleReplyToUser = (
    userName: string,
    userId: string,
    username?: string | null
  ) => {
    setReplyingToUser({ name: userName, id: userId, username });
    setReplyText("");
  };

  const handleReplySubmit = async () => {
    const payload = replyText.trim();
    if (payload && replyingToUser) {
      setInternalLoading(true);
      try {
        if (onReply) {
          await onReply(replyingToUser.id, payload);
        }
        setReplyText("");
        setReplyingToUser(null);
      } catch (error) {
        console.error("Failed to submit reply:", error);
      } finally {
        setInternalLoading(false);
      }
    }
  };

  const handleNewCommentSubmit = async () => {
    if (!newCommentText.trim()) return;

    setInternalLoading(true);
    try {
      await onCommentCreated(newCommentText);
      setNewCommentText("");
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setInternalLoading(false);
    }
  };

  // Helper functions
  const getAuthorDisplayName = (author: CommentType["author"] | null) => {
    if (!author) return "Unknown";
    const fullName = `${author.first_name ?? ""} ${
      author.last_name ?? ""
    }`.trim();
    if (fullName) return fullName;
    if (author.username) return author.username;
    if (author.email) return author.email.split("@")[0];
    return "Unknown";
  };

  const getAuthorHandle = (author: CommentType["author"] | null) => {
    if (!author) return null;
    if (author.username) return author.username;
    if (author.email) return author.email.split("@")[0];
    return null;
  };

  const handleUserClick = (userId: string) => {
    router.push(`/social-feed/user/${userId}`);
    if (mode === "overlay") {
      onClose();
    }
  };

  const renderCommentThread = (comment: CommentType, depth: number = 0) => {
    const marginLeft = depth > 0 ? "ml-10" : "";
    const paddingLeft = depth > 0 ? "pl-6 border-l border-gray-700/60" : "";
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedReplies.has(comment.id);
    const isPending = comment.isPending; // Check if comment is pending

    return (
      <div
        key={comment.id}
        className={`${marginLeft} ${paddingLeft} space-y-3 ${isPending ? 'opacity-50 animate-pulse' : ''}`}
      >
        <div className="flex gap-3 items-start">
          <button
            onClick={() => comment.author && handleUserClick(comment.author.id)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Avatar className={depth === 0 ? "w-[30px] h-[30px]" : "w-6 h-6"}>
              <AvatarImage src={comment.author?.avatar} />
              <AvatarFallback className="bg-gray-600 text-white text-xs">
                {comment.author ? (getAuthorDisplayName(comment.author)[0]?.toUpperCase() || "?") : "?"}
              </AvatarFallback>
            </Avatar>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <button
                onClick={() => comment.author && handleUserClick(comment.author.id)}
                className={`font-medium text-white ${
                  depth === 0 ? "text-sm" : "text-xs"
                } flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity`}
              >
                {comment.author ? getAuthorDisplayName(comment.author) : "Unknown"}
                {comment.author?.type === "agent" && (
                  <BadgeCheck className="w-4 h-4 text-white fill-blue-500" />
                )}
              </button>
              {comment.author && getAuthorHandle(comment.author) && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <button
                    onClick={() => comment.author && handleUserClick(comment.author.id)}
                    className="text-xs text-gray-400 hover:text-gray-300 cursor-pointer transition-colors"
                  >
                    @{getAuthorHandle(comment.author)}
                  </button>
                </>
              )}
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-400">
                {isPending ? 'Sending...' : new Date(comment.created_at).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p
              className={`${
                depth === 0 ? "text-[14px]" : "text-xs"
              } font-medium text-[#C2C2C2] mb-2 leading-relaxed`}
            >
              {comment.content}
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleLikeComment(comment.id, comment.is_liked || false);
                }}
                disabled={likingComments.has(comment.id)}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                <Heart
                  className={`${depth === 0 ? "w-4 h-4" : "w-3 h-3"} ${
                    comment.is_liked
                      ? "text-red-500 fill-red-500"
                      : "text-white"
                  }`}
                />
                <span className="text-xs text-white">{comment.like_count}</span>
              </button>
              <button
                className="text-xs text-white cursor-pointer hover:text-gray-300"
                onClick={() =>
                  comment.author && handleReplyToUser(
                    getAuthorDisplayName(comment.author),
                    comment.id,
                    getAuthorHandle(comment.author)
                  )
                }
              >
                Reply
              </button>
              {currentUserId && comment.author && currentUserId === comment.author.id && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  disabled={deletingComments.has(comment.id)}
                  className="text-xs text-red-500 hover:text-red-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingComments.has(comment.id) ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
            {hasReplies && (
              <>
                <button
                  onClick={() => {
                    setExpandedReplies((prev) => {
                      const next = new Set(prev);
                      if (next.has(comment.id)) {
                        next.delete(comment.id);
                      } else {
                        next.add(comment.id);
                      }
                      return next;
                    });
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer mt-2 transition-colors"
                >
                  {isExpanded
                    ? `Hide ${comment.replies?.length || 0} ${
                        (comment.replies?.length || 0) === 1 ? "reply" : "replies"
                      }`
                    : `View ${comment.replies?.length || 0} ${
                        (comment.replies?.length || 0) === 1 ? "reply" : "replies"
                      }`}
                </button>
                {isExpanded && comment.replies && (
                  <div className="mt-4 space-y-4">
                    {comment.replies.map((reply) =>
                      renderCommentThread(reply, depth + 1)
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
      // Also stop immediate propagation to prevent any parent handlers
      e.nativeEvent.stopImmediatePropagation();
    }
    // Call onClose - parent will handle event prevention
    onClose();
  };

  const modalContent = (
    <div
      data-comments-modal="true"
      className={
        mode === "inline"
          ? "w-[450px] h-[80vh] bg-background shadow-2xl rounded-[20px] flex flex-col"
          : "fixed inset-0 z-[9999] flex items-end sm:items-center justify-center lg:justify-end"
      }
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      onTouchMove={(e) => {
        e.stopPropagation();
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
      }}
    >
      {mode === "overlay" && (
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        />
      )}
      <div
        className={
          mode === "inline"
            ? "flex flex-col h-full"
            : "relative w-full sm:w-[450px] h-[80vh] bg-background shadow-2xl transform transition-transform duration-300 ease-in-out rounded-t-[20px] sm:rounded-[20px] lg:rounded-l-[20px] lg:rounded-r-none lg:mr-0 lg:ml-auto flex flex-col"
        }
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">Comment</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:bg-gray-700 p-1"
          >
            <span className="text-xl">×</span>
          </Button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 gap-8">
          {isLoading && comments.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Loading comments…
            </div>
          ) : comments.length === 0 || !Array.isArray(comments) ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No comments yet.
            </div>
          ) : (
            commentsWithAuthors.map((comment) => renderCommentThread(comment))
          )}
        </div>

        {/* Input */}
        <div
          className="p-4 border-gray-700 flex-shrink-0 space-y-3"
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
        >
          {replyingToUser ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Replying to</span>
                <span className="text-blue-400">@{replyingToUser.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReplyingToUser(null)}
                  className="text-gray-400 hover:text-white p-0 h-auto text-xs"
                >
                  ×
                </Button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Reply to @${replyingToUser.name}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleReplySubmit();
                    }
                  }}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  autoComplete="off"
                  autoCapitalize="sentences"
                  autoCorrect="on"
                  spellCheck="true"
                  inputMode="text"
                  className="w-full pl-12 pr-16 py-2 bg-transparent border border-[#2E2E2E] rounded-[20px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-white placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation"
                  disabled={isSubmitting}
                />
                <Avatar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-6 h-6">
                  <AvatarImage src={currentUserAvatar || undefined} />
                  <AvatarFallback className="bg-gray-600 text-white text-xs">
                    {currentUserName?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  onClick={handleReplySubmit}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-6"
                  disabled={isSubmitting || replyText.trim().length === 0}
                >
                  Reply
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleNewCommentSubmit();
                  }
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onFocus={(e) => {
                  e.stopPropagation();
                  // Ensure mobile keyboard shows and input is visible
                  if (
                    typeof window !== "undefined" &&
                    window.innerWidth <= 768
                  ) {
                    setTimeout(() => {
                      e.target.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }, 300);
                  }
                }}
                autoComplete="off"
                autoCapitalize="sentences"
                autoCorrect="on"
                spellCheck="true"
                inputMode="text"
                className="w-full pl-12 pr-16 py-2 bg-transparent border border-[#2E2E2E] rounded-[20px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-white placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation"
                disabled={isSubmitting}
              />
              <Avatar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-6 h-6">
                <AvatarImage src={currentUserAvatar || undefined} />
                <AvatarFallback className="bg-gray-600 text-white text-xs">
                  {currentUserName?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                onClick={handleNewCommentSubmit}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-6"
                disabled={isSubmitting || newCommentText.trim().length === 0}
              >
                Send
              </Button>
            </div>
          )}
          {errorMessage && (
            <p className="text-xs text-red-400">{errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );

  return mode === "inline" ? modalContent : <>{modalContent}</>;
}
