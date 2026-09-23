/**
 * Unit tests for the rail layout (DESIGN 8.3): notes never overlap, they never
 * sit above their anchor when no note is active, the active note sits exactly at
 * its anchor, and equal input gives equal output.
 */
import { describe, it, expect } from "vitest";
import {
  layoutRail,
  RAIL_GAP,
  type RailNoteInput,
} from "@/lib/layout/rail-layout";

function noOverlaps(
  placements: { id: string; top: number }[],
  heights: Map<string, number>,
): boolean {
  const sorted = [...placements].sort((a, b) => a.top - b.top);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (!prev || !cur) continue;
    const prevBottom = prev.top + (heights.get(prev.id) ?? 0);
    if (cur.top < prevBottom + RAIL_GAP - 0.001) return false;
  }
  return true;
}

const SAMPLE: RailNoteInput[] = [
  { id: "a", anchorTop: 0, height: 60 },
  { id: "b", anchorTop: 40, height: 60 }, // wants to overlap a
  { id: "c", anchorTop: 400, height: 60 },
];
const HEIGHTS = new Map(SAMPLE.map((n) => [n.id, n.height]));

describe("layoutRail", () => {
  it("returns nothing for no notes", () => {
    expect(layoutRail([])).toEqual([]);
  });

  it("never overlaps and never sits above the anchor when inactive", () => {
    const placed = layoutRail(SAMPLE);
    expect(noOverlaps(placed, HEIGHTS)).toBe(true);
    for (const p of placed) {
      const input = SAMPLE.find((n) => n.id === p.id);
      if (!input) throw new Error("missing input");
      expect(p.top).toBeGreaterThanOrEqual(input.anchorTop - 0.001);
    }
  });

  it("pushes a crowded note down by the gap", () => {
    const placed = layoutRail(SAMPLE);
    const a = placed.find((p) => p.id === "a");
    const b = placed.find((p) => p.id === "b");
    if (!a || !b) throw new Error("missing placement");
    expect(a.top).toBe(0);
    expect(b.top).toBe(60 + RAIL_GAP); // a.height + gap
  });

  it("pins the active note to its anchor and keeps no overlaps", () => {
    const active = layoutRail(SAMPLE, "b");
    const b = active.find((p) => p.id === "b");
    if (!b) throw new Error("missing active placement");
    expect(b.top).toBe(40); // exactly its anchor
    expect(noOverlaps(active, HEIGHTS)).toBe(true);
  });

  it("slides notes above the active one upward", () => {
    const active = layoutRail(SAMPLE, "b");
    const a = active.find((p) => p.id === "a");
    if (!a) throw new Error("missing placement");
    // a must clear b: a.bottom <= b.top - gap => a.top <= 40 - 8 - 60
    expect(a.top).toBeLessThanOrEqual(40 - RAIL_GAP - 60 + 0.001);
  });

  it("is stable for equal input", () => {
    expect(layoutRail(SAMPLE)).toEqual(layoutRail(SAMPLE));
  });
});
