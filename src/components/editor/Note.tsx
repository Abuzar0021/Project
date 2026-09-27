"use client";

/**
 * One margin note: category, label and fix line; when active, also the reason
 * and the Accept and Stet buttons.
 */

import type { Suggestion } from "@/types/suggestion";
import { noteElementId } from "@/lib/editor/suggestions-plugin";
import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import { Swatch } from "./Swatch";
import styles from "./Notes.module.css";

interface NoteProps {
  suggestion: Suggestion;
  top: number | undefined;
  active: boolean;
  gone: boolean;
  measure: (id: string, el: HTMLElement | null) => void;
  onSelect: (id: string) => void;
  onAccept: (id: string) => void;
  onStet: (id: string) => void;
}

export function Note({
  suggestion: s,
  top,
  active,
  gone,
  measure,
  onSelect,
  onAccept,
  onStet,
}: NoteProps) {
  const replacement = s.replacements[0];
  const canAccept = replacement !== undefined;
  const after = s.fix ?? replacement;
  const classes = [
    styles.note,
    styles[s.category],
    active && styles.on,
    gone && styles.done,
  ].filter(Boolean);

  return (
    <div
      ref={(el) => measure(s.id, el)}
      id={noteElementId(s.id)}
      role="listitem"
      className={classes.join(" ")}
      style={top === undefined ? undefined : { top }}
    >
      <button
        type="button"
        className={styles.summary}
        onClick={() => onSelect(s.id)}
        aria-expanded={active}
      >
        <span className={styles.head}>
          <Swatch category={s.category} />
          {s.label}
        </span>
        <span className={styles.fix}>
          {canAccept ? (
            <>
              <s>{s.original}</s>
              {after ? <> &nbsp;{after}</> : null}
            </>
          ) : (
            <span className={styles.plain}>{s.fix ?? s.original}</span>
          )}
        </span>
      </button>
      {active ? (
        <div className={styles.more}>
          <p className={styles.why}>{s.reason}</p>
          <div className={styles.actions}>
            {canAccept ? (
              <Button variant="app-primary" onClick={() => onAccept(s.id)}>
                Accept<Kbd variant="inline">&crarr;</Kbd>
              </Button>
            ) : null}
            <Button variant="app-outline" onClick={() => onStet(s.id)}>
              Stet<Kbd variant="inline">S</Kbd>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
