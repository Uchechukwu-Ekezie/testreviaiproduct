"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  author: { username: string; avatar?: string };
  content: string;
  like_count: number;
  created_at: string;
  replies: Comment[];
}

interface Props {
  postId: string;
  comments: Comment[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onSubmit: (content: string) => Promise<void>;
  currentUserAvatar?: string;
  postAuthorUsername?: string;
}

export default function CommentSection({
  postId,
  comments,
  hasMore,
  isLoading,
  onLoadMore,
  onSubmit,
  currentUserAvatar,
  postAuthorUsername,
}: Props) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    await onSubmit(content.trim());
    setContent("");
    setSending(false);
  };

  return (
    <div className="mt-2">
      {/* Input */}
      <div className="flex gap-3 py-4 border-t border-gray-800">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={currentUserAvatar || "/Image/profile.png"} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          {postAuthorUsername && (
            <p className="text-gray-500 text-[13px] mb-2">
              Replying to{" "}
              <span className="text-blue-500">@{postAuthorUsername}</span>
            </p>
          )}
          <div className="relative">
            <textarea
              ref={textareaRef}
              placeholder="Post your reply"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent border border-gray-800 rounded-lg text-white text-[15px] placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500 p-3 min-h-[44px]"
              rows={1}
              style={{
                height: "auto",
                maxHeight: "200px",
                overflowY: content.length > 100 ? "auto" : "hidden",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 200) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-600 text-[13px]">
              {content.length > 0 && `${content.length} / 280`}
            </span>
            <Button
              onClick={handleSubmit}
              disabled={sending || !content.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-full px-5 py-1.5 h-auto text-[14px] font-semibold"
            >
              {sending ? "Replying..." : "Reply"}
            </Button>
          </div>
        </div>
      </div>

      {/* Comments */}
      {isLoading ? (
        <div className="py-4 text-center">
          <p className="text-gray-500 text-sm">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-gray-500 text-sm">No replies yet</p>
        </div>
      ) : (
        <div>
          {comments.map((c) => (
            <div
              key={c.id}
              className="flex gap-3 py-3 border-t border-gray-800 hover:bg-gray-900/30 transition-colors"
            >
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={c.author.avatar} />
                <AvatarFallback>
                  {c.author.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap mb-0.5">
                  <span className="font-bold text-white text-[15px] hover:underline cursor-pointer">
                    {c.author.username}
                  </span>
                  <span className="text-gray-500 text-[15px]">
                    ·{" "}
                    {formatDistanceToNow(new Date(c.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-white text-[15px] leading-normal whitespace-pre-wrap break-words">
                  {c.content}
                </p>
                <div className="flex items-center gap-6 mt-2">
                  <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 p-1.5 rounded-full transition-colors group">
                    <MessageCircle className="w-[15px] h-[15px]" />
                  </button>
                  <button className="flex items-center gap-1 text-gray-500 hover:text-pink-600 hover:bg-pink-600/10 p-1.5 rounded-full transition-colors group">
                    <Heart className="w-[15px] h-[15px]" />
                    {c.like_count > 0 && (
                      <span className="text-[13px]">{c.like_count}</span>
                    )}
                  </button>
                </div>

                {/* Replies */}
                {c.replies?.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {c.replies.map((r) => (
                      <div
                        key={r.id}
                        className="flex gap-3 pl-4 border-l-2 border-gray-800"
                      >
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={r.author.avatar} />
                          <AvatarFallback>
                            {r.author.username[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <span className="font-bold text-white text-[14px]">
                            {r.author.username}
                          </span>
                          <p className="text-white text-[14px] mt-0.5">
                            {r.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="mt-4 text-sm text-blue-400 hover:text-blue-300"
        >
          {isLoading ? "Loading..." : "Load more comments"}
        </button>
      )}
    </div>
  );
}
