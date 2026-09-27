/** LRU cache of checker results keyed by block text hash. Map order is recency order. */
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
