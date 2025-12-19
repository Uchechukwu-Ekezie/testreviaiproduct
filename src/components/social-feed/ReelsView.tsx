"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Eye,
  Play,
  Pause,
} from "lucide-react";
import Image from "next/image";
import CommentsModal from "@/components/social-feed/CommentsModal";
import ShareModal from "@/components/social-feed/ShareModal";

interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    verified: boolean;
    role: string;
  };
  content: string;
  images?: string[];
  videos?: string[];
  location?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  tags: string[];
  type: "property" | "review" | "general" | "question";
  mediaType: "image" | "video";
}

interface Comment {
  id: number;
  author: {
    name: string;
    avatar: string;
    initials: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  replies: any[];
}

// Extended mock data for continuous scrolling
const mockPosts: Post[] = [
  {
    id: "1",
    author: {
      name: "Victory Paul",
      avatar: "/Image/boy.png",
      verified: true,
      role: "Real Estate Agent",
    },
    content:
      "✨ Modern 3-Bedroom Apartment in Lekki Available!\n\nSpacious living room, en-suite bedrooms, fully fitted kitchen, and secure parking. Perfect for family living or investment. Book a viewing today!",
    images: ["/Image/house.png"],
    videos: [],
    location: "Lekki, Lagos",
    timestamp: "10h",
    likes: 1700,
    comments: 292,
    shares: 192,
    isLiked: true,
    tags: ["#apartment", "#lekki", "#3bedroom"],
    type: "property",
    mediaType: "image",
  },
  {
    id: "2",
    author: {
      name: "Sarah Johnson",
      avatar: "/Image/girl.png",
      verified: true,
      role: "Property Developer",
    },
    content:
      "🏠 Virtual tour of this stunning penthouse! Check out the amazing city views and modern amenities. Perfect for luxury living in the heart of Lagos.",
    images: [],
    videos: ["/videos/penthouse-tour.mp4"],
    location: "Victoria Island, Lagos",
    timestamp: "2h",
    likes: 850,
    comments: 156,
    shares: 89,
    isLiked: false,
    tags: ["#penthouse", "#luxury", "#virtualtour"],
    type: "property",
    mediaType: "video",
  },
  {
    id: "3",
    author: {
      name: "Michael Chen",
      avatar: "/Image/man.png",
      verified: false,
      role: "Property Investor",
    },
    content:
      "🏡 Just closed on this beautiful duplex! The architecture is amazing and the neighborhood is perfect for families. Can't wait to move in!",
    images: ["/Image/house.jpeg"],
    videos: [],
    location: "Ikoyi, Lagos",
    timestamp: "5h",
    likes: 1200,
    comments: 89,
    shares: 45,
    isLiked: false,
    tags: ["#duplex", "#ikoyi", "#family"],
    type: "property",
    mediaType: "image",
  },
  {
    id: "4",
    author: {
      name: "Emily Rodriguez",
      avatar: "/Image/girl.png",
      verified: true,
      role: "Interior Designer",
    },
    content:
      "🎨 Before and after transformation of this living room! Sometimes all you need is the right furniture and color scheme to make a space come alive.",
    images: ["/Image/house.png"],
    videos: [],
    location: "Surulere, Lagos",
    timestamp: "1d",
    likes: 2100,
    comments: 340,
    shares: 180,
    isLiked: true,
    tags: ["#interior", "#transformation", "#design"],
    type: "general",
    mediaType: "image",
  },
  {
    id: "5",
    author: {
      name: "David Johnson",
      avatar: "/Image/boy.png",
      verified: false,
      role: "Real Estate Agent",
    },
    content:
      "📱 Quick tour of this modern studio apartment. Perfect for young professionals who want to live in the heart of the city!",
    images: [],
    videos: ["/videos/studio-tour.mp4"],
    location: "Yaba, Lagos",
    timestamp: "3h",
    likes: 650,
    comments: 120,
    shares: 67,
    isLiked: false,
    tags: ["#studio", "#yaba", "#modern"],
    type: "property",
    mediaType: "video",
  },
  {
    id: "6",
    author: {
      name: "Lisa Wang",
      avatar: "/Image/girl.png",
      verified: true,
      role: "Property Manager",
    },
    content:
      "🌟 Amazing sunset view from this penthouse balcony! This is why I love working in real estate - helping people find their dream homes with views like this.",
    images: ["/Image/house.jpeg"],
    videos: [],
    location: "Banana Island, Lagos",
    timestamp: "6h",
    likes: 1800,
    comments: 250,
    shares: 95,
    isLiked: true,
    tags: ["#penthouse", "#sunset", "#bananaisland"],
    type: "property",
    mediaType: "image",
  },
];

interface ReelsViewProps {
  initialPostId?: string;
}

export default function ReelsView({ initialPostId }: ReelsViewProps) {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState<{
    [key: string]: boolean;
  }>({});
  const [isTextExpanded, setIsTextExpanded] = useState<{
    [key: string]: boolean;
  }>({});
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Mock comments data with nested replies
  const comments: Comment[] = [
    {
      id: 1,
      author: {
        name: "Sarah Adigwe",
        avatar: "/Image/girl.png",
        initials: "SA",
      },
      content: "I love the bedroom, would love to see more",
      timestamp: "10h",
      likes: 199,
      replies: [],
    },
    {
      id: 2,
      author: {
        name: "Mike Chen",
        avatar: "/Image/boy.png",
        initials: "MC",
      },
      content: "This looks amazing! How much is the rent?",
      timestamp: "8h",
      likes: 45,
      replies: [],
    },
    {
      id: 3,
      author: {
        name: "Emily Rodriguez",
        avatar: "/Image/girl.png",
        initials: "ER",
      },
      content: "The kitchen is so spacious! Perfect for cooking.",
      timestamp: "6h",
      likes: 78,
      replies: [],
    },
    {
      id: 4,
      author: {
        name: "David Johnson",
        avatar: "/Image/man.png",
        initials: "DJ",
      },
      content: "Is this property still available? I'm very interested.",
      timestamp: "4h",
      likes: 23,
      replies: [],
    },
    {
      id: 5,
      author: {
        name: "Lisa Wang",
        avatar: "/Image/girl.png",
        initials: "LW",
      },
      content: "The lighting in this room is perfect for photos!",
      timestamp: "3h",
      likes: 67,
      replies: [],
    },
  ];

  // Initialize with specific post if provided
  useEffect(() => {
    if (initialPostId) {
      const index = posts.findIndex((post) => post.id === initialPostId);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [initialPostId, posts]);

  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
        const scrollTop = container.scrollTop;
        const itemHeight = container.clientHeight;
        const newIndex = Math.round(scrollTop / itemHeight);

        if (
          newIndex !== currentIndex &&
          newIndex >= 0 &&
          newIndex < posts.length
        ) {
          setCurrentIndex(newIndex);
          // Pause all videos when scrolling
          setIsVideoPlaying({});
        }
      }, 150);
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [currentIndex, posts.length]);

  // Auto-scroll to current index
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isScrolling) return;

    const itemHeight = container.clientHeight;
    container.scrollTo({
      top: currentIndex * itemHeight,
      behavior: "smooth",
    });
  }, [currentIndex, isScrolling]);

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const handleShare = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, shares: post.shares + 1 } : post
      )
    );
    setSelectedPostId(postId);
    setIsShareModalOpen(true);
  };

  const toggleVideoPlay = (postId: string) => {
    setIsVideoPlaying((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const toggleTextExpansion = (postId: string) => {
    setIsTextExpanded((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const toggleCommentsModal = (postId: string) => {
    setSelectedPostId(postId);
    setIsCommentsModalOpen(!isCommentsModalOpen);
  };

  const currentPost = posts[currentIndex];

  if (!currentPost) {
    return (
      <div className="flex h-screen bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white">No posts available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Main Reels Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-hide"
          style={{ scrollBehavior: "smooth" }}
        >
          {posts.map((post, index) => {
            const hasMedia =
              (post.images && post.images.length > 0) ||
              (post.videos && post.videos.length > 0);
            const mediaUrl =
              post.mediaType === "image" ? post.images?.[0] : post.videos?.[0];
            const isCurrentVideoPlaying = isVideoPlaying[post.id] || false;
            const isCurrentTextExpanded = isTextExpanded[post.id] || false;

            return (
              <div
                key={post.id}
                className="h-screen w-full snap-start flex items-center justify-center p-4"
              >
                <div className="flex flex-col lg:flex-row lg:gap-4 w-full max-w-4xl lg:items-end lg:justify-center">
                  <div className="max-w-[600px] w-full mx-auto lg:flex-shrink-0">
                    {/* Post Card */}
                    <div className="bg-transparent rounded-2xl overflow-hidden">
                      {/* Media Content */}
                      <div className="relative h-[60vh] md:h-[80vh] md:aspect-[4/5] md:h-auto">
                        {post.mediaType === "image" && mediaUrl ? (
                          <Image
                            src={mediaUrl}
                            alt={post.content}
                            fill
                            className="object-cover"
                          />
                        ) : post.mediaType === "video" && mediaUrl ? (
                          <div className="relative w-full h-full">
                            <video
                              src={mediaUrl}
                              className="w-full h-full object-cover"
                              controls={isCurrentVideoPlaying}
                              autoPlay={isCurrentVideoPlaying}
                              loop
                            />
                            {!isCurrentVideoPlaying && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Button
                                  onClick={() => toggleVideoPlay(post.id)}
                                  className="bg-white/20 hover:bg-white/30 text-white p-4 rounded-full"
                                >
                                  <Play className="w-8 h-8 fill-white" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            No media available
                          </div>
                        )}

                        {/* Media Type Indicator */}
                        {post.mediaType === "video" && (
                          <div className="absolute top-3 left-3 bg-black/50 text-white px-2 py-1 rounded text-xs font-medium">
                            VIDEO
                          </div>
                        )}

                        {/* Engagement Stats Overlay */}
                        <div className="absolute bottom-[20px] right-3 flex flex-col gap-2 space-y-4">
                          <div
                            className="flex gap-2 items-center text-white text-sm cursor-pointer hover:text-gray-300 transition-colors"
                            onClick={() => handleLike(post.id)}
                          >
                            <Heart
                              className={`w-5 h-5 ${
                                post.isLiked ? "fill-red-500 text-red-500" : ""
                              }`}
                            />
                            <span className="text-xs font-medium">
                              {post.likes > 1000
                                ? `${(post.likes / 1000).toFixed(1)}K`
                                : post.likes}
                            </span>
                          </div>
                          <div
                            className="flex gap-2 items-center text-white text-sm cursor-pointer hover:text-gray-300 transition-colors"
                            onClick={() => toggleCommentsModal(post.id)}
                          >
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-xs font-medium">
                              {post.comments}
                            </span>
                          </div>
                          <div
                            className="flex gap-2 items-center text-white text-sm cursor-pointer hover:text-gray-300 transition-colors"
                            onClick={() => handleShare(post.id)}
                          >
                            <Share2 className="w-5 h-5" />
                            <span className="text-xs font-medium">
                              {post.shares}
                            </span>
                          </div>
                          <div className="flex gap-2 items-center text-white text-sm">
                            <Eye className="w-5 h-5" />
                            <span className="text-xs font-medium">10.1K</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-300 hover:text-white p-1"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Post Details Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={post.author.avatar} />
                                <AvatarFallback className="bg-gray-200 text-white text-xs">
                                  {post.author.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-white text-[15px]">
                                  {post.author.name}
                                </h3>
                                <span className="text-[15px] text-[#8C8C8C]">
                                  •
                                </span>
                                <p className="text-[15px] text-[#8C8C8C]">
                                  {post.timestamp}
                                </p>
                              </div>
                              <button className="text-white border border-gray-400 hover:bg-white/10 rounded-lg px-3 py-1 text-[15px] font-medium">
                                Follow
                              </button>
                            </div>
                            <div className="flex items-center gap-2"></div>
                          </div>
                          <p
                            className="text-white text-sm leading-relaxed cursor-pointer hover:text-gray-200 transition-colors w-[80%]"
                            onClick={() => toggleTextExpansion(post.id)}
                          >
                            {isCurrentTextExpanded
                              ? post.content
                              : post.content.length > 50
                              ? `${post.content.substring(0, 50)}...`
                              : post.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments Modal - Inline mode for large screens */}
                  {isCommentsModalOpen && selectedPostId === post.id && (
                    <div className="hidden lg:block">
                      <CommentsModal
                        isOpen={isCommentsModalOpen}
                        onClose={() => setIsCommentsModalOpen(false)}
                        comments={comments as any}
                        mode="inline"
                        onCommentCreated={async (content: string) => {
                          // Minimal stub: in real app you'd call API to create comment
                          console.log(
                            "ReelsView: new comment for",
                            post.id,
                            content
                          );
                          return Promise.resolve(true);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comments Modal - Overlay mode for mobile/tablet */}
      {isCommentsModalOpen && (
        <div className="lg:hidden">
          <CommentsModal
            isOpen={isCommentsModalOpen}
            onClose={() => setIsCommentsModalOpen(false)}
            comments={comments as any}
            mode="overlay"
            onCommentCreated={async (content: string) => {
              console.log(
                "ReelsView overlay: new comment for",
                selectedPostId,
                content
              );
              return Promise.resolve(true);
            }}
          />
        </div>
      )}

      {/* Share Modal */}
      {selectedPostId && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          postId={selectedPostId}
          postTitle={
            posts
              .find((p) => p.id === selectedPostId)
              ?.content.substring(0, 50) + "..." || ""
          }
        />
      )}
    </div>
  );
}
