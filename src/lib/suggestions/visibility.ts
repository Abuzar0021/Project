/**
 * visibility.ts: decide whether a suggestion should be hidden by the writer's
 * preferences. A suggestion is hidden if it was dismissed this session, if its
 * rule was ignored, or if it is a spelling suggestion for a word the writer
 * added to their dictionary. Pure so it can be unit tested and reused by the
 * marks, the rail, the minimap, and the score.
 */
import type { Suggestion } from "@/types/suggestion";

export interface VisibilityPrefs {
  ignoredRules: Set<string>;
  dictionary: Set<string>;
  dismissed: Set<string>;
}

/** True when a preference hides this suggestion. */
export function isHidden(
  suggestion: Suggestion,
  prefs: VisibilityPrefs,
): boolean {
  if (prefs.dismissed.has(suggestion.id)) return true;
  if (prefs.ignoredRules.has(suggestion.ruleId)) return true;
  if (
    suggestion.category === "correctness" &&
    prefs.dictionary.has(suggestion.original.toLowerCase())
  ) {
    return true;
  }
  return false;
}

/** Filter a list down to the suggestions a preference does not hide. */
export function visibleSuggestions(
  suggestions: Suggestion[],
  prefs: VisibilityPrefs,
): Suggestion[] {
  return suggestions.filter((s) => !isHidden(s, prefs));
}
