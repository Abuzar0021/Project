/**
 * use-mark-hover.ts: keep the hovered suggestion in sync between the text and the
 * rail. Hovering a mark sets it hovered (so its rail note highlights and the
 * leader line draws); when any note is hovered, its mark gets a highlight class.
 * The mark highlight is toggled directly on the DOM to avoid rebuilding the
 * decoration set on every hover.
 */
"use client";

import { useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorUI } from "@/store/editor-ui";

export function useMarkHover(editor: Editor | null): void {
  const hoveredId = useEditorUI((s) => s.hoveredSuggestionId);
  const setHovered = useEditorUI((s) => s.setHoveredSuggestion);

  // Text -> state: hovering a mark marks it hovered.
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const onOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const id = target
        ?.closest("[data-suggestion-id]")
        ?.getAttribute("data-suggestion-id");
      if (id) setHovered(id);
    };
    const onOut = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-suggestion-id]")) setHovered(null);
    };
    dom.addEventListener("mouseover", onOver);
    dom.addEventListener("mouseout", onOut);
    return () => {
      dom.removeEventListener("mouseover", onOver);
      dom.removeEventListener("mouseout", onOut);
    };
  }, [editor, setHovered]);

  // State -> text: highlight the hovered suggestion's mark elements.
  useEffect(() => {
    if (!editor || !hoveredId) return;
    const els = editor.view.dom.querySelectorAll(
      `[data-suggestion-id="${CSS.escape(hoveredId)}"]`,
    );
    els.forEach((el) => el.classList.add("margin-mark--hovered"));
    return () => {
      els.forEach((el) => el.classList.remove("margin-mark--hovered"));
    };
  }, [editor, hoveredId]);
}
