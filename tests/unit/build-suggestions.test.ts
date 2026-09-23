/**
 * Unit tests for build-suggestions: LanguageTool matches become issues, block
 * offsets map to document positions via posMap, ids are stable, replacements are
 * capped at three, and out-of-range or empty issues are skipped.
 */
import { describe, it, expect } from "vitest";
import {
  buildSuggestions,
  matchToIssue,
} from "@/lib/checking/build-suggestions";
import type { RawMatch } from "@/types/languagetool";
import type { DetectedIssue } from "@/types/suggestion";

const TEXT = "hello world";
// A simple posMap: character i sits at document position i + 1.
const POS_MAP = Array.from({ length: TEXT.length }, (_, i) => i + 1);

function issue(partial: Partial<DetectedIssue>): DetectedIssue {
  return {
    offset: 0,
    length: 5,
    ruleId: "R1",
    category: "correctness",
    title: "Title",
    message: "Message",
    replacements: [],
    source: "languagetool",
    ...partial,
  };
}

describe("matchToIssue", () => {
  it("categorizes and caps replacements at three", () => {
    const match: RawMatch = {
      offset: 3,
      length: 2,
      message: "Possible spelling mistake found.",
      replacements: ["a", "b", "c", "d"],
      rule: { id: "MORFOLOGIK", category: { id: "TYPOS" } },
    };
    const result = matchToIssue(match);
    expect(result.category).toBe("correctness");
    expect(result.source).toBe("languagetool");
    expect(result.replacements).toEqual(["a", "b", "c"]);
    expect(result.offset).toBe(3);
    expect(result.length).toBe(2);
  });
});

describe("buildSuggestions", () => {
  it("maps offsets to document positions", () => {
    const suggestions = buildSuggestions("blk", "hash1", TEXT, POS_MAP, [
      issue({ offset: 6, length: 5, ruleId: "R2" }),
    ]);
    expect(suggestions).toHaveLength(1);
    const s = suggestions[0];
    if (!s) throw new Error("expected a suggestion");
    expect(s.original).toBe("world");
    expect(s.from).toBe(7);
    expect(s.to).toBe(12);
    expect(s.id).toBe("blk:R2:6:5");
    expect(s.blockHash).toBe("hash1");
  });

  it("skips empty and out-of-range issues", () => {
    const suggestions = buildSuggestions("blk", "h", TEXT, POS_MAP, [
      issue({ offset: 0, length: 0 }),
      issue({ offset: 999, length: 3 }),
      issue({ offset: -1, length: 2 }),
    ]);
    expect(suggestions).toHaveLength(0);
  });

  it("caps replacements at three", () => {
    const suggestions = buildSuggestions("blk", "h", TEXT, POS_MAP, [
      issue({ offset: 0, length: 5, replacements: ["1", "2", "3", "4", "5"] }),
    ]);
    expect(suggestions[0]?.replacements).toEqual(["1", "2", "3"]);
  });
});
