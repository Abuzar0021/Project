/**
 * Maps LanguageTool's rule categories onto Margin's three: spelling and
 * grammar, clarity, and voice.
 */

import type { Category } from "@/types/suggestion";
import type { RawMatch } from "@/types/languagetool";

const MAX_REASON = 120;

const SPELLING_IDS = new Set([
  "TYPOS",
  "GRAMMAR",
  "PUNCTUATION",
  "CASING",
  "CONFUSED_WORDS",
  "TYPOGRAPHY",
  "MISC",
  "REPETITIONS",
]);

const LABELS: Record<string, string> = {
  TYPOS: "Spelling",
  GRAMMAR: "Grammar",
  PUNCTUATION: "Punctuation",
  CASING: "Capital letter",
  CONFUSED_WORDS: "Wrong word",
  TYPOGRAPHY: "Punctuation",
  REPETITIONS: "Repeated word",
  REPETITIONS_STYLE: "Repeated word",
  REDUNDANCY: "Wordy",
  PLAIN_ENGLISH: "Plainer word",
  STYLE: "Style",
};

export function categoryFor(match: RawMatch): Category {
  const id = match.rule.category.id;
  if (SPELLING_IDS.has(id)) return "spelling";
  if (match.rule.issueType === "misspelling") return "spelling";
  if (match.rule.issueType === "duplication") return "spelling";
  if (match.rule.issueType === "grammar") return "spelling";
  return "clarity";
}

export function labelFor(match: RawMatch): string {
  if (match.rule.issueType === "duplication") return "Repeated word";
  return (
    LABELS[match.rule.category.id] ?? match.shortMessage?.trim() ?? "Suggestion"
  );
}

/** One line, at most about 120 characters, cut at a word. */
export function shortenReason(message: string): string {
  const clean = message.replace(/\s+/g, " ").trim();
  if (clean.length <= MAX_REASON) return clean;
  const cut = clean.slice(0, MAX_REASON - 1);
  const space = cut.lastIndexOf(" ");
  return `${space > 60 ? cut.slice(0, space) : cut}...`;
}
