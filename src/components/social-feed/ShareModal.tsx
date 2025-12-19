"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  X, 
  Copy, 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin, 
  MessageCircle,
  Mail,
  Link as LinkIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postTitle?: string;
}

export default function ShareModal({ isOpen, onClose, postId, postTitle }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  
  // Generate the post URL
  const postUrl = `${window.location.origin}/social-feed/image/${postId}`;
  const shareText = postTitle ? `Check out this post: ${postTitle}` : "Check out this post on Revi.ai";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleSocialShare = (platform: string) => {
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${postUrl}`)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareText}\n\n${postUrl}`)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md mx-4 bg-card rounded-2xl shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-card-foreground">Share Post</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-card-foreground p-1"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Link Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-card-foreground">Post Link</label>
            <div className="flex gap-2">
              <Input
                value={postUrl}
                readOnly
                className="flex-1 bg-muted text-sm text-muted-foreground"
              />
              <Button
                onClick={handleCopyLink}
                variant={copied ? "default" : "outline"}
                size="sm"
                className={cn(
                  "px-3",
                  copied && "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                {copied ? (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Social Share Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-card-foreground">Share to</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleSocialShare('facebook')}
                variant="outline"
                className="flex items-center gap-2 justify-start h-12 border-border hover:bg-secondary"
              >
                <Facebook className="w-5 h-5 text-blue-600" />
                <span className="text-card-foreground">Facebook</span>
              </Button>
              
              <Button
                onClick={() => handleSocialShare('twitter')}
                variant="outline"
                className="flex items-center gap-2 justify-start h-12 border-border hover:bg-secondary"
              >
                <Twitter className="w-5 h-5 text-blue-400" />
                <span className="text-card-foreground">Twitter</span>
              </Button>
              
              <Button
                onClick={() => handleSocialShare('linkedin')}
                variant="outline"
                className="flex items-center gap-2 justify-start h-12 border-border hover:bg-secondary"
              >
                <Linkedin className="w-5 h-5 text-blue-700" />
                <span className="text-card-foreground">LinkedIn</span>
              </Button>
              
              <Button
                onClick={() => handleSocialShare('whatsapp')}
                variant="outline"
                className="flex items-center gap-2 justify-start h-12 border-border hover:bg-secondary"
              >
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span className="text-card-foreground">WhatsApp</span>
              </Button>
              
              <Button
                onClick={() => handleSocialShare('email')}
                variant="outline"
                className="flex items-center gap-2 justify-start h-12 col-span-2 border-border hover:bg-secondary"
              >
                <Mail className="w-5 h-5 text-muted-foreground" />
                <span className="text-card-foreground">Email</span>
              </Button>
            </div>
          </div>

          {/* Native Share (if available) */}
          {navigator.share && (
            <Button
              onClick={() => {
                navigator.share({
                  title: shareText,
                  text: shareText,
                  url: postUrl,
                });
              }}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share via Device
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
