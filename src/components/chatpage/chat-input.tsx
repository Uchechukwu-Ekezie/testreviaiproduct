"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { PaperclipIcon, ImageIcon, X, Plus } from 'lucide-react'
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"
import { chatAPI } from "@/lib/api"
import arrow from "../../../public/Image/arrow-up.svg"


interface ChatInputProps {
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  isMobile: boolean
  activeSession?: string | null
  user?: { id: string } | null
  isAuthenticated?: boolean
  setMessages?: (messages: any[] | ((prev: any[]) => any[])) => void
  setActiveSession?: (sessionId: string | null) => void
  setSessions?: (sessions: any[] | ((prev: any[]) => any[])) => void
  refreshSessions?: () => void
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  handleSubmit,
  isLoading,
  isMobile,
  activeSession,
  user,
  isAuthenticated,
  setMessages,
  setActiveSession,
  setSessions,
  refreshSessions,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const [localIsLoading, setLocalIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close if clicking outside the modal
      if (isModalOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false)
      }
    }

    if (isModalOpen) {
      // Use mousedown instead of click to ensure this fires before button click handlers
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isModalOpen])

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

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // If we're using the external handleSubmit function
    if (handleSubmit) {
      handleSubmit(e)
      return
    }

    // Otherwise use the internal implementation
    if (!input.trim() && images.length === 0 && attachments.length === 0) return

    setLocalIsLoading(true)
    const currentMessage = input
    setInput("")

    if (!setMessages || !setActiveSession || !setSessions || !refreshSessions) {
      console.error("Required props for internal submit handling are missing")
      return
    }

    const tempId = `temp-${Date.now()}`
    const userMessage = { id: tempId, prompt: currentMessage, response: "" }
    setMessages((prev) => [...prev, userMessage])

    try {
      const messageData = {
        message: currentMessage,
        ...(attachments.length > 0 && { attachment: attachments[0] }),
        ...(images.length > 0 && { image: images[0] }),
      }

      let data
      if (activeSession) {
        data = await chatAPI.postNewChat(messageData.message, activeSession)
      } else {
        const sessionData = {
          chat_title: currentMessage.substring(0, 30),
          user: user?.id || "guest",
        }
        const sessionResponse = await chatAPI.createChatSession(sessionData)
        setActiveSession(sessionResponse.id)
        data = await chatAPI.postNewChat(messageData.message, sessionResponse.id)

        setSessions((prev) => {
          if (!prev.some((s) => s.id === sessionResponse.id)) {
            return [...prev, sessionResponse]
          }
          return prev
        })

        setTimeout(refreshSessions, 500)
      }

      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? data : msg)))
      setAttachments([])
      setImages([])
      setImagePreviews([])
    } catch (error: any) {
      console.error("Error submitting chat:", error)
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send message.",
        variant: "destructive",
      })
      setInput(currentMessage)
    } finally {
      setLocalIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background lg:left-64">
      <div className="w-full max-w-[863px] mx-auto p-4">
        <div className="border rounded-[15px] border-border p-2 bg-card">
          <form onSubmit={handleLocalSubmit}>
            <textarea
              ref={textareaRef}
              placeholder="Ask me anything about housing..."
              value={input}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleLocalSubmit(e)
                }
              }}
              disabled={isLoading || localIsLoading}
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
              <div className="flex flex-wrap gap-2 mt-2 ">
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

            <div className="flex items-center justify-between pt-2 mt-2 border-border">
              <div className="flex items-center gap-2">
                {/* On larger screens, show buttons directly */}
                <div className="items-center hidden gap-2 md:flex">
                  {/* Image Upload */}
                  <button
                    type="button"
                    disabled={isLoading || localIsLoading}
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-2 p-2 transition-colors rounded-md"
                  >
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground text-[15px]">Upload Image</span>
                  </button>

                  {/* Document Upload */}
                  <button
                    type="button"
                    disabled={isLoading || localIsLoading}
                    onClick={() => attachmentInputRef.current?.click()}
                    className="flex items-center gap-2 p-2 transition-colors rounded-md"
                  >
                    <PaperclipIcon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground text-[15px]">Attach Document</span>
                  </button>
                </div>

                {/* On small screens, show plus button and text */}
                <div className="flex items-center md:hidden">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted"
                  >
                    <div className="flex items-center gap-2 p-1 border-2 rounded-full border-border">
                      <Plus className="w-5 h-5 text-muted-foreground whitespace-nowrap" />
                    </div>
                  </button>
                  <h1 className="ml-2">Add Attachment</h1>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-2">
                {/* <div className="px-3 py-2 text-sm bg-border rounded-[10px] text-muted-foreground whitespace-nowrap">
                  15 tokens left
                </div> */}
                <button
                  type="submit"
                  disabled={
                    isLoading || localIsLoading || (!input.trim() && images.length === 0 && attachments.length === 0)
                  }
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[#FFD700] to-[#780991] text-white"
                >
                  <Image src={arrow} alt="" className="w-5 h-5" />
                  {/* <FaArrowUp className="w-5 h-5 text-foreground font-[300]" /> */}
                </button>
              </div>
            </div>
            {/* Modal for small screens */}
            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex bottom-16 left-[-80px] items-end justify-center md:hidden">
                <div
                  ref={modalRef}
                  className="w-full p-4 max-w-[270px] bg-card rounded-xl animate-in slide-in-from-bottom border-[2px] border-border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Add to your message</h3>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="p-1 border-2 rounded-full hover:bg-muted border-border"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid gap-1">
                    <button
                      type="button"
                      disabled={isLoading || localIsLoading}
                      onClick={() => {
                        imageInputRef.current?.click()
                        setIsModalOpen(false)
                      }}
                      className="flex items-center w-full gap-3 p-3 transition-colors rounded-md hover:bg-muted "
                    >
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">Upload Image</span>
                    </button>
                    <div className="w-full border-b-2 border-border"></div>
                    <button
                      type="button"
                      disabled={isLoading || localIsLoading}
                      onClick={() => {
                        attachmentInputRef.current?.click()
                        setIsModalOpen(false)
                      }}
                      className="flex items-center w-full gap-3 p-3 transition-colors rounded-md hover:bg-muted"
                    >
                      <PaperclipIcon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">Attach Document</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChatInput
