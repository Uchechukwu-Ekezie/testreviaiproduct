// "use client";

// import React, { useRef, useState, useEffect, useCallback } from "react";
// import { PaperclipIcon, ImageIcon, X, Plus } from "lucide-react";
// import Image from "next/image";
// import { toast } from "@/components/ui/use-toast";
// import { cn } from "@/lib/utils";
// import arrow from "../../../public/Image/arrow-up.svg";
// import { motion, AnimatePresence } from "framer-motion";

// interface ChatInputProps {
//   input: string;
//   setInput: React.Dispatch<React.SetStateAction<string>>;
//   handleSubmit: (
//     e: React.FormEvent,
//     options?: { imageUrls?: string[]; file?: File }
//   ) => void;
//   isLoading: boolean;
//   isMobile: boolean;
//   sidebarCollapsed: boolean;
//   handleStop?: () => void;
// }

// const ChatInput: React.FC<ChatInputProps> = React.memo(
//   ({
//     input,
//     setInput,
//     handleSubmit,
//     isLoading,
//     isMobile,
//     sidebarCollapsed,
//     handleStop,
//   }) => {
//     const textareaRef = useRef<HTMLTextAreaElement>(null);
//     const imageInputRef = useRef<HTMLInputElement>(null);
//     const attachmentInputRef = useRef<HTMLInputElement>(null);
//     const modalRef = useRef<HTMLDivElement>(null);

//     const [images, setImages] = useState<File[]>([]);
//     const [imagePreviews, setImagePreviews] = useState<string[]>([]);
//     const [imageUrls, setImageUrls] = useState<string[]>([]);
//     const [attachments, setAttachments] = useState<File[]>([]);
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [isStopping, setIsStopping] = useState(false);
//     const [uploadingImages, setUploadingImages] = useState<boolean[]>([]);

//     const uploadToCloudinary = useCallback(async (file: File): Promise<string> => {
//       try {
//         const formData = new FormData();
//         formData.append("file", file);
//         formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_TWO || "reviews");
//         formData.append("folder", "chat_images");

//         const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
//         if (!cloudName) throw new Error("Cloudinary cloud name missing");

//         const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
//           method: "POST",
//           body: formData,
//         });

//         if (!res.ok) {
//           const err = await res.json();
//           throw new Error(err.error?.message || "Upload failed");
//         }

//         const data = await res.json();
//         return data.secure_url;
//       } catch (error) {
//         console.error("Cloudinary error:", error);
//         throw error;
//       }
//     }, []);

//     const autoResize = useCallback(() => {
//       if (textareaRef.current) {
//         textareaRef.current.style.height = "auto";
//         textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
//       }
//     }, []);

//     useEffect(() => {
//       const timer = setTimeout(autoResize, 0);
//       return () => clearTimeout(timer);
//     }, [input, autoResize]);

//     const handleChange = useCallback(
//       (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//         setInput(e.target.value);
//       },
//       [setInput]
//     );

//     const handleLocalSubmit = useCallback(
//       async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!input.trim() && images.length === 0 && attachments.length === 0) return;

//         if (uploadingImages.some((u) => u)) {
//           toast({ title: "Uploading...", description: "Please wait for images to finish uploading." });
//           return;
//         }

//         const options: { imageUrls?: string[]; file?: File } = {};
//         if (imageUrls.length > 0) options.imageUrls = imageUrls;
//         if (attachments.length > 0) options.file = attachments[0];

//         try {
//           handleSubmit(e, Object.keys(options).length > 0 ? options : undefined);
//           setImages([]);
//           setImagePreviews((prev) => {
//             prev.forEach(URL.revokeObjectURL);
//             return [];
//           });
//           setImageUrls([]);
//           setUploadingImages([]);
//           setAttachments([]);
//           setInput("");
//         } catch (error) {
//           console.error("Submit error:", error);
//         }
//       },
//       [handleSubmit, input, images, attachments, uploadingImages, imageUrls, setInput]
//     );

//     const handleStopGenerating = useCallback(() => {
//       setIsStopping(true);
//       handleStop?.();
//     }, [handleStop]);

//     const handleImageUpload = useCallback(
//       async (e: React.ChangeEvent<HTMLInputElement>) => {
//         const files = e.target.files;
//         if (!files) return;

//         const valid = Array.from(files).filter((f) => {
//           if (!f.type.startsWith("image/")) {
//             toast({ title: "Invalid", description: `${f.name} is not an image.`, variant: "destructive" });
//             return false;
//           }
//           if (f.size > 10 * 1024 * 1024) {
//             toast({ title: "Too large", description: `${f.name} > 10MB.`, variant: "destructive" });
//             return false;
//           }
//           return true;
//         });

//         if (valid.length === 0) return;

//         const previews = valid.map(URL.createObjectURL);
//         const startIdx = images.length;

//         setImages((p) => [...p, ...valid]);
//         setImagePreviews((p) => [...p, ...previews]);
//         setUploadingImages((p) => [...p, ...valid.map(() => true)]);

//         toast({ title: "Uploading", description: `Uploading ${valid.length} image(s)...` });

//         const results = await Promise.allSettled(
//           valid.map(async (file, i) => {
//             const idx = startIdx + i;
//             try {
//               const url = await uploadToCloudinary(file);
//               setImageUrls((p) => {
//                 const n = [...p];
//                 n[idx] = url;
//                 return n;
//               });
//               return { success: true };
//             } catch {
//               return { success: false };
//             } finally {
//               setUploadingImages((p) => {
//                 const n = [...p];
//                 n[idx] = false;
//                 return n;
//               });
//             }
//           })
//         );

//         const success = results.filter((r) => r.status === "fulfilled" && (r as any).value.success).length;
//         const failed = valid.length - success;

//         toast({
//           title: success > 0 ? "Uploaded" : "Failed",
//           description: `${success} uploaded${failed > 0 ? `, ${failed} failed` : ""}.`,
//           variant: success > 0 ? "default" : "destructive",
//         });
//       },
//       [images.length, uploadToCloudinary]
//     );

//     const handleAttachmentUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
//       const files = e.target.files;
//       if (!files) return;

//       const allowed = new Set([
//         "application/pdf",
//         "application/msword",
//         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//         "text/plain",
//         "text/csv",
//         "application/vnd.ms-excel",
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       ]);

//       const valid = Array.from(files).filter((f) => {
//         if (!allowed.has(f.type)) {
//           toast({ title: "Invalid type", description: `${f.name} not supported.`, variant: "destructive" });
//           return false;
//         }
//         if (f.size > 25 * 1024 * 1024) {
//           toast({ title: "Too large", description: `${f.name} > 25MB.`, variant: "destructive" });
//           return false;
//         }
//         return true;
//       });

//       if (valid.length > 0) {
//         setAttachments((p) => [...p, ...valid]);
//         toast({ title: "Attached", description: `${valid.length} file(s) added.` });
//       }
//     }, []);

//     const removeImage = useCallback((i: number) => {
//       if (imagePreviews[i]) URL.revokeObjectURL(imagePreviews[i]);
//       setImages((p) => p.filter((_, idx) => idx !== i));
//       setImagePreviews((p) => p.filter((_, idx) => idx !== i));
//       setImageUrls((p) => p.filter((_, idx) => idx !== i));
//       setUploadingImages((p) => p.filter((_, idx) => idx !== i));
//     }, [imagePreviews]);

//     const removeAttachment = useCallback((i: number) => {
//       setAttachments((p) => p.filter((_, idx) => idx !== i));
//     }, []);

//     useEffect(() => {
//       return () => imagePreviews.forEach(URL.revokeObjectURL);
//     }, [imagePreviews]);

//     useEffect(() => {
//       const clickOutside = (e: MouseEvent) => {
//         if (isModalOpen && modalRef.current && !modalRef.current.contains(e.target as Node)) {
//           setIsModalOpen(false);
//         }
//       };
//       if (isModalOpen) document.addEventListener("mousedown", clickOutside);
//       return () => document.removeEventListener("mousedown", clickOutside);
//     }, [isModalOpen]);

//     return (
//       <div className="fixed bg-transparent bottom-0 left-0 right-0 z-40">
//         <div className="flex justify-center w-full px-4 py-4">
//           <div className="w-full max-w-4xl">
//             <form onSubmit={handleLocalSubmit} className="space-y-3">
//               {/* Upload Status */}
//               <AnimatePresence>
//                 {uploadingImages.some(Boolean) && (
//                   <motion.div
//                     initial={{ opacity: 0, y: -10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -10 }}
//                     className="flex items-center gap-2 p-3 text-sm rounded-lg bg-yellow-900/20 border border-yellow-800 text-yellow-300"
//                   >
//                     <div className="w-4 h-4 border-2 border-yellow-500 rounded-full border-t-transparent animate-spin" />
//                     Uploading images...
//                   </motion.div>
//                 )}
//               </AnimatePresence>

//               {/* Main Input Card */}
//               <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 shadow-2xl">
//                 <textarea
//                   ref={textareaRef}
//                   placeholder="Ask me anything about real estate..."
//                   value={input}
//                   onChange={handleChange}
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter" && !e.shiftKey) {
//                       e.preventDefault();
//                       handleLocalSubmit(e);
//                     }
//                   }}
//                   disabled={isLoading}
//                   rows={1}
//                   className="w-full bg-transparent text-white placeholder:text-gray-500 resize-none focus:outline-none text-base leading-relaxed max-h-48 scrollbar-thin scrollbar-thumb-gray-600"
//                 />

//                 {/* Image Previews */}
//                 <AnimatePresence>
//                   {images.length > 0 && (
//                     <motion.div
//                       initial={{ opacity: 0 }}
//                       animate={{ opacity: 1 }}
//                       exit={{ opacity: 0 }}
//                       className="flex flex-wrap gap-3 mt-3"
//                     >
//                       {images.map((img, i) => (
//                         <motion.div
//                           key={i}
//                           initial={{ scale: 0.8 }}
//                           animate={{ scale: 1 }}
//                           exit={{ scale: 0.8 }}
//                           className="relative group"
//                         >
//                           <Image
//                             src={imagePreviews[i]}
//                             alt="preview"
//                             width={80}
//                             height={80}
//                             className={cn(
//                               "rounded-lg object-cover border border-[#2A2A2A]",
//                               uploadingImages[i] && "opacity-50"
//                             )}
//                           />
//                           {uploadingImages[i] && (
//                             <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
//                               <div className="w-6 h-6 border-2 border-white rounded-full border-t-transparent animate-spin" />
//                             </div>
//                           )}
//                           {imageUrls[i] && !uploadingImages[i] && (
//                             <div className="absolute top-1 left-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
//                               <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
//                                 <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                               </svg>
//                             </div>
//                           )}
//                           <button
//                             type="button"
//                             onClick={() => removeImage(i)}
//                             disabled={uploadingImages[i]}
//                             className={cn(
//                               "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all",
//                               uploadingImages[i]
//                                 ? "bg-gray-500 cursor-not-allowed"
//                                 : "bg-red-500 hover:bg-red-600"
//                             )}
//                           >
//                             <X className="w-4 h-4 text-white" />
//                           </button>
//                         </motion.div>
//                       ))}
//                     </motion.div>
//                   )}
//                 </AnimatePresence>

//                 {/* File Attachments */}
//                 <AnimatePresence>
//                   {attachments.length > 0 && (
//                     <motion.div
//                       initial={{ opacity: 0 }}
//                       animate={{ opacity: 1 }}
//                       exit={{ opacity: 0 }}
//                       className="flex flex-wrap gap-2 mt-2"
//                     >
//                       {attachments.map((file, i) => (
//                         <motion.div
//                           key={i}
//                           initial={{ x: -20, opacity: 0 }}
//                           animate={{ x: 0, opacity: 1 }}
//                           className="flex items-center gap-2 px-3 py-2 bg-[#2A2A2A] rounded-lg text-sm"
//                         >
//                           <PaperclipIcon className="w-4 h-4 text-gray-400" />
//                           <span className="text-gray-300 max-w-32 truncate">{file.name}</span>
//                           <span className="text-gray-500">• {(file.size / 1024).toFixed(1)} KB</span>
//                           <button
//                             type="button"
//                             onClick={() => removeAttachment(i)}
//                             className="ml-1 p-1 rounded-full hover:bg-[#3A3A3A] transition"
//                           >
//                             <X className="w-3 h-3 text-gray-400" />
//                           </button>
//                         </motion.div>
//                       ))}
//                     </motion.div>
//                   )}
//                 </AnimatePresence>

//                 <input type="file" multiple hidden ref={imageInputRef} onChange={handleImageUpload} accept="image/*" />
//                 <input type="file" multiple hidden ref={attachmentInputRef} onChange={handleAttachmentUpload} accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx" />

//                 {/* Bottom Bar */}
//                 <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2A2A2A]">
//                   <div className="flex items-center gap-2">
//                     {/* Desktop Buttons */}
//                     <div className="hidden md:flex items-center gap-1">
//                       <motion.button
//                         type="button"
//                         onClick={() => imageInputRef.current?.click()}
//                         disabled={isLoading}
//                         className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#2A2A2A] transition text-gray-400 disabled:opacity-50"
//                         whileHover={{ scale: 1.05 }}
//                         whileTap={{ scale: 0.95 }}
//                       >
//                         <ImageIcon className="w-5 h-5" />
//                         <span className="text-sm">Image</span>
//                       </motion.button>
//                       <motion.button
//                         type="button"
//                         onClick={() => attachmentInputRef.current?.click()}
//                         disabled={isLoading}
//                         className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#2A2A2A] transition text-gray-400 disabled:opacity-50"
//                         whileHover={{ scale: 1.05 }}
//                         whileTap={{ scale: 0.95 }}
//                       >
//                         <PaperclipIcon className="w-5 h-5" />
//                         <span className="text-sm">Attach</span>
//                       </motion.button>
//                     </div>

//                     {/* Mobile Plus Button */}
//                     <button
//                       type="button"
//                       onClick={() => setIsModalOpen(true)}
//                       className="flex md:hidden items-center gap-2 text-gray-400"
//                     >
//                       <div className="w-8 h-8 rounded-full border-2 border-[#2A2A2A] flex items-center justify-center">
//                         <Plus className="w-5 h-5" />
//                       </div>
//                       <span className="text-sm">Add</span>
//                     </button>
//                   </div>

//                   {/* Submit Button */}
//                   <motion.button
//                     type="submit"
//                     disabled={
//                       (!input.trim() && images.length === 0 && attachments.length === 0) ||
//                       uploadingImages.some(Boolean)
//                     }
//                     className={cn(
//                       "w-11 h-11 rounded-full flex items-center justify-center transition-all",
//                       isLoading && !isStopping
//                         ? "bg-red-500 hover:bg-red-600"
//                         : uploadingImages.some(Boolean)
//                         ? "bg-yellow-500"
//                         : "bg-gradient-to-r from-[#FFD700] to-[#780991]"
//                     )}
//                     whileHover={{ scale: uploadingImages.some(Boolean) ? 1 : 1.05 }}
//                     whileTap={{ scale: uploadingImages.some(Boolean) ? 1 : 0.95 }}
//                   >
//                     {uploadingImages.some(Boolean) ? (
//                       <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" />
//                     ) : isLoading && !isStopping ? (
//                       <X className="w-5 h-5 text-white" />
//                     ) : (
//                       <Image src={arrow} alt="send" width={22} height={22} />
//                     )}
//                   </motion.button>
//                 </div>
//               </div>
//             </form>

//             {/* Mobile Modal */}
//             <AnimatePresence>
//               {isModalOpen && (
//                 <motion.div
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   exit={{ opacity: 0 }}
//                   className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center md:hidden"
//                   onClick={() => setIsModalOpen(false)}
//                 >
//                   <motion.div
//                     ref={modalRef}
//                     initial={{ y: 100 }}
//                     animate={{ y: 0 }}
//                     exit={{ y: 100 }}
//                     transition={{ type: "spring", damping: 25 }}
//                     className="w-full max-w-xs p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-t-2xl"
//                     onClick={(e) => e.stopPropagation()}
//                   >
//                     <div className="flex items-center justify-between mb-3">
//                       <h3 className="text-lg font-medium text-white">Add to message</h3>
//                       <button
//                         onClick={() => setIsModalOpen(false)}
//                         className="p-1 rounded-full hover:bg-[#2A2A2A]"
//                       >
//                         <X className="w-5 h-5 text-gray-400" />
//                       </button>
//                     </div>
//                     <div className="space-y-1">
//                       <button
//                         onClick={() => {
//                           imageInputRef.current?.click();
//                           setIsModalOpen(false);
//                         }}
//                         className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#2A2A2A] transition text-left"
//                       >
//                         <ImageIcon className="w-5 h-5 text-gray-400" />
//                         <span className="text-white">Upload Image</span>
//                       </button>
//                       <button
//                         onClick={() => {
//                           attachmentInputRef.current?.click();
//                           setIsModalOpen(false);
//                         }}
//                         className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#2A2A2A] transition text-left"
//                       >
//                         <PaperclipIcon className="w-5 h-5 text-gray-400" />
//                         <span className="text-white">Attach File</span>
//                       </button>
//                     </div>
//                   </motion.div>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </div>
//         </div>
//       </div>
//     );
//   },
//   (prev, next) =>
//     prev.input === next.input &&
//     prev.isLoading === next.isLoading &&
//     prev.isMobile === next.isMobile &&
//     prev.sidebarCollapsed === next.sidebarCollapsed
// );

// ChatInput.displayName = "ChatInput";

// export default ChatInput;
