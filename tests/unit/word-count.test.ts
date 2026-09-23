/**
 * Unit tests for countWords: empty and whitespace-only strings are zero, runs of
 * whitespace collapse, and punctuation does not inflate the total.
 */
import { describe, it, expect } from "vitest";
import { countWords } from "@/lib/text/word-count";

describe("countWords", () => {
  it("returns 0 for empty and whitespace-only input", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\t ")).toBe(0);
  });

  it("counts words separated by any whitespace", () => {
    expect(countWords("one two three")).toBe(3);
    expect(countWords("one   two\nthree\tfour")).toBe(4);
  });

  it("does not count punctuation as separate words", () => {
    expect(countWords("Hello, world!")).toBe(2);
    expect(countWords("  leading and trailing  ")).toBe(3);
  });
});
