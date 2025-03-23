import React, { useState, useEffect } from 'react';

interface AnimatedTextProps {
  text: string;
  speed?: number; // Speed of typing in milliseconds
  onComplete?: () => void;
  batchSize?: number; // Number of characters to process in each batch
}

export function AnimatedText({ 
  text, 
  speed = 50, // Increased default speed from 30 to 50ms
  onComplete,
  batchSize = 1 // Default batch size
}: AnimatedTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        const nextIndex = Math.min(currentIndex + batchSize, text.length);
        const nextChunk = text.slice(currentIndex, nextIndex);
        setDisplayedText(prev => prev + nextChunk);
        setCurrentIndex(nextIndex);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, batchSize, onComplete]);

  // Reset animation when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <span className="whitespace-pre-wrap">
      {displayedText}
      {currentIndex < text.length && (
        <span className="animate-pulse">▋</span>
      )}
    </span>
  );
} 