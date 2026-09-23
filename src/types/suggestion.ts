/**
 * Shared domain types for Margin.
 * These describe a single writing suggestion and the four categories it can
 * belong to. They are referenced across the checking pipeline, the store, and
 * every view (marks, cards, rail, minimap), so they live in one place.
 */

/** The four suggestion families. Category is never communicated by color alone;
 * each also has its own underline stroke (see DESIGN.md 3 and 8.1). */
export type Category = "correctness" | "clarity" | "tone" | "style";

/** Where a suggestion came from: the LanguageTool server or our local rules. */
export type SuggestionSource = "languagetool" | "local";

export interface Suggestion {
  /** Stable id: `${blockId}:${ruleId}:${offsetInBlock}:${length}`. */
  id: string;
  /** The block this suggestion belongs to (data-block-id). */
  blockId: string;
  /** Hash of the block text when this suggestion was produced (staleness guard). */
  blockHash: string;
  /** Current ProseMirror document positions, kept mapped through edits. */
  from: number;
  to: number;
  /** The text the suggestion refers to. */
  original: string;
  /** Up to three replacements, most likely first. */
  replacements: string[];
  category: Category;
  /** Engine rule id, for "Ignore this rule" and debugging. */
  ruleId: string;
  /** Short human title, for example "Possible typo". */
  title: string;
  /** One plain sentence explaining the issue. */
  message: string;
  source: SuggestionSource;
}

/** The category filter shown in the top bar. "all" shows every category. */
export type CategoryFilter = "all" | Category;

/** Ordered list of categories, handy for rendering chips and score rows. */
export const CATEGORIES: readonly Category[] = [
  "correctness",
  "clarity",
  "tone",
  "style",
] as const;

/** Human labels for each category, sentence case per the copy guidelines. */
export const CATEGORY_LABELS: Record<Category, string> = {
  correctness: "Correctness",
  clarity: "Clarity",
  tone: "Tone",
  style: "Style",
};
