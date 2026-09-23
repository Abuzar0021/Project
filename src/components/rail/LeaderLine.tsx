/**
 * LeaderLine: a 1px line from a hovered note to its mark, in the category color.
 * Drawn in a fixed full-viewport SVG (pointer-events none) using viewport
 * coordinates from the mark position and the note element, so it spans the gap
 * between the sheet and the rail without layout gymnastics. It tracks scroll and
 * resize while shown.
 */
"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import type { Suggestion } from "@/types/suggestion";
import { CATEGORY_COLOR_VAR } from "@/lib/suggestions/category-colors";

interface LeaderLineProps {
  editor: Editor | null;
  suggestion: Suggestion | null;
  noteEl: HTMLElement | null;
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function LeaderLine({ editor, suggestion, noteEl }: LeaderLineProps) {
  const [line, setLine] = useState<Line | null>(null);

  useEffect(() => {
    if (!editor || !suggestion || !noteEl) {
      setLine(null);
      return;
    }
    let frame = 0;
    const compute = () => {
      frame = 0;
      try {
        const mark = editor.view.coordsAtPos(suggestion.from);
        const note = noteEl.getBoundingClientRect();
        setLine({
          x1: mark.right,
          y1: (mark.top + mark.bottom) / 2,
          x2: note.left,
          y2: note.top + 16,
        });
      } catch {
        setLine(null);
      }
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [editor, suggestion, noteEl]);

  if (!line || !suggestion) return null;

  return (
    <svg
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 40,
      }}
      aria-hidden="true"
    >
      <path
        d={`M ${line.x1} ${line.y1} L ${line.x2} ${line.y2}`}
        stroke={CATEGORY_COLOR_VAR[suggestion.category]}
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}
