import { motion } from "framer-motion"
import React, { ReactNode } from "react"

interface FadeInProps {
  children: ReactNode
  delay?: number
  direction?: "left" | "right" | "top" | "bottom"
}

const FadeIn: React.FC<FadeInProps> = ({ children, delay = 0, direction = "bottom" }) => {
  const variants = {
    hidden: {
      opacity: 0,
      x: direction === "left" ? -50 : direction === "right" ? 50 : 0,
      y: direction === "top" ? -50 : direction === "bottom" ? 50 : 0,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
    },
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ duration: 0.8, ease: "easeOut", delay }}
    >
      {React.Children.map(children, child => 
        React.isValidElement(child) ? React.cloneElement(child) : child
      )}
    </motion.div>
  )
}

export default FadeIn
