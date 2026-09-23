/**
 * prefs.ts (store): the writer's checking preferences.
 * Ignored rules and dictionary words persist to localStorage; dismissed single
 * instances live only for the session. The suggestion views read these to hide
 * suggestions the writer has chosen not to see.
 */
import { create } from "zustand";
import {
  loadIgnoredRules,
  saveIgnoredRules,
  loadDictionary,
  saveDictionary,
} from "@/lib/storage/prefs";

interface PrefsState {
  ignoredRules: Set<string>;
  dictionary: Set<string>;
  dismissed: Set<string>;

  ignoreRule: (ruleId: string) => void;
  addToDictionary: (word: string) => void;
  dismiss: (id: string) => void;
  undismiss: (id: string) => void;
}

export const usePrefs = create<PrefsState>((set) => ({
  ignoredRules: new Set(loadIgnoredRules()),
  dictionary: new Set(loadDictionary()),
  dismissed: new Set<string>(),

  ignoreRule: (ruleId) =>
    set((state) => {
      const ignoredRules = new Set(state.ignoredRules).add(ruleId);
      saveIgnoredRules([...ignoredRules]);
      return { ignoredRules };
    }),

  addToDictionary: (word) =>
    set((state) => {
      const dictionary = new Set(state.dictionary).add(word.toLowerCase());
      saveDictionary([...dictionary]);
      return { dictionary };
    }),

  dismiss: (id) =>
    set((state) => ({ dismissed: new Set(state.dismissed).add(id) })),

  undismiss: (id) =>
    set((state) => {
      const dismissed = new Set(state.dismissed);
      dismissed.delete(id);
      return { dismissed };
    }),
}));
