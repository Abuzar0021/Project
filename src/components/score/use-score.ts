/**
 * use-score.ts: compute the live score from the document text and the visible
 * suggestions. Hidden suggestions (ignored, dismissed, dictionary) do not count.
 * Memoized so it only recomputes when the text or the suggestions change, which
 * follows the checking cadence.
 */
"use client";

import { useMemo } from "react";
import { useEditorUI } from "@/store/editor-ui";
import { useSuggestions } from "@/store/suggestions";
import { usePrefs } from "@/store/prefs";
import { visibleSuggestions } from "@/lib/suggestions/visibility";
import { computeScore, type ScoreResult } from "@/lib/score/score";

export function useScore(): ScoreResult {
  const plainText = useEditorUI((s) => s.plainText);
  const byId = useSuggestions((s) => s.byId);
  const ignoredRules = usePrefs((s) => s.ignoredRules);
  const dictionary = usePrefs((s) => s.dictionary);
  const dismissed = usePrefs((s) => s.dismissed);

  return useMemo(() => {
    const visible = visibleSuggestions(Object.values(byId), {
      ignoredRules,
      dictionary,
      dismissed,
    });
    return computeScore(plainText, visible);
  }, [plainText, byId, ignoredRules, dictionary, dismissed]);
}
