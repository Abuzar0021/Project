"use client";

/**
 * Confirmation shown where a note was stetted. It offers Undo for six
 * seconds, then fades away.
 */

import { useEffect, useState } from "react";
import type { Memo } from "./notes-store";
import styles from "./Notes.module.css";

const VISIBLE_MS = 6000;
const FADE_MS = 300;

export function StetMemo({
  memo,
  top,
  measure,
  onDone,
}: {
  memo: Memo;
  top: number | undefined;
  measure: (id: string, el: HTMLElement | null) => void;
  onDone: (id: string) => void;
}) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fade = window.setTimeout(() => setFading(true), VISIBLE_MS);
    const done = window.setTimeout(() => onDone(memo.id), VISIBLE_MS + FADE_MS);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(done);
    };
  }, [memo.id, onDone]);

  const where =
    memo.scope === "all" ? "in any of your drafts" : "in this draft";

  return (
    <div
      ref={(el) => measure(memo.id, el)}
      role="listitem"
      className={`${styles.memo} ${fading ? styles.fading : ""}`}
      style={top === undefined ? undefined : { top }}
    >
      Kept. Margin won&rsquo;t flag <b>&ldquo;{memo.text}&rdquo;</b> again{" "}
      {where}.
      <button type="button" className={styles.undo} onClick={memo.undo}>
        Undo
      </button>
    </div>
  );
}
