"use client"

import { useState } from "react"

type ToastVariant = "default" | "destructive" | "success"

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
}

interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
}

// Simple toast implementation
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant || "default",
    }

    setToasts((prev) => [...prev, newToast])

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)

    return id
  }

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toast, dismiss, toasts }
}

// Export a singleton instance for direct import
export const toast = (options: ToastOptions) => {
  // In a real implementation, this would use a context or event system
  // For now, we'll just log to console since this is a simplified version
  console.log(`Toast: ${options.variant || 'default'}`, options.title, options.description)
  
  // In a real app, you'd show a toast notification
  // For this example, we'll use alert for demonstration
  if (typeof window !== 'undefined') {
    const message = `${options.title || ''}${options.title && options.description ? ': ' : ''}${options.description || ''}`
    alert(message)
  }
}
