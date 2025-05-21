"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react"
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
  fetchSearchHistory: () => Promise<void>
  clearSearchHistory: () => Promise<void>
  deleteSearchItem: (id: string) => Promise<void>
  addToSearchHistory: (query: string) => Promise<void>
  isLoading: boolean
  error: string | null
  saveSearch: (query: string) => Promise<void>
  addSearch: (query: string) => Promise<void>
  history: SearchHistoryItem[]
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch search history (e.g., from API)
  const fetchSearchHistory = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Simulate API call - replace with actual API call
      const savedHistory = localStorage.getItem('searchHistory')
      const history: SearchHistoryItem[] = savedHistory ? JSON.parse(savedHistory) : []
      setSearchHistory(history)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch history'
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Add to search history
  const addToSearchHistory = useCallback(async (query: string) => {
    if (!query.trim()) return
    
    setIsLoading(true)
    setError(null)
    try {
      const newItem: SearchHistoryItem = {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: new Date().toISOString(),
      }
      
      setSearchHistory(prev => {
        // Remove duplicates and add new item at the beginning
        const filtered = prev.filter(item => 
          item.query.toLowerCase() !== query.toLowerCase()
        )
        return [newItem, ...filtered]
      })

      // Persist to localStorage (replace with API call in production)
      localStorage.setItem('searchHistory', JSON.stringify([newItem, ...searchHistory]))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save search'
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [searchHistory])

  // Clear all search history
  const clearSearchHistory = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setSearchHistory([])
      // Clear localStorage (replace with API call in production)
      localStorage.removeItem('searchHistory')
      toast({
        description: "Search history cleared",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear history'
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Delete a specific search item
  const deleteSearchItem = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      setSearchHistory(prev => prev.filter(item => item.id !== id))
      // Update localStorage (replace with API call in production)
      localStorage.setItem('searchHistory', JSON.stringify(
        searchHistory.filter(item => item.id !== id)
      ))
      toast({
        description: "Search item removed",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete item'
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [searchHistory])

  // The context value
  const value: SearchHistoryContextType = {
    searchHistory,
    fetchSearchHistory,
    clearSearchHistory,
    deleteSearchItem,
    addToSearchHistory,
    isLoading,
    error,
    saveSearch: addToSearchHistory,
    addSearch: addToSearchHistory,
    history: searchHistory
  }

  // Initial fetch on mount
  useEffect(() => {
    fetchSearchHistory()
  }, [fetchSearchHistory])

  return (
    <SearchHistoryContext.Provider value={value}>
      {children}
    </SearchHistoryContext.Provider>
  )
}

// Custom hook to use the search history context
export function useSearchHistory(): SearchHistoryContextType {
  const context = useContext(SearchHistoryContext)
  
  if (context === undefined) {
    throw new Error("useSearchHistory must be used within a SearchHistoryProvider")
  }
  
  return context
}