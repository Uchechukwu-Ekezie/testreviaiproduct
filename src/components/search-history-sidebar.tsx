"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchHistory } from "@/contexts/search-history-context"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { X, Clock, Loader2 } from "lucide-react"

export function SearchHistorySidebar() {
  const { history, fetchSearchHistory, clearSearchHistory, deleteSearchItem } = useSearchHistory()
  const [isLoading, setIsLoading] = useState(true)
  const [isClearingHistory, setIsClearingHistory] = useState(false)
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set())
  const [didInitialFetch, setDidInitialFetch] = useState(false)
  const router = useRouter()

  // Fetch data on mount only
  useEffect(() => {
    let isMounted = true;
    
    if (!didInitialFetch) {
      const loadHistory = async () => {
        if (!isMounted) return;
        
        setIsLoading(true);
        try {
          await fetchSearchHistory();
        } catch (error) {
          console.error("Failed to fetch search history:", error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
            setDidInitialFetch(true);
          }
        }
      };

      loadHistory();
    }
    
    return () => {
      isMounted = false;
    };
  }, [fetchSearchHistory, didInitialFetch]);

  const handleItemClick = useCallback((query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }, [router]);

  const handleClearHistory = useCallback(async () => {
    if (isClearingHistory) return;
    
    setIsClearingHistory(true);
    try {
      await clearSearchHistory();
      toast({
        description: "Search history cleared",
      });
    } catch (error) {
      console.error("Failed to clear search history:", error);
      toast({
        title: "Error",
        description: "Failed to clear search history",
        variant: "destructive",
      });
    } finally {
      setIsClearingHistory(false);
    }
  }, [clearSearchHistory, isClearingHistory]);

  const handleDeleteItem = useCallback(async (id: string) => {
    if (deletingItems.has(id)) return;
    
    setDeletingItems(prev => new Set(prev).add(id));
    
    try {
      await deleteSearchItem(id);
      toast({
        description: "Search item removed",
      });
    } catch (error) {
      console.error(`Failed to delete search history item ${id}:`, error);
      toast({
        title: "Error",
        description: "Failed to delete search item",
        variant: "destructive",
      });
    } finally {
      setDeletingItems(prev => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
    }
  }, [deleteSearchItem, deletingItems]);

  if (history.length === 0 && !isLoading) {
    return null; // Don't render anything if there's no history
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <div className="flex items-center px-2 py-1 text-xs font-medium text-zinc-400">
          <Clock className="w-3 h-3 mr-1" />
          Search History
        </div>
        {history.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearHistory}
            disabled={isClearingHistory}
            className="h-6 px-2 text-xs text-zinc-400 hover:text-zinc-300"
          >
            {isClearingHistory ? "Clearing..." : "Clear all"}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="px-2 space-y-2">
          <Skeleton className="w-full h-6 bg-zinc-800" />
          <Skeleton className="w-full h-6 bg-zinc-800" />
          <Skeleton className="w-full h-6 bg-zinc-800" />
        </div>
      ) : (
        <ul className="space-y-1">
          {history.slice(0, 5).map((item) => (
            <li key={item.id}>
              <div 
                className="flex items-center justify-between px-2 py-2 text-sm rounded-md cursor-pointer text-zinc-400 hover:bg-zinc-800/50"
                onClick={() => handleItemClick(item.query)}
              >
                <span className="truncate max-w-[80%]">{item.query}</span>
                {deletingItems.has(item.id) ? (
                  <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />
                ) : (
                  <X 
                    className="w-3 h-3 text-zinc-500 hover:text-zinc-300" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.id);
                    }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 