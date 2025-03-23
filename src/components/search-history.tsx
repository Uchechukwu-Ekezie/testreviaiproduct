// "use client"

// import { useState } from "react"
// import { useSearchHistory } from "@/contexts/search-history-context"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { Clock, Search, Trash2, X } from "lucide-react"
// import { formatDistanceToNow } from "date-fns"
// import { ScrollArea } from "@/components/ui/scroll-area"

// interface SearchHistoryProps {
//   onSelectQuery?: (query: string) => void
// }

// export function SearchHistory({ onSelectQuery }: SearchHistoryProps) {
//   const { history, isLoading, deleteSearchItem, clearSearchHistory } = useSearchHistory()
//   const [open, setOpen] = useState(false)
//   const [searchTerm, setSearchTerm] = useState("")

//   // Ensure history is always an array
//   const safeHistory = Array.isArray(history) ? history : []

//   const filteredHistory = searchTerm
//     ? safeHistory.filter(item => 
//         item?.query?.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     : safeHistory

//   const handleSelectQuery = (query: string) => {
//     if (onSelectQuery) {
//       onSelectQuery(query)
//       setOpen(false)
//     }
//   }

//   const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
//     e.stopPropagation() // Prevent triggering the parent click event
//     await deleteSearchItem(id)
//   }

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <Button 
//           variant="ghost" 
//           size="sm"
//           className="flex items-center gap-2 text-zinc-400 hover:text-zinc-300"
//         >
//           <Clock className="w-4 h-4" />
//           <span className="hidden sm:inline">Search History</span>
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-white">
//         <DialogHeader>
//           <DialogTitle className="text-xl">Search History</DialogTitle>
//         </DialogHeader>
        
//         <div className="relative my-4">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
//           <Input
//             placeholder="Filter search history..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10 bg-zinc-800 border-zinc-700 text-white"
//           />
//           {searchTerm && (
//             <Button
//               variant="ghost"
//               size="icon"
//               className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-zinc-400"
//               onClick={() => setSearchTerm("")}
//             >
//               <X className="h-4 w-4" />
//             </Button>
//           )}
//         </div>
        
//         {isLoading ? (
//           <div className="flex justify-center py-8 text-zinc-500">Loading...</div>
//         ) : filteredHistory.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
//             {searchTerm ? "No matching search history found" : "No search history yet"}
//           </div>
//         ) : (
//           <>
//             <ScrollArea className="h-[300px] rounded-md">
//               <div className="space-y-1">
//                 {filteredHistory.map((item) => (
//                   <div
//                     key={item.id}
//                     onClick={() => handleSelectQuery(item.query)}
//                     className="flex items-center justify-between p-3 rounded-md cursor-pointer group hover:bg-zinc-800"
//                   >
//                     <div className="flex-1 overflow-hidden">
//                       <p className="text-sm font-medium truncate text-zinc-200">{item.query}</p>
//                       <p className="text-xs text-zinc-500">
//                         {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
//                       </p>
//                     </div>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500"
//                       onClick={(e) => handleDeleteItem(e, item.id)}
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </Button>
//                   </div>
//                 ))}
//               </div>
//             </ScrollArea>
            
//             <div className="flex justify-end mt-4">
//               <Button
//                 variant="destructive"
//                 size="sm"
//                 disabled={isLoading || history.length === 0}
//                 onClick={clearSearchHistory}
//                 className="text-sm"
//               >
//                 Clear History
//               </Button>
//             </div>
//           </>
//         )}
//       </DialogContent>
//     </Dialog>
//   )
// } 