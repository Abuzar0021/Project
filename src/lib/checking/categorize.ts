/**
 * categorize.ts: map a LanguageTool match to one of Margin's four categories,
 * with a short human title and a shortened one-sentence message.
 * LanguageTool has dozens of rule categories; we fold them into correctness,
 * clarity, tone, and style per DESIGN.md and the build brief. Tone comes almost
 * entirely from our local rules, so LanguageTool matches land in the other
 * three, with anything unrecognized treated as clarity.
 */
import type { Category } from "@/types/suggestion";
import type { RawMatch } from "@/types/languagetool";

const MAX_MESSAGE = 120;

const CORRECTNESS_CATEGORIES = new Set([
  "TYPOS",
  "GRAMMAR",
  "PUNCTUATION",
  "CASING",
  "CONFUSED_WORDS",
]);
const CLARITY_CATEGORIES = new Set(["REDUNDANCY", "PLAIN_ENGLISH", "STYLE"]);
const STYLE_CATEGORIES = new Set(["REPETITIONS", "REPETITIONS_STYLE"]);

/** Short, human titles keyed by category id, sentence case per copy guidelines. */
const TITLE_BY_CATEGORY_ID: Record<string, string> = {
  TYPOS: "Possible typo",
  GRAMMAR: "Grammar",
  PUNCTUATION: "Punctuation",
  CASING: "Capitalization",
  CONFUSED_WORDS: "Commonly confused word",
  REDUNDANCY: "Redundant phrase",
  PLAIN_ENGLISH: "Wordy",
  STYLE: "Style",
  REPETITIONS: "Repeated word",
  REPETITIONS_STYLE: "Repeated word",
};

export interface Categorized {
  category: Category;
  title: string;
  message: string;
}

/** Fold a LanguageTool category id (and issue type) into our four categories. */
export function categoryForMatch(match: RawMatch): Category {
  const id = match.rule.category.id;
  if (CORRECTNESS_CATEGORIES.has(id)) return "correctness";
  if (STYLE_CATEGORIES.has(id)) return "style";
  if (CLARITY_CATEGORIES.has(id)) return "clarity";

  // Fall back on the issue type when the category id is unfamiliar.
  if (match.rule.issueType === "misspelling") return "correctness";
  if (match.rule.issueType === "duplication") return "style";
  return "clarity";
}

/** Shorten a message to one line of at most ~120 characters. */
export function shortenMessage(message: string): string {
  const clean = message.replace(/\s+/g, " ").trim();
  if (clean.length <= MAX_MESSAGE) return clean;
  const truncated = clean.slice(0, MAX_MESSAGE - 1);
  const lastSpace = truncated.lastIndexOf(" ");
  const base = lastSpace > 60 ? truncated.slice(0, lastSpace) : truncated;
  return `${base}…`;
}

/** Produce the category, title, and shortened message for a match. */
export function categorizeMatch(match: RawMatch): Categorized {
  const category = categoryForMatch(match);
  const title =
    TITLE_BY_CATEGORY_ID[match.rule.category.id] ??
    match.shortMessage?.trim() ??
    "Suggestion";
  const message = shortenMessage(match.message || match.shortMessage || title);
  return { category, title, message };
}
