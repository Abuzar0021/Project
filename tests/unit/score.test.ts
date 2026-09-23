/**
 * Unit tests for scoring: the syllable counter, the weighted overall score, the
 * readability grade, and the tone label.
 */
import { describe, it, expect } from "vitest";
import {
  computeScore,
  countSyllables,
  splitSentences,
} from "@/lib/score/score";
import type { Suggestion } from "@/types/suggestion";

function sugg(partial: Partial<Suggestion>): Suggestion {
  return {
    id: Math.random().toString(36),
    blockId: "b",
    blockHash: "h",
    from: 1,
    to: 2,
    original: "x",
    replacements: [],
    category: "correctness",
    ruleId: "R",
    title: "t",
    message: "m",
    source: "local",
    ...partial,
  };
}

describe("countSyllables", () => {
  it("counts common words", () => {
    expect(countSyllables("cat")).toBe(1);
    expect(countSyllables("table")).toBe(2);
    expect(countSyllables("writing")).toBe(2);
    expect(countSyllables("beautiful")).toBe(3);
    expect(countSyllables("the")).toBe(1);
  });

  it("returns 0 for non-words", () => {
    expect(countSyllables("123")).toBe(0);
    expect(countSyllables("")).toBe(0);
  });
});

describe("splitSentences", () => {
  it("splits on terminal punctuation", () => {
    expect(splitSentences("One. Two! Three?")).toHaveLength(3);
    expect(splitSentences("No terminal punctuation")).toHaveLength(1);
    expect(splitSentences("")).toHaveLength(0);
  });
});

describe("computeScore", () => {
  it("gives a perfect score with no issues", () => {
    const result = computeScore("This is clean writing.", []);
    expect(result.overall).toBe(100);
    expect(result.wordCount).toBe(4);
  });

  it("lowers the score as weighted issues rise", () => {
    const text = "word ".repeat(100).trim();
    const clean = computeScore(text, []);
    const withIssues = computeScore(text, [
      sugg({ category: "correctness" }),
      sugg({ category: "correctness" }),
    ]);
    expect(withIssues.overall).toBeLessThan(clean.overall);
    // 2 correctness issues in 100 words: weighted 6 per 100 -> 100 - 24 = 76.
    expect(withIssues.overall).toBe(76);
  });

  it("counts issues per category", () => {
    const result = computeScore("some text here now", [
      sugg({ category: "tone" }),
      sugg({ category: "tone" }),
      sugg({ category: "style" }),
    ]);
    expect(result.counts.tone).toBe(2);
    expect(result.counts.style).toBe(1);
    expect(result.counts.correctness).toBe(0);
  });

  it("labels tone from hedge and intensifier density", () => {
    const short = "I think we should just maybe try it";
    const tentative = computeScore(short, [
      sugg({ ruleId: "local:hedging", category: "tone" }),
      sugg({ ruleId: "local:hedging", category: "tone" }),
      sugg({ ruleId: "local:intensifier", category: "tone" }),
    ]);
    expect(tentative.toneLabel).toBe("Tentative");

    const confident = computeScore("word ".repeat(100).trim(), []);
    expect(confident.toneLabel).toBe("Confident");
  });

  it("reports passive sentence count and reading metrics", () => {
    const result = computeScore("The plan was written by the team. It works.", [
      sugg({ ruleId: "local:passive", category: "tone" }),
    ]);
    expect(result.passiveCount).toBe(1);
    expect(result.avgSentenceLength).toBeGreaterThan(0);
    expect(result.readingGrade).toBeGreaterThanOrEqual(0);
  });
});
