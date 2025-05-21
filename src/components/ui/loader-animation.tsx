"use client"

import { motion } from "framer-motion"
import { MessageSquare } from "lucide-react"
import Image from "next/image"
import logo from "../../../public/Image/logo reviai.png"

interface LoaderProps {
  variant?: "bubbles" | "pulse" | "typing" | "logo"
  text?: string
  className?: string
}

export const LoaderAnimation = ({
  variant = "bubbles",
  text = "Loading chat session",
  className = "",
}: LoaderProps) => {
  // Render different loader variants
  const renderLoader = () => {
    switch (variant) {
      case "bubbles":
        return <BubbleLoader />
      case "pulse":
        return <PulseLoader />
      case "typing":
        return <TypingLoader />
      case "logo":
        return <LogoLoader />
      default:
        return <BubbleLoader />
    }
  }

  return (
    <div className={`flex flex-col items-center justify-center h-full p-4 text-center ${className}`}>
      <div className="flex flex-col items-center max-w-md">
        <div className="mb-6">{renderLoader()}</div>
        <p className="text-[#CCCCCC] text-sm font-medium">{text}</p>
      </div>
    </div>
  )
}

// Bubble loader with three bouncing dots
const BubbleLoader = () => {
  return (
    <div className="flex space-x-3">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"
          animate={{
            y: ["0%", "-50%", "0%"],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            ease: "easeInOut",
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  )
}

// Pulsing chat icon
const PulseLoader = () => {
  return (
    <div className="relative">
      <motion.div
        className="absolute inset-0 rounded-full bg-purple-500/20"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="relative z-10 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#212121] to-[#2a2a2a] rounded-full border border-purple-500/30"
        animate={{
          rotate: [0, 10, 0, -10, 0],
        }}
        transition={{
          duration: 5,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      >
        <MessageSquare className="w-6 h-6 text-purple-400" />
      </motion.div>
    </div>
  )
}

// Typing animation that mimics chat typing
const TypingLoader = () => {
  return (
    <div className="flex items-center gap-3 bg-[#212121] p-3 px-4 rounded-lg border border-gray-800">
      <Image src={logo} alt="typing" className="w-10 h-10" />
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{
              opacity: [0.3, 1, 0.3],
              y: [0, -5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop",
              ease: "easeInOut",
              delay: index * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Logo animation with rotating elements
const LogoLoader = () => {
  return (
    <div className="relative w-16 h-16">
      {/* Outer rotating ring */}
      <motion.div
        className="absolute inset-0 border-2 rounded-full border-t-purple-500 border-r-pink-500 border-b-blue-500 border-l-transparent"
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />

      {/* Middle rotating ring */}
      <motion.div
        className="absolute border-2 rounded-full inset-2 border-t-transparent border-r-purple-500 border-b-pink-500 border-l-blue-500"
        animate={{ rotate: -360 }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />

      {/* Inner pulsing circle */}
      <motion.div
        className="absolute inset-4 bg-gradient-to-br from-[#212121] to-[#2a2a2a] rounded-full flex items-center justify-center"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <motion.div
          className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"
          animate={{
            scale: [0.8, 1, 0.8],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </div>
  )
}
