"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface EmptyStateProps {
  searchQuery: string;
  onClearFilters: () => void;
}

export default function EmptyState({ searchQuery, onClearFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Users className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">No posts found</h3>
      <p className="text-zinc-400 mb-4">
        {searchQuery ? "Try adjusting your search terms" : "Be the first to share something!"}
      </p>
      <Button
        onClick={onClearFilters}
        className="border-zinc-700 text-zinc-400 hover:text-white"
      >
        Clear filters
      </Button>
    </div>
  );
}
