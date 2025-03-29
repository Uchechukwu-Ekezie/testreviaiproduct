"use client"

import React from "react"

import { useRef, useState, useEffect } from "react"
import { PaperclipIcon, ImageIcon, Send, X } from "lucide-react"
import Image from "next/image"

interface ChatInputProps {
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  isMobile: boolean
}

const ChatInput: React.FC<ChatInputProps> = React.memo(({
  input,
  setInput,
  handleSubmit,
  isLoading,
  isMobile,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [attachments, setAttachments] = useState<File[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    autoResize()
  }

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }

  // Initialize height on mount and when input changes externally
  useEffect(() => {
    autoResize()
  }, [input])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedImages = Array.from(e.target.files)
      const newImagePreviews = selectedImages.map((file) => URL.createObjectURL(file))

      setImages((prev) => [...prev, ...selectedImages])
      setImagePreviews((prev) => [...prev, ...newImagePreviews])
    }
  }

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setAttachments((prev) => [...prev, ...selectedFiles])
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))

    // Clean up the URL object to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index])
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background md:left-64">
      <div className="w-full max-w-[863px] mx-auto p-4">
        <div className="border rounded-[15px] border-border p-2 bg-card">
          <form onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              placeholder="Ask me anything..."
              value={input}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              disabled={isLoading}
              rows={1}
              className="w-full p-3 overflow-y-auto bg-transparent resize-none text-foreground placeholder:text-muted-foreground focus:outline-none max-h-72"
            />

            {/* Show Uploaded Images */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {images.map((image, index) => (
                  <div key={index} className="relative flex items-center gap-2 p-2 rounded-md">
                    <Image
                      src={imagePreviews[index] || "/placeholder.svg"}
                      alt="preview"
                      width={64}
                      height={64}
                      className="object-cover w-16 h-16 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-0 right-0 p-1 bg-red-500 rounded-full"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Show Uploaded Attachments */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((file, index) => (
                  <div key={index} className="relative flex items-center gap-2 p-2 border rounded-md border-border">
                    <div className="flex items-center gap-2">
                      <PaperclipIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                      <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-1 ml-2 rounded-full hover:bg-muted"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input type="file" multiple hidden ref={imageInputRef} onChange={handleImageUpload} accept="image/*" />

            <input
              type="file"
              multiple
              hidden
              ref={attachmentInputRef}
              onChange={handleAttachmentUpload}
              accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
            />

            <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
              <div className="flex items-center gap-2">
                {/* Image Upload */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-2 p-2 transition-colors rounded-md"
                >
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground text-[15px]">Upload Image</span>
                </button>

                {/* Document Upload */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => attachmentInputRef.current?.click()}
                  className="flex items-center gap-2 p-2 transition-colors rounded-md"
                >
                  <PaperclipIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground text-[15px]">Attach Document</span>
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isLoading || (!input.trim() && images.length === 0 && attachments.length === 0)
                }
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[#FFD700] to-[#780991] text-white"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
})

export default ChatInput

