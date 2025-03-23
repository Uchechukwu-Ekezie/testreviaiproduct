"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { useSearchHistory } from "@/contexts/search-history-context"
import { useAuth } from "@/contexts/auth-context"

interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  defaultValue?: string
  className?: string
  saveToHistory?: boolean
}

export function SearchBar({
  placeholder = "Search...",
  onSearch,
  defaultValue = "",
  className = "",
  saveToHistory = true
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue)
  const { saveSearch } = useSearchHistory()
  const { isAuthenticated } = useAuth()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) return
    
    // Call onSearch callback
    onSearch(query.trim())
    
    // Save to history if enabled and user is authenticated
    if (saveToHistory && isAuthenticated) {
      saveSearch(query.trim())
    }
  }

  const handleClear = () => {
    setQuery("")
  }

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
      
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10 bg-zinc-800 border-zinc-700 text-white"
      />
      
      {query && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute right-10 top-1/2 transform -translate-y-1/2 h-6 w-6 text-zinc-400"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-zinc-400"
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  )
} 