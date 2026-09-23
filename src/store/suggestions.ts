/**
 * suggestions.ts: the store of live suggestions, keyed by id and grouped by
 * block. The checking pipeline replaces a block's suggestions wholesale when it
 * is rechecked; marks, the rail, the minimap, and the score all read from here.
 * Positions (from/to) are kept current by the suggestions plugin (Phase 3),
 * which calls updatePositions after mapping through each transaction.
 */
import { create } from "zustand";
import type { Suggestion } from "@/types/suggestion";

/** Return a copy of the record without the given keys (no in-place delete). */
function omit<T>(
  record: Record<string, T>,
  keys: Set<string>,
): Record<string, T> {
  const next: Record<string, T> = {};
  for (const key of Object.keys(record)) {
    if (keys.has(key)) continue;
    const value = record[key];
    if (value !== undefined) next[key] = value;
  }
  return next;
}

interface SuggestionsState {
  byId: Record<string, Suggestion>;
  byBlock: Record<string, Suggestion[]>;

  /** Replace all suggestions for one block (the unit the checker works on). */
  setBlockSuggestions: (blockId: string, suggestions: Suggestion[]) => void;
  /** Remove all suggestions for a block, for example when it is deleted. */
  clearBlock: (blockId: string) => void;
  /** Remove a single suggestion (dismiss, ignore, or applied). */
  removeSuggestion: (id: string) => void;
  /** Sync mapped positions back from the editor plugin. */
  updatePositions: (
    updates: { id: string; from: number; to: number }[],
  ) => void;
  clear: () => void;
}

export const useSuggestions = create<SuggestionsState>((set) => ({
  byId: {},
  byBlock: {},

  setBlockSuggestions: (blockId, suggestions) =>
    set((state) => {
      const removeIds = new Set(
        (state.byBlock[blockId] ?? []).map((s) => s.id),
      );
      const byId = omit(state.byId, removeIds);
      for (const next of suggestions) byId[next.id] = next;
      return {
        byId,
        byBlock: { ...state.byBlock, [blockId]: suggestions },
      };
    }),

  clearBlock: (blockId) =>
    set((state) => {
      const removeIds = new Set(
        (state.byBlock[blockId] ?? []).map((s) => s.id),
      );
      return {
        byId: omit(state.byId, removeIds),
        byBlock: omit(state.byBlock, new Set([blockId])),
      };
    }),

  removeSuggestion: (id) =>
    set((state) => {
      const target = state.byId[id];
      if (!target) return state;
      const blockList = (state.byBlock[target.blockId] ?? []).filter(
        (s) => s.id !== id,
      );
      return {
        byId: omit(state.byId, new Set([id])),
        byBlock: { ...state.byBlock, [target.blockId]: blockList },
      };
    }),

  updatePositions: (updates) =>
    set((state) => {
      if (updates.length === 0) return state;
      const byId = { ...state.byId };
      const touchedBlocks = new Set<string>();
      for (const { id, from, to } of updates) {
        const current = byId[id];
        if (!current) continue;
        byId[id] = { ...current, from, to };
        touchedBlocks.add(current.blockId);
      }
      const byBlock = { ...state.byBlock };
      for (const blockId of touchedBlocks) {
        byBlock[blockId] = (byBlock[blockId] ?? []).map((s) => byId[s.id] ?? s);
      }
      return { byId, byBlock };
    }),

  clear: () => set({ byId: {}, byBlock: {} }),
}));
