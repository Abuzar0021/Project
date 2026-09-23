/**
 * Unit tests for categorization: the LanguageTool category ids fold into the
 * right four categories, unknown ids fall back to clarity, messages shorten to
 * one line, and categorizeMatch produces a human title.
 */
import { describe, it, expect } from "vitest";
import {
  categoryForMatch,
  shortenMessage,
  categorizeMatch,
} from "@/lib/checking/categorize";
import type { RawMatch } from "@/types/languagetool";

function match(categoryId: string, issueType?: string): RawMatch {
  return {
    offset: 0,
    length: 4,
    message: "Some explanation from the checker.",
    replacements: ["fix"],
    rule: {
      id: `${categoryId}_RULE`,
      category: { id: categoryId },
      ...(issueType ? { issueType } : {}),
    },
  };
}

describe("categoryForMatch", () => {
  it("maps correctness categories", () => {
    for (const id of [
      "TYPOS",
      "GRAMMAR",
      "PUNCTUATION",
      "CASING",
      "CONFUSED_WORDS",
    ]) {
      expect(categoryForMatch(match(id))).toBe("correctness");
    }
  });

  it("maps clarity and style categories", () => {
    expect(categoryForMatch(match("REDUNDANCY"))).toBe("clarity");
    expect(categoryForMatch(match("PLAIN_ENGLISH"))).toBe("clarity");
    expect(categoryForMatch(match("STYLE", "style"))).toBe("clarity");
    expect(categoryForMatch(match("REPETITIONS"))).toBe("style");
    expect(categoryForMatch(match("REPETITIONS_STYLE"))).toBe("style");
  });

  it("falls back to clarity for unknown categories", () => {
    expect(categoryForMatch(match("SOMETHING_NEW"))).toBe("clarity");
  });

  it("uses issue type as a fallback hint", () => {
    expect(categoryForMatch(match("MISC", "misspelling"))).toBe("correctness");
    expect(categoryForMatch(match("MISC", "duplication"))).toBe("style");
  });
});

describe("shortenMessage", () => {
  it("leaves short messages unchanged", () => {
    expect(shortenMessage("Short and sweet.")).toBe("Short and sweet.");
  });

  it("truncates long messages to about 120 characters with an ellipsis", () => {
    const long = "word ".repeat(60).trim();
    const short = shortenMessage(long);
    expect(short.length).toBeLessThanOrEqual(120);
    expect(short.endsWith("…")).toBe(true);
  });
});

describe("categorizeMatch", () => {
  it("produces a category, title, and message", () => {
    const result = categorizeMatch(match("TYPOS"));
    expect(result.category).toBe("correctness");
    expect(result.title).toBe("Possible typo");
    expect(result.message.length).toBeGreaterThan(0);
  });
});
