/**
 * use-media-query.ts: subscribe to a CSS media query in React.
 * Used to switch the suggestion card and score panel between a popover and a
 * bottom sheet at the mobile breakpoint. Returns false during SSR and until the
 * first client effect runs, so the desktop layout is the safe default.
 */
"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
