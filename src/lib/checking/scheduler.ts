/**
 * scheduler.ts: the race-safe heart of the checking pipeline.
 * It debounces bursts of edits, sends only blocks whose result is not already
 * cached, limits concurrency, aborts a block's in-flight request when that block
 * changes again, prioritizes blocks the caller lists first (the viewport), and
 * backs off when the checker is unreachable. Every delivered result passes the
 * staleness guard, so a response that arrives after the text moved on is dropped
 * rather than shown against the wrong words.
 *
 * The scheduler owns no DOM or React state; it talks to the outside through the
 * callbacks in SchedulerOptions, which keeps it unit testable.
 */
import type { RawMatch } from "@/types/languagetool";
import type { CheckStatus } from "@/store/editor-ui";
import type { MatchCache } from "./cache";
import { CheckerError } from "./languagetool";

export interface BlockInput {
  blockId: string;
  text: string;
  hash: string;
}

export interface SchedulerOptions {
  check: (
    text: string,
    language: string,
    signal: AbortSignal,
  ) => Promise<RawMatch[]>;
  cache: MatchCache;
  /** Called with fresh (non-stale) results for a block. */
  onResult: (blockId: string, hash: string, matches: RawMatch[]) => void;
  onStatus: (status: CheckStatus) => void;
  /** True when the block's current hash no longer matches the requested one. */
  isStale: (blockId: string, hash: string) => boolean;
  language?: string;
  debounceMs?: number;
  concurrency?: number;
  /** Backoff delays in ms; the last value is reused (capped) after it runs out. */
  backoffMs?: number[];
}

const DEFAULTS = {
  language: "en-US",
  debounceMs: 400,
  concurrency: 4,
  backoffMs: [10_000, 20_000, 40_000, 60_000],
};

interface InFlight {
  hash: string;
  controller: AbortController;
}

export class CheckScheduler {
  private readonly opts: Required<SchedulerOptions>;
  private desired: BlockInput[] = [];
  private readonly inFlight = new Map<string, InFlight>();
  private readonly delivered = new Map<string, string>();
  private activeCount = 0;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private backoffTimer: ReturnType<typeof setTimeout> | null = null;
  private backoffIndex = 0;
  private inBackoff = false;
  private disposed = false;

  constructor(options: SchedulerOptions) {
    this.opts = { ...DEFAULTS, ...options };
  }

  /** Queue the latest set of blocks, in priority (viewport-first) order. */
  schedule(blocks: BlockInput[]): void {
    if (this.disposed) return;
    this.desired = blocks;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.pump();
    }, this.opts.debounceMs);
  }

  dispose(): void {
    this.disposed = true;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.backoffTimer) clearTimeout(this.backoffTimer);
    for (const { controller } of this.inFlight.values()) controller.abort();
    this.inFlight.clear();
  }

  /** Start as much work as concurrency allows, delivering cached hits. */
  private pump(): void {
    if (this.disposed || this.inBackoff) {
      this.updateStatus();
      return;
    }

    for (const block of this.desired) {
      if (this.activeCount >= this.opts.concurrency) break;

      const cached = this.opts.cache.get(block.hash);
      if (cached !== undefined) {
        this.deliver(block.blockId, block.hash, cached);
        continue;
      }

      const flight = this.inFlight.get(block.blockId);
      if (flight && flight.hash === block.hash) continue; // already checking this
      this.startRequest(block);
    }

    this.updateStatus();
  }

  private startRequest(block: BlockInput): void {
    // Supersede an older request for the same block with a different hash.
    const existing = this.inFlight.get(block.blockId);
    if (existing) existing.controller.abort();

    const controller = new AbortController();
    this.inFlight.set(block.blockId, { hash: block.hash, controller });
    this.activeCount += 1;

    this.opts
      .check(block.text, this.opts.language, controller.signal)
      .then((matches) => {
        this.opts.cache.set(block.hash, matches);
        this.resetBackoff();
        this.deliver(block.blockId, block.hash, matches);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        if (error instanceof CheckerError && error.retriable) {
          this.enterBackoff();
        }
        // Non-retriable errors (bad input) are dropped; the block simply has no
        // suggestions until its text changes and it is scheduled again.
      })
      .finally(() => {
        this.activeCount -= 1;
        const current = this.inFlight.get(block.blockId);
        if (current && current.controller === controller) {
          this.inFlight.delete(block.blockId);
        }
        if (!this.disposed) this.pump();
      });
  }

  private deliver(blockId: string, hash: string, matches: RawMatch[]): void {
    if (this.delivered.get(blockId) === hash) return; // already delivered
    if (this.opts.isStale(blockId, hash)) return; // text moved on: drop it
    this.delivered.set(blockId, hash);
    this.opts.onResult(blockId, hash, matches);
  }

  private hasOutstandingWork(): boolean {
    return this.desired.some((block) => {
      if (this.opts.cache.has(block.hash)) return false;
      const flight = this.inFlight.get(block.blockId);
      return !(flight && flight.hash === block.hash);
    });
  }

  private updateStatus(): void {
    if (this.inBackoff) {
      this.opts.onStatus("unreachable");
    } else if (this.activeCount > 0 || this.hasOutstandingWork()) {
      this.opts.onStatus("checking");
    } else {
      this.opts.onStatus("idle");
    }
  }

  private enterBackoff(): void {
    if (this.inBackoff) return;
    this.inBackoff = true;
    const delays = this.opts.backoffMs;
    const delay =
      delays[Math.min(this.backoffIndex, delays.length - 1)] ?? 60_000;
    this.backoffIndex += 1;
    this.updateStatus();
    this.backoffTimer = setTimeout(() => {
      this.backoffTimer = null;
      this.inBackoff = false;
      if (!this.disposed) this.pump();
    }, delay);
  }

  private resetBackoff(): void {
    this.backoffIndex = 0;
    if (this.inBackoff) {
      this.inBackoff = false;
      if (this.backoffTimer) clearTimeout(this.backoffTimer);
      this.backoffTimer = null;
    }
  }
}
