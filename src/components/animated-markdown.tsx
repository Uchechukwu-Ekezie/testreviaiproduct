import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

interface AnimatedMarkdownTextProps {
  markdownText: string;
  speed?: number; // Speed of typing in milliseconds
  onComplete?: () => void;
  batchSize?: number; // Number of characters to process in each batch
}

export function AnimatedMarkdownText({
  markdownText,
  speed = 50,
  onComplete,
  batchSize = 1,
}: AnimatedMarkdownTextProps) {
  const [displayedHTML, setDisplayedHTML] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    marked.setOptions({
      highlight: function (code: any, lang: any) {
        return hljs.highlight(code, { language: lang }).value;
      },
    } as any);

    const processMarkdown = async () => {
      const html = await marked.parse(markdownText);
      const sanitizedHTML = DOMPurify.sanitize(html);
      return sanitizedHTML;
    };

    processMarkdown().then((sanitizedHTML) => {
      if (outputRef.current) {
        setDisplayedHTML(sanitizedHTML);
      }
    });

  }, [markdownText]);

  useEffect(() => {
    if (outputRef.current && displayedHTML) {
      const textContent = outputRef.current.textContent || '';
      if (currentIndex < textContent.length) {
        const timeout = setTimeout(() => {
          const nextIndex = Math.min(currentIndex + batchSize, textContent.length);
          const nextChunk = textContent.slice(currentIndex, nextIndex);
          if(outputRef.current){
              outputRef.current.textContent = textContent.slice(0, nextIndex);
          }
          setCurrentIndex(nextIndex);
        }, speed);

        return () => clearTimeout(timeout);
      } else if (onComplete) {
        onComplete();
      }
    }
  }, [currentIndex, displayedHTML, speed, batchSize, onComplete]);

  // Reset animation when markdownText changes
  useEffect(() => {
    setCurrentIndex(0);
    if(outputRef.current){
        outputRef.current.textContent = '';
    }
  }, [markdownText]);

  return (
    <div ref={outputRef} className="whitespace-pre-wrap">
      {displayedHTML && !currentIndex && displayedHTML}
      {currentIndex > 0 && (
        <span className="animate-pulse">▋</span>
      )}
    </div>
  );
}