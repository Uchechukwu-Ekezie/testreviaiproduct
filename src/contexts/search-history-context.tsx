"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { toast } from "@/components/ui/use-toast"

// Define interfaces for search history data
interface SearchHistoryItem {
  id: string
  query: string
  timestamp: string
}

// Define types for our context
interface SearchHistoryContextType {
  searchHistory: SearchHistoryItem[]
  saveSearch: (query: string) => void
  clearHistory: () => void
  removeSearchItem: (id: string) => void
}

// Create the context
const SearchHistoryContext = createContext<SearchHistoryContextType | undefined>(undefined)

// Provider Props
interface SearchHistoryProviderProps {
  children: ReactNode
}

// Create the provider component
export function SearchHistoryProvider({ children }: SearchHistoryProviderProps) {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])

  // Save a search query to history
  const saveSearch = useCallback((query: string) => {
    if (!query.trim()) return
    
    try {
      // Create a new history item
      const newItem: SearchHistoryItem = {
        id: Date.now().toString(), // Simple ID generation
        query: query.trim(),
        timestamp: new Date().toISOString(),
      }
      
      // Add to history (at the beginning of the array)
      setSearchHistory(prev => {
        // Check if the query already exists in history
        const exists = prev.some(item => item.query.toLowerCase() === query.toLowerCase())
        
        if (exists) {
          // If it exists, remove the old one and add the new one at the front
          const filtered = prev.filter(item => item.query.toLowerCase() !== query.toLowerCase())
          return [newItem, ...filtered]
        } else {
          // If it doesn't exist, just add it to the front
          return [newItem, ...prev]
        }
      })
    } catch (error) {
      console.error("Failed to save search to history:", error)
      
      toast({
        title: "Error",
        description: "Failed to save search to history",
        variant: "destructive",
      })
    }
  }, [])

  // Clear all search history
  const clearHistory = useCallback(() => {
    try {
      setSearchHistory([])
      
      toast({
        title: "Success",
        description: "Search history cleared",
      })
    } catch (error) {
      console.error("Failed to clear search history:", error)
      
      toast({
        title: "Error",
        description: "Failed to clear search history",
        variant: "destructive",
      })
    }
  }, [])

  // Remove a specific search item
  const removeSearchItem = useCallback((id: string) => {
    try {
      setSearchHistory(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error("Failed to remove search item:", error)
      
      toast({
        title: "Error",
        description: "Failed to remove search item",
        variant: "destructive",
      })
    }
  }, [])

  // The context value
  const value = {
    searchHistory,
    saveSearch,
    clearHistory,
    removeSearchItem,
  }

  return <SearchHistoryContext.Provider value={value}>{children}</SearchHistoryContext.Provider>
}

// Custom hook to use the search history context
export function useSearchHistory() {
  const context = useContext(SearchHistoryContext)
  
  if (context === undefined) {
    throw new Error("useSearchHistory must be used within a SearchHistoryProvider")
  }
  
  return context
} 