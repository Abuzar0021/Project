/**
 * IssueMinimap: an 8px strip on the left edge that maps the whole document
 * (DESIGN 8.4). Each issue is a short tick at its relative position in its
 * category color, a translucent window shows the visible region, and click or
 * drag scrolls the document there. Hovering shows the count of issues near that
 * point. Hidden below 768px. Tick positions come from document positions, so no
 * separate DOM measurement is needed.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Editor } from "@tiptap/react";
import { useSuggestions } from "@/store/suggestions";
import { usePrefs } from "@/store/prefs";
import { visibleSuggestions } from "@/lib/suggestions/visibility";
import { CATEGORY_COLOR_VAR } from "@/lib/suggestions/category-colors";
import styles from "./IssueMinimap.module.css";

interface IssueMinimapProps {
  editor: Editor | null;
  scrollRef: RefObject<HTMLDivElement | null>;
}

export function IssueMinimap({ editor, scrollRef }: IssueMinimapProps) {
  const byId = useSuggestions((s) => s.byId);
  const ignoredRules = usePrefs((s) => s.ignoredRules);
  const dictionary = usePrefs((s) => s.dictionary);
  const dismissed = usePrefs((s) => s.dismissed);

  const stripRef = useRef<HTMLDivElement>(null);
  const [windowRect, setWindowRect] = useState({ top: 0, height: 1 });
  const [tooltip, setTooltip] = useState<{ y: number; count: number } | null>(
    null,
  );

  const docSize = editor ? Math.max(1, editor.state.doc.content.size) : 1;
  const ticks = visibleSuggestions(Object.values(byId), {
    ignoredRules,
    dictionary,
    dismissed,
  }).map((s) => ({
    id: s.id,
    frac: Math.min(1, Math.max(0, s.from / docSize)),
    color: CATEGORY_COLOR_VAR[s.category],
  }));

  const updateWindow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const total = el.scrollHeight || 1;
    setWindowRect({
      top: el.scrollTop / total,
      height: Math.min(1, el.clientHeight / total),
    });
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateWindow();
    el.addEventListener("scroll", updateWindow, { passive: true });
    window.addEventListener("resize", updateWindow);
    return () => {
      el.removeEventListener("scroll", updateWindow);
      window.removeEventListener("resize", updateWindow);
    };
  }, [scrollRef, updateWindow]);

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => updateWindow();
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
    };
  }, [editor, updateWindow]);

  const scrollToFraction = useCallback(
    (frac: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const target = frac * el.scrollHeight - el.clientHeight / 2;
      el.scrollTop = Math.max(0, Math.min(target, el.scrollHeight));
    },
    [scrollRef],
  );

  const fractionFromEvent = (clientY: number): number => {
    const strip = stripRef.current;
    if (!strip) return 0;
    const rect = strip.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
  };

  const onPointerDown = (event: React.PointerEvent) => {
    event.preventDefault();
    scrollToFraction(fractionFromEvent(event.clientY));
    const onMove = (e: PointerEvent) =>
      scrollToFraction(fractionFromEvent(e.clientY));
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  const onMouseMove = (event: React.MouseEvent) => {
    const strip = stripRef.current;
    if (!strip) return;
    const rect = strip.getBoundingClientRect();
    const frac = fractionFromEvent(event.clientY);
    const count = ticks.filter((t) => Math.abs(t.frac - frac) < 0.03).length;
    setTooltip({ y: event.clientY - rect.top, count });
  };

  return (
    <div
      ref={stripRef}
      className={styles.strip}
      data-testid="issue-minimap"
      onPointerDown={onPointerDown}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setTooltip(null)}
      role="presentation"
    >
      <div
        className={styles.window}
        style={{
          top: `${windowRect.top * 100}%`,
          height: `${windowRect.height * 100}%`,
        }}
      />
      {ticks.map((tick) => (
        <div
          key={tick.id}
          className={styles.tick}
          style={{ top: `${tick.frac * 100}%`, background: tick.color }}
        />
      ))}
      {tooltip ? (
        <div className={styles.tooltip} style={{ top: tooltip.y }}>
          {tooltip.count} {tooltip.count === 1 ? "issue" : "issues"}
        </div>
      ) : null}
    </div>
  );
}
