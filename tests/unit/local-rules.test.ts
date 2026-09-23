/**
 * Unit tests for the local rules: hedging and intensifiers (tone), passive
 * voice (tone), long sentences (clarity), and repeated words (style). Offsets
 * must point at the exact matched text so marks land correctly.
 */
import { describe, it, expect } from "vitest";
import { runLocalRules } from "@/lib/checking/local-rules";

function sliceAt(text: string, offset: number, length: number): string {
  return text.slice(offset, offset + length);
}

describe("runLocalRules", () => {
  it("flags hedging with correct offsets and tone category", () => {
    const text = "I think we should just ship it.";
    const issues = runLocalRules(text);
    const hedges = issues.filter((i) => i.ruleId === "local:hedging");
    expect(hedges.length).toBeGreaterThanOrEqual(2);
    for (const issue of hedges) {
      expect(issue.category).toBe("tone");
      expect(["i think", "just"]).toContain(
        sliceAt(text, issue.offset, issue.length).toLowerCase(),
      );
    }
  });

  it("flags weak intensifiers", () => {
    const text = "This is very good and really nice.";
    const issues = runLocalRules(text).filter(
      (i) => i.ruleId === "local:intensifier",
    );
    expect(issues.length).toBe(2);
    expect(issues.map((i) => sliceAt(text, i.offset, i.length))).toEqual([
      "very",
      "really",
    ]);
  });

  it("detects passive voice", () => {
    const text = "The report was written by the analytics team.";
    const issues = runLocalRules(text).filter(
      (i) => i.ruleId === "local:passive",
    );
    expect(issues.length).toBe(1);
    const passive = issues[0];
    if (!passive) throw new Error("expected a passive issue");
    expect(passive.category).toBe("tone");
    expect(sliceAt(text, passive.offset, passive.length)).toContain("written");
  });

  it("flags sentences longer than 30 words as clarity", () => {
    const long = `${Array.from({ length: 35 }, (_, i) => `word${i}`).join(" ")}.`;
    const issues = runLocalRules(long).filter(
      (i) => i.ruleId === "local:long-sentence",
    );
    expect(issues.length).toBe(1);
    expect(issues[0]?.category).toBe("clarity");
  });

  it("flags a word repeated three or more times as style", () => {
    const text = "apple apple apple orange orange";
    const issues = runLocalRules(text).filter(
      (i) => i.ruleId === "local:repetition",
    );
    // "apple" repeats three times; "orange" only twice, so it is not flagged.
    expect(issues.length).toBe(3);
    expect(issues.every((i) => i.category === "style")).toBe(true);
    expect(
      issues.every(
        (i) => sliceAt(text, i.offset, i.length).toLowerCase() === "apple",
      ),
    ).toBe(true);
  });
});
