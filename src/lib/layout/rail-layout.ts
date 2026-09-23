/**
 * rail-layout.ts: the pure note-stacking algorithm for the margin rail
 * (DESIGN 8.3). Each note wants to sit level with the line its mark is on, but
 * notes must not overlap, so they slide to make room. With no active note they
 * stack downward from their anchors; with an active note it pins to its exact
 * anchor and the notes above it slide up while those below stack down. Pure and
 * deterministic so it is fully unit tested and cheap to run every frame.
 */

/** Minimum vertical gap between adjacent notes, in pixels. */
export const RAIL_GAP = 8;

export interface RailNoteInput {
  id: string;
  /** Top of the note's anchor line, in rail coordinates. */
  anchorTop: number;
  height: number;
}

export interface RailNotePlacement {
  id: string;
  top: number;
}

/** Sort by anchor, breaking ties by id so equal inputs give equal output. */
function sortNotes(notes: RailNoteInput[]): RailNoteInput[] {
  return [...notes].sort((a, b) => {
    if (a.anchorTop !== b.anchorTop) return a.anchorTop - b.anchorTop;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

export function layoutRail(
  notes: RailNoteInput[],
  activeId?: string | null,
): RailNotePlacement[] {
  const sorted = sortNotes(notes);
  const count = sorted.length;
  if (count === 0) return [];

  const tops = new Array<number>(count);
  const activeIndex = activeId
    ? sorted.findIndex((note) => note.id === activeId)
    : -1;

  if (activeIndex === -1) {
    // No active note: stack downward, each at its anchor or just below the last.
    for (let i = 0; i < count; i++) {
      const note = sorted[i];
      if (!note) continue;
      if (i === 0) {
        tops[i] = note.anchorTop;
      } else {
        const prevBottom =
          (tops[i - 1] ?? 0) + (sorted[i - 1]?.height ?? 0) + RAIL_GAP;
        tops[i] = Math.max(note.anchorTop, prevBottom);
      }
    }
  } else {
    // Active note pinned to its anchor.
    tops[activeIndex] = sorted[activeIndex]?.anchorTop ?? 0;

    // Below the active note: stack downward.
    for (let i = activeIndex + 1; i < count; i++) {
      const note = sorted[i];
      if (!note) continue;
      const prevBottom =
        (tops[i - 1] ?? 0) + (sorted[i - 1]?.height ?? 0) + RAIL_GAP;
      tops[i] = Math.max(note.anchorTop, prevBottom);
    }

    // Above the active note: slide upward so each clears the one below it.
    for (let i = activeIndex - 1; i >= 0; i--) {
      const note = sorted[i];
      if (!note) continue;
      const nextTop = tops[i + 1] ?? 0;
      tops[i] = Math.min(note.anchorTop, nextTop - RAIL_GAP - note.height);
    }
  }

  return sorted.map((note, i) => ({ id: note.id, top: tops[i] ?? 0 }));
}
