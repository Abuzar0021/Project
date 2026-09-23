/**
 * editor-ui.ts: small Zustand store for chrome state shared between the top bar
 * and the editor: the document title, the active category filter, the live word
 * count, and the checker status. Suggestion data lives in its own store
 * (added in Phase 2); this one holds only presentational UI state.
 */
import { create } from "zustand";
import type { CategoryFilter } from "@/types/suggestion";

/** Checker status, drives the status indicator copy (DESIGN.md 8.6). */
export type CheckStatus = "empty" | "idle" | "checking" | "unreachable";

interface EditorUIState {
  title: string;
  setTitle: (title: string) => void;

  filter: CategoryFilter;
  setFilter: (filter: CategoryFilter) => void;

  wordCount: number;
  setWordCount: (count: number) => void;

  status: CheckStatus;
  setStatus: (status: CheckStatus) => void;

  /** The suggestion whose card is open, or null. One card at a time. */
  activeSuggestionId: string | null;
  setActiveSuggestion: (id: string | null) => void;
}

export const useEditorUI = create<EditorUIState>((set) => ({
  title: "",
  setTitle: (title) => set({ title }),

  filter: "all",
  setFilter: (filter) => set({ filter }),

  wordCount: 0,
  setWordCount: (wordCount) => set({ wordCount }),

  status: "empty",
  setStatus: (status) => set({ status }),

  activeSuggestionId: null,
  setActiveSuggestion: (activeSuggestionId) => set({ activeSuggestionId }),
}));
