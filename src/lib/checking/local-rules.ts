/**
 * local-rules.ts: Margin's own checks, run in the browser with no network.
 * These cover the judgment calls LanguageTool does not: hedging and weak
 * intensifiers (tone), passive voice (tone), overlong sentences (clarity), and a
 * word repeated too often in one paragraph (style). Each returns DetectedIssues
 * with offsets into the block text, which build-suggestions maps to document
 * positions. Every rule is a pure function so it can be unit tested directly.
 */
import type { DetectedIssue } from "@/types/suggestion";
import { countWords } from "@/lib/text/word-count";

const LONG_SENTENCE_WORDS = 30;
const REPETITION_MIN = 3;
const REPETITION_MIN_WORD_LENGTH = 4;

const HEDGES = [
  "just",
  "sort of",
  "kind of",
  "maybe",
  "i think",
  "i feel like",
  "perhaps",
];
const INTENSIFIERS = ["very", "really", "extremely"];

// Auxiliary "to be" forms for the passive-voice heuristic.
const BE_FORMS = "am|is|are|was|were|be|been|being";
// Common irregular past participles, since they do not end in "ed".
const IRREGULAR_PARTICIPLES = [
  "written",
  "sent",
  "done",
  "made",
  "seen",
  "taken",
  "given",
  "shown",
  "known",
  "kept",
  "held",
  "built",
  "found",
  "paid",
  "told",
  "brought",
  "bought",
  "caught",
  "taught",
  "thought",
  "left",
  "lost",
  "met",
  "read",
  "said",
  "set",
  "put",
  "chosen",
  "drawn",
  "grown",
  "thrown",
];

const STOPWORDS = new Set([
  "the",
  "and",
  "that",
  "was",
  "were",
  "for",
  "with",
  "this",
  "there",
  "their",
  "they",
  "them",
  "then",
  "than",
  "have",
  "has",
  "had",
  "are",
  "our",
  "you",
  "your",
  "but",
  "not",
  "all",
  "any",
  "who",
  "how",
  "why",
  "what",
  "when",
  "which",
  "will",
  "would",
  "been",
  "from",
  "into",
  "about",
  "across",
  "some",
]);

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Match any of a word/phrase list, case-insensitive, at word boundaries. */
function matchPhrases(
  text: string,
  phrases: string[],
  build: (matched: string, offset: number) => DetectedIssue,
): DetectedIssue[] {
  const pattern = new RegExp(
    `\\b(${phrases.map(escapeForRegex).join("|")})\\b`,
    "gi",
  );
  const issues: DetectedIssue[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    issues.push(build(match[0], match.index));
  }
  return issues;
}

function hedgingIssues(text: string): DetectedIssue[] {
  return matchPhrases(text, HEDGES, (matched, offset) => ({
    offset,
    length: matched.length,
    ruleId: "local:hedging",
    category: "tone",
    title: "Hedging",
    message: "Hedging language can weaken your point.",
    replacements: [],
    source: "local",
  }));
}

function intensifierIssues(text: string): DetectedIssue[] {
  return matchPhrases(text, INTENSIFIERS, (matched, offset) => ({
    offset,
    length: matched.length,
    ruleId: "local:intensifier",
    category: "tone",
    title: "Weak intensifier",
    message: "This intensifier adds little. Consider cutting it.",
    replacements: [],
    source: "local",
  }));
}

function passiveVoiceIssues(text: string): DetectedIssue[] {
  const participle = `\\w+ed|${IRREGULAR_PARTICIPLES.join("|")}`;
  // "to be" form, an optional adverb, then a past participle.
  const pattern = new RegExp(
    `\\b(${BE_FORMS})\\b(\\s+\\w+ly)?\\s+(${participle})\\b`,
    "gi",
  );
  const issues: DetectedIssue[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    issues.push({
      offset: match.index,
      length: match[0].length,
      ruleId: "local:passive",
      category: "tone",
      title: "Passive voice",
      message: "Passive voice. Consider naming who did the action.",
      replacements: [],
      source: "local",
    });
  }
  return issues;
}

function longSentenceIssues(text: string): DetectedIssue[] {
  const pattern = /[^.!?]+[.!?]*/g;
  const issues: DetectedIssue[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const raw = match[0];
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;
    if (countWords(trimmed) <= LONG_SENTENCE_WORDS) continue;
    const leading = raw.length - raw.trimStart().length;
    issues.push({
      offset: match.index + leading,
      length: trimmed.length,
      ruleId: "local:long-sentence",
      category: "clarity",
      title: "Long sentence",
      message: "This sentence is long. Consider splitting it.",
      replacements: [],
      source: "local",
    });
  }
  return issues;
}

function repetitionIssues(text: string): DetectedIssue[] {
  const pattern = /\b[\p{L}']+\b/gu;
  const occurrences = new Map<string, { offset: number; length: number }[]>();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const word = match[0].toLowerCase();
    if (word.length < REPETITION_MIN_WORD_LENGTH) continue;
    if (STOPWORDS.has(word)) continue;
    const list = occurrences.get(word) ?? [];
    list.push({ offset: match.index, length: match[0].length });
    occurrences.set(word, list);
  }

  const issues: DetectedIssue[] = [];
  for (const [word, list] of occurrences) {
    if (list.length < REPETITION_MIN) continue;
    for (const spot of list) {
      issues.push({
        offset: spot.offset,
        length: spot.length,
        ruleId: "local:repetition",
        category: "style",
        title: "Repeated word",
        message: `The word "${word}" repeats in this paragraph.`,
        replacements: [],
        source: "local",
      });
    }
  }
  return issues;
}

/** Run every local rule over one block's text. */
export function runLocalRules(text: string): DetectedIssue[] {
  return [
    ...hedgingIssues(text),
    ...intensifierIssues(text),
    ...passiveVoiceIssues(text),
    ...longSentenceIssues(text),
    ...repetitionIssues(text),
  ];
}
