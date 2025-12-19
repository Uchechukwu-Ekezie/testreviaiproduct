// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

interface ProgressiveMarkdownProps {
  content: string;
  typingSpeed?: number;
  shouldAnimate?: boolean;
  onTextUpdate?: () => void;
  onComplete?: () => void;
  messageId?: string; // Add messageId to track animated content
  propertyData?: { property_url?: string; image_url?: string } | null; // Add property data to help correct URLs
}

// Separate image component to handle error states properly
const MarkdownImage: React.FC<{ src?: string; alt?: string }> = React.memo(
  ({ src, alt }) => {
    const [imageError, setImageError] = useState(false);
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const previousSrc = useRef<string | undefined>(src);

    // Reset error state when src changes
    useEffect(() => {
      if (previousSrc.current !== src) {
        setImageError(false);
        setHasAttemptedLoad(false);
        previousSrc.current = src;
      }
    }, [src]);

    // Check if the image URL is a placeholder or invalid
    const isPlaceholderUrl =
      src &&
      (src.includes("example.com") ||
        src.includes("placeholder") ||
        src.includes("dummy") ||
        src.includes("fake") ||
        src.startsWith("https://example.com/") ||
        src.startsWith("http://example.com/"));

    // Don't render placeholder or invalid images
    if (isPlaceholderUrl) {
      return null;
    }

    // Show fallback if image failed to load
    if (imageError && hasAttemptedLoad) {
      return (
        <div
          className="relative my-4 rounded-lg overflow-hidden shadow-md bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800"
          style={{ maxWidth: "100%", height: "200px" }}
        >
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-center p-4">
              <svg
                className="w-16 h-16 mx-auto mb-2 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Image unavailable
              </p>
              {alt && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {alt}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="relative my-4 rounded-lg overflow-hidden "
        style={{ maxWidth: "100%", maxHeight: "200px" }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="rounded-lg object-cover w-full h-full"
          style={{
            maxHeight: "200px",
            maxWidth: "100%",
            height: "auto",
            width: "auto",
          }}
          loading="lazy"
          onError={() => {
            // Set error state to show fallback, only once
            if (!hasAttemptedLoad) {
              setHasAttemptedLoad(true);
              setImageError(true);
            }
          }}
          onLoad={() => {
            setHasAttemptedLoad(true);
          }}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function - only re-render if src or alt actually changes
    return prevProps.src === nextProps.src && prevProps.alt === nextProps.alt;
  }
);

MarkdownImage.displayName = "MarkdownImage";

const ProgressiveMarkdownRenderer: React.FC<ProgressiveMarkdownProps> = ({
  content,
  typingSpeed = 20, // Optimized typing speed for smooth performance
  shouldAnimate = true,
  onTextUpdate,
  onComplete,
  messageId,
  propertyData,
}) => {
  const [visibleChars, setVisibleChars] = useState(
    shouldAnimate ? 0 : content.length
  );
  const [hasAnimated, setHasAnimated] = useState(!shouldAnimate);

  // Store callbacks and content state in refs to avoid dependency changes
  const onTextUpdateRef = useRef(onTextUpdate);
  const onCompleteRef = useRef(onComplete);
  const previousContentRef = useRef(content);
  const previousMessageIdRef = useRef(messageId);

  // Update refs when the callbacks change
  useEffect(() => {
    onTextUpdateRef.current = onTextUpdate;
    onCompleteRef.current = onComplete;
  }, [onTextUpdate, onComplete]);

  // Reset animation state when content or messageId changes significantly
  useEffect(() => {
    const isNewContent = content !== previousContentRef.current;
    const isNewMessage = messageId !== previousMessageIdRef.current;
    const contentGrew =
      content.length > previousContentRef.current.length &&
      content.startsWith(previousContentRef.current);

    if (isNewMessage || (isNewContent && !contentGrew)) {
      // New message or completely different content - reset animation
      previousContentRef.current = content;
      previousMessageIdRef.current = messageId;

      if (!shouldAnimate) {
        setVisibleChars(content.length);
        setHasAnimated(true);
        onCompleteRef.current?.();
      } else {
        setVisibleChars(0);
        setHasAnimated(false);
      }
    } else if (contentGrew) {
      // Content is growing (streaming) - update ref
      previousContentRef.current = content;
      previousMessageIdRef.current = messageId;

      if (!shouldAnimate) {
        // Should not animate - show all content immediately
        setVisibleChars(content.length);
      }
    }
  }, [content, shouldAnimate, messageId]);

  // Get the displayed content based on visible characters
  const displayedContent = useMemo(() => {
    if (visibleChars >= content.length) {
      return content;
    }
    return content.slice(0, visibleChars);
  }, [content, visibleChars]);

  // Optimized animation with smooth character-based increments
  useEffect(() => {
    if (!shouldAnimate || hasAnimated || visibleChars >= content.length) {
      return;
    }

    let animationFrame: number;
    let lastUpdateTime = 0;
    let lastScrollTime = 0;
    const charsPerFrame = 5; // Increased for faster, smoother animation
    const scrollUpdateInterval = 100; // Call scroll every 100ms for smooth but performant scrolling

    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateTime >= typingSpeed) {
        lastUpdateTime = timestamp;

        let shouldScroll = false;
        let isComplete = false;

        setVisibleChars((prev) => {
          const newVisibleChars = Math.min(
            prev + charsPerFrame,
            content.length
          );

          if (newVisibleChars >= content.length) {
            setHasAnimated(true);
            isComplete = true;
            shouldScroll = true;
          } else {
            // Time-based throttling for scroll updates
            if (timestamp - lastScrollTime >= scrollUpdateInterval) {
              lastScrollTime = timestamp;
              shouldScroll = true;
            }
          }

          return newVisibleChars;
        });

        // Call scroll updates AFTER setState completes
        if (shouldScroll) {
          requestAnimationFrame(() => {
            onTextUpdateRef.current?.();
          });
        }

        // Call onComplete AFTER setState completes
        if (isComplete) {
          requestAnimationFrame(() => {
            onCompleteRef.current?.();
          });
        }
      }

      if (visibleChars < content.length && !hasAnimated) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [shouldAnimate, typingSpeed, visibleChars, hasAnimated, content.length]);

  // Memoize components to prevent re-creation on every render
  const markdownComponents = useMemo(
    () => ({
      h1: ({
        children,
        ...props
      }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h1
          className="pb-4 mt-6 mb-8 text-3xl font-bold text-gray-900 border-b border-gray-200 dark:text-white dark:border-gray-700"
          {...props}
        >
          {children}
        </h1>
      ),
      h2: ({ children, ...props }) => (
        <h2
          className="pb-3 mt-8 mb-6 text-2xl font-semibold text-gray-900 border-b border-gray-100 dark:text-white dark:border-gray-800"
          {...props}
        >
          {children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3
          className="mb-5 text-xl font-semibold text-gray-900 mt-7 dark:text-white"
          {...props}
        >
          {children}
        </h3>
      ),
      h4: ({ children, ...props }) => (
        <h4
          className="mt-6 mb-4 text-lg font-semibold text-gray-900 dark:text-white"
          {...props}
        >
          {children}
        </h4>
      ),
      h5: ({ children, ...props }) => (
        <h5
          className="mt-5 mb-4 text-base font-semibold text-gray-900 dark:text-white"
          {...props}
        >
          {children}
        </h5>
      ),
      h6: ({ children, ...props }) => (
        <h6
          className="mt-4 mb-3 text-sm font-semibold tracking-wide text-gray-700 uppercase dark:text-gray-300"
          {...props}
        >
          {children}
        </h6>
      ),
      table: ({ children, ...props }) => (
        <div className="my-8 overflow-auto border border-gray-200 rounded-lg shadow-sm dark:border-gray-700">
          <table className="w-full text-sm border-collapse" {...props}>
            {children}
          </table>
        </div>
      ),
      thead: ({ children, ...props }) => (
        <thead className="bg-gray-50 dark:bg-[#0D1117]" {...props}>
          {children}
        </thead>
      ),
      tbody: ({ children, ...props }) => (
        <tbody className="bg-white dark:bg-[#0D1117]" {...props}>
          {children}
        </tbody>
      ),
      tr: ({ children, ...props }) => (
        <tr
          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#0D1117]"
          {...props}
        >
          {children}
        </tr>
      ),
      th: ({ children, ...props }) => (
        <th
          className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase dark:text-gray-300"
          {...props}
        >
          {children}
        </th>
      ),
      td: ({ children, ...props }) => (
        <td
          className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300"
          {...props}
        >
          {children}
        </td>
      ),

      p: ({ children, ...props }) => (
        <p
          className="mb-6 text-base leading-7 text-gray-800 dark:text-gray-300"
          {...props}
        >
          {children}
        </p>
      ),
      strong: ({ children, ...props }) => (
        <strong className="font-bold text-gray-900 dark:text-white" {...props}>
          {children}
        </strong>
      ),
      em: ({ children, ...props }) => (
        <em className="italic text-gray-800 dark:text-gray-300" {...props}>
          {children}
        </em>
      ),
      ul: ({ children, ...props }) => (
        <ul
          className="mb-6 ml-6 space-y-3 text-gray-800 list-disc dark:text-gray-300"
          {...props}
        >
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol
          className="mb-6 ml-6 space-y-3 text-gray-800 list-decimal dark:text-gray-300"
          {...props}
        >
          {children}
        </ol>
      ),
      li: ({ children, ...props }) => (
        <li
          className="text-base leading-7 text-gray-800 dark:text-gray-300"
          {...props}
        >
          {children}
        </li>
      ),
      span: ({ children, ...props }) => (
        <span className="text-base text-gray-800 dark:text-gray-300" {...props}>
          {children}
        </span>
      ),
      hr: ({ ...props }) => (
        <hr
          className="my-12 border-t-2 border-gray-200 dark:border-gray-700"
          {...props}
        />
      ),

      pre: ({ children, ...props }) => (
        <div className="relative my-4 bg-[#0D1117] overflow-hidden border  rounded-xl">
          <div className="flex items-center justify-between px-4 py-3 bg-[#0D1117] ">
            <span className="text-sm text-[#7D8590] font-mono">code</span>
            <button
              onClick={() => {
                const textContent = String(children);
                navigator.clipboard.writeText(textContent);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-[#7D8590] hover:text-[#C9D1D9] hover:bg-[#21262D] rounded transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
              </svg>
              Copy
            </button>
          </div>
          <pre
            className="p-4 text-sm font-mono text-[#C9D1D9] bg-[#0D1117] leading-relaxed whitespace-pre overflow-x-auto"
            {...props}
          >
            {children}
          </pre>
        </div>
      ),

      code: ({
        inline,
        className,
        children,
        ...props
      }: {
        inline?: boolean;
        className?: string;
        children?: React.ReactNode;
      }) => {
        const match = /language-(\w+)/.exec(className || "");
        if (!inline && match) {
          return (
            <div className="relative my-4 bg-[#161B22] rounded-lg overflow-hidden border border-[#30363D]">
              <div className="flex items-center justify-between px-4 py-3 bg-[#161B22]">
                <span className="text-sm text-[#7D8590] font-mono">
                  {match[1]}
                </span>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(String(children))
                  }
                  className="flex items-center gap-1 px-2 py-1 text-xs text-[#7D8590] hover:text-[#C9D1D9] hover:bg-[#21262D] rounded transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                  </svg>
                  Copy
                </button>
              </div>
              <div className="overflow-x-auto">
                <pre className="p-4 text-sm font-mono text-[#C9D1D9] bg-[#161B22] leading-relaxed whitespace-pre overflow-x-auto">
                  <code>{String(children)}</code>
                </pre>
              </div>
            </div>
          );
        }

        return (
          <code
            className="px-1.5 py-0.5 mx-0.5 text-sm font-mono  dark:bg-[#161B22] "
            {...props}
          >
            {children}
          </code>
        );
      },
      blockquote: ({ children, ...props }) => (
        <blockquote
          className="relative py-6 pl-8 pr-6 my-8 italic text-gray-700 border-l-4 border-blue-500 rounded-r-lg dark:text-gray-300 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
          {...props}
        >
          <div className="absolute text-3xl leading-none text-blue-500 left-3 top-6 dark:text-blue-400">
            &ldquo;
          </div>
          <div className="pl-4">{children}</div>
        </blockquote>
      ),
      a: ({ children, href, ...props }) => {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline decoration-1 underline-offset-2 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            {...props}
          >
            {children}
          </a>
        );
      },
      img: ({ src, alt }) => {
        return <MarkdownImage src={src} alt={alt} />;
      },
    }),
    []
  ); // Empty dependency array since components don't depend on props

  return (
    <>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
      <div
        className="prose prose-sm max-w-none dark:prose-invert"
        style={{
          // Optimized for smooth animation performance
          contain: "layout style",
          willChange: hasAnimated ? "auto" : "contents",
          transform: "translateZ(0)",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          components={markdownComponents as any}
        >
          {displayedContent}
        </ReactMarkdown>
      </div>
    </>
  );
};

export default ProgressiveMarkdownRenderer;
