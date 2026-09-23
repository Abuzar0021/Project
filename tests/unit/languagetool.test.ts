/**
 * Unit tests for the browser LanguageTool client: it returns matches on success,
 * throws a retriable CheckerError on 5xx and network failure, a non-retriable one
 * on 4xx, and rethrows an abort.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { fetchMatches, CheckerError } from "@/lib/checking/languagetool";

afterEach(() => vi.unstubAllGlobals());

function signal(): AbortSignal {
  return new AbortController().signal;
}

describe("fetchMatches", () => {
  it("returns matches on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            ok: true,
            json: async () => ({ matches: [{ offset: 0, length: 1 }] }),
          }) as unknown as Response,
      ),
    );
    const matches = await fetchMatches("hi", "en-US", signal());
    expect(matches).toHaveLength(1);
  });

  it("throws a retriable error on 503", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 503 }) as unknown as Response),
    );
    await expect(fetchMatches("hi", "en-US", signal())).rejects.toMatchObject({
      retriable: true,
    });
  });

  it("throws a non-retriable error on 400", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 400 }) as unknown as Response),
    );
    await expect(fetchMatches("hi", "en-US", signal())).rejects.toMatchObject({
      retriable: false,
    });
  });

  it("treats a network failure as retriable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("network down");
      }),
    );
    const error = await fetchMatches("hi", "en-US", signal()).catch((e) => e);
    expect(error).toBeInstanceOf(CheckerError);
    expect((error as CheckerError).retriable).toBe(true);
  });

  it("rethrows an abort", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("aborted", "AbortError");
      }),
    );
    await expect(fetchMatches("hi", "en-US", signal())).rejects.toThrow(
      /aborted/,
    );
  });
});
