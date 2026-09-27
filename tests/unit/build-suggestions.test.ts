import { describe, it, expect } from "vitest";
import {
  buildSuggestions,
  dropOverlaps,
  matchToIssue,
} from "@/lib/checking/build-suggestions";
import type { RawMatch } from "@/types/languagetool";
import type { DetectedIssue } from "@/types/suggestion";

const TEXT = "hello world";
// Character i sits at document position i + 1.
const POS_MAP = Array.from({ length: TEXT.length }, (_, i) => i + 1);

function issue(partial: Partial<DetectedIssue>): DetectedIssue {
  return {
    offset: 0,
    length: 5,
    ruleId: "R1",
    category: "spelling",
    label: "Spelling",
    reason: "Reason.",
    replacements: [],
    source: "languagetool",
    ...partial,
  };
}

describe("matchToIssue", () => {
  it("maps a typo to a spelling note and caps replacements at three", () => {
    const match: RawMatch = {
      offset: 3,
      length: 2,
      message: "Possible spelling mistake found.",
      replacements: ["a", "b", "c", "d"],
      rule: { id: "MORFOLOGIK", category: { id: "TYPOS" } },
    };
    const result = matchToIssue(match);
    expect(result.category).toBe("spelling");
    expect(result.label).toBe("Spelling");
    expect(result.replacements).toEqual(["a", "b", "c"]);
  });
});

describe("buildSuggestions", () => {
  it("maps offsets to document positions with a stable id", () => {
    const [s] = buildSuggestions("blk", "hash1", TEXT, POS_MAP, [
      issue({ offset: 6, length: 5, ruleId: "R2" }),
    ]);
    expect(s?.original).toBe("world");
    expect(s?.from).toBe(7);
    expect(s?.to).toBe(12);
    expect(s?.id).toBe("blk:R2:6:5");
    expect(s?.blockHash).toBe("hash1");
  });

  it("skips empty and out-of-range issues", () => {
    const suggestions = buildSuggestions("blk", "h", TEXT, POS_MAP, [
      issue({ offset: 0, length: 0 }),
      issue({ offset: 999, length: 3 }),
      issue({ offset: -1, length: 2 }),
    ]);
    expect(suggestions).toHaveLength(0);
  });

  it("maps a wider rewrite to document positions", () => {
    const [s] = buildSuggestions("blk", "h", TEXT, POS_MAP, [
      issue({
        offset: 6,
        length: 5,
        rewrite: { offset: 0, length: 11, text: "world, hello" },
      }),
    ]);
    expect(s?.rewrite).toEqual({ from: 1, to: 12, text: "world, hello" });
  });
});

describe("dropOverlaps", () => {
  it("keeps the spelling note when a clarity note covers the same words", () => {
    const kept = dropOverlaps([
      issue({
        offset: 0,
        length: 11,
        category: "clarity",
        ruleId: "local:passive",
        source: "local",
      }),
      issue({ offset: 6, length: 5, category: "spelling", source: "local" }),
    ]);
    expect(kept.map((k) => k.category)).toEqual(["spelling"]);
  });

  it("prefers the server's spelling note over the local one", () => {
    const kept = dropOverlaps([
      issue({ source: "local", ruleId: "local:spelling" }),
      issue({ source: "languagetool", ruleId: "MORFOLOGIK" }),
    ]);
    expect(kept).toHaveLength(1);
    expect(kept[0]?.ruleId).toBe("MORFOLOGIK");
  });

  it("keeps separate issues in document order", () => {
    const kept = dropOverlaps([
      issue({ offset: 6, length: 5 }),
      issue({ offset: 0, length: 5 }),
    ]);
    expect(kept.map((k) => k.offset)).toEqual([0, 6]);
  });
});
