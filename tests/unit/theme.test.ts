/**
 * Unit tests for theme helpers: stored choice, OS preference, effective theme,
 * apply, and toggle.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getStoredTheme,
  prefersDark,
  getEffectiveTheme,
  applyTheme,
  toggleTheme,
} from "@/lib/theme";

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches }) as unknown as MediaQueryList),
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  vi.unstubAllGlobals();
});

describe("theme", () => {
  it("has no stored theme by default", () => {
    expect(getStoredTheme()).toBeNull();
  });

  it("applies and persists a choice", () => {
    applyTheme("dark");
    expect(getStoredTheme()).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("reads the OS preference when nothing is stored", () => {
    stubMatchMedia(true);
    expect(prefersDark()).toBe(true);
    expect(getEffectiveTheme()).toBe("dark");
  });

  it("toggles to the opposite of what is showing", () => {
    stubMatchMedia(false);
    expect(getEffectiveTheme()).toBe("light");
    expect(toggleTheme()).toBe("dark");
    expect(getStoredTheme()).toBe("dark");
    expect(toggleTheme()).toBe("light");
  });
});
