"use client";

import { useCallback } from "react";
import type { Editor } from "@tiptap/react";
import type { Suggestion } from "@/types/suggestion";
import { flashHighlight } from "@/lib/editor/highlight-plugin";
import { normalize } from "@/lib/stet";
import { newId } from "@/lib/storage";
import { openNotes, useNotesStore } from "./notes-store";

const STRIKE_MS = 280;
const INK_MS = 1200;

export interface StetResult {
  scope: "draft" | "all";
  undo: () => void;
}

export interface ResolveHandlers {
  onAccept?: (suggestion: Suggestion) => void;
  onStet?: (suggestion: Suggestion) => StetResult | null;
}

export function useResolve(editor: Editor | null, handlers: ResolveHandlers) {
  const store = useNotesStore();

  const step = useCallback(
    (direction: 1 | -1) => {
      const state = store.getState();
      const open = openNotes(state);
      if (open.length === 0) return null;
      const index = open.findIndex((s) => s.id === state.activeId);
      const next =
        index === -1
          ? open[direction === 1 ? 0 : open.length - 1]
          : open[(index + direction + open.length) % open.length];
      state.setActive(next?.id ?? null);
      return next ?? null;
    },
    [store],
  );

  /** After a note resolves, the next open note below it becomes active. */
  const advanceFrom = useCallback(
    (from: number) => {
      const open = openNotes(store.getState());
      const next = open.find((s) => s.from > from) ?? open[0];
      store.getState().setActive(next?.id ?? null);
    },
    [store],
  );

  const accept = useCallback(
    (id: string) => {
      const start = store.getState().byId[id];
      const replacement = start?.replacements[0];
      if (!editor || !start || replacement === undefined) return;

      store.getState().markGone(id);
      window.setTimeout(() => advanceFrom(start.from), 260);

      window.setTimeout(() => {
        const current = store.getState().byId[id];
        if (editor.isDestroyed || !current) return;
        const shift = current.from - start.from;
        const target = current.rewrite
          ? {
              from: current.rewrite.from + shift,
              to: current.rewrite.to + shift,
              text: current.rewrite.text,
            }
          : { from: current.from, to: current.to, text: replacement };

        let { from, to } = target;
        const { doc } = editor.state;
        if (!target.text) {
          // Deleting a word also takes one of the spaces around it.
          if (doc.textBetween(to, Math.min(to + 1, doc.content.size)) === " ")
            to += 1;
          else if (doc.textBetween(Math.max(from - 1, 0), from) === " ")
            from -= 1;
        }

        const tr = target.text
          ? editor.state.tr.insertText(target.text, from, to)
          : editor.state.tr.delete(from, to);
        editor.view.dispatch(tr);
        if (target.text)
          flashHighlight(
            editor,
            from,
            from + target.text.length,
            "ink",
            INK_MS,
          );
        store.getState().remove([id]);
        handlers.onAccept?.(start);
      }, STRIKE_MS);
    },
    [editor, store, advanceFrom, handlers],
  );

  const stet = useCallback(
    (id: string) => {
      const target = store.getState().byId[id];
      if (!target) return;
      const result = handlers.onStet?.(target) ?? {
        scope: "all" as const,
        undo: () => undefined,
      };

      const match = normalize(target.original);
      const same = Object.values(store.getState().byId).filter(
        (s) => s.ruleId === target.ruleId && normalize(s.original) === match,
      );
      store.getState().remove(same.map((s) => s.id));

      const memoId = newId();
      store.getState().addMemo({
        id: memoId,
        text: target.original,
        scope: result.scope,
        pos: target.from,
        undo: () => {
          result.undo();
          store.getState().removeMemo(memoId);
          if (!editor || editor.isDestroyed) return;
          const { doc } = editor.state;
          for (const s of same) {
            if (
              s.to <= doc.content.size &&
              doc.textBetween(s.from, s.to) === s.original
            ) {
              store.getState().add(s);
            }
          }
          store.getState().setActive(target.id);
        },
      });
      advanceFrom(target.from);
    },
    [editor, store, advanceFrom, handlers],
  );

  return { accept, stet, step };
}
