// components/Pagination.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  hasNext,
  hasPrevious,
  onPageChange,
  onNext,
  onPrevious,
  isLoading = false,
}: PaginationProps) {
  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate start and end pages to show
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      // Adjust if we're near the beginning or end
      if (currentPage <= 3) {
        endPage = Math.min(totalPages, 5);
      }
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
      }

      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push("...");
        }
      }

      // Add pages in range
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push("...");
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null; // Don't show pagination if there's only one page
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      {/* Results info */}
      <div className="text-sm text-white/70">
        Showing page {currentPage} of {totalPages} ({totalCount} total
        properties)
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={onPrevious}
          disabled={!hasPrevious || isLoading}
          className="flex items-center gap-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-white/50"
                >
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                disabled={isLoading}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  currentPage === page
                    ? "bg-[#FFD700] text-black font-medium"
                    : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={onNext}
          disabled={!hasNext || isLoading}
          className="flex items-center gap-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <div className="w-4 h-4 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div>
          Loading...
        </div>
      )}
    </div>
  );
}
