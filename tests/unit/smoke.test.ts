/**
 * Trivial smoke test that proves the Vitest toolchain runs.
 * Real unit tests for the checking pipeline and layout arrive in later phases.
 */
import { describe, it, expect } from "vitest";

describe("toolchain", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });
});
