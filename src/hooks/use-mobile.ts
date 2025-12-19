"use client";

import { useState, useEffect } from "react";

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const mediaQuery = window.matchMedia(query);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  // Return false during SSR and initial render to prevent hydration mismatch
  if (!hasMounted) {
    return false;
  }

  return matches;
};

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true);
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768) // Consider screens smaller than 768px as mobile
    }

    checkIsMobile()

    window.addEventListener("resize", checkIsMobile)

    return () => {
      window.removeEventListener("resize", checkIsMobile)
    }
  }, [])

  // Return false during SSR and initial render to prevent hydration mismatch
  if (!hasMounted) {
    return false;
  }

  return isMobile
}
