// // hooks/useSearch.ts
// "use client"

// import { useState, useCallback } from "react";
// import { searchAPI } from "@/lib/api";
// import { useSearchHistory } from "@/contexts/search-history-context";
// import { useSession } from "next-auth/react";
// import { toast } from "@/components/ui/use-toast";

// export const useSearch = () => {
//   const { data: session } = useSession();
//   const userId = session?.user?.id;
//   const {
//     searchHistory,
//     saveSearch,
//     removeSearchItem,
//     clearHistory,
//     isLoading: isHistoryLoading,
//   } = useSearchHistory();

//   const [searchResults, setSearchResults] = useState<any[]>([]);
//   const [isSearching, setIsSearching] = useState(false);
//   const [searchError, setSearchError] = useState<string | null>(null);

//   // Perform search and save to history
//   const performSearch = useCallback(
//     async (query: string) => {
//       if (!query.trim()) {
//         setSearchResults([]);
//         return;
//       }

//       setIsSearching(true);
//       setSearchError(null);

//       try {
//         // Perform the actual search
//         const results = await searchAPI.searchChatSessions(query, userId);
//         setSearchResults(results);

//         // Save to search history if user is authenticated
//         if (userId) {
//           try {
//             await searchAPI.postSearchHistory({
//               user: userId,
//               query,
//               chat_session: "", // Add session ID if applicable
//             });
//             saveSearch(query);
//           } catch (historyError) {
//             console.error("Failed to save search history:", historyError);
//           }
//         }
//       } catch (error: any) {
//         console.error("Search failed:", error);
//         setSearchError(error.message || "Failed to perform search");
//         toast({
//           title: "Search Error",
//           description: error.response?.data?.message || "An error occurred during search",
//           variant: "destructive",
//         });
//       } finally {
//         setIsSearching(false);
//       }
//     },
//     [userId, saveSearch]
//   );

//   // Load user's search history from API
//   const loadUserSearchHistory = useCallback(async () => {
//     if (!userId) return;

//     try {
//       const allHistory = await searchAPI.getSearchHistories();
//       const history = allHistory.filter(item => item.user === userId);
//       // You might want to sync this with your context
//       return history;
//     } catch (error) {
//       console.error("Failed to load user search history:", error);
//       return [];
//     }
//   }, [userId]);

//   // Delete a search history item from both API and context
//   const deleteHistoryItem = useCallback(
//     async (id: string) => {
//       try {
//         if (userId) {
//           await searchAPI.deleteSearchHistory(id);
//         }
//         await removeSearchItem(id);
//         toast({
//           description: "Search item removed",
//         });
//       } catch (error) {
//         console.error("Failed to delete search history item:", error);
//         toast({
//           title: "Error",
//           description: "Failed to delete search item",
//           variant: "destructive",
//         });
//       }
//     },
//     [userId, removeSearchItem]
//   );
//   // Clear all search history from both API and context
//   const clearAllHistory = useCallback(async () => {
//     try {
//       if (userId) {
//         // This assumes your API supports bulk delete or clearing by user
//         // You might need to implement this endpoint
//         const allHistory = await searchAPI.getSearchHistories();
//         const userHistory = allHistory.filter(item => item.user === userId);
//         await Promise.all(userHistory.map((item: any) => 
//           searchAPI.deleteSearchHistory(item.id)
//         ));
//       }
//       }
//       await clearHistory();
//       toast({
//         description: "Search history cleared",
//       });
//     } catch (error) {
//       console.error("Failed to clear search history:", error);
//       toast({
//         title: "Error",
//         description: "Failed to clear search history",
//         variant: "destructive",
//       });
//     }
//   }, [userId, clearHistory]);

//   return {
//     searchResults,
//     performSearch,
//     isSearching,
//     searchError,
//     searchHistory,
//     loadUserSearchHistory,
//     deleteHistoryItem,
//     clearAllHistory,
//     isHistoryLoading,
//   };
// };