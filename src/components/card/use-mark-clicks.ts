/**
 * use-mark-clicks.ts: open the suggestion card when a mark is clicked.
 * Listens on the editor DOM for a click that lands on an element carrying a
 * data-suggestion-id and sets that suggestion active. The card component handles
 * positioning and closing.
 */
"use client";

import { useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorUI } from "@/store/editor-ui";

export function useMarkClicks(editor: Editor | null): void {
  const setActive = useEditorUI((s) => s.setActiveSuggestion);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const mark = target?.closest("[data-suggestion-id]");
      const id = mark?.getAttribute("data-suggestion-id");
      if (id) setActive(id);
    };
    dom.addEventListener("click", onClick);
    return () => dom.removeEventListener("click", onClick);
  }, [editor, setActive]);
}
