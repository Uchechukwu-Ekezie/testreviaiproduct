"use client"

import { useState, useEffect } from "react"
import BlogSection from "../../components/blog"
import { getMediumPosts, MediumPost } from "../../lib/medium"

export default function Blog() {
  const [posts, setPosts] = useState<MediumPost[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const mediumPosts = await getMediumPosts()
        setPosts(mediumPosts)
        // mediumPosts data loaded
      } catch  {
        setError("Failed to fetch Medium posts.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [])

  return (
    <div className="bg-[#0A0A0A] pt-8">
      <BlogSection posts={posts} isLoading={isLoading} error={error} />
    </div>
  )
}
