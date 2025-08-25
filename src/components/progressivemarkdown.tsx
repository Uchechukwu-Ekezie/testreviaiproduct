import React, { useState, useEffect, useRef, useCallback } from "react";
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

const ProgressiveMarkdownRenderer: React.FC<ProgressiveMarkdownProps> = ({
  content,
  typingSpeed = 5, // Faster default speed for smoother animation
  shouldAnimate = true,
  onTextUpdate,
  onComplete,
  messageId,
  propertyData,
}) => {
  const [visibleChars, setVisibleChars] = useState(0);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [showIframe, setShowIframe] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Store callbacks and content state in refs to avoid dependency changes
  const onTextUpdateRef = useRef(onTextUpdate);
  const onCompleteRef = useRef(onComplete);
  const contentLengthRef = useRef(content.length);
  const previousContentRef = useRef(content);
  const previousMessageIdRef = useRef(messageId);

  // Update refs when the callbacks change
  useEffect(() => {
    onTextUpdateRef.current = onTextUpdate;
    onCompleteRef.current = onComplete;
    contentLengthRef.current = content.length;
  }, [onTextUpdate, onComplete, content]);

  // Reset animation state when content or messageId changes significantly
  useEffect(() => {
    const isNewContent = content !== previousContentRef.current;
    const isNewMessage = messageId !== previousMessageIdRef.current;
    const contentGrew =
      content.length > previousContentRef.current.length &&
      content.startsWith(previousContentRef.current);

    // Update refs
    previousContentRef.current = content;
    previousMessageIdRef.current = messageId;

    if (isNewMessage || (isNewContent && !contentGrew)) {
      // New message or completely different content - reset animation
      setHasAnimated(false);
      setVisibleChars(shouldAnimate ? 0 : content.length);

      if (!shouldAnimate) {
        setHasAnimated(true);
        onCompleteRef.current?.();
      }
    } else if (contentGrew && shouldAnimate && !hasAnimated) {
      // Content is growing (streaming) - continue animation from where we left off
      // Don't reset visibleChars
    } else if (!shouldAnimate || hasAnimated) {
      // Should not animate or has already been animated - show all content
      setVisibleChars(content.length);
      if (!hasAnimated) {
        setHasAnimated(true);
        onCompleteRef.current?.();
      }
    }
  }, [content, shouldAnimate, messageId, hasAnimated]);

  // Separate effect for the animation timer
  useEffect(() => {
    if (
      !shouldAnimate ||
      hasAnimated ||
      visibleChars >= contentLengthRef.current
    ) {
      return;
    }

    let animationFrame: number;
    let lastUpdateTime = 0;

    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateTime >= typingSpeed) {
        lastUpdateTime = timestamp;

        setVisibleChars((prev) => {
          const newVisibleChars = Math.min(prev + 1, contentLengthRef.current);

          if (newVisibleChars >= contentLengthRef.current) {
            setHasAnimated(true);
            onCompleteRef.current?.();
            return newVisibleChars;
          }

          // Call onTextUpdate but limit how often to avoid performance issues
          if (newVisibleChars % 3 === 0) {
            onTextUpdateRef.current?.();
          }

          return newVisibleChars;
        });
      }

      if (visibleChars < contentLengthRef.current && !hasAnimated) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [shouldAnimate, typingSpeed, visibleChars, hasAnimated]);

  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLElement>, url: string) => {
      e.preventDefault();

      // If we have property data and the URL appears to be an image_url,
      // check if we should use property_url instead
      let correctedUrl = url;
      if (propertyData && propertyData.property_url && propertyData.image_url) {
        // If the clicked URL matches the image_url, use property_url instead
        if (url === propertyData.image_url) {
          correctedUrl = propertyData.property_url;
        }
      }

      setIframeUrl(correctedUrl);
      setShowIframe(true);
    },
    [propertyData]
  );

  const closeIframe = useCallback(() => {
    setShowIframe(false);
    setIframeUrl(null);
  }, []);

  return (
    <>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          h1: ({ children, ...props }) => (
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
            <strong
              className="font-bold text-gray-900 dark:text-white"
              {...props}
            >
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
            <span
              className="text-base text-gray-800 dark:text-gray-300"
              {...props}
            >
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
            // Check if the URL is long (more than 50 characters)
            const isLongUrl = href && href.length > 50;

            return isLongUrl ? (
              <button
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  if (href) handleLinkClick(e, href);
                }}
                className="inline-flex items-center px-4 py-2 mx-1 text-sm font-medium text-blue-600 transition-colors border border-blue-200 rounded-md dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                // Only spread props safe for buttons
                {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                View Link
              </button>
            ) : (
              <a
                href={href}
                className="mx-1 font-medium text-blue-600 underline transition-colors dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline-offset-4 decoration-blue-400 hover:decoration-blue-600"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  if (href) handleLinkClick(e, href);
                }}
                // Only spread props safe for anchors
                {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content.substring(0, visibleChars)}
      </ReactMarkdown>

      {/* Iframe Modal */}
      {showIframe && iframeUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={closeIframe}
              className="absolute z-10 p-2 text-gray-700 top-4 right-4 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              aria-label="Close iframe"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <iframe
              src={iframeUrl}
              className="w-full h-full border-0"
              title="Embedded Content"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ProgressiveMarkdownRenderer;
