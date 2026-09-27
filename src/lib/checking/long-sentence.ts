/**
 * Long sentences. Past the limit, suggests splitting at the "and", "but" or
 * "so" closest to the middle, where a new clause can stand on its own.
 */

import type { DetectedIssue } from "@/types/suggestion";
import { splitSentences } from "@/lib/text/sentences";

export const LONG_SENTENCE_WORDS = 40;
const MIN_SIDE_WORDS = 6;

// "and" can only be dropped when a new clause starts right after it.
const PRONOUNS = "I|you|we|they|he|she|it|this|that|there|our|your|their";
const BREAK = new RegExp(`(\\S+?)(,?) (and|but|so) (${PRONOUNS})\\b`, "gi");

const capitalize = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1);

/** Flag sentences over the limit and offer a split at the most central break. */
export function longSentenceIssues(text: string): DetectedIssue[] {
  const issues: DetectedIssue[] = [];

  for (const sentence of splitSentences(text)) {
    if (sentence.words <= LONG_SENTENCE_WORDS) continue;

    const middle = sentence.text.length / 2;
    let best: RegExpExecArray | null = null;
    BREAK.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = BREAK.exec(sentence.text)) !== null) {
      const before = sentence.text.slice(0, match.index).split(/\s+/).length;
      const after = sentence.text
        .slice(match.index + match[0].length)
        .split(/\s+/).length;
      if (before < MIN_SIDE_WORDS || after < MIN_SIDE_WORDS) continue;
      if (
        !best ||
        Math.abs(match.index - middle) < Math.abs(best.index - middle)
      ) {
        best = match;
      }
    }

    if (!best) {
      issues.push({
        offset: sentence.start,
        length: Math.min(
          sentence.text.indexOf(" ") + 1 || 1,
          sentence.text.length,
        ),
        ruleId: "local:long-sentence",
        category: "clarity",
        label: "Long sentence",
        reason: `${sentence.words} words. Try splitting it into two.`,
        replacements: [],
        fix: `${sentence.words} words`,
        source: "local",
      });
      continue;
    }

    const [whole, word = "", , conjunction = "", pronoun = ""] = best;
    const cleanWord = word.replace(/[,;:]$/, "");
    const lead =
      conjunction.toLowerCase() === "and"
        ? capitalize(pronoun)
        : `${capitalize(conjunction)} ${pronoun}`;
    const replacement = `${cleanWord}. ${lead}`;

    issues.push({
      offset: sentence.start + best.index,
      length: whole.length,
      ruleId: "local:long-sentence",
      category: "clarity",
      label: "Long sentence",
      reason: `${sentence.words} words. Try splitting it after "${cleanWord}".`,
      replacements: [replacement],
      source: "local",
    });
  }

  return issues;
}
