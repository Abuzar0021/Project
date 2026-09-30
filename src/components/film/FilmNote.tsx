/**
 * A margin note as it appears in the product, built for the film. It uses the
 * editor's own note styles, plus two layers the timeline can animate both
 * ways: a surface that fades in when the note becomes active, and the reason
 * and buttons that open below it.
 */

import type { CSSProperties } from "react";
import type { Category } from "@/types/suggestion";
import { Swatch } from "@/components/editor/Swatch";
import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import notes from "@/components/editor/Notes.module.css";
import styles from "./Film.module.css";

const LINE_COLOR: Record<Category, string> = {
  spelling: "var(--spell)",
  clarity: "var(--clar)",
  voice: "var(--voice)",
};

export interface FilmNoteData {
  id: string;
  category: Category;
  label: string;
  from: string;
  to: string;
  reason: string;
}

export function FilmNote({ note }: { note: FilmNoteData }) {
  const style = { "--c": LINE_COLOR[note.category] } as CSSProperties;
  return (
    <div className={styles.note} style={style} data-f={`note-${note.id}`}>
      <span className={styles.noteSurface} data-f={`surface-${note.id}`} />
      <div className={styles.noteBody}>
        <span className={notes.head}>
          <Swatch category={note.category} />
          {note.label}
        </span>
        <span className={notes.fix}>
          <s>{note.from}</s> &nbsp;{note.to}
        </span>
        <div className={styles.noteMore} data-f={`more-${note.id}`}>
          <p className={notes.why}>{note.reason}</p>
          <div className={notes.actions}>
            <span data-f={`accept-${note.id}`}>
              <Button variant="app-primary" tabIndex={-1}>
                Accept<Kbd variant="inline">&crarr;</Kbd>
              </Button>
            </span>
            <span data-f={`stet-${note.id}`}>
              <Button variant="app-outline" tabIndex={-1}>
                Stet<Kbd variant="inline">S</Kbd>
              </Button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
