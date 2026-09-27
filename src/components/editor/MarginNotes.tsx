"use client";

/**
 * The margin notes column. Each note sits level with its underline and is
 * pushed down only as far as needed to clear the note above.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Editor } from "@tiptap/react";
import { layoutNotes } from "@/lib/notes-layout";
import { useNotes, useNotesStore } from "./notes-store";
import { Note } from "./Note";
import { StetMemo } from "./StetMemo";
import styles from "./Notes.module.css";

interface MarginNotesProps {
  editor: Editor | null;
  onAccept: (id: string) => void;
  onStet: (id: string) => void;
}

export function MarginNotes({ editor, onAccept, onStet }: MarginNotesProps) {
  const store = useNotesStore();
  const byId = useNotes((s) => s.byId);
  const goneIds = useNotes((s) => s.goneIds);
  const activeId = useNotes((s) => s.activeId);
  const memos = useNotes((s) => s.memos);

  const columnRef = useRef<HTMLDivElement>(null);
  const heights = useRef(new Map<string, HTMLElement>());
  const [tops, setTops] = useState<Map<string, number>>(new Map());

  const notes = useMemo(
    () => Object.values(byId).sort((a, b) => a.from - b.from),
    [byId],
  );
  const gone = useMemo(() => new Set(goneIds), [goneIds]);
  const openCount = notes.filter((s) => !gone.has(s.id)).length;
  const active = activeId ? byId[activeId] : undefined;

  const measure = useCallback((id: string, el: HTMLElement | null) => {
    if (el) heights.current.set(id, el);
    else heights.current.delete(id);
  }, []);

  const layout = useCallback(() => {
    const column = columnRef.current;
    if (!editor || editor.isDestroyed || !column) return;
    const { byId: all, goneIds: goneNow, memos: memosNow } = store.getState();
    const skip = new Set(goneNow);
    const size = editor.state.doc.content.size;
    const colTop = column.getBoundingClientRect().top;

    const items = [
      ...Object.values(all)
        .filter((s) => !skip.has(s.id))
        .map((s) => ({ id: s.id, pos: s.from })),
      ...memosNow.map((m) => ({ id: m.id, pos: m.pos })),
    ].sort((a, b) => a.pos - b.pos);

    const boxes = items.map((item) => {
      let anchorTop = 0;
      try {
        anchorTop =
          editor.view.coordsAtPos(Math.min(Math.max(item.pos, 0), size)).top -
          colTop;
      } catch {
        // The view is mid-update; the next pass will place this note.
      }
      return {
        id: item.id,
        anchorTop,
        height: heights.current.get(item.id)?.offsetHeight ?? 44,
      };
    });

    setTops(
      new Map(layoutNotes(boxes).map((placed) => [placed.id, placed.top])),
    );
  }, [editor, store]);

  useLayoutEffect(() => {
    layout();
  }, [layout, notes, memos, activeId, goneIds]);

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => requestAnimationFrame(layout);
    editor.on("update", onUpdate);
    const resize = new ResizeObserver(() => layout());
    resize.observe(editor.view.dom);
    if (columnRef.current) resize.observe(columnRef.current);
    void document.fonts?.ready.then(() => layout());
    return () => {
      editor.off("update", onUpdate);
      resize.disconnect();
    };
  }, [editor, layout]);

  const announcement = active
    ? `${active.label}. ${
        active.replacements[0] === undefined
          ? active.reason
          : `Suggest: ${active.fix ?? (active.replacements[0] || "remove it")}.`
      } Press Enter to accept, S to keep yours.`
    : "";

  return (
    <div className={styles.column} ref={columnRef}>
      <div role="list" aria-label="Margin notes" className={styles.list}>
        {notes.map((s) => (
          <Note
            key={s.id}
            suggestion={s}
            top={tops.get(s.id)}
            active={s.id === activeId}
            gone={gone.has(s.id)}
            measure={measure}
            onSelect={(id) => store.getState().setActive(id)}
            onAccept={onAccept}
            onStet={onStet}
          />
        ))}
        {memos.map((memo) => (
          <StetMemo
            key={memo.id}
            memo={memo}
            top={tops.get(memo.id)}
            measure={measure}
            onDone={(id) => store.getState().removeMemo(id)}
          />
        ))}
      </div>
      {openCount === 0 && memos.length === 0 ? (
        <p className={styles.empty}>Nothing to fix.</p>
      ) : null}
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
