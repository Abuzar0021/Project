export type Category = "spelling" | "clarity" | "voice";

export type SuggestionSource = "languagetool" | "local" | "voice" | "sample";

export const CATEGORY_NAMES: Record<Category, string> = {
  spelling: "Spelling and grammar",
  clarity: "Clarity",
  voice: "Voice",
};

/** A wider edit than the underlined text, such as rewriting a passive clause. */
export interface Rewrite {
  from: number;
  to: number;
  text: string;
}

export interface Suggestion {
  id: string;
  blockId: string;
  blockHash: string;
  /** Document range of the underline. */
  from: number;
  to: number;
  original: string;
  /** First entry is what Accept applies. An empty string means delete. */
  replacements: string[];
  /** Shown after the struck original when it differs from the replacement. */
  fix?: string;
  rewrite?: Rewrite;
  category: Category;
  ruleId: string;
  label: string;
  reason: string;
  source: SuggestionSource;
}

/** An issue found in one block, with offsets into that block's text. */
export interface DetectedIssue {
  offset: number;
  length: number;
  ruleId: string;
  category: Category;
  label: string;
  reason: string;
  replacements: string[];
  fix?: string;
  rewrite?: { offset: number; length: number; text: string };
  source: SuggestionSource;
}
