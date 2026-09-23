/**
 * ThemeToggle: flips between light and dark and remembers the choice.
 * The icon reflects what a click will switch to (a moon when light, a sun when
 * dark). It reads the current effective theme on mount so it stays in sync with
 * the pre-paint script in layout.tsx and with the OS default.
 */
"use client";

import { useEffect, useState } from "react";
import { getEffectiveTheme, toggleTheme, type ThemeChoice } from "@/lib/theme";
import { Button } from "@/components/ui/Button";

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle
        cx="8"
        cy="8"
        r="3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9 13 13M13 3l-1.1 1.1M4.1 11.9 3 13" />
      </g>
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeChoice>("light");

  useEffect(() => {
    setTheme(getEffectiveTheme());
  }, []);

  const isDark = theme === "dark";
  const nextLabel = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <Button
      onClick={() => setTheme(toggleTheme())}
      aria-label={nextLabel}
      title={nextLabel}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
