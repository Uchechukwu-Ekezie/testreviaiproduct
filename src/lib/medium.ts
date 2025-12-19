export interface MediumPost {
    title: string
    description: string
    link: string
    category: string
    pubDate: string
    readTime: string
    content: string
    image: string
  }
  
  export async function getMediumPosts(): Promise<MediumPost[]> {
    try {
      const response = await fetch("/api/medium")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
  
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error in getMediumPosts:", error)
      throw error
    }
  }
  