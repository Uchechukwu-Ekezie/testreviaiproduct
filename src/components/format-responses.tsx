// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';

// const MarkdownRenderer = ({ content }: { content: string }) => {
//     return (
//       <ReactMarkdown 
//         remarkPlugins={[remarkGfm]}
//         components={{
//           // Customize how markdown elements are rendered
//           h1: ({ node, ...props }) => <h1 className="my-4 text-2xl font-bold" {...props} />,
//           h2: ({ node, ...props }) => <h2 className="my-3 text-xl font-bold" {...props} />,
//           p: ({ node, ...props }) => <p className="mb-3" {...props} />,
//           ul: ({ node, ...props }) => <ul className="pl-5 mb-3 list-disc" {...props} />,
//           ol: ({ node, ...props }) => <ol className="pl-5 mb-3 list-decimal" {...props} />,
//           li: ({ node, ...props }) => <li className="mb-1" {...props} />,
//           strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
//           em: ({ node, ...props }) => <em className="italic" {...props} />,
//           a: ({ node, ...props }) => (
//             <a 
//               className="text-blue-500 hover:underline" 
//               target="_blank" 
//               rel="noopener noreferrer" 
//               {...props} 
//             />
//           ),
//           code: ({ node, inline, className, children, ...props }) => {
//             const match = /language-(\w+)/.exec(className || '');
//             return !inline && match ? (
//               <div className="p-3 my-2 overflow-x-auto bg-gray-800 rounded-lg">
//                 <code className={`language-${match[1]}`} {...props}>
//                   {children}
//                 </code>
//               </div>
//             ) : (
//               <code className="px-1 text-sm bg-gray-200 rounded" {...props}>
//                 {children}
//               </code>
//             );
//           },
//         }}
//       >
//         {content}
//       </ReactMarkdown>
//     );
//   };