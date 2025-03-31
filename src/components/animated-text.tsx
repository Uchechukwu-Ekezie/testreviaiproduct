"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"

interface AnimatedTextProps {
  text: string
  speed?: number
  batchSize?: number
  onTextUpdate?: () => void // Add callback for text updates
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  speed = 30,
  batchSize = 1,
  onTextUpdate = () => {},
}) => {
  const [displayedText, setDisplayedText] = useState("")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let currentIndex = 0

    // Reset displayed text when input text changes
    setDisplayedText("")

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set up new interval for text animation
    intervalRef.current = setInterval(() => {
      if (currentIndex < text.length) {
        // Calculate end index for current batch
        const endIndex = Math.min(currentIndex + batchSize, text.length)
        // Add next batch of characters
        const nextChunk = text.substring(currentIndex, endIndex)

        setDisplayedText((prev) => prev + nextChunk)
        currentIndex = endIndex

        // Call the callback after each update
        onTextUpdate()
      } else {
        // Clear interval when done
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }, speed)

    // Cleanup on unmount or when text changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [text, speed, batchSize, onTextUpdate])

  return <p className="whitespace-pre-wrap">{displayedText}</p>
}

