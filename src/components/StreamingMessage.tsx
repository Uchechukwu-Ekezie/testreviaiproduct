import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

interface StreamingMessageProps {
  content: string;
  isStreaming?: boolean;
  onStreamingComplete?: () => void;
  className?: string;
}

const StreamingMessage: React.FC<StreamingMessageProps> = ({
  content,
  isStreaming = false,
  onStreamingComplete,
  className = "",
}) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // For real streaming, just display the content as it comes from server
    setDisplayedContent(content);
    
    // If not streaming, mark as complete
    if (!isStreaming) {
      setIsComplete(true);
      onStreamingComplete?.();
    }
  }, [content, isStreaming, onStreamingComplete]);

  // Use requestAnimationFrame for smooth streaming animation like ProgressiveMarkdown
  useEffect(() => {
    if (!isStreaming || !content) return;

    let animationId: number;
    let lastUpdateTime = 0;
    const targetContent = content;
    let currentDisplayed = displayedContent;

    const animate = (timestamp: number) => {
      // Throttle to 60fps for smooth animation
      if (timestamp - lastUpdateTime >= 16) { // ~60fps
        lastUpdateTime = timestamp;
        
        if (currentDisplayed !== targetContent) {
          // Gradually catch up to target content
          const remaining = targetContent.slice(currentDisplayed.length);
          if (remaining.length > 0) {
            // Add 1-3 characters at a time for smooth streaming
            const charsToAdd = Math.min(1 + Math.floor(Math.random() * 3), remaining.length);
            currentDisplayed += remaining.slice(0, charsToAdd);
            setDisplayedContent(currentDisplayed);
          }
        }
      }

      if (currentDisplayed !== targetContent) {
        animationId = requestAnimationFrame(animate);
      } else {
        setIsComplete(true);
        onStreamingComplete?.();
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [content, isStreaming, onStreamingComplete, displayedContent]);

  // Optimized auto-scroll with intelligent throttling
  useEffect(() => {
    if (contentRef.current && isStreaming) {
      const now = Date.now();
      
      // Only scroll if enough time has passed (throttle to max 5 times per second)
      if (now - lastScrollTimeRef.current < 200) {
        // Clear existing timeout and set a new one
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
          const chatContainer = document.querySelector('.chat-container') as HTMLElement;
          if (chatContainer) {
            // Use instant scroll for better performance
            chatContainer.scrollTop = chatContainer.scrollHeight;
          } else {
            // Fallback to instant scroll
            contentRef.current?.scrollIntoView({ 
              behavior: "instant", 
              block: "end",
              inline: "nearest"
            });
          }
          lastScrollTimeRef.current = Date.now();
        }, 200 - (now - lastScrollTimeRef.current));
        
        return;
      }
      
      // Immediate scroll if enough time has passed
      const chatContainer = document.querySelector('.chat-container') as HTMLElement;
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      } else {
        contentRef.current?.scrollIntoView({ 
          behavior: "instant", 
          block: "end",
          inline: "nearest"
        });
      }
      lastScrollTimeRef.current = now;
    }
  }, [displayedContent, isStreaming]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div ref={contentRef} className={className}>
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Custom styling for better readability
          p: ({ children }) => (
            <p className="mb-3 leading-relaxed text-gray-100">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 ml-4 list-disc text-gray-100">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-4 list-decimal text-gray-100">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="mb-1 text-gray-100">{children}</li>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-gray-700 px-1.5 py-0.5 rounded text-sm text-gray-100">
                {children}
              </code>
            ) : (
              <code className={className}>{children}</code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto mb-3">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-300 mb-3">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-white mb-3">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-white mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold text-white mb-2">{children}</h3>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-200">{children}</em>
          ),
        }}
        >
          {displayedContent}
        </ReactMarkdown>
      </div>
      
      {/* Simple blinking cursor */}
      {isStreaming && !isComplete && (
        <span className="inline-block w-0.5 h-5 bg-blue-400 ml-1 animate-pulse" />
      )}
    </div>
  );
};

export default StreamingMessage;
