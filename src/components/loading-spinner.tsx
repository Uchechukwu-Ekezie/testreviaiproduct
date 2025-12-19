// components/loading-spinner.tsx
export default function LoadingSpinner({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white/80 text-sm">{message}</p>
      </div>
    </div>
  );
}
