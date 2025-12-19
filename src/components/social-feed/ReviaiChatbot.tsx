// "use client";

// import React, { useState, useRef } from "react";
// import { Button } from "@/components/ui/button";
// import {
//     X,
//     Search,
//     FileCheck,
//     Home,
//     TrendingUp
// } from "lucide-react";
// import ChatMessages from "@/components/chatpage/chat-message";
// import ChatInput from "@/components/chatpage/chat-input";

// interface ReviaiChatbotProps {
//     isOpen: boolean;
//     onClose: () => void;
//     chatMessage: string;
//     setChatMessage: React.Dispatch<React.SetStateAction<string>>;
//     isMobile?: boolean;
// }

// export default function ReviaiChatbot({
//     isOpen,
//     onClose,
//     chatMessage,
//     setChatMessage,
//     isMobile = false
// }: ReviaiChatbotProps) {
//     // Chat state
//     const [messages, setMessages] = useState<any[]>([]);
//     const [isLoading, setIsLoading] = useState(false);
//     const [activeSession, setActiveSession] = useState<string | null>(null);
//     const [sessions, setSessions] = useState<any[]>([]);
//     const messagesEndRef = useRef<HTMLDivElement>(null);
//     const [latestMessageId, setLatestMessageId] = useState<string | null>(null);

//     // Mock action cards for the chatbot
//     const actionCards = [
//         {
//             title: "Find a Property",
//             description: "Search for homes to rent or buy.",
//             image: "🏡",
//             message: "I want to find a property"
//         },
//         {
//             title: "Verify a Landlord",
//             description: "Check credentials and reviews.",
//             image: "🚨",
//             message: "I want to verify a landlord"
//         },
//         {
//             title: "Tell Your Story",
//             description: "Give your experience on a property.",
//             image: "✍️",
//             message: "I want to tell my story"
//         },
//         {
//             title: "Around You",
//             description: "Discover nearby amenities and more.",
//             image: "🗺️",
//             message: "What's around me?"
//         }
//     ];

//     // Mock chat submit handler
//     const handleChatSubmit = async (e: React.FormEvent, options?: { imageUrls?: string[]; file?: File }) => {
//         e.preventDefault();

//         if (!chatMessage.trim()) return;

//         setIsLoading(true);

//         // Create a temporary message
//         const tempMessage = {
//             id: `temp-${Date.now()}`,
//             prompt: chatMessage,
//             response: "",
//             session: activeSession || "property-chat",
//             timestamp: new Date().toISOString()
//         };

//         setMessages(prev => [...prev, tempMessage]);
//         setChatMessage("");

//         // Simulate AI response
//         setTimeout(() => {
//             const response = `I understand you're looking for help with "${chatMessage}". I'm here to assist you with property-related questions. How can I help you further?`;

//             setMessages(prev =>
//                 prev.map(msg =>
//                     msg.id === tempMessage.id
//                         ? { ...msg, response }
//                         : msg
//                 )
//             );
//             setIsLoading(false);
//         }, 1500);
//     };

//     if (!isOpen) return null;

//     // Responsive design - sidebar on desktop, bottom sheet on mobile
//     return (
//         <div className="fixed inset-0 z-50 lg:relative lg:inset-auto lg:w-[500px] lg:h-screen bg-[#1a1a1a] flex flex-col">
//             {/* Mobile backdrop */}
//             <div
//                 className="lg:hidden absolute inset-0 bg-black/50"
//                 onClick={onClose}
//             />

//             {/* Chatbot container */}
//             <div className="relative lg:relative bg-[#1a1a1a] flex flex-col h-[85vh] lg:h-screen w-full lg:w-[500px] lg:rounded-none rounded-t-3xl mt-auto lg:mt-0">
//             {/* Mobile drag handle */}
//             <div className="lg:hidden flex justify-center pt-3 pb-2">
//                 <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
//             </div>

//             {/* Header */}
//             <div className="flex items-center justify-between px-4 py-3 lg:p-4 border-b border-[#2a2a2a] bg-[#2a2a2a]">
//                 <h3 className="text-base lg:text-lg font-semibold text-white text-center flex-1">Reviai Assistant</h3>
//                 <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={onClose}
//                     className="text-white hover:bg-[#3a3a3a] p-1 w-8 h-8 lg:w-10 lg:h-10"
//                 >
//                     <X className="w-4 h-4" />
//                 </Button>
//             </div>

//             {/* Chat Messages Area */}
//             <div className="flex-1 overflow-hidden">
//                 <div className="flex flex-col w-full h-full">
//                     {/* Search Bar */}
//                     <div className="px-3 py-2 lg:p-3 lg:p-4 border-b border-[#2a2a2a]">
//                         <div className="relative">
//                             <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
//                                 <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                                 </svg>
//                             </div>
//                             <input
//                                 type="text"
//                                 placeholder="Search"
//                                 className="w-full pl-10 pr-10 py-2.5 lg:py-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary text-sm lg:text-base"
//                             />
//                             <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                                 <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//                                 </svg>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Revi AI Chat Box Button */}
//                     <div className="flex justify-center px-3 py-2 lg:p-3 lg:p-4">
//                         <button className="flex items-center gap-2 px-3 py-2 lg:px-4 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white hover:bg-[#3a3a3a] transition-colors">
//                             <span className="text-xs lg:text-sm">Revi ai chat box</span>
//                             <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
//                             </svg>
//                         </button>
//                     </div>

//                     {/* Main Content */}
//                     <div className="flex-1 overflow-y-auto px-3 py-2 lg:p-3 lg:p-4">
//                         {messages.length === 0 ? (
//                             <div className="flex flex-col items-center justify-center h-full">
//                                 {/* Greeting */}
//                                 <h2 className="text-base lg:text-xl font-semibold text-white mb-4 lg:mb-8 px-2 text-center">Hi! How can I assist you today?</h2>

//                                 {/* Action Cards Grid */}
//                                 <div className="grid grid-cols-2 gap-2.5 lg:gap-4 w-full max-w-xs lg:max-w-md">
//                                     {actionCards.map((card, index) => (
//                                         <button
//                                             key={index}
//                                             onClick={() => {
//                                                 setChatMessage(card.message);
//                                                 handleChatSubmit(new Event('submit') as any);
//                                             }}
//                                             className="flex flex-col items-center p-2.5 lg:p-4 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-colors text-center min-h-[100px] lg:min-h-[120px]"
//                                         >
//                                             <span className="text-xl lg:text-3xl mb-1.5 lg:mb-2">{card.image}</span>
//                                             <h3 className="font-medium text-white text-xs lg:text-sm mb-1 leading-tight">{card.title}</h3>
//                                             <p className="text-xs text-gray-400 leading-tight">{card.description}</p>
//                                         </button>
//                                     ))}
//                                 </div>
//                             </div>
//                         ) : (
//                             /* Messages */
//                             <div className="space-y-4">
//                                 {messages.map((message, index) => (
//                                     <div key={message.id || index} className="space-y-2">
//                                         {/* User Message */}
//                                         {message.prompt && (
//                                             <div className="flex justify-end">
//                                                 <div className="max-w-[80%] bg-primary text-primary-foreground rounded-lg p-3">
//                                                     <p className="text-sm">{message.prompt}</p>
//                                                 </div>
//                                             </div>
//                                         )}

//                                         {/* AI Response */}
//                                         {message.response && (
//                                             <div className="flex justify-start">
//                                                 <div className="max-w-[80%] bg-[#2a2a2a] text-white rounded-lg p-3">
//                                                     <p className="text-sm">{message.response}</p>
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </div>
//                                 ))}

//                                 {/* Loading indicator */}
//                                 {isLoading && (
//                                     <div className="flex justify-start">
//                                         <div className="bg-[#2a2a2a] text-white rounded-lg p-3">
//                                             <div className="flex items-center gap-2">
//                                                 <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
//                                                 <span className="text-sm">Thinking...</span>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 )}

//                                 <div ref={messagesEndRef} className="h-4" />
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* Chat Input Component */}
//             <ChatInput
//                 input={chatMessage}
//                 setInput={setChatMessage}
//                 handleSubmit={handleChatSubmit}
//                 isLoading={isLoading}
//                 isMobile={isMobile}
//                 activeSession={activeSession}
//                 sidebarCollapsed={false}
//             />
//             </div>
//         </div>
//     );
// }
