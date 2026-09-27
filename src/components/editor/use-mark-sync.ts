"use client";

/** Keeps the underlines in step with the notes store. */

import { useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { REBUILD_META } from "@/lib/editor/suggestions-plugin";
import { useNotesStore } from "./notes-store";

/** Redraw the underlines whenever the notes, the active note or an accept change. */
export function useMarkSync(editor: Editor | null): void {
  const store = useNotesStore();

  useEffect(() => {
    if (!editor) return;
    const draw = () => {
      if (editor.isDestroyed) return;
      const { byId, activeId, goneIds } = store.getState();
      editor.view.dispatch(
        editor.state.tr.setMeta(REBUILD_META, {
          suggestions: Object.values(byId),
          activeId,
          goneIds,
        }),
      );
    };
    // Store updates can arrive while ProseMirror is still applying a
    // transaction, so redraw once after the current one finishes.
    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        draw();
      });
    };
    draw();
    return store.subscribe((state, prev) => {
      if (
        state.byId !== prev.byId ||
        state.activeId !== prev.activeId ||
        state.goneIds !== prev.goneIds
      ) {
        schedule();
      }
    });
  }, [editor, store]);
}
