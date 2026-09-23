/**
 * Unit tests for the LRU MatchCache: hits, misses, capacity eviction, and that
 * reading an entry refreshes its recency so it is not the next one evicted.
 */
import { describe, it, expect } from "vitest";
import { MatchCache } from "@/lib/checking/cache";
import type { RawMatch } from "@/types/languagetool";

function match(id: string): RawMatch {
  return {
    offset: 0,
    length: 1,
    message: id,
    replacements: [],
    rule: { id, category: { id: "TYPOS" } },
  };
}

describe("MatchCache", () => {
  it("stores and retrieves by hash", () => {
    const cache = new MatchCache();
    expect(cache.has("a")).toBe(false);
    cache.set("a", [match("a")]);
    expect(cache.has("a")).toBe(true);
    expect(cache.get("a")?.[0]?.message).toBe("a");
  });

  it("evicts the oldest entry over capacity", () => {
    const cache = new MatchCache(2);
    cache.set("a", [match("a")]);
    cache.set("b", [match("b")]);
    cache.set("c", [match("c")]);
    expect(cache.has("a")).toBe(false);
    expect(cache.has("b")).toBe(true);
    expect(cache.has("c")).toBe(true);
    expect(cache.size).toBe(2);
  });

  it("refreshes recency on read", () => {
    const cache = new MatchCache(2);
    cache.set("a", [match("a")]);
    cache.set("b", [match("b")]);
    // Touch "a" so "b" becomes the oldest.
    cache.get("a");
    cache.set("c", [match("c")]);
    expect(cache.has("a")).toBe(true);
    expect(cache.has("b")).toBe(false);
    expect(cache.has("c")).toBe(true);
  });
});
