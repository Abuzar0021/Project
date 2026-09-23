/**
 * cache.ts: an LRU cache of LanguageTool results keyed by block-text hash.
 * Identical paragraphs reuse results and unchanged blocks are never re-sent, so
 * this is the main reason editing one paragraph in a long document costs one
 * request. Capacity is bounded so a very long document cannot grow it without
 * limit. Insertion order in a Map is the LRU order: reading refreshes an entry,
 * and eviction drops the oldest key.
 */
import type { RawMatch } from "@/types/languagetool";

const DEFAULT_CAPACITY = 2000;

export class MatchCache {
  private readonly store = new Map<string, RawMatch[]>();

  constructor(private readonly capacity: number = DEFAULT_CAPACITY) {}

  has(hash: string): boolean {
    return this.store.has(hash);
  }

  /** Get results and mark the entry as most recently used. */
  get(hash: string): RawMatch[] | undefined {
    const value = this.store.get(hash);
    if (value === undefined) return undefined;
    // Refresh recency: delete and re-insert so it moves to the newest slot.
    this.store.delete(hash);
    this.store.set(hash, value);
    return value;
  }

  /** Store results, evicting the oldest entry when over capacity. */
  set(hash: string, matches: RawMatch[]): void {
    if (this.store.has(hash)) this.store.delete(hash);
    this.store.set(hash, matches);
    if (this.store.size > this.capacity) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
  }

  get size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}
