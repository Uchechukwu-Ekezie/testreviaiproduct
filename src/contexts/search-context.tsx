"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SearchFilters {
  location: string;
  coordinates: { lat: number; lng: number } | null;
  priceRange: string;
  bedrooms: string;
  propertyType: string;
  query: string;
  isAddedByAgent?: boolean;
}

interface SearchContextType {
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  isFiltered: boolean;
}

const defaultFilters: SearchFilters = {
  location: "",
  coordinates: null,
  priceRange: "",
  bedrooms: "Any",
  propertyType: "",
  query: "",
  isAddedByAgent: false,
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<SearchFilters>(defaultFilters);

  const setFilters = (newFilters: Partial<SearchFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFiltersState(defaultFilters);
  };

  const isFiltered = Object.keys(filters).some((key) => {
    const value = filters[key as keyof SearchFilters];
    if (key === "bedrooms") return value !== "Any";
    if (key === "coordinates") return value !== null;
    if (key === "isAddedByAgent") return value === true;
    return value !== "" && value !== defaultFilters[key as keyof SearchFilters];
  });

  return (
    <SearchContext.Provider
      value={{ filters, setFilters, clearFilters, isFiltered }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
