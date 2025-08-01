"use client"

import React from 'react'
import { useToast } from '@/hooks/use-toast'
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  const getToastStyles = (variant: string) => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-600 border-red-700 text-white'
      case 'success':
        return 'bg-green-600 border-green-700 text-white'
      default:
        return 'bg-zinc-800 border-zinc-700 text-white'
    }
  }

  const getToastIcon = (variant: string) => {
    switch (variant) {
      case 'destructive':
        return <XCircle className="w-5 h-5 text-red-200" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-200" />
      default:
        return <AlertCircle className="w-5 h-5 text-blue-200" />
    }
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed z-50 flex flex-col max-w-sm gap-2 top-4 right-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            border rounded-lg p-4 shadow-lg transition-all duration-300 ease-in-out
            ${getToastStyles(toast.variant || 'default')}
            animate-in slide-in-from-right-full
          `}
        >
          <div className="flex items-start gap-3">
            {getToastIcon(toast.variant || 'default')}
            <div className="flex-1">
              {toast.title && (
                <div className="mb-1 text-sm font-medium">
                  {toast.title}
                </div>
              )}
              {toast.description && (
                <div className="text-sm opacity-90">
                  {toast.description}
                </div>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="transition-opacity opacity-70 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}