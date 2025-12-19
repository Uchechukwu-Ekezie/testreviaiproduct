// "use client";

// import React, { useCallback, useRef, useState, useMemo } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";
// import { Users } from "lucide-react";
// import { useRouter } from "next/navigation";

// interface SocialFeedMessageProps {
//   isAuthenticated: boolean;
//   sidebarCollapsed?: boolean;
//   sidebarOpen?: boolean;
// }

// const SocialFeedMessage: React.FC<SocialFeedMessageProps> = React.memo(({
//   isAuthenticated,
//   sidebarCollapsed = false,
//   sidebarOpen = false,
// }) => {
//   const router = useRouter();
//   const [hasMessages, setHasMessages] = useState(false);
//   const [shouldMoveUp, setShouldMoveUp] = useState(false);
//   const lastScrollPositionRef = useRef<number>(0);

//   // Mock action cards for social feed
//   const actionCards = useMemo(() => [
//     {
//       id: "property-search",
//       title: "Find Properties",
//       description: "Search for properties in your area",
//       icon: "🏠",
//       color: "bg-blue-500",
//     },
//     {
//       id: "neighborhood-insights",
//       title: "Neighborhood Insights",
//       description: "Get insights about local areas",
//       icon: "📍",
//       color: "bg-green-500",
//     },
//     {
//       id: "agent-connect",
//       title: "Connect with Agents",
//       description: "Find and connect with real estate agents",
//       icon: "🤝",
//       color: "bg-purple-500",
//     },
//     {
//       id: "market-analysis",
//       title: "Market Analysis",
//       description: "Analyze real estate market trends",
//       icon: "📊",
//       color: "bg-orange-500",
//     },
//   ], []);

//   const handleCardClick = useCallback((card: any) => {
//     // Handle card click - could navigate to different pages or show modals
//     console.log("Card clicked:", card);
//   }, []);

//   return (
//     <div className="flex flex-col h-full">
//       {/* Social Feed Button - Fixed at top when no messages */}
//       {isAuthenticated && !hasMessages && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.3, delay: 0.05 }}
//           className="w-full max-w-[143px] mx-auto mb-6"
//         >
//           <Button
//             onClick={() => router.push("/social-feed")}
//             className="w-full text-white font-medium py-3 rounded-[15px] transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 relative overflow-hidden"
//             style={{
//               background: 'linear-gradient(#141414, #141414) padding-box, linear-gradient(45deg, #FFD700, #780991) border-box',
//               border: '2px solid transparent'
//             }}
//           >
//             View Social Feed
//           </Button>
//         </motion.div>
//       )}

//       {/* Social Feed Button - Fixed at top when has messages */}
//       {isAuthenticated && hasMessages && (
//         <motion.div
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.3 }}
//           className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-[200px]"
//         >
//           <Button
//             onClick={() => router.push("/social-feed")}
//             className="w-full text-white font-medium py-2 px-4 rounded-[15px] transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 relative overflow-hidden text-sm"
//             style={{
//               background: 'linear-gradient(#141414, #141414) padding-box, linear-gradient(45deg, #FFD700, #780991) border-box',
//               border: '2px solid transparent'
//             }}
//           >
//             View Social Feed
//           </Button>
//         </motion.div>
//       )}

//       {/* Action Cards */}
//       <div className="flex-1 flex items-center justify-center p-4">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full">
//           {actionCards.map((card, index) => (
//             <motion.div
//               key={card.id}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.3, delay: index * 0.1 }}
//               className="group"
//             >
//               <Button
//                 onClick={() => handleCardClick(card)}
//                 className={cn(
//                   "w-full h-32 flex flex-col items-center justify-center gap-3 p-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg",
//                   card.color,
//                   "text-white hover:brightness-110"
//                 )}
//               >
//                 <div className="text-3xl">{card.icon}</div>
//                 <div className="text-center">
//                   <h3 className="font-semibold text-lg">{card.title}</h3>
//                   <p className="text-sm opacity-90">{card.description}</p>
//                 </div>
//               </Button>
//             </motion.div>
//           ))}
//         </div>
//       </div>

//       {/* Social Feed Content Placeholder */}
//       <div className="p-4 text-center text-gray-400">
//         <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
//         <p className="text-sm">Connect with the community and discover properties</p>
//       </div>
//     </div>
//   );
// });

// SocialFeedMessage.displayName = "SocialFeedMessage";

// export default SocialFeedMessage;