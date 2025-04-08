"use client"

import type React from "react"
import { ExternalLink } from "lucide-react"

interface LandlordVerificationLinkProps {
  url: string
  children: React.ReactNode
}

const LandlordVerificationLink: React.FC<LandlordVerificationLinkProps> = ({ url, children }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <a
      href={url}
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-700 hover:underline"
    >
      {children}
      <ExternalLink className="w-3 h-3" />
    </a>
  )
}

export default LandlordVerificationLink
