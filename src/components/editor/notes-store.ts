"use client";

import { createContext, useContext } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import type { Suggestion } from "@/types/suggestion";

export type CheckStatus = "idle" | "checking" | "unreachable";

export interface Memo {
  id: string;
  text: string;
  scope: "draft" | "all";
  pos: number;
  undo: () => void;
}

export interface NotesState {
  byId: Record<string, Suggestion>;
  activeId: string | null;
  goneIds: string[];
  memos: Memo[];
  status: CheckStatus;
  setBlock: (blockId: string, list: Suggestion[]) => void;
  clearBlock: (blockId: string) => void;
  setAll: (list: Suggestion[]) => void;
  add: (suggestion: Suggestion) => void;
  remove: (ids: string[]) => void;
  sync: (updates: { id: string; from: number; to: number }[]) => void;
  setActive: (id: string | null) => void;
  markGone: (id: string) => void;
  addMemo: (memo: Memo) => void;
  removeMemo: (id: string) => void;
  setStatus: (status: CheckStatus) => void;
}

function without(
  record: Record<string, Suggestion>,
  drop: (s: Suggestion) => boolean,
) {
  return Object.fromEntries(Object.entries(record).filter(([, s]) => !drop(s)));
}

export function createNotesStore(): StoreApi<NotesState> {
  return createStore<NotesState>((set) => ({
    byId: {},
    activeId: null,
    goneIds: [],
    memos: [],
    status: "idle",

    setBlock: (blockId, list) =>
      set((state) => {
        const byId = without(state.byId, (s) => s.blockId === blockId);
        for (const s of list) byId[s.id] = s;
        return { byId };
      }),
    clearBlock: (blockId) =>
      set((state) => ({
        byId: without(state.byId, (s) => s.blockId === blockId),
      })),
    setAll: (list) =>
      set({ byId: Object.fromEntries(list.map((s) => [s.id, s])) }),
    add: (suggestion) =>
      set((state) => ({
        byId: { ...state.byId, [suggestion.id]: suggestion },
      })),
    remove: (ids) =>
      set((state) => {
        const drop = new Set(ids);
        return {
          byId: without(state.byId, (s) => drop.has(s.id)),
          goneIds: state.goneIds.filter((id) => !drop.has(id)),
          activeId:
            state.activeId && drop.has(state.activeId) ? null : state.activeId,
        };
      }),
    sync: (updates) =>
      set((state) => {
        const byId = { ...state.byId };
        for (const { id, from, to } of updates) {
          const current = byId[id];
          if (current) byId[id] = { ...current, from, to };
        }
        return { byId };
      }),
    setActive: (activeId) => set({ activeId }),
    markGone: (id) => set((state) => ({ goneIds: [...state.goneIds, id] })),
    addMemo: (memo) => set((state) => ({ memos: [...state.memos, memo] })),
    removeMemo: (id) =>
      set((state) => ({ memos: state.memos.filter((m) => m.id !== id) })),
    setStatus: (status) => set({ status }),
  }));
}

export const NotesContext = createContext<StoreApi<NotesState> | null>(null);

export function useNotesStore(): StoreApi<NotesState> {
  const store = useContext(NotesContext);
  if (!store) throw new Error("useNotes must be used inside an Editor");
  return store;
}

export function useNotes<T>(selector: (state: NotesState) => T): T {
  return useStore(useNotesStore(), selector);
}

/** Open notes in document order, leaving out any being accepted. */
export function openNotes(
  state: Pick<NotesState, "byId" | "goneIds">,
): Suggestion[] {
  const gone = new Set(state.goneIds);
  return Object.values(state.byId)
    .filter((s) => !gone.has(s.id))
    .sort((a, b) => a.from - b.from || a.to - b.to);
}
