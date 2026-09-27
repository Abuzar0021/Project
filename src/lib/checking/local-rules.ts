/**
 * Margin's own checks, run in the browser: a list of common misspellings,
 * wordy and formal phrases, hedges and weak words, passive voice, and long
 * sentences. Each issue carries a label, a one-sentence reason and a fix when
 * there is one.
 */

import type { DetectedIssue } from "@/types/suggestion";
import { HEDGES, MISSPELLINGS, PLAINER, WEAK_WORDS, WORDY } from "./phrases";
import { passiveIssues } from "./passive";
import { longSentenceIssues } from "./long-sentence";

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six"];

/** Keep the capital when the original word started a sentence. */
export function matchCase(original: string, replacement: string): string {
  if (!replacement || original.charAt(0) !== original.charAt(0).toUpperCase()) {
    return replacement;
  }
  return replacement.charAt(0).toUpperCase() + replacement.slice(1);
}

function findPhrases(
  text: string,
  phrases: string[],
  build: (found: string, offset: number) => DetectedIssue,
): DetectedIssue[] {
  if (phrases.length === 0) return [];
  const pattern = new RegExp(`\\b(${phrases.map(escape).join("|")})\\b`, "gi");
  const issues: DetectedIssue[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    issues.push(build(match[0], match.index));
  }
  return issues;
}

function wordyIssues(text: string): DetectedIssue[] {
  return findPhrases(text, Object.keys(WORDY), (found, offset) => {
    const to = WORDY[found.toLowerCase()] ?? "";
    const saved = found.split(/\s+/).length - to.split(/\s+/).length;
    return {
      offset,
      length: found.length,
      ruleId: "local:wordy",
      category: "clarity",
      label: "Wordy",
      reason: `Same meaning, ${NUMBER_WORDS[saved] ?? saved} fewer ${saved === 1 ? "word" : "words"}.`,
      replacements: [matchCase(found, to)],
      source: "local",
    };
  });
}

function plainerIssues(text: string): DetectedIssue[] {
  return findPhrases(text, Object.keys(PLAINER), (found, offset) => {
    const to = PLAINER[found.toLowerCase()] ?? "";
    return {
      offset,
      length: found.length,
      ruleId: `local:plainer:${found.toLowerCase()}`,
      category: "clarity",
      label: "Plainer word",
      reason: `"${to.charAt(0).toUpperCase()}${to.slice(1)}" does the same job. Stet this if the formal word is on purpose.`,
      replacements: [matchCase(found, to)],
      source: "local",
    };
  });
}

function cutIssues(
  text: string,
  words: string[],
  ruleId: string,
  label: string,
  reason: string,
): DetectedIssue[] {
  return findPhrases(text, words, (found, offset) => ({
    offset,
    length: found.length,
    ruleId,
    category: "clarity",
    label,
    reason,
    replacements: [""],
    source: "local",
  }));
}

function spellingIssues(text: string): DetectedIssue[] {
  return findPhrases(text, Object.keys(MISSPELLINGS), (found, offset) => {
    const to = MISSPELLINGS[found.toLowerCase()] ?? found;
    return {
      offset,
      length: found.length,
      ruleId: "local:spelling",
      category: "spelling",
      label: "Spelling",
      reason:
        found.toLowerCase().includes("ie") && to.includes("ei")
          ? "I before E, except in this one."
          : `This is spelled "${to}".`,
      replacements: [matchCase(found, to)],
      source: "local",
    };
  });
}

export function runLocalRules(text: string): DetectedIssue[] {
  return [
    ...spellingIssues(text),
    ...wordyIssues(text),
    ...plainerIssues(text),
    ...cutIssues(
      text,
      HEDGES,
      "local:hedging",
      "Hedging",
      "Cut it and the sentence sounds surer.",
    ),
    ...cutIssues(
      text,
      WEAK_WORDS,
      "local:weak-word",
      "Weak word",
      "It adds length, not strength.",
    ),
    ...passiveIssues(text),
    ...longSentenceIssues(text),
  ];
}
