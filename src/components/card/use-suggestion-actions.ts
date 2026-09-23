/**
 * use-suggestion-actions.ts: the shared Apply / Dismiss / Ignore / Add to
 * dictionary handlers, used by both the card and the rail so the two stay
 * consistent. Each action updates the right store and announces its result.
 */
"use client";

import { useMemo } from "react";
import type { Editor } from "@tiptap/react";
import type { Suggestion } from "@/types/suggestion";
import { useEditorUI } from "@/store/editor-ui";
import { usePrefs } from "@/store/prefs";
import { useToast } from "@/store/toast";
import { applySuggestion } from "@/lib/editor/apply-suggestion";

export interface SuggestionActions {
  apply: (suggestion: Suggestion, replacement: string) => void;
  dismiss: (suggestion: Suggestion) => void;
  ignore: (suggestion: Suggestion) => void;
  addToDictionary: (suggestion: Suggestion) => void;
}

export function useSuggestionActions(editor: Editor | null): SuggestionActions {
  const setActive = useEditorUI((s) => s.setActiveSuggestion);
  const ignoreRule = usePrefs((s) => s.ignoreRule);
  const addWord = usePrefs((s) => s.addToDictionary);
  const dismiss = usePrefs((s) => s.dismiss);
  const undismiss = usePrefs((s) => s.undismiss);
  const showToast = useToast((s) => s.show);

  return useMemo(
    () => ({
      apply: (suggestion, replacement) => {
        if (!editor) return;
        applySuggestion(editor, suggestion, replacement);
        showToast("Applied");
        setActive(null);
      },
      dismiss: (suggestion) => {
        const { id } = suggestion;
        dismiss(id);
        showToast("Dismissed", { label: "Undo", run: () => undismiss(id) });
        setActive(null);
      },
      ignore: (suggestion) => {
        ignoreRule(suggestion.ruleId);
        showToast("Rule ignored");
        setActive(null);
      },
      addToDictionary: (suggestion) => {
        addWord(suggestion.original);
        showToast("Added to dictionary");
        setActive(null);
      },
    }),
    [editor, setActive, ignoreRule, addWord, dismiss, undismiss, showToast],
  );
}
