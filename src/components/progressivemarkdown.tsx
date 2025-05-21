import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface ProgressiveMarkdownProps {
  content: string;
  typingSpeed?: number;
  shouldAnimate?: boolean;
  onTextUpdate?: () => void;
  onComplete?: () => void;
}

const ProgressiveMarkdownRenderer: React.FC<ProgressiveMarkdownProps> = ({
  content,
  typingSpeed = 10,
  shouldAnimate = true,
  onTextUpdate,
  onComplete,
}) => {
  const [visibleChars, setVisibleChars] = useState(0);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [showIframe, setShowIframe] = useState(false);
  
  // Store callbacks in refs to avoid dependency changes
  const onTextUpdateRef = useRef(onTextUpdate);
  const onCompleteRef = useRef(onComplete);
  const contentLengthRef = useRef(content.length);
  
  // Update refs when the callbacks change
  useEffect(() => {
    onTextUpdateRef.current = onTextUpdate;
    onCompleteRef.current = onComplete;
    contentLengthRef.current = content.length;
  }, [onTextUpdate, onComplete, content]);

  // Reset visible chars when content changes
  useEffect(() => {
    setVisibleChars(shouldAnimate ? 0 : content.length);
    
    if (!shouldAnimate) {
      onCompleteRef.current?.();
    }
  }, [content, shouldAnimate]);
  
  // Separate effect for the animation timer
  useEffect(() => {
    if (!shouldAnimate) {
      return;
    }
    
    let animationFrame: number;
    let lastUpdateTime = 0;
    
    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateTime >= typingSpeed) {
        lastUpdateTime = timestamp;
        
        setVisibleChars(prev => {
          if (prev >= contentLengthRef.current) {
            onCompleteRef.current?.();
            return prev;
          }
          
          // Call onTextUpdate but limit how often
          if (prev % 5 === 0) {
            onTextUpdateRef.current?.();
          }
          
          return prev + 1;
        });
      }
      
      if (visibleChars < contentLengthRef.current) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [shouldAnimate, typingSpeed, visibleChars]);

  const handleLinkClick = useCallback((e: React.MouseEvent<HTMLElement>, url: string) => {
    e.preventDefault();
    setIframeUrl(url);
    setShowIframe(true);
  }, []);

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
            <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="mb-2 text-base font-semibold text-gray-900 dark:text-white" {...props}>
              {children}
            </h4>
          ),
          h5: ({ children, ...props }) => (
            <h5 className="mb-2 text-base font-medium text-gray-900 dark:text-white" {...props}>
              {children}
            </h5>
          ),
          h6: ({ children, ...props }) => (
            <h6 className="mb-2 text-sm font-medium text-gray-900 dark:text-white" {...props}>
              {children}
            </h6>
          ),
          table: ({ children, ...props }) => (
            <div className="my-4 overflow-auto">
              <table className="min-w-full text-sm text-left border border-gray-300 dark:border-gray-600" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200" {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody className="bg-white dark:bg-gray-800" {...props}>
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr className="border-t border-gray-200 dark:border-gray-700" {...props}>
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th className="px-4 py-2 font-semibold border-r border-gray-200 dark:border-gray-700" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700" {...props}>
              {children}
            </td>
          ),
          
          p: ({ children, ...props }) => (
            <p className="mb-4 text-[15px] leading-relaxed text-gray-800 dark:text-gray-300" {...props}>
              {children}
            </p>
          ),
          strong: ({ children, ...props }) => (
            <strong className="text-gray-900 font-semibold dark:text-white text-[17px]" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic text-gray-800 dark:text-gray-300" {...props}>
              {children}
            </em>
          ),
          ul: ({ children, ...props }) => (
            <ul className="mb-4 list-disc list-inside text-[16px] text-gray-800 dark:text-gray-300" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="mb-4 list-decimal list-inside text-[16px] text-gray-800 dark:text-gray-300" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="mb-1 text-[15px] text-gray-800 dark:text-gray-300" {...props}>
              {children}
            </li>
          ),
          span: ({ children, ...props }) => (
            <span className="text-[15px] text-gray-800 dark:text-gray-300" {...props}>
              {children}
            </span>
          ),
          hr: ({ ...props }) => (
            <hr className="my-4 border-gray-300 dark:border-gray-500" {...props} />
          ),

          pre: ({ children, ...props }) => (
            <div className="p-3 my-2 overflow-x-auto bg-gray-800 rounded-lg">
              <code className="px-1 text-sm bg-gray-200 rounded" {...props}>
                {children}
              </code>
            </div>
          ),
          
          code: ({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) => {
            const match = /language-(\w+)/.exec(className || '');
            if (!inline && match) {
              return (
                <div className="relative mb-6 rounded-md overflow-hidden bg-[#282a36]">
                  <div className="flex justify-between items-center px-4 py-2 text-sm bg-[#1e1f29] text-white">
                    <span>{match[1]}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(String(children))}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                  <SyntaxHighlighter
                    showLineNumbers
                    language={match[1]}
                    style={atomDark}
                    wrapLines
                    className="px-4 py-3 text-sm"
                    {...props}
                  >
                    {String(children)}
                  </SyntaxHighlighter>
                </div>
              );
            }
        
            return (
              <code className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="pl-4 mb-4 italic text-gray-600 border-l-4 border-gray-300 dark:border-gray-500 dark:text-gray-400"
              {...props}
            >
              {children}
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
                className="px-3 py-1 text-sm text-blue-600 rounded-md cursor-pointer hover:underline dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                // Only spread props safe for buttons
                {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
              >
                View Link
              </button>
            ) : (
              <a
                href={href}
                className="text-blue-600 cursor-pointer hover:underline dark:text-blue-400"
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