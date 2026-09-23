/**
 * score.ts: heuristic writing scores and readability metrics.
 * Pure and framework free so it can be unit tested and run on every check. The
 * overall score is deliberately simple and the UI says so in plain words: it is
 * an estimate from the issues found, not a grade of the writing.
 */
import type { Category, Suggestion } from "@/types/suggestion";
import { CATEGORIES } from "@/types/suggestion";
import { countWords } from "@/lib/text/word-count";

/** Weight per category: correctness hurts most, style least. */
const CATEGORY_WEIGHT: Record<Category, number> = {
  correctness: 3,
  clarity: 2,
  tone: 1.5,
  style: 1,
};

export type ToneLabel = "Confident" | "Neutral" | "Tentative";

export interface ScoreResult {
  overall: number;
  counts: Record<Category, number>;
  wordCount: number;
  readingGrade: number;
  avgSentenceLength: number;
  passiveCount: number;
  toneLabel: ToneLabel;
}

/** Split text into sentences on terminal punctuation. */
export function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Count syllables in a word with a common vowel-group heuristic. */
export function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (clean.length === 0) return 0;
  if (clean.length <= 3) return 1;

  let trimmed = clean.replace(/e$/, "");
  // Keep a trailing "le" as its own syllable (for example "table").
  if (/le$/.test(clean) && !/[aeiouy]le$/.test(clean)) trimmed = clean;

  const groups = trimmed.match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

function countCategories(suggestions: Suggestion[]): Record<Category, number> {
  const counts: Record<Category, number> = {
    correctness: 0,
    clarity: 0,
    tone: 0,
    style: 0,
  };
  for (const s of suggestions) counts[s.category] += 1;
  return counts;
}

function toneLabelFor(perHundred: number): ToneLabel {
  if (perHundred >= 3) return "Tentative";
  if (perHundred <= 1) return "Confident";
  return "Neutral";
}

/**
 * Compute the score and metrics.
 * Overall = clamp(100 - weightedIssuesPer100Words * 4, 0, 100), rounded, where
 * weightedIssues sums each issue times its category weight.
 */
export function computeScore(
  text: string,
  suggestions: Suggestion[],
): ScoreResult {
  const wordCount = countWords(text);
  const counts = countCategories(suggestions);

  const weighted = CATEGORIES.reduce(
    (sum, category) => sum + counts[category] * CATEGORY_WEIGHT[category],
    0,
  );
  const weightedPer100 = wordCount > 0 ? (weighted / wordCount) * 100 : 0;
  const overall = Math.round(
    Math.min(100, Math.max(0, 100 - weightedPer100 * 4)),
  );

  const sentences = splitSentences(text);
  const sentenceCount = Math.max(1, sentences.length);
  const syllables = text
    .split(/\s+/)
    .filter(Boolean)
    .reduce((sum, word) => sum + countSyllables(word), 0);

  const readingGrade =
    wordCount > 0
      ? Math.max(
          0,
          Math.round(
            0.39 * (wordCount / sentenceCount) +
              11.8 * (syllables / wordCount) -
              15.59,
          ),
        )
      : 0;

  const avgSentenceLength =
    wordCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

  const passiveCount = suggestions.filter(
    (s) => s.ruleId === "local:passive",
  ).length;

  const hedgeIntensifiers = suggestions.filter(
    (s) => s.ruleId === "local:hedging" || s.ruleId === "local:intensifier",
  ).length;
  const tonePer100 = wordCount > 0 ? (hedgeIntensifiers / wordCount) * 100 : 0;

  return {
    overall,
    counts,
    wordCount,
    readingGrade,
    avgSentenceLength,
    passiveCount,
    toneLabel: toneLabelFor(tonePer100),
  };
}
