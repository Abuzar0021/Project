/**
 * use-keyboard-shortcuts.ts: global jump-to-suggestion shortcuts (DESIGN 10).
 * Ctrl/Cmd+J opens the next suggestion's card, Ctrl/Cmd+Shift+J the previous
 * one, respecting the active category filter and preferences, and wrapping at the
 * ends. Store state is read at key time via getState so the handler never goes
 * stale. The card's own keys (Enter, 1/2/3, D, Esc) live in the card.
 */
"use client";

import { useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { useSuggestions } from "@/store/suggestions";
import { useEditorUI } from "@/store/editor-ui";
import { usePrefs } from "@/store/prefs";
import { visibleSuggestions } from "@/lib/suggestions/visibility";
import type { Suggestion } from "@/types/suggestion";

export function useKeyboardShortcuts(editor: Editor | null): void {
  useEffect(() => {
    if (!editor) return;

    const onKey = (event: KeyboardEvent) => {
      const isJump =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j";
      if (!isJump) return;
      event.preventDefault();

      const { byId } = useSuggestions.getState();
      const { filter, activeSuggestionId, setActiveSuggestion } =
        useEditorUI.getState();
      const { ignoredRules, dictionary, dismissed } = usePrefs.getState();

      const list: Suggestion[] = visibleSuggestions(Object.values(byId), {
        ignoredRules,
        dictionary,
        dismissed,
      })
        .filter((s) => filter === "all" || s.category === filter)
        .sort((a, b) => a.from - b.from || (a.id < b.id ? -1 : 1));
      if (list.length === 0) return;

      const active = activeSuggestionId
        ? list.find((s) => s.id === activeSuggestionId)
        : undefined;
      const reference = active ? active.from : editor.state.selection.from;

      let target: Suggestion | undefined;
      if (event.shiftKey) {
        target =
          [...list].reverse().find((s) => s.from < reference) ??
          list[list.length - 1];
      } else {
        target = list.find((s) => s.from > reference) ?? list[0];
      }
      if (!target) return;

      setActiveSuggestion(target.id, "mark");
      editor.chain().setTextSelection(target.from).run();
      const markEl = editor.view.dom.querySelector(
        `[data-suggestion-id="${target.id}"]`,
      );
      markEl?.scrollIntoView({ block: "center" });
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor]);
}
