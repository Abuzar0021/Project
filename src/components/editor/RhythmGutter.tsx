"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { extractBlocks } from "@/lib/checking/extract";
import { splitSentences } from "@/lib/text/sentences";
import { barLabel, barWidth, LONG_RHYTHM_WORDS } from "@/lib/rhythm";
import { setHighlight } from "@/lib/editor/highlight-plugin";
import { Tooltip } from "@/components/ui/Tooltip";
import styles from "./Editor.module.css";

interface Bar {
  key: string;
  top: number;
  width: number;
  words: number;
  from: number;
  to: number;
}

const RECOMPUTE_MS = 150;
const INSET = 12;

export function RhythmGutter({
  editor,
  visible,
}: {
  editor: Editor | null;
  visible: boolean;
}) {
  const gutterRef = useRef<HTMLDivElement>(null);
  const [bars, setBars] = useState<Bar[]>([]);
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(
    null,
  );

  const compute = useCallback(() => {
    const gutter = gutterRef.current;
    if (!editor || editor.isDestroyed || !gutter) return;
    const top = gutter.getBoundingClientRect().top;
    const room = Math.max(8, gutter.clientWidth - INSET);
    const next: Bar[] = [];

    for (const block of extractBlocks(editor.state.doc)) {
      for (const sentence of splitSentences(block.text)) {
        const from = block.posMap[sentence.start];
        const last = block.posMap[sentence.end - 1];
        if (from === undefined || last === undefined) continue;
        try {
          const line = editor.view.coordsAtPos(from);
          next.push({
            key: `${block.blockId}-${sentence.start}`,
            top: (line.top + line.bottom) / 2 - top - 2,
            width: barWidth(sentence.words, room),
            words: sentence.words,
            from,
            to: last + 1,
          });
        } catch {
          // Position not rendered yet; the next pass picks it up.
        }
      }
    }
    setBars(next);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    let timer = 0;
    const soon = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(compute, RECOMPUTE_MS);
    };
    compute();
    editor.on("update", soon);
    const resize = new ResizeObserver(soon);
    resize.observe(editor.view.dom);
    void document.fonts?.ready.then(compute);
    return () => {
      window.clearTimeout(timer);
      editor.off("update", soon);
      resize.disconnect();
    };
  }, [editor, compute]);

  const leave = () => {
    setTip(null);
    if (editor) setHighlight(editor, "rhythm", null);
  };

  return (
    <div
      className={`${styles.gutter} ${visible ? "" : styles.gutterHidden}`}
      ref={gutterRef}
      aria-hidden="true"
    >
      {bars.map((bar) => (
        <div
          key={bar.key}
          className={`${styles.bar} ${bar.words > LONG_RHYTHM_WORDS ? styles.barLong : ""}`}
          style={{ top: bar.top, width: bar.width }}
          onMouseEnter={(event) => {
            if (!visible || !editor) return;
            setTip({
              text: barLabel(bar.words),
              x: event.clientX,
              y: event.clientY,
            });
            setHighlight(editor, "rhythm", {
              from: bar.from,
              to: bar.to,
              className: "sentence-hot",
            });
          }}
          onMouseMove={(event) =>
            setTip((t) =>
              t ? { ...t, x: event.clientX, y: event.clientY } : t,
            )
          }
          onMouseLeave={leave}
        />
      ))}
      {tip ? <Tooltip {...tip} /> : null}
    </div>
  );
}
