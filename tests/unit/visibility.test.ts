/**
 * Unit tests for preference-based visibility: dismissed instances, ignored
 * rules, and dictionary words hide the right suggestions and nothing else.
 */
import { describe, it, expect } from "vitest";
import { isHidden, visibleSuggestions } from "@/lib/suggestions/visibility";
import type { Suggestion } from "@/types/suggestion";

function make(partial: Partial<Suggestion>): Suggestion {
  return {
    id: "blk:R:0:5",
    blockId: "blk",
    blockHash: "h",
    from: 1,
    to: 6,
    original: "shiped",
    replacements: ["shipped"],
    category: "correctness",
    ruleId: "MORFOLOGIK",
    title: "Possible typo",
    message: "m",
    source: "languagetool",
    ...partial,
  };
}

const empty = {
  ignoredRules: new Set<string>(),
  dictionary: new Set<string>(),
  dismissed: new Set<string>(),
};

describe("isHidden", () => {
  it("shows suggestions by default", () => {
    expect(isHidden(make({}), empty)).toBe(false);
  });

  it("hides a dismissed instance", () => {
    const s = make({ id: "x" });
    expect(isHidden(s, { ...empty, dismissed: new Set(["x"]) })).toBe(true);
  });

  it("hides an ignored rule", () => {
    const s = make({ ruleId: "RULE_A" });
    expect(isHidden(s, { ...empty, ignoredRules: new Set(["RULE_A"]) })).toBe(
      true,
    );
  });

  it("hides a correctness suggestion for a dictionary word, case-insensitively", () => {
    const s = make({ original: "Shiped", category: "correctness" });
    expect(isHidden(s, { ...empty, dictionary: new Set(["shiped"]) })).toBe(
      true,
    );
  });

  it("does not apply the dictionary to non-correctness suggestions", () => {
    const s = make({ original: "very", category: "tone", ruleId: "local:x" });
    expect(isHidden(s, { ...empty, dictionary: new Set(["very"]) })).toBe(
      false,
    );
  });
});

describe("visibleSuggestions", () => {
  it("filters out hidden suggestions", () => {
    const a = make({ id: "a" });
    const b = make({ id: "b", ruleId: "IGN" });
    const result = visibleSuggestions([a, b], {
      ...empty,
      ignoredRules: new Set(["IGN"]),
    });
    expect(result.map((s) => s.id)).toEqual(["a"]);
  });
});
