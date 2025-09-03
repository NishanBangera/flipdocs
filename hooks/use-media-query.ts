"use client"

import { useState, useEffect } from "react"

/**
 * Custom hook for media query matching
 * @param query - The media query string (e.g., "(max-width: 424px)")
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    
    setMatches(mql.matches)
    mql.addEventListener("change", onChange)
    
    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return matches
}