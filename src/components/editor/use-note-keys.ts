"use client";

/** Keyboard shortcuts for moving through and resolving notes. */

import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { openNotes, useNotesStore } from "./notes-store";

interface KeyActions {
  step: (direction: 1 | -1) => { id: string } | null;
  accept: (id: string) => void;
  stet: (id: string) => void;
  toggleRhythm?: () => void;
}

/**
 * Single-letter shortcuts work when focus is outside the text; inside the text
 * the same keys need Alt. Letters are read from event.code because Alt changes
 * the character a key produces on a Mac.
 */
export function useNoteKeys(
  editor: Editor | null,
  enabled: boolean,
  actions: KeyActions,
): void {
  const store = useNotesStore();
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    if (!enabled || !editor) return;

    const reveal = (id: string) => {
      const mark = Array.from(
        editor.view.dom.querySelectorAll<HTMLElement>("[data-suggestion-id]"),
      ).find((el) => el.dataset.suggestionId === id);
      mark?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };

    const target = () => {
      const state = store.getState();
      const open = openNotes(state);
      return open.find((s) => s.id === state.activeId) ?? open[0];
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;
      const el = event.target as HTMLElement;
      if (el.closest("[role='dialog'], [cmdk-root]")) return;
      const inText =
        el.closest("input, textarea, select, [contenteditable='true']") !==
        null;
      if (inText && !event.altKey) return;
      if (!inText && el.closest("button, a") && event.key === "Enter") return;

      const letter = event.code.startsWith("Key")
        ? event.code.slice(3).toLowerCase()
        : "";
      const { step, accept, stet, toggleRhythm } = actionsRef.current;
      let handled = true;

      if (letter === "j" || (!inText && event.key === "ArrowDown")) {
        const next = step(1);
        if (next) reveal(next.id);
      } else if (letter === "k" || (!inText && event.key === "ArrowUp")) {
        const prev = step(-1);
        if (prev) reveal(prev.id);
      } else if (event.key === "Enter") {
        const note = target();
        if (note) accept(note.id);
      } else if (letter === "s") {
        const note = target();
        if (note) stet(note.id);
      } else if (letter === "r" && toggleRhythm) {
        toggleRhythm();
      } else if (event.key === "Escape" && !inText) {
        editor.commands.focus();
      } else {
        handled = false;
      }

      if (handled) event.preventDefault();
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editor, enabled, store]);
}
