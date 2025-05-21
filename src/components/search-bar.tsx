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
  const { addSearch } = useSearchHistory()
  const { isAuthenticated } = useAuth()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) return
    
    // Call onSearch callback
    onSearch(query.trim())
    
    // Save to history if enabled and user is authenticated
    if (saveToHistory && isAuthenticated) {
      addSearch(query.trim())
    }
  }

  const handleClear = () => {
    setQuery("")
  }

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-zinc-400" />
      
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10 text-white bg-zinc-800 border-zinc-700"
      />
      
      {query && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute w-6 h-6 transform -translate-y-1/2 right-10 top-1/2 text-zinc-400"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
      
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="absolute w-6 h-6 transform -translate-y-1/2 right-2 top-1/2 text-zinc-400"
      >
        <Search className="w-4 h-4" />
      </Button>
    </form>
  )
} 