/** Places margin notes beside their lines without overlapping. */

export interface NoteBox {
  id: string;
  /** Top of the underlined text, relative to the notes column. */
  anchorTop: number;
  height: number;
}

export const NOTE_GAP = 8;
const LIFT = 8;

/**
 * Line each note up with its mark, then push it down just enough to clear the
 * note above. Input must already be in document order.
 */
export function layoutNotes(notes: NoteBox[]): { id: string; top: number }[] {
  let floor = -Infinity;
  return notes.map((note) => {
    const top = Math.max(note.anchorTop - LIFT, floor);
    floor = top + note.height + NOTE_GAP;
    return { id: note.id, top };
  });
}
