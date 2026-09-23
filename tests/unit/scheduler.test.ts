/**
 * Unit tests for CheckScheduler: it debounces, sends one request per changed
 * block (cache hits cost nothing), aborts a superseded request for the same
 * block, drops stale results, and backs off when the checker is unreachable.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CheckScheduler, type BlockInput } from "@/lib/checking/scheduler";
import { MatchCache } from "@/lib/checking/cache";
import { CheckerError } from "@/lib/checking/languagetool";
import type { RawMatch } from "@/types/languagetool";

function block(id: string, hash: string): BlockInput {
  return { blockId: id, text: `text-${id}-${hash}`, hash };
}

function noop() {
  /* intentionally empty */
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CheckScheduler", () => {
  it("debounces and sends one request per block", async () => {
    const check = vi.fn(async () => [] as RawMatch[]);
    const scheduler = new CheckScheduler({
      check,
      cache: new MatchCache(),
      onResult: noop,
      onStatus: noop,
      isStale: () => false,
    });

    scheduler.schedule([block("1", "h1"), block("2", "h2")]);
    scheduler.schedule([block("1", "h1"), block("2", "h2")]); // resets debounce
    await vi.advanceTimersByTimeAsync(399);
    expect(check).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(check).toHaveBeenCalledTimes(2);
    scheduler.dispose();
  });

  it("sends exactly one request when a single block changes", async () => {
    const check = vi.fn(async () => [] as RawMatch[]);
    const scheduler = new CheckScheduler({
      check,
      cache: new MatchCache(),
      onResult: noop,
      onStatus: noop,
      isStale: () => false,
    });

    scheduler.schedule([block("1", "h1"), block("2", "h2"), block("3", "h3")]);
    await vi.advanceTimersByTimeAsync(400);
    expect(check).toHaveBeenCalledTimes(3);

    // Only block 3 changes; blocks 1 and 2 are cache hits now.
    scheduler.schedule([block("1", "h1"), block("2", "h2"), block("3", "h3b")]);
    await vi.advanceTimersByTimeAsync(400);
    expect(check).toHaveBeenCalledTimes(4);
    scheduler.dispose();
  });

  it("aborts a superseded request for the same block", async () => {
    const signals: AbortSignal[] = [];
    const check = vi.fn(
      (_t: string, _l: string, signal: AbortSignal) =>
        new Promise<RawMatch[]>(() => {
          signals.push(signal);
        }),
    );
    const scheduler = new CheckScheduler({
      check,
      cache: new MatchCache(),
      onResult: noop,
      onStatus: noop,
      isStale: () => false,
    });

    scheduler.schedule([block("A", "h1")]);
    await vi.advanceTimersByTimeAsync(400);
    expect(check).toHaveBeenCalledTimes(1);

    scheduler.schedule([block("A", "h2")]);
    await vi.advanceTimersByTimeAsync(400);
    expect(check).toHaveBeenCalledTimes(2);
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
    scheduler.dispose();
  });

  it("drops stale results", async () => {
    const aMatch: RawMatch = {
      offset: 0,
      length: 1,
      message: "x",
      replacements: [],
      rule: { id: "R", category: { id: "TYPOS" } },
    };
    const check = vi.fn(async () => [aMatch]);
    const onResult = vi.fn();
    const scheduler = new CheckScheduler({
      check,
      cache: new MatchCache(),
      onResult,
      onStatus: noop,
      isStale: () => true, // the block has moved on
    });

    scheduler.schedule([block("A", "h1")]);
    await vi.advanceTimersByTimeAsync(400);
    expect(check).toHaveBeenCalledTimes(1);
    expect(onResult).not.toHaveBeenCalled();
    scheduler.dispose();
  });

  it("backs off and retries when the checker is unreachable", async () => {
    const check = vi
      .fn<(t: string, l: string, s: AbortSignal) => Promise<RawMatch[]>>()
      .mockRejectedValueOnce(new CheckerError("down", true))
      .mockResolvedValue([]);
    const statuses: string[] = [];
    const scheduler = new CheckScheduler({
      check,
      cache: new MatchCache(),
      onResult: noop,
      onStatus: (s) => statuses.push(s),
      isStale: () => false,
    });

    scheduler.schedule([block("A", "h1")]);
    await vi.advanceTimersByTimeAsync(400);
    expect(check).toHaveBeenCalledTimes(1);
    expect(statuses).toContain("unreachable");

    // First backoff step is 10s; after it the block is retried.
    await vi.advanceTimersByTimeAsync(10_000);
    expect(check).toHaveBeenCalledTimes(2);
    scheduler.dispose();
  });
});
