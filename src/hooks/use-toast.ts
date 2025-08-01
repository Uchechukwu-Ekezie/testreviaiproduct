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

// Global toast state
let globalToasts: Toast[] = []
let globalSetToasts: ((toasts: Toast[]) => void) | null = null

// Register the global setter
export const registerToastSetter = (setter: (toasts: Toast[]) => void) => {
  globalSetToasts = setter
}

// Simple toast function
export const toast = (options: ToastOptions) => {
  const id = Math.random().toString(36).substring(2, 9)
  const newToast: Toast = {
    id,
    title: options.title,
    description: options.description,
    variant: options.variant || "default",
  }

  globalToasts = [...globalToasts, newToast]
  
  if (globalSetToasts) {
    globalSetToasts([...globalToasts])
  } else {
    // Fallback to console.log
    console.log(`🔔 Toast [${options.variant || 'default'}]:`, options.title, options.description)
  }

  // Auto dismiss after 4 seconds
  setTimeout(() => {
    globalToasts = globalToasts.filter((t) => t.id !== id)
    if (globalSetToasts) {
      globalSetToasts([...globalToasts])
    }
  }, 4000)

  return id
}

// Dismiss function
export const dismissToast = (id: string) => {
  globalToasts = globalToasts.filter((t) => t.id !== id)
  if (globalSetToasts) {
    globalSetToasts([...globalToasts])
  }
}

// Hook for components that need toast state
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Register this component's setter on mount
  useState(() => {
    registerToastSetter(setToasts)
    setToasts([...globalToasts]) // Initialize with current toasts
  })

  return { toasts, toast, dismiss: dismissToast }
}