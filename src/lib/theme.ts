/**
 * theme.ts: light/dark theme helpers.
 * The default is to follow the OS (prefers-color-scheme). A manual choice is
 * stored in localStorage and reflected as data-theme on <html>, which the token
 * layer keys off. layout.tsx applies the stored choice before paint; these
 * helpers handle reads and toggles at runtime. No React here.
 */
export type ThemeChoice = "light" | "dark";

const THEME_KEY = "margin-theme";

/** The explicit choice the user has made, or null when following the OS. */
export function getStoredTheme(): ThemeChoice | null {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

/** True when the OS currently prefers dark. */
export function prefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/** The theme actually showing right now: the stored choice, else the OS. */
export function getEffectiveTheme(): ThemeChoice {
  return getStoredTheme() ?? (prefersDark() ? "dark" : "light");
}

/** Apply and persist an explicit theme choice. */
export function applyTheme(choice: ThemeChoice): void {
  try {
    document.documentElement.setAttribute("data-theme", choice);
    localStorage.setItem(THEME_KEY, choice);
  } catch {
    // If storage fails we still set the attribute above where possible.
  }
}

/** Flip to the opposite of whatever is showing and persist it. */
export function toggleTheme(): ThemeChoice {
  const next: ThemeChoice = getEffectiveTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}
